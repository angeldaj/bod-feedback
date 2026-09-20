"use client";

import { useEffect, useState } from "react";
import { fetchBranches, type Branch } from "./feedback-api";

/**
 * Trae las sucursales reales del backend (`GET /feedback/branches`) para poblar
 * los selectores de la encuesta y la queja. Reemplaza la lista hardcodeada
 * `SUCURSALES`: el nombre elegido tiene que existir en la BD para poder enviar.
 */
export function useBranches(): {
  branches: Branch[];
  names: string[];
  loading: boolean;
  error: string | null;
} {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchBranches()
      .then((list) => {
        if (alive) setBranches(list);
      })
      .catch(() => {
        if (alive) setError("No pudimos cargar las sucursales. Reintenta más tarde.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  return { branches, names: branches.map((branch) => branch.name), loading, error };
}
