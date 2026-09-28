"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, MotionConfig, useReducedMotion } from "motion/react";
import { CalendarClock, CheckCircle2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  fetchCatalog,
  fetchDeliveryZones,
  fetchStores,
  PedidosApiError,
  type Category,
  type DeliveryZone,
  type Product,
  type Store,
} from "@/lib/pedidos-api";
import { createEncargo, type CreatedEncargo } from "@/lib/encargos-api";
import { ENCARGO_MAX_QTY, useCart, type CartItem } from "@/components/pedidos/use-cart";
import { whatsappUrl } from "@/components/pedidos/format";
import { CatalogView } from "@/components/pedidos/catalog-view";
import { ProductDialog, type DialogTarget } from "@/components/pedidos/product-dialog";
import { CartBar } from "@/components/pedidos/cart-bar";
import { CartView } from "@/components/pedidos/cart-view";
import { CheckoutForm, initialCheckout, type CheckoutData } from "@/components/pedidos/checkout-form";
import { cls } from "@/components/pedidos/shared";
import { EncargoFields, initialExtra, type EncargoExtra } from "./encargo-fields";
import {
  buildEncargoWhatsappMessage,
  caracasToIso,
  MIN_NOTE_WITHOUT_ITEMS,
  readRecentEncargos,
  rememberEncargo,
  whenError,
  type RecentEncargo,
} from "./encargo-format";

type Step = "catalogo" | "carrito" | "datos" | "enviado";

type StoreData = { categories: Category[]; products: Product[]; zones: DeliveryZone[] };

const EMPTY: StoreData = { categories: [], products: [], zones: [] };
const CART_KEY = "labodega-encargo";

async function loadStoreData(id: string): Promise<StoreData> {
  const [catalog, zones] = await Promise.all([fetchCatalog(id), fetchDeliveryZones(id)]);
  return { ...catalog, zones };
}

/**
 * Encargo: como un pedido, pero para una fecha y hora futuras, con cualquier
 * producto (aunque hoy esté agotado) y una nota libre. No se paga al enviarlo:
 * un asesor lo cotiza y el cliente responde desde el link de seguimiento.
 */
