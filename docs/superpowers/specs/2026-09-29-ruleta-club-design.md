# Ruleta Bodega Club: 1 tirada cada 3 compras + tirada de bienvenida

Fecha: 2026-09-29

> Diseño global (visión de los tres repos) acordado en sesión de brainstorming
> del 2026-09-29. Construye sobre Bodega Club v2 (`bodega-api/specs/075-club-v2`,
> Bodega Wallet de vouchers).
> Contrapartes a escribir: `bodega-api/specs/077-club-ruleta` (contrato, primero)
> y `bodega-soft-nx/apps/club-web/specs/NNN-club-web-ruleta` (configuración).
>
> **Orden de entrega:** prototipo HTML de la ruleta (animación + resultado) →
> spec api 077 → landing + club-web en paralelo.
> **Skills de diseño/animación:** `/design-taste-frontend`, `/ui-ux-pro-max`,
> `/impeccable` y `/emil-design-eng`.
> **Next.js 16:** leer `node_modules/next/dist/docs/` antes de escribir código.
> `prefers-reduced-motion` obligatorio.

## Resumen

Cada socio gana **1 tirada de ruleta por cada 3 compras elegibles**, más **1
tirada de bienvenida** al registrarse. La ruleta entrega **puntos** (acreditados
al saldo) o **premios de vitrina** (café, postre, % de descuento…) como
**vouchers `GRANT` con origen `spin`** en la Bodega Wallet, canjeables en caja
con el flujo 075 existente (`LBVCH:<code>`). El resultado lo decide el
**servidor**; el frontend solo anima hasta el segmento devuelto.

## Decisiones cerradas

| Tema | Decisión |
|---|---|
| Entrega del premio | Puntos → libro de puntos. Resto → voucher `GRANT`, `origin=spin`, `kind` `product`/`percent`/`amount`, vence en N días (default **7**, configurable). |
| Qué es una compra | Cada ticket MarSoft distinto (`saleId`) asociado a la cédula, con `soldAt ≥ fecha de alta` y `totalUsd ≥ minPurchaseUsd` (default **$2**, configurable). El historial importado previo al alta no cuenta. |
| Azar | Segmentos con **peso**, **stock opcional por periodo** y un **segmento consuelo** siempre disponible. Segmento agotado → su peso se reparte entre los demás. RNG criptográfico en servidor. |
| Vida de las tiradas | Se acumulan y **no vencen**. |
| Bienvenida | +1 al registrarse. **Backfill único**: +1 a cada socio existente al lanzar. |
| Progreso | Visible en mi-club: "2/3 compras para tu próxima tirada". |
| Registro de tiradas | **Libro append-only** `SpinLedger` escrito dentro de la transacción del sync de ventas (idempotente por `saleId`, elegibilidad congelada al ingresar la compra). |

Enfoques descartados: contador derivado al vuelo (un cambio del mínimo
recalcularía el pasado); listener por evento (el bus in-process no reintenta →
tiradas perdidas en silencio).

## Modelo de datos (bodega-api 077)

- **`SpinWheel`** (versionada; una versión activa): `name`, `purchasesPerSpin`
  (3), `minPurchaseUsd` (2), `prizeVoucherTtlDays` (7), `active`,
  `publishedAt`. Editar = publicar nueva versión; las versiones viejas se
  conservan para que cada `Spin` apunte al segmento real que salió.
- **`SpinSegment`**: `wheelVersionId`, `label`, `prizeType` (`points` |
  `voucher`), `points?`, `voucherKind?`, `voucherValue?`, `productName?`,
  `weight` (> 0), `stockLimit?`, `stockPeriod?` (`day` | `week` | `month` |
  `total`; periodos calendario en `America/Caracas`, semana lunes–domingo),
  `isConsolation`, `color` e `icon` (claves de diseño resueltas en
  frontend), `order`.
- **`SpinLedger`** (append-only): `memberId`, `delta` (+1 / −1), `reason`
  (`welcome` | `purchases` | `grant` | `backfill` | `spin`), `saleIds[]?`,
  `spinId?`, `grantedBy?`, `note?`, `createdAt`.
- **`Spin`**: `memberId`, `wheelVersionId`, `segmentId`, `resultType`,
  `pointsAwarded?`, `voucherId?`, `idempotencyKey`, `createdAt`.
- **`MemberPurchase`** + `spinEligible: boolean`, `spinConsumedAt?`.
- **`VoucherOrigin`** + `spin`. Libro de puntos + motivo `spin`.

Validaciones al publicar: 4–12 segmentos; pesos > 0; al menos un segmento
`isConsolation` **sin stock**; segmentos voucher con `voucherKind` y valor.

## Reglas

1. **Alta:** en la misma transacción del registro se escribe `+1 welcome`.
2. **Backfill:** migración de datos, `+1 backfill` a cada socio existente (una
   vez; idempotente por `reason=backfill` + `memberId`).
3. **Sync de ventas:** al hacer upsert de una compra nueva, si `soldAt ≥ alta` y
   `totalUsd ≥ minPurchaseUsd` vigente → `spinEligible=true`. Si hay ≥
   `purchasesPerSpin` elegibles sin consumir, se marcan consumidas (las más
   antiguas) y se escribe `+1 purchases` con sus `saleIds`. Re-sincronizar la
   misma venta no genera nada.
