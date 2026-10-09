// Datos legales de la empresa: los muestran el pie del home y las páginas
// legales. Meta (verificación del negocio) compara la razón social del sitio
// con la del RIF, así que debe escribirse igual que en el documento.
export const COMPANY = {
  legalName: "COMERCIALIZADORA LA BODEGA, C.A.",
  /** RIF tal como aparece en el comprobante del SENIAT (J412916858). */
  rif: "J-41291685-8" as string | null,
  /** Domicilio fiscal del RIF. */
  fiscalAddress:
    "Calle Nekuima, Local Torre Nekuima, Nro. CD 5 y 6, Urb. Alta Vista Norte, Ciudad Guayana, estado Bolívar, zona postal 8050",
} as const;

/** "COMERCIALIZADORA LA BODEGA, C.A. · RIF J-…" (sin RIF si aún no se cargó). */
export const companyLine = COMPANY.rif ? `${COMPANY.legalName} · RIF ${COMPANY.rif}` : COMPANY.legalName;
