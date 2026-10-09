# Piloto de recompensas de Instagram para Bodega Club

Fecha: 2026-10-02

## Resumen

Lanzar una campaña piloto que otorgue puntos a socios de Bodega Club por comentar una publicación elegible de la cuenta oficial de Instagram de La Bodega. Mi Club entrega al socio un código único para la campaña. El socio incluye ese código en su comentario; la API recibe el evento de Instagram, valida la campaña y acredita los puntos una sola vez.

El piloto premia comentarios. Likes y shares quedan fuera porque no permiten atribuir de forma fiable una interacción individual a un socio. Los referidos quedan como una posible segunda etapa, medidos por registro o compra atribuible a un enlace.

## Contexto del producto

- La landing ya autentica socios y consume los datos reales del Bodega Club.
- `src/lib/club-api.ts` concentra la integración de Mi Club con la API: tarjeta, Wallet, catálogo de recompensas, ruleta e historial.
- `GET /loyalty/me/timeline` alimenta la actividad. Los movimientos de puntos viven en el backend y el historial muestra compras, canjes y regalos.
- `PointsEntryType` en la API tiene tipos para bono de bienvenida, compra, canje, ajuste, vencimiento y encuesta. La nueva acreditación social necesita una categoría rastreable propia.
- Las campañas y la integración de Instagram deben vivir en `bodega-api`; la landing no debe llamar Graph API ni almacenar sus secretos.

## Objetivo

Permitir que un socio autenticado vea una campaña activa, obtenga un código personal para participar y reciba puntos cuando ese código se detecte en un comentario nuevo de una publicación elegible de Instagram.

## No incluido en el piloto

- Recompensas por likes, shares, seguir la cuenta, etiquetas, historias o publicaciones creadas por socios.
- Premios en vouchers; la campaña otorga puntos. La cantidad de puntos se configura por campaña. Como valor inicial recomendado, usar 10 puntos.
- Automatización de campañas publicitarias o publicación de contenido en Instagram.
- Asociación general de identidad entre las cuentas personales de Instagram y los perfiles del Club. El código es específico para una campaña y sirve para atribuir esa participación.

## Experiencia del socio

1. El socio inicia sesión en Mi Club y encuentra el apartado **Campañas** debajo de la tarjeta de membresía en la pantalla de inicio. Ahí ve la publicación, las instrucciones, el premio, el cierre y las condiciones principales de cada campaña activa.
2. Pulsa **Obtener mi código**. La API crea o devuelve su único código activo para esa campaña, con vencimiento no posterior al cierre.
3. El socio abre la publicación oficial desde Mi Club y comenta el código. La interfaz aclara que el código será visible públicamente porque se escribe en un comentario.
4. Cuando Instagram entrega el evento del comentario y la API lo valida, la campaña pasa a completada y los puntos aparecen en saldo e historial.
5. Si la campaña está cerrada, el comentario no pertenece a una publicación configurada, el código no es válido o el socio ya recibió el premio, no se acreditan puntos. Mi Club muestra un estado comprensible cuando consulta de nuevo.

La tarjeta puede mostrar: título, texto breve, enlace a la publicación, puntos, fecha de cierre, botón para generar/copiar el código, instrucciones y estado (`participa`, `pendiente`, `completada`, `cerrada`). No debe afirmar que el comentario fue validado antes de que el backend lo confirme.

## Reglas de campaña

- Una campaña especifica nombre, texto, valor de puntos, inicio, cierre, estado y una lista de IDs de publicaciones de Instagram elegibles.
- Solo se aceptan comentarios directos nuevos sobre las publicaciones enumeradas. No cuentan respuestas a otros comentarios.
- Cada socio puede obtener un código por campaña y recibir como máximo una acreditación por campaña.
- El código es aleatorio, no secuencial, no contiene el ID del socio y no puede usarse después del cierre. La API conserva un hash para validarlo y muestra el código sin regenerarlo mientras siga activo.
- La acreditación tiene clave de idempotencia por comentario de Instagram y por campaña. Eventos reenviados no repiten el premio.
- La campaña no acredita al instante por el solo hecho de pedir un código. La acreditación ocurre únicamente después de validar el evento externo.
- La cantidad sugerida para el piloto es 10 puntos; debe ser editable al configurar la campaña.
- La campaña no debe emitir puntos por respuestas borradas antes de que Meta entregue/valide el evento. Una vez acreditados, borrar el comentario no revierte el movimiento en el piloto.

## Integración y arquitectura

### Landing (`bodega-landing`)

