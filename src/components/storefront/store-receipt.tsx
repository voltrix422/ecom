"use client";

import Image from "next/image";
import { Download } from "lucide-react";
import { brand } from "@/lib/data";
import { formatDate, formatPrice, salePrice } from "@/lib/format";
import { cn } from "cn";
import type {
  BankDetails,
  CustomerInfo,
  PaymentMethod,
  Product,
} from "@/lib/types";

type Line = { product: Product; quantity: number };

function Rule({ heavy = false }: { heavy?: boolean }) {
  return (
    <div
      className={cn(
        "my-4 border-t",
        heavy ? "border-foreground/35" : "border-dashed border-foreground/15"
      )}
      aria-hidden
    />
  );
}

export function ReceiptBrand({ className }: { className?: string }) {
  return (
    <div className={cn("mx-auto flex justify-center", className)}>
      <Image
        src={brand.wordmark}
        alt={brand.name}
        width={200}
        height={44}
        className="h-10 w-auto object-contain md:h-11"
        priority
        unoptimized
      />
    </div>
  );
}

function CustomerBlock({
  customer,
}: {
  customer: Partial<CustomerInfo>;
}) {
  const name = customer.name?.trim();
  const email = customer.email?.trim();
  const phone = customer.phone?.trim();
  const address = customer.address?.trim();
  const city = customer.city?.trim();
  const country = customer.country?.trim();

  if (!name && !email && !phone && !address && !city && !country) {
    return null;
  }

  return (
    <div className="rounded-md bg-black/[0.035] px-4 py-4">
      <p className="text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
        Deliver to
      </p>
      {name ? (
        <p className="mt-3 text-[15px] leading-snug text-foreground">{name}</p>
      ) : null}
      <div className="mt-3 space-y-1.5 text-[12px] leading-relaxed text-muted-foreground">
        {email ? <p className="break-all">{email}</p> : null}
        {phone ? <p>{phone}</p> : null}
        {address ? <p>{address}</p> : null}
        {city || country ? (
          <p>{[city, country].filter(Boolean).join(", ")}</p>
        ) : null}
      </div>
    </div>
  );
}

export function StoreReceipt({
  lines,
  shipping,
  total,
  payment,
  customer,
  notes,
  bankDetails,
  paymentProof,
  orderId,
  createdAt,
  onDownload,
}: {
  lines: { name: string; quantity: number; price: number; key: string }[];
  shipping: number;
  total: number;
  payment: PaymentMethod;
  customer?: Partial<CustomerInfo>;
  notes?: string;
  bankDetails?: BankDetails;
  paymentProof?: string | null;
  orderId?: string;
  createdAt?: string;
  onDownload?: () => void;
}) {
  const subtotal = total - shipping;
  const hasCustomer = Boolean(
    customer?.name?.trim() ||
      customer?.email?.trim() ||
      customer?.phone?.trim() ||
      customer?.address?.trim() ||
      customer?.city?.trim() ||
      customer?.country?.trim()
  );

  return (
    <div className="font-nav-display relative mx-auto w-full max-w-[340px] px-1 py-2 text-[13px] leading-relaxed text-foreground">
      {onDownload ? (
        <button
          type="button"
          onClick={onDownload}
          aria-label="Download receipt PDF"
          title="Download PDF"
          className="absolute top-1 right-0 z-10 inline-flex size-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
        >
          <Download className="size-4" />
        </button>
      ) : null}

      <div className="text-center">
        <ReceiptBrand />
        {orderId ? (
          <div className="mt-4 space-y-1 text-[11px] text-muted-foreground">
            <p>
              <span className="text-muted-foreground/75">Order</span>{" "}
              <span className="text-foreground">{orderId}</span>
            </p>
            {createdAt ? <p>{formatDate(createdAt)}</p> : null}
          </div>
        ) : (
          <p className="mt-3 text-[12px] tracking-wide text-muted-foreground">
            Receipt
          </p>
        )}
      </div>

      <Rule />

      {hasCustomer && customer ? <CustomerBlock customer={customer} /> : null}
      {hasCustomer ? <Rule /> : null}

      <div className="space-y-2.5">
        {lines.map((line) => (
          <div key={line.key} className="flex justify-between gap-3">
            <span className="min-w-0 flex-1 truncate text-muted-foreground">
              {line.name} × {line.quantity}
            </span>
            <span className="shrink-0 tabular-nums">
              {formatPrice(line.price * line.quantity)}
            </span>
          </div>
        ))}
      </div>

      <Rule />

      <div className="space-y-2">
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

      <Rule heavy />

      <div className="flex justify-between gap-2 text-[16px]">
        <span>Total</span>
        <span className="tabular-nums">{formatPrice(total)}</span>
      </div>

      {notes ? (
        <>
          <Rule />
          <p className="text-[12px] text-muted-foreground">Note: {notes}</p>
        </>
      ) : null}

      {payment === "bank" && bankDetails ? (
        <>
          <Rule />
          <div className="space-y-1 text-[12px]">
            <p className="text-muted-foreground">Bank transfer</p>
            <p>{bankDetails.bankName}</p>
            <p>{bankDetails.accountTitle}</p>
            <p className="break-all tracking-wide">{bankDetails.iban}</p>
          </div>
        </>
      ) : null}

      {paymentProof ? (
        <>
          <Rule />
          <p className="mb-2 text-[11px] tracking-wide text-muted-foreground">
            Payment proof
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={paymentProof}
            alt="Payment proof"
            className="max-h-40 w-full object-contain"
          />
        </>
      ) : null}

      <p className="mt-7 text-center text-[12px] text-muted-foreground">
        Thank you
      </p>
    </div>
  );
}

export function checkoutReceiptLines(lines: Line[]) {
  return lines.map(({ product, quantity }) => ({
    key: product.id,
    name: product.name,
    quantity,
    price: salePrice(product.price),
  }));
}
