using TaskManager.Domain.Tasks;

namespace TaskManager.UnitTests.Domain;

public sealed class TaskItemTests
{
    private static readonly DateTime CreatedAt = new(2026, 10, 1, 12, 0, 0, DateTimeKind.Unspecified);

    [Fact]
    public void Constructor_WithValidData_SetsAllProperties()
    {
        var task = new TaskItem(7, "Pagar el recibo", "Vence el 15", TaskPriority.High, TaskItemStatus.InProgress, CreatedAt);

        Assert.Equal(7, task.Id);
        Assert.Equal("Pagar el recibo", task.Title);
        Assert.Equal("Vence el 15", task.Description);
        Assert.Equal(TaskPriority.High, task.Priority);
        Assert.Equal(TaskItemStatus.InProgress, task.Status);
        Assert.Equal(CreatedAt, task.CreatedAtUtc);
    }

    [Fact]
    public void Constructor_MarksCreationDateAsUtc()
    {
        // SQL Server devuelve DATETIME2 sin zona horaria; si no se marca como
        // UTC, la fecha se serializa sin la "Z" y la app la leería como hora local.
        var task = CreateTask(createdAt: CreatedAt);

        Assert.Equal(DateTimeKind.Utc, task.CreatedAtUtc.Kind);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Constructor_WithBlankTitle_Throws(string? title)
    {
        Assert.ThrowsAny<ArgumentException>(() => CreateTask(title: title!));
    }

    [Fact]
    public void Constructor_WithTitleAtMaxLength_Succeeds()
    {
        var title = new string('a', TaskItem.TitleMaxLength);

        var task = CreateTask(title: title);

        Assert.Equal(title, task.Title);
    }

    [Fact]
    public void Constructor_WithTitleOverMaxLength_Throws()
    {
        var title = new string('a', TaskItem.TitleMaxLength + 1);

        Assert.Throws<ArgumentOutOfRangeException>(() => CreateTask(title: title));
    }

    [Fact]
    public void Constructor_WithDescriptionOverMaxLength_Throws()
    {
        var description = new string('a', TaskItem.DescriptionMaxLength + 1);

        Assert.Throws<ArgumentOutOfRangeException>(() => CreateTask(description: description));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Constructor_WithBlankDescription_NormalizesItToNull(string? description)
    {
        var task = CreateTask(description: description);

        Assert.Null(task.Description);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(4)]
    public void Constructor_WithUnknownPriority_Throws(int priority)
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => CreateTask(priority: (TaskPriority)priority));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(4)]
    public void Constructor_WithUnknownStatus_Throws(int status)
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => CreateTask(status: (TaskItemStatus)status));
    }

    private static TaskItem CreateTask(
        string title = "Una tarea",
        string? description = "Una descripción",
        TaskPriority priority = TaskPriority.Medium,
        TaskItemStatus status = TaskItemStatus.Pending,
        DateTime? createdAt = null) =>
        new(1, title, description, priority, status, createdAt ?? CreatedAt);
}
