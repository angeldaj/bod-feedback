"use client";

import { useCallback, useEffect, useState } from "react";
import { useMember } from "@/lib/member-session";
import * as loyaltyApi from "@/lib/loyalty-api";
import type {
  MemberNotification,
  PointsMovement,
} from "@/lib/loyalty-api";
import type { ClubEvent, PointsPoint, Purchase, Reward } from "./data";

const MONTH_LABELS = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
] as const;

/** Agrupa los movimientos positivos (ganados) por mes, últimos 8 meses con datos. */
function deriveMonthlySeries(movements: PointsMovement[]): PointsPoint[] {
  const byMonth = new Map<string, number>();
  for (const movement of movements) {
    if (movement.points <= 0) continue;
    const date = new Date(movement.occurredAt);
    if (Number.isNaN(date.getTime())) continue;
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    byMonth.set(key, (byMonth.get(key) ?? 0) + movement.points);
  }
  return [...byMonth.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .slice(-8)
    .map(([key, earned]) => {
      const monthIdx = Number(key.split("-")[1]);
      return { month: MONTH_LABELS[monthIdx] ?? "", earned };
    });
}

function countVisitsThisMonth(purchases: Purchase[]): number {
  const now = new Date();
  return purchases.filter((p) => {
    const d = new Date(p.date);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;
}

type State = {
  loading: boolean;
  error: string | null;
  purchases: Purchase[];
  movements: PointsMovement[];
  pointsSeries: PointsPoint[];
  visitsThisMonth: number;
  rewards: Reward[];
  events: ClubEvent[];
  notifications: MemberNotification[];
  qrValue: string;
};

const EMPTY_STATE: State = {
  loading: true,
  error: null,
  purchases: [],
  movements: [],
  pointsSeries: [],
  visitsThisMonth: 0,
  rewards: [],
  events: [],
  notifications: [],
  qrValue: "",
};

/**
 * Carga los datos reales del panel /mi-club (spec 069/070): actividad,
 * recompensas, eventos, notificaciones y el QR de identificación. `MOST_FREQUENT`
 * ("tu clásico") y la racha del mock quedan fuera: el backend v1 no los
 * entrega y no hay forma confiable de derivarlos del lado del cliente todavía.
 */
export function useMemberData() {
  const { member, authedRequest } = useMember();
  const [state, setState] = useState<State>(EMPTY_STATE);

  const load = useCallback(async () => {
    if (!member) return;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const [activity, rewards, events, notifications, qr] = await Promise.all([
        authedRequest((token) => loyaltyApi.getActivity(token)),
        authedRequest((token) => loyaltyApi.getRewards(token)),
        authedRequest((token) => loyaltyApi.getEvents(token)),
        authedRequest((token) => loyaltyApi.getNotifications(token)),
        authedRequest((token) => loyaltyApi.getQr(token)),
      ]);
      setState({
        loading: false,
        error: null,
        purchases: activity.purchases,
        movements: activity.movements,
        pointsSeries: deriveMonthlySeries(activity.movements),
        visitsThisMonth: countVisitsThisMonth(activity.purchases),
        rewards,
        events,
        notifications,
        qrValue: qr.value,
      });
    } catch (error) {
      setState((s) => ({
        ...s,
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : "No pudimos cargar tu actividad. Reintenta más tarde.",
      }));
    }
  }, [member, authedRequest]);

  useEffect(() => {
    load();
  }, [load]);

  const redeem = useCallback(
    async (rewardId: string) => {
      const redemption = await authedRequest((token) => loyaltyApi.requestRedemption(token, rewardId));
      // El canje reserva puntos del saldo disponible: refresca recompensas/actividad.
      load();
      return redemption;
    },
    [authedRequest, load],
  );

  const markNotificationRead = useCallback(
    async (id: string) => {
      await authedRequest((token) => loyaltyApi.markNotificationRead(token, id));
      setState((s) => ({
        ...s,
        notifications: s.notifications.map((n) =>
          n.id === id ? { ...n, readAt: n.readAt ?? new Date().toISOString() } : n,
        ),
      }));
    },
    [authedRequest],
  );

  return { ...state, reload: load, redeem, markNotificationRead };
}