- Añadir el apartado **Campañas** debajo de la tarjeta de membresía en la pantalla de inicio de Mi Club (`home-screen.tsx`). Mostrarlo solo cuando haya al menos una campaña activa.
- Extender el adapter `club-api.ts` con operaciones tipadas para listar campaña(s) activas y obtener el código personal.
- Refrescar el estado de la tarjeta de campaña después de obtener código y al regresar a Mi Club; mostrar la recompensa solo cuando la API confirme la acreditación.
- Añadir el nuevo movimiento de puntos al historial. Debe leerse como puntos ganados por participar en un reto de Instagram, no como voucher en el Wallet.
- Mantener los tokens de Meta fuera de JavaScript y del navegador.

### Backend (`bodega-api`)

- Agregar persistencia para campañas sociales, códigos/participaciones y eventos de comentario procesados.
- Añadir un tipo de movimiento de puntos que identifique el origen social sin reutilizar `adjust` ni `survey`.
- Crear endpoints de socio con sesión para listar campañas activas y obtener el código de una campaña.
- Crear endpoints administrativos para crear/listar/editar/activar/cerrar campañas y consultar resultados, protegidos por el rol `loyalty.admin`.
- Incorporar un webhook público para el proceso de verificación de Meta y los eventos de comentarios. Validar la firma de los eventos, aceptar solo la cuenta profesional configurada, comprobar la publicación, el código y el estado/fecha de la campaña.
- Procesar de manera transaccional la participación y el movimiento de puntos; usar restricciones únicas para bloquear duplicados y carreras entre eventos repetidos.
- Añadir el movimiento al timeline del socio con una etiqueta y un motivo claros.
- Guardar los secretos de Meta en la configuración segura del backend. Documentar el alta de la app, cuenta profesional, permisos, webhook y suscripción requeridos en el despliegue.

### Administración interna (`bodega-soft-nx/apps/club-web`)

- Añadir una pantalla y entrada de navegación **Campañas**, hermana de **Eventos**, **Obsequios** y **Ruleta**, accesible solo a `loyalty.admin`.
- Permitir administrar título y texto, publicaciones elegibles, enlace público, puntos, fechas de inicio/cierre y estado de campaña.
- En el listado, mostrar códigos emitidos, participaciones validadas y puntos otorgados para revisar el piloto.
- Consumir el contrato de `bodega-api` mediante el cliente generado desde OpenAPI.
- No mostrar ni gestionar secretos de Meta en `club-web`; esos se configuran de forma segura en el backend.

**No reutilizar la pantalla Eventos como editor de campañas sociales.** El `ClubEvent` actual representa anuncios y actividades (`descuento`, `evento`, `cumple`) con título, fecha libre, descripción, sucursal y estado. No modela publicaciones elegibles, códigos por socio ni acreditación de puntos. La propiedad `LoyaltyConfig.campaigns` configura multiplicadores de puntos por fecha/sucursal para compras y tampoco representa campañas sociales. Estas tendrán modelo, endpoints y gestión propios.

### Instagram / Meta

