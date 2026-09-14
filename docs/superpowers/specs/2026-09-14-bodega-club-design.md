# Bodega Club: especificación de diseño

Fecha: 2026-09-14

## Resumen

`/bodega-club` será una landing de captación para el programa gratuito de fidelidad de La Bodega. Debe aumentar la frecuencia de visita, elevar el valor de compra y crear un canal directo con clientes de todas las sucursales y modalidades de compra.

La propuesta combina puntos, recompensas alcanzables, beneficios de cumpleaños y experiencias de comunidad. El programa no dependerá de descuentos permanentes.

## Objetivos

- Conseguir registros mediante un flujo corto dentro de la misma página.
- Explicar el programa en menos de un minuto.
- Incentivar nuevas visitas y compras de mayor valor.
- Presentar La Bodega como un lugar para comer, aprender, compartir y descubrir productos.
- Dejar el formulario preparado para conectar una API futura sin cambiar sus componentes visuales.

## Alcance del programa

- Membresía gratuita.
- Válido en todas las sucursales.
- Aplica a restaurante, panadería, pedidos para llevar y delivery.
- Cada compra suma puntos.
- Los puntos se canjean por productos, premios y experiencias.
- Incluye regalo de bienvenida, beneficio de cumpleaños, promociones por umbral de compra, días de puntos dobles y actividades para miembros.

Los valores de puntos mostrados durante esta primera versión serán ejemplos de presentación centralizados en un único archivo de datos. No deben entenderse como términos comerciales definitivos. La interfaz los identificará como “Ejemplos de recompensas”.

## Posicionamiento y voz

La página presentará el club como una invitación a formar parte de la casa, no como un programa corporativo.

Promesa principal:

> Todo lo bueno de volver.

Texto de apoyo:

> Suma puntos en cada compra y cámbialos por café, pan, postres y experiencias.

CTA principal en toda la página:

> Únete al club

CTA secundario del hero:

> Ver beneficios

Microcopy de registro:

> Únete gratis. Solo necesitas tu nombre y WhatsApp.

La voz será cercana, sencilla y hospitalaria. Evitará términos financieros, jerga de fidelización, urgencia artificial y promesas no verificables.

## Dirección visual

La página será una extensión de la landing actual de La Bodega:

- Barlow Condensed para navegación, titulares y cuerpo.
- Cormorant Garamond solo como firma puntual.
- Crema, café oscuro, dorado y coral tomados de los tokens existentes.
- Dorado para puntos y recompensas.
- Coral para acciones principales, selección y confirmación.
- Fotografías gastronómicas grandes y específicas para cada sección.
- Superficies con radio máximo de 16 px y botones tipo píldora.
- Sin cuadrículas de tarjetas idénticas, paneles anidados ni decoración que no organice contenido.
- Compatibilidad con los temas claro y oscuro de la experiencia de marketing.

Lectura de diseño para implementación:

> Landing de membresía para clientes de un restaurante y panadería, con lenguaje gastronómico, cálido y comunitario, basada en Tailwind, shadcn y Motion.

Diales:

- `DESIGN_VARIANCE: 8`
- `MOTION_INTENSITY: 7`
- `VISUAL_DENSITY: 4`

## Estructura de la página

### Navegación

Conservará la identidad, logotipo, altura y selector de tema de la landing. Los enlaces existentes apuntarán correctamente a la página principal y se añadirá “Bodega Club” como destino activo. El CTA será “Únete al club” y abrirá el diálogo.

### Hero

Composición asimétrica con el contenido y la fotografía visibles dentro del primer viewport.

- Un único rótulo corto: “Bodega Club”.
- Titular: “Todo lo bueno de volver.”
- Texto de apoyo aprobado.
- CTA principal: abre el diálogo.
- CTA secundario: lleva a la sección de beneficios.
- Fotografía horizontal con mesa compartida, alimentos de La Bodega y una tarjeta física de socio.

### Cómo funciona

Recorrido de tres acciones:

1. Regístrate gratis.
2. Suma con cada compra.
3. Canjea lo que te gusta.

Una línea visual de puntos conectará las acciones y avanzará al entrar la sección en pantalla. En movimiento reducido aparecerá completa y estática.

### Pasaporte de recompensas

Catálogo editorial con ejemplos de café o pan, postre, desayuno y premio especial. Combinará fotografía, cifras grandes y composiciones de distinta escala. No será una cuadrícula de tarjetas iguales.

