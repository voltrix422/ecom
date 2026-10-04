"use client";

import Image from "next/image";
import { Download } from "lucide-react";
import { brand } from "@/lib/data";
import { formatDate, formatPrice } from "@/lib/format";
import { cn } from "cn";
import type {
  BankDetails,
  CustomerInfo,
  PaymentMethod,
  Product,
} from "@/lib/types";

type Line = { product: Product; quantity: number };

function Rule({
  heavy = false,
  compact = false,
}: {
  heavy?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "border-t",
        compact ? "my-1" : "my-4",
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
        width={220}
        height={48}
        className="h-9 w-auto object-contain brightness-0 md:h-10"
        priority
        unoptimized
      />
    </div>
  );
}

function CustomerBlock({
  customer,
  compact = false,
}: {
  customer: Partial<CustomerInfo>;
  compact?: boolean;
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

  if (compact) {
    return (
      <div className="rounded-md bg-black/[0.035] px-2 py-1.5">
        {name ? (
          <p className="text-[12px] leading-tight text-foreground">{name}</p>
        ) : null}
        <p className="mt-0.5 line-clamp-1 text-[10px] leading-snug text-muted-foreground">
          {[phone, email, address, [city, country].filter(Boolean).join(", ")]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md bg-black/[0.035] px-4 py-4">
      <p className="text-[11px] text-muted-foreground">Deliver to</p>
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
  orderId,
  createdAt,
  onDownload,
  compact = false,
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
  compact?: boolean;
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
    <div
      className={cn(
        "relative mx-auto w-full max-w-[340px] text-foreground normal-case",
        compact
          ? "px-0.5 py-0 text-[11px] leading-tight"
          : "px-1 py-2 text-[13px] leading-relaxed"
      )}
    >
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
        {compact ? (
          <Image
            src={brand.wordmark}
            alt={brand.name}
            width={120}
            height={28}
            className="mx-auto h-5 w-auto object-contain brightness-0"
            unoptimized
          />
        ) : (
          <ReceiptBrand />
        )}
        {orderId ? (
          <div
            className={cn(
              "space-y-0.5 text-[11px] text-muted-foreground",
              compact ? "mt-1.5" : "mt-4"
            )}
          >
            <p>
              <span className="text-muted-foreground/75">Order</span>{" "}
              <span className="text-foreground">{orderId}</span>
            </p>
            {createdAt ? <p>{formatDate(createdAt)}</p> : null}
          </div>
        ) : compact ? null : (
          <p className="mt-3 text-[12px] text-muted-foreground">Receipt</p>
        )}
      </div>

      <Rule compact={compact} />

      {hasCustomer && customer ? (
        <CustomerBlock customer={customer} compact={compact} />
      ) : null}
      {hasCustomer ? <Rule compact={compact} /> : null}

      <div className={cn(compact ? "space-y-1" : "space-y-2.5")}>
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

      <Rule compact={compact} />

      <div className={cn(compact ? "space-y-0.5" : "space-y-2")}>
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

      <Rule heavy compact={compact} />

      <div
        className={cn(
          "flex justify-between gap-2",
          compact ? "text-[15px]" : "text-[16px]"
        )}
      >
        <span>Total</span>
        <span className="tabular-nums">{formatPrice(total)}</span>
      </div>

      {notes && !compact ? (
        <>
          <Rule />
          <p className="text-[12px] text-muted-foreground">Note: {notes}</p>
        </>
      ) : null}

      {notes && compact ? (
        <p className="mt-1 truncate text-[11px] text-muted-foreground">
          Note: {notes}
        </p>
      ) : null}

      {payment === "bank" && bankDetails && !compact ? (
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

      {!compact ? (
        <p className="mt-7 text-center text-[12px] text-muted-foreground">
          Thank you
        </p>
      ) : null}
    </div>
  );
}

export function checkoutReceiptLines(lines: Line[]) {
  return lines.map(({ product, quantity }) => ({
    key: product.id,
    name: product.name,
    quantity,
    price: product.price,
  }));
}
