using TaskManager.Application.Common;
using TaskManager.Application.Tasks;
using TaskManager.Application.Tasks.GetTasks;
using TaskManager.Domain.Tasks;

namespace TaskManager.UnitTests.Application;

public sealed class GetTasksQueryHandlerTests
{
    private readonly FakeTaskRepository _repository = new();
    private readonly GetTasksQueryHandler _handler;

    public GetTasksQueryHandlerTests()
    {
        _handler = new GetTasksQueryHandler(_repository);
    }

    [Fact]
    public async Task HandleAsync_PassesFiltersAndPagingToTheRepository()
    {
        var query = new GetTasksQuery(TaskItemStatus.Pending, TaskPriority.High, Page: 3, PageSize: 10);

        await _handler.HandleAsync(query, CancellationToken.None);

        Assert.Equal(query, _repository.ReceivedQuery);
    }

    [Fact]
    public async Task HandleAsync_ReturnsThePageWithItsPagingData()
    {
        var items = new[]
        {
            new TaskSummaryDto(1, "Primera", TaskPriority.Low, TaskItemStatus.Pending, DateTime.UtcNow),
            new TaskSummaryDto(2, "Segunda", TaskPriority.High, TaskItemStatus.Completed, DateTime.UtcNow),
        };
        _repository.PageToReturn = new TaskListPage(items, TotalCount: 5);

        var result = await _handler.HandleAsync(
            new GetTasksQuery(null, null, Page: 2, PageSize: 2),
            CancellationToken.None);

        Assert.Equal(items, result.Items);
        Assert.Equal(2, result.Page);
        Assert.Equal(2, result.PageSize);
        Assert.Equal(5, result.TotalCount);
        Assert.Equal(3, result.TotalPages);
        Assert.True(result.HasNextPage);
    }

    [Fact]
    public async Task HandleAsync_WithNoMatches_ReturnsAnEmptyPage()
    {
        var result = await _handler.HandleAsync(
            new GetTasksQuery(TaskItemStatus.Completed, null, Page: 1, PageSize: 20),
            CancellationToken.None);

        Assert.Empty(result.Items);
        Assert.Equal(0, result.TotalCount);
        Assert.Equal(0, result.TotalPages);
        Assert.False(result.HasNextPage);
    }

    [Theory]
    [InlineData(0, 20)]
    [InlineData(-1, 20)]
    [InlineData(PagingRules.MaxPage + 1, 20)]
    [InlineData(1, 0)]
    [InlineData(1, -5)]
    [InlineData(1, PagingRules.MaxPageSize + 1)]
    public async Task HandleAsync_WithPagingOutOfRange_ThrowsWithoutQueryingTheRepository(int page, int pageSize)
    {
        var query = new GetTasksQuery(null, null, page, pageSize);

        await Assert.ThrowsAsync<ArgumentOutOfRangeException>(
            () => _handler.HandleAsync(query, CancellationToken.None));

        Assert.Equal(0, _repository.Calls);
    }

    [Theory]
    [InlineData(1, 1)]
    [InlineData(PagingRules.MaxPage, PagingRules.MaxPageSize)]
    public async Task HandleAsync_WithPagingAtTheLimits_Succeeds(int page, int pageSize)
    {
        await _handler.HandleAsync(new GetTasksQuery(null, null, page, pageSize), CancellationToken.None);

        Assert.Equal(1, _repository.Calls);
    }
}
