# Bodingo: bingo semanal de Bodega Club

Fecha: 2026-11-12

> Diseño global (visión de los tres repos) acordado en sesión de brainstorming
> del 2026-11-12. Construye sobre Bodega Club v2 (`bodega-api/specs/075-club-v2`,
> Bodega Wallet) y el patrón de la ruleta (077).
> Contrapartes a escribir: spec `bodega-api` (contrato, primero) y spec
> `bodega-soft-nx/apps/club-web` (configuración y ediciones).
>
> **Orden de entrega:** prototipo HTML (pantalla en venta / en vivo / ¡Bodingo!)
> → spec api → landing + club-web en paralelo.
> **Next.js 16:** leer `node_modules/next/dist/docs/` antes de escribir código.
> `prefers-reduced-motion` obligatorio.
> Diseño hermano: `2026-11-12-palabra-del-dia-design.md`.

## Resumen

Todos los domingos a las 7 PM (configurable) se juega **Bodingo** en línea desde
mi-club. Los socios compran **cartones con puntos BC** (máx. 3 por edición). El
servidor canta las bolas en vivo y marca los cartones solo. Se juega **solo
cartón completo**; el premio (cena, almuerzo…) se entrega como **voucher
`GRANT`, `origin=bodingo`** en la Bodega Wallet y se cobra en caja con el flujo
075 existente.

## Decisiones cerradas

| Tema | Decisión |
|---|---|
| Dónde se juega | En línea, desde mi-club. Espectadores sin cartón pueden mirar. |
| Ganador | Automático: el servidor detecta el primer cartón completo y deja de cantar. El ganador tiene **30 s** para tocar "¡Bodingo!"; si no lo toca, se canta solo. Gana igual: el botón es para el momento, no condición del premio. |
| Empate | Todos los cartones completados con la misma bola ganan el **premio completo** (un voucher cada uno). |
| Cartones por socio | Máximo **3** por edición. Generados al azar al comprar; no se cambian. |
| Ediciones | **Calendario fijo** (domingo 19:00 por defecto) que autogenera la próxima edición copiando una plantilla. Desde NX: editar cada edición, cancelarla ("este domingo no se juega"), crear ediciones extra en días especiales, pausar/cambiar el calendario. |
| Venta | Abre al publicarse la edición y cierra a `startsAt`. |
| Arranque | La primera bola sale a `startsAt + 45 s` para dar tiempo a conectarse. En esos 45 s mi-club muestra "Arrancamos en 0:45 · X jugadores en la mesa". |
| Mínimo de jugadores | Si a `startsAt` no se llega, la edición se **cancela sola** y se devuelven los puntos. |
| Cartón | 75 bolas, 5×5, columnas B-I-N-G-O, centro libre con el logo de La Bodega. |
| Ritmo | Segundos entre bolas configurable por edición, default **15 s** (~15 min de juego). |
| Ganador visible | Nombre + inicial ("María G.") + avatar del club si tiene. |
| Premio | Voucher `origin=bodingo`, vigencia configurable por edición, default **30 días**. |

## Arquitectura: secuencia sorteada al inicio, revelada por reloj

Al pasar a `live`, el servidor sortea la secuencia completa de 75 bolas
(`crypto.randomInt`) y la guarda, pero **nunca la envía entera**. La bola *n*
(1-based) se revela cuando `now ≥ startsAt + 45 s + (n − 1) × intervalo`. Como cartones
y secuencia ya se conocen, se calcula de una vez `winningBallIndex` (primera
bola con la que algún cartón queda completo) y
`endsAt = startsAt + 45 s + (winningBallIndex − 1) × intervalo + 30 s`.

- Sin proceso vivo que cante bolas: un reinicio del servidor no afecta la
  partida, todo se deriva del reloj.
- Auditable: la secuencia queda guardada y se muestra en NX al terminar.
- Cliente consulta por polling (cada 3 s en `live`). SSE se puede sumar después
  sin cambiar el modelo.

Descartados: proceso que empuja cada bola por SSE (frágil ante reinicios,
conexiones largas en el proxy) y WebSockets (más infraestructura sin
beneficio a una bola cada 15 s).

## Modelo de datos (módulo `loyalty`)

- **`BodingoSchedule`**: `weekday`, `time`, `active`, `publishDaysBefore`
  (default 7) y plantilla: `prizeTitle`, `prizeImageUrl`, `prizeVoucher`
  (kind/value como plantillas 075), `cardPricePoints`, `minPlayers`,
  `ballIntervalSeconds`, `voucherValidityDays`.
- **`BodingoEdition`**: copia de la plantilla (editable) + `source`
  (`schedule`|`manual`), `publishAt`, `startsAt`, `status`, `drawSequence`
  (int[75], nulo hasta `live`), `winningBallIndex`, `endsAt`.
- **`BodingoCard`**: `editionId`, `memberId`, `numbers` (24 ints, por columna,
  sin el centro), `pointsSpent`, `idempotencyKey`. Pago = débito en el libro de
  puntos (aparece en el timeline).
- **`BodingoWinner`**: `editionId`, `cardId`, `memberId`, `voucherId`,
  `claimedAt` (nulo si se cantó solo), `nameShown`. Una fila por cartón ganador.
