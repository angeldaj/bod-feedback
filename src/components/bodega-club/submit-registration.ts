export type ClubRegistrationPayload = {
  name: string;
  whatsapp: string;
  birthday: string;
  branch: string;
  preferences: string[];
  acceptsMembership: boolean;
  acceptsMarketing: boolean;
};

export type ClubRegistrationResult = {
  status: "accepted";
  welcomeReward: string;
};

/**
 * Adapter boundary for the future Bodega Club API.
 *
 * This mock intentionally persists nothing. Replace only this implementation
 * when the endpoint and database exist; the form consumes the stable contract.
 * A WhatsApp ending in 0000 triggers the recoverable error state for QA.
 */
export async function submitClubRegistration(
  payload: ClubRegistrationPayload,
): Promise<ClubRegistrationResult> {
  await new Promise((resolve) => setTimeout(resolve, 850));

  if (payload.whatsapp.replace(/\D/g, "").endsWith("0000")) {
    throw new Error("No pudimos completar el registro de muestra. Revisa el número e inténtalo de nuevo.");
  }

  return {
    status: "accepted",
    welcomeReward: "Un café de la casa en tu primera compra participante",
  };
}

