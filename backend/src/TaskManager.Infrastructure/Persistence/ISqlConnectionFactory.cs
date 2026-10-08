using System.Data.Common;

namespace TaskManager.Infrastructure.Persistence;

internal interface ISqlConnectionFactory
{
    /// <summary>Devuelve una conexión ya abierta; quien la pide es responsable de liberarla.</summary>
    Task<DbConnection> OpenConnectionAsync(CancellationToken cancellationToken);
}
