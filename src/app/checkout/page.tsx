"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import { StoreShell } from "@/components/storefront/store-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BrandArcLogo } from "@/components/brand-arc-logo";
import { formatPrice, salePrice } from "@/lib/format";
import { fileToDataUrl } from "@/lib/image-upload";
import { useStore } from "@/lib/store";
import type {
  BankDetails,
  CustomerInfo,
  PaymentMethod,
  Product,
} from "@/lib/types";

type Step = 1 | 2 | 3;

type Line = { product: Product; quantity: number };

function StepDots({ step }: { step: Step }) {
  const labels = ["Details", "Payment", "Receipt"];
  return (
    <div className="flex items-center justify-center gap-1.5 sm:gap-2">
      {labels.map((label, index) => {
        const n = (index + 1) as Step;
        const active = step === n;
        const done = step > n;
        return (
          <div key={label} className="flex items-center gap-1.5 sm:gap-2">
            {index > 0 ? (
              <span className="h-px w-4 bg-border/50 sm:w-6" aria-hidden />
            ) : null}
            <div className="flex items-center gap-1">
              <span
                className={cn(
                  "text-[11px] tabular-nums",
                  done || active
                    ? "text-foreground"
                    : "text-muted-foreground/50"
                )}
              >
                {done ? "✓" : n}
              </span>
              <span
                className={cn(
                  "text-[10px] tracking-[0.1em] uppercase",
                  active ? "text-foreground" : "text-muted-foreground/55"
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

function ReceiptRule({ heavy = false }: { heavy?: boolean }) {
  return (
    <div
      className={cn(
        "my-3 border-t",
        heavy ? "border-foreground/35" : "border-dashed border-foreground/20"
      )}
      aria-hidden
    />
  );
}

function ReceiptCard({
  lines,
  shipping,
  total,
  payment,
  customer,
  notes,
  bankDetails,
  paymentProof,
  orderId,
  trackingId,
}: {
  lines: Line[];
  shipping: number;
  total: number;
  payment: PaymentMethod;
  customer?: Partial<CustomerInfo>;
  notes?: string;
  bankDetails?: BankDetails;
  paymentProof?: string | null;
  orderId?: string;
  trackingId?: string;
}) {
  const subtotal = total - shipping;
  const hasCustomer = Boolean(
    customer?.name ||
      customer?.phone ||
      customer?.email ||
      customer?.address ||
      customer?.city
  );

  return (
    <div className="mx-auto w-full max-w-[280px] px-1 py-2 font-mono text-[12px] leading-relaxed text-foreground">
      <div className="text-center">
        <div className="mx-auto mb-2 flex justify-center">
          <BrandArcLogo size={112} href={null} />
        </div>
        {orderId ? (
          <div className="mt-3 space-y-1 text-[10px] text-muted-foreground">
            <p>
              <span className="text-muted-foreground/80">Order</span>{" "}
              <span className="text-foreground">{orderId}</span>
            </p>
            {trackingId ? (
              <p>
                <span className="text-muted-foreground/80">Tracking ID</span>{" "}
                <span className="text-foreground">{trackingId}</span>
              </p>
            ) : null}
          </div>
        ) : (
          <p className="mt-1 text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
            Receipt
          </p>
        )}
      </div>

      <ReceiptRule />

      {hasCustomer ? (
        <>
          <div className="space-y-0.5 text-[11px] text-muted-foreground">
            {customer?.name ? (
              <p className="text-foreground">{customer.name}</p>
            ) : null}
            {customer?.phone ? <p>{customer.phone}</p> : null}
            {customer?.email ? (
              <p className="break-all">{customer.email}</p>
            ) : null}
            {customer?.address || customer?.city ? (
              <p>
                {[customer?.address, customer?.city].filter(Boolean).join(", ")}
              </p>
            ) : null}
            {customer?.country ? <p>{customer.country}</p> : null}
          </div>
          <ReceiptRule />
        </>
      ) : null}

      <div className="space-y-1.5">
        {lines.map(({ product, quantity }) => (
          <div key={product.id} className="flex justify-between gap-2">
            <span className="min-w-0 flex-1 truncate text-muted-foreground">
              {product.name} × {quantity}
            </span>
            <span className="shrink-0 tabular-nums">
              {formatPrice(salePrice(product.price) * quantity)}
            </span>
          </div>
        ))}
      </div>

      <ReceiptRule />

      <div className="space-y-1">
        <div className="flex justify-between gap-2">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="tabular-nums">{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-muted-foreground">Shipping</span>
          <span className="tabular-nums">
            {shipping === 0 ? "Free" : formatPrice(shipping)}
          </span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-muted-foreground">Payment</span>
          <span>{payment === "cod" ? "COD" : "Bank"}</span>
        </div>
      </div>

      <ReceiptRule heavy />

      <div className="flex justify-between gap-2 text-[13px]">
        <span>Total</span>
        <span className="tabular-nums">{formatPrice(total)}</span>
      </div>

      {notes ? (
        <>
          <ReceiptRule />
          <p className="text-[11px] text-muted-foreground">Note: {notes}</p>
        </>
      ) : null}

      {payment === "bank" && bankDetails ? (
        <>
          <ReceiptRule />
          <div className="space-y-0.5 text-[11px]">
            <p className="text-muted-foreground">Bank transfer</p>
            <p>{bankDetails.bankName}</p>
            <p>{bankDetails.accountTitle}</p>
            <p className="break-all tracking-wide">{bankDetails.iban}</p>
          </div>
        </>
      ) : null}

      {paymentProof ? (
        <>
          <ReceiptRule />
          <p className="mb-2 text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
            Payment proof
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={paymentProof}
            alt="Payment proof"
            className="max-h-36 w-full object-contain"
          />
        </>
      ) : null}

      <p className="mt-5 text-center text-[10px] text-muted-foreground">
        Thank you
      </p>
    </div>
  );
}

const fieldClass =
  "h-8 rounded-none border-0 border-b border-border/50 bg-transparent px-0 text-sm shadow-none focus-visible:border-foreground focus-visible:ring-0";

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

  function onComplete() {
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
    const order = placeOrder(customer, {
      paymentMethod: payment,
      notes,
      paymentProof: paymentProof || undefined,
      shipping,
    });
    toast.success("Order placed");
    router.push(
      `/checkout/success?order=${order.id}&pay=${payment}`
    );
  }

  if (lines.length === 0) {
    return (
      <StoreShell hideSaleBanner>
        <div className="mx-auto max-w-6xl px-6 py-24">
          <h1 className="font-heading text-4xl">Checkout</h1>
          <p className="mt-4 text-sm text-muted-foreground">Your bag is empty.</p>
          <Button asChild className="mt-6 rounded-none">
            <Link href="/shop">Continue shopping</Link>
          </Button>
        </div>
      </StoreShell>
    );
  }

  return (
    <StoreShell hideSaleBanner>
      <div className="mx-auto max-w-6xl px-6 py-10 md:py-14">
        <div className="text-center">
          <h1 className="font-heading text-4xl tracking-tight">Checkout</h1>
          <div className="mt-5">
            <StepDots step={step} />
          </div>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.85fr)] lg:items-start">
          <div>
            {step === 1 ? (
              <form
                onSubmit={goPayment}
                className="space-y-4"
                autoComplete="on"
              >
                <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-3">
                  <div className="space-y-1">
                    <Label
                      htmlFor="name"
                      className="text-[11px] text-muted-foreground"
                    >
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
                  <div className="space-y-1">
                    <Label
                      htmlFor="email"
                      className="text-[11px] text-muted-foreground"
                    >
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
                  <div className="space-y-1">
                    <Label
                      htmlFor="phone"
                      className="text-[11px] text-muted-foreground"
                    >
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
                  <div className="space-y-1">
                    <Label
                      htmlFor="address"
                      className="text-[11px] text-muted-foreground"
                    >
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
                  <div className="space-y-1">
                    <Label
                      htmlFor="city"
                      className="text-[11px] text-muted-foreground"
                    >
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
                  <div className="space-y-1">
                    <Label
                      htmlFor="country"
                      className="text-[11px] text-muted-foreground"
                    >
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
                <div className="space-y-1">
                  <Label
                    htmlFor="notes"
                    className="text-[11px] text-muted-foreground"
                  >
                    Remarks
                  </Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    aria-label="Order notes"
                    className="min-h-14 rounded-none border-0 border-b border-border/50 bg-transparent px-0 text-sm shadow-none focus-visible:border-foreground focus-visible:ring-0"
                  />
                </div>
                <Button type="submit" className="h-8 rounded-none text-sm">
                  Continue to payment
                </Button>
              </form>
            ) : null}

            {step === 2 ? (
              <div className="space-y-5">
                <p className="text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
                  Payment method
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setPayment("cod")}
                    className={cn(
                      "border px-4 py-4 text-left transition-colors",
                      payment === "cod"
                        ? "border-foreground bg-muted/35"
                        : "border-border/60 hover:border-foreground/40"
                    )}
                  >
                    <p className="text-sm">Cash on delivery</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Pay in cash when your order arrives.
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayment("bank")}
                    className={cn(
                      "border px-4 py-4 text-left transition-colors",
                      payment === "bank"
                        ? "border-foreground bg-muted/35"
                        : "border-border/60 hover:border-foreground/40"
                    )}
                  >
                    <p className="text-sm">Bank transfer</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Transfer, then attach payment proof.
                    </p>
                  </button>
                </div>

                {payment === "bank" ? (
                  <div className="space-y-4 border border-border/60 bg-muted/20 px-4 py-4">
                    <div className="space-y-1.5 text-sm">
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
                        <span className="font-mono text-xs tracking-wide">
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
                        className="rounded-none"
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
                        <div className="mt-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={paymentProof}
                            alt="Payment proof preview"
                            className="max-h-40 border object-contain"
                          />
                          <p className="mt-3 text-xs text-muted-foreground">
                            Payment usually confirmed within 3 hours after you
                            place the order.
                          </p>
                        </div>
                      ) : (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Upload a clear screenshot of your transfer to continue.
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="relative overflow-hidden bg-muted/30 px-5 py-5 sm:px-6 sm:py-6">
                    <div
                      className="absolute inset-y-0 left-0 w-0.5 bg-foreground/70"
                      aria-hidden
                    />
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
                        Delivery details
                      </p>
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="text-[10px] tracking-[0.14em] text-muted-foreground uppercase underline-offset-4 transition-colors hover:text-foreground hover:underline"
                      >
                        Edit
                      </button>
                    </div>

                    <div className="mt-5 grid gap-5 sm:grid-cols-2">
                      <div className="space-y-1">
                        <p className="text-[9px] tracking-[0.16em] text-muted-foreground/80 uppercase">
                          Name
                        </p>
                        <p className="font-heading text-lg leading-snug tracking-tight">
                          {details.name || "—"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] tracking-[0.16em] text-muted-foreground/80 uppercase">
                          Phone
                        </p>
                        <p className="text-sm tabular-nums">
                          {details.phone || "—"}
                        </p>
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <p className="text-[9px] tracking-[0.16em] text-muted-foreground/80 uppercase">
                          Email
                        </p>
                        <p className="break-all text-sm">{details.email || "—"}</p>
                      </div>
                    </div>

                    <div className="my-5 h-px bg-border/50" aria-hidden />

                    <div className="space-y-1">
                      <p className="text-[9px] tracking-[0.16em] text-muted-foreground/80 uppercase">
                        Address
                      </p>
                      <p className="text-sm leading-relaxed">
                        {details.address || "—"}
                      </p>
                      <p className="pt-0.5 text-sm text-muted-foreground">
                        {[details.city, details.country]
                          .filter(Boolean)
                          .join(", ") || "—"}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-none"
                    onClick={() => setStep(1)}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    className="rounded-none"
                    onClick={goReceipt}
                  >
                    Continue to receipt
                  </Button>
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="space-y-5">
                <div className="relative overflow-hidden bg-muted/30 px-5 py-5 sm:px-6 sm:py-6">
                  <div
                    className="absolute inset-y-0 left-0 w-0.5 bg-foreground/70"
                    aria-hidden
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Confirm order
                  </p>
                  {payment === "bank" ? (
                    <div className="mt-3 space-y-3">
                      <p className="font-heading text-2xl leading-snug tracking-tight">
                        Ready to place your order
                      </p>
                      <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
                        Your transfer proof is attached. Confirmation usually
                        takes up to 3 hours after you place the order.
                      </p>
                      <div className="border-t border-border/50 pt-3">
                        <p className="text-[11px] text-muted-foreground">
                          Tracking ID
                        </p>
                        <p className="mt-1 text-sm text-foreground">
                          You’ll get yours on the next screen.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 space-y-3">
                      <p className="font-heading text-2xl leading-snug tracking-tight">
                        Review your receipt
                      </p>
                      <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
                        Then place your cash-on-delivery order. Pay when the
                        parcel arrives.
                      </p>
                      <div className="border-t border-border/50 pt-3">
                        <p className="text-[11px] text-muted-foreground">
                          Tracking ID
                        </p>
                        <p className="mt-1 text-sm text-foreground">
                          You’ll get yours on the next screen.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-none"
                    onClick={() => setStep(2)}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    className="rounded-none"
                    disabled={submitting}
                    onClick={onComplete}
                  >
                    {submitting ? "Placing…" : "Complete order"}
                  </Button>
                </div>
              </div>
            ) : null}
          </div>

          <aside className="lg:sticky lg:top-24">
            <ReceiptCard
              lines={lines}
              shipping={shipping}
              total={total}
              payment={payment}
              customer={details}
              notes={notes}
              bankDetails={payment === "bank" ? bankDetails : undefined}
              paymentProof={
                payment === "bank" && step >= 2 ? paymentProof : null
              }
            />
          </aside>
        </div>
      </div>
    </StoreShell>
  );
}
