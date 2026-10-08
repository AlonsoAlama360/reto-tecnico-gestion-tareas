# Escalabilidad, seguridad y casos límite

Este documento separa tres cosas: lo que la solución ya hace, lo que no hace
y por qué, y lo que habría que añadir si el proyecto creciera. No se
implementó nada "por si acaso"; cada punto pendiente indica qué lo
justificaría.

- [Escalabilidad](#escalabilidad)
- [Seguridad](#seguridad)
- [Casos límite](#casos-límite)

## Escalabilidad

### Lo que ya está resuelto

| Aspecto | Cómo |
| ------- | ---- |
| La API no guarda estado | Cualquier instancia puede atender cualquier petición, así que escala horizontalmente detrás de un balanceador sin cambios |
| Conexiones | Se abre una conexión por operación y se devuelve al pool de ADO.NET; no hay conexiones retenidas entre peticiones |
| Todo el acceso es asíncrono | Los hilos no quedan bloqueados esperando a la base de datos, y las peticiones canceladas por el cliente se cancelan también en SQL Server |
| Paginación en la base de datos | La API nunca carga más de 100 filas por petición, sea cual sea el tamaño de la tabla |
| Índices para los filtros | Los filtros por estado y prioridad se resuelven con índices que cubren la consulta |
| El listado no trae la descripción | La columna más pesada solo viaja en el detalle |
| Caché en la app | Volver a un filtro o a un detalle ya visitado no repite la petición durante 30 segundos |
| Lista virtualizada | La app solo monta las tarjetas visibles y no vuelve a pintar las ya mostradas al cargar otra página |
| Comprobación de salud | `/health` verifica la base de datos, para que un orquestador retire una instancia que no puede atender |

### Límites conocidos y cuándo importarían

| Límite | Cuándo duele | Qué se haría |
| ------ | ------------ | ------------ |
| La paginación por desplazamiento recorre las filas anteriores | Páginas muy profundas en tablas de millones de filas | Paginación por cursor sobre `(CreatedAt, Id)`, que el índice ya soporta |
| `COUNT(*)` en cada petición | Tablas muy grandes con filtros poco selectivos | Devolver solo "hay más" en lugar del total exacto, o cachear el total |
| `OPTION (RECOMPILE)` compila en cada ejecución | Miles de peticiones por segundo | SQL dinámico parametrizado, que reutiliza un plan por combinación de filtros |
| La API no cachea respuestas | Muchas lecturas repetidas de los mismos datos | Caché de salida o `ETag` con respuestas 304 |
| Una sola base de datos | La lectura satura la instancia | Réplicas de lectura: al ser un servicio de solo consulta, es un cambio de cadena de conexión |
| Sin límite de peticiones | API expuesta a internet | Limitador de peticiones por cliente, disponible en ASP.NET Core |

### Crecimiento del código

- **Nueva funcionalidad en el backend:** un caso de uso nuevo en
  `Application` y, si necesita datos, un método en el puerto. Los existentes
  no se modifican.
- **Nuevo filtro:** un parámetro opcional en el procedimiento, una propiedad
  en `GetTasksQuery` y en `GetTasksRequest`, y una entrada en `TaskFilters` en
  la app.
- **Nueva feature en la app:** una carpeta en `features/` que reutiliza
  `shared/`, y sus rutas compuestas en el navegador raíz.
- **Múltiples usuarios:** una columna `UserId` en `Tasks` como primera columna
  de los índices, un parámetro `@UserId` obligatorio en los procedimientos, y
  el identificador tomado del token, nunca de la petición.

## Seguridad

La autenticación queda fuera del alcance del reto, así que la API es abierta.
Dentro de ese alcance, esto es lo que se cuidó.

### Lo que ya está resuelto

| Riesgo | Mitigación |
| ------ | ---------- |
| Inyección SQL | Todo el acceso pasa por procedimientos almacenados con parámetros tipados; no se concatena SQL en ningún punto |
| Entrada no válida | Los filtros solo aceptan valores del enum, y la paginación tiene límites (`page` hasta 100000, `pageSize` hasta 100). El procedimiento repite esos límites por si se invoca desde otro cliente |
| Petición diseñada para ser cara | El tamaño de página y el desplazamiento están acotados, de modo que no se puede pedir la tabla entera ni forzar un recorrido arbitrario |
| Fuga de información en los errores | Las respuestas de error no incluyen mensajes de excepción, trazas ni nombres de servidor; el detalle solo va al log. Hay tests que lo comprueban |
| Credenciales en el repositorio | La cadena de conexión está en *user secrets* o variables de entorno, y la contraseña de Docker en un `.env` que no se versiona |
| Tráfico sin cifrar | La API redirige a HTTPS fuera de desarrollo. La app solo permite HTTP en la compilación de depuración; la de publicación lo bloquea |
| Superficie de la API | Solo expone lecturas. Swagger y el documento OpenAPI solo se publican en desarrollo |
| Datos corruptos | Las restricciones `CHECK` impiden valores fuera de dominio, y el repositorio falla de forma explícita si aun así lee uno |

### Lo que falta y habría que añadir antes de producción

| Pendiente | Detalle |
| --------- | ------- |
| Autenticación y autorización | Tokens JWT emitidos por un proveedor de identidad, y filtrado por usuario dentro de los procedimientos. Hoy cualquiera que alcance la API ve todas las tareas |
| Usuario de base de datos con privilegios mínimos | El entorno de Docker usa `sa` por simplicidad. En producción, un usuario con permiso de `EXECUTE` solo sobre los dos procedimientos y sin acceso directo a las tablas |
| Límite de peticiones | No hay protección contra abuso por volumen |
| Certificado de servidor | Las cadenas de conexión de ejemplo usan `TrustServerCertificate=true`, válido solo en local. En producción hay que validar el certificado |
| Almacenamiento seguro en la app | Hoy no guarda nada sensible. Con autenticación, el token iría en el almacén seguro del sistema (Keychain o Keystore), no en almacenamiento plano |
| Dependencias | `npm audit` reporta avisos que, hasta donde se revisó, provienen de dependencias transitivas de las herramientas de compilación y test de React Native (`braces`, `sprintf-js`), no del código que se ejecuta en el dispositivo. Conviene revisarlos al actualizar React Native |

## Casos límite

Cómo responde la solución ante entradas y situaciones poco habituales. La
columna de verificación indica cómo se comprobó cada uno.

### API y base de datos

| Caso | Comportamiento | Verificación |
| ---- | -------------- | ------------ |
| Filtro con un valor que no existe (`status=foo`, `status=9`) | 400 indicando el campo | Test |
| Filtros en minúsculas o mayúsculas (`status=inprogress`) | Se aceptan | Test |
| `page=0`, `pageSize=0`, `pageSize=101`, `page=abc` | 400 indicando el campo | Test |
| Página más allá de la última | 200 con lista vacía y el total correcto | Manual |
| Número de página enorme | La API lo limita; el procedimiento calcula el desplazamiento en `BIGINT` para no desbordar | Test y manual |
| Filtro sin coincidencias | 200 con lista vacía y total 0 | Test |
| Identificador inexistente | 404 | Test |
| Identificador 0 o negativo | 404 sin consultar la base de datos | Test |
| Identificador no numérico o fuera del rango de `INT` | 404 | Test |
| Tarea sin descripción | `description` llega como `null` explícito | Test |
| Dos tareas con la misma fecha de creación | El `Id` desempata, así que el orden es estable entre páginas | Manual |
| Fechas | Se guardan y se envían en UTC, con sufijo `Z` | Test |
| Base de datos caída | 503 sin detalle interno, y `/health` responde no saludable | Test y manual |
| Excepción inesperada | 500 sin detalle interno | Test |
| El cliente cancela la petición | Se cancela también la consulta, sin registrar un error | Revisión de código |
| Falta la cadena de conexión | El servicio no arranca y lo indica | Manual |
| Los scripts SQL se ejecutan dos veces | No duplican datos ni fallan | Manual |

### App móvil

| Caso | Comportamiento | Verificación |
| ---- | -------------- | ------------ |
| Primera carga | Indicador de carga con etiqueta accesible | Test |
| Sin tareas y sin filtros | "No tienes tareas" | Test |
| Filtros sin coincidencias | "Sin resultados" con botón para limpiar los filtros | Test |
| Sin conexión o servidor caído en la primera carga | Mensaje específico y botón "Reintentar"; los filtros siguen accesibles | Test y emulador |
| Falla la carga de la página siguiente | Se conservan las tareas mostradas y se ofrece reintentar al pie | Test |
| El servidor no responde | La petición se aborta a los 10 segundos | Test |
| La respuesta no es JSON válido | Se trata como error, sin romper la pantalla | Test |
| El detalle de una tarea que ya no existe | "Tarea no encontrada" y volver al listado, sin opción de reintentar | Test |
| Se llega al final de la lista sin más páginas | No se hacen más peticiones | Test |
| Título muy largo | Se corta a dos líneas en la tarjeta y se muestra completo en el detalle | Emulador |
| Descripción muy larga | El detalle se desplaza | Emulador |
| Tarea sin descripción | "Esta tarea no tiene descripción." | Test y emulador |
| Se sale de los filtros sin aplicar | El listado no cambia | Test |
| Se abandona una pantalla con una petición en curso | La petición se cancela | Revisión de código |
| Zonas del sistema (barra de gestos) | El contenido respeta los márgenes seguros | Emulador |

### Lo que no se probó

- La app en iOS: el proyecto incluye la carpeta `ios`, pero no se compiló.
- La app en un dispositivo físico.
- El comportamiento con miles de tareas: los datos de prueba son 20.
- El repositorio de acceso a datos no tiene tests automáticos (ver
  [decisiones.md](decisiones.md#pruebas)).
