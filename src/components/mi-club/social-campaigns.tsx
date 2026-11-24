"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, ExternalLink, MessageCircleHeart, PartyPopper, SearchCheck, Ticket } from "lucide-react";
import { canVerifyTikTok } from "@/lib/social-verification";
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
  const { requestSocialCode, verifyTikTokComment, notify } = useClub();
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState("");
  const verification = useRef<AbortController | null>(null);
  useEffect(() => () => verification.current?.abort(), []);

  async function verifyComment() {
    if (verification.current) return;
    const controller = new AbortController();
    verification.current = controller;
    setVerifying(true);
    setVerificationMessage("Estamos buscando tu código en los comentarios. Puede tardar unos minutos.");
    try {
      const message = await verifyTikTokComment(campaign.id, controller.signal);
      if (!controller.signal.aborted) setVerificationMessage(message);
    } finally {
      if (!controller.signal.aborted) setVerifying(false);
      verification.current = null;
    }
  }
  const status = campaign.participationStatus;
  const networks = campaign.networks ?? ['instagram'];
  const participations = campaign.participations ?? networks.map((network) => ({ network, status, awardedPoints: status === 'completed' ? campaign.points : 0, completedAt: campaign.completedAt }));
  const awardedTotal = participations.reduce((sum, item) => sum + item.awardedPoints, 0);

  async function getCode() {
    setBusy(true);
    try { await requestSocialCode(campaign.id); } finally { setBusy(false); }
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
        <span className="pill coral sc-pts">+{fmtPts(campaign.points)} pts{networks.length > 1 ? " / red" : ""}</span>
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
          <p className="sc-note">Usa el mismo código en cada red habilitada. Puedes ganar una vez en cada una.</p>
        </>
      ) : null}

      <ul className="sc-networks" aria-label="Participación por red">
        {participations.map((participation) => {
          const instagram = participation.network === 'instagram';
          const name = instagram ? 'Instagram' : 'TikTok';
          const done = participation.status === 'completed';
          const url = instagram ? campaign.postUrl : campaign.tiktokUrl;
          return <li key={participation.network} className="sc-network" data-completed={done}>
            <div><b>{name}</b><span role="status">{done ? `+${fmtPts(participation.awardedPoints)} pts acreditados` : participation.status === 'closed' ? 'Sin acreditar' : 'Pendiente'}</span></div>
            {!done && status !== 'closed' && <p>{instagram ? 'Comenta tu código en la publicación.' : 'Comenta tu código en el video de TikTok.'}</p>}
            {instagram && !done && participation.status === 'pending' && <p>Estamos verificando tu comentario. Los puntos aparecerán aquí cuando lo confirmemos.</p>}
            <div className="sc-network-actions">
              {!done && status !== 'closed' && url && <a className="btn btn-ghost btn-sm" href={url} target="_blank" rel="noreferrer">Abrir {name}<ExternalLink aria-hidden="true" /></a>}
              {!instagram && canVerifyTikTok(campaign) && <button type="button" className="btn btn-pop btn-sm" onClick={() => void verifyComment()} disabled={verifying} aria-busy={verifying}>
                <SearchCheck aria-hidden="true" />{verifying ? "Verificando…" : "Verificar mi comentario"}
              </button>}
            </div>
            {!instagram && (verificationMessage || canVerifyTikTok(campaign)) && <p role="status">{verificationMessage || "Después de comentar tu código, pulsa Verificar mi comentario."}</p>}
          </li>;
        })}
      </ul>

      {status === "completed" ? (
        <p className="sc-done" role="status">
          <PartyPopper aria-hidden="true" />
          <span>
            ¡Listo! Sumaste <b className="tab-nums">{fmtPts(awardedTotal)} pts</b>
            {campaign.completedAt ? ` el ${shortDate(campaign.completedAt)}` : ""}. Gracias por participar.
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
