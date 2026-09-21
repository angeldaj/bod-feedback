# Bodega Club — Ecosistema de Proyectos

> Documento de contexto para el trabajo conjunto sobre **La Bodega** (Comercializadora La Bodega, C.A. — panadería + restaurante en Puerto Ordaz, Venezuela).
> Cubre los tres repos que tocamos juntos: `bodega-landing` (público), `bodega-api` (backend) y `bodega-soft-nx` (microfrontends internos).
> Última actualización: 2026-09-21.

---

## 0. Mapa mental rápido

```
                 GUEST (móvil, tras la visita)
                        │  QR / recibo / labodega.com
                        ▼
   ┌─────────────────────────────────────────┐
   │  bodega-landing  (Next.js 16, público)   │  labodega.com
   │  /feedback  → encuesta + queja urgente    │
   │  /bodega-club, /mi-club, /login (loyalty) │
   │  /dashboard (demo con mock)               │
   └───────────────┬───────────────────────────┘
                   │ POST público (sin sesión), CORS cross-origin
                   │  /feedback/branches · /feedback/surveys · /feedback/incidents
                   ▼
   ┌─────────────────────────────────────────┐
   │  bodega-api  (NestJS 11, hexagonal)       │  app.bod-service.cloud/api
   │  módulo feedback (spec 059) + 8 dominios  │  PostgreSQL + Prisma 7
   │  auth JWT (cookie httpOnly), RBAC         │  Cloudinary, MarSoft, Pushover, IA
   └───────────────┬───────────────────────────┘
                   │ GET/PATCH internos (cookie de sesión, roles feedback.*)
                   ▼
   ┌─────────────────────────────────────────┐
   │  bodega-soft-nx  (Nx 23, React/Vite)      │  bod-service.cloud (single-origin proxy)
   │  feedback-web → dashboard interno /feedback│
   │  + 9 apps más (recepcion, admin, ventas…) │
   └─────────────────────────────────────────┘
```

**Regla de oro del flujo feedback:** la **landing envía** (POST público), el **backend persiste**, el **dashboard nx lee/gestiona** (GET/PATCH con rol). La landing y el dashboard nx comparten origen distinto al backend en la landing (cross-origin) pero mismo origen en nx (proxy).

---

## 1. `bodega-landing` — Frontend público (este repo)

**Ruta:** `C:\Users\angel\Project\bodega-landing` · **Stack:** Next.js **16.3.4** (App Router), React 19, TypeScript 5, Tailwind v4, shadcn + Base UI, `motion` (animaciones), `recharts`, `react-qr-code`, Playwright.

> ⚠️ **Next.js 16 tiene breaking changes** respecto a lo conocido. `AGENTS.md` obliga a leer `node_modules/next/dist/docs/` antes de escribir código Next. El bloque de agente en `AGENTS.md` lo re-genera `next dev`; commitearlo con el trabajo mantiene el árbol limpio.

### Propósito
Superficie pública de La Bodega. Empezó como `/satisfaccion` (encuesta) y creció a landing completa + Bodega Club (lealtad).

### Rutas (`src/app/`)
| Ruta | Componente | Qué es |
| --- | --- | --- |
| `/` | `landing/landing.tsx` | Landing de marketing del restaurante/panadería |
| `/feedback` | `feedback/feedback-experience.tsx` | **Hub de feedback**: pestañas *opinión* (encuesta) / *urgencia* (queja). Split con fotos de portada |
| `/satisfaccion` | → redirect a `/feedback` | Ruta vieja del QR; se conserva por compatibilidad |
| `/satisfaccion/qr` | `satisfaccion/qr/page.tsx` | Póster QR para impresión (table tent) |
| `/reportar` | → redirect a `/feedback?tab=urgente` | Ruta vieja de queja |
| `/bodega-club` | `bodega-club/bodega-club-page.tsx` | Landing del programa de lealtad **Bodega Club** (puntos, recompensas, FAQ) |
| `/mi-club` | `mi-club/mi-club-page.tsx` | Área de socio (puntos, canjes, actividad) — **mock** |
| `/login` | `auth/login-experience.tsx` | Login de socios — **mock** |
| `/dashboard` | `dashboard/dashboard-view.tsx` | "Libro de Sala": panel de satisfacción — **usa `lib/mock.ts`** (el dashboard real vive en nx) |

