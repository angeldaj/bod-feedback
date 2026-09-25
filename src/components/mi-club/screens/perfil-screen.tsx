"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowBigUpDash,
  AtSign,
  Bell,
  Check,
  ChevronRight,
  CircleAlert,
  FlaskConical,
  HeartHandshake,
  IdCard,
  Layers,
  LoaderCircle,
  LogOut,
  Mail,
  MessageCircle,
  Footprints,
} from "lucide-react";
import { useMember } from "@/lib/member-session";
import * as loyaltyApi from "@/lib/loyalty-api";
import type { MemberNotification, NotificationPreferences } from "@/lib/loyalty-api";
import { useClub } from "../club-provider";
import { SKIN_NAME } from "../club-visuals";

type PrefKey = keyof NotificationPreferences;

const PREFS: { key: PrefKey; icon: typeof Bell; title: string; desc: string }[] = [
  { key: "whatsapp", icon: MessageCircle, title: "Avisos por WhatsApp", desc: "Puntos, canjes y recordatorios." },
  { key: "offers", icon: Bell, title: "Ofertas y puntos dobles", desc: "Te avisamos antes de cada campaña." },
  { key: "email", icon: Mail, title: "Resumen por correo", desc: "Tu estado de cuenta cada mes." },
];

const DEMO_INBOX: MemberNotification[] = [
  { id: "n1", kind: "grant", title: "Te regalamos un postre", body: "Por tu caso Q-0042. Ya está en tu Wallet.", readAt: null, createdAt: new Date().toISOString() },
  { id: "n2", kind: "points", title: "Sumaste 38 puntos", body: "Almuerzo en Sede Alta Vista.", readAt: new Date().toISOString(), createdAt: new Date().toISOString() },
];

