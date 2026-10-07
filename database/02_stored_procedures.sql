/*
    02_stored_procedures.sql
    Procedimientos almacenados que expone la base de datos al microservicio.
    Se usa el prefijo "usp_" y no "sp_": SQL Server busca primero en master
    los procedimientos que empiezan por "sp_".
*/

USE TaskManagerDb;
GO

/*
    Lista tareas con filtros opcionales y paginación.

    Devuelve dos conjuntos de resultados:
      1. TotalCount: total de tareas que cumplen el filtro.
      2. La página solicitada, de la más reciente a la más antigua.

    El total va en un conjunto aparte para que siga siendo correcto cuando se
    pide una página más allá de la última, que no devuelve filas.

    El listado no incluye Description: la app solo la necesita en el detalle
    y así la respuesta se mantiene ligera.
*/
CREATE OR ALTER PROCEDURE dbo.usp_Tasks_List
    @Status     TINYINT = NULL,
    @Priority   TINYINT = NULL,
    @PageNumber INT     = 1,
    @PageSize   INT     = 20
AS
BEGIN
    SET NOCOUNT ON;

    -- La API ya valida la paginación; estos límites protegen al
    -- procedimiento si se invoca desde cualquier otro cliente.
    IF @PageNumber IS NULL OR @PageNumber < 1 SET @PageNumber = 1;
    IF @PageSize IS NULL OR @PageSize < 1 SET @PageSize = 20;
    IF @PageSize > 100 SET @PageSize = 100;

    -- OPTION (RECOMPILE): con filtros opcionales, un plan en caché generado
    -- para una combinación de parámetros puede ser malo para otra. Recompilar
    -- deja que el optimizador descarte las condiciones que no aplican.
    SELECT COUNT(*) AS TotalCount
    FROM dbo.Tasks
    WHERE (@Status IS NULL OR Status = @Status)
      AND (@Priority IS NULL OR Priority = @Priority)
    OPTION (RECOMPILE);

    SELECT Id,
           Title,
           Priority,
           Status,
           CreatedAt
    FROM dbo.Tasks
    WHERE (@Status IS NULL OR Status = @Status)
      AND (@Priority IS NULL OR Priority = @Priority)
    ORDER BY CreatedAt DESC, Id DESC
    OFFSET (@PageNumber - 1) * @PageSize ROWS
    FETCH NEXT @PageSize ROWS ONLY
    OPTION (RECOMPILE);
END
GO

/*
    Devuelve el detalle de una tarea. Si el Id no existe, el conjunto de
    resultados llega vacío y la API responde 404.
*/
CREATE OR ALTER PROCEDURE dbo.usp_Tasks_GetById
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT Id,
           Title,
           Description,
           Priority,
           Status,
           CreatedAt
    FROM dbo.Tasks
    WHERE Id = @Id;
END
GO
