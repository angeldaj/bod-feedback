"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, MotionConfig, useReducedMotion } from "motion/react";
import { CheckCircle2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  createOrder,
  fetchCatalog,
  fetchDeliveryZones,
  fetchPaymentInfo,
  fetchStores,
  PedidosApiError,
  type Category,
  type CreatedOrder,
  type DeliveryZone,
  type PaymentInfo,
  type Product,
  type Store,
} from "@/lib/pedidos-api";
import { useCart, type CartItem } from "./use-cart";
import { buildWhatsappMessage, whatsappUrl, type OrderSummary } from "./format";
import { CatalogView } from "./catalog-view";
import { ProductDialog, type DialogTarget } from "./product-dialog";
import { CartBar } from "./cart-bar";
import { CartView } from "./cart-view";
import { CheckoutForm, initialCheckout, type CheckoutData } from "./checkout-form";
import { PaymentView } from "./payment-view";
import { cls } from "./shared";

type Step = "local" | "catalogo" | "carrito" | "datos" | "pago" | "enviado";

type StoreData = {
  categories: Category[];
  products: Product[];
  zones: DeliveryZone[];
  payment: PaymentInfo | null;
};

const EMPTY: StoreData = { categories: [], products: [], zones: [], payment: null };
const STORE_KEY = "labodega-pedido-local";

function readSavedStore(): string | null {
  try {
    return localStorage.getItem(STORE_KEY);
  } catch {
    return null;
  }
}

/** Deja el checkout en un modo que el local tenga habilitado, sin zona de otro local. */
function fitCheckout(current: CheckoutData, store: Store): CheckoutData {
  const mode =
    current.mode === "delivery" && !store.deliveryEnabled
      ? "retiro"
      : current.mode === "retiro" && !store.pickupEnabled
        ? "delivery"
        : current.mode;
  return { ...current, mode, zoneId: "" };
}

async function loadStoreData(id: string): Promise<StoreData> {
  const [catalog, zones, payment] = await Promise.all([fetchCatalog(id), fetchDeliveryZones(id), fetchPaymentInfo(id)]);
  return { ...catalog, zones, payment };
}

function saveStore(id: string) {
  try {
    localStorage.setItem(STORE_KEY, id);
  } catch {
    // Recordar el local es opcional.
  }
}

