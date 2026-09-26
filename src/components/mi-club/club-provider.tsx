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
import type { LucideIcon } from "lucide-react";
import { HeartHandshake, Layers, Ticket, TriangleAlert } from "lucide-react";
import { useMember } from "@/lib/member-session";
import * as club from "@/lib/club-api";
import type {
  CardDesign,
  ClubActivity,
  ClubAdapter,
  ClubCard,
  ClubReward,
  ClubTier,
  Voucher,
} from "@/lib/club-api";
import type { Member } from "@/lib/loyalty-api";
import { useClubTheme, type Theme } from "./use-club-theme";

export type Overlay =
  | { type: "voucher"; id: string }
  | { type: "gallery" }
  | { type: "caja" }
  | { type: "levelup"; from: ClubTier; to: ClubTier }
  | null;

export type Notice = { id: number; icon: LucideIcon; title: string; sub: string };
export type Flight = { id: number; voucher: Voucher; from: DOMRect; to: DOMRect; onDone: () => void };

type ClubData = {
  loading: boolean;
  error: string | null;
  card: ClubCard | null;
  designs: CardDesign[];
  vouchers: Voucher[];
  rewards: ClubReward[];
  activity: ClubActivity | null;
};

/** `live` = backend real con la sesión del socio; `demo` = datos de ejemplo sin login. */
export type ClubMode = "live" | "demo";

type ClubValue = ClubData & {
  member: Member | null;
  sessionLoading: boolean;
  demo: boolean;
  /** Raíz de las rutas del área (`/mi-club` o `/club-mock`). */
  basePath: string;
  /** Arma una ruta dentro del área: `href("wallet")` → `/mi-club/wallet`. */
  href: (sub?: string) => string;
  theme: Theme;
  themeClass: string;
  toggleTheme: () => void;
  activeVouchers: Voucher[];
  reload: () => Promise<void>;
  redeem: (rewardId: string, from?: Element | null) => Promise<boolean>;
  selectDesign: (designId: string) => Promise<boolean>;
  overlay: Overlay;
  openOverlay: (overlay: Overlay) => void;
  closeOverlay: () => void;
  notice: Notice | null;
  notify: (icon: LucideIcon, title: string, sub: string) => void;
  flights: Flight[];
  registerWalletTarget: (el: HTMLElement | null) => void;
  demoActions: { tierUp: () => void; complaint: (from?: Element | null) => void; toggleVisits: () => void } | null;
};

const ClubCtx = createContext<ClubValue | null>(null);

export function useClub(): ClubValue {
  const value = useContext(ClubCtx);
  if (!value) throw new Error("useClub debe usarse dentro de <ClubProvider>.");
  return value;
}

const EMPTY: ClubData = { loading: true, error: null, card: null, designs: [], vouchers: [], rewards: [], activity: null };
const TIER_KEY = (memberId: string) => `bodega-club-tier:${memberId}`;
type SeenTier = Pick<ClubTier, "rank" | "name" | "skin">;

