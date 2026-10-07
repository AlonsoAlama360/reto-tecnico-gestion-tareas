/*
    03_seed.sql
    Datos de prueba. Solo se insertan si la tabla está vacía, así que volver
    a ejecutar el script no duplica tareas.

    El conjunto cubre las nueve combinaciones de estado y prioridad e incluye
    casos límite para la interfaz: una tarea sin descripción, un título largo
    y una descripción extensa.

    Priority: 1 = Low, 2 = Medium, 3 = High
    Status:   1 = Pending, 2 = InProgress, 3 = Completed
*/

USE TaskManagerDb;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Tasks)
BEGIN
    DECLARE @Now DATETIME2(0) = SYSUTCDATETIME();

    INSERT INTO dbo.Tasks (Title, Description, Priority, Status, CreatedAt)
    VALUES
        (N'Renovar el seguro del auto',
         N'Comparar al menos tres aseguradoras antes del vencimiento y revisar si conviene subir la cobertura contra robo.',
         3, 1, DATEADD(HOUR, -3, @Now)),
        (N'Preparar la declaración anual de impuestos',
         N'Reunir los comprobantes de gastos deducibles, descargar las constancias de retención y agendar una cita con la contadora.',
         3, 2, DATEADD(HOUR, -9, @Now)),
        (N'Pagar el recibo de luz',
         N'Vence el día 15. Pagar desde la app del banco y guardar el comprobante.',
         3, 3, DATEADD(DAY, -1, @Now)),
        (N'Agendar chequeo médico anual',
         N'Pedir cita con medicina general y solicitar los análisis de sangre en ayunas.',
         2, 1, DATEADD(DAY, -2, @Now)),
        (N'Ordenar el escritorio y archivar documentos',
         NULL,
         1, 1, DATEADD(DAY, -2, @Now)),
        (N'Estudiar para la certificación de arquitectura en la nube',
         N'Completar los módulos de redes y seguridad, y resolver dos exámenes de práctica por semana.',
         2, 2, DATEADD(DAY, -3, @Now)),
        (N'Comprar el regalo de cumpleaños de mamá',
         N'Le gustó el juego de tazas de cerámica de la tienda del centro.',
         2, 3, DATEADD(DAY, -4, @Now)),
        (N'Llevar la bicicleta a mantenimiento',
         N'Revisar frenos, cambiar la cadena y ajustar el cambio trasero.',
         1, 2, DATEADD(DAY, -5, @Now)),
        (N'Devolver los libros a la biblioteca',
         N'Son tres libros y el plazo vence el viernes.',
         1, 3, DATEADD(DAY, -6, @Now)),
        (N'Reservar el alojamiento y los pasajes para el viaje de fin de año con toda la familia antes de que suban los precios de temporada alta',
         N'Somos seis personas. Buscar una casa con cocina y estacionamiento.',
         3, 1, DATEADD(DAY, -7, @Now)),
        (N'Actualizar el currículum',
         N'Añadir el último proyecto, actualizar las tecnologías y revisar la redacción del resumen profesional.',
         2, 1, DATEADD(DAY, -8, @Now)),
        (N'Reparar la fuga del lavadero',
         N'El sifón gotea. Comprar empaquetaduras nuevas y cinta teflón; si no se soluciona, llamar al gasfitero.',
         3, 2, DATEADD(DAY, -9, @Now)),
        (N'Planificar el menú de la semana',
         N'Definir almuerzos y cenas de lunes a viernes y armar la lista de compras.',
         1, 1, DATEADD(DAY, -10, @Now)),
        (N'Hacer la copia de seguridad del portátil',
         N'Copiar documentos y fotos al disco externo y verificar que la copia en la nube esté al día.',
         2, 3, DATEADD(DAY, -11, @Now)),
        (N'Organizar las finanzas personales del trimestre',
         N'Revisar los movimientos de las tres cuentas, clasificar los gastos por categoría, comparar contra el presupuesto planificado e identificar las suscripciones que ya no se usan. Con ese resultado, ajustar el monto de ahorro mensual, definir un tope para gastos variables y programar las transferencias automáticas al fondo de emergencia. Dejar anotadas las conclusiones para compararlas con el siguiente trimestre.',
         2, 2, DATEADD(DAY, -12, @Now)),
        (N'Renovar el pasaporte',
         N'Sacar cita en línea, pagar la tasa y llevar el pasaporte anterior.',
         3, 3, DATEADD(DAY, -14, @Now)),
        (N'Inscribirse en el gimnasio',
         N'Preguntar por el plan trimestral y los horarios de natación.',
         1, 1, DATEADD(DAY, -16, @Now)),
        (N'Cambiar los focos del pasillo',
         N'Reemplazarlos por focos LED de luz cálida.',
         1, 3, DATEADD(DAY, -18, @Now)),
        (N'Llamar al banco por el cargo no reconocido',
         N'Hay un cargo duplicado en la tarjeta. Tener a la mano la fecha y el monto.',
         3, 1, DATEADD(DAY, -20, @Now)),
        (N'Ordenar las fotos del viaje',
         N'Seleccionar las mejores, borrar duplicados y armar el álbum compartido.',
         1, 2, DATEADD(DAY, -25, @Now));
END
GO
