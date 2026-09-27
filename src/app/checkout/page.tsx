"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useRef, useState } from "react";
import { ArrowLeft, Upload } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import { StoreShell } from "@/components/storefront/store-shell";
import {
  StoreReceipt,
  checkoutReceiptLines,
} from "@/components/storefront/store-receipt";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fileToDataUrl } from "@/lib/image-upload";
import { useStore } from "@/lib/store";
import type { PaymentMethod, Product } from "@/lib/types";

type Step = 1 | 2 | 3;

type Line = { product: Product; quantity: number };

function StepDots({ step }: { step: Step }) {
  const labels = ["Details", "Payment", "Receipt"];
  return (
    <div className="flex items-center justify-center gap-1.5 sm:gap-2.5">
      {labels.map((label, index) => {
        const n = (index + 1) as Step;
        const active = step === n;
        const done = step > n;
        return (
          <div key={label} className="flex items-center gap-1.5 sm:gap-2.5">
            {index > 0 ? (
              <span
                className={cn(
                  "h-px w-4 sm:w-6",
                  done || active ? "bg-foreground/40" : "bg-border/50"
                )}
                aria-hidden
              />
            ) : null}
            <div className="flex items-center gap-1">
              <span
                className={cn(
                  "inline-flex size-5 items-center justify-center rounded-full text-[11px] tabular-nums sm:size-6 sm:text-[12px]",
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
                  "text-[11px] sm:text-[12px]",
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

const fieldClass =
  "h-9 rounded-none border-0 border-b border-border/45 bg-transparent px-0 text-[14px] normal-case shadow-none focus-visible:border-foreground focus-visible:ring-0";

const labelClass =
  "text-[11px] font-normal normal-case tracking-normal text-muted-foreground";

const btnClass = "font-nav-display h-11 w-full border-0 shadow-none sm:w-auto";
const btnOutlineClass =
  "font-nav-display h-11 w-full border-0 bg-black/8 shadow-none sm:w-auto";

export default function CheckoutPage() {
  const router = useRouter();
  const proofRef = useRef<HTMLInputElement>(null);
  const { cart, products, cartTotal, placeOrder, bankDetails } = useStore();

  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);
  const [payment, setPayment] = useState<PaymentMethod>("cod");
  const [notes, setNotes] = useState("");
  const [paymentProof, setPaymentProof] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [details, setDetails] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "Pakistan",
  });

  const lines = cart
    .map((item) => {
      const product = products.find((entry) => entry.id === item.productId);
      return product ? { product, quantity: item.quantity } : null;
    })
    .filter((item): item is Line => item !== null);

  const shipping = cartTotal >= 15000 ? 0 : 250;
  const total = cartTotal + shipping;

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
      toast.success("Payment proof attached");
    } catch {
      toast.error("Could not upload proof");
    } finally {
      setUploading(false);
      if (proofRef.current) proofRef.current.value = "";
    }
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
    if (lines.length === 0) return;
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
      toast.success("Order placed");
      router.push(`/checkout/success?order=${order.id}&pay=${payment}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not place order");
      setSubmitting(false);
    }
  }

  if (lines.length === 0) {
    return (
      <StoreShell hideSaleBanner>
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
            <Link href="/shop">
              <span>Continue shopping</span>
            </Link>
          </Button>
        </div>
      </StoreShell>
    );
  }

  return (
    <StoreShell hideSaleBanner>
      <div className="mx-auto max-w-6xl px-4 pt-2 pb-8 sm:px-6 sm:pt-4 md:pt-8 md:pb-14">
        <div className="relative text-center">
          <button
            type="button"
            onClick={() => router.back()}
            className="absolute top-0.5 left-0 inline-flex size-9 items-center justify-center text-foreground/70 transition-colors hover:text-foreground"
            aria-label="Go back"
          >
            <ArrowLeft className="size-4 stroke-[1.75]" />
          </button>
          <h1 className="font-nav-display text-[28px] leading-none tracking-tight sm:text-4xl md:text-5xl">
            Checkout
          </h1>
          <div className="mt-3 sm:mt-5">
            <StepDots step={step} />
          </div>
        </div>

        <div className="mx-auto mt-5 max-w-xl sm:mt-8">
          <div className="normal-case">
            {step === 1 ? (
              <form
                onSubmit={goPayment}
                className="space-y-2.5 sm:space-y-3"
                autoComplete="on"
              >
                <div className="grid grid-cols-1 gap-x-3 gap-y-2 sm:grid-cols-2 sm:gap-y-2.5">
                  <div className="space-y-0.5">
                    <Label htmlFor="name" className={labelClass}>
                      Name
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      autoComplete="name"
                      value={details.name}
                      onChange={(e) =>
                        setDetails((d) => ({ ...d, name: e.target.value }))
                      }
                      required
                      aria-label="Full name"
                      className={fieldClass}
                    />
                  </div>
                  <div className="space-y-0.5">
                    <Label htmlFor="email" className={labelClass}>
                      Email
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      value={details.email}
                      onChange={(e) =>
                        setDetails((d) => ({ ...d, email: e.target.value }))
                      }
                      required
                      aria-label="Email"
                      className={fieldClass}
                    />
                  </div>
                  <div className="space-y-0.5">
                    <Label htmlFor="phone" className={labelClass}>
                      Phone
                    </Label>
                    <Input
                      id="phone"
                      name="tel"
                      type="tel"
                      autoComplete="tel"
                      value={details.phone}
                      onChange={(e) =>
                        setDetails((d) => ({ ...d, phone: e.target.value }))
                      }
                      required
                      aria-label="Phone"
                      className={fieldClass}
                    />
                  </div>
                  <div className="space-y-0.5">
                    <Label htmlFor="city" className={labelClass}>
                      City
                    </Label>
                    <Input
                      id="city"
                      name="city"
                      autoComplete="address-level2"
                      value={details.city}
                      onChange={(e) =>
                        setDetails((d) => ({ ...d, city: e.target.value }))
                      }
                      required
                      aria-label="City"
                      className={fieldClass}
                    />
                  </div>
                  <div className="space-y-0.5 sm:col-span-2">
                    <Label htmlFor="address" className={labelClass}>
                      Address
                    </Label>
                    <Input
                      id="address"
                      name="street-address"
                      autoComplete="street-address"
                      value={details.address}
                      onChange={(e) =>
                        setDetails((d) => ({ ...d, address: e.target.value }))
                      }
                      required
                      aria-label="Address"
                      className={fieldClass}
                    />
                  </div>
                  <div className="space-y-0.5 sm:col-span-2">
                    <Label htmlFor="country" className={labelClass}>
                      Country
                    </Label>
                    <Input
                      id="country"
                      name="country"
                      autoComplete="country-name"
                      value={details.country}
                      onChange={(e) =>
                        setDetails((d) => ({ ...d, country: e.target.value }))
                      }
                      required
                      aria-label="Country"
                      className={fieldClass}
                    />
                  </div>
                </div>
                <div className="space-y-0.5">
                  <Label htmlFor="notes" className={labelClass}>
                    Remarks
                  </Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    aria-label="Order notes"
                    className="min-h-12 rounded-none border-0 border-b border-border/45 bg-transparent px-0 text-[14px] normal-case shadow-none focus-visible:border-foreground focus-visible:ring-0"
                  />
                </div>
                <Button type="submit" className={cn("mt-2", btnClass)}>
                  Continue to payment
                </Button>
              </form>
            ) : null}

            {step === 2 ? (
              <div className="flex min-h-[calc(100svh-8.5rem)] flex-col gap-3 sm:min-h-0 sm:gap-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[12px] tracking-wide text-muted-foreground">
                    Payment
                  </p>
                  <Button
                    type="button"
                    className="font-nav-display h-9 shrink-0 border-0 px-4 text-[12px] shadow-none"
                    onClick={goReceipt}
                  >
                    Continue to receipt
                  </Button>
                </div>

                <div
                  role="tablist"
                  aria-label="Payment method"
                  className="relative grid grid-cols-2 rounded-full bg-black/[0.06] p-1"
                >
                  <span
                    aria-hidden
                    className={cn(
                      "absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full bg-black shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                      payment === "bank" ? "translate-x-[calc(100%+4px)]" : "translate-x-0"
                    )}
                    style={{ left: 4 }}
                  />
                  <button
                    type="button"
                    role="tab"
                    aria-selected={payment === "cod"}
                    onClick={() => setPayment("cod")}
                    className={cn(
                      "relative z-10 rounded-full py-2 text-center text-[12px] font-semibold tracking-wide transition-colors duration-300 sm:text-[13px]",
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
                      "relative z-10 rounded-full py-2 text-center text-[12px] font-semibold tracking-wide transition-colors duration-300 sm:text-[13px]",
                      payment === "bank" ? "text-white" : "text-foreground/55"
                    )}
                  >
                    Bank transfer
                  </button>
                </div>

                <p
                  key={payment}
                  className="animate-page-fade text-[11px] leading-snug text-muted-foreground sm:text-[12px]"
                >
                  {payment === "cod"
                    ? "Pay in cash when your order arrives."
                    : "Transfer, then attach payment proof below."}
                </p>

                {payment === "bank" ? (
                  <div
                    key="bank-panel"
                    className="animate-page-fade space-y-2.5 rounded-md bg-black/[0.04] px-3 py-2.5"
                  >
                    <div className="space-y-1 text-[12px] sm:text-[13px]">
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground">Bank</span>
                        <span>{bankDetails.bankName}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground">Title</span>
                        <span className="truncate">{bankDetails.accountTitle}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground">IBAN</span>
                        <span className="text-[11px] tracking-wide sm:text-[12px]">
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
                    <Button
                      type="button"
                      variant="outline"
                      className="font-nav-display h-9 w-full border-0 bg-white text-[12px] shadow-none"
                      disabled={uploading}
                      onClick={() => proofRef.current?.click()}
                    >
                      <Upload className="size-3.5" />
                      {uploading
                        ? "Uploading…"
                        : paymentProof
                          ? "Replace proof"
                          : "Attach screenshot"}
                    </Button>
                    {paymentProof ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={paymentProof}
                        alt="Payment proof preview"
                        className="max-h-20 object-contain"
                      />
                    ) : null}
                  </div>
                ) : null}

                <div className="mt-auto rounded-md bg-black/[0.04] px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] tracking-wide text-muted-foreground">
                      Delivery details
                    </p>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Edit
                    </button>
                  </div>
                  <p className="mt-1.5 text-[14px] leading-tight tracking-tight">
                    {details.name || "—"}
                  </p>
                  <p className="mt-0.5 text-[12px] text-foreground/70 tabular-nums">
                    {details.phone || "—"}
                  </p>
                  <p className="mt-0.5 truncate text-[12px] text-foreground/70">
                    {details.email || "—"}
                  </p>
                  <p className="mt-1.5 line-clamp-2 text-[12px] leading-snug text-foreground/75">
                    {[details.address, details.city, details.country]
                      .filter(Boolean)
                      .join(", ") || "—"}
                  </p>
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="flex min-h-[calc(100svh-8.5rem)] flex-col gap-3 sm:min-h-0 sm:gap-4">
                <div className="min-h-0 flex-1 overflow-y-auto rounded-md bg-black/[0.03] p-1 sm:overflow-visible sm:bg-transparent sm:p-0">
                  <StoreReceipt
                    lines={checkoutReceiptLines(lines)}
                    shipping={shipping}
                    total={total}
                    payment={payment}
                    customer={details}
                    notes={notes}
                    bankDetails={payment === "bank" ? bankDetails : undefined}
                    paymentProof={payment === "bank" ? paymentProof : null}
                  />
                </div>
                <Button
                  type="button"
                  className={cn(btnClass, "mt-auto shrink-0")}
                  disabled={submitting}
                  onClick={onComplete}
                >
                  {submitting ? "Placing…" : "Complete order"}
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </StoreShell>
  );
}
