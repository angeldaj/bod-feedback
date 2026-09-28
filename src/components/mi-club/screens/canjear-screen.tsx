"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Flame, SearchX, Wallet } from "lucide-react";
import type { ClubReward } from "@/lib/club-api";
import { useClub } from "../club-provider";
import { categoryTone, fmtPts, rewardIcon } from "../club-visuals";
import { ImageSlot, Skeleton } from "../pieces";

const ALL = "Todo";

function RewardCard({
  reward,
  balance,
  featured,
  armed,
  busy,
  onPress,
}: {
  reward: ClubReward;
  balance: number;
  featured: boolean;
  armed: boolean;
  busy: boolean;
  onPress: (reward: ClubReward, el: HTMLButtonElement) => void;
}) {
  const ok = balance >= reward.points;
  const missing = reward.points - balance;
  const pct = Math.min(100, Math.round((balance / reward.points) * 100));
  return (
    <article className={`rc${featured ? " feat" : ""}`} data-locked={!ok}>
      <div className="rc-media">
        <ImageSlot tone={categoryTone(reward.category)} icon={rewardIcon(reward.name, reward.category)} caption={reward.name.toLowerCase()} src={reward.imageUrl} />
        <span className="rc-cost">
          {fmtPts(reward.points)}
          <small>pts</small>
        </span>
      </div>
      <div className="rc-body">
        {featured ? (
          <span className="rc-flag">
            <Flame aria-hidden="true" />
            El más pedido
          </span>
        ) : (
          <span className="rc-cat">{reward.category}</span>
        )}
        <h3>{reward.name}</h3>
        <p>{reward.description}</p>
        {ok ? null : (
          <div className="rc-prog">
            <div className="track" role="progressbar" aria-label={`Progreso hacia ${reward.name}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
              <span style={{ width: `${pct}%` }} />
            </div>
            <small>Te faltan {fmtPts(missing)} pts</small>
          </div>
        )}
        <button
          type="button"
          className={`btn btn-sm ${ok ? "btn-pop" : "btn-ghost"}${armed ? " armed" : ""}`}
          disabled={!ok || busy}
          onClick={(e) => onPress(reward, e.currentTarget)}
        >
          {!ok ? "Sigue sumando" : busy ? "Canjeando" : armed ? `Confirmar ${fmtPts(reward.points)} pts` : "Canjear"}
        </button>
      </div>
    </article>
  );
}

export function CanjearScreen() {
  const { rewards, card, loading, redeem } = useClub();
  const [cat, setCat] = useState(ALL);
  const [armedId, setArmedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const disarm = useRef<number | undefined>(undefined);
  const balance = card?.balance ?? 0;

  useEffect(() => () => window.clearTimeout(disarm.current), []);

  const categories = useMemo(() => [ALL, ...new Set(rewards.map((r) => r.category))], [rewards]);
  const list = rewards.filter((r) => cat === ALL || r.category === cat);
  const can = list.filter((r) => balance >= r.points);
  const later = list.filter((r) => balance < r.points).sort((a, b) => a.points - b.points);
  const featuredId = cat === ALL ? can.find((r) => r.featured)?.id : undefined;
  const canSorted = featuredId ? [...can.filter((r) => r.id === featuredId), ...can.filter((r) => r.id !== featuredId)] : can;

  async function handlePress(reward: ClubReward, el: HTMLButtonElement) {
    // Primer toque arma el botón; el segundo confirma. Evita canjes por accidente.
    if (armedId !== reward.id) {
      setArmedId(reward.id);
      window.clearTimeout(disarm.current);
      disarm.current = window.setTimeout(() => setArmedId(null), 3500);
      return;
    }
    window.clearTimeout(disarm.current);
    setArmedId(null);
    setBusyId(reward.id);
    await redeem(reward.id, el);
    setBusyId(null);
  }

  const renderGrid = (items: ClubReward[]) => (
    <div className="rc-grid">
      {items.map((r) => (
        <RewardCard key={r.id} reward={r} balance={balance} featured={r.id === featuredId} armed={armedId === r.id} busy={busyId === r.id} onPress={handlePress} />
      ))}
    </div>
  );

  return (
    <div className="view">
      <div className="v-head v-head-row">
        <div>
          <h1>Canjear</h1>
          <p>Cambia tus puntos por algo rico. El voucher se guarda en tu Wallet por 24 horas.</p>
        </div>
        <span className="bal">
          <Wallet aria-hidden="true" />
          <span>
            Tienes <span className="tab-nums">{fmtPts(balance)}</span> pts
          </span>
        </span>
      </div>

      <div className="fchips" role="group" aria-label="Filtrar recompensas">
        {categories.map((c) => (
          <button key={c} type="button" className="fchip" aria-pressed={cat === c} onClick={() => setCat(c)}>
            {c}
            <span className="n">{c === ALL ? rewards.length : rewards.filter((r) => r.category === c).length}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="rc-grid">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} height={300} />
          ))}
        </div>
      ) : (
        <div className="view" style={{ gap: 26 }}>
          {canSorted.length ? (
            <section className="rc-sec" aria-labelledby="rw-can">
              <div className="sec-head">
                <h2 id="rw-can">Ya puedes canjear</h2>
                <span className="muted-sm">
                  {canSorted.length} {canSorted.length === 1 ? "opción" : "opciones"}
                </span>
              </div>
              {renderGrid(canSorted)}
            </section>
          ) : null}
          {later.length ? (
            <section className="rc-sec" aria-labelledby="rw-later">
              <div className="sec-head">
                <h2 id="rw-later">Sigue sumando</h2>
                <span className="muted-sm">De la más cercana a la más lejana</span>
              </div>
              {renderGrid(later)}
            </section>
          ) : null}
          {!list.length ? (
            <div className="empty">
              <SearchX aria-hidden="true" />
              <b>No hay recompensas en esta categoría</b>
              <span>Prueba con otra o mira todas.</span>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