export function PedidosExperience() {
  const reduce = useReducedMotion();
  const [stores, setStores] = useState<Store[] | null>(null);
  const [storeId, setStoreId] = useState<string | null>(null);
  const store = stores?.find((s) => s.id === storeId) ?? null;
  const cart = useCart(storeId);
  const [step, setStep] = useState<Step>("catalogo");
  const [data, setData] = useState<StoreData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [checkout, setCheckout] = useState<CheckoutData>(initialCheckout);
  const [reference, setReference] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedOrder | null>(null);
  // Copia de lo pedido: el carrito se vacía apenas el servidor registra el pedido.
  const [sentItems, setSentItems] = useState<CartItem[]>([]);
  // Producto nuevo o línea del carrito que se está editando en el modal.
  const [dialog, setDialog] = useState<{ target: DialogTarget; product?: Product; line?: CartItem } | null>(null);

  // 1) Locales: con uno solo se entra directo; con varios, se recuerda el último elegido.
  useEffect(() => {
    let alive = true;
    fetchStores()
      .then((list) => {
        if (!alive) return;
        setStores(list);
        const saved = readSavedStore();
        const initial = list.length === 1 ? list[0] : list.find((s) => s.id === saved);
        if (initial) {
          setCheckout((current) => fitCheckout(current, initial));
          setStoreId(initial.id);
        } else {
          setStep("local");
          setLoading(false);
        }
      })
      .catch(() => {
        if (alive) {
          setLoadError(true);
          setLoading(false);
        }
      });
    return () => {
      alive = false;
    };
  }, []);

  // 2) Catálogo, zonas y pago del local elegido.

  useEffect(() => {
    if (!storeId) return;
    let alive = true;
    loadStoreData(storeId)
      .then((next) => {
        if (alive) setData(next);
      })
      .catch(() => {
        if (alive) setLoadError(true);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [storeId]);

  // El carrito guardado toma los precios vigentes del catálogo recién cargado.
  const { sync: syncCart } = cart;
  useEffect(() => {
    if (!loading) syncCart(data.products);
  }, [data.products, loading, syncCart, cart.items.length]);

  const go = (next: Step) => {
    setStep(next);
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };

  const chooseStore = (id: string) => {
    const next = stores?.find((s) => s.id === id);
    saveStore(id);
    if (next) setCheckout((current) => fitCheckout(current, next));
    if (id !== storeId) {
      setData(EMPTY);
      setLoading(true);
      setLoadError(false);
      setStoreId(id);
    }
    go("catalogo");
  };

  /** Lo del carrito que ya no se puede pedir (se agotó o salió de la tienda). */
  const unavailable = useMemo(() => {
    if (loading) return new Set<string>();
    const orderable = new Set(data.products.filter((p) => !p.soldOut).map((p) => p.id));
    return new Set(cart.items.map((i) => i.productId).filter((id) => !orderable.has(id)));
  }, [cart.items, data.products, loading]);

  const order = useMemo<Omit<OrderSummary, "reference">>(() => {
    const zone = data.zones.find((z) => z.id === checkout.zoneId);
    const deliveryFee = checkout.mode === "delivery" ? (zone?.price ?? 0) : 0;
    const rate = data.payment?.rate ?? 0;
    const total = cart.subtotal + deliveryFee;
    return {
      code: created?.code,
      name: checkout.name.trim(),
      phone: checkout.phone.trim(),
      mode: checkout.mode,
      zone,
      address: checkout.address.trim(),
      store: { name: store?.name ?? "", address: store?.address ?? "" },
      items: created ? sentItems : cart.items,
      subtotal: created?.subtotalUsd ?? cart.subtotal,
      deliveryFee: created?.deliveryFeeUsd ?? deliveryFee,
      total: created?.totalUsd ?? total,
      totalBs: created?.totalBs ?? Math.round(total * rate * 100) / 100,
      rate: created?.rate ?? rate,
    };
  }, [checkout, data, cart.items, cart.subtotal, store, created, sentItems]);

  const openProduct = (product: Product) =>
    setDialog({
      product,
      target: { ...product, quantity: 1, note: "", editing: false },
    });

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

  const confirmOrder = async () => {
    if (!store) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await createOrder({
        storeId: store.id,
        mode: checkout.mode === "delivery" ? "delivery" : "pickup",
        customerName: checkout.name.trim(),
        customerPhone: checkout.phone.trim(),
        zoneId: checkout.mode === "delivery" ? checkout.zoneId : undefined,
        address: checkout.mode === "delivery" ? checkout.address.trim() : undefined,
        paymentReference: reference.trim() || undefined,
        items: cart.items.map((i) => ({ productId: i.productId, quantity: i.quantity, note: i.note || undefined })),
      });
      setSentItems(cart.items);
      setCreated(result);
      cart.clear();
      go("enviado");
    } catch (error) {
      if (error instanceof PedidosApiError && error.status === 409) {
        // Algo se agotó o cambió mientras pagabas: refrescamos para marcarlo en el carrito.
        setSubmitError(`${error.message} Te llevamos al carrito para que lo revises.`);
        await loadStoreData(store.id)
          .then(setData)
          .catch(() => undefined);
        setTimeout(() => go("carrito"), 1800);
      } else {
        setSubmitError(
          error instanceof PedidosApiError && error.status < 500
            ? error.message
            : "No pudimos registrar tu pedido. Revisa tu conexión e intenta de nuevo.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const startOver = () => {
    setReference("");
    setCreated(null);
    setSentItems([]);
    setSubmitError(null);
    go("catalogo");
  };

  const whatsappHref = data.payment
    ? whatsappUrl(data.payment.whatsapp || store?.whatsapp || "", buildWhatsappMessage({ ...order, reference }))
    : "#";

  return (
    <MotionConfig reducedMotion="user">
      <div aria-hidden="true" className="pop-page-base" />
      <div aria-hidden="true" className="pop-page-glow pop-page-glow--warm" />

      <main className="pedidos-root relative z-[1] mx-auto flex min-h-dvh w-full max-w-[1200px] flex-col px-4 pb-32 md:px-8">
        {loadError ? (
          <p role="alert" className="py-24 text-center text-[17px] text-coral">
            No pudimos cargar el catálogo. Revisa tu conexión e intenta de nuevo.
          </p>
        ) : stores && stores.length === 0 ? (
          <p className="py-24 text-center text-[17px] text-body">La tienda en línea no está disponible por ahora. Vuelve pronto.</p>
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              // En web el catálogo usa todo el ancho; los pasos del checkout, una columna cómoda.
              className={step === "catalogo" ? undefined : "mx-auto w-full max-w-[960px]"}
            >
              {step === "local" && stores && (
                <div className="flex flex-col gap-6 pt-16">
                  <div className="flex flex-col gap-2 text-center">
                    <span className={cls.eyebrow}>Pedidos · Delivery y retiro</span>
                    <h1 className={cls.title}>¿Desde qué local pides?</h1>
                  </div>
                  <ul className="grid gap-3 md:grid-cols-2">
                    {stores.map((s) => (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => chooseStore(s.id)}
                          className={`${cls.panel} flex w-full items-start gap-3 p-5 text-left transition-colors hover:border-hair-chip`}
                        >
                          <MapPin size={22} className="mt-0.5 shrink-0 text-gold" aria-hidden="true" />
                          <span className="flex flex-col gap-1">
                            <span className="text-[19px] font-semibold text-cream">{s.name}</span>
                            {s.address && <span className="text-[15px] text-muted-ink">{s.address}</span>}
                            <span className="text-[13px] uppercase tracking-[0.14em] text-label">
                              {[s.deliveryEnabled && "Delivery", s.pickupEnabled && "Retiro"].filter(Boolean).join(" · ")}
                            </span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {step === "catalogo" && (
                <CatalogView
                  categories={data.categories}
                  products={data.products}
                  cart={cart.items}
                  loading={loading}
                  storeName={store?.name}
                  onChangeStore={stores && stores.length > 1 ? () => go("local") : undefined}
                  onSelect={openProduct}
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
                />
              )}
              {step === "datos" && store && (
                <CheckoutForm
                  data={checkout}
                  onChange={setCheckout}
                  zones={data.zones}
                  store={store}
                  onBack={() => go("carrito")}
                  onContinue={() => go("pago")}
                />
              )}
              {step === "pago" && data.payment && (
                <PaymentView
                  order={order}
                  payment={data.payment}
                  reference={reference}
                  onReference={setReference}
                  onBack={() => go("datos")}
                  onConfirm={() => void confirmOrder()}
                  submitting={submitting}
                  error={submitError}
                />
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
                  <span className={cls.eyebrow}>Pedido {created.code}</span>
                  <h1 className={cls.title}>¡Listo, {order.name.split(" ")[0]}!</h1>
                  <p className="max-w-[36ch] text-[17px] leading-relaxed text-body">
                    Ya registramos tu pedido. Envíalo por WhatsApp con el capture del pago y te confirmamos por ahí.
                  </p>
                  <div className="flex w-full flex-col gap-3 pt-2">
                    <a
                      href={whatsappHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="lb-shine inline-flex w-full items-center justify-center gap-3 rounded-full bg-[#1f9d55] px-9 py-[16px] text-[17px] font-semibold text-white shadow-[0_10px_30px_-10px_rgba(37,211,102,0.6)] transition hover:brightness-110"
                    >
                      Enviar pedido por WhatsApp
                    </a>
                    <Button variant="pop" size="popLg" className="w-full" onClick={startOver}>
                      Hacer otro pedido
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {step === "catalogo" && <CartBar count={cart.count} subtotal={cart.subtotal} onOpen={() => go("carrito")} />}

      <ProductDialog target={dialog?.target ?? null} onClose={() => setDialog(null)} onConfirm={confirmDialog} />
    </MotionConfig>
  );
}
