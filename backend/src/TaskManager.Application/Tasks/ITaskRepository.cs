using TaskManager.Application.Tasks.GetTasks;
using TaskManager.Domain.Tasks;

namespace TaskManager.Application.Tasks;

/// <summary>
/// Puerto de salida hacia el almacén de tareas. La capa de aplicación define
/// lo que necesita y la infraestructura decide cómo obtenerlo.
/// </summary>
public interface ITaskRepository
{
    Task<TaskListPage> ListAsync(GetTasksQuery query, CancellationToken cancellationToken);

    Task<TaskItem?> GetByIdAsync(int id, CancellationToken cancellationToken);
}

/// <summary>Una página del listado junto con el total de tareas que cumplen el filtro.</summary>
public sealed record TaskListPage(IReadOnlyList<TaskSummaryDto> Items, int TotalCount);
