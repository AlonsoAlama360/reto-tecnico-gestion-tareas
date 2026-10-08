using TaskManager.Domain.Tasks;

namespace TaskManager.Application.Tasks.GetTasks;

/// <summary>
/// Proyección de lectura para el listado. No incluye la descripción: la app
/// solo la muestra en el detalle y así el listado no carga la entidad completa.
/// </summary>
public sealed record TaskSummaryDto(
    int Id,
    string Title,
    TaskPriority Priority,
    TaskItemStatus Status,
    DateTime CreatedAt);
