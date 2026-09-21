"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import * as loyaltyApi from "./loyalty-api";
import type { Member, UpdateMemberPayload } from "./loyalty-api";

// Sesión del socio de Bodega Club (spec 069). El access token vive solo en
// memoria (nunca en storage); el refresh token se persiste en localStorage
// para sobrevivir recargas.
//
// Tradeoff de seguridad asumido a propósito (ver 069 "Decisiones de diseño"):
// como la landing (labodega.com) y la API (app.bod-service.cloud) son
// orígenes distintos, una cookie de sesión de terceros es frágil en
// Safari/Chrome — por eso el socio usa Bearer. Guardar el refresh token en
// localStorage lo expone a lectura por cualquier script que corra en este
// origen (p. ej. un bug de XSS), que podría usarlo para pedir accesos nuevos
// hasta que se revoque. Se mitiga con un access token corto (15 min) que
// nunca toca storage, y con refresh rotado en cada uso — no es tan fuerte
// como HttpOnly, pero es la opción viable dado que no hay cookie de sesión
// cross-site confiable.
const REFRESH_STORAGE_KEY = "bodega-club-refresh-token";

type MemberSessionContextValue = {
  member: Member | null;
  accessToken: string | null;
  /** true mientras se intenta recuperar la sesión guardada al cargar. */
  loading: boolean;
  login: (identifier: string, password: string) => Promise<Member>;
  logout: () => Promise<void>;
  /** Adopta una sesión ya creada (p. ej. justo después de un registro exitoso). */
  adoptSession: (session: {
    accessToken: string;
    refreshToken: string;
    member: Member;
  }) => void;
  refreshMember: () => Promise<Member | null>;
  updateProfile: (patch: UpdateMemberPayload) => Promise<Member>;
  /**
   * Ejecuta una llamada autenticada; si responde 401, intenta refrescar la
   * sesión UNA vez y reintenta. Si el refresh falla, limpia la sesión y
   * propaga el error (el caller redirige a /login si corresponde).
   */
  authedRequest: <T>(fn: (accessToken: string) => Promise<T>) => Promise<T>;
};

const MemberSessionContext = createContext<MemberSessionContextValue | null>(null);

export function MemberSessionProvider({ children }: { children: ReactNode }) {
  const [member, setMember] = useState<Member | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const refreshTokenRef = useRef<string | null>(null);
  const accessTokenRef = useRef<string | null>(null);

  const setAccess = useCallback((token: string | null) => {
    accessTokenRef.current = token;
    setAccessToken(token);
  }, []);

  const clearSession = useCallback(() => {
    refreshTokenRef.current = null;
    try {
      localStorage.removeItem(REFRESH_STORAGE_KEY);
    } catch {
      // Storage no disponible (modo privado, SSR): la sesión igual se limpia en memoria.
    }
    setAccess(null);
    setMember(null);
  }, [setAccess]);

  const persistRefreshToken = useCallback((token: string) => {
    refreshTokenRef.current = token;
    try {
      localStorage.setItem(REFRESH_STORAGE_KEY, token);
    } catch {
      // Sesión sigue funcionando en memoria aunque no se persista.
    }
  }, []);

  const doRefresh = useCallback(async (): Promise<string | null> => {
    const current = refreshTokenRef.current;
    if (!current) return null;
    try {
      const tokens = await loyaltyApi.refreshSession(current);
      persistRefreshToken(tokens.refreshToken);
      setAccess(tokens.accessToken);
      return tokens.accessToken;
    } catch {
      clearSession();
      return null;
    }
  }, [clearSession, persistRefreshToken, setAccess]);

  const authedRequest = useCallback(
    async <T,>(fn: (accessToken: string) => Promise<T>): Promise<T> => {
      const token = accessTokenRef.current;
      if (!token) {
        throw new loyaltyApi.LoyaltyApiError("Inicia sesión para continuar.", 401);
      }
      try {
        return await fn(token);
      } catch (error) {
        if (error instanceof loyaltyApi.LoyaltyApiError && error.status === 401) {
          const nextToken = await doRefresh();
          if (!nextToken) throw error;
          return await fn(nextToken);
        }
        throw error;
      }
    },
    [doRefresh],
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      let stored: string | null = null;
      try {
        stored = localStorage.getItem(REFRESH_STORAGE_KEY);
      } catch {
        stored = null;
      }
      if (!stored) {
        if (alive) setLoading(false);
        return;
      }
      refreshTokenRef.current = stored;
      const token = await doRefresh();
      if (!alive) return;
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const me = await loyaltyApi.getMe(token);
        if (alive) setMember(me);
      } catch {
        clearSession();
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
    // Solo al montar: recupera la sesión guardada una vez.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    async (identifier: string, password: string) => {
      const tokens = await loyaltyApi.login(identifier, password);
      persistRefreshToken(tokens.refreshToken);
      setAccess(tokens.accessToken);
      const me = await loyaltyApi.getMe(tokens.accessToken);
      setMember(me);
      return me;
    },
    [persistRefreshToken, setAccess],
  );

  const adoptSession = useCallback(
    (session: { accessToken: string; refreshToken: string; member: Member }) => {
      persistRefreshToken(session.refreshToken);
      setAccess(session.accessToken);
      setMember(session.member);
    },
    [persistRefreshToken, setAccess],
  );

  const logout = useCallback(async () => {
    const token = refreshTokenRef.current;
    clearSession();
    if (token) {
      try {
        await loyaltyApi.logout(token);
      } catch {
        // La sesión local ya se limpió; el refresh vencerá solo si esto falla.
      }
    }
  }, [clearSession]);

  const refreshMember = useCallback(async () => {
    if (!accessTokenRef.current) return null;
    try {
      const me = await authedRequest((token) => loyaltyApi.getMe(token));
      setMember(me);
      return me;
    } catch {
      return null;
    }
  }, [authedRequest]);

  const updateProfile = useCallback(
    async (patch: UpdateMemberPayload) => {
      const me = await authedRequest((token) => loyaltyApi.updateMe(token, patch));
      setMember(me);
      return me;
    },
    [authedRequest],
  );

  const value = useMemo<MemberSessionContextValue>(
    () => ({
      member,
      accessToken,
      loading,
      login,
      logout,
      adoptSession,
      refreshMember,
      updateProfile,
      authedRequest,
    }),
    [member, accessToken, loading, login, logout, adoptSession, refreshMember, updateProfile, authedRequest],
  );

  return <MemberSessionContext.Provider value={value}>{children}</MemberSessionContext.Provider>;
}

export function useMember(): MemberSessionContextValue {
  const ctx = useContext(MemberSessionContext);
  if (!ctx) {
    throw new Error("useMember debe usarse dentro de MemberSessionProvider.");
  }
  return ctx;
}
