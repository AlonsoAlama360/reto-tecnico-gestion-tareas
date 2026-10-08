# Decisiones técnicas

Cada decisión recoge qué se eligió, por qué, qué alternativa se descartó y
qué coste tiene. El criterio de fondo es el que pide el reto: plantear la
arquitectura como si el proyecto fuera a crecer, pero sin añadir piezas que
hoy no resuelven ningún problema.

- [Backend](#backend)
- [Base de datos](#base-de-datos)
- [Contrato de la API](#contrato-de-la-api)
- [App móvil](#app-móvil)
- [Pruebas](#pruebas)
- [Repositorio](#repositorio)
- [Lo que se dejó fuera a propósito](#lo-que-se-dejó-fuera-a-propósito)

## Backend

### 1. Clean Architecture en cuatro proyectos

**Decisión.** Separar el backend en `Domain`, `Application`, `Infrastructure`
y `Api`, con las dependencias apuntando hacia el dominio.

**Por qué.** El reto obliga a usar procedimientos almacenados, que es justo
el tipo de detalle que conviene aislar: hoy es SQL Server con Dapper y mañana
puede haber una caché delante u otro motor. Con el puerto `ITaskRepository`
definido en la capa de aplicación, ese cambio no toca los casos de uso ni el
contrato HTTP. La misma frontera hace que la lógica se pueda probar sin base
de datos. Que sean proyectos separados, y no carpetas, convierte la regla de
dependencias en algo que verifica el compilador.

**Alternativa descartada.** Un único proyecto con carpetas por capa. Es más
ligero, pero nada impide que un controlador use `SqlConnection` directamente,
y en un equipo que crece esa regla acaba rompiéndose.

**Coste.** Más archivos y algo de mapeo para dos endpoints. Se asume porque
el enunciado pide plantearlo como un proyecto grande.

### 2. Un caso de uso por clase, sin mediador

**Decisión.** `GetTasksQueryHandler` y `GetTaskByIdQueryHandler` son clases
concretas que el controlador recibe por inyección de dependencias.

**Por qué.** Cada caso de uso queda en un sitio, con una sola razón para
cambiar, y se prueba instanciándolo. Añadir uno nuevo no modifica los
existentes.

**Alternativa descartada.** MediatR con CQRS completo. Aporta un pipeline de
comportamientos transversales que aquí no se necesita: con dos consultas de
solo lectura sería una capa de indirección sin beneficio. Si aparecen
comandos y validación o auditoría transversal, las clases ya tienen la forma
adecuada para migrarlas.

**Coste.** El controlador declara una dependencia por caso de uso.

### 3. Dapper sobre los procedimientos almacenados

**Decisión.** La infraestructura invoca los procedimientos con Dapper y mapea
las filas a través de un tipo interno (`TaskRow`).

**Por qué.** Los procedimientos son un requisito, y con ellos EF Core pierde
lo que lo justifica: no genera las consultas ni rastrea cambios en un sistema
de solo lectura. Dapper hace exactamente lo que queda por hacer, ejecutar y
mapear, con muy poco código. El tipo `TaskRow` mantiene los tipos de SQL
Server (`TINYINT`, `DATETIME2`) fuera de los modelos de la aplicación.

**Alternativa descartada.** EF Core con `FromSqlRaw`, o ADO.NET a mano. El
primero añade una dependencia grande para usar una fracción; el segundo
obliga a escribir el mapeo columna a columna.

**Coste.** Los nombres de columnas y parámetros se acoplan por convención; un
cambio en un procedimiento no lo detecta el compilador. Lo cubriría una
prueba de integración contra una base real, que hoy no existe (ver
[Pruebas](#pruebas)).

### 4. Controladores en lugar de Minimal APIs

**Decisión.** Un `TasksController` con `[ApiController]`.

**Por qué.** `[ApiController]` valida el modelo y responde 400 con el detalle
por campo sin código adicional, y el enlace de enums desde la consulta
rechaza valores no definidos. Además es la forma que la mayoría de equipos
.NET reconoce de inmediato.

**Alternativa descartada.** Minimal APIs. Son más concisas, pero el enlace de
enums y la validación habría que escribirlos a mano para obtener el mismo
resultado.

**Coste.** Algo más de ceremonia por endpoint.

### 5. Configuración fuera del repositorio y fallo al arrancar

**Decisión.** La cadena de conexión se lee de *user secrets* o de una variable
de entorno, nunca de un archivo versionado. Si falta, el servicio no arranca.

**Por qué.** Una credencial en el repositorio queda en el historial para
siempre. Y un servicio que arranca sin configuración falla en la primera
petición, con un error que no apunta a la causa; fallar en el arranque con un
mensaje explícito ahorra ese diagnóstico.

**Coste.** Un paso más de configuración, documentado en el README.

## Base de datos

### 6. SQL Server

**Decisión.** SQL Server, con `docker compose` para levantarlo sin instalar
nada.

**Por qué.** Las dos opciones permitidas servían. Se eligió SQL Server porque
los procedimientos almacenados con varios conjuntos de resultados son
idiomáticos en T-SQL y encajan con el ecosistema .NET, y porque `OFFSET/FETCH`
y los parámetros opcionales se expresan de forma directa.

**Alternativa descartada.** PostgreSQL. Habría funcionado igual de bien; el
listado sería una función en lugar de un procedimiento y el resto del diseño
no cambiaría. Gracias al puerto `ITaskRepository`, el cambio se limitaría a
la capa de infraestructura y a los scripts.

### 7. Prioridad y estado como `TINYINT` con `CHECK`

**Decisión.** Dos columnas numéricas restringidas a 1, 2 y 3, que se
corresponden con los enums del dominio.

**Por qué.** Son dominios cerrados y pequeños que solo cambian junto con el
código que los interpreta. Guardarlos como número evita un `JOIN` en cada
listado, y el `CHECK` garantiza la integridad igual que lo haría una clave
foránea.

**Alternativa descartada.** Tablas catálogo `Priorities` y `Statuses`. Tienen
sentido si los valores los administra alguien desde una pantalla o si llevan
atributos propios (color, orden, traducciones). No es el caso.

**Coste.** Añadir un valor exige cambiar el `CHECK` y el enum a la vez.

### 8. Un solo procedimiento de listado con filtros opcionales

**Decisión.** `usp_Tasks_List` recibe `@Status` y `@Priority` con valor por
defecto `NULL` y filtra con `(@Status IS NULL OR Status = @Status)`. Lleva
`OPTION (RECOMPILE)`.

**Por qué.** Un procedimiento por combinación de filtros crece de forma
exponencial con cada filtro nuevo. El patrón de parámetros opcionales mantiene
uno solo, pero tiene un problema conocido: SQL Server guarda el plan de la
primera ejecución, y un plan pensado para "sin filtros" es malo para "estado =
Pendiente". `OPTION (RECOMPILE)` hace que el optimizador vea los valores
reales y descarte las condiciones que no aplican.

**Alternativa descartada.** SQL dinámico con `sp_executesql`, que construye
solo las condiciones necesarias. Rinde mejor a muy alto volumen, pero es más
difícil de leer y de mantener.

**Coste.** Se compila en cada ejecución. Es despreciable para esta consulta;
con miles de peticiones por segundo convendría pasar a SQL dinámico.

### 9. Paginación en el servidor, con el total en un conjunto aparte

**Decisión.** El procedimiento pagina con `OFFSET/FETCH`, ordenando por
`CreatedAt DESC, Id DESC`, y devuelve dos conjuntos de resultados: primero el
total y después la página.

**Por qué.** Paginar en la base de datos evita traer filas que la API
descartaría. El `Id` como segundo criterio hace el orden determinista aunque
dos tareas compartan fecha. El total va aparte y no como `COUNT(*) OVER()`
porque, al pedir una página más allá de la última, no hay filas donde llevar
esa columna y el total se perdería.

**Alternativa descartada.** Paginación por cursor (*keyset*). Es más eficiente
en páginas profundas y estable ante inserciones, pero no da el total ni
permite saltar a una página. Para un listado personal, el desplazamiento es
suficiente; la API limita `page` a 100000 para acotar el coste.

**Coste.** Dos consultas por petición, y páginas profundas más lentas.

## Contrato de la API

### 10. Los enums viajan por nombre

**Decisión.** `"priority": "High"` y `?status=InProgress`, no `3` ni `2`.

**Por qué.** El contrato se entiende sin tabla de equivalencias y no queda
atado a los números que guarda la base de datos, que son un detalle interno.

**Coste.** Renombrar un valor del enum rompe el contrato; lo detectan los
tests de la API.

### 11. El listado no incluye la descripción

**Decisión.** El listado devuelve `TaskSummaryDto` (sin descripción) y el
detalle `TaskDetailDto`.

**Por qué.** La app solo muestra la descripción en el detalle. No enviarla en
el listado reduce la respuesta y permite que los índices cubran la consulta
sin leer la tabla.

**Coste.** Abrir un detalle siempre cuesta una petición. React Query la
guarda en caché, así que volver a la misma tarea no la repite.

### 12. Errores como Problem Details, y 503 para la base de datos

**Decisión.** Todos los errores responden en el formato estándar *Problem
Details* (`application/problem+json`). Un fallo de la base de datos responde
503 y no 500. El detalle técnico se registra en el log y nunca se envía.

**Por qué.** Un formato único permite a la app tratar cualquier error igual.
La distinción entre 503 y 500 le dice algo útil: el primero es transitorio y
merece un reintento. Ocultar el detalle evita filtrar nombres de servidor o
de tablas.

**Coste.** Diagnosticar exige ir al log; cada respuesta incluye un `traceId`
para localizar la entrada.

### 13. Versión en la ruta

**Decisión.** `/api/v1/tasks`.

**Por qué.** Una app instalada no se actualiza cuando uno quiere: seguirá
habiendo versiones antiguas llamando a la API. La versión en la ruta permite
publicar un `v2` sin romperlas.

## App móvil

### 14. Organización por *feature*

**Decisión.** `features/tasks` agrupa pantallas, componentes, hooks, llamadas
a la API y tipos de las tareas. Lo reutilizable vive en `shared`, y `app` solo
compone.

**Por qué.** Lo que cambia junto vive junto. Añadir una funcionalidad es
añadir una carpeta, y borrarla es borrar una carpeta. La organización por tipo
(`screens/`, `components/`, `hooks/` en la raíz) obliga a tocar cinco carpetas
para cada cambio y deja de ser navegable cuando hay muchas pantallas.

**Coste.** Hay que decidir qué es de la feature y qué es compartido. La regla
usada: algo pasa a `shared` cuando no menciona tareas.

### 15. TanStack Query para el estado del servidor

**Decisión.** Los datos de la API se gestionan con TanStack Query. No hay
store global.

**Por qué.** Los datos de esta app pertenecen al servidor: la app solo los
lee y los muestra. Eso plantea problemas de caché, no de estado: cuándo
caducan, qué mostrar mientras cargan, cuándo reintentar, cómo paginar y cómo
cancelar. TanStack Query los resuelve todos, incluido el scroll infinito.

**Alternativa descartada.** Redux Toolkit o Context con `useEffect`. Habría
que escribir a mano la caché, los estados de carga y error, la paginación y
la cancelación, que es justo el código donde aparecen las condiciones de
carrera.

**Coste.** Una dependencia más.

### 16. Los filtros viven en los parámetros de la ruta

**Decisión.** Los filtros activos son parámetros de la pantalla de listado.
La pantalla de filtros edita un borrador local y, al aplicar, vuelve al
listado con los nuevos parámetros.

**Por qué.** Los filtros describen qué se está viendo, que es estado de
navegación. Guardarlos ahí evita un store, hace que la clave de caché se
derive de ellos de forma natural y dejaría preparados los enlaces profundos.
El borrador local permite salir de la pantalla sin aplicar cambios.

**Coste.** Los filtros se pierden al cerrar la app. Persistirlos sería
guardar esos parámetros, sin cambiar el diseño.

### 17. Sin UI Kit: tokens y componentes base propios

**Decisión.** La interfaz se construye con los primitivos de React Native
sobre tokens de color, espaciado y tipografía (`shared/theme`) y seis
componentes base (`shared/components`).

**Por qué.** Es una restricción del reto, y la forma de cumplirla sin repetir
estilos es tener una única fuente de verdad. Ningún componente escribe un
color o un tamaño de letra a mano, así que cambiar la identidad visual es
cambiar los tokens.

**Coste.** Hay que escribir y mantener los componentes base. React Navigation
no se considera UI Kit: aporta navegación, no componentes visuales.

### 18. Cliente HTTP propio sobre `fetch`

**Decisión.** Una función `getJson` que añade tiempo máximo, cancelación y
convierte cualquier fallo en un `ApiError` clasificado.

**Por qué.** `fetch` no tiene tiempo máximo ni trata un 500 como error. Sin
esa capa, cada llamada tendría que resolverlo por su cuenta. Con `ApiError`,
el resto de la app decide qué mensaje mostrar y si reintentar sin conocer los
detalles de la red.

**Alternativa descartada.** Axios. Resuelve lo mismo, pero para un único
método `GET` es un archivo pequeño propio frente a una dependencia.

### 19. Solo se reintenta lo que puede arreglarse solo

**Decisión.** Hasta dos reintentos automáticos para fallos de red, tiempo de
espera y respuestas 5xx. Nunca para 4xx.

**Por qué.** Un 400 o un 404 darán el mismo resultado por mucho que se
repitan; reintentarlos solo retrasa mostrar el error.

## Pruebas

### 20. Probar el comportamiento en las fronteras

**Decisión.** Tres niveles: tests unitarios del dominio y los casos de uso;
tests de la API levantada en memoria con el repositorio sustituido; y tests de
las pantallas de la app con la capa de API sustituida.

**Por qué.** Los tests de la API ejercitan el pipeline real (enrutado,
validación, serialización, errores), así que comprueban el contrato que
recibe la app, que es lo que más duele romper. Los de las pantallas comprueban
lo que ve la persona y no detalles de implementación. Los dobles están
escritos a mano: con un puerto de dos métodos son más legibles que una
librería de mocks.

**Qué no está cubierto.** El repositorio con Dapper no tiene tests
automáticos, porque necesitan una base de datos real. Se verificó a mano
contra SQL Server. El siguiente paso sería un proyecto de tests de integración
con Testcontainers. Tampoco hay tests de extremo a extremo sobre el emulador.

## Repositorio

### 21. Un solo repositorio para backend, base de datos y app

**Decisión.** Monorepo con `backend/`, `database/`, `mobile/` y `docs/`.

**Por qué.** El contrato de la API y quien lo consume cambian juntos; en un
solo repositorio ese cambio es un único commit revisable.

### 22. Conventional Commits y commits atómicos

**Decisión.** Mensajes con tipo y alcance (`feat(api)`, `fix(db)`,
`test(tasks)`), y cada commit con un único cambio que compila por sí solo.

**Por qué.** El historial se puede leer como un registro de decisiones, y
permite revertir o localizar un cambio concreto sin arrastrar otros.

## Lo que se dejó fuera a propósito

El enunciado excluye la autenticación, el CRUD completo, el despliegue y los
múltiples usuarios. Además, estas piezas se consideraron y se descartaron por
no resolver un problema actual:

| Pieza | Por qué no |
| ----- | ---------- |
| MediatR y CQRS completo | Dos consultas de solo lectura no necesitan un pipeline |
| AutoMapper | Hay dos mapeos de pocas líneas; escritos a mano se leen mejor |
| Patrón *Unit of Work* | No hay escrituras ni transacciones |
| Store global en la app | No hay estado de cliente que compartir |
| Librería de validación en la API | Las anotaciones cubren cuatro parámetros |
| Variables de entorno en la app | Una única URL de desarrollo; se documenta dónde cambiarla |
| CORS | Una app nativa no es un navegador y no lo aplica |
