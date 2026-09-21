# Bodega Club: conexión con el backend real

Fecha: 2026-09-21

> Reemplaza el mock del club (registro, `/login`, `/mi-club`) por la conexión real
> con `la-bodega-api`. Contrapartes → `bodega-api/specs/069-club-loyalty` y
> `070-club-engagement-encuesta`, gateway `marsoft-api/specs/036`, y la app de
> caja/administración `bodega-soft-nx/apps/club-web/specs/064`.
> Antecedente → [`2026-09-14-bodega-club-design.md`](./2026-09-14-bodega-club-design.md)
> (el diseño que hoy está mockeado).
>
> **Next.js 16**: leer `node_modules/next/dist/docs/` antes de escribir código; no
> borrar el bloque de agente de `AGENTS.md` del diff. Copy final en español
> (voz de maître d'), diseño nocturnal (oro sobre casi-negro, radio 0, sin
> sombras, `prefers-reduced-motion` obligatorio).

## Resumen

Hoy el club es una demostración: el registro (`submit-registration.ts`) no
persiste, `/login` acepta cualquier credencial y empuja a `/mi-club`, y
`/mi-club` pinta datos de `mi-club/data.ts`. Esta spec cablea todo eso al backend
real: registro que crea un socio, login con sesión **Bearer**, y área de socio
que lee saldo, actividad, recompensas y canjes reales. Es el equivalente para el
club de lo que `feedback-api.ts`/`use-branches.ts` ya hicieron para la encuesta.

## Contexto / motivación

El backend del club (módulo `loyalty`, specs 069/070) expone la identidad del
socio, el saldo de puntos alimentado por MarSoft, el catálogo de recompensas y el
canje. La landing ya tiene toda la UI construida y mockeada; falta la capa de
datos y de sesión. **Hoy la landing no tiene ningún manejo de token/sesión** (una
búsqueda de `token|cookie|Authorization|localStorage` solo encuentra el tema
claro/oscuro): es superficie greenfield.

Decisión de arquitectura ya tomada (ver 069): el socio usa **token Bearer**
(access + refresh), no cookie, porque la landing (`labodega.com`) es cross-site
respecto a la API (`app.bod-service.cloud`) y la cookie de terceros es frágil.

## Objetivos

- **Registro real**: crear un socio vía `POST /loyalty/register` con los campos
  obligatorios nuevos (**cédula, correo, contraseña**, además de nombre y
  WhatsApp que ya existen).
- **Login real** (`/login`) con **cédula / correo / usuario + contraseña** y
  sesión Bearer persistente; recuperación de contraseña por correo.
- **`/mi-club` con datos reales**: perfil, saldo, nivel, actividad (compras +
  movimientos), catálogo de recompensas y **canje** (pide → recibe código/QR).
- **Identificación del socio en la encuesta**: si hay sesión, `submitSurvey`
  manda el Bearer para que la respuesta sume puntos y quede vinculada (070).
- **Adapter único** `src/lib/loyalty-api.ts`, espejo de `feedback-api.ts`, como
  único punto de contacto con los endpoints del club.

## Alcance del programa

Qué de `/mi-club` se cablea a un endpoint real y qué se difiere en esta primera
conexión (el backend v1 no lo provee — se mantiene el mock marcado o se oculta):

