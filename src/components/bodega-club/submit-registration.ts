import { register as registerMember, type Member, type RegisterPayload } from "@/lib/loyalty-api";

export type ClubRegistrationPayload = {
  name: string;
  nationality: "V" | "E";
  cedula: string; // solo dígitos
  whatsapp: string;
  email: string;
  password: string;
  username: string;
  birthday: string;
  /** Id de la sucursal (catálogo real de `feedback/branches`), o "" si no eligió. */
  branch: string;
  preferences: string[];
  acceptsMembership: boolean;
  acceptsMarketing: boolean;
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
    name: payload.name,
    whatsapp: payload.whatsapp,
    email: payload.email,
    password: payload.password,
    username: payload.username || undefined,
    birthday: payload.birthday || undefined,
    homeBranchId: payload.branch || undefined,
    preferences: payload.preferences,
    acceptsMarketing: payload.acceptsMarketing,
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
