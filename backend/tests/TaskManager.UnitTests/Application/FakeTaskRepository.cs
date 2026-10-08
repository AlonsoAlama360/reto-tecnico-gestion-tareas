using TaskManager.Application.Tasks;
using TaskManager.Application.Tasks.GetTasks;
using TaskManager.Domain.Tasks;

namespace TaskManager.UnitTests.Application;

/// <summary>
/// Doble de prueba escrito a mano: con un puerto de dos métodos es más legible
/// que una librería de mocks y no añade dependencias.
/// </summary>
internal sealed class FakeTaskRepository : ITaskRepository
{
    public TaskListPage PageToReturn { get; set; } = new([], 0);

    public TaskItem? TaskToReturn { get; set; }

    public GetTasksQuery? ReceivedQuery { get; private set; }

    public int? ReceivedId { get; private set; }

    public int Calls { get; private set; }

    public Task<TaskListPage> ListAsync(GetTasksQuery query, CancellationToken cancellationToken)
    {
        Calls++;
        ReceivedQuery = query;
        return Task.FromResult(PageToReturn);
    }

    public Task<TaskItem?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        Calls++;
        ReceivedId = id;
        return Task.FromResult(TaskToReturn);
    }
}
