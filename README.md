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

## Alcance

Incluido: listar, filtrar y ver el detalle de tareas.

Fuera de alcance, por definición del reto: autenticación, creación, edición y
eliminación de tareas, múltiples usuarios y despliegue.
