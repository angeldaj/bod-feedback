"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Mic, Square, Trash2 } from "lucide-react";

type Status = "idle" | "recording" | "recorded" | "denied" | "unsupported";

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function AudioRecorder({
  onChange,
}: {
  onChange: (blob: Blob | null) => void;
}) {
  const reduce = useReducedMotion();
  const [status, setStatus] = useState<Status>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [url, setUrl] = useState<string | null>(null);

  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia)
    ) {
      setStatus("unsupported");
    }
  }, []);

  const cleanupStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };
  const clearTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  // Teardown al desmontar.
  useEffect(
    () => () => {
      clearTimer();
      cleanupStream();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    },
    [],
  );

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const rec = new MediaRecorder(stream);
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: rec.mimeType || "audio/webm",
        });
        const next = URL.createObjectURL(blob);
        urlRef.current = next;
        setUrl(next);
        setStatus("recorded");
        onChange(blob);
        cleanupStream();
      };
      recRef.current = rec;
      rec.start();
      setElapsed(0);
      setStatus("recording");
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } catch {
      setStatus("denied");
      cleanupStream();
    }
  }

  function stop() {
    clearTimer();
    recRef.current?.stop();
  }

  function reset() {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
    setUrl(null);
    setElapsed(0);
    setStatus("idle");
    onChange(null);
  }

  if (status === "unsupported" || status === "denied") {
    return (
      <div className="rounded-2xl border border-hair-div bg-[var(--lb-input)] px-4 py-4 text-[14px] leading-[1.5] text-muted-ink">
        {status === "denied"
          ? "No pudimos usar el micrófono (permiso denegado). Puedes escribir la descripción arriba."
          : "Tu navegador no permite grabar audio aquí. Puedes escribir la descripción arriba."}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-hair-div bg-[var(--lb-input)] p-4">
      {status === "idle" && (
        <button
          type="button"
          onClick={start}
          className="inline-flex items-center justify-center gap-2.5 rounded-full bg-coral-hi px-5 py-3 text-[15px] font-semibold text-[#2a0f07] transition-transform active:scale-[0.97]"
        >
          <Mic size={18} strokeWidth={2} aria-hidden="true" />
          Grabar audio
        </button>
      )}

      {status === "recording" && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-coral opacity-75 motion-reduce:animate-none" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-coral" />
            </span>
            <span className="font-serif text-[22px] tabular-nums text-cream">
              {fmt(elapsed)}
            </span>
            {/* Waveform juguetón mientras se graba */}
            <span aria-hidden="true" className="flex items-end gap-[3px]">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.span
                  key={i}
                  className="w-[3px] rounded-full bg-coral-hi"
                  animate={reduce ? { height: 8 } : { height: [6, 18, 9, 16, 6] }}
                  transition={
                    reduce
                      ? undefined
                      : { duration: 0.9, repeat: Infinity, delay: i * 0.12, ease: "easeInOut" }
                  }
                  style={{ height: 8 }}
                />
              ))}
            </span>
          </div>
          <button
            type="button"
            onClick={stop}
            aria-label="Detener grabación"
            className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-coral px-4 py-2 text-[14px] font-semibold text-coral transition-colors hover:bg-coral-soft"
          >
            <Square size={15} strokeWidth={2.4} aria-hidden="true" />
            Detener
          </button>
        </div>
      )}

      {status === "recorded" && url && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <audio src={url} controls className="h-10 w-full sm:max-w-[280px]" />
          <button
            type="button"
            onClick={reset}
            className="inline-flex shrink-0 items-center gap-2 rounded-full border-[1.5px] border-hair-ghost px-4 py-2 text-[14px] font-medium text-body transition-colors hover:border-coral hover:text-cream"
          >
            <Trash2 size={15} strokeWidth={2} aria-hidden="true" />
            Regrabar
          </button>
        </div>
      )}
    </div>
  );
}
