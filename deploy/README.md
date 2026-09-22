# Landing pública — despliegue en el VPS (producción)

Sigue el mismo patrón que `bodega-api` y `bodega-soft-nx`: contenedor Docker en
la red compartida `la_bodega_net`, detrás del **Caddy único** que vive en el
compose de `bodega-api` (dueño de los puertos 80/443 y del TLS automático).

La landing es **una sola app Next.js** que sirve todo junto: `/` (marketing),
`/feedback`, y el Club (`/bodega-club`, `/mi-club`, `/login`). El Club es mock
todavía; cuando exista backend de lealtad se podrá separar a un subdominio sin
rehacer este deploy (ver §Subdominio del Club al final).

## Requisitos previos

- `deploy/db` de `bodega-api` ya levantado → la red externa `la_bodega_net` existe.
- El Caddy de `bodega-api` ya corriendo (`docker compose -f docker-compose.prod.yml up -d caddy`).

Confirmá la red:

```bash
docker network ls | grep la_bodega_net
```

## 0. DNS

Apuntá el registro **A** de `labodega-ve.com` (y `www.labodega-ve.com` si lo querés)
a la IP del VPS. Si usás Cloudflare como el resto del ecosistema, dejá el proxy
como esté configurado para los demás dominios. Caddy necesita resolver el
dominio para emitir el certificado Let's Encrypt (HTTP-01).

## 1. Clonar el repo en el VPS

Igual que la API: deploy key de solo lectura en GitHub y clonar bajo
`/opt/la-bodega`:

```bash
sudo mkdir -p /opt/la-bodega
sudo chown dev:dev /opt/la-bodega
git clone git@github.com:angeldaj/bod-feedback.git /opt/la-bodega/landing
cd /opt/la-bodega/landing
```

## 2. `.env` de producción

Docker Compose lee automáticamente el `.env` junto a `docker-compose.prod.yml`.
Solo hace falta la URL pública del backend (se hornea en el build):

```bash
cp .env.example .env
nano .env    # NEXT_PUBLIC_API_BASE_URL=https://app.bod-service.cloud/api
```

## 3. Build y levantar

```bash
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml logs -f
```

El contenedor `landing` queda en la red interna en `landing:3000`; no expone
puertos al host.

## 4. Publicar el dominio en Caddy

En el repo `bodega-api`, agregá este bloque a `deploy/api/Caddyfile`:

```caddy
labodega-ve.com {
	reverse_proxy landing:3000
}

# opcional: www -> raíz
www.labodega-ve.com {
	redir https://labodega-ve.com{uri} permanent
}
```

Y recargá Caddy (sin downtime):

```bash
cd /opt/la-bodega/api
docker compose -f docker-compose.prod.yml exec caddy caddy reload --config /etc/caddy/Caddyfile
```

> Caddy resuelve `landing` por nombre porque ambos contenedores comparten
> `la_bodega_net`. Si Caddy no lo ve, verificá que el servicio `landing` esté
> `up` y en esa red.

## 5. Probar

```bash
curl -I https://labodega-ve.com
curl -I https://labodega-ve.com/bodega-club
```

## Actualizar tras un cambio de código

```bash
cd /opt/la-bodega/landing
git pull
docker compose -f docker-compose.prod.yml build landing
docker compose -f docker-compose.prod.yml up -d landing
```

(O dejá que lo haga el workflow de GitHub Actions en cada push a `main` —
`.github/workflows/deploy.yml`, mismos secrets `VPS_HOST` / `VPS_USER` /
`VPS_SSH_KEY` que la API.)

## Notas

- **Imágenes remotas / `next/image`:** la landing optimiza fotos remotas
  (loremflickr, unsplash, picsum) en runtime. Si en producción devuelven 500,
  agregá `sharp` a `dependencies` (`npm i sharp`) y reconstruí. Para producción
  real conviene igual reemplazar esos placeholders por imágenes propias en
  `/public/img` (ver comentario en `next.config.ts`).
- **`NEXT_PUBLIC_API_BASE_URL` se hornea en build**, no en runtime: si cambia el
  backend hay que **rebuild**, no basta reiniciar el contenedor.

## Subdominio del Club (`club.labodega-ve.com`) — para más adelante

Como es una sola app, cuando lo quieras activar:

1. Agregá en `bodega-api/deploy/api/Caddyfile` un bloque
   `club.labodega-ve.com { reverse_proxy landing:3000 }`.
2. En la landing, un `middleware.ts` que, si `host == club.…`, reescriba `/` →
   `/bodega-club` y limite las rutas del Club.
3. Convertí los ~12 enlaces cruzados absolutos (`href="/"`, `/feedback`, etc. en
   `bodega-club-page.tsx` y `mi-club-page.tsx`) en URLs absolutas por env
   (`NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_CLUB_URL`) para que salten al host
   correcto.

Nada de esto obliga a un segundo deploy: el mismo contenedor sirve ambos hosts.
