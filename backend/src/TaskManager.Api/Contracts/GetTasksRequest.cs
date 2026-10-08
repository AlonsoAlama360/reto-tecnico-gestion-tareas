using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using TaskManager.Application.Common;
using TaskManager.Application.Tasks.GetTasks;
using TaskManager.Domain.Tasks;

namespace TaskManager.Api.Contracts;

/// <summary>Parámetros de consulta de <c>GET /api/v1/tasks</c>.</summary>
public sealed class GetTasksRequest
{
    /// <summary>Filtra por estado. Si se omite, no se filtra.</summary>
    [FromQuery(Name = "status")]
    public TaskItemStatus? Status { get; init; }

    /// <summary>Filtra por prioridad. Si se omite, no se filtra.</summary>
    [FromQuery(Name = "priority")]
    public TaskPriority? Priority { get; init; }

    /// <summary>Número de página, empezando en 1.</summary>
    [FromQuery(Name = "page")]
    [Range(1, PagingRules.MaxPage)]
    public int Page { get; init; } = 1;

    /// <summary>Cantidad de tareas por página.</summary>
    [FromQuery(Name = "pageSize")]
    [Range(1, PagingRules.MaxPageSize)]
    public int PageSize { get; init; } = PagingRules.DefaultPageSize;

    public GetTasksQuery ToQuery() => new(Status, Priority, Page, PageSize);
}
