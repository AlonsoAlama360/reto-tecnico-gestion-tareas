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

## Alcance

Incluido: listar, filtrar y ver el detalle de tareas.

Fuera de alcance, por definición del reto: autenticación, creación, edición y
eliminación de tareas, múltiples usuarios y despliegue.
