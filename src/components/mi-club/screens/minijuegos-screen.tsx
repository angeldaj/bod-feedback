"use client";

import { SpinTile } from "./home-screen";
import { BodingoTile } from "./bodingo-screen";
import { PalabraTile } from "./palabra-screen";
import { RaspaditoTile } from "./raspadito-screen";

/** Todos los juegos del club en un solo lugar. Cada tarjeta se oculta sola si su juego está apagado. */
export function MinijuegosScreen() {
  return (
    <div className="view view-minijuegos">
      <div className="v-head">
        <h1>Minijuegos</h1>
        <p>Gira, canta bingo o adivina la palabra del día. Todo suma puntos.</p>
      </div>
      <div className="mg-list">
        <SpinTile />
        <BodingoTile />
        <PalabraTile />
        <RaspaditoTile />
      </div>
    </div>
  );
}