- `VoucherOrigin` suma `bodingo`.

### Estados de `BodingoEdition`

```
scheduled ──(publishAt)──▶ on_sale ──(startsAt, ≥ mín.)──▶ live ──(endsAt)──▶ finished
    │                         │
    └──(equipo cancela)───────┴──(equipo cancela · startsAt sin mínimo)──▶ cancelled
```

- `live`: se sortea `drawSequence` y se fijan `winningBallIndex` y `endsAt`.
- `finished`: se emiten los vouchers de todos los ganadores y sus `BodingoWinner`.
- `cancelled`: reembolso de cada cartón (un movimiento de puntos por cartón).
- Reglas de edición: premio y foto editables en `on_sale`; el precio no cambia
  después del primer cartón vendido (si hay que cambiarlo: cancelar, reembolsar,
  crear otra). Desde `live` no se cancela: solo termina.

## API

Socio (Bearer):

- `GET /loyalty/me/bodingo/current` → próxima edición o la que está en curso:
  `status`, premio, `startsAt`, `cardPricePoints`, `playersCount`, cartones del
  socio, `drawn` (solo bolas ya reveladas según el reloj del servidor),
  `serverNow`, `ballIntervalSeconds`, y en `live` con ganador / `finished`:
  ganadores (`nameShown`, avatar) y si el socio es uno de ellos
  (`myWin: { claimDeadline, claimedAt, voucherId }`).
- `POST /loyalty/me/bodingo/cards` (header de idempotencia, como la ruleta) →
  compra 1 cartón. 409 si: venta cerrada, ya tiene 3, puntos insuficientes.
- `POST /loyalty/me/bodingo/claim` → registra `claimedAt`. Solo si el socio
  tiene un cartón ganador y la ventana de 30 s sigue abierta. No afecta el premio.

Público (sin token):

- `GET /loyalty/bodingo/current` → lo mismo sin cartones ni `myWin` (espectador
  y tarjeta de la landing).

Admin (club-web): CRUD de `BodingoSchedule`, listar/crear/editar/cancelar
ediciones, ver cartones/jugadores, ver `drawSequence` solo en `finished`.

## Tareas programadas

Un cron cada minuto en `loyalty/infrastructure/scheduling/`, idempotente:

1. Crear ediciones faltantes desde el calendario.
2. `scheduled → on_sale` al llegar `publishAt`.
3. A `startsAt`: si hay mínimo → `live` + sorteo; si no → `cancelled` + reembolso.
4. A `endsAt`: `finished` + vouchers.

Si el servidor estuvo caído, la siguiente corrida completa lo pendiente.
Reembolsos y vouchers con clave única por cartón: nunca salen dobles.

## Antitrampa y consistencia

- La secuencia no existe antes de cerrar la venta: nadie puede conocerla.
- La API nunca devuelve bolas futuras; manipular el reloj del teléfono no sirve.
- Compra en transacción: débito de puntos + cartón + chequeo del máximo de 3 con
  bloqueo de fila por (socio, edición). Dos toques no cobran doble ni crean un cuarto.
- Siempre hay ganador, a más tardar en la bola 75.

## Landing (mi-club)

Ruta `/mi-club/bodingo` + `/club-mock/bodingo`, adaptador en `club-api.ts`
(`getBodingo`, `buyBodingoCard`, `claimBodingo`).

1. **En venta**: premio con foto, cuenta regresiva (con `serverNow`), "X
   jugadores en la mesa", "Comprar cartón · N pts", cartones comprados.
2. **En vivo**: primeros 45 s con cuenta regresiva "Arrancamos en 0:45" y "X jugadores en la mesa"; luego bola actual grande con su letra (B-12) + las 4 anteriores;
   cartones que se marcan solos con sello; "¡te falta 1!". Espectador: bolas +
   tablero de 75.
3. **¡Bodingo!**: el ganador ve el botón grande con 30 s de cuenta regresiva y
   celebración al tocar o al llegar a cero; los demás ven "¡María G. cantó
   Bodingo!" con avatar.
4. **Terminado**: ganadores, "tu voucher está en el Wallet", próxima edición.
5. **Cancelado**: "Esta semana no se completó la mesa, tus N pts volvieron."

Tarjeta en Inicio (como la ruleta) que cambia con el estado: venta / "🔴 EN
VIVO · entra ya" / ganador.

## NX (club-web)

Pantalla "Bodingo": calendario fijo y plantilla, lista de ediciones (crear
extra, editar, cancelar), jugadores y cartones por edición, secuencia al
terminar. Caja: nada nuevo (voucher estándar 075).

## Casos límite

- Socio sin conexión durante el juego: sus cartones se marcan igual; si gana, el
  voucher llega al Wallet.
- Socio dado de baja con cartones: si la edición se cancela, se reembolsa; si
  gana, el voucher se emite igual.

## Pruebas

- bodega-api: `winningBallIndex` (empate, ganador en la bola 24 y en la 75);
  `drawn` según el reloj; máximo 3 con compras concurrentes; idempotencia de
  reembolso y voucher; máquina de estados y cron recuperando tras caída.
- landing: mock con reloj simulado que recorre todos los estados en
  `/club-mock/bodingo`.
