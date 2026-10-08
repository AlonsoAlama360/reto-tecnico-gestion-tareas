namespace TaskManager.Application.Common;

public static class PagingRules
{
    public const int DefaultPageSize = 20;

    // Coincide con el tope que aplica usp_Tasks_List.
    public const int MaxPageSize = 100;

    // Acota el desplazamiento que se le pide a la base de datos: nadie pagina
    // tan lejos de forma legítima y evita recorridos innecesariamente caros.
    public const int MaxPage = 100_000;
}
