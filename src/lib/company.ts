// Datos legales de la empresa: los muestran el pie del home y las páginas
// legales. Meta (verificación del negocio) compara la razón social del sitio
// con la del RIF, así que debe escribirse igual que en el documento.
export const COMPANY = {
  legalName: "COMERCIALIZADORA LA BODEGA, C.A.",
  /** RIF tal como aparece en el documento (p. ej. "J-12345678-9"). */
  rif: null as string | null,
} as const;

/** "COMERCIALIZADORA LA BODEGA, C.A. · RIF J-…" (sin RIF si aún no se cargó). */
export const companyLine = COMPANY.rif ? `${COMPANY.legalName} · RIF ${COMPANY.rif}` : COMPANY.legalName;