Datos demostrativos iniciales:

- 20 puntos: café de la casa.
- 35 puntos: pan o dulce seleccionado.
- 60 puntos: postre del día.
- 100 puntos: desayuno seleccionado.
- 180 puntos: premio especial o crédito de consumo.

La acumulación ilustrativa será de un punto por cada dólar consumido. Todos estos valores vivirán en un archivo de datos reemplazable.

### Beneficios de ser miembro

Composición asimétrica con cuatro beneficios:

- Regalo durante la semana de cumpleaños.
- Delivery gratuito desde el monto y dentro de las zonas participantes.
- Días seleccionados de puntos dobles.
- Combos y productos reservados para miembros.

La página no publicará un monto definitivo para delivery hasta que el negocio lo confirme. La redacción visible será “desde el monto participante”. Esto evita presentar una condición comercial falsa.

### Más que venir a comer

Sección humana y fotográfica dedicada a degustaciones, talleres, lanzamientos y actividades especiales. Su función es mostrar pertenencia y comunidad, no enumerar promociones.

### Preguntas frecuentes

Un `Accordion` de shadcn responderá:

- ¿Registrarse tiene costo?
- ¿Dónde se acumulan puntos?
- ¿Cómo se identifican las compras?
- ¿Cómo se canjean las recompensas?
- ¿Cómo funciona el beneficio de cumpleaños?
- ¿Qué ocurre con los datos personales?

### Cierre

Fotografía apetecible, mensaje breve y CTA “Únete al club”. El CTA abre el mismo diálogo, sin crear una segunda intención de conversión.

### Pie de página

Reutilizará la información y los destinos de la landing. Los enlaces con anclas apuntarán a la ruta principal cuando corresponda.

## Imágenes

Se generarán tres imágenes finales mediante la herramienta integrada de generación de imágenes y se copiarán a `public/bodega-club/`:

1. `hero-bodega-club.webp`: mesa compartida, pan, café, platos y tarjeta física sin texto, formato horizontal con espacio negativo para el contenido.
2. `recompensas-bodega-club.webp`: bodegón editorial de café, panadería, postres y desayuno, adaptable a recortes de distinta proporción.
3. `comunidad-bodega-club.webp`: degustación o taller pequeño con interacción humana natural, formato horizontal.

Las imágenes no contendrán texto, logotipos generados, marcas inventadas ni marcas de agua. El logotipo real se compondrá en HTML cuando sea necesario.

## Motion

La implementación usará `motion/react`, ya instalado.

- Hero: entrada por capas de fotografía, titular, texto y acciones.
- Fotografía del hero: parallax leve con `useScroll` y valores derivados de Motion.
- Cómo funciona: progresión de la línea de puntos al entrar en pantalla.
- Recompensas: revelado secuencial con direcciones y escalas ligadas a la composición.
- CTA: respuesta táctil corta en hover y active.
- Diálogo: entrada breve, campos escalonados y transición clara al estado de éxito.

Las animaciones comunicarán jerarquía, avance o cambio de estado. Se animarán principalmente transformaciones y opacidad. `prefers-reduced-motion` eliminará parallax y secuencias, dejando contenido visible con cambios instantáneos o fundidos breves.

## Componentes y arquitectura

La página mantendrá el contenido estático como componentes de servidor cuando sea posible. La interactividad quedará aislada en componentes cliente.

Estructura prevista:

```text
src/app/bodega-club/page.tsx
src/components/bodega-club/bodega-club-page.tsx
src/components/bodega-club/club-nav.tsx
src/components/bodega-club/club-hero.tsx
src/components/bodega-club/how-it-works.tsx
src/components/bodega-club/rewards.tsx
src/components/bodega-club/member-benefits.tsx
src/components/bodega-club/community.tsx
src/components/bodega-club/club-faq.tsx
src/components/bodega-club/registration-dialog.tsx
src/components/bodega-club/registration-provider.tsx
src/components/bodega-club/club-data.ts
src/components/bodega-club/submit-registration.ts
```

Antes de escribir código se leerá la documentación incluida con Next 16.3.4 en `node_modules/next/dist/docs/`, según las instrucciones del repositorio.

Los componentes shadcn faltantes se instalarán mediante su CLI. Se reutilizarán `Button` e `Input` existentes cuando cumplan los requisitos. Como mínimo se evaluarán `Dialog`, `Accordion`, `Checkbox` y `Select`. No se recrearán primitives accesibles desde cero.

