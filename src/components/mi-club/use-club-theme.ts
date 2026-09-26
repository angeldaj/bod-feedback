"use client";

import { useCallback, useEffect, useState } from "react";

export type Theme = "day" | "night";

/**
 * Shared day/night theme for the Bodega Club surfaces. Reads and writes the same
 * `labodega-theme` key the landing uses, so a member who picked a theme keeps it
 * across /bodega-club, /login and /mi-club.
 */
export function useClubTheme() {
  const [theme, setTheme] = useState<Theme>("day");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("labodega-theme");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved === "day" || saved === "night") setTheme(saved);
    } catch {
      // The theme still works with the default when storage is unavailable.
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next = current === "day" ? "night" : "day";
      try {
        localStorage.setItem("labodega-theme", next);
      } catch {
        // Storage is optional; keep the in-memory theme.
      }
      return next;
    });
  }, []);

  return { theme, toggleTheme };
}
