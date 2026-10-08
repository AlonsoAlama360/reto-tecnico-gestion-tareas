using System.Net;
using System.Text.Json;
using TaskManager.Api.Tests.Support;
using TaskManager.Application.Tasks;
using TaskManager.Application.Tasks.GetTasks;
using TaskManager.Domain.Tasks;

namespace TaskManager.Api.Tests;

public sealed class TasksEndpointsTests : IDisposable
{
    private const string ProblemJson = "application/problem+json";

    private readonly ApiFactory _factory = new();
    private readonly HttpClient _client;

    public TasksEndpointsTests()
    {
        _client = _factory.CreateClient();
    }

    public void Dispose()
    {
        _client.Dispose();
        _factory.Dispose();
    }

    [Fact]
    public async Task GetTasks_ReturnsThePageInTheAgreedContract()
    {
        _factory.Repository.PageToReturn = new TaskListPage(
            [new TaskSummaryDto(3, "Pagar el recibo de luz", TaskPriority.High, TaskItemStatus.InProgress, new DateTime(2026, 10, 6, 21, 21, 25, DateTimeKind.Utc))],
            TotalCount: 41);

        var response = await _client.GetAsync("/api/v1/tasks?page=2&pageSize=20");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await ReadJsonAsync(response);

        Assert.Equal(2, body.GetProperty("page").GetInt32());
        Assert.Equal(20, body.GetProperty("pageSize").GetInt32());
        Assert.Equal(41, body.GetProperty("totalCount").GetInt32());
        Assert.Equal(3, body.GetProperty("totalPages").GetInt32());
        Assert.True(body.GetProperty("hasNextPage").GetBoolean());

        var item = Assert.Single(body.GetProperty("items").EnumerateArray());
        Assert.Equal(3, item.GetProperty("id").GetInt32());
        Assert.Equal("Pagar el recibo de luz", item.GetProperty("title").GetString());
        // Los enums viajan por nombre y la fecha en UTC con sufijo "Z".
        Assert.Equal("High", item.GetProperty("priority").GetString());
        Assert.Equal("InProgress", item.GetProperty("status").GetString());
        Assert.Equal("2026-10-06T21:21:25Z", item.GetProperty("createdAt").GetString());
        // El listado no expone la descripción.
        Assert.False(item.TryGetProperty("description", out _));
    }

    [Fact]
    public async Task GetTasks_WithoutParameters_UsesNoFiltersAndDefaultPaging()
    {
        await _client.GetAsync("/api/v1/tasks");

        Assert.Equal(new GetTasksQuery(null, null, Page: 1, PageSize: 20), _factory.Repository.ReceivedQuery);
    }

    [Theory]
    [InlineData("status=InProgress&priority=High&page=2&pageSize=5")]
    [InlineData("status=inprogress&priority=HIGH&page=2&pageSize=5")]
    public async Task GetTasks_BindsFiltersAndPagingIgnoringCase(string queryString)
    {
        await _client.GetAsync($"/api/v1/tasks?{queryString}");

        Assert.Equal(
            new GetTasksQuery(TaskItemStatus.InProgress, TaskPriority.High, Page: 2, PageSize: 5),
            _factory.Repository.ReceivedQuery);
    }

    [Theory]
    [InlineData("status=foo", "status")]
    [InlineData("status=9", "status")]
    [InlineData("priority=urgent", "priority")]
    [InlineData("priority=0", "priority")]
    [InlineData("page=0", "page")]
    [InlineData("page=abc", "page")]
    [InlineData("page=100001", "page")]
    [InlineData("pageSize=0", "pageSize")]
    [InlineData("pageSize=101", "pageSize")]
    public async Task GetTasks_WithAnInvalidParameter_Returns400NamingTheField(string queryString, string field)
    {
        var response = await _client.GetAsync($"/api/v1/tasks?{queryString}");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(ProblemJson, response.Content.Headers.ContentType?.MediaType);

        var body = await ReadJsonAsync(response);
        Assert.True(body.GetProperty("errors").TryGetProperty(field, out _));

        // La petición se rechaza antes de llegar a los datos.
        Assert.Equal(0, _factory.Repository.Calls);
    }

