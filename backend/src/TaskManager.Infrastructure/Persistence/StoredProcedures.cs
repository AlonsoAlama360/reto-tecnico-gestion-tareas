namespace TaskManager.Infrastructure.Persistence;

internal static class StoredProcedures
{
    public const string ListTasks = "dbo.usp_Tasks_List";
    public const string GetTaskById = "dbo.usp_Tasks_GetById";
}
