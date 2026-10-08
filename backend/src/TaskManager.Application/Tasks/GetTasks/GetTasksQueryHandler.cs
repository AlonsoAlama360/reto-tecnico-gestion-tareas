using TaskManager.Application.Common;

namespace TaskManager.Application.Tasks.GetTasks;

public sealed class GetTasksQueryHandler(ITaskRepository repository)
{
    public async Task<PagedResult<TaskSummaryDto>> HandleAsync(
        GetTasksQuery query,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(query);
        ArgumentOutOfRangeException.ThrowIfLessThan(query.Page, 1);
        ArgumentOutOfRangeException.ThrowIfGreaterThan(query.Page, PagingRules.MaxPage);
        ArgumentOutOfRangeException.ThrowIfLessThan(query.PageSize, 1);
        ArgumentOutOfRangeException.ThrowIfGreaterThan(query.PageSize, PagingRules.MaxPageSize);

        var page = await repository.ListAsync(query, cancellationToken);

        return new PagedResult<TaskSummaryDto>(page.Items, query.Page, query.PageSize, page.TotalCount);
    }
}