export function PerfilScreen() {
  const router = useRouter();
  const session = useMember();
  const { member, card, designs, demo, demoActions, openOverlay, notify } = useClub();

  const [name, setName] = useState(member?.fullName ?? "");
  const [username, setUsername] = useState(member?.username ?? "");
  const [whatsapp, setWhatsapp] = useState(member?.whatsapp ?? "");
  const [email, setEmail] = useState(member?.email ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState("");
  const [prefs, setPrefs] = useState<NotificationPreferences>(
    member?.notificationPreferences ?? { whatsapp: true, email: false, offers: true },
  );
  const [inbox, setInbox] = useState<MemberNotification[]>(demo ? DEMO_INBOX : []);

  useEffect(() => {
    if (demo) return;
    let alive = true;
    session
      .authedRequest((token) => loyaltyApi.getNotifications(token))
      .then((list) => alive && setInbox(list))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
    // Solo al montar: el buzón no necesita refrescarse mientras editas el perfil.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demo]);

  if (!member) return null;
  const designName = designs.find((d) => d.id === card?.designId)?.name ?? "Clásica";

  async function handleSave() {
    setStatus("saving");
    setSaveError("");
    if (demo) {
      setStatus("saved");
      notify(FlaskConical, "Modo demo", "Los cambios de perfil no se guardan en la demo.");
      window.setTimeout(() => setStatus("idle"), 2400);
      return;
    }
    try {
      await session.updateProfile({ name: name.trim(), username: username.trim() || undefined, whatsapp: whatsapp.trim(), email: email.trim() });
      setStatus("saved");
      window.setTimeout(() => setStatus("idle"), 2400);
    } catch (error) {
      setStatus("error");
      setSaveError(error instanceof Error ? error.message : "No pudimos guardar los cambios.");
    }
  }

  async function togglePref(key: PrefKey) {
    const next = !prefs[key];
    setPrefs((p) => ({ ...p, [key]: next }));
    if (demo) return;
    try {
      await session.authedRequest((token) => loyaltyApi.updateNotificationPreferences(token, { [key]: next }));
      await session.refreshMember();
    } catch {
      setPrefs((p) => ({ ...p, [key]: !next }));
      notify(CircleAlert, "No pudimos guardar esa preferencia", "Intenta de nuevo en un momento.");
    }
  }

  async function markRead(id: string) {
    setInbox((list) => list.map((n) => (n.id === id ? { ...n, readAt: n.readAt ?? new Date().toISOString() } : n)));
    if (!demo) await session.authedRequest((token) => loyaltyApi.markNotificationRead(token, id)).catch(() => undefined);
  }

  async function handleLogout() {
    if (!demo) await session.logout();
    router.push(demo ? "/bodega-club" : "/login");
  }

  return (
    <div className="view">
      <div className="v-head">
        <h1>Perfil</h1>
        <p>
          {member.fullName}, {member.cedula}
        </p>
      </div>

      <div className="prof-grid">
        <div className="view" style={{ gap: 16, alignContent: "start" }}>
          <div className="list">
            <button type="button" className="row row-btn" onClick={() => openOverlay({ type: "gallery" })}>
              <span className="ic">
                <Layers aria-hidden="true" />
              </span>
              <span className="tx">
                <b>Diseño de tarjeta</b>
                <small>
                  {designName} sobre piel {card ? SKIN_NAME[card.tier.skin] : ""}
                </small>
              </span>
              <ChevronRight aria-hidden="true" size={18} />
            </button>
          </div>

          <section className="tile" aria-labelledby="pf-account">
            <h2 id="pf-account">Datos de la cuenta</h2>
            <div className="fields">
              <label className="field">
                <span>Nombre</span>
                <input id="pf-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
              </label>
              <label className="field">
                <span>Nombre de usuario</span>
                <input id="pf-user" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" placeholder="tu.usuario" />
              </label>
              <label className="field">
                <span>WhatsApp</span>
                <input id="pf-wa" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} inputMode="tel" autoComplete="tel" />
              </label>
              <label className="field">
                <span>Correo</span>
                <input id="pf-mail" value={email} onChange={(e) => setEmail(e.target.value)} type="email" inputMode="email" autoComplete="email" />
              </label>
            </div>
            <div className="meta-line">
              <span>
                <IdCard aria-hidden="true" />
                Cédula: {member.cedula}
              </span>
              {member.username ? (
                <span>
                  <AtSign aria-hidden="true" />
                  {member.username}
                </span>
              ) : null}
            </div>
            {status === "error" ? (
              <p className="form-error" role="alert">
                <CircleAlert aria-hidden="true" />
                {saveError}
              </p>
            ) : null}
            <button type="button" className="btn btn-ghost" style={{ marginTop: 16 }} onClick={handleSave} disabled={status === "saving"}>
              {status === "saving" ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Check aria-hidden="true" />}
              {status === "saving" ? "Guardando" : status === "saved" ? "Guardado" : "Guardar cambios"}
            </button>
          </section>
        </div>

        <div className="view" style={{ gap: 16, alignContent: "start" }}>
          <section className="tile" aria-labelledby="pf-inbox">
            <h2 id="pf-inbox">Buzón</h2>
            {inbox.length ? (
              <ul className="inbox" aria-live="polite" style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {inbox.slice(0, 6).map((n) => (
                  <li key={n.id}>
                    <button type="button" disabled={Boolean(n.readAt)} onClick={() => markRead(n.id)}>
                      <b>
                        {n.title}
                        {!n.readAt ? <i aria-label="Sin leer" /> : null}
                      </b>
                      <small>{n.body}</small>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted-sm">Todavía no tienes avisos. Aquí aparecerán tus puntos, canjes y regalos.</p>
            )}
          </section>

          <section className="tile" aria-labelledby="pf-notif">
            <h2 id="pf-notif">Notificaciones</h2>
            {PREFS.map(({ key, icon: Icon, title, desc }) => (
              <button key={key} type="button" role="switch" aria-checked={prefs[key]} className="switch" onClick={() => togglePref(key)}>
                <span style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <Icon aria-hidden="true" size={20} style={{ color: "var(--coral)", marginTop: 2 }} />
                  <span className="tx">
                    <b>{title}</b>
                    <small>{desc}</small>
                  </span>
                </span>
                <span className="kn" aria-hidden="true" />
              </button>
            ))}
          </section>

          {demoActions ? (
            <section className="tile demo-tile" aria-labelledby="pf-demo">
              <h2 id="pf-demo">Simular en la demo</h2>
              <p className="muted-sm" style={{ marginBottom: 12 }}>
                En producción estas cosas las dispara el club: subir de nivel al sumar puntos, un regalo al compensar una queja y llegar a 10
                visitas.
              </p>
              <div className="fields">
                <button type="button" className="btn btn-soft btn-sm" onClick={demoActions.tierUp} disabled={!card?.nextTier}>
                  <ArrowBigUpDash aria-hidden="true" />
                  Subir de nivel
                </button>
                <button type="button" className="btn btn-soft btn-sm" onClick={(e) => demoActions.complaint(e.currentTarget)}>
                  <HeartHandshake aria-hidden="true" />
                  Compensar una queja
                </button>
                <button type="button" className="btn btn-soft btn-sm" onClick={demoActions.toggleVisits}>
                  <Footprints aria-hidden="true" />
                  {card && card.visits >= 10 ? "Volver a 7 visitas" : "Llegar a 10 visitas"}
                </button>
              </div>
            </section>
          ) : null}

          <div className="list">
            <button type="button" className="row row-btn" onClick={handleLogout}>
              <span className="ic muted">
                <LogOut aria-hidden="true" />
              </span>
              <span className="tx">
                <b>Cerrar sesión</b>
                <small>Sesión iniciada como {member.username ? `@${member.username}` : member.cedula}</small>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
