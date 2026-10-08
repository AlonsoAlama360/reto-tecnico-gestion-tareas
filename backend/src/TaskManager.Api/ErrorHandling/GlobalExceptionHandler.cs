using System.Data.Common;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace TaskManager.Api.ErrorHandling;

/// <summary>
/// Convierte cualquier excepción no controlada en una respuesta ProblemDetails.
/// El detalle técnico queda en el log y nunca viaja al cliente.
/// </summary>
internal sealed class GlobalExceptionHandler(
    ILogger<GlobalExceptionHandler> logger,
    IProblemDetailsService problemDetailsService) : IExceptionHandler
{
    // Código no estándar (popularizado por nginx) para "el cliente cerró la conexión".
    private const int StatusClientClosedRequest = 499;

    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        // Si el cliente abandonó la petición no hay a quién responder ni nada que registrar como error.
        // No se mira el tipo de la excepción: al cancelar una consulta en curso, el proveedor de
        // SQL Server puede lanzar una SqlException en lugar de OperationCanceledException.
        if (httpContext.RequestAborted.IsCancellationRequested)
        {
            httpContext.Response.StatusCode = StatusClientClosedRequest;
            return true;
        }

        // Un fallo de la base de datos es transitorio desde el punto de vista del
        // cliente: 503 le indica que puede reintentar, a diferencia de un 500.
        var (statusCode, title) = exception is DbException or TimeoutException
            ? (StatusCodes.Status503ServiceUnavailable, "The service is temporarily unavailable.")
            : (StatusCodes.Status500InternalServerError, "An unexpected error occurred.");

        logger.LogError(
            exception,
            "Unhandled exception processing {Method} {Path}",
            httpContext.Request.Method,
            httpContext.Request.Path);

        httpContext.Response.StatusCode = statusCode;

        return await problemDetailsService.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = httpContext,
            Exception = exception,
            ProblemDetails = new ProblemDetails { Status = statusCode, Title = title },
        });
    }
}
