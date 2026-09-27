"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FormEvent,
  PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { ArrowLeft, ArrowRight, ChevronRight, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import { StoreShell } from "@/components/storefront/store-shell";
import {
  StoreReceipt,
  checkoutReceiptLines,
} from "@/components/storefront/store-receipt";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/format";
import { fileToDataUrl } from "@/lib/image-upload";
import { storePath } from "@/lib/site-mode";
import { useStore } from "@/lib/store";
import type { PaymentMethod, Product } from "@/lib/types";

type Step = 1 | 2 | 3;

type Line = { product: Product; quantity: number };

type SavedDetails = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  notes?: string;
};

const DETAILS_KEY = "ayesha-checkout-details-v1";

const emptyDetails = {
  name: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  country: "Pakistan",
};

function StepDots({ step }: { step: Step }) {
  const labels = ["Details", "Payment", "Receipt"];
  return (
    <div className="flex items-center justify-center gap-1">
      {labels.map((label, index) => {
        const n = (index + 1) as Step;
        const active = step === n;
        const done = step > n;
        return (
          <div key={label} className="flex items-center gap-1">
            {index > 0 ? (
              <span
                className={cn(
                  "h-px w-3",
                  done || active ? "bg-foreground/40" : "bg-border/50"
                )}
                aria-hidden
              />
            ) : null}
            <div className="flex items-center gap-0.5">
              <span
                className={cn(
                  "inline-flex size-4 items-center justify-center rounded-full text-[10px] tabular-nums",
                  done
                    ? "bg-black text-white"
                    : active
                      ? "bg-black/85 text-white"
                      : "bg-black/8 text-foreground/40"
                )}
              >
                {done ? "✓" : n}
              </span>
              <span
                className={cn(
                  "text-[10px]",
                  active
                    ? "text-foreground"
                    : done
                      ? "text-foreground/70"
                      : "text-muted-foreground/55"
                )}
              >
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SwipeToComplete({
  disabled,
  loading,
  onComplete,
}: {
  disabled?: boolean;
  loading?: boolean;
  onComplete: () => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [done, setDone] = useState(false);
  const [hint, setHint] = useState(true);
  const startX = useRef(0);
  const startOffset = useRef(0);
  const offsetRef = useRef(0);
  const maxRef = useRef(0);
  const draggingRef = useRef(false);

  function measureMax() {
    const track = trackRef.current;
    if (!track) return 0;
    const knob = 48;
    const pad = 4;
    return Math.max(0, track.clientWidth - knob - pad * 2);
  }

  function setKnob(next: number) {
    offsetRef.current = next;
    setOffset(next);
  }

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (disabled || loading || done) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setHint(false);
    draggingRef.current = true;
    setDragging(true);
    startX.current = e.clientX;
    startOffset.current = offsetRef.current;
    maxRef.current = measureMax();
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!draggingRef.current || disabled || loading || done) return;
    const delta = e.clientX - startX.current;
    const next = Math.min(
      maxRef.current,
      Math.max(0, startOffset.current + delta)
    );
    setKnob(next);
  }

  function finishSwipe(finalOffset: number) {
    const max = maxRef.current || measureMax();
    if (max > 0 && finalOffset >= max * 0.86) {
      setKnob(max);
      setDone(true);
      onComplete();
      return;
    }
    setKnob(0);
  }

  function onPointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    finishSwipe(offsetRef.current);
  }

  return (
    <div
      ref={trackRef}
      className={cn(
        "relative h-14 w-full select-none overflow-hidden rounded-full bg-black touch-none",
        (disabled || loading) && "opacity-60"
      )}
      role="button"
      aria-label={loading ? "Placing order" : "Swipe right to complete order"}
      aria-disabled={disabled || loading || done}
    >
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center gap-1.5 text-[13px] tracking-wide text-white/85"
        aria-hidden
      >
        <span className="font-nav-display">
          {loading ? "Placing…" : done ? "Order placed" : "Complete order"}
        </span>
        {!loading && !done ? (
          <ChevronRight className="size-4 opacity-70" strokeWidth={2} />
        ) : null}
      </div>

      <div
        className={cn(
          "absolute top-1 left-1 z-10 flex size-12 cursor-grab items-center justify-center rounded-full bg-white text-black active:cursor-grabbing",
          hint && !dragging && !done && !loading
            ? "animate-[swipe-hint_2.4s_ease-in-out_infinite]"
            : "transition-transform duration-200 ease-out"
        )}
        style={
          hint && !dragging && !done && !loading
            ? undefined
            : { transform: `translateX(${offset}px)` }
        }
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <ArrowRight className="size-5 stroke-[2]" />
      </div>
    </div>
  );
}

const fieldClass =
  "h-9 rounded-none border-0 border-b border-border/40 bg-transparent px-0 text-[13px] normal-case shadow-none placeholder:text-muted-foreground/55 focus-visible:border-foreground focus-visible:ring-0";

const btnClass = "font-nav-display h-11 w-full border-0 shadow-none";

const shellClass =
  "mx-auto flex h-svh max-w-6xl flex-col overflow-hidden px-4 pt-3 pb-3 sm:px-6 md:h-auto md:overflow-visible md:pt-8 md:pb-14";

export default function CheckoutPage() {
  const router = useRouter();
  const proofRef = useRef<HTMLInputElement>(null);
  const { cart, products, cartTotal, placeOrder, bankDetails } = useStore();
  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);
  const [payment, setPayment] = useState<PaymentMethod>("cod");
  const [notes, setNotes] = useState("");
  const [paymentProof, setPaymentProof] = useState<string | null>(null);
  const [proofName, setProofName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [details, setDetails] = useState(emptyDetails);
  const [detailsReady, setDetailsReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DETAILS_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as SavedDetails;
        setDetails({
          name: saved.name || "",
          email: saved.email || "",
          phone: saved.phone || "",
          address: saved.address || "",
          city: saved.city || "",
          country: saved.country || "Pakistan",
        });
        if (typeof saved.notes === "string") setNotes(saved.notes);
      }
    } catch {
      /* ignore corrupt storage */
    }
    setDetailsReady(true);
  }, []);

  useEffect(() => {
    if (!detailsReady) return;
    try {
      const payload: SavedDetails = { ...details, notes };
      window.localStorage.setItem(DETAILS_KEY, JSON.stringify(payload));
    } catch {
      /* ignore quota */
    }
  }, [details, notes, detailsReady]);

  const lines = cart
    .map((item) => {
      const product = products.find((entry) => entry.id === item.productId);
      return product ? { product, quantity: item.quantity } : null;
    })
    .filter((item): item is Line => item !== null);

  const shipping = cartTotal >= 15000 ? 0 : 250;
  const total = cartTotal + shipping;

  function goBack() {
    if (step === 3) {
      setStep(2);
      return;
    }
    if (step === 2) {
      setStep(1);
      return;
    }
    router.back();
  }

  async function onProofSelected(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Upload an image of your transfer receipt");
      return;
    }
    setUploading(true);
    try {
      const dataUrl = await fileToDataUrl(file, 1400, 0.78);
      setPaymentProof(dataUrl);
      setProofName(file.name);
    } catch {
      toast.error("Could not upload proof");
    } finally {
      setUploading(false);
      if (proofRef.current) proofRef.current.value = "";
    }
  }

  function clearProof() {
    setPaymentProof(null);
    setProofName(null);
    if (proofRef.current) proofRef.current.value = "";
  }

  function validateDetails() {
    if (
      !details.name.trim() ||
      !details.email.trim() ||
      !details.phone.trim() ||
      !details.address.trim() ||
      !details.city.trim() ||
      !details.country.trim()
    ) {
      toast.error("Please fill in all details");
      return false;
    }
    return true;
  }

  function goPayment(event: FormEvent) {
    event.preventDefault();
    if (!validateDetails()) return;
    setStep(2);
  }

  function goReceipt() {
    if (payment === "bank" && !paymentProof) {
      toast.error("Attach your payment screenshot to continue");
      return;
    }
    setStep(3);
  }

  async function onComplete() {
    if (lines.length === 0 || submitting) return;
    if (payment === "bank" && !paymentProof) {
      toast.error("Attach your payment screenshot to continue");
      return;
    }
    setSubmitting(true);
    const customer = {
      name: details.name.trim(),
      email: details.email.trim(),
      phone: details.phone.trim(),
      address: details.address.trim(),
      city: details.city.trim(),
      country: details.country.trim(),
    };
    try {
      const order = await placeOrder(customer, {
        paymentMethod: payment,
        notes,
        paymentProof: paymentProof || undefined,
        shipping,
      });
      router.replace(
        `${storePath("/checkout/success")}?order=${order.id}&pay=${payment}`
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not place order");
      setSubmitting(false);
    }
  }

  if (lines.length === 0) {
    return (
      <StoreShell hideSaleBanner hideBottomNav hideHeader>
        <div className="font-nav-display mx-auto max-w-6xl px-6 py-24">
          <button
            type="button"
            onClick={() => router.back()}
            className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-foreground/70 transition-colors hover:text-foreground"
            aria-label="Go back"
          >
            <ArrowLeft className="size-4 stroke-[1.75]" />
            Back
          </button>
          <h1 className="text-4xl tracking-tight md:text-5xl">Checkout</h1>
          <p className="mt-4 text-[14px] text-muted-foreground">Your bag is empty.</p>
          <Button asChild className={cn("mt-6", btnClass)}>
            <Link href={storePath("/shop")}>
              <span>Continue shopping</span>
            </Link>
          </Button>
        </div>
      </StoreShell>
    );
  }

  return (
    <StoreShell hideSaleBanner hideBottomNav hideHeader>
      <div className={shellClass}>
        <div className="relative shrink-0 text-center">
          <button
            type="button"
            onClick={goBack}
            className="absolute top-0 left-0 inline-flex size-8 items-center justify-center text-foreground/70 transition-colors hover:text-foreground"
            aria-label="Go back"
          >
            <ArrowLeft className="size-4 stroke-[1.75]" />
          </button>
          <h1 className="font-nav-display text-[20px] leading-none tracking-tight sm:text-4xl md:text-5xl">
            Checkout
          </h1>
          <div className="mt-1.5 sm:mt-5">
            <StepDots step={step} />
          </div>
        </div>

        <div className="mx-auto mt-2.5 flex min-h-0 w-full max-w-xl flex-1 flex-col sm:mt-8">
          <div className="flex min-h-0 flex-1 flex-col normal-case">
            {step === 1 ? (
              <form
                onSubmit={goPayment}
                className="flex min-h-0 flex-1 flex-col"
                autoComplete="on"
              >
                <div className="grid min-h-0 flex-1 grid-cols-2 content-start gap-x-3 gap-y-1 overflow-y-auto">
                  <Input
                    id="name"
                    name="name"
                    autoComplete="name"
                    placeholder="Name"
                    value={details.name}
                    onChange={(e) =>
                      setDetails((d) => ({ ...d, name: e.target.value }))
                    }
                    required
                    aria-label="Full name"
                    className={fieldClass}
                  />
                  <Input
                    id="phone"
                    name="tel"
                    type="tel"
                    autoComplete="tel"
                    placeholder="Phone"
                    value={details.phone}
                    onChange={(e) =>
                      setDetails((d) => ({ ...d, phone: e.target.value }))
                    }
                    required
                    aria-label="Phone"
                    className={fieldClass}
                  />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    placeholder="Email"
                    value={details.email}
                    onChange={(e) =>
                      setDetails((d) => ({ ...d, email: e.target.value }))
                    }
                    required
                    aria-label="Email"
                    className={cn(fieldClass, "col-span-2")}
                  />
                  <Input
                    id="address"
                    name="street-address"
                    autoComplete="street-address"
                    placeholder="Address"
                    value={details.address}
                    onChange={(e) =>
                      setDetails((d) => ({ ...d, address: e.target.value }))
                    }
                    required
                    aria-label="Address"
                    className={cn(fieldClass, "col-span-2")}
                  />
                  <Input
                    id="city"
                    name="city"
                    autoComplete="address-level2"
                    placeholder="City"
                    value={details.city}
                    onChange={(e) =>
                      setDetails((d) => ({ ...d, city: e.target.value }))
                    }
                    required
                    aria-label="City"
                    className={fieldClass}
                  />
                  <Input
                    id="country"
                    name="country"
                    autoComplete="country-name"
                    placeholder="Country"
                    value={details.country}
                    onChange={(e) =>
                      setDetails((d) => ({ ...d, country: e.target.value }))
                    }
                    required
                    aria-label="Country"
                    className={fieldClass}
                  />
                  <Input
                    id="notes"
                    placeholder="Remarks (optional)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    aria-label="Order notes"
                    className={cn(fieldClass, "col-span-2")}
                  />
                </div>
                <div className="mt-3 shrink-0 pb-[env(safe-area-inset-bottom)]">
                  <Button type="submit" className={btnClass}>
                    Continue to payment
                  </Button>
                </div>
              </form>
            ) : null}

            {step === 2 ? (
              <div className="flex min-h-0 flex-1 flex-col">
                <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
                  <div className="flex items-baseline justify-between gap-3 rounded-md bg-black/[0.04] px-3 py-2">
                    <div>
                      <p className="text-[10px] tracking-wide text-muted-foreground">
                        Amount to pay
                      </p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {shipping === 0
                          ? "Free shipping"
                          : `Incl. ${formatPrice(shipping)} shipping`}
                      </p>
                    </div>
                    <p className="font-nav-display text-[24px] leading-none tracking-tight tabular-nums">
                      {formatPrice(total)}
                    </p>
                  </div>

                  <div
                    role="tablist"
                    aria-label="Payment method"
                    className="relative grid grid-cols-2 rounded-full border border-black/15 bg-black/[0.04] p-0.5"
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] rounded-full bg-black shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                        payment === "bank"
                          ? "translate-x-[calc(100%+2px)]"
                          : "translate-x-0"
                      )}
                      style={{ left: 2 }}
                    />
                    <button
                      type="button"
                      role="tab"
                      aria-selected={payment === "cod"}
                      onClick={() => setPayment("cod")}
                      className={cn(
                        "relative z-10 rounded-full py-1.5 text-center text-[11px] font-semibold tracking-wide transition-colors duration-300 sm:text-[12px]",
                        payment === "cod" ? "text-white" : "text-foreground/55"
                      )}
                    >
                      Cash on delivery
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={payment === "bank"}
                      onClick={() => setPayment("bank")}
                      className={cn(
                        "relative z-10 rounded-full py-1.5 text-center text-[11px] font-semibold tracking-wide transition-colors duration-300 sm:text-[12px]",
                        payment === "bank" ? "text-white" : "text-foreground/55"
                      )}
                    >
                      Bank transfer
                    </button>
                  </div>

                  {payment === "bank" ? (
                    <div
                      key="bank-panel"
                      className="animate-page-fade space-y-1.5 rounded-md bg-black/[0.04] px-2.5 py-2"
                    >
                      <div className="space-y-0.5 text-[11px]">
                        <div className="flex justify-between gap-2">
                          <span className="text-muted-foreground">Bank</span>
                          <span>{bankDetails.bankName}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-muted-foreground">Title</span>
                          <span className="truncate">
                            {bankDetails.accountTitle}
                          </span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-muted-foreground">IBAN</span>
                          <span className="text-[10px] tracking-wide">
                            {bankDetails.iban}
                          </span>
                        </div>
                      </div>
                      <input
                        ref={proofRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => onProofSelected(e.target.files)}
                      />
                      {paymentProof && proofName ? (
                        <div className="flex items-center gap-2 rounded-md border border-black/10 bg-white px-2.5 py-1.5">
                          <span className="min-w-0 flex-1 truncate text-[12px] text-foreground">
                            {proofName}
                          </span>
                          <button
                            type="button"
                            disabled={uploading}
                            onClick={() => proofRef.current?.click()}
                            className="shrink-0 text-[11px] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                          >
                            Replace
                          </button>
                          <button
                            type="button"
                            disabled={uploading}
                            onClick={clearProof}
                            aria-label="Remove screenshot"
                            className="inline-flex size-6 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                          >
                            <Trash2 className="size-3.5" strokeWidth={2} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={uploading}
                          onClick={() => proofRef.current?.click()}
                          className="flex w-full items-center gap-2.5 rounded-md border border-dashed border-black/20 bg-white px-2.5 py-2 text-left transition-colors hover:border-black/35 hover:bg-black/[0.02] disabled:opacity-50"
                        >
                          <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-black/[0.06]">
                            <Upload
                              className="size-3.5 text-foreground"
                              strokeWidth={2}
                            />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-[12px] font-medium tracking-normal text-foreground normal-case">
                              {uploading ? "Uploading…" : "Attach screenshot"}
                            </span>
                            <span className="block text-[10px] tracking-normal text-muted-foreground normal-case">
                              Transfer receipt image
                            </span>
                          </span>
                        </button>
                      )}
                    </div>
                  ) : null}

                  <div className="rounded-md bg-black/[0.04] px-2.5 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[10px] tracking-wide text-muted-foreground">
                        Delivery
                      </p>
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="text-[10px] text-muted-foreground transition-colors hover:text-foreground"
                      >
                        Edit
                      </button>
                    </div>
                    <p className="mt-1 text-[13px] leading-tight tracking-tight">
                      {details.name || "—"}
                    </p>
                    <p className="mt-0.5 line-clamp-1 text-[11px] text-foreground/70">
                      {[details.phone, details.email, details.address, details.city]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </p>
                  </div>
                </div>

                <div className="mt-3 shrink-0 pb-[env(safe-area-inset-bottom)]">
                  <button
                    type="button"
                    onClick={goReceipt}
                    className="group font-nav-display inline-flex h-11 w-full items-center justify-between rounded-md bg-black px-4 text-[13px] tracking-wide text-white transition-colors hover:bg-black/90"
                  >
                    <span>Receipt</span>
                    <span className="inline-flex size-7 items-center justify-center rounded-full bg-white/15 transition-transform duration-300 group-hover:translate-x-0.5">
                      <ArrowRight className="size-4 stroke-[2]" />
                    </span>
                  </button>
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="flex min-h-0 flex-1 flex-col gap-2.5">
                <div className="min-h-0 flex-1 overflow-y-auto rounded-md bg-black/[0.03] px-2 py-1.5 sm:overflow-visible sm:bg-transparent sm:p-0">
                  <StoreReceipt
                    compact
                    lines={checkoutReceiptLines(lines)}
                    shipping={shipping}
                    total={total}
                    payment={payment}
                    customer={details}
                    notes={notes}
                  />
                </div>
                <div className="shrink-0 pb-[env(safe-area-inset-bottom)]">
                  <SwipeToComplete
                    disabled={submitting}
                    loading={submitting}
                    onComplete={onComplete}
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </StoreShell>
  );
}
