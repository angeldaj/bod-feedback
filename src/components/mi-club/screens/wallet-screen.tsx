"use client";

import { Info } from "lucide-react";
import { useClub } from "../club-provider";
import { shortDate, voucherIcon } from "../club-visuals";
import { Skeleton, WalletPocket } from "../pieces";

export function WalletScreen() {
  const { loading, vouchers, activeVouchers } = useClub();
  const past = vouchers.filter((v) => v.status !== "active");

  return (
    <div className="view view-wallet">
      <div className="v-head">
        <h1>Bodega Wallet</h1>
        <p>
          {activeVouchers.length
            ? `${activeVouchers.length} ${activeVouchers.length === 1 ? "voucher listo" : "vouchers listos"} para usar en caja.`
            : "Aquí se guardan tus canjes y regalos."}
        </p>
      </div>

      {loading ? <Skeleton height={380} /> : <WalletPocket vouchers={activeVouchers} />}

      <div className="view" style={{ alignContent: "start" }}>
        <p className="rule-note">
          <Info aria-hidden="true" />
          <span>En una misma visita puedes usar un descuento y todos los productos gratis que tengas. La caja los ve al escanear tu tarjeta.</span>
        </p>
        <div className="sec-head">
          <h2>Usados y vencidos</h2>
        </div>
        {past.length ? (
          <div className="list">
            {past.map((v) => {
              const Icon = voucherIcon(v);
              return (
                <div className="row" key={v.id}>
                  <span className="ic muted">
                    <Icon aria-hidden="true" />
                  </span>
                  <span className="tx">
                    <b>{v.title}</b>
                    <small>
                      {v.status === "used"
                        ? `Usado el ${shortDate(v.usedAt ?? v.expiresAt)}${v.usedAtBranch ? `, ${v.usedAtBranch}` : ""}`
                        : `Venció el ${shortDate(v.expiresAt)} sin usar`}
                    </small>
                  </span>
                  <span className="end dim">{v.status === "used" ? "Usado" : "Vencido"}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="muted-sm">Todavía no has usado ningún voucher.</p>
        )}
      </div>
    </div>
  );
}
