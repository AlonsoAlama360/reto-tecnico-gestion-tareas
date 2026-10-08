using Microsoft.Extensions.DependencyInjection;
using TaskManager.Application.Tasks.GetTaskById;
using TaskManager.Application.Tasks.GetTasks;

namespace TaskManager.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<GetTasksQueryHandler>();
        services.AddScoped<GetTaskByIdQueryHandler>();

        return services;
    }
}