    [Fact]
    public async Task GetTaskById_WhenTheTaskExists_ReturnsItsDetail()
    {
        _factory.Repository.TaskToReturn = new TaskItem(
            5, "Ordenar el escritorio", null, TaskPriority.Low, TaskItemStatus.Pending,
            new DateTime(2026, 10, 5, 21, 21, 25));

        var response = await _client.GetAsync("/api/v1/tasks/5");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await ReadJsonAsync(response);

        Assert.Equal(5, body.GetProperty("id").GetInt32());
        Assert.Equal("Ordenar el escritorio", body.GetProperty("title").GetString());
        // Una tarea sin descripción la devuelve como null explícito, no la omite.
        Assert.Equal(JsonValueKind.Null, body.GetProperty("description").ValueKind);
        Assert.Equal("Low", body.GetProperty("priority").GetString());
        Assert.Equal("Pending", body.GetProperty("status").GetString());
        Assert.Equal("2026-10-05T21:21:25Z", body.GetProperty("createdAt").GetString());
    }

    [Fact]
    public async Task GetTaskById_WhenTheTaskDoesNotExist_Returns404AsProblemDetails()
    {
        _factory.Repository.TaskToReturn = null;

        var response = await _client.GetAsync("/api/v1/tasks/9999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal(ProblemJson, response.Content.Headers.ContentType?.MediaType);

        var body = await ReadJsonAsync(response);
        Assert.Equal(404, body.GetProperty("status").GetInt32());
        Assert.Equal("Task not found.", body.GetProperty("title").GetString());
    }

    [Theory]
    [InlineData("abc")]
    [InlineData("1.5")]
    [InlineData("99999999999")]
    public async Task GetTaskById_WithANonIntegerId_Returns404(string id)
    {
        var response = await _client.GetAsync($"/api/v1/tasks/{id}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal(0, _factory.Repository.Calls);
    }

    [Theory]
    [InlineData("/api/v1/tasks")]
    [InlineData("/api/v1/tasks/1")]
    public async Task WhenTheDatabaseFails_Returns503WithoutLeakingDetails(string url)
    {
        _factory.Repository.ExceptionToThrow = new FakeDbException("Login failed for user 'sa' on server SQLPROD01.");

        var response = await _client.GetAsync(url);

        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
        Assert.Equal(ProblemJson, response.Content.Headers.ContentType?.MediaType);

        var raw = await response.Content.ReadAsStringAsync();
        Assert.DoesNotContain("SQLPROD01", raw);
        Assert.DoesNotContain("Login failed", raw);
    }

    [Fact]
    public async Task WhenAnUnexpectedErrorOccurs_Returns500WithoutLeakingDetails()
    {
        _factory.Repository.ExceptionToThrow = new InvalidOperationException("secret internal state");

        var response = await _client.GetAsync("/api/v1/tasks");

        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        Assert.Equal(ProblemJson, response.Content.Headers.ContentType?.MediaType);

        var raw = await response.Content.ReadAsStringAsync();
        Assert.DoesNotContain("secret internal state", raw);
        Assert.DoesNotContain(nameof(InvalidOperationException), raw);
    }

    [Fact]
    public async Task UnknownRoute_Returns404AsProblemDetails()
    {
        var response = await _client.GetAsync("/api/v1/unknown");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal(ProblemJson, response.Content.Headers.ContentType?.MediaType);
    }

    private static async Task<JsonElement> ReadJsonAsync(HttpResponseMessage response)
    {
        await using var stream = await response.Content.ReadAsStreamAsync();
        using var document = await JsonDocument.ParseAsync(stream);

        return document.RootElement.Clone();
    }

    // DbException es abstracta; basta una subclase mínima para simular un fallo del proveedor.
    private sealed class FakeDbException(string message) : System.Data.Common.DbException(message);
}
