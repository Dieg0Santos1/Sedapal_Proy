import { useMemo } from 'react';

/**
 * Guardia de expiración de la app.
 * 
 * Estrategias soportadas:
 * - Duración relativa desde el primer uso (VITE_TRIAL_DURATION_MS)
 * - Fecha absoluta de expiración en UTC (VITE_EXPIRES_AT_UTC = '2025-12-31T23:59:59Z')
 * - Deshabilitar (VITE_EXPIRY_DISABLED = 'true')
 */
export function useExpiryGuard() {
  const disabled = (import.meta.env.VITE_EXPIRY_DISABLED ?? '').toString().toLowerCase() === 'true';
  const durationMsEnv = import.meta.env.VITE_TRIAL_DURATION_MS as string | undefined; // p.ej. '300000' (5 min)
  const expiresAtUtcEnv = import.meta.env.VITE_EXPIRES_AT_UTC as string | undefined; // ISO, p.ej. '2025-12-31T23:59:59Z'

  return useMemo(() => {
    if (disabled) {
      return { expired: false, remainingMs: Number.POSITIVE_INFINITY, expiresAt: null as Date | null };
    }

    let expiresAt: Date | null = null;

    // Preferencia: fecha absoluta
    if (expiresAtUtcEnv && !isNaN(Date.parse(expiresAtUtcEnv))) {
      expiresAt = new Date(expiresAtUtcEnv);
    } else {
      // Duración relativa desde el primer uso
      const key = 'app_first_seen_iso';
      let firstSeen = localStorage.getItem(key);
      if (!firstSeen) {
        firstSeen = new Date().toISOString();
        try { localStorage.setItem(key, firstSeen); } catch {}
      }
      const firstSeenMs = Date.parse(firstSeen);
      const durationMs = Number.isFinite(Number(durationMsEnv)) ? parseInt(durationMsEnv!) : 1814400000; // default 5 min
      expiresAt = new Date(firstSeenMs + durationMs);
    }
    
    const now = new Date();
    const expired = expiresAt ? now.getTime() >= expiresAt.getTime() : false;
    const remainingMs = expiresAt ? Math.max(0, expiresAt.getTime() - now.getTime()) : Number.POSITIVE_INFINITY;

    return { expired, remainingMs, expiresAt };
  }, [disabled, durationMsEnv, expiresAtUtcEnv]);
}
