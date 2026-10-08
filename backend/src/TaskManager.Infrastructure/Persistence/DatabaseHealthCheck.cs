using Dapper;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace TaskManager.Infrastructure.Persistence;

internal sealed class DatabaseHealthCheck(ISqlConnectionFactory connectionFactory) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            await using var connection = await connectionFactory.OpenConnectionAsync(cancellationToken);
            await connection.ExecuteScalarAsync<int>(
                new CommandDefinition("SELECT 1", cancellationToken: cancellationToken));

            return HealthCheckResult.Healthy();
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            return HealthCheckResult.Unhealthy("The database is not reachable.", exception);
        }
    }
}