4. **Saldo de tiradas** = `SUM(delta)`. **Progreso** = elegibles no consumidas
   (`0..purchasesPerSpin-1`).
5. **Tirar** (transacción, lock por socio): saldo ≥ 1 → filtrar segmentos con
   stock agotado en su periodo → elegir ponderado → `−1 spin` + `Spin` →
   acreditar puntos o crear voucher (`expiresAt = now + ttl`). Misma
   `Idempotency-Key` → devuelve el mismo `Spin` sin descontar.
6. **Regalo admin:** `+N grant` a un socio con nota, desde club-web.
7. **Notificación in-app** al ganar una tirada por compras.

## Ruleta por defecto (seed, editable en club-web)

| # | Segmento | Tipo | Peso | Stock |
|---|---|---|---|---|
| 1 | +5 pts *(consuelo)* | puntos | 30 | — |
| 2 | +10 pts | puntos | 20 | — |
| 3 | Café americano | voucher producto | 12 | 20/semana |
| 4 | 10% en tu próxima compra | voucher % (10) | 10 | 30/semana |
| 5 | +25 pts | puntos | 8 | — |
| 6 | Cachito de jamón | voucher producto | 8 | 15/semana |
| 7 | Postre del día | voucher producto | 8 | 15/semana |
| 8 | Jugo natural | voucher producto | 4 | 10/semana |

Pesos suman 100 (= %). Valor esperado ≈ 7 pts por tirada + 32 % de premio de
vitrina. Los nombres de producto se ajustan al menú real antes de producción.
El % de descuento respeta el apilamiento 075 (1 descuento + N productos por
visita).

## API

Socio (Bearer, `MemberAuthGuard`):
- `GET /loyalty/me/spins` → `{ available, progress: { current, required },
  wheel: { versionId, segments: [{ id, label, prizeType, color, icon, order }] },
  recent: Spin[] }`. **Sin pesos ni stock.**
- `POST /loyalty/me/spins` (header `Idempotency-Key`) → `{ spinId, segmentId,
  prize: { type, points?, label }, voucher?: Voucher, available }`.
  409 sin tiradas o sin ruleta activa.

Admin (`loyalty.admin`):
- `GET /loyalty/admin/spin-wheel` (versión activa + stock consumido por periodo).
- `PUT /loyalty/admin/spin-wheel` → publica nueva versión (valida reglas).
- `POST /loyalty/admin/members/:id/spins/grant` `{ count, note }`.
- `/loyalty/metrics` + bloque `spins`: tiradas ganadas/usadas, premios por
  segmento, stock consumido, vouchers de ruleta canjeados vs vencidos.

## Landing (mi-club)

- **Home `/mi-club`:** tarjeta "Ruleta" con progreso (3 marcas, p. ej. ●●○) y
  badge de tiradas disponibles; CTA "Girar" si `available > 0`.
- **Ruta `/mi-club/ruleta`** bajo el layout compartido: rueda con los segmentos
  públicos; al tocar "Girar" la rueda arranca **inmediatamente** (sin esperar
  red), y al llegar la respuesta aterriza en el segmento devuelto con
  desaceleración física. Resultado: premio + "Ver en tu Wallet" (voucher) o
  saldo actualizado (puntos). Si quedan tiradas, "Girar otra vez".
- `prefers-reduced-motion`: sin giro largo; revelado directo con transición
  corta.
- **`/club-mock`:** ruleta local con aleatoriedad cliente y la socia de ejemplo.
- Adaptador live en `src/lib/club-api.ts` (tipos `SpinState`, `SpinResult`).
- Dirección visual pop/día (DESIGN.md), CSS scoped `.mc2`.

## club-web (NX)

- **Configurar → Ruleta:** editor de segmentos (tipo, valor, peso, stock,
  periodo, color/ícono, orden), suma de pesos y probabilidad por segmento en
  vivo, vista previa de la rueda, parámetros (`purchasesPerSpin`,
  `minPurchaseUsd`, TTL), botón "Publicar" con validaciones.
- **Ficha de socio:** saldo de tiradas, historial, "Regalar tirada".
- **Tablero:** tarjeta de ruleta con las métricas de `/loyalty/metrics`.

## Errores

- Falla del `POST` durante el giro → la rueda frena en posición neutra y se
  muestra "No pudimos completar la tirada; no se descontó". Atomicidad en
  servidor garantiza que no se pierde la tirada.
- Doble tap / reintento → `Idempotency-Key` devuelve el mismo resultado.
- 409 sin tiradas (p. ej. otra pestaña ya la usó) → refrescar estado y mostrar
  progreso.
- Ruleta sin versión activa → la tarjeta se oculta en mi-club.

## Pruebas

- Dominio: selección ponderada con RNG inyectado; redistribución por stock;
  cálculo de periodo de stock; elegibilidad de compra; validaciones de
  publicación.
- Sync: idempotencia por `saleId`; cruce de 3 elegibles genera exactamente +1;
  compras previas al alta o bajo el mínimo no cuentan.
- Concurrencia: dos `POST` simultáneos con saldo 1 → un 200 + un 409.
- Migración de backfill idempotente.
- Landing: adaptador live/mock; estados (sin tiradas, girando, error,
  reduced-motion).

## Fuera de alcance

- Tiradas con vencimiento, tiradas por encuesta u otras acciones.
- Premios físicos fuera de vouchers o puntos.
- Múltiples ruletas simultáneas (por sucursal o campaña).
