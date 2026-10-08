using TaskManager.Application.Tasks.GetTaskById;
using TaskManager.Domain.Tasks;

namespace TaskManager.UnitTests.Application;

public sealed class GetTaskByIdQueryHandlerTests
{
    private readonly FakeTaskRepository _repository = new();
    private readonly GetTaskByIdQueryHandler _handler;

    public GetTaskByIdQueryHandlerTests()
    {
        _handler = new GetTaskByIdQueryHandler(_repository);
    }

    [Fact]
    public async Task HandleAsync_WhenTheTaskExists_ReturnsItsDetail()
    {
        var createdAt = new DateTime(2026, 10, 1, 12, 0, 0, DateTimeKind.Utc);
        _repository.TaskToReturn = new TaskItem(
            12, "Renovar el pasaporte", "Sacar cita en línea", TaskPriority.High, TaskItemStatus.Completed, createdAt);

        var result = await _handler.HandleAsync(12, CancellationToken.None);

        Assert.Equal(
            new TaskDetailDto(12, "Renovar el pasaporte", "Sacar cita en línea", TaskPriority.High, TaskItemStatus.Completed, createdAt),
            result);
        Assert.Equal(12, _repository.ReceivedId);
    }

    [Fact]
    public async Task HandleAsync_WhenTheTaskHasNoDescription_ReturnsNullDescription()
    {
        _repository.TaskToReturn = new TaskItem(
            5, "Ordenar el escritorio", null, TaskPriority.Low, TaskItemStatus.Pending, DateTime.UtcNow);

        var result = await _handler.HandleAsync(5, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Null(result.Description);
    }

    [Fact]
    public async Task HandleAsync_WhenTheTaskDoesNotExist_ReturnsNull()
    {
        _repository.TaskToReturn = null;

        var result = await _handler.HandleAsync(9999, CancellationToken.None);

        Assert.Null(result);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(int.MinValue)]
    public async Task HandleAsync_WithAnIdThatCannotExist_ReturnsNullWithoutQueryingTheRepository(int id)
    {
        var result = await _handler.HandleAsync(id, CancellationToken.None);

        Assert.Null(result);
        Assert.Equal(0, _repository.Calls);
    }
}
