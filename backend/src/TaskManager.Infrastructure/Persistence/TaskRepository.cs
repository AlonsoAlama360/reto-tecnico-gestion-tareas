using System.Data;
using Dapper;
using TaskManager.Application.Tasks;
using TaskManager.Application.Tasks.GetTasks;
using TaskManager.Domain.Tasks;

namespace TaskManager.Infrastructure.Persistence;

internal sealed class TaskRepository(ISqlConnectionFactory connectionFactory) : ITaskRepository
{
    public async Task<TaskListPage> ListAsync(GetTasksQuery query, CancellationToken cancellationToken)
    {
        var command = new CommandDefinition(
            StoredProcedures.ListTasks,
            new
            {
                Status = (byte?)query.Status,
                Priority = (byte?)query.Priority,
                PageNumber = query.Page,
                query.PageSize,
            },
            commandType: CommandType.StoredProcedure,
            cancellationToken: cancellationToken);

        await using var connection = await connectionFactory.OpenConnectionAsync(cancellationToken);
        await using var results = await connection.QueryMultipleAsync(command);

        // El procedimiento devuelve primero el total y después la página.
        var totalCount = await results.ReadSingleAsync<int>();
        var rows = await results.ReadAsync<TaskRow>();

        var items = rows
            .Select(row => new TaskSummaryDto(
                row.Id,
                row.Title,
                ToEnum<TaskPriority>(row.Priority),
                ToEnum<TaskItemStatus>(row.Status),
                DateTime.SpecifyKind(row.CreatedAt, DateTimeKind.Utc)))
            .ToList();

        return new TaskListPage(items, totalCount);
    }

    public async Task<TaskItem?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        var command = new CommandDefinition(
            StoredProcedures.GetTaskById,
            new { Id = id },
            commandType: CommandType.StoredProcedure,
            cancellationToken: cancellationToken);

        await using var connection = await connectionFactory.OpenConnectionAsync(cancellationToken);
        var row = await connection.QuerySingleOrDefaultAsync<TaskRow>(command);

        return row is null
            ? null
            : new TaskItem(
                row.Id,
                row.Title,
                row.Description,
                ToEnum<TaskPriority>(row.Priority),
                ToEnum<TaskItemStatus>(row.Status),
                row.CreatedAt);
    }

    // La restricción CHECK de la tabla impide valores fuera de rango; si aun así
    // llega uno, es mejor fallar aquí que propagar un enum sin nombre al cliente.
    private static TEnum ToEnum<TEnum>(byte value)
        where TEnum : struct, Enum
    {
        var result = (TEnum)Enum.ToObject(typeof(TEnum), value);

        return Enum.IsDefined(result)
            ? result
            : throw new InvalidOperationException($"Unexpected {typeof(TEnum).Name} value '{value}' read from the database.");
    }

    /// <summary>
    /// Forma de las filas que devuelven los procedimientos. Mantiene los tipos
    /// de SQL Server (TINYINT, DATETIME2) fuera de los modelos de la aplicación.
    /// </summary>
    private sealed class TaskRow
    {
        public int Id { get; init; }

        public string Title { get; init; } = string.Empty;

        public string? Description { get; init; }

        public byte Priority { get; init; }

        public byte Status { get; init; }

        public DateTime CreatedAt { get; init; }
    }
}