### Módulo de satisfacción (`src/components/satisfaccion/`)
Wizard de **7 estados en una sola tarjeta**: `intro → overall → visit → aspects → issues → contact → done` (`survey-data.ts` `STEPS`).
- `survey-experience.tsx` — orquestador/estado del wizard.
- `steps.tsx` — render de cada paso (iconos lucide por aspecto/momento, copy en pregunta).
- `chip-group.tsx` — chips single/multi (soporta `icons` por opción y `checkOnSelected`).
- `rating-scale.tsx` — medidor de relleno acumulativo (overall 88×88, aspectos 38×38).
- `survey-data.ts` — tipos y datos: `SurveyState`, `ASPECTS` (comida/servicio/ambiente/tiempo), `MOMENTOS`, `TEMAS`. `SUCURSALES` es placeholder — las reales vienen del backend.
- `brand-field.tsx`, `brand-logo.tsx`, `qr-poster.tsx`, `survey-qr.tsx`, `survey-url.ts`, `motion.ts`.

### Módulo de queja/urgencia (`src/components/reportar/`)
`incident-experience.tsx`, `incident-data.ts` (`IncidentState`, `MediaItem`), `media-upload.tsx`, `audio-recorder.tsx` (nota de voz).

### Bodega Club (lealtad) — `src/components/bodega-club/` + `mi-club/`
- `club-data.ts` — `REWARDS` (20→180 pts: café, pan, postre, desayuno, premio), `BENEFITS`, `FAQS`, `PREFERENCES`, `BRANCHES`.
- `registration-dialog.tsx` + `submit-registration.ts` — **mock, no persiste** (`ClubRegistrationPayload`). WhatsApp terminado en `0000` fuerza error para QA. ⚠️ **No existe backend de lealtad todavía** (ver §2).
- `mi-club/` — tarjeta de membresía, puntos, tema; datos en `mi-club/data.ts` (mock).

### Capa de datos / backend (`src/lib/`)
- **`feedback-api.ts`** — ⭐ **único punto de contacto con el backend real**. Base: `NEXT_PUBLIC_API_BASE_URL ?? https://app.bod-service.cloud/api`.
  - `fetchBranches()` → `GET /feedback/branches` (con caché en memoria).
  - `resolveBranchId(name)` — el wizard guarda **nombre**; se traduce a `id` antes de enviar.
  - `submitSurvey(state)` → `POST /feedback/surveys`. **Traduce claves ES→EN**: `comida→food, servicio→service, ambiente→ambiance, tiempo→waitTime`; `momento→visitMoment`, `temas→topics`, etc.
  - `submitIncident(state, media, audio)` → `POST /feedback/incidents` (multipart `files`, hasta la nota de voz con extensión por MIME).
- **`use-branches.ts`** — hook que puebla los selectores desde `fetchBranches()` (reemplaza la lista hardcodeada).
- **`mock.ts`** — datos simulados del `/dashboard` local.

### Config
- `.env.example`: `NEXT_PUBLIC_API_BASE_URL=https://app.bod-service.cloud/api` (público; si se omite usa prod).
- Docs internas: `PRODUCT.md`, `DESIGN.md` (tema **nocturnal**, oro sobre casi-negro, radio 0, sin sombras, Barlow Condensed + Cormorant Garamond), `docs/superpowers/specs/2026-09-14-bodega-club-design.md`.
- `shoot.mjs` — script Playwright de capturas.

### Estado del repo
Branch `main`. Cambios sin commitear en el módulo satisfacción (`chip-group.tsx`, `steps.tsx`, `survey-data.ts`) y `shoot.mjs`: iconos por opción/momento, copy en forma de pregunta, chips con check, micro-animaciones. PRs previos: feedback wiring (envío real + selector de sucursal desde BD).

---

## 2. `bodega-api` — Backend (NestJS, hexagonal)

**Ruta:** `C:\Users\angel\Project\bodega-api` · **Nombre:** `la-bodega-api` · **Prod:** `app.bod-service.cloud/api`
**Stack:** NestJS 11 (Express), TypeScript 5.7, **pnpm**, **Prisma 7 + PostgreSQL**, JWT+passport (cookie httpOnly), Swagger (`/docs`, `openapi.json`), `@nestjs/schedule`/`event-emitter`, Cloudinary, IA (Anthropic/Gemini/LlamaExtract).

