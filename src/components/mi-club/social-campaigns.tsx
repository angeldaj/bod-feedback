"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, MessageCircleHeart, PartyPopper, Ticket } from "lucide-react";
import type { SocialCampaign } from "@/lib/club-api";
import { useClub } from "./club-provider";
import { fmtPts, shortDate } from "./club-visuals";

/**
 * Campañas de Instagram (spec 087) debajo de la tarjeta, en Inicio. Solo aparece
 * si el backend devuelve alguna: vigentes, o recién cerradas en las que el socio
 * participó (para que vea cómo terminó).
 */
export function SocialCampaignsSection() {
  const { socialCampaigns } = useClub();
  if (socialCampaigns.length === 0) return null;
  return (
    <section className="social-sec" aria-labelledby="social-sec-title">
      <div className="sec-head">
        <h2 id="social-sec-title">Campañas</h2>
      </div>
      {socialCampaigns.map((campaign) => (
        <SocialCampaignCard key={campaign.id} campaign={campaign} />
      ))}
    </section>
  );
}

function SocialCampaignCard({ campaign }: { campaign: SocialCampaign }) {
  const { requestSocialCode, notify } = useClub();
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const status = campaign.participationStatus;

  async function getCode() {
    setBusy(true);
    await requestSocialCode(campaign.id);
    setBusy(false);
  }

  async function copy() {
    if (!campaign.code) return;
    try {
      await navigator.clipboard.writeText(campaign.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      notify(Ticket, "Cópialo a mano", `Tu código es ${campaign.code}.`);
    }
  }

  return (
    <article className="tile social-card" data-status={status}>
      <header className="sc-top">
        <span className="sc-ic" aria-hidden="true">
          <MessageCircleHeart />
        </span>
        <div className="sc-head">
          <h3>{campaign.title}</h3>
          <small>
            {status === "closed"
              ? campaign.status === "paused"
                ? "En pausa por ahora"
                : "Campaña cerrada"
              : `Cierra el ${shortDate(campaign.endsAt)}`}
          </small>
        </div>
        <span className="pill coral sc-pts">+{fmtPts(campaign.points)} pts</span>
      </header>

      {status !== "completed" && campaign.instructions ? <p className="sc-copy">{campaign.instructions}</p> : null}

      {status === "available" ? (
        <button type="button" className="btn btn-pop btn-sm sc-cta" onClick={() => void getCode()} disabled={busy} aria-busy={busy}>
          <Ticket aria-hidden="true" />
          {busy ? "Generando…" : "Obtener mi código"}
        </button>
      ) : null}

      {status === "pending" && campaign.code ? (
        <>
          <div className="sc-code">
            <span className="sc-code-label">Tu código</span>
            <b className="sc-code-value">{campaign.code}</b>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => void copy()}>
              {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
              {copied ? "Copiado" : "Copiar"}
            </button>
          </div>
          <ol className="sc-steps">
            <li>Abre la publicación y comenta tu código tal cual.</li>
            <li>Cuando Instagram nos avise, sumamos los puntos. Vuelve aquí a revisarlo.</li>
          </ol>
          <p className="sc-note">Tu comentario es público: cualquiera verá el código. Úsalo solo tú y no lo compartas antes.</p>
          {campaign.postUrl ? (
            <a className="btn btn-pop btn-sm sc-cta" href={campaign.postUrl} target="_blank" rel="noreferrer">
              Abrir la publicación
              <ExternalLink aria-hidden="true" />
            </a>
          ) : null}
          <p className="sc-status" role="status">
            <span className="dot" aria-hidden="true" />
            Pendiente: aún no recibimos tu comentario.
          </p>
        </>
      ) : null}

      {status === "completed" ? (
        <p className="sc-done" role="status">
          <PartyPopper aria-hidden="true" />
          <span>
            ¡Listo! Sumaste <b className="tab-nums">{fmtPts(campaign.points)} pts</b>
            {campaign.completedAt ? ` el ${shortDate(campaign.completedAt)}` : ""}. Gracias por comentar.
          </span>
        </p>
      ) : null}

      {status === "closed" ? (
        <p className="sc-status muted">
          {campaign.status === "paused"
            ? "Mientras esté en pausa no se suman puntos. Te avisaremos si vuelve."
            : "Ya no se suman puntos por esta campaña."}
        </p>
      ) : null}
    </article>
  );
}
