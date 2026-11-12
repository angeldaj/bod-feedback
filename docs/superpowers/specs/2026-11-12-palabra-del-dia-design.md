# Palabra del día: wordle de la bodega

Fecha: 2026-11-12

> Diseño global acordado en sesión de brainstorming del 2026-11-12. Construye
> sobre el libro de puntos de Bodega Club.
> Contrapartes a escribir: spec `bodega-api` y spec
> `bodega-soft-nx/apps/club-web` (lista de palabras y estadísticas).
>
> **Orden de entrega:** prototipo HTML → spec api → landing + club-web.
> **Next.js 16:** leer `node_modules/next/dist/docs/` antes de escribir código.
> `prefers-reduced-motion` obligatorio.
> Diseño hermano: `2026-11-12-bodingo-design.md`.

## Resumen

Wordle clásico con vocabulario de La Bodega: **5 letras, 6 intentos, la misma
palabra para todos**, nueva cada medianoche (America/Caracas). Acertar da
puntos BC y mantener la racha da bonos. Se puede compartir el resultado, y
quien llega por el enlace sin cuenta juega como invitado y se le invita a
unirse al club.

## Decisiones cerradas

| Tema | Decisión |
|---|---|
| Mecánica | 5 letras, 6 intentos, 🟩 letra en su lugar / 🟨 en otro lugar / ⬛ no está. |
| Día | Corte a las 00:00 America/Caracas. Número de juego correlativo (#42). |
| Premios | +5 pts por acertar; +25 al llegar a 7 días seguidos; +100 a los 30. Todo configurable en NX. Racha = días consecutivos **acertados**; no jugar o fallar la reinicia. |
| Palabras | Lista mixta cargada en NX: bodega, comida y cultura venezolana + comunes de relleno. Pista temática opcional por palabra. |
| Elección diaria | Palabra con fecha fija si la hay; si no, una al azar sin usar; agotada la lista, la usada hace más tiempo. |
| Validación de intentos | Diccionario de español de 5 letras incluido en bodega-api (+ las de la lista). Acentos ignorados, Ñ es letra propia. |
| Compartir | Botón "Compartir" (hoja nativa o copiar): `Palabra Bodega #42 · 4/6 🔥12` + cuadritos + enlace a `/palabra`. |
| Invitados | Juegan sin puntos (progreso en `localStorage`) y al final: "Si fueras socio habrías ganado +5 pts — únete a Bodega Club". Los puntos no se acreditan después. |

## Modelo de datos (módulo `loyalty`)

- **`WordEntry`**: `word` (normalizada, 5 letras), `hint?`, `scheduledFor?`
  (fecha), `usedOn?`, `active`.
- **`DailyWord`**: `date` (único, día Caracas), `number`, `entryId`. Se crea en
  la primera consulta del día o con cron a medianoche (lo que llegue primero,
  con clave única en `date`).
- **`WordPlay`**: `memberId`, `date`, `guesses` (string[]), `solved`,
  `attempts`. Único por (socio, día).
- **`WordStreak`**: `memberId`, `current`, `best`, `lastSolvedDate`.
- Puntos al libro con motivos `word_daily` y `word_streak`, clave única por
  (socio, día, tipo): nunca se acreditan dos veces.
- Diccionario: archivo dentro de bodega-api (~10k palabras de 5 letras).
- Configuración (puntos por acierto, bonos y umbrales de racha) editable en NX.

## API

Socio (Bearer):

- `GET /loyalty/me/word/today` → `number`, `hint`, intentos evaluados, `solved`,
  `finished`, racha (`current`, `best`), `nextAt`, y `word` **solo si el juego
  terminó**.
- `POST /loyalty/me/word/guesses` `{ guess }` → 422 si no son 5 letras o no está
  en el diccionario (no consume intento); 409 si ya terminó. Evalúa en servidor
  (letras repetidas bien resueltas: primero verdes, luego amarillos hasta agotar
  las ocurrencias). Al acertar acredita +5 y los bonos que correspondan; al sexto
  fallo devuelve la palabra.

Público (sin token):

- `GET /loyalty/word/today` → `number`, `hint`, `nextAt`.
- `POST /loyalty/word/guess` `{ guess, attempt }` → evalúa sin guardar; con
  `attempt = 6` fallido devuelve la palabra. Límite de pedidos por IP.

Admin (club-web): CRUD de `WordEntry` (alta una por una o pegando muchas),
fijar fecha/pista, configuración de puntos, estadísticas por día (jugadores,
aciertos, distribución de intentos).

## Landing

- **`/palabra`** (pública, destino del enlace compartido): con sesión del club
  juega como socio; sin sesión, modo invitado + invitación final.
- **`/mi-club/palabra`** + **`/club-mock/palabra`**: la misma pantalla dentro
  del club. Adaptador en `club-api.ts` (`getWordToday`, `submitWordGuess`).
- Cuadrícula 6×5 con volteo de fichas, teclado en pantalla con Ñ que colorea
  las letras probadas, también acepta teclado físico.
- Al terminar: racha 🔥, cuenta regresiva a la próxima palabra, "Compartir".
- Tarjeta en Inicio: "Palabra del día · 🔥 12 días" o "✓ Resuelta en 4".

## Pruebas

- bodega-api: evaluación con letras repetidas (p. ej. `PASTA` vs `SALSA`);
  corte de día en Caracas; racha seguida, rota y bono que no se repite;
  idempotencia de puntos; normalización de acentos y Ñ; elección diaria
  (fija > azar sin usar > la más antigua).
- landing: mock que cubre en juego / acertado / fallado / invitado en
  `/club-mock/palabra`.