function readSeenTier(raw: string | null): SeenTier | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<SeenTier>;
    return typeof parsed.rank === "number" && parsed.name && parsed.skin
      ? { rank: parsed.rank, name: parsed.name, skin: parsed.skin }
      : null;
  } catch {
    return null; // formato viejo (solo el número): se toma como primera visita
  }
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function ClubProvider({
  children,
  mode,
  basePath,
}: {
  children: ReactNode;
  mode: ClubMode;
  basePath: string;
}) {
  const session = useMember();
  const demo = mode === "demo";
  const member = demo ? club.DEMO_MEMBER : session.member;
  const { theme, toggleTheme } = useClubTheme();
  const [data, setData] = useState<ClubData>(EMPTY);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [flights, setFlights] = useState<Flight[]>([]);
  const noticeTimer = useRef<number | undefined>(undefined);
  const seq = useRef(0);
  const walletTargets = useRef(new Set<HTMLElement>());

  const { authedRequest } = session;
  const adapter = useMemo<ClubAdapter>(
    () => (demo ? club.createMockClubAdapter(club.DEMO_MEMBER) : club.createLiveClubAdapter(authedRequest)),
    [authedRequest, demo],
  );

  const notify = useCallback((icon: LucideIcon, title: string, sub: string) => {
    seq.current += 1;
    setNotice({ id: seq.current, icon, title, sub });
    window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(null), 3800);
  }, []);

  const load = useCallback(async () => {
    if (!member) return;
    try {
      const [card, designs, vouchers, rewards, activity] = await Promise.all([
        adapter.getCard(),
        adapter.listDesigns(),
        adapter.listVouchers(),
        adapter.listRewards(),
        adapter.getActivity(),
      ]);
      setData({ loading: false, error: null, card, designs, vouchers, rewards, activity });
    } catch (error) {
      setData((d) => ({ ...d, loading: false, error: errorMessage(error, "No pudimos cargar tu cuenta. Intenta de nuevo.") }));
    }
  }, [adapter, member]);

  useEffect(() => {
    void load();
  }, [load]);

  // Subida de nivel: se compara el rango actual con el último que vio este socio.
  const card = data.card;
  useEffect(() => {
    if (!card || !member) return;
    try {
      const key = TIER_KEY(`${mode}:${member.id}`);
      const seen = readSeenTier(localStorage.getItem(key));
      const current: SeenTier = { rank: card.tier.rank, name: card.tier.name, skin: card.tier.skin };
      localStorage.setItem(key, JSON.stringify(current));
      if (seen && seen.rank < card.tier.rank) {
        const from: ClubTier = { ...seen, minLifetimePoints: 0, perk: null };
        setOverlay({ type: "levelup", from, to: card.tier });
      }
    } catch {
      // Sin storage no hay animación de subida, pero la tarjeta ya muestra el nivel nuevo.
    }
  }, [card, member, mode]);

  const registerWalletTarget = useCallback((el: HTMLElement | null) => {
    if (!el) return;
    walletTargets.current.add(el);
  }, []);

  const flyToWallet = useCallback((voucher: Voucher, from: Element | null | undefined, onDone: () => void) => {
    const targets = [...walletTargets.current].filter((el) => el.isConnected);
    const target = targets.map((el) => el.getBoundingClientRect()).find((r) => r.width > 0);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!from || !target || reduce) {
      onDone();
      return;
    }
    seq.current += 1;
    const id = seq.current;
    setFlights((f) => [
      ...f,
      {
        id,
        voucher,
        from: from.getBoundingClientRect(),
        to: target,
        onDone: () => {
          setFlights((list) => list.filter((x) => x.id !== id));
          onDone();
        },
      },
    ]);
  }, []);

  const redeem = useCallback(
    async (rewardId: string, from?: Element | null) => {
      try {
        const voucher = await adapter.redeemReward(rewardId);
        notify(Ticket, "Guardado en tu Wallet", `${voucher.title}. Vence en 24 horas.`);
        flyToWallet(voucher, from, () => void load());
        return true;
      } catch (error) {
        notify(TriangleAlert, "No pudimos hacer el canje", errorMessage(error, "Intenta de nuevo en un momento."));
        return false;
      }
    },
    [adapter, flyToWallet, load, notify],
  );

  const selectDesign = useCallback(
    async (designId: string) => {
      try {
        const next = await adapter.selectDesign(designId);
        setData((d) => ({ ...d, card: next }));
        const name = data.designs.find((x) => x.id === designId)?.name ?? "tu nuevo diseño";
        notify(Layers, `Tu tarjeta ahora usa ${name}`, "Puedes cambiarla cuando quieras desde Perfil.");
        return true;
      } catch (error) {
        notify(TriangleAlert, "No pudimos cambiar el diseño", errorMessage(error, "Intenta de nuevo."));
        return false;
      }
    },
    [adapter, data.designs, notify],
  );

  const demoActions = useMemo(() => {
    const actions = adapter.demo;
    if (!actions) return null;
    return {
      tierUp: () => {
        if (actions.tierUp()) void load();
      },
      complaint: (from?: Element | null) => {
        const voucher = actions.complaintGift();
        if (!voucher) return;
        notify(HeartHandshake, "La Bodega te regaló un postre", `${voucher.note}. Ya está en tu Wallet.`);
        flyToWallet(voucher, from, () => void load());
      },
      toggleVisits: () => {
        actions.toggleVisits();
        void load();
      },
    };
  }, [adapter, flyToWallet, load, notify]);

  const href = useCallback(
    (sub?: string) => (sub ? `${basePath}/${sub.replace(/^\//, "")}` : basePath),
    [basePath],
  );

  const activeVouchers = useMemo(
    () =>
      data.vouchers
        .filter((v) => v.status === "active")
        .sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime()),
    [data.vouchers],
  );

  const value: ClubValue = {
    ...data,
    member,
    sessionLoading: demo ? false : session.loading,
    demo,
    basePath,
    href,
    theme,
    themeClass: theme === "day" ? "mc2 day" : "mc2",
    toggleTheme,
    activeVouchers,
    reload: load,
    redeem,
    selectDesign,
    overlay,
    openOverlay: setOverlay,
    closeOverlay: () => setOverlay(null),
    notice,
    notify,
    flights,
    registerWalletTarget,
    demoActions,
  };

  return <ClubCtx.Provider value={value}>{children}</ClubCtx.Provider>;
}