### Arquitectura
**Spec-driven**: cada feature en `specs/NNN-feature/` (spec → plan → tasks); 68+ specs. `AGENTS.md` + `specs/constitucion/` = convenciones no-negociables. Cada módulo es **hexagonal**:
```
domain/          # entidades + reglas puras (sin Nest/Prisma)
application/      # use-cases/ (una acción = un caso de uso) · ports/ (interfaces) · services/
infrastructure/   # adapters: prisma/, marsoft/, fakes/, storage
interface/http/   # controllers + DTOs + view mappers
<feature>.module.ts  # wiring: provide PORT → useClass Adapter
```
Wiring raíz: `src/main.ts` (bootstrap, CORS, cookie-parser, body 32 MB, Swagger) y `src/app.module.ts` (2 guards globales).

**Dominios:** `auth`, `catalog` (proxy MarSoft), `invoices` (facturas + extracción IA), `bank-reconciliation`, `notifications` (Pushover), `production` (inventario diario), `planning`, `sales`, **`feedback`**, `shared`.

### Módulo `feedback` (spec 059) — el relevante
Ubicación: `src/feedback/`. Reusa `FILE_STORAGE_PORT` de invoices → `CloudinaryStorageAdapter` para evidencia.

**Endpoints públicos** (`@Public()`, anónimos — `PublicFeedbackController`, base `/feedback`):
- `GET /feedback/branches` → sucursales activas (para selectores de la landing).
- `POST /feedback/surveys` → encuesta (`SubmitSurveyResponseDto`).
- `POST /feedback/incidents` → queja con evidencia (multipart `files`, hasta 10).

**Endpoints internos** (cookie + rol — `FeedbackDashboardController`, base `/feedback`):
- `GET /feedback/surveys` (`feedback.viewer`/`admin`) — filtros from/to/branchId.
- `PATCH /feedback/surveys/:id` (`feedback.admin`) — togglea `resolved`.
- `GET /feedback/incidents` (`viewer`/`admin`) — filtros + status.
- `PATCH /feedback/incidents/:id` (`admin`) — status `open → in_progress → resolved`.

**Modelo de datos** (`prisma/schema.prisma` ~1417–1515, migración `20260918110109_add_feedback_module`):
- `Branch` (`branches`): id uuid, name único, active, createdAt.
- `SurveyResponse` (`survey_responses`): branchId, overall (1–5), visitMoment, aspectFood/Service/Ambiance/WaitTime (1–5), topics `String[]`, comment, name, contact, **resolved** (default false), createdAt.
- `IncidentReport` (`incident_reports`): branchId, problems `String[]`, description, name, contact, **status** (default open), createdAt.
- `IncidentMedia` (`incident_media`): incidentId (cascade), kind (image|video|audio), fileStorageKey (Cloudinary, server-only), fileUrl, fileName, mimeType, sizeBytes.
- Enums: `IncidentStatus` (open|in_progress|resolved), `IncidentMediaKind` (image|video|audio).
- ⚠️ Existe además `SalesIncident` en el módulo `sales` — **no confundir** con quejas de feedback.

**Reglas:** `application/feedback-limits.ts` (rating 1–5, límites de texto, sanitize de tags), `incident-media.constants.ts` (MIME aceptados; caps: imagen/audio 15 MB, video 100 MB, máx 10 archivos).
**Sucursales:** catálogo local (no MarSoft), sembrado como placeholders **"Bodega 1/2/3"** (`prisma/seed.ts` ~línea 114) hasta tener las reales.

### Auth / RBAC
- `POST /auth/login` → JWT en **cookie httpOnly** (`ACCESS_TOKEN_COOKIE`, 7 días, sameSite lax, secure en prod, `SESSION_COOKIE_DOMAIN` para subdominios). Logout limpia cookie. `GET /me`.
- Guards globales: `JwtAuthGuard` → `RolesGuard`. `@Public()` exime (login + feedback público).
- Roles `<módulo>.<rol>` en `src/auth/domain/role-keys.ts` (`feedback.viewer`, `feedback.admin`, …). Asignación **manual** (spec 035); el sync de directorio (MarSoft) ya **no** otorga roles.

### Entorno / integraciones
`DATABASE_URL` (Postgres, puerto local 5460), `JWT_SECRET`/`JWT_EXPIRES_IN`/`SESSION_COOKIE_DOMAIN`, `SWAGGER_*`, `CLOUDINARY_*` (facturas + evidencia de quejas comparten cuenta), IA (`EXTRACTION_PROVIDER`, `ANTHROPIC_API_KEY`, `GEMINI_*`, `LLAMAEXTRACT_*`), `MARSOFT_API_*` (SQL Server legacy vía marsoft-api), `PUSHOVER_APP_TOKEN`, `EXCHANGE_RATE_API_URL` (DolarAPI BCV).
Externos: **PostgreSQL, MarSoft/marsoft-api, Cloudinary, Anthropic, Gemini, LlamaCloud, Pushover, DolarAPI**.

