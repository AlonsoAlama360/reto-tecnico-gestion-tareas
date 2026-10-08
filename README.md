# Gestión de Tareas — React Native + .NET

Mini aplicación móvil para consultar tareas personales: listado, filtrado por
estado y prioridad, y detalle de una tarea. La app en React Native consume un
microservicio REST en .NET que lee de SQL Server mediante procedimientos
almacenados.

## Stack

| Capa          | Tecnología                              |
| ------------- | --------------------------------------- |
| App móvil     | React Native (CLI) + TypeScript         |
| API           | .NET 10 (Web API), Clean Architecture   |
| Acceso a datos | Dapper sobre procedimientos almacenados |
| Base de datos | SQL Server                              |

## Documentación técnica

| Documento | Contenido |
| --------- | --------- |
| [Arquitectura](docs/arquitectura.md) | Diagrama de arquitectura del backend, diagramas de comunicación app ↔ API ↔ base de datos, arquitectura de la app y modelo de datos |
| [Decisiones técnicas](docs/decisiones.md) | Qué se eligió en cada punto, por qué, qué alternativa se descartó y qué coste tiene |
| [Escalabilidad, seguridad y casos límite](docs/escalabilidad-y-seguridad.md) | Qué está resuelto, qué falta para producción y cómo responde la solución ante casos poco habituales |

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

## App móvil

Requiere Node 22 o superior y el entorno de Android para React Native
(Android Studio con un dispositivo virtual, JDK 17 y la variable
`ANDROID_HOME`). La guía oficial detalla la instalación:
<https://reactnative.dev/docs/set-up-your-environment>.

### Ejecución

Con la API en marcha y un emulador abierto:

```bash
cd mobile
npm install
npm start          # Metro, en una terminal
npm run android    # compila e instala la app, en otra terminal
```

La primera compilación descarga Gradle, el NDK y las dependencias nativas, y
tarda varios minutos.

### Conexión con la API

La URL base está en `mobile/src/shared/config/env.ts`. En el emulador de
Android se usa `http://10.0.2.2:5080`, que es el alias del equipo anfitrión:
dentro del emulador, `localhost` es el propio emulador. No hay que configurar
nada si la API corre en el puerto 5080 del mismo equipo.

Para un dispositivo físico hay que poner ahí la IP del equipo en la red local
y arrancar la API escuchando en esa interfaz
(`dotnet run --project src/TaskManager.Api --urls http://0.0.0.0:5080`).

### Tests

```bash
cd mobile
npm test
```

No necesitan emulador ni la API en marcha. La primera ejecución tarda más
porque Jest compila React Native sin caché.

| Qué se prueba | Cómo |
| ------------- | ---- |
| Pantallas de listado, filtros y detalle | Se renderizan con la capa de API sustituida y se comprueba lo que ve la persona: carga, vacío, sin resultados, errores con reintento, paginación y navegación |
| Cliente HTTP | Construcción de la URL, y clasificación de fallos de red, timeout, estado HTTP y formato |
| Utilidades | Clasificación de errores, mensajes y formato de fecha |

Las pantallas reciben la navegación por props, así que se prueban sin montar
un navegador. Además de `npm test`, `npm run lint` y `npx tsc --noEmit`
comprueban estilo y tipos.

### Pantallas

| Pantalla | Qué hace |
| -------- | -------- |
| Mis tareas | Listado paginado con scroll infinito y "tirar para actualizar". Muestra el total y los filtros activos, que se pueden quitar uno a uno. |
| Filtrar tareas | Selección de estado y prioridad. Los cambios se aplican al pulsar "Aplicar"; salir los descarta. |
| Detalle | Título, estado, prioridad, descripción y fecha de creación. |

Cada pantalla cubre sus estados de carga, vacío, sin resultados y error con
reintento. Un detalle que ya no existe ofrece volver al listado en lugar de
reintentar.

### Estructura

```
mobile/src/
├── app/                 Composición: proveedores y navegador raíz.
├── features/
│   └── tasks/           Todo lo relativo a tareas.
│       ├── api/         Llamadas a la API y claves de caché.
│       ├── hooks/       Acceso a datos con React Query.
│       ├── model/       Tipos del dominio y su presentación (textos, colores).
│       ├── navigation/  Rutas que aporta la feature.
│       ├── components/  Componentes propios de la feature.
│       └── screens/     Pantallas.
└── shared/              Reutilizable por cualquier feature.
    ├── api/             Cliente HTTP y clasificación de errores.
    ├── components/      Componentes base (texto, botón, chip, etiqueta, estados).
    ├── config/          Configuración de entorno.
    ├── theme/           Tokens de diseño: color, espaciado, tipografía.
    └── utils/
```

El código se organiza por feature y no por tipo de archivo: añadir una
funcionalidad nueva es añadir una carpeta en `features/`, sin tocar las demás.
Las dependencias van en un solo sentido: `app` → `features` → `shared`.

No se usa ninguna librería de componentes: la interfaz se construye con los
primitivos de React Native sobre los tokens de `shared/theme`.

## Alcance

Incluido: listar, filtrar y ver el detalle de tareas.

Fuera de alcance, por definición del reto: autenticación, creación, edición y
eliminación de tareas, múltiples usuarios y despliegue.
