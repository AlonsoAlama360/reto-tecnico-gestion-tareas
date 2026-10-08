using System.Data.Common;
using Microsoft.Data.SqlClient;

namespace TaskManager.Infrastructure.Persistence;

internal sealed class SqlConnectionFactory(string connectionString) : ISqlConnectionFactory
{
    // Se crea una conexión por operación: ADO.NET las reutiliza desde su pool,
    // así que abrir y cerrar es barato y no hay estado compartido entre peticiones.
    public async Task<DbConnection> OpenConnectionAsync(CancellationToken cancellationToken)
    {
        var connection = new SqlConnection(connectionString);

        try
        {
            await connection.OpenAsync(cancellationToken);
            return connection;
        }
        catch
        {
            await connection.DisposeAsync();
            throw;
        }
    }
}
