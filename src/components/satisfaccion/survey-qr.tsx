import QRCode from "react-qr-code";
import { SURVEY_URL } from "./survey-url";

type Props = {
  /** Lado del QR en px (el SVG escala; usa lo que quepa en pantalla/impresión). */
  size?: number;
  /** URL a codificar. Por defecto, la encuesta. */
  value?: string;
  className?: string;
  /** Embebe el logo de La Bodega en el centro. Por defecto, sí. */
  logo?: boolean;
};

// QR de marca: módulos oscuros sobre teja crema para máximo contraste
// (dark-on-light escanea de forma fiable en cualquier fondo, también impreso).
//
// Logo central: react-qr-code@2.2.0 NO implementa la prop `imageSettings` de
// los docs (reactqrcode.com/image-settings) — sus únicas props son value/size/
// bgColor/fgColor/level/title. Así que se superpone el asset manualmente: subimos
// la corrección de errores a "H" (≈30% recuperable) y rodeamos el badge con un
// anillo crema que "excava" los módulos bajo el logo. El badge (~26% del lado)
// queda muy por debajo del margen que tolera el nivel H, así que el escaneo no
// se ve afectado.
export function SurveyQR({
  size = 160,
  value = SURVEY_URL,
  className,
  logo = true,
}: Props) {
  const pad = Math.round(size * 0.09);
  const badge = Math.round(size * 0.26);
  const ring = Math.max(2, Math.round(size * 0.028));
  return (
    <div
      className={className}
      style={{
        position: "relative",
        display: "inline-block",
        lineHeight: 0,
        background: "var(--lb-cream)",
        padding: pad,
      }}
    >
      <QRCode
        value={value}
        size={size}
        level={logo ? "H" : "M"}
        bgColor="#f7f2e7"
        fgColor="#12100c"
        style={{ display: "block", height: "auto", width: size, maxWidth: "100%" }}
      />
      {logo && (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: badge,
            height: badge,
            transform: "translate(-50%, -50%)",
            background: "#12100c",
            boxShadow: `0 0 0 ${ring}px #f7f2e7`,
            overflow: "hidden",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- badge local, sin loader */}
          <img
            src="/logo-bodega.png"
            alt=""
            style={{
              display: "block",
              width: "82%",
              height: "82%",
              margin: "9%",
              objectFit: "contain",
            }}
          />
        </span>
      )}
    </div>
  );
}
