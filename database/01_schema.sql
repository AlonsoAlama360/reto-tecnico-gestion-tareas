/*
    01_schema.sql
    Crea la base de datos y la tabla de tareas.
    El script es idempotente: puede ejecutarse varias veces sin efectos
    secundarios ni pérdida de datos.
*/

IF DB_ID(N'TaskManagerDb') IS NULL
BEGIN
    CREATE DATABASE TaskManagerDb;
END
GO

USE TaskManagerDb;
GO

IF OBJECT_ID(N'dbo.Tasks', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Tasks
    (
        Id          INT IDENTITY(1, 1) NOT NULL,
        Title       NVARCHAR(150)      NOT NULL,
        Description NVARCHAR(1000)     NULL,
        -- 1 = Low, 2 = Medium, 3 = High
        Priority    TINYINT            NOT NULL,
        -- 1 = Pending, 2 = InProgress, 3 = Completed
        Status      TINYINT            NOT NULL,
        CreatedAt   DATETIME2(0)       NOT NULL
            CONSTRAINT DF_Tasks_CreatedAt DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT PK_Tasks PRIMARY KEY CLUSTERED (Id),
        CONSTRAINT CK_Tasks_Title_NotBlank CHECK (LEN(LTRIM(RTRIM(Title))) > 0),
        CONSTRAINT CK_Tasks_Priority CHECK (Priority IN (1, 2, 3)),
        CONSTRAINT CK_Tasks_Status CHECK (Status IN (1, 2, 3))
    );
END
GO

/*
    Índices de apoyo al listado. Ambos terminan en CreatedAt e Id, que es el
    orden del listado, e incluyen Title para cubrir la consulta sin tener que
    ir al índice agrupado.

    - Status + Priority: filtro por estado, o por estado y prioridad.
    - Priority: filtro solo por prioridad, que el índice anterior no resuelve
      porque Priority no es su primera columna.
*/
IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = N'IX_Tasks_Status_Priority' AND object_id = OBJECT_ID(N'dbo.Tasks'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Tasks_Status_Priority
        ON dbo.Tasks (Status, Priority, CreatedAt DESC, Id DESC)
        INCLUDE (Title);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = N'IX_Tasks_Priority' AND object_id = OBJECT_ID(N'dbo.Tasks'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Tasks_Priority
        ON dbo.Tasks (Priority, CreatedAt DESC, Id DESC)
        INCLUDE (Title, Status);
END
GO
