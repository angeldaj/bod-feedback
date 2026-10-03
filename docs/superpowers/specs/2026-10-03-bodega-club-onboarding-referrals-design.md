# Bodega Club: registro simple, perfil con puntos y referidos

Fecha: 2026-10-03

## Objetivo

Reducir los datos solicitados al crear una cuenta de Bodega Club y convertir
los datos de perfil opcionales en acciones de fidelidad. Añadir códigos de
referidos que recompensen al socio que invita cuando otra persona se registra
y cuando esa persona canjea puntos.

## Diseño aprobado

### Registro

El formulario solicita únicamente correo, nombre de usuario, cédula,
contraseña y confirmación de contraseña. Los cinco datos son obligatorios. La
confirmación se valida en el navegador y nunca se envía a la API. La cédula
continúa admitiendo nacionalidad V/E y de 6 a 9 dígitos.

El enlace de referido lleva el código como parámetro y lo aplica al registro de
forma automática. No se añade un campo de código al formulario. Sin parámetro
de referido, el registro funciona de la misma manera que hoy.

La API actual requiere nombre y WhatsApp en `POST /loyalty/register`. Antes de
lanzar este registro simplificado, el backend debe permitir crear el socio sin
esos dos datos y aceptar el código de referido. El frontend no enviará valores
falsos para completar esos campos.

### Completar perfil

La pantalla Perfil incluirá una sección “Completar perfil” con nombre, WhatsApp,
cumpleaños, sucursal favorita y preferencias. El socio podrá guardar los campos juntos usando `PATCH
/loyalty/me`; el servidor calculará la recompensa por cada campo que pase de
vacío a completo.

Cada uno de esos cinco campos elegibles otorga una recompensa una sola vez por
socio. El servidor debe hacer el otorgamiento idempotente y no volver a premiar
por ediciones posteriores. Las preferencias cuentan como un campo: elegir una
o más preferencias y guardarlas completa ese campo. No se otorgan puntos por
aceptar comunicaciones de marketing, que debe seguir siendo una decisión
voluntaria. Correo, usuario y cédula no dan puntos de perfil porque son datos
del alta.

### Referidos

Cada socio verá un código propio y una acción para compartir un enlace. Al
registrarse mediante ese enlace, el sistema vincula la nueva cuenta al socio
referente. El referente recibe un bono fijo al completarse el registro. Además,
recibe un porcentaje de los puntos que el referido gaste en canjes confirmados.

Como valores provisionales de diseño se usarán **100 puntos por referido
registrado**, **5% de los puntos gastados en cada canje confirmado** y **10
puntos por campo de perfil completado**. El backend debe mantener estos valores
como configuración, para cambiarlos sin publicar de nuevo la landing. Estos
valores son iniciales de producto y se pueden ajustar antes del lanzamiento.

El backend valida códigos y relaciones de referido, impide autorreferidos y
registros duplicados para el mismo bono, y acredita movimientos de puntos. El
porcentaje se calcula sobre los puntos efectivamente descontados al confirmar
el canje, usando una regla de redondeo consistente definida por el backend.

## Datos y responsabilidades

- `POST /loyalty/register`: acepta los datos mínimos, un nombre de usuario
  obligatorio y un código de referido opcional; devuelve la sesión y el bono de
  bienvenida existente.
- `PATCH /loyalty/me`: permite guardar los campos opcionales de perfil. La API
  devuelve el socio actualizado y los puntos de perfil acreditados para poder
  informar el resultado real.
- API autenticada de referidos: entrega el código/enlace propio y el resumen de
  referidos y recompensas acreditadas.
- Registro de canje: acredita al referente el porcentaje solo después de que
  el canje del referido quede confirmado.
- El backend es la fuente de verdad para saldos, elegibilidad, idempotencia,
  porcentajes y reglas antiabuso. El frontend solo presenta las recompensas que
  confirma la API.

Las rutas y nombres exactos para obtener el código de referido y el resumen de
referidos deberán acordarse con el contrato del backend antes de integrarlos.
La API desplegada hoy no expone estas operaciones ni las recompensas de perfil.

## Estados y errores

- El registro muestra errores de duplicado de correo, usuario o cédula
  devueltos por la API, y no crea sesión hasta recibir éxito.
- Un código de referido inválido o vencido produce un error claro; nunca se
  acredita el bono a un socio distinto del indicado por el servidor.
- El perfil distingue datos guardados de puntos efectivamente acreditados. Un
  fallo de guardado no muestra puntos como ganados.
- Si la API no entrega los datos de referidos, el perfil informa que no se
  pudieron cargar y permite reintentar; no inventa códigos ni saldos.

## Experiencia y accesibilidad

La interfaz conserva el idioma y estilo visual actual de Bodega Club. Los
campos de registro tienen etiquetas, validación y estados de envío accesibles.
El campo de contraseña ofrece confirmación y errores asociados. Los enlaces de
referido se pueden copiar y compartir con una etiqueta accesible. Los avisos de
puntos se anuncian al lector de pantalla.

## Verificación

- El registro solo presenta los cinco datos solicitados y valida que ambas
  contraseñas coincidan antes de llamar a la API.
- El alta transmite el código incluido en el enlace sin añadir un campo al
  formulario.
- Completar un campo vacío acredita una vez; volver a guardar o editar no
  genera otro crédito.
- Preferencias se consideran un campo y el consentimiento de marketing nunca
  condiciona puntos.
- El referente recibe el bono de registro y el porcentaje únicamente cuando la
  API confirma sus eventos correspondientes.
- Errores y sesiones existentes siguen el flujo actual de Bodega Club.

## Dependencias

El backend de lealtad debe actualizar registro, perfil, contabilidad de puntos,
canjes y contratos de referidos. El repositorio de la landing no contiene ese
backend. La integración visual puede prepararse contra el contrato acordado,
pero el flujo real no estará completo hasta que el backend publique y despliegue
las operaciones necesarias.
