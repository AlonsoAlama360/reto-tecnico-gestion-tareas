# Arquitectura

Este documento describe cómo está construida la solución. El porqué de cada
elección está en [decisiones.md](decisiones.md).

- [Vista general](#vista-general)
- [Arquitectura del backend](#arquitectura-del-backend)
- [Comunicación app ↔ API ↔ base de datos](#comunicación-app--api--base-de-datos)
- [Arquitectura de la app móvil](#arquitectura-de-la-app-móvil)
- [Modelo de datos](#modelo-de-datos)

## Vista general

```mermaid
flowchart LR
    app["App móvil<br/>React Native"]
    api["Microservicio REST<br/>.NET 10"]
    db[("SQL Server<br/>TaskManagerDb")]

    app -- "HTTP + JSON" --> api
    api -- "Procedimientos almacenados" --> db
```

Tres piezas con una responsabilidad cada una:

| Pieza | Responsabilidad | No hace |
| ----- | --------------- | ------- |
| App móvil | Presentar las tareas y recoger los filtros | No conoce la base de datos ni filtra en memoria |
| API | Validar la petición, orquestar el caso de uso y definir el contrato | No contiene SQL fuera de la capa de infraestructura |
| Base de datos | Guardar las tareas, filtrar y paginar | No conoce HTTP ni el formato de la respuesta |

## Arquitectura del backend

El backend sigue Clean Architecture en cuatro proyectos. La regla es una
sola: **las dependencias apuntan hacia adentro**. El dominio no depende de
nadie; la aplicación solo del dominio; la API y la infraestructura dependen
de la aplicación.

```mermaid
flowchart TB
    client(["App móvil"])

    subgraph Api["TaskManager.Api · presentación"]
        controller["TasksController<br/>contrato HTTP, validación y errores"]
    end

    subgraph Application["TaskManager.Application · casos de uso"]
        handlers["GetTasksQueryHandler<br/>GetTaskByIdQueryHandler"]
        port{{"ITaskRepository<br/>puerto"}}
    end

    subgraph Domain["TaskManager.Domain · núcleo"]
        entity["TaskItem<br/>TaskPriority · TaskItemStatus"]
    end

    subgraph Infrastructure["TaskManager.Infrastructure · adaptadores"]
        repo["TaskRepository<br/>Dapper"]
    end

    db[("SQL Server<br/>procedimientos almacenados")]

    client -- "HTTP" --> controller
    controller --> handlers
    handlers --> port
    handlers --> entity
    port -. "implementado por" .-> repo
    repo --> db
```

Las flechas continuas muestran quién llama a quién al atender una petición. La
flecha punteada es la clave del diseño: en tiempo de ejecución el caso de uso
acaba llamando al repositorio, pero en el código la dependencia va al revés.
`Application` define la interfaz y no sabe que existe `Infrastructure`; es
`Infrastructure` quien referencia a `Application` para implementarla.

### Qué vive en cada capa

| Proyecto | Contiene | Depende de |
| -------- | -------- | ---------- |
| `TaskManager.Domain` | La entidad `TaskItem`, que valida sus invariantes al construirse, y los enums de prioridad y estado | Nada |
| `TaskManager.Application` | Un caso de uso por consulta, los DTOs de salida, las reglas de paginación y el puerto `ITaskRepository` | Domain |
| `TaskManager.Infrastructure` | La implementación del puerto con Dapper sobre los procedimientos almacenados, la fábrica de conexiones y la comprobación de salud | Application |
| `TaskManager.Api` | El controlador, el contrato HTTP, la serialización y el manejo global de errores | Application e Infrastructure |

La API referencia a la infraestructura únicamente para registrar sus servicios
en el arranque (`AddInfrastructure`). El controlador solo conoce los casos de
uso, y los tipos de infraestructura son `internal`, así que el compilador
impide usarlos desde otra capa.

### El puerto y su adaptador

`ITaskRepository` se define en la capa de aplicación, que es quien lo
necesita, y se implementa en infraestructura. Esa inversión es la que permite:

- Probar los casos de uso y el contrato HTTP sin base de datos, sustituyendo
  el repositorio por un doble.
- Cambiar el acceso a datos (otro motor, otro ORM, una caché delante) sin
  tocar los casos de uso ni la API.

## Comunicación app ↔ API ↔ base de datos

### Listado con filtros

```mermaid
sequenceDiagram
    actor Persona
    participant App as App móvil
    participant Cache as Caché de React Query
    participant Api as API .NET
    participant Db as SQL Server

    Persona->>App: Aplica "Pendiente" + "Alta"
    App->>Cache: ¿Hay datos para estos filtros?

    alt Datos recientes en caché
        Cache-->>App: Página guardada
    else Sin datos o caducados
        App->>Api: GET /api/v1/tasks?status=Pending&priority=High&page=1&pageSize=10
        Api->>Api: Valida filtros y paginación
        Api->>Db: EXEC usp_Tasks_List @Status, @Priority, @PageNumber, @PageSize
        Db-->>Api: Total + filas de la página
        Api-->>App: 200 · items, page, totalCount, hasNextPage
        App->>Cache: Guarda la página
    end

    App-->>Persona: Muestra las tareas

    Persona->>App: Llega al final de la lista
    App->>Api: GET /api/v1/tasks?...&page=2&pageSize=10
    Api->>Db: EXEC usp_Tasks_List (página 2)
    Db-->>Api: Total + filas
    Api-->>App: 200 · siguiente página
    App-->>Persona: Añade las tareas al final
```

### Detalle

```mermaid
sequenceDiagram
    actor Persona
    participant App as App móvil
    participant Api as API .NET
    participant Db as SQL Server

    Persona->>App: Pulsa una tarea
    App->>Api: GET /api/v1/tasks/7
    Api->>Db: EXEC usp_Tasks_GetById @Id = 7

    alt La tarea existe
        Db-->>Api: Una fila
        Api-->>App: 200 · detalle
        App-->>Persona: Muestra el detalle
    else No existe
        Db-->>Api: Sin filas
        Api-->>App: 404 · Problem Details
        App-->>Persona: "Tarea no encontrada" + volver al listado
    end
```

### Qué pasa cuando algo falla

```mermaid
sequenceDiagram
    participant App as App móvil
    participant Api as API .NET
    participant Db as SQL Server

    App->>Api: GET /api/v1/tasks?status=foo
    Api-->>App: 400 · campo "status" no válido
    Note over App: No reintenta: repetir la petición daría el mismo error

    App->>Api: GET /api/v1/tasks
    Api->>Db: EXEC usp_Tasks_List
    Db--xApi: Base de datos no disponible
    Api-->>App: 503 · Problem Details sin detalle interno
    Note over App: Reintenta hasta 2 veces y, si persiste,<br/>muestra el error con botón "Reintentar"

    App-xApi: Sin respuesta en 10 s
    Note over App: Aborta la petición y la trata como timeout
```

| Situación | Respuesta de la API | Qué hace la app |
| --------- | ------------------- | --------------- |
| Filtro o paginación no válidos | 400 con el campo afectado | No reintenta |
| La tarea no existe | 404 | Ofrece volver al listado |
| Base de datos caída | 503 | Reintenta y luego ofrece "Reintentar" |
| Error inesperado | 500 sin detalle interno | Reintenta y luego ofrece "Reintentar" |
| Sin conexión | — | "Sin conexión con el servidor" |
| El servidor no responde | — | Aborta a los 10 s |
| Falla al cargar más páginas | cualquiera de las anteriores | Conserva las tareas ya mostradas y ofrece reintentar al pie |

## Arquitectura de la app móvil

El código se organiza por *feature*. Las dependencias van en un solo
sentido: `app` → `features` → `shared`.

```mermaid
flowchart TB
    subgraph app["app · composición"]
        App["App.tsx<br/>proveedores"]
        Nav["RootNavigator"]
        QC["queryClient<br/>caché y política de reintentos"]
    end

    subgraph tasks["features/tasks"]
        screens["screens<br/>Listado · Filtros · Detalle"]
        components["components<br/>TaskCard · TaskListToolbar"]
        hooks["hooks<br/>useTaskList · useTaskDetail"]
        tasksApi["api<br/>tasksApi · taskKeys"]
        model["model<br/>tipos y presentación"]
    end

    subgraph shared["shared"]
        http["api<br/>httpClient · ApiError"]
        ui["components<br/>AppText · Button · Chip · Badge"]
        theme["theme<br/>tokens de diseño"]
    end

    backend["API .NET"]

    App --> Nav
    App --> QC
    Nav --> screens
    screens --> components
    screens --> hooks
    hooks --> tasksApi
    tasksApi --> http
    components --> ui
    screens --> ui
    ui --> theme
    components --> model
    http --> backend
```

| Carpeta | Responsabilidad |
| ------- | --------------- |
| `app/` | Monta los proveedores y compone las rutas de las features. No tiene lógica de negocio. |
| `features/tasks/screens` | Deciden qué estado mostrar (carga, vacío, error, datos) y traducen gestos en navegación. |
| `features/tasks/hooks` | Único punto de acceso a los datos de tareas; encapsulan React Query. |
| `features/tasks/api` | Conocen las rutas y parámetros de la API de tareas. |
| `features/tasks/model` | Tipos del dominio y su traducción a textos y colores. |
| `shared/api` | Cliente HTTP y clasificación de errores, sin saber nada de tareas. |
| `shared/components` y `shared/theme` | Componentes base y tokens con los que se construye toda la interfaz. |

Una pantalla nunca llama a `fetch` ni conoce una URL: pide datos a un hook.
Eso permite probar las pantallas sustituyendo solo `tasksApi`.

## Modelo de datos

```mermaid
erDiagram
    Tasks {
        INT Id PK "IDENTITY"
        NVARCHAR_150 Title "NOT NULL, no vacío"
        NVARCHAR_1000 Description "NULL"
        TINYINT Priority "1 Low · 2 Medium · 3 High"
        TINYINT Status "1 Pending · 2 InProgress · 3 Completed"
        DATETIME2 CreatedAt "UTC, por defecto la fecha actual"
    }
```

| Objeto | Propósito |
| ------ | --------- |
| `CK_Tasks_Priority`, `CK_Tasks_Status` | Impiden valores fuera del dominio |
| `CK_Tasks_Title_NotBlank` | Impide títulos vacíos o solo con espacios |
| `IX_Tasks_Status_Priority` | Filtro por estado, o por estado y prioridad |
| `IX_Tasks_Priority` | Filtro solo por prioridad |
| `usp_Tasks_List` | Listado con filtros opcionales y paginación en servidor |
| `usp_Tasks_GetById` | Detalle de una tarea |

La columna `CreatedAt` no forma parte del modelo pedido en el enunciado. Se
añadió porque un listado paginado necesita un orden estable: sin él, la misma
tarea podría aparecer en dos páginas o en ninguna.
