using System.Net.Mime;
using Microsoft.AspNetCore.Mvc;
using TaskManager.Api.Contracts;
using TaskManager.Application.Common;
using TaskManager.Application.Tasks.GetTaskById;
using TaskManager.Application.Tasks.GetTasks;

namespace TaskManager.Api.Controllers;

// El tipo de contenido se declara por respuesta y no con [Produces] en la clase:
// ese atributo fuerza application/json también en los errores, que deben salir
// como application/problem+json.
[ApiController]
[Route("api/v1/tasks")]
public sealed class TasksController(
    GetTasksQueryHandler getTasks,
    GetTaskByIdQueryHandler getTaskById) : ControllerBase
{
    /// <summary>Lista tareas, de la más reciente a la más antigua.</summary>
    [HttpGet]
    [ProducesResponseType<PagedResult<TaskSummaryDto>>(StatusCodes.Status200OK, MediaTypeNames.Application.Json)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest, MediaTypeNames.Application.ProblemJson)]
    public async Task<ActionResult<PagedResult<TaskSummaryDto>>> GetTasks(
        [FromQuery] GetTasksRequest request,
        CancellationToken cancellationToken)
    {
        var result = await getTasks.HandleAsync(request.ToQuery(), cancellationToken);

        return Ok(result);
    }

    /// <summary>Devuelve el detalle de una tarea.</summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType<TaskDetailDto>(StatusCodes.Status200OK, MediaTypeNames.Application.Json)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, MediaTypeNames.Application.ProblemJson)]
    public async Task<ActionResult<TaskDetailDto>> GetTaskById(int id, CancellationToken cancellationToken)
    {
        var task = await getTaskById.HandleAsync(id, cancellationToken);

        return task is null
            ? Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Task not found.",
                detail: $"No task exists with id {id}.")
            : Ok(task);
    }
}
