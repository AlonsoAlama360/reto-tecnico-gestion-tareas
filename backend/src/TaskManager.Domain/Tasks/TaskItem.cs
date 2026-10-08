namespace TaskManager.Domain.Tasks;

/// <summary>
/// Tarea personal. Se llama TaskItem y no Task para no chocar con
/// <see cref="System.Threading.Tasks.Task"/>.
/// </summary>
public sealed class TaskItem
{
    public const int TitleMaxLength = 150;
    public const int DescriptionMaxLength = 1000;

    public TaskItem(
        int id,
        string title,
        string? description,
        TaskPriority priority,
        TaskItemStatus status,
        DateTime createdAtUtc)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(title);
        ArgumentOutOfRangeException.ThrowIfGreaterThan(title.Length, TitleMaxLength, nameof(title));

        if (description is { Length: > DescriptionMaxLength })
        {
            throw new ArgumentOutOfRangeException(nameof(description));
        }

        if (!Enum.IsDefined(priority))
        {
            throw new ArgumentOutOfRangeException(nameof(priority), priority, "Unknown priority.");
        }

        if (!Enum.IsDefined(status))
        {
            throw new ArgumentOutOfRangeException(nameof(status), status, "Unknown status.");
        }

        Id = id;
        Title = title;
        Description = string.IsNullOrWhiteSpace(description) ? null : description;
        Priority = priority;
        Status = status;
        CreatedAtUtc = DateTime.SpecifyKind(createdAtUtc, DateTimeKind.Utc);
    }

    public int Id { get; }

    public string Title { get; }

    public string? Description { get; }

    public TaskPriority Priority { get; }

    public TaskItemStatus Status { get; }

    public DateTime CreatedAtUtc { get; }
}