### Cómo se corre
`pnpm start:dev` (watch, puerto 3000; README usa 5000 local). DB: `pnpm db:migrate` / `db:migrate:deploy` / `db:seed`. `pnpm openapi:export`. Docker: `Dockerfile`, `docker-compose.yml`; CI corre `prisma migrate deploy` antes de levantar la API.

### ⚠️ Nota clave
**No existe módulo de lealtad / Bodega Club en el backend** (grep sin resultados). El registro del club en la landing es mock. Si "Bodega Club" es la feature a construir, el backend hay que crearlo desde cero (probablemente nueva spec `NNN-loyalty/`).

---

## 3. `bodega-soft-nx` — Microfrontends internos (Nx monorepo)

**Ruta:** `C:\Users\angel\Project\bodega-soft-nx` · **Prod:** `bod-service.cloud` (single-origin)
**Stack:** **Nx 23.1.0**, Node 24, **npm workspaces**. Apps en **React 19 + Vite** (mayoría) y **Next.js** (`bank-reconciliation-web`, `comandas-web`). TypeScript ~6, Vitest (jsdom), ESLint 9. Cliente API generado con **Orval** desde el `openapi.json` compartido.

> ⚠️ **NO usa Module Federation.** "Microfrontend" = **reverse proxy single-origin** con prefijo de path por app (Node `http-proxy` en dev, nginx en prod). Cada app es un SPA/Next independiente. Sin host/remote ni carga runtime entre apps; navegación entre módulos es full-page. `AGENTS.md` es el doc autoritativo (`CLAUDE.md` está vacío).

### Apps (`apps/`)
| App | Framework | Prefijo | Qué es |
| --- | --- | --- | --- |
| `platform-shell` | React+Vite | `/` | Login + selector de módulos (spec 029) |
| `recepcion-web` | React+Vite | `/recepcion` | Recepción de mercancía/facturas |
| `bank-reconciliation-web` | **Next.js** | `/conciliacion` | Conciliación bancaria (demo, SSR role checks) |
| `admin-web` | React+Vite | `/admin` | Usuarios y roles; sync desde MarSoft |
| `produccion-web` | React+Vite | `/produccion` | Hoja de inventario diario (spec 041) |
| `planificacion-web` | React+Vite | `/planificacion` | Planificación (scaffolding, spec 048) |
| `ventas-web` | React+Vite | `/ventas` | Ventas diarias por sucursal (spec 054) |
| **`feedback-web`** | React+Vite | `/feedback` | **Dashboard de feedback** (spec 059) — ver abajo |
| `comandas-web` | **Next.js** | subdominio propio | Comandas de restaurante (isla: backend propio, NextAuth, WS, no usa `libs/ui`) |

### Libs (`libs/`)
- `la-bodega-contracts` — `openapi.json` del backend; **única fuente Orval** (`npm run contracts:sync`).
- `platform-auth` — `roles.ts` (constantes + `canAccess*`/`canManage*`), `modules.ts` (`PLATFORM_MODULES`, drivea el selector del shell).
- `ui` — primitivas compartidas + tema Tailwind "Artisanal Heritage". (No lo usan conciliacion ni comandas.) Regla: nada de `<input type="date">` nativo; usar el date picker compartido.
- No hay `data-access`/`utils` dedicados: cada app tiene su `src/lib/api/{generated.ts, mutator.ts}` (Orval por-app).

### `feedback-web` — dashboard interno (spec 059)
Dashboard **autenticado de solo lectura/gestión** bajo `/feedback`. Consume el módulo feedback del backend. **La landing envía; esto lee.**
- `src/main.tsx` — `BrowserRouter basename="/feedback"` + React Query.
- `src/app/app.tsx` — gate de sesión (sin sesión → redirect al shell `/?returnTo=...`).
- `src/app/routes.tsx` — si `!canAccessFeedback(user)` → `AccessDeniedPage`; si no, `DashboardPage` en `AppShell`. **Página única, sin sub-rutas.**
- `src/pages/dashboard-page.tsx` — 2 tabs (`libs/ui` Tabs): **Satisfacción** (default) y **Quejas**. Estado de filtros (from/to/branchId + status).
- `src/components/satisfaction.tsx` — KPIs (avg overall, respuestas, promotor/detractor, alertas), charts (tendencia, pie por momento, distribución, radar de aspectos, barras por sucursal), muro de comentarios.
- `src/components/incidents.tsx` — quejas con evidencia (img/video/audio); admin cambia status.
- `src/lib/feedback/queries.ts` — `useBranches`, `useSurveys`, `useIncidents`, `useResolveSurvey`, `useSetIncidentStatus` (React Query).
- `src/lib/feedback/aggregations.ts` — **agregaciones client-side** (el backend devuelve registros crudos): `computeKpis`, `ratingDistribution`, `aspectAverages`, `momentCounts`, `topicCounts`, `recentWithComments`, `overTime`, `bySucursal`, `alertResponses`. *(Portadas desde `lib/mock.ts` de la landing.)*
- `src/lib/api/mutator.ts` — `API_BASE_URL = VITE_API_BASE_URL ?? '/api'`, `credentials: 'include'` (cookie de sesión compartida). `generated.ts` — cliente Orval completo.
- Acceso: `canAccessFeedback` = cualquier rol `feedback.*`; `canManageFeedback` = `feedback.admin`.

