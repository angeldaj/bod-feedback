# TikTok 168: menos lecturas y esperas progresivas

Alcance aprobado por el usuario el 2026-11-24. Contraparte: bodega-api/specs/168-tiktok-sync-optimization/.

## Implementado
- Sondeo únicamente después del clic: comienza entre 2 y 5 segundos, se espacia hasta 15 segundos mientras extrae y vuelve a 2 segundos al procesar. Límite total de 5 minutos y cancelación al salir conservados.
- Resultado ya acreditado es terminal: no genera lecturas de trabajo.
- Se respeta retryAfterSeconds del servidor y nextVerificationAt de la participación propia. El botón queda deshabilitado durante la espera, con mensaje accesible; no dispara otra solicitud al terminar el plazo.
- Se conserva Instagram y el modo demo. No hay consultas pagadas en los tests.

## Verificación
- [x] 8 pruebas de lógica.
- [x] 3 pruebas de navegador sobre build de producción: ausencia de sondeo previo al clic, resultados, demo y bloqueo/desbloqueo con espera del servidor.
- [x] Lint de archivos afectados y build Next.js correctos.
- [ ] Desplegar después de la migración/API y configurar webhook de Apify en la API. Revisar coste y latencia reales.

Se trabajó en la rama feat/tiktok-sync-optimization, base 3452168. Sin commits, push ni despliegue. Las pruebas SQL dependen de una base aislada sin Docker.
