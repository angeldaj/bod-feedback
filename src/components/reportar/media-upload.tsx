"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Camera, Upload, X } from "lucide-react";
import type { MediaItem } from "./incident-data";

let seq = 0;
const nextId = () => `m${Date.now().toString(36)}-${seq++}`;

function toItems(files: FileList | File[]): MediaItem[] {
  return Array.from(files)
    .filter((f) => f.type.startsWith("image/") || f.type.startsWith("video/"))
    .map((file) => ({
      id: nextId(),
      file,
      url: URL.createObjectURL(file),
      kind: file.type.startsWith("video/") ? ("video" as const) : ("image" as const),
    }));
}

type Props = {
  items: MediaItem[];
  onChange: (items: MediaItem[]) => void;
};

export function MediaUpload({ items, onChange }: Props) {
  const reduce = useReducedMotion();
  const [drag, setDrag] = useState(false);
  const browseRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  // Revoca los object URLs al desmontar para no filtrar memoria.
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  });
  useEffect(
    () => () => itemsRef.current.forEach((it) => URL.revokeObjectURL(it.url)),
    [],
  );

  const add = useCallback(
    (files: FileList | File[]) => {
      const fresh = toItems(files);
      if (fresh.length) onChange([...itemsRef.current, ...fresh]);
    },
    [onChange],
  );

  const remove = (id: string) => {
    const gone = itemsRef.current.find((it) => it.id === id);
    if (gone) URL.revokeObjectURL(gone.url);
    onChange(itemsRef.current.filter((it) => it.id !== id));
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        className="pop-dropzone flex flex-col items-center gap-3 px-5 py-7 text-center"
        data-drag={drag}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          if (e.dataTransfer.files.length) add(e.dataTransfer.files);
        }}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-coral-soft text-coral-hi">
          <Upload size={22} strokeWidth={1.8} aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[16px] font-semibold text-cream">
            Sube una foto o video
          </span>
          <span className="text-[14px] text-muted-ink">
            Arrastra aquí, o elige una opción
          </span>
        </div>
        <div className="mt-1 flex flex-wrap items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-full bg-coral-hi px-4 py-2 text-[14px] font-semibold text-[#2a0f07] transition-transform active:scale-95"
          >
            <Camera size={17} strokeWidth={2} aria-hidden="true" />
            Tomar foto
          </button>
          <button
            type="button"
            onClick={() => browseRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-hair-ghost px-4 py-2 text-[14px] font-medium text-body transition-colors hover:border-coral hover:text-cream"
          >
            Elegir archivo
          </button>
        </div>

        {/* Cámara del teléfono (capture) y explorador de archivos */}
        <input
          ref={cameraRef}
          type="file"
          accept="image/*,video/*"
          capture="environment"
          className="sr-only"
          onChange={(e) => {
            if (e.target.files) add(e.target.files);
            e.target.value = "";
          }}
        />
        <input
          ref={browseRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="sr-only"
          onChange={(e) => {
            if (e.target.files) add(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {items.length > 0 && (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-2.5">
          <AnimatePresence initial={false}>
            {items.map((it) => (
              <motion.li
                key={it.id}
                layout={!reduce}
                initial={reduce ? false : { opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.85 }}
                transition={{ type: "spring", stiffness: 420, damping: 28 }}
                className="group relative aspect-square overflow-hidden rounded-xl border border-hair-div bg-black/40"
              >
                {it.kind === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element -- preview local (object URL)
                  <img
                    src={it.url}
                    alt="Evidencia adjunta"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <video
                    src={it.url}
                    className="h-full w-full object-cover"
                    muted
                    playsInline
                    preload="metadata"
                  />
                )}
                {it.kind === "video" && (
                  <span className="pointer-events-none absolute bottom-1 left-1 rounded-md bg-black/65 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cream">
                    Video
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => remove(it.id)}
                  aria-label="Quitar archivo"
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-cream opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                >
                  <X size={14} strokeWidth={2.4} aria-hidden="true" />
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