### Cómo se corre
`npm run dev` (proxy :4200, `scripts/dev.mjs` — **excluye feedback y comandas**). Feedback se corre aparte: `npm run dev:feedback` (`nx serve feedback-web`, :4307). `npm run api:generate` (Orval), `contracts:sync`. Prod: `Dockerfile` (nginx estático por app) + `docker-compose.prod.yml`.
- ⚠️ **Discrepancia:** `scripts/dev.mjs`/`dev-proxy.mjs` no rutean `/feedback` en dev (aunque prod nginx sí lo incluye). Correr feedback standalone en dev.

---

## 4. Contrato compartido & puntos de integración

**El pegamento entre los tres repos es el módulo `feedback` del backend** y su `openapi.json`:

| Concepto | Landing (envía) | Backend (persiste) | Dashboard nx (lee) |
| --- | --- | --- | --- |
| Sucursales | `GET /feedback/branches` (`feedback-api.ts`) | `Branch` / `list-branches` | `useBranches` |
| Encuesta | `POST /feedback/surveys` (traduce ES→EN) | `SurveyResponse` | `useSurveys` + `PATCH resolved` |
| Queja | `POST /feedback/incidents` (multipart) | `IncidentReport`+`IncidentMedia` (Cloudinary) | `useIncidents` + `PATCH status` |

- **Claves ES↔EN:** la landing usa español (`comida/servicio/ambiente/tiempo`, `momento`, `temas`), el backend/DTO inglés (`food/service/ambiance/waitTime`, `visitMoment`, `topics`). La traducción vive en `bodega-landing/src/lib/feedback-api.ts`.
- **Sucursales placeholder:** landing (`SUCURSALES`, `BRANCHES`) y backend seed comparten "Bodega 1/2/3" — **pendiente sustituir por las reales** en un solo lugar (backend) ya que la landing las trae por API.
- **`openapi.json`** es la fuente: backend lo exporta (`pnpm openapi:export`) → se copia a `libs/la-bodega-contracts` → Orval regenera clientes nx. Si cambia el contrato feedback, tocar: backend DTO → export → `contracts:sync` → `api:generate`, y a mano `bodega-landing/src/lib/feedback-api.ts`.
- **Auth:** endpoints públicos de feedback = sin sesión (CORS). Dashboard nx = cookie httpOnly compartida same-origin + rol `feedback.*`.

### Bodega Club (lealtad) — estado
- Landing: páginas y registro **mock**, sin persistencia (`submit-registration.ts`).
- Backend: **no existe** módulo de lealtad.
- nx: no hay app de lealtad.
- ➡️ Si la feature es "Bodega Club" real, implica **nueva spec + módulo backend + wiring de la landing** (y quizá área de socio real reemplazando el mock de `/mi-club` y `/login`).

---

## 5. Convenciones a respetar

- **Next 16 (landing):** leer `node_modules/next/dist/docs/` antes de escribir Next; no borrar el bloque de agente de `AGENTS.md` del diff.
- **Backend:** spec-driven — features nuevas van como `specs/NNN-*/` (spec→plan→tasks), respetar hexagonal + `specs/constitucion/`. Tablas/columnas en inglés vía `@@map`.
- **nx:** Orval genera clientes (no editar `generated.ts` a mano); date picker compartido, no `<input type=date>`; `AGENTS.md` es el doc guía.
- **Copy (landing):** español de Venezuela, voz de maître d'; el copy es final salvo indicación.
- **Diseño (landing):** tema nocturnal, oro sobre casi-negro, radio 0, sin sombras, `prefers-reduced-motion` obligatorio.
