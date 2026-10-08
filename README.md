# Gestión de Tareas — React Native + .NET

Mini aplicación móvil para consultar tareas personales: listado, filtrado por
estado y prioridad, y detalle de una tarea. La app en React Native consume un
microservicio REST en .NET que lee de SQL Server mediante procedimientos
almacenados.

## Stack

| Capa          | Tecnología                              |
| ------------- | --------------------------------------- |
| App móvil     | React Native (CLI) + TypeScript         |
| API           | .NET (Web API), Clean Architecture      |
| Acceso a datos | Dapper sobre procedimientos almacenados |
| Base de datos | SQL Server                              |

## Estructura del repositorio

```
├── backend/     Microservicio REST (.NET)
├── database/    Scripts SQL: esquema, procedimientos y datos de prueba
├── mobile/      Aplicación React Native
└── docs/        Diagramas y decisiones de arquitectura
```

## Base de datos

Los scripts están en `database/` y se ejecutan en orden. Son idempotentes:
volver a ejecutarlos no duplica datos ni borra nada.

| Script                     | Contenido                                           |
| -------------------------- | --------------------------------------------------- |
| `01_schema.sql`            | Base de datos `TaskManagerDb`, tabla `Tasks`, índices |
| `02_stored_procedures.sql` | `usp_Tasks_List` y `usp_Tasks_GetById`              |
| `03_seed.sql`              | 20 tareas de prueba                                 |

Prioridad y estado se guardan como `TINYINT` con restricción `CHECK`:

| Valor | Prioridad | Estado     |
| ----- | --------- | ---------- |
| 1     | Low       | Pending    |
| 2     | Medium    | InProgress |
| 3     | High      | Completed  |

### Opción A: Docker

Levanta SQL Server y ejecuta los tres scripts automáticamente.

```bash
cp .env.example .env      # y define MSSQL_SA_PASSWORD
docker compose up -d
```

SQL Server queda disponible en `localhost,14333` con el usuario `sa`.

### Opción B: SQL Server ya instalado

Con `sqlcmd` y autenticación de Windows, desde la raíz del repositorio:

```powershell
sqlcmd -S "<servidor>\<instancia>" -E -C -b -f 65001 -i database\01_schema.sql
sqlcmd -S "<servidor>\<instancia>" -E -C -b -f 65001 -i database\02_stored_procedures.sql
sqlcmd -S "<servidor>\<instancia>" -E -C -b -f 65001 -i database\03_seed.sql
```

La opción `-f 65001` hace que `sqlcmd` lea los scripts como UTF-8; sin ella,
las tildes de los datos de prueba se guardan mal.

### Comprobación rápida

```sql
USE TaskManagerDb;
EXEC dbo.usp_Tasks_List @Status = 1, @Priority = 3;
EXEC dbo.usp_Tasks_GetById @Id = 1;
```

## Backend

Requiere el SDK de .NET 10 y la base de datos ya preparada.

### Configuración

La cadena de conexión no se versiona. En desarrollo se guarda con *user
secrets*; en cualquier otro entorno, en la variable de entorno
`ConnectionStrings__TaskManagerDb`. Si falta, el servicio no arranca y lo
indica con un mensaje claro.

```bash
cd backend

# Con la base de datos de Docker
dotnet user-secrets set "ConnectionStrings:TaskManagerDb" "Server=localhost,14333;Database=TaskManagerDb;User Id=sa;Password=<tu contraseña>;TrustServerCertificate=true" --project src/TaskManager.Api

# Con una instancia local y autenticación de Windows
dotnet user-secrets set "ConnectionStrings:TaskManagerDb" "Server=<servidor>\<instancia>;Database=TaskManagerDb;Integrated Security=true;TrustServerCertificate=true" --project src/TaskManager.Api
```

### Ejecución

```bash
cd backend
dotnet run --project src/TaskManager.Api
```

La API queda en `http://localhost:5080`. En desarrollo expone la documentación
interactiva en `http://localhost:5080/swagger`.

### Endpoints

| Método | Ruta                 | Descripción                                   |
| ------ | -------------------- | --------------------------------------------- |
| GET    | `/api/v1/tasks`      | Lista tareas, de la más reciente a la más antigua |
| GET    | `/api/v1/tasks/{id}` | Detalle de una tarea                          |
| GET    | `/health`            | Estado del servicio y de la base de datos     |

Parámetros de consulta del listado, todos opcionales:

| Parámetro  | Valores                               | Por defecto |
| ---------- | ------------------------------------- | ----------- |
| `status`   | `Pending`, `InProgress`, `Completed`  | sin filtro  |
| `priority` | `Low`, `Medium`, `High`               | sin filtro  |
| `page`     | 1 a 100000                            | 1           |
| `pageSize` | 1 a 100                               | 20          |

```bash
curl "http://localhost:5080/api/v1/tasks?status=Pending&priority=High&pageSize=1"
```

```json
{
  "items": [
    {
      "id": 1,
      "title": "Renovar el seguro del auto",
      "priority": "High",
      "status": "Pending",
      "createdAt": "2026-10-07T18:21:25Z"
    }
  ],
  "page": 1,
  "pageSize": 1,
  "totalCount": 3,
  "totalPages": 3,
  "hasNextPage": true
}
```

Los errores siguen el formato *Problem Details* (RFC 9457):

| Código | Cuándo                                             |
| ------ | -------------------------------------------------- |
| 400    | Filtro o paginación con un valor no válido         |
| 404    | La tarea no existe                                 |
| 503    | La base de datos no está disponible; se puede reintentar |
| 500    | Error inesperado; el detalle queda solo en el log  |

### Tests

```bash
cd backend
dotnet test
```

No necesitan base de datos ni configuración.

| Proyecto                 | Qué cubre                                                        |
| ------------------------ | ---------------------------------------------------------------- |
| `TaskManager.UnitTests`  | Invariantes de la entidad, casos de uso y cálculo de paginación  |
| `TaskManager.Api.Tests`  | Contrato HTTP: levanta la API en memoria y sustituye el repositorio |

Los tests de la API ejercitan el pipeline real (enrutado, validación,
serialización y manejo de errores), así que comprueban lo que recibe la app:
nombres de campos, enums por nombre, códigos de estado y que un fallo interno
no filtra detalles. El repositorio con Dapper no tiene tests automáticos:
necesitaría una base de datos real y se verificó a mano contra SQL Server.

### Estructura

```
backend/src/
├── TaskManager.Domain/          Entidad TaskItem y sus enums. Sin dependencias.
├── TaskManager.Application/     Casos de uso, DTOs y el puerto ITaskRepository.
├── TaskManager.Infrastructure/  Repositorio con Dapper sobre los procedimientos.
└── TaskManager.Api/             Controladores, contrato HTTP y manejo de errores.
```

Las dependencias apuntan hacia adentro: `Api` e `Infrastructure` conocen a
`Application`, y esta solo a `Domain`.

## Alcance

Incluido: listar, filtrar y ver el detalle de tareas.

Fuera de alcance, por definición del reto: autenticación, creación, edición y
eliminación de tareas, múltiples usuarios y despliegue.
