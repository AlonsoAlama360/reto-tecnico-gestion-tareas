using TaskManager.Domain.Tasks;

namespace TaskManager.Application.Tasks.GetTasks;

/// <summary>Criterios del listado. Un filtro en null significa "sin filtrar".</summary>
public sealed record GetTasksQuery(TaskItemStatus? Status, TaskPriority? Priority, int Page, int PageSize);
