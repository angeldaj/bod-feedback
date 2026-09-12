import type { CSSProperties } from "react";

type Props = {
  /** Ancho del logo en px. */
  width?: number;
  className?: string;
  style?: CSSProperties;
};

// Logo de La Bodega para el tema nocturno.
// `logo-bodega.png` es una versión con FONDO TRANSPARENTE y arte en blanco
// (derivada del JPG original recortando el fondo negro por luminancia), así que
// el monograma se integra sobre cualquier fondo oscuro sin cuadro negro ni
// depender de mix-blend-mode (que fallaba dentro de los grupos de composición
// que crean los contenedores de motion).
export function BrandLogo({ width = 148, className, style }: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- asset local, sin loader remoto
    <img
      src="/logo-bodega.png"
      alt="La Bodega"
      width={width}
      height={width}
      className={className}
      style={{ width, height: "auto", ...style }}
    />
  );
}
