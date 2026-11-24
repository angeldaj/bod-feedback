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

/** Solo lee el trabajo aceptado; nunca inicia otra extracción. */
export async function waitForTikTokVerification(
  initial: TikTokVerification,
  read: () => Promise<TikTokVerification>,
  signal: AbortSignal,
  options = { intervalMs: 5_000, maxChecks: 60 },
): Promise<TikTokVerification | null> {
  let job = initial;
  for (let count = 0; ; count++) {
    signal.throwIfAborted();
    if (["succeeded", "failed", "unknown"].includes(job.status)) return job;
    if (count >= options.maxChecks) return null;
    await pause(options.intervalMs, signal);
    job = await read();
  }
}
