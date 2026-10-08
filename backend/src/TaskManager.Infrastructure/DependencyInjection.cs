using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using TaskManager.Application.Tasks;
using TaskManager.Infrastructure.Persistence;

namespace TaskManager.Infrastructure;

public static class DependencyInjection
{
    public const string ConnectionStringName = "TaskManagerDb";

    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // Se valida al arrancar: es preferible que el servicio no levante a que
        // falle en la primera petición con un error difícil de diagnosticar.
        var connectionString = configuration.GetConnectionString(ConnectionStringName);
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                $"Connection string '{ConnectionStringName}' is not configured. " +
                $"Set it with user secrets or the 'ConnectionStrings__{ConnectionStringName}' environment variable.");
        }

        services.AddSingleton<ISqlConnectionFactory>(new SqlConnectionFactory(connectionString));
        services.AddScoped<ITaskRepository, TaskRepository>();

        services.AddHealthChecks()
            .AddCheck<DatabaseHealthCheck>("database");

        return services;
    }
}