`RegistrationProvider` controlará un único diálogo y conservará el elemento que lo abrió para devolverle el foco al cerrar. Los CTA emitirán la misma acción y usarán la misma etiqueta.

## Formulario de registro

Campos obligatorios:

- Nombre.
- WhatsApp.
- Aceptación de términos y del tratamiento necesario de datos.

Campos opcionales:

- Fecha de cumpleaños.
- Sucursal favorita.
- Preferencias gastronómicas.
- Consentimiento para recibir promociones.

El consentimiento promocional será independiente, opcional y desmarcado por defecto. Las etiquetas estarán siempre visibles encima de sus controles.

## Flujo de datos

El formulario construirá un `ClubRegistrationPayload` y llamará una única función:

```ts
submitClubRegistration(payload)
```

La primera versión usará un adaptador simulado que devuelve éxito después de una espera breve. No guardará datos personales en `localStorage`, cookies ni archivos. La función expondrá una interfaz estable para sustituir el mock por una petición HTTP cuando exista el backend.

El modo simulado se documentará en el código y no debe desplegarse como mecanismo real de captación. La interfaz de demostración mostrará el flujo completo, pero el lanzamiento para clientes requiere conectar almacenamiento real.

## Estados y errores

- Inicial: formulario disponible y CTA claro.
- Validación: mensaje específico debajo del campo y foco en el primer error.
- Envío: botón con etiqueta “Enviando registro”, controles bloqueados y estructura estable.
- Error: mensaje contextual, contenido conservado y acción “Intentar de nuevo”.
- Éxito: confirmación, explicación del beneficio de bienvenida y acción “Cerrar”.

El diálogo se podrá cerrar mediante botón, tecla `Escape` y clic exterior cuando no haya un envío en curso. El foco permanecerá contenido dentro del diálogo y volverá al disparador al cerrar.

## Accesibilidad

- WCAG 2.1 AA como mínimo.
- Contraste de 4.5:1 para texto normal y campos.
- Navegación completa con teclado.
- Foco visible usando el sistema existente.
- Errores asociados mediante `aria-describedby`.
- Estado de envío y resultado anunciados en una región viva.
- Imágenes con texto alternativo funcional.
- Objetivos táctiles de al menos 44 px.
- Diálogo usable con teclado móvil y viewport pequeño.
- Alternativa completa para movimiento reducido.

## Responsive

- Hero asimétrico en escritorio y columna única en menos de 768 px.
- CTA visibles sin desplazamiento en el viewport inicial.
- Diálogo de ancho contenido en escritorio y hoja casi completa en móvil, sin exceder el viewport dinámico.
- Catálogo de recompensas convertido en secuencia vertical legible en móvil.
- Ningún titular podrá desbordarse entre 320 px y escritorio ancho.
- Imágenes con proporciones reservadas para evitar cambios de layout.

## SEO y metadata

- Título: `Bodega Club | Puntos y beneficios en La Bodega`.
- Descripción: `Únete gratis a Bodega Club, suma puntos con cada compra y disfruta recompensas, cumpleaños, delivery y experiencias en La Bodega.`
- Encabezado principal único.
- Contenido visible y útil sin JavaScript, salvo diálogo y animaciones.
- No se modificarán rutas existentes.

## Verificación

- Ejecutar lint y build.
- Revisar temas claro y oscuro.
- Revisar 320 px, 390 px, 768 px, 1024 px y escritorio ancho.
- Probar teclado, foco, `Escape`, clic exterior y devolución de foco.
- Probar validación, envío, error simulado y éxito.
- Probar `prefers-reduced-motion`.
- Revisar contraste, etiquetas, estados activos y textos alternativos.
- Capturar la página completa y el diálogo en escritorio y móvil.
- Revisar todas las cadenas visibles para eliminar copy ambiguo o genérico.
- Confirmar que las imágenes finales viven dentro del repositorio y se cargan con dimensiones reservadas.

## Capacidades requeridas para implementación

La fase de código aplicará explícitamente:

- `design-taste-frontend` para lectura de diseño, diales, dirección visual, composición y revisión pre-flight.
- `impeccable` para contexto del proyecto, registro de marca, accesibilidad, responsive, estados y pulido final.
- `imagegen` para producir los tres activos fotográficos específicos de la página.

No se iniciará la implementación hasta que esta especificación sea revisada por el usuario.
