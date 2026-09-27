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
import { BrandLogo } from "@/components/brand-logo";
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
    <div className="font-nav-display flex items-center justify-center gap-2 sm:gap-3">
      {labels.map((label, index) => {
        const n = (index + 1) as Step;
        const active = step === n;
        const done = step > n;
        return (
          <div key={label} className="flex items-center gap-2 sm:gap-3">
            {index > 0 ? (
              <span
                className={cn(
                  "h-px w-5 sm:w-8",
                  done || active ? "bg-foreground/40" : "bg-border/50"
                )}
                aria-hidden
              />
            ) : null}
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  "inline-flex size-6 items-center justify-center rounded-full text-[12px] tabular-nums",
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
                  "text-[12px] tracking-wide sm:text-[13px]",
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
    <div className="font-nav-display mx-auto w-full max-w-[320px] px-1 py-2 text-[13px] leading-relaxed text-foreground">
      <div className="text-center">
        <div className="mx-auto mb-3 flex justify-center">
          <BrandLogo
            size="lg"
            href={null}
            className="flex-col items-center gap-2"
            wordmarkClassName="font-nav-display text-[16px] tracking-tight lowercase"
          />
        </div>
        {orderId ? (
          <div className="mt-3 space-y-1 text-[11px] text-muted-foreground">
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
          <p className="mt-1.5 text-[12px] tracking-wide text-muted-foreground">
            Receipt
          </p>
        )}
      </div>

      <ReceiptRule />

      {hasCustomer ? (
        <>
          <div className="space-y-1 text-[12px] text-muted-foreground">
            {customer?.name ? (
              <p className="text-[14px] text-foreground">{customer.name}</p>
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

      <div className="space-y-2">
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

      <div className="space-y-1.5">
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

      <div className="flex justify-between gap-2 text-[15px]">
        <span>Total</span>
        <span className="tabular-nums">{formatPrice(total)}</span>
      </div>

      {notes ? (
        <>
          <ReceiptRule />
          <p className="text-[12px] text-muted-foreground">Note: {notes}</p>
        </>
      ) : null}

      {payment === "bank" && bankDetails ? (
        <>
          <ReceiptRule />
          <div className="space-y-0.5 text-[12px]">
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
          <p className="mb-2 text-[11px] tracking-wide text-muted-foreground">
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

      <p className="mt-6 text-center text-[12px] text-muted-foreground">
        Thank you
      </p>
    </div>
  );
}

const fieldClass =
  "font-nav-display h-10 rounded-md border-0 border-b border-border/50 bg-transparent px-0 text-[14px] shadow-none focus-visible:border-foreground focus-visible:ring-0";

const btnClass = "h-11 border-0 shadow-none";
const btnOutlineClass = "h-11 border-0 bg-black/8 shadow-none";

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
      <div className="font-nav-display mx-auto max-w-6xl px-6 py-10 md:py-14">
        <div className="text-center">
          <h1 className="text-4xl tracking-tight md:text-5xl">Checkout</h1>
          <div className="mt-6">
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
                      className="text-[12px] text-muted-foreground"
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
                      className="text-[12px] text-muted-foreground"
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
                      className="text-[12px] text-muted-foreground"
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
                      className="text-[12px] text-muted-foreground"
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
                      className="text-[12px] text-muted-foreground"
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
                      className="text-[12px] text-muted-foreground"
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
                    className="text-[12px] text-muted-foreground"
                  >
                    Remarks
                  </Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    aria-label="Order notes"
                    className="font-nav-display min-h-16 rounded-md border-0 border-b border-border/50 bg-transparent px-0 text-[14px] shadow-none focus-visible:border-foreground focus-visible:ring-0"
                  />
                </div>
                <Button type="submit" className={btnClass}>
                  Continue to payment
                </Button>
              </form>
            ) : null}

            {step === 2 ? (
              <div className="space-y-5">
                <p className="text-[13px] tracking-wide text-muted-foreground">
                  Payment method
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setPayment("cod")}
                    className={cn(
                      "rounded-md border-0 px-4 py-5 text-left transition-colors",
                      payment === "cod"
                        ? "bg-black text-white"
                        : "bg-black/6 hover:bg-black/10"
                    )}
                  >
                    <p className="text-[15px]">Cash on delivery</p>
                    <p
                      className={cn(
                        "mt-1.5 text-[13px]",
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
                      "rounded-md border-0 px-4 py-5 text-left transition-colors",
                      payment === "bank"
                        ? "bg-black text-white"
                        : "bg-black/6 hover:bg-black/10"
                    )}
                  >
                    <p className="text-[15px]">Bank transfer</p>
                    <p
                      className={cn(
                        "mt-1.5 text-[13px]",
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
                  <div className="space-y-4 rounded-md bg-black/5 px-4 py-4">
                    <div className="space-y-2 text-[14px]">
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
                        <span className="text-[13px] tracking-wide">
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
                        <div className="mt-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={paymentProof}
                            alt="Payment proof preview"
                            className="max-h-40 object-contain"
                          />
                          <p className="mt-3 text-[13px] text-muted-foreground">
                            Payment usually confirmed within 3 hours after you
                            place the order.
                          </p>
                        </div>
                      ) : (
                        <p className="mt-2 text-[13px] text-muted-foreground">
                          Upload a clear screenshot of your transfer to continue.
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="relative overflow-hidden rounded-md bg-black/5 px-5 py-5 sm:px-6 sm:py-6">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-[13px] tracking-wide text-muted-foreground">
                        Delivery details
                      </p>
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
                      >
                        Edit
                      </button>
                    </div>

                    <div className="mt-5 grid gap-5 sm:grid-cols-2">
                      <div className="space-y-1">
                        <p className="text-[11px] tracking-wide text-muted-foreground/80">
                          Name
                        </p>
                        <p className="text-[18px] leading-snug tracking-tight">
                          {details.name || "—"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[11px] tracking-wide text-muted-foreground/80">
                          Phone
                        </p>
                        <p className="text-[14px] tabular-nums">
                          {details.phone || "—"}
                        </p>
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <p className="text-[11px] tracking-wide text-muted-foreground/80">
                          Email
                        </p>
                        <p className="break-all text-[14px]">
                          {details.email || "—"}
                        </p>
                      </div>
                    </div>

                    <div className="my-5 h-px bg-black/10" aria-hidden />

                    <div className="space-y-1">
                      <p className="text-[11px] tracking-wide text-muted-foreground/80">
                        Address
                      </p>
                      <p className="text-[14px] leading-relaxed">
                        {details.address || "—"}
                      </p>
                      <p className="pt-0.5 text-[14px] text-muted-foreground">
                        {[details.city, details.country]
                          .filter(Boolean)
                          .join(", ") || "—"}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2.5">
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
              <div className="space-y-5">
                <div className="relative overflow-hidden rounded-md bg-black/5 px-5 py-5 sm:px-6 sm:py-6">
                  <p className="text-[13px] tracking-wide text-muted-foreground">
                    Confirm order
                  </p>
                  {payment === "bank" ? (
                    <div className="mt-3 space-y-3">
                      <p className="text-[28px] leading-snug tracking-tight md:text-[32px]">
                        Ready to place your order
                      </p>
                      <p className="max-w-md text-[14px] leading-relaxed text-muted-foreground">
                        Your transfer proof is attached. Confirmation usually
                        takes up to 3 hours after you place the order.
                      </p>
                      <div className="border-t border-black/10 pt-3">
                        <p className="text-[12px] text-muted-foreground">
                          Tracking ID
                        </p>
                        <p className="mt-1 text-[14px] text-foreground">
                          You’ll get yours on the next screen.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 space-y-3">
                      <p className="text-[28px] leading-snug tracking-tight md:text-[32px]">
                        Review your receipt
                      </p>
                      <p className="max-w-md text-[14px] leading-relaxed text-muted-foreground">
                        Then place your cash-on-delivery order. Pay when the
                        parcel arrives.
                      </p>
                      <div className="border-t border-black/10 pt-3">
                        <p className="text-[12px] text-muted-foreground">
                          Tracking ID
                        </p>
                        <p className="mt-1 text-[14px] text-foreground">
                          You’ll get yours on the next screen.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2.5">
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
