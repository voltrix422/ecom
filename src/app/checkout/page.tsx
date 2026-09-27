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

        <div
          className={cn(
            "mt-5 sm:mt-8",
            step === 3
              ? "grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.85fr)] lg:items-start lg:gap-10"
              : "mx-auto max-w-xl"
          )}
        >
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
              <div className="space-y-3 sm:space-y-4">
                <p className="text-[12px] tracking-wide text-muted-foreground">
                  Payment method
                </p>
                <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setPayment("cod")}
                    className={cn(
                      "rounded-md border-0 px-3.5 py-3.5 text-left transition-colors sm:px-4 sm:py-4",
                      payment === "cod"
                        ? "bg-black text-white"
                        : "bg-black/6 hover:bg-black/10"
                    )}
                  >
                    <p className="text-[14px] sm:text-[15px]">Cash on delivery</p>
                    <p
                      className={cn(
                        "mt-1 text-[12px] sm:text-[13px]",
                        payment === "cod"
                          ? "text-white/70"
                          : "text-muted-foreground"
                      )}
                    >
                      Pay in cash when your order arrives.
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayment("bank")}
                    className={cn(
                      "rounded-md border-0 px-3.5 py-3.5 text-left transition-colors sm:px-4 sm:py-4",
                      payment === "bank"
                        ? "bg-black text-white"
                        : "bg-black/6 hover:bg-black/10"
                    )}
                  >
                    <p className="text-[14px] sm:text-[15px]">Bank transfer</p>
                    <p
                      className={cn(
                        "mt-1 text-[12px] sm:text-[13px]",
                        payment === "bank"
                          ? "text-white/70"
                          : "text-muted-foreground"
                      )}
                    >
                      Transfer, then attach payment proof.
                    </p>
                  </button>
                </div>

                {payment === "bank" ? (
                  <div className="space-y-3 rounded-md bg-black/5 px-3.5 py-3.5 sm:px-4 sm:py-4">
                    <div className="space-y-1.5 text-[13px] sm:text-[14px]">
                      <div className="flex justify-between gap-3">
                        <span className="text-muted-foreground">Bank</span>
                        <span>{bankDetails.bankName}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-muted-foreground">
                          Account title
                        </span>
                        <span>{bankDetails.accountTitle}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-muted-foreground">IBAN</span>
                        <span className="text-[12px] tracking-wide sm:text-[13px]">
                          {bankDetails.iban}
                        </span>
                      </div>
                    </div>

                    <div>
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
                        className={btnOutlineClass}
                        disabled={uploading}
                        onClick={() => proofRef.current?.click()}
                      >
                        <Upload className="size-3.5" />
                        {uploading
                          ? "Uploading…"
                          : paymentProof
                            ? "Replace payment proof"
                            : "Attach payment screenshot"}
                      </Button>
                      {paymentProof ? (
                        <div className="mt-2.5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={paymentProof}
                            alt="Payment proof preview"
                            className="max-h-32 object-contain sm:max-h-40"
                          />
                          <p className="mt-2 text-[12px] text-muted-foreground sm:text-[13px]">
                            Payment usually confirmed within 3 hours after you
                            place the order.
                          </p>
                        </div>
                      ) : (
                        <p className="mt-1.5 text-[12px] text-muted-foreground sm:text-[13px]">
                          Upload a clear screenshot of your transfer to continue.
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="relative overflow-hidden rounded-md bg-black/5 px-3.5 py-3.5 sm:px-5 sm:py-5">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-[12px] tracking-wide text-muted-foreground">
                        Delivery details
                      </p>
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="text-[12px] text-muted-foreground transition-colors hover:text-foreground sm:text-[13px]"
                      >
                        Edit
                      </button>
                    </div>

                    <div className="mt-3 grid gap-3 sm:mt-4 sm:grid-cols-2 sm:gap-4">
                      <div className="space-y-0.5">
                        <p className="text-[10px] tracking-wide text-muted-foreground/80">
                          Name
                        </p>
                        <p className="text-[15px] leading-snug tracking-tight sm:text-[18px]">
                          {details.name || "—"}
                        </p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] tracking-wide text-muted-foreground/80">
                          Phone
                        </p>
                        <p className="text-[13px] tabular-nums sm:text-[14px]">
                          {details.phone || "—"}
                        </p>
                      </div>
                      <div className="space-y-0.5 sm:col-span-2">
                        <p className="text-[10px] tracking-wide text-muted-foreground/80">
                          Email
                        </p>
                        <p className="break-all text-[13px] sm:text-[14px]">
                          {details.email || "—"}
                        </p>
                      </div>
                    </div>

                    <div className="my-3 h-px bg-black/10 sm:my-4" aria-hidden />

                    <div className="space-y-0.5">
                      <p className="text-[10px] tracking-wide text-muted-foreground/80">
                        Address
                      </p>
                      <p className="text-[13px] leading-relaxed sm:text-[14px]">
                        {details.address || "—"}
                      </p>
                      <p className="pt-0.5 text-[13px] text-muted-foreground sm:text-[14px]">
                        {[details.city, details.country]
                          .filter(Boolean)
                          .join(", ") || "—"}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-2.5">
                  <Button
                    type="button"
                    variant="outline"
                    className={btnOutlineClass}
                    onClick={() => setStep(1)}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    className={btnClass}
                    onClick={goReceipt}
                  >
                    Continue to receipt
                  </Button>
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="space-y-4 sm:space-y-5">
                <div className="relative overflow-hidden rounded-md bg-black/5 px-4 py-4 sm:px-5 sm:py-5">
                  <p className="text-[12px] tracking-wide text-muted-foreground sm:text-[13px]">
                    Confirm order
                  </p>
                  {payment === "bank" ? (
                    <div className="mt-2 space-y-2 sm:mt-3 sm:space-y-3">
                      <p className="text-[22px] leading-snug tracking-tight sm:text-[28px] md:text-[32px]">
                        Ready to place your order
                      </p>
                      <p className="max-w-md text-[13px] leading-relaxed text-muted-foreground sm:text-[14px]">
                        Your transfer proof is attached. Confirmation usually
                        takes up to 3 hours after you place the order.
                      </p>
                      <div className="border-t border-black/10 pt-2.5 sm:pt-3">
                        <p className={labelClass}>Tracking ID</p>
                        <p className="mt-0.5 text-[13px] text-foreground sm:text-[14px]">
                          You’ll get yours on the next screen.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 space-y-2 sm:mt-3 sm:space-y-3">
                      <p className="text-[22px] leading-snug tracking-tight sm:text-[28px] md:text-[32px]">
                        Review your receipt
                      </p>
                      <p className="max-w-md text-[13px] leading-relaxed text-muted-foreground sm:text-[14px]">
                        Then place your cash-on-delivery order. Pay when the
                        parcel arrives.
                      </p>
                      <div className="border-t border-black/10 pt-2.5 sm:pt-3">
                        <p className={labelClass}>Tracking ID</p>
                        <p className="mt-0.5 text-[13px] text-foreground sm:text-[14px]">
                          You’ll get yours on the next screen.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-2.5">
                  <Button
                    type="button"
                    variant="outline"
                    className={btnOutlineClass}
                    onClick={() => setStep(2)}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    className={btnClass}
                    disabled={submitting}
                    onClick={onComplete}
                  >
                    {submitting ? "Placing…" : "Complete order"}
                  </Button>
                </div>
              </div>
            ) : null}
          </div>

          {step === 3 ? (
            <aside className="lg:sticky lg:top-24">
              <StoreReceipt
                lines={checkoutReceiptLines(lines)}
                shipping={shipping}
                total={total}
                payment={payment}
                customer={details}
                notes={notes}
                bankDetails={payment === "bank" ? bankDetails : undefined}
                paymentProof={
                  payment === "bank" ? paymentProof : null
                }
              />
            </aside>
          ) : null}
        </div>
      </div>
    </StoreShell>
  );
}
