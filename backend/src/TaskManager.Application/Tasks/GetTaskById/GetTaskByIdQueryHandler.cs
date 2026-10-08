namespace TaskManager.Application.Tasks.GetTaskById;

public sealed class GetTaskByIdQueryHandler(ITaskRepository repository)
{
    /// <returns>El detalle de la tarea, o null si no existe.</returns>
    public async Task<TaskDetailDto?> HandleAsync(int id, CancellationToken cancellationToken)
    {
        // Los identificadores empiezan en 1: se evita el viaje a la base de
        // datos para valores que no pueden existir.
        if (id < 1)
        {
            return null;
        }

        var task = await repository.GetByIdAsync(id, cancellationToken);

        return task is null ? null : TaskDetailDto.FromDomain(task);
    }
}
