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
  ClubCard,
  ClubContext,
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

type ClubValue = ClubData & {
  member: Member | null;
  sessionLoading: boolean;
  demo: boolean;
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

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function ClubProvider({ children }: { children: ReactNode }) {
  const session = useMember();
  const member = club.CLUB_DEMO ? club.DEMO_MEMBER : session.member;
  const { theme, toggleTheme } = useClubTheme();
  const [data, setData] = useState<ClubData>(EMPTY);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [flights, setFlights] = useState<Flight[]>([]);
  const noticeTimer = useRef<number | undefined>(undefined);
  const seq = useRef(0);
  const walletTargets = useRef(new Set<HTMLElement>());

  const { authedRequest } = session;
  const run = useCallback(
    <T,>(fn: (ctx: ClubContext) => Promise<T>): Promise<T> => {
      if (club.CLUB_SOURCE === "api" && !club.CLUB_DEMO) {
        return authedRequest((accessToken) => fn({ accessToken, member }));
      }
      return fn({ accessToken: null, member });
    },
    [authedRequest, member],
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
        run(club.getCard),
        run(club.listDesigns),
        run(club.listVouchers),
        run(club.listRewards),
        run(club.getActivity),
      ]);
      setData({ loading: false, error: null, card, designs, vouchers, rewards, activity });
    } catch (error) {
      setData((d) => ({ ...d, loading: false, error: errorMessage(error, "No pudimos cargar tu cuenta. Intenta de nuevo.") }));
    }
  }, [member, run]);

  useEffect(() => {
    void load();
  }, [load]);

  // Subida de nivel: se compara el rango actual con el último que vio este socio.
  const card = data.card;
  useEffect(() => {
    if (!card || !member) return;
    try {
      const stored = localStorage.getItem(TIER_KEY(member.id));
      localStorage.setItem(TIER_KEY(member.id), String(card.tier.rank));
      if (stored !== null && Number(stored) < card.tier.rank) {
        const from = club.TIERS[Number(stored)] ?? club.TIERS[0];
        setOverlay({ type: "levelup", from, to: card.tier });
      }
    } catch {
      // Sin storage no hay animación de subida, pero la tarjeta ya muestra el nivel nuevo.
    }
  }, [card, member]);

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
        const voucher = await run((ctx) => club.redeemReward(ctx, rewardId));
        notify(Ticket, "Guardado en tu Wallet", `${voucher.title}. Vence en 24 horas.`);
        flyToWallet(voucher, from, () => void load());
        return true;
      } catch (error) {
        notify(TriangleAlert, "No pudimos hacer el canje", errorMessage(error, "Intenta de nuevo en un momento."));
        return false;
      }
    },
    [flyToWallet, load, notify, run],
  );

  const selectDesign = useCallback(
    async (designId: string) => {
      try {
        const next = await run((ctx) => club.selectDesign(ctx, designId));
        setData((d) => ({ ...d, card: next }));
        const name = data.designs.find((x) => x.id === designId)?.name ?? "tu nuevo diseño";
        notify(Layers, `Tu tarjeta ahora usa ${name}`, "Puedes cambiarla cuando quieras desde Perfil.");
        return true;
      } catch (error) {
        notify(TriangleAlert, "No pudimos cambiar el diseño", errorMessage(error, "Intenta de nuevo."));
        return false;
      }
    },
    [data.designs, notify, run],
  );

  const demoActions = useMemo(() => {
    if (club.CLUB_SOURCE !== "mock") return null;
    return {
      tierUp: () => {
        if (club.demoTierUp(member)) void load();
      },
      complaint: (from?: Element | null) => {
        const voucher = club.demoComplaintGift(member);
        if (!voucher) return;
        notify(HeartHandshake, "La Bodega te regaló un postre", `${voucher.note}. Ya está en tu Wallet.`);
        flyToWallet(voucher, from, () => void load());
      },
      toggleVisits: () => {
        club.demoToggleVisits(member);
        void load();
      },
    };
  }, [flyToWallet, load, member, notify]);

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
    sessionLoading: club.CLUB_DEMO ? false : session.loading,
    demo: club.CLUB_DEMO,
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