- La cuenta de La Bodega debe ser una cuenta profesional conectada a la app de Meta.
- La app necesita los permisos aprobados para gestionar/recibir comentarios y una suscripción al campo de comentarios.
- La API usa exclusivamente herramientas oficiales de Meta; no se consulta ni automatiza Instagram mediante scraping.
- Meta documenta la API de Instagram para cuentas profesionales y el permiso `instagram_business_manage_comments`; la aprobación y disponibilidad de permisos debe comprobarse al configurar la app. Referencia: [Instagram API with Instagram Login](https://www.postman.com/meta/instagram/folder/6raa77c/instagram-api-with-instagram-login).

## Contrato lógico propuesto

Las rutas exactas se fijarán en la spec contraparte de `bodega-api` y se exportarán en OpenAPI. La superficie requerida es:

- `GET /loyalty/me/social-campaigns` — campañas visibles para el socio y su estado personal.
- `POST /loyalty/me/social-campaigns/:campaignId/code` — obtiene el código idempotente del socio para una campaña activa.
- `GET /loyalty/webhooks/instagram` — verificación de webhook solicitada por Meta.
- `POST /loyalty/webhooks/instagram` — recepción de eventos de comentarios.
- Rutas administrativas para crear/listar/editar/activar/cerrar campañas y consultar resultados, protegidas por `loyalty.admin`.

Respuesta conceptual del código: `campaignId`, `code`, `expiresAt`. Respuesta conceptual de campaña: `id`, `title`, `description`, `postUrl`, `points`, `endsAt`, `status`, `participationStatus`.

## Errores y operación

- Campaña inexistente o cerrada: no generar códigos ni conceder puntos.
- Sesión ausente: endpoints de socio responden como los demás endpoints protegidos del Club.
- Error de Meta o evento incompleto: registrar fallo operativo y permitir reintento; nunca acreditar parcialmente.
- Evento repetido: responder correctamente a Meta, sin duplicar puntos.
- Código incorrecto o usado: no otorgar; registrar únicamente la información mínima necesaria para diagnóstico y limitar intentos.
- Límite de solicitudes para obtener códigos por socio y campaña para evitar abuso.
- Si el webhook está temporalmente caído, Meta debe poder reintentar; la idempotencia por ID de comentario mantiene el saldo consistente.

## Privacidad y controles contra abuso

- No pedir la contraseña de Instagram ni tokens del socio.
- Explicar que el código publicado es visible en el comentario. El código aleatorio, su corta vigencia, el límite de un premio por socio y campaña y la deduplicación reducen abuso, pero un código compartido antes de usarse puede ser reclamado por otra persona. Este límite se acepta en el piloto; monitorizar incidencias antes de escalar.
- Guardar únicamente los metadatos de comentario necesarios para auditar la participación y detener duplicados; documentar retención en la spec backend.
- La publicación oficial debe explicar las condiciones, el premio, el plazo y cómo se acreditan los puntos. La promoción debe seguir los términos aplicables de Instagram y la normativa local.

## Medición del piloto

Registrar, sin almacenar contenido innecesario del comentario:

- socios que solicitaron código;
- comentarios validados y puntos acreditados;
- códigos expirados/no utilizados;
- eventos rechazados por duplicado, campaña cerrada o publicación no elegible;
- incidencias de atribución;
- participación que termina en una visita/compra, si la integración existente permite medirla de forma agregada.

Evaluar al cerrar la campaña: tasa de uso de códigos, coste en puntos, nuevos socios/visitas atribuibles y volumen de errores. Decidir luego si se repite, ajusta el premio o se agrega un piloto de referidos.

## Criterios de aceptación

- Un socio autenticado puede ver campaña y condiciones, obtener su código y copiarlo.
- Un evento válido en una publicación elegible acredita el valor configurado una sola vez.
- Reintentar el mismo webhook, reclamar el código otra vez o procesar comentarios repetidos no vuelve a acreditar.
- Comentarios en publicaciones no configuradas, campañas fuera de plazo y códigos vencidos no acreditan puntos.
- El socio ve el estado de participación y el movimiento correcto en el timeline.
- El apartado Campañas aparece debajo de la tarjeta de membresía en la pantalla de inicio y se oculta si no hay campañas activas.
- Un usuario con `loyalty.admin` puede crear, editar, activar, cerrar y consultar resultados desde Campañas en `club-web`; otros roles no pueden administrar campañas ni mediante la UI ni llamando a la API.
- Eventos y multiplicadores de puntos por compras permanecen separados de las campañas sociales.
- La actividad social no aparece como voucher en Wallet ni como compra.
- Los webhooks inválidos no pueden alterar saldos.
- Los tokens y secretos de Meta permanecen exclusivamente en el backend.
- La cuenta profesional y la app de Meta pueden probarse en un entorno de prueba antes de activar una campaña real.

## Límites y decisiones pendientes para el plan

- Confirmar en el entorno real de Meta qué permisos y revisión de app están disponibles para la cuenta profesional de La Bodega.
- Fijar endpoint, esquema de eventos y estrategia de reintentos según la versión de Graph API habilitada en la app.
- Fijar la política de retención concreta para IDs de comentario y códigos vencidos.
- Elegir campaña inicial, publicación elegible, fechas y valor final de puntos; 10 puntos es solo el valor inicial sugerido.
- El trabajo es una feature vertical coordinada entre `bodega-api`, `bodega-soft-nx` y `bodega-landing`; el backend debe entregar OpenAPI antes de cablear sus clientes.

## Estado de implementación (2026-10-09)

- **Backend** → `bodega-api/specs/087-club-social-campaigns` (el número 078 se
  reasignó). Código `BC-XXXXXX` guardado en claro (se publica en un comentario
  y Mi Club debe volver a mostrarlo; un hash no protegía nada), webhook con
  firma `X-Hub-Signature-256`, un premio por socio y campaña.
- **club-web** → `bodega-soft-nx/apps/club-web/specs/074-club-social-campaigns`.
- **Landing**: apartado *Campañas* debajo de la tarjeta en Inicio
  (`components/mi-club/social-campaigns.tsx`), adapter en `lib/club-api.ts`
  (`listSocialCampaigns`, `requestSocialCode`), refresco al volver a la
  pestaña con aviso cuando el backend confirma los puntos, y movimiento
  `social` en Actividad (filtro *Instagram*). El apartado se muestra si la API
  devuelve campañas: vigentes, o recién cerradas en las que el socio
  participó, para que vea cómo terminó. En `/club-mock`, *Perfil → Simular*
  incluye «Validar comentario en Instagram».
- Pendiente: alta de la app de Meta y prueba con un comentario real.
