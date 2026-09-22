# Landing pública de La Bodega (Next.js 16, App Router).
# Mismo patrón que `comandas` en bodega-soft-nx: build multi-stage + salida
# standalone, imagen final slim que corre `node server.js`.

# --- deps + build ------------------------------------------------------
FROM node:24-bookworm AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# NEXT_PUBLIC_* se HORNEA en el bundle durante el build, no se lee en runtime.
# Por eso la URL del backend entra como build arg (ver docker-compose.prod.yml).
ARG NEXT_PUBLIC_API_BASE_URL=https://app.bod-service.cloud/api
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
RUN npm run build

# --- imagen final ------------------------------------------------------
FROM node:24-bookworm-slim AS runner
ENV NODE_ENV=production \
    HOSTNAME=0.0.0.0 \
    PORT=3000
WORKDIR /app
# server.js standalone NO copia public/ ni .next/static por defecto: hay que
# traerlos a mano para que los sirva (ver docs/output.md de Next).
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
