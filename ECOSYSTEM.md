# Bodega Club — Ecosistema de Proyectos

> Documento de contexto para el trabajo conjunto sobre **La Bodega** (Comercializadora La Bodega, C.A. — panadería + restaurante en Puerto Ordaz, Venezuela).
> Cubre los tres repos que tocamos juntos: `bodega-landing` (público), `bodega-api` (backend) y `bodega-soft-nx` (microfrontends internos).
> Última actualización: 2026-09-24 (feedback v2: specs api 074 · landing 2026-09-24 · nx 068).

---

## 0. Mapa mental rápido

```
                 GUEST (móvil, tras la visita)
                        │  QR / recibo / labodega-ve.com
                        ▼
   ┌─────────────────────────────────────────┐
   │  bodega-landing  (Next.js 16, público)   │  labodega-ve.com
   │  /feedback  → encuesta v2 + queja (caso)  │
   │  /bodega-club, /mi-club, /login (loyalty) │
   │  /dashboard (demo con mock)               │
   └───────────────┬───────────────────────────┘
                   │ POST público (sin sesión), CORS cross-origin
                   │  /feedback/branches · /feedback/catalog · /feedback/surveys · /feedback/incidents
                   │  (Bearer opcional del socio del club)
                   ▼
   ┌─────────────────────────────────────────┐
   │  bodega-api  (NestJS 11, hexagonal)       │  app.bod-service.cloud/api
   │  módulo feedback (059 → 074) + 8 dominios │  PostgreSQL + Prisma 7
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
| `/feedback` | `feedback/feedback-experience.tsx` | **Hub de feedback**: pantalla dividida con dos covers (encuesta / queja). El cover ES la intro: un toque abre el paso 1. `?tab=encuesta` / `?tab=urgente` abren directo |
| `/satisfaccion` | → redirect 307 a `/feedback?tab=encuesta` (`next.config.ts`) | Ruta vieja del QR |
| `/satisfaccion/qr` | `satisfaccion/qr/page.tsx` | Póster QR para impresión (table tent). Codifica `https://labodega-ve.com/feedback` (`survey-url.ts`) |
| `/reportar` | → redirect 307 a `/feedback?tab=urgente` (`next.config.ts`) | Ruta vieja de queja |
| `/bodega-club` | `bodega-club/bodega-club-page.tsx` | Landing del programa de lealtad **Bodega Club** (puntos, recompensas, FAQ) |
| `/mi-club` | `mi-club/mi-club-page.tsx` | Área de socio (puntos, canjes, actividad) — **mock** |
| `/login` | `auth/login-experience.tsx` | Login de socios — **mock** |
| `/dashboard` | `dashboard/dashboard-view.tsx` | "Libro de Sala": panel de satisfacción — **usa `lib/mock.ts`** (el dashboard real vive en nx) |

### Feedback v2 (spec `docs/superpowers/specs/2026-09-24-feedback-v2.md`)
Sin modo standalone: ambos formularios viven solo dentro del split de `/feedback` (`feedback/feedback-split.tsx`), que además guarda lo **precargado** de la queja (puente encuesta → queja).
- `feedback/feedback-catalog.ts` — ⭐ vocabulario: **claves espejo** de `bodega-api/src/feedback/domain/catalog.ts` (canales `dine_in|bakery|takeaway|delivery`, momentos, aspectos + `ASPECTS_BY_CHANNEL`, temas, grupos/categorías de queja) con las etiquetas en español de la landing; helpers de WhatsApp VE (`nationalDigits`, `formatNational`, `toE164`).
- `feedback/wizard.tsx` — shell compartido: progreso, tarjeta con morph de altura, región viva, foco al título al cambiar de paso, `FieldError`, `Notice`.
- `feedback/review-links.ts` — links de reseña en Google Maps por sucursal (**vacíos, TODO**: el botón se oculta mientras falten).

**Encuesta** (`src/components/satisfaccion/`): anónima, 5 pasos `visit → overall → aspects → topics → recommend` + `done` (`survey-data.ts`). Validación por paso (`missingFields`), aspectos según canal (vacíos → `null`), NPS 0–10 (`nps-scale.tsx`, dos filas en 375 px), gracias con puntos del club / nudge "Unirme" / reseña Google (NPS 9–10) / **puente a queja** si nota ≤ 2 o NPS ≤ 6 (`isDetractor`).
- `survey-experience.tsx` (orquestador), `steps.tsx` (pasos + gracias), `chip-group.tsx` (radiogroup con flechas / toggles `aria-pressed`, `labels` por clave), `rating-scale.tsx`, `nps-scale.tsx`, `brand-field.tsx` (hint/error/prefijo), `qr-poster.tsx`, `survey-qr.tsx`, `survey-url.ts`, `motion.ts`.