| Pieza del mock (`mi-club/data.ts`) | Fuente real | Estado |
|---|---|---|
| `MEMBER` (nombre, cédula, nº socio, tier, contacto, homeBranch) | `GET /loyalty/me` | **Real** |
| `POINTS.balance` / `lifetime` | `GET /loyalty/me` | **Real** |
| `PURCHASES` (actividad) | `GET /loyalty/me/activity` | **Real** |
| Movimientos de puntos | `GET /loyalty/me/activity` | **Real** |
| `REWARDS` (catálogo + "alcanzable") | `GET /loyalty/me/rewards` | **Real** |
| Canje (botón "Canjear") | `POST /loyalty/me/redemptions` → código/QR | **Real** |
| `MEMBER.qrValue` (QR/identificación) | `GET /loyalty/me/qr` | **Real** |
| Nivel (tier) + progreso a próxima recompensa | derivado de `/me` + `/rewards` | **Real** |
| `EVENTS` (agenda) | `GET /loyalty/events` (070) | **Real** |
| Buzón de notificaciones + preferencias | `GET/PATCH /loyalty/me/notifications*` (070) | **Real** |
| `POINTS.thisMonth`, `POINTS_SERIES` (gráfico mensual) | derivable de la actividad | **Real si el back lo entrega; si no, derivar en el cliente** |
| `HIGHLIGHTS` (visitas del mes, **racha**, ahorro) | — | **Diferido** (racha no existe en v1; ocultar o derivar lo derivable) |
| `MOST_FREQUENT` ("tu clásico") | derivable de las compras importadas | **Diferido salvo que se derive en el cliente** |
| Editar datos de cuenta ("Guardar cambios") | `PATCH /loyalty/me` | **Real** |

## Sesión y almacenamiento del token

- Login/registro devuelven **access token (15 min)** + **refresh token (30 días)**.
- **Access token en memoria**; **refresh token en `localStorage`** (sobrevive
  recargas). Se asume el riesgo XSS que implica Bearer en SPA (mitigado con access
  corto + refresh rotado); alternativa descartada: cookie de terceros (frágil en
  Safari/Chrome).
- Un **contexto de sesión** (`MemberSessionProvider` + `useMember()`) carga el
  refresh al arrancar, obtiene un access, y expone `member`, `login`, `logout`,
  `register`. El wrapper `authedRequest` agrega `Authorization: Bearer` y, ante
  `401`, intenta **un** refresh y reintenta; si falla, limpia sesión y manda a
  `/login`.
- `/mi-club` queda **protegida**: sin sesión válida redirige a `/login?returnTo=…`.

## Componentes y arquitectura

```
src/lib/
  loyalty-api.ts          # NUEVO. Adapter del club (espejo de feedback-api.ts):
                          #   register, login, refresh, logout, requestPasswordReset,
                          #   confirmPasswordReset, getMe, updateMe, getActivity,
                          #   getRewards, requestRedemption, listRedemptions, getQr,
                          #   getEvents, getNotifications, markNotificationRead,
                          #   updateNotificationPreferences
  member-session.tsx      # NUEVO. Contexto de sesión + useMember() + authedRequest
                          #   (Bearer, auto-refresh en 401, storage del refresh)
src/components/bodega-club/
  registration-dialog.tsx # + nacionalidad+cédula, correo, contraseña (obligatorios)
  submit-registration.ts  # → llama loyalty-api.register (deja de ser mock)
src/components/auth/
  login-experience.tsx    # → loyalty-api.login real; recuperación real; quita fake
src/components/mi-club/
  mi-club-page.tsx        # consume useMember()/hooks; reemplaza imports de data.ts
  use-member-data.ts      # NUEVO. Hooks de carga (me/activity/rewards/events/notif)
  data.ts                 # queda solo para tipos/labels; datos vienen del back
src/lib/feedback-api.ts   # submitSurvey acepta Bearer opcional del socio logueado
```

## Formulario de registro

**Campos obligatorios (nuevos + existentes):** nombre, **nacionalidad (V/E) +
cédula**, WhatsApp, **correo**, **contraseña**. Reusar el normalizador de cédula
que ya vive en `login-experience.tsx` (`/^[VE]?\d{6,9}$/`).
**Campos opcionales:** usuario, cumpleaños, sucursal favorita, preferencias.
**Consentimientos:** uso de datos (obligatorio), marketing (opcional).

Cambios: extender `ClubRegistrationPayload`, `EMPTY_FORM`, `FieldErrors` y
`validate()`; agregar los `Input` con su `aria-describedby`. El envío llama
`loyalty-api.register` y, al éxito, **inicia sesión** (guarda tokens) y puede
llevar a `/mi-club`. Se conserva la pantalla de bienvenida con el bono real
(el backend acredita 50 pts de bienvenida — mostrar el valor que devuelva).

