"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import {
  CircleAlert,
  FlaskConical,
  Gift,
  House,
  Moon,
  ReceiptText,
  ShoppingBag,
  Sun,
  UserRound,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { ClubProvider, useClub, type ClubMode } from "./club-provider";
import { ClubOverlays } from "./overlays";
import { WheelIcon } from "./club-visuals";
import { BakeryBackdrop, BakingLoaf, MemberAvatar, WheatField } from "./bakery-scene";
import "./mi-club.css";
import "./panaderia.css";
import "./pixel.css";

const TABS: { sub: string; label: string; icon: LucideIcon }[] = [
  { sub: "", label: "Inicio", icon: House },
  { sub: "wallet", label: "Wallet", icon: Wallet },
  { sub: "ruleta", label: "Ruleta", icon: WheelIcon },
  { sub: "canjear", label: "Canjear", icon: Gift },
  { sub: "pedidos", label: "Pedidos", icon: ShoppingBag },
  { sub: "actividad", label: "Actividad", icon: ReceiptText },
  { sub: "perfil", label: "Perfil", icon: UserRound },
];

function TabLinks({
  pathname,
  walletCount,
  spinCount,
  showRuleta,
  register,
  basePath,
  bar = false,
}: {
  pathname: string;
  walletCount: number;
  spinCount: number;
  /** Sin ruleta activa (`wheel: null`) la pestaña no aparece. */
  showRuleta: boolean;
  register: (el: HTMLElement | null) => void;
  basePath: string;
  /** En la barra inferior no cabe Perfil: se llega desde el avatar de arriba. */
  bar?: boolean;
}) {
  return (
    <>
      {TABS.filter(({ sub }) => (sub !== "ruleta" || showRuleta) && !(bar && sub === "perfil")).map(({ sub, label, icon: Icon }) => {
        const href = sub ? `${basePath}/${sub}` : basePath;
        const active = sub ? pathname === href || pathname.startsWith(`${href}/`) : pathname === href;
        const isWallet = sub === "wallet";
        const isRuleta = sub === "ruleta";
        return (
          <Link
            key={href}
            href={href}
            ref={isWallet ? register : undefined}
            aria-current={active ? "page" : undefined}
            aria-label={
              isWallet && walletCount
                ? `Wallet, ${walletCount} vouchers activos`
                : isRuleta && spinCount
                  ? `Ruleta, ${spinCount} ${spinCount === 1 ? "tirada disponible" : "tiradas disponibles"}`
                  : undefined
            }
          >
            <Icon aria-hidden="true" strokeWidth={1.8} />
            {label}
            {isWallet && walletCount ? <span className="count" aria-hidden="true">{walletCount}</span> : null}
            {isRuleta && spinCount ? <span className="count" aria-hidden="true">{spinCount}</span> : null}
          </Link>
        );
      })}
    </>
  );
}

const subscribeNoop = () => () => undefined;

function ShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const reduce = useReducedMotion();
  const isClient = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const { themeClass, theme, toggleTheme, member, sessionLoading, activeVouchers, registerWalletTarget, error, reload, demo, basePath, href, spins, spinsLoaded, avatarUrl } =
    useClub();
  // Mientras carga se muestra la pestaña: ocultarla solo cuando sabemos que no hay ruleta evita que la barra salte.
  const showRuleta = !spinsLoaded || !!spins?.wheel;
  const spinCount = spins?.wheel ? spins.available : 0;

  useEffect(() => {
    if (!demo && !sessionLoading && !member) {
      router.replace(`/login?returnTo=${encodeURIComponent(pathname)}`);
    }
  }, [demo, member, pathname, router, sessionLoading]);

  if (sessionLoading || !member) {
    return (
      <div className={`${themeClass} mc2-page mc2-loading`}>
        <BakeryBackdrop />
        <div className="oven-wait" role="status">
          <BakingLoaf loop />
          <p>Horneando tu cuenta…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${themeClass} mc2-page`}>
      <BakeryBackdrop />
      <a href="#mc2-main" className="sr-only">
        Saltar al contenido
      </a>
      <header className="topbar-wrap">
        <div className="topbar">
          <Link href={href()} className="mark" aria-label="Bodega Club, inicio del área de socios">
            <span className="mark-logo">
              <Image src="/logo-bodega.png" alt="" width={28} height={28} />
            </span>
            <span>
              <b>Bodega Club</b>
              <small>{demo ? "Demo" : "Área de socios"}</small>
            </span>
          </Link>
          <nav className="top-tabs" aria-label="Secciones de mi-club">
            <TabLinks
              pathname={pathname}
              walletCount={activeVouchers.length}
              spinCount={spinCount}
              showRuleta={showRuleta}
              register={registerWalletTarget}
              basePath={basePath}
            />
          </nav>
          <div className="top-actions">
            <button type="button" className="icon-btn" onClick={toggleTheme} aria-label={theme === "day" ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}>
              {theme === "day" ? <Moon aria-hidden="true" /> : <Sun aria-hidden="true" />}
            </button>
            <Link href={href("perfil")} className="avatar-link" aria-label="Tu perfil">
              <MemberAvatar name={member.fullName} src={avatarUrl} size="sm" />
            </Link>
          </div>
        </div>
      </header>

      <main className="main" id="mc2-main" tabIndex={-1}>
        {demo ? (
          <p className="rule-note" style={{ marginBottom: 18 }}>
            <FlaskConical aria-hidden="true" />
            <span>
              Demo de Bodega Club con una socia de ejemplo: nada de lo que hagas aquí es real. En Perfil puedes simular una subida de nivel o un
              regalo de la casa. <Link href="/login?returnTo=%2Fmi-club">Entra a tu cuenta</Link> para ver la tuya.
            </span>
          </p>
        ) : null}
        {error ? (
          <div className="alert" role="alert" style={{ marginBottom: 18 }}>
            <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <CircleAlert size={18} aria-hidden="true" />
              {error}
            </span>
            <button type="button" onClick={() => void reload()}>
              Reintentar
            </button>
          </div>
        ) : null}
        <motion.div key={pathname} initial={reduce ? false : { y: 10 }} animate={{ y: 0 }} transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}>
          {children}
        </motion.div>
      </main>

      <footer className="field-foot">
        <div className="field-copy">
          <b>Bodega Club</b>
          <span>Pan del día, café y puntos en cada visita.</span>
        </div>
        <WheatField />
      </footer>

      {isClient
        ? createPortal(
            // En <body>: ningún contenedor de la página puede recortar ni tapar la barra fija.
            <div className={themeClass}>
              <nav className="nav" aria-label="Secciones de mi-club">
                <TabLinks
                  bar
                  pathname={pathname}
                  walletCount={activeVouchers.length}
                  spinCount={spinCount}
                  showRuleta={showRuleta}
                  register={registerWalletTarget}
                  basePath={basePath}
                />
              </nav>
            </div>,
            document.body,
          )
        : null}

      <ClubOverlays />
    </div>
  );
}

/**
 * Marco del área de socios: sesión, datos del club, navegación y overlays.
 * `/mi-club` lo monta en modo `live` (backend real); `/club-mock` en `demo`.
 */
export function MiClubShell({
  children,
  mode = "live",
  basePath = "/mi-club",
}: {
  children: React.ReactNode;
  mode?: ClubMode;
  basePath?: string;
}) {
  return (
    <ClubProvider mode={mode} basePath={basePath}>
      <ShellInner>{children}</ShellInner>
    </ClubProvider>
  );
}
