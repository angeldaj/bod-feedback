# Verificación manual de comentarios de TikTok

Fecha: 2026-11-23

## Objetivo y flujo aprobado

El socio solicita la verificación después de comentar su código en TikTok, mediante el botón «Verificar mi comentario» de la campaña en Mi Club. Las extracciones de comentarios dejan de iniciarse por una programación automática. Instagram conserva su flujo actual.

## Estado actual comprobado

- `social-campaigns.tsx` muestra la participación por red, pero no ofrece una acción de verificación.
- `club-provider.tsx` consulta el listado cada cinco segundos y al recuperar la visibilidad mientras una campaña está pendiente. Estas lecturas no son solicitudes de extracción.
- `bodega-api` dispone de `POST /loyalty/admin/social-campaigns/:id/tiktok-sync`, reservado a administradores. No existe todavía un endpoint equivalente para socios.
- `TikTokSyncCron` programa extracciones, procesa trabajos y concilia costes. Eliminar todo el cron impediría procesar las solicitudes manuales.
- `TIKTOK_SYNC_AUTOMATIC_ENABLED` controla la programación y vale `false` por defecto; no se ha comprobado el valor desplegado.

## Interfaz

Mostrar el botón en la fila de TikTok cuando la campaña esté activa, exista código y la participación de TikTok esté pendiente. Ocultarlo para participaciones completadas, campañas pausadas o cerradas, y antes de obtener el código.

Explicar: «Comenta tu código en el video y luego verifica tu comentario». Durante la solicitud mostrar «Verificando…», deshabilitar el botón y comunicar el progreso con un estado accesible.

La extracción es asíncrona. Una solicitud aceptada significa que la verificación está en curso, no que el comentario fue encontrado. Consultar el estado del trabajo únicamente después de una solicitud manual, con espera entre consultas y un límite temporal. Si el usuario se marcha, el procesamiento continúa en el backend. Si agota la espera, mostrar «La verificación sigue en curso. Puedes revisar el resultado más tarde».

Al terminar, actualizar las campañas. Si el backend confirma puntos nuevos, actualizar saldo e historial y usar la celebración existente. Si no encuentra el comentario, informar que revise el código y vuelva a intentar más tarde. Un error de conexión no debe mostrarse como comentario inexistente.

## Contrato de backend propuesto

Añadir `POST /loyalty/me/social-campaigns/:id/tiktok-sync` y una consulta del trabajo bajo la misma ruta de socio. Autenticar mediante `MemberAuthGuard` y derivar la identidad de la sesión.

Validar campaña activa, TikTok habilitado y código propio pendiente. Reutilizar la cola y las reglas de presupuesto, deduplicación por video y acreditación idempotente existentes. No pasar el identificador del socio como identificador de un administrador. Exponer al socio solo el identificador y estado del trabajo y el resultado de su propia participación; no datos de otros socios ni presupuestos administrativos.

Reutilizar un trabajo activo del mismo video y aplicar un intervalo mínimo de un minuto entre nuevas extracciones del video, validado en servidor, para evitar solicitudes duplicadas desde distintos navegadores. Conservar los límites diarios existentes.

Retirar la llamada a `schedule()` del cron para que no se inicien extracciones periódicas aunque una instalación conserve la variable de automatización activada. Mantener `work()` y `reconcileCosts()` y la solicitud manual administrativa. Ajustar el estado administrativo para que no anuncie automatización activa.

## Lecturas de Mi Club

Las participaciones pendientes exclusivamente de TikTok no activan el sondeo general de cinco segundos ni la consulta al recuperar visibilidad. Las pendientes de Instagram sí lo mantienen. En campañas mixtas, evaluar el estado de cada red; completar Instagram debe detener su sondeo aunque TikTok continúe pendiente.

Las lecturas iniciales y la recarga explícita siguen mostrando los puntos acreditados por el servidor. El modo demo debe implementar el nuevo contrato sin llamar a TikTok ni a la API real.

## Alcance y orden

El cambio requiere `bodega-landing` y `bodega-api`. Antes de modificar el backend se prepararán su spec, plan y tareas conforme a su `AGENTS.md`. Desplegar primero el endpoint del backend y después el botón de la landing. No se incluye un despliegue ni un cambio de configuración de producción en esta tarea.

## Validación prevista

- Interfaz: visibilidad del botón según red, campaña, código y estado; bloqueo durante la solicitud; mensajes de progreso, error y resultado.
- Integración: el botón inicia una sola solicitud manual; TikTok pendiente no genera sondeo periódico; Instagram mantiene su actualización.
- API: sesión requerida, código propio obligatorio, rechazo de campañas no elegibles, deduplicación e intervalo mínimo en servidor y privacidad de respuestas.
- Procesamiento: solicitud aceptada sin acreditación prematura, acreditación sin duplicados, saldo actualizado al confirmar y ausencia de nuevas extracciones por programación.
- Ejecutar las pruebas relevantes, lint y build de ambos proyectos antes de dar por terminada la implementación.

## Implementación y validación

Implementado el 2026-11-23. API en `develop`, commit `be1a9da`, incluyendo la integración TikTok de la spec 158 que aún faltaba en esa rama. La solicitud del socio reutiliza los trabajos activos y exige un minuto entre nuevas extracciones del mismo video. El worker sigue procesando solicitudes manuales y conciliando costes, sin programar extracciones.

La landing muestra la acción solo con código y participación pendiente de TikTok. Consulta el trabajo aceptado con un límite de cinco minutos y cancela las lecturas al abandonar la tarjeta. El saldo y la celebración dependen de la confirmación del backend.

Validación: builds de Next.js y NestJS, exportación OpenAPI y lint sin errores; 272 pruebas de loyalty y 7 pruebas de landing pasan, incluidas dos de navegador y revisión visual móvil. Se omitieron seis pruebas de Postgres porque no hay base aislada configurada. No se ejecutaron migraciones ni despliegues; publicar primero la API.


## Overlay de verificación — 2026-11-25

Al pulsar «Verificar mi comentario», Mi Club muestra el overlay
«Verificando Comentarios» mientras espera la consulta y el procesamiento.
Usa el diálogo accesible y los temas existentes del club, con indicador de carga
que respeta movimiento reducido y el aviso de que puede tardar unos minutos.
«Ocultar aviso» cierra únicamente el diálogo: la consulta continúa y el botón
sigue bloqueado para impedir duplicados. Al terminar o fallar se retira el overlay
y se conserva el resultado del flujo existente, incluida la celebración de puntos.

- [x] Overlay ligado al estado real de verificación y reiniciado en cada intento.
- [x] Cierre manual sin cancelar la verificación y cierre automático al finalizar.
- [x] TypeScript y lint de los archivos modificados sin errores.
- [x] Siete pruebas sociales correctas, incluidas las pruebas de navegador.
- [x] Revisión visual en móvil de 390 px con movimiento reducido, sin desbordamiento.