## Flujo de datos

- **Registro** → `POST /loyalty/register` → tokens → sesión iniciada.
- **Login** → `POST /loyalty/auth/login` (identificador + contraseña) → tokens.
- **Recuperar** → `POST /loyalty/auth/password-reset/request` (por correo) y
  `/confirm`.
- **Área de socio** → `GET /loyalty/me`, `/me/activity` (dispara sync on-demand en
  el back), `/me/rewards`, `/loyalty/events`, `/me/notifications`.
- **Canje** → `POST /loyalty/me/redemptions` → muestra código/QR para caja.
- **Encuesta** → `submitSurvey` agrega `Authorization: Bearer` si hay sesión
  (identifica y suma puntos; anónima si no).
- Traducción ES↔EN (si aplica) vive **solo** en `loyalty-api.ts`, igual que en
  `feedback-api.ts`.

## Estados y errores

- Registro: duplicado (cédula/correo/usuario) → mensaje claro del backend; lista
  negra → mensaje de acercarse a la tienda; validación de campos como hoy.
- Login: credenciales inválidas, cuenta no encontrada; estados de carga.
- Área de socio: carga (skeleton), error con reintento, sesión vencida →
  refresh transparente o, si falla, `/login`.
- Canje: sin saldo suficiente, recompensa inactiva; mostrar el código y su
  vencimiento (24 h).
- Todo respeta la voz de maître d' y el copy final en español.

## Accesibilidad

WCAG 2.1 AA (igual que el resto de la landing). Campos nuevos con `label`,
`aria-invalid`, `aria-describedby`; foco visible dorado; el diálogo mantiene el
manejo de foco actual. QR con texto alternativo/numero de socio visible. Estados
de carga/errores anunciados por `aria-live`. Reduced-motion mantenido.

## Responsive

Sin cambios de layout salvo los campos nuevos del registro (que deben caber en el
grid actual del diálogo). `/mi-club` conserva su rejilla; los datos reales pueden
variar en cantidad (paginar/limitar la actividad como hoy hace `slice`).

## SEO y metadata

Sin cambios: `/mi-club` y `/login` siguen siendo privadas/no indexables de facto;
metadata actual se mantiene.

## Verificación

- [ ] Registro real crea el socio; duplicado y lista negra muestran su mensaje.
- [ ] Tras registrarse, la bienvenida muestra el bono real y queda sesión iniciada.
- [ ] Login con cédula, correo **y** usuario + contraseña funciona; credencial
      inválida falla; recuperación por correo dispara el flujo real.
- [ ] `/mi-club` muestra saldo, nivel, actividad, recompensas reales; sin sesión
      redirige a `/login`.
- [ ] El access vencido se refresca transparente; si el refresh falla, va a `/login`.
- [ ] Pedir un canje devuelve un código/QR con su vencimiento; el saldo disponible
      baja por la reserva (sin descontar hasta que caja confirme).
- [ ] La encuesta enviada por un socio logueado suma puntos (verificable en
      `/mi-club`); la anónima sigue funcionando.
- [ ] `npm run build`/`lint` en verde. No se rompió el flujo público de feedback.
- [ ] Piezas diferidas (racha, "tu clásico" si no se deriva) ocultas o marcadas,
      no mostrando datos mock como si fueran reales.

## Capacidades requeridas para implementación

`impeccable` / `design-taste-frontend` para mantener el pulido nocturnal al
extender el diálogo y el área de socio sin romper el sistema visual.

## Preguntas abiertas / a coordinar

- Contrato exacto de `loyalty-api.ts` sale del `openapi.json` del backend (069/070)
  una vez implementado; esta spec asume las rutas de esas specs.
- Confirmar si el backend entrega `thisMonth`/serie mensual y "tu clásico" en
  `/me/activity`, o si se derivan en el cliente desde las compras.
