using System.Text.Json.Serialization;
using TaskManager.Api.ErrorHandling;
using TaskManager.Application;
using TaskManager.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

// Los enums viajan por nombre ("High", "InProgress"): el contrato se lee solo y
// no depende de los valores numéricos que guarda la base de datos. Se configura
// en los dos juegos de opciones JSON: el de MVC serializa las respuestas y el
// de HTTP es el que usa el generador de OpenAPI para describir los esquemas.
builder.Services
    .AddControllers()
    .AddJsonOptions(options => options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.ConfigureHttpJsonOptions(options =>
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter()));

builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddOpenApi();

var app = builder.Build();

app.UseExceptionHandler();
app.UseStatusCodePages();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwaggerUI(options => options.SwaggerEndpoint("/openapi/v1.json", "Task Manager API v1"));
}
else
{
    // En desarrollo la app móvil consume la API por HTTP desde el emulador,
    // donde el certificado de desarrollo no es de confianza.
    app.UseHttpsRedirection();
}

app.MapControllers();
app.MapHealthChecks("/health");

app.Run();