export function EncargosExperience() {
  const reduce = useReducedMotion();
  const [stores, setStores] = useState<Store[] | null>(null);
  const [pickupStoreId, setPickupStoreId] = useState<string | null>(null);
  const [checkout, setCheckout] = useState<CheckoutData>(initialCheckout);
  const [extra, setExtra] = useState<EncargoExtra>(initialExtra);
  const [extraErrors, setExtraErrors] = useState<{ when?: string | null; note?: string | null }>({});
  const deliveryStore = stores?.find((s) => s.deliveryEnabled) ?? null;
  const pickupStores = useMemo(() => stores?.filter((s) => s.pickupEnabled) ?? [], [stores]);
  const pickupStore = pickupStores.find((s) => s.id === pickupStoreId) ?? null;
  const store = checkout.mode === "delivery" ? deliveryStore : pickupStore;
  const storeId = store?.id ?? null;
  const cart = useCart({ storageKey: CART_KEY, maxQty: ENCARGO_MAX_QTY });
  const [step, setStep] = useState<Step>("catalogo");
  const [loaded, setLoaded] = useState<Record<string, StoreData>>({});
  const data = (storeId && loaded[storeId]) || EMPTY;
  const loading = !storeId || !loaded[storeId];
  const [loadError, setLoadError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedEncargo | null>(null);
  const [sentItems, setSentItems] = useState<CartItem[]>([]);
  const [recent, setRecent] = useState<RecentEncargo | null>(null);
  const [dialog, setDialog] = useState<{ target: DialogTarget; product?: Product; line?: CartItem } | null>(null);

  useEffect(() => {
    let alive = true;
    fetchStores()
      .then((list) => {
        if (!alive) return;
        // localStorage solo existe en el cliente: se lee aquí y no en el render inicial.
        setRecent(readRecentEncargos()[0] ?? null);
        setStores(list);
        setPickupStoreId(list.find((s) => s.pickupEnabled)?.id ?? null);
        if (!list.some((s) => s.deliveryEnabled)) setCheckout((current) => ({ ...current, mode: "retiro" }));
      })
      .catch(() => {
        if (alive) setLoadError(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!storeId || !loading) return;
    let alive = true;
    loadStoreData(storeId)
      .then((next) => {
        if (alive) setLoaded((current) => ({ ...current, [storeId]: next }));
      })
      .catch(() => {
        if (alive) setLoadError(true);
      });
    return () => {
      alive = false;
    };
  }, [storeId, loading]);

  const { sync: syncCart } = cart;
  useEffect(() => {
    if (!loading) syncCart(data.products);
  }, [data.products, loading, syncCart, cart.items.length]);

  /** Lo que ya no se vende en el local elegido. El agotado no cuenta en un encargo. */
  const listed = new Set(data.products.map((p) => p.id));
  const unavailable = loading
    ? new Set<string>()
    : new Set(cart.items.map((i) => i.productId).filter((id) => !listed.has(id)));

  const go = (next: Step) => {
    setStep(next);
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };

  const openProduct = (product: Product) =>
    setDialog({ product, target: { ...product, quantity: 1, note: "", editing: false } });

  const openLine = (line: CartItem) => {
    const product = data.products.find((p) => p.id === line.productId);
    setDialog({
      line,
      target: {
        name: line.name,
        description: product?.description ?? "",
        price: line.price,
        image: line.image,
        quantity: line.quantity,
        note: line.note,
        editing: true,
      },
    });
  };

  const confirmDialog = (quantity: number, note: string) => {
    if (dialog?.line) cart.update(dialog.line.lineId, quantity, note);
    else if (dialog?.product) cart.add(dialog.product, quantity, note);
    setDialog(null);
  };

  const validateExtra = () => {
    const when = whenError(extra.date, extra.time);
    const note =
      cart.items.length === 0 && extra.note.trim().length < MIN_NOTE_WITHOUT_ITEMS
        ? "Sin productos del catálogo, cuéntanos aquí qué necesitas."
        : null;
    setExtraErrors({ when, note });
    return !when && !note;
  };

  const submit = async () => {
    const requestedFor = caracasToIso(extra.date, extra.time);
    if (!store || !requestedFor) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await createEncargo({
        storeId: store.id,
        mode: checkout.mode === "delivery" ? "delivery" : "pickup",
        customerName: checkout.name.trim(),
        customerPhone: checkout.phone.trim(),
        zoneId: checkout.mode === "delivery" ? checkout.zoneId : undefined,
        address: checkout.mode === "delivery" ? checkout.address.trim() : undefined,
        requestedFor,
        customerNote: extra.note.trim() || undefined,
        items: cart.items.map((i) => ({ productId: i.productId, quantity: i.quantity, note: i.note || undefined })),
      });
      rememberEncargo({ code: result.code, token: result.token, when: requestedFor });
      setSentItems(cart.items);
      setCreated(result);
      cart.clear();
      go("enviado");
    } catch (error) {
      setSubmitError(
        error instanceof PedidosApiError && error.status < 500
          ? error.message
          : "No pudimos registrar tu encargo. Revisa tu conexión e intenta de nuevo.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const startOver = () => {
    setCreated(null);
    setSentItems([]);
    setExtra(initialExtra);
    setSubmitError(null);
    setRecent(readRecentEncargos()[0] ?? null);
    go("catalogo");
  };

  const trackingPath = created ? `/encargos/${created.token}` : "";
  const whatsappHref =
    created && store
      ? whatsappUrl(
          store.whatsapp,
          buildEncargoWhatsappMessage({
            code: created.code,
            trackingUrl: `${window.location.origin}${trackingPath}`,
            name: checkout.name.trim(),
            phone: checkout.phone.trim(),
            mode: checkout.mode,
            zoneName: data.zones.find((z) => z.id === checkout.zoneId)?.name,
            address: checkout.address.trim(),
            storeName: store.name,
            when: caracasToIso(extra.date, extra.time) ?? "",
            note: extra.note,
            items: sentItems,
          }),
        )
      : "#";

  const intro = (
    <div className="flex flex-col gap-3 pt-4 md:pt-6">
      <div className={`${cls.panel} flex items-start gap-3 p-4`}>
        <CalendarClock size={22} className="mt-0.5 shrink-0 text-gold" aria-hidden="true" />
        <p className="text-[15px] leading-snug text-body">
          Elige lo que quieras, aunque hoy esté agotado: lo preparamos para tu fecha. ¿Buscas algo que no está aquí?{" "}
          <button type="button" onClick={() => go("datos")} className="font-semibold text-gold underline underline-offset-4">
            Descríbelo en tu encargo
          </button>
          . Un asesor te envía el precio final por WhatsApp.
        </p>
      </div>
      {recent && (
        <Link
          href={`/encargos/${recent.token}`}
          className={`${cls.panel} flex items-center justify-between gap-3 px-4 py-3 text-[15px] text-cream transition-colors hover:border-hair-chip`}
        >
          <span>
            Tu encargo <span className="font-semibold">{recent.code}</span>: ver estado
          </span>
          <ChevronRight size={18} className="text-label" aria-hidden="true" />
        </Link>
      )}
    </div>
  );

  return (
    <MotionConfig reducedMotion="user">
      <div aria-hidden="true" className="pop-page-base" />
      <div aria-hidden="true" className="pop-page-glow pop-page-glow--warm" />

      <main className="pedidos-root relative z-[1] mx-auto flex min-h-dvh w-full max-w-[1200px] flex-col px-4 pb-32 md:px-8">
        {loadError ? (
          <p role="alert" className="py-24 text-center text-[17px] text-coral">
            No pudimos cargar el catálogo. Revisa tu conexión e intenta de nuevo.
          </p>
        ) : stores && !deliveryStore && pickupStores.length === 0 ? (
          <p className="py-24 text-center text-[17px] text-body">Los encargos en línea no están disponibles por ahora. Vuelve pronto.</p>
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className={step === "catalogo" ? undefined : "mx-auto w-full max-w-[960px]"}
            >
              {step === "catalogo" && (
                <CatalogView
                  categories={data.categories}
                  products={data.products}
                  cart={cart.items}
                  loading={loading}
                  onSelect={openProduct}
                  flow="encargo"
                  intro={intro}
                />
              )}
              {step === "carrito" && (
                <CartView
                  items={cart.items}
                  subtotal={cart.subtotal}
                  unavailable={unavailable}
                  onBack={() => go("catalogo")}
                  onEdit={openLine}
                  onQuantity={(item, q) => cart.update(item.lineId, q, item.note)}
                  onRemove={(item) => cart.remove(item.lineId)}
                  onContinue={() => go("datos")}
                  flow="encargo"
                  maxQty={ENCARGO_MAX_QTY}
                />
              )}
              {step === "datos" && stores && (
                <CheckoutForm
                  data={checkout}
                  onChange={setCheckout}
                  zones={(deliveryStore && loaded[deliveryStore.id]?.zones) || []}
                  canDeliver={!!deliveryStore}
                  pickupStores={pickupStores}
                  pickupStore={pickupStore}
                  onPickupStore={setPickupStoreId}
                  loading={loading}
                  unavailableCount={cart.items.filter((i) => unavailable.has(i.productId)).length}
                  onBack={() => go(cart.items.length > 0 ? "carrito" : "catalogo")}
                  onContinue={() => void submit()}
                  eyebrow="Paso 2 de 2"
                  submitLabel="Enviar encargo"
                  submitting={submitting}
                  error={submitError}
                  validateExtra={validateExtra}
                >
                  <EncargoFields
                    value={extra}
                    onChange={(next) => {
                      setExtra(next);
                      setExtraErrors({});
                    }}
                    errors={extraErrors}
                    hasItems={cart.items.length > 0}
                  />
                </CheckoutForm>
              )}
              {step === "enviado" && created && (
                <div className="flex flex-col items-center gap-5 pt-24 text-center">
                  <motion.span
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 320, damping: 22 }}
                    className="text-gold"
                  >
                    <CheckCircle2 size={64} strokeWidth={1.5} />
                  </motion.span>
                  <span className={cls.eyebrow}>Encargo {created.code}</span>
                  <h1 className={cls.title}>¡Recibido, {checkout.name.trim().split(" ")[0]}!</h1>
                  <p className="max-w-[40ch] text-[17px] leading-relaxed text-body">
                    Un asesor revisa tu encargo y te envía el precio por WhatsApp. En el link de seguimiento ves el estado y
                    aceptas la cotización cuando esté lista.
                  </p>
                  <div className="flex w-full flex-col gap-3 pt-2">
                    <a
                      href={whatsappHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="lb-shine inline-flex w-full items-center justify-center gap-3 rounded-full bg-[#1f9d55] px-9 py-[16px] text-[17px] font-semibold text-white shadow-[0_10px_30px_-10px_rgba(37,211,102,0.6)] transition hover:brightness-110"
                    >
                      Avisar por WhatsApp
                    </a>
                    <Button variant="pop" size="popLg" className="w-full" render={<Link href={trackingPath} />}>
                      Ver mi encargo
                    </Button>
                    <Button variant="popGhost" size="popMd" className="w-full" onClick={startOver}>
                      Hacer otro encargo
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {step === "catalogo" && (
        <CartBar count={cart.count} subtotal={cart.subtotal} onOpen={() => go("carrito")} label="Ver encargo" />
      )}

      <ProductDialog
        target={dialog?.target ?? null}
        onClose={() => setDialog(null)}
        onConfirm={confirmDialog}
        flow="encargo"
        maxQty={ENCARGO_MAX_QTY}
      />
    </MotionConfig>
  );
}
