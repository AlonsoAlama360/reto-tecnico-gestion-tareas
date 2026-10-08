namespace TaskManager.Domain.Tasks;

// Se llama TaskItemStatus y no TaskStatus para no chocar con
// System.Threading.Tasks.TaskStatus. Los valores numéricos coinciden con los
// que guarda la columna Tasks.Status.
public enum TaskItemStatus
{
    Pending = 1,
    InProgress = 2,
    Completed = 3,
}
