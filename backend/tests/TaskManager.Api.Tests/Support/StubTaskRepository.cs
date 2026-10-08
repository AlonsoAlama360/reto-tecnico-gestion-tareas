using TaskManager.Application.Tasks;
using TaskManager.Application.Tasks.GetTasks;
using TaskManager.Domain.Tasks;

namespace TaskManager.Api.Tests.Support;

internal sealed class StubTaskRepository : ITaskRepository
{
    public TaskListPage PageToReturn { get; set; } = new([], 0);

    public TaskItem? TaskToReturn { get; set; }

    /// <summary>Si se define, el repositorio falla con esta excepción.</summary>
    public Exception? ExceptionToThrow { get; set; }

    public GetTasksQuery? ReceivedQuery { get; private set; }

    public int Calls { get; private set; }

    public Task<TaskListPage> ListAsync(GetTasksQuery query, CancellationToken cancellationToken)
    {
        Calls++;
        ReceivedQuery = query;

        return ExceptionToThrow is null
            ? Task.FromResult(PageToReturn)
            : Task.FromException<TaskListPage>(ExceptionToThrow);
    }

    public Task<TaskItem?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        Calls++;

        return ExceptionToThrow is null
            ? Task.FromResult(TaskToReturn)
            : Task.FromException<TaskItem?>(ExceptionToThrow);
    }
}
