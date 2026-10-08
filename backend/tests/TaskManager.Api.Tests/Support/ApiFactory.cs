using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using TaskManager.Application.Tasks;

namespace TaskManager.Api.Tests.Support;

/// <summary>
/// Levanta la API completa en memoria y sustituye solo el repositorio. Así las
/// pruebas ejercitan el pipeline real (enrutado, validación, serialización y
/// manejo de errores) sin depender de una base de datos.
/// </summary>
internal sealed class ApiFactory : WebApplicationFactory<Program>
{
    public StubTaskRepository Repository { get; } = new();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // Un entorno propio evita que se carguen los user secrets del desarrollador.
        builder.UseEnvironment("Testing");

        // El arranque exige una cadena de conexión; nunca llega a usarse.
        builder.UseSetting("ConnectionStrings:TaskManagerDb", "Server=not-used;");

        builder.ConfigureTestServices(services =>
        {
            services.RemoveAll<ITaskRepository>();
            services.AddSingleton<ITaskRepository>(Repository);
        });
    }
}
