import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/satisfaccion/brand-logo";

export default function Home() {
  return (
    <main className="relative z-[1] flex min-h-dvh w-full flex-col items-center justify-center px-5 py-16 text-center">
      <header className="flex flex-col items-center gap-3">
        <BrandLogo width={176} />
        <div className="pl-[0.36em] text-[12px] uppercase tracking-[0.36em] text-muted-ink">
          Restaurante · Panadería
        </div>
      </header>

      <h1 className="mt-12 max-w-[16ch] text-[clamp(44px,9vw,84px)] font-semibold uppercase leading-[0.92] tracking-[0.04em] text-balance">
        Mesa, horno
        <br />y sobremesa
      </h1>
      <p className="mt-6 max-w-[46ch] text-[19px] leading-[1.5] text-body text-pretty">
        Cocina de casa y pan del día en Puerto Ordaz. La carta, las reservas y
        la tienda llegan pronto a esta página.
      </p>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-[18px]">
        <Button variant="brand" size="brandLg" render={<Link href="/satisfaccion" />}>
          Deja tu opinión
        </Button>
        <span className="font-serif text-[18px] italic text-muted-ink">
          Menos de dos minutos
        </span>
      </div>

      <footer className="mt-20 flex flex-wrap items-center justify-center gap-4 text-[14px] uppercase tracking-[0.16em] text-label">
        <span>Puerto Ordaz · Venezuela</span>
      </footer>
    </main>
  );
}
