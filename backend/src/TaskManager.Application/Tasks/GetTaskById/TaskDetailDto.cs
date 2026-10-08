using TaskManager.Domain.Tasks;

namespace TaskManager.Application.Tasks.GetTaskById;

public sealed record TaskDetailDto(
    int Id,
    string Title,
    string? Description,
    TaskPriority Priority,
    TaskItemStatus Status,
    DateTime CreatedAt)
{
    public static TaskDetailDto FromDomain(TaskItem task) =>
        new(task.Id, task.Title, task.Description, task.Priority, task.Status, task.CreatedAtUtc);
}