**Queja** (`src/components/reportar/`): 3 pasos `where → what → contact` (`incident-data.ts`). Cuadro de políticas "Así resolvemos tu queja" (`policies.tsx`, expandido la 1ª vez por dispositivo), categorías agrupadas, banner 911 (alergia/accidente), "¿Sigues en el local?" (salud y seguridad), "Otro" exige texto o audio, WhatsApp `+58` validado (412/414/416/422/424/426), fricción suave sin número si salud/cobro, gracias con **número de caso real** según prioridad. Socio: nombre y WhatsApp prellenados y Bearer en el envío.
- `incident-experience.tsx`, `policies.tsx`, `media-upload.tsx`, `audio-recorder.tsx`.

### Bodega Club (lealtad) — `src/components/bodega-club/` + `mi-club/`
- `club-data.ts` — `REWARDS` (20→180 pts: café, pan, postre, desayuno, premio), `BENEFITS`, `FAQS`, `PREFERENCES`, `BRANCHES`.
- `registration-dialog.tsx` + `submit-registration.ts` — **mock, no persiste** (`ClubRegistrationPayload`). WhatsApp terminado en `0000` fuerza error para QA. ⚠️ **No existe backend de lealtad todavía** (ver §2).
- `mi-club/` — tarjeta de membresía, puntos, tema; datos en `mi-club/data.ts` (mock).

### Capa de datos / backend (`src/lib/`)
- **`feedback-api.ts`** — ⭐ **único punto de contacto con el backend de feedback**. Base: `NEXT_PUBLIC_API_BASE_URL ?? https://app.bod-service.cloud/api`. Al backend viajan **claves** (las de `feedback-catalog.ts`), nunca etiquetas.
  - `fetchBranches()` → `GET /feedback/branches` (caché en memoria). El estado guarda el **id** de la sucursal.
  - `submitSurvey(state, accessToken?)` → `POST /feedback/surveys` JSON `{branchId, channel, moment, overall, recommend, aspects (claves del canal, null = sin puntuar), positiveTopics, negativeTopics, comment?, staffMention?}` → `{id, pointsAwarded}`. Sin nombre ni contacto.
  - `submitIncident(state, media, audio, {surveyId?, accessToken?})` → `POST /feedback/incidents` multipart `{branchId, channel, orderNumber? (delivery), categories (JSON), description?, name?, phone? (E.164), surveyId?, files[]}` → `{id, caseNumber, priority}`.
- **`use-branches.ts`** — hook que puebla los selectores desde `fetchBranches()` (reemplaza la lista hardcodeada).
- **`mock.ts`** — datos simulados del `/dashboard` local.

### Config
- `.env.example`: `NEXT_PUBLIC_API_BASE_URL=https://app.bod-service.cloud/api` (público; si se omite usa prod).
- Docs internas: `PRODUCT.md`, `DESIGN.md` (dirección **pop, día por defecto con modo oscuro**: chips píldora, radios, sombras suaves, springs, covers con foto; paleta oro/coral/crema; Barlow Condensed + Cormorant Garamond), specs en `docs/superpowers/specs/`.
- `shoot.mjs` — capturas Playwright de `/feedback` v2 (375/1280, día/noche) sin enviar nada: `node shoot.mjs <carpeta>` con la landing en :3000.

### Estado del repo
Rama `feat/feedback-v2` (sin push: push a `main` = deploy automático al VPS). Feedback v2 implementado contra la API 074.

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
- `GET /feedback/catalog` → vocabulario (canales con sus aspectos, momentos, temas, grupos de queja con categorías y prioridad, resoluciones, rechazos). Fuente: `domain/catalog.ts` (spec 074).
- `POST /feedback/surveys` → encuesta v2 (`SubmitSurveyResponseDto`); Bearer opcional del socio suma puntos → `{id, pointsAwarded}`.
- `POST /feedback/incidents` → queja con evidencia (multipart `files`, hasta 10); normaliza el WhatsApp a E.164 (400 si no es móvil VE), deriva prioridad y número de caso → `{id, caseNumber, priority}`.

> ⚠️ Spec 074 reescribió el modelo de encuesta/queja (canal, NPS, temas +/-, mención al equipo; queja como **caso** con prioridad, SLA y número). Lo de abajo describe la 059 original; la verdad está en `specs/074-feedback-v2/spec.md` y `openapi.json`.

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
| Vocabulario | claves espejo en `feedback-catalog.ts` | `domain/catalog.ts` → `GET /feedback/catalog` | catálogo |
| Encuesta | `POST /feedback/surveys` (claves, aspectos `null`, NPS) | `SurveyResponse` (074) | resumen/listado 068 |
| Queja | `POST /feedback/incidents` (multipart, `phone` E.164, `surveyId`) | `IncidentReport` como caso (074) + `IncidentMedia` (Cloudinary) | bandeja de casos 068 |

- **Claves:** la landing ya no traduce ES→EN: guarda y envía las claves del backend (`dine_in`, `waitTime`, `fair_price`, `allergic_reaction`…). Las etiquetas en español viven en `bodega-landing/src/components/feedback/feedback-catalog.ts`; si el backend agrega/renombra una clave, se toca ese archivo y `feedback-api.ts`.
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
- **Diseño (landing):** dirección pop oficial (ver `DESIGN.md`): día por defecto + modo oscuro, chips píldora, radios, sombras suaves, springs; `prefers-reduced-motion` obligatorio.
