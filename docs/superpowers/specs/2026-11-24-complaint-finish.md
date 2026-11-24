# Final de la queja sin segundo formulario

Pedido del usuario: quitar el paso redundante que vuelve a pedir llenar otro formulario.
Se retira la invitación «Cuando puedas, completa la encuesta» de la confirmación de queja y su callback de navegación. El envío termina mostrando la confirmación y el número de caso. El contacto, el consentimiento opcional de WhatsApp y el acceso independiente a la encuesta se conservan.

- [x] Quitar invitación y callback sin alterar envío/validaciones.
- [x] Verificar envío único y confirmación sin otra encuesta en navegador móvil/escritorio.
- [x] Lint y build.
- [ ] Publicar y verificar en la landing real.

Verificado: dos recorridos de navegador (1440 y 390 px), tres pruebas del adapter de consentimiento/idempotencia, lint y build Next.js. Las peticiones del navegador se interceptan; no se crean quejas reales.
