import { register as registerMember, type Member, type RegisterPayload } from "@/lib/loyalty-api";

export type ClubRegistrationPayload = {
  nationality: "V" | "E";
  cedula: string; // solo dígitos
  email: string;
  password: string;
  username: string;
  referralCode?: string;
};

export type ClubRegistrationResult = {
  status: "accepted";
  welcomeReward: string;
  welcomeBonus: number;
  /** Sesión recién creada: el diálogo la adopta vía `useMember().adoptSession`. */
  session: {
    accessToken: string;
    refreshToken: string;
    member: Member;
  };
};

/**
 * Adapter boundary con `loyalty-api.register` (spec 069). Ya no es un mock:
 * crea el socio real y devuelve, además del contrato original (`welcomeReward`
 * para la pantalla de bienvenida), los tokens de la sesión recién creada.
 */
export async function submitClubRegistration(
  payload: ClubRegistrationPayload,
): Promise<ClubRegistrationResult> {
  const registerPayload: RegisterPayload = {
    nationality: payload.nationality,
    cedula: payload.cedula,
    email: payload.email,
    password: payload.password,
    username: payload.username,
    referralCode: payload.referralCode,
  };

  const result = await registerMember(registerPayload);

  return {
    status: "accepted",
    welcomeReward: `${result.welcomeBonus} puntos de bienvenida, listos para canjear en tu primera visita`,
    welcomeBonus: result.welcomeBonus,
    session: {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      member: result.member,
    },
  };
}
