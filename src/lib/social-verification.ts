import type { SocialCampaign, TikTokVerification } from "./club-api";

/** TikTok solo se consulta después de una solicitud manual. */
export function hasPendingInstagram(campaign: SocialCampaign): boolean {
  if (campaign.status !== "active") return false;
  if (campaign.participations) {
    return campaign.participations.some((item) => item.network === "instagram" && item.status === "pending");
  }
  return (campaign.networks ?? ["instagram"]).includes("instagram") && campaign.participationStatus === "pending";
}

export function canVerifyTikTok(campaign: SocialCampaign): boolean {
  if (campaign.status !== "active" || !campaign.code) return false;
  if (campaign.participations) {
    return campaign.participations.some((item) => item.network === "tiktok" && item.status === "pending");
  }
  return !!campaign.networks?.includes("tiktok") && campaign.participationStatus === "pending";
}

function pause(ms: number, signal: AbortSignal): Promise<void> {
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    const cancel = () => {
      clearTimeout(timer);
      reject(signal.reason);
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", cancel);
      resolve();
    }, ms);
    signal.addEventListener("abort", cancel, { once: true });
  });
}

/** Reads become less frequent while scraping; processing stays responsive. */
export function verificationPollDelay(job: TikTokVerification, checks: number): number {
  if (job.status === "processing") return 2_000;
  const suggested = Number.isFinite(job.retryAfterSeconds) ? Math.min(15_000, Math.max(1_000, job.retryAfterSeconds! * 1_000)) : 2_000;
  return Math.max(suggested, Math.min(15_000, 2_000 * 2 ** Math.floor(checks / 2)));
}

/** Solo lee el trabajo aceptado; nunca inicia otra extracción. */
export async function waitForTikTokVerification(
  initial: TikTokVerification,
  read: () => Promise<TikTokVerification>,
  signal: AbortSignal,
  options: { intervalMs?: number; maxChecks: number; maxWaitMs?: number } = { maxChecks: 60, maxWaitMs: 300_000 },
): Promise<TikTokVerification | null> {
  let job = initial;
  const deadline = Date.now() + (options.maxWaitMs ?? 300_000);
  for (let count = 0; ; count++) {
    signal.throwIfAborted();
    if (["succeeded", "failed", "unknown"].includes(job.status)) return job;
    const remaining = deadline - Date.now();
    if (count >= options.maxChecks || remaining <= 0) return null;
    await pause(Math.min(options.intervalMs ?? verificationPollDelay(job, count), remaining), signal);
    if (Date.now() >= deadline) return null;
    job = await read();
  }
}
