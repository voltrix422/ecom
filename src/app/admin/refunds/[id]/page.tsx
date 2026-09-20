"use client";

import Link from "next/link";
import { use, useEffect, useRef, useState } from "react";
import { Check, ChevronLeft, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PhotoLightbox } from "@/components/photo-lightbox";
import { VoicePlayer } from "@/components/voice-note";
import { formatDate, formatPrice } from "@/lib/format";
import { fileToDataUrl } from "@/lib/image-upload";
import { useStore } from "@/lib/store";
import type { RefundStatus } from "@/lib/types";

const STATUSES: RefundStatus[] = [
  "Pending",
  "Approved",
  "Rejected",
  "Completed",
];

export default function AdminRefundDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const {
    refundTickets,
    orders,
    updateRefundStatus,
    updateRefundRemark,
    requestRefundBankDetails,
    attachRefundPayoutProof,
    skipRefundBankWait,
    canEdit,
  } = useStore();
  const [copied, setCopied] = useState(false);
  const [photoIndex, setPhotoIndex] = useState<number | null>(null);
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [remark, setRemark] = useState("");
  const proofRef = useRef<HTMLInputElement>(null);
  const ticket = refundTickets.find((entry) => entry.id === id);
  const order = ticket
    ? orders.find((entry) => entry.id === ticket.orderId)
    : undefined;
  const editable = canEdit();

  useEffect(() => {
    setRemark(ticket?.remark ?? "");
  }, [ticket?.remark]);

  if (!ticket) {
    return (
      <div className="max-w-md">
        <p className="text-sm text-muted-foreground">Ticket not found.</p>
        <Link
          href="/admin/refunds"
          aria-label="Back"
          className="mt-4 inline-flex size-11 items-center justify-center"
        >
          <ChevronLeft className="size-8" strokeWidth={1.75} />
        </Link>
      </div>
    );
  }

  async function copyId() {
    await navigator.clipboard.writeText(ticket.id);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  function saveRemark() {
    if (!editable) return;
    updateRefundRemark(ticket.id, remark);
    toast.success("Remark updated");
  }

  function askForBank() {
    if (!editable) return;
    requestRefundBankDetails(ticket.id, remark);
    toast.success("Asked for bank details");
  }

  async function addPayoutProof(files: FileList | null) {
    const file = files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Choose an image");
      return;
    }
    const src = await fileToDataUrl(file, 1400, 0.75);
    attachRefundPayoutProof(ticket.id, src);
    toast.success("Refund screenshot attached");
    if (proofRef.current) proofRef.current.value = "";
  }

  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/refunds"
        aria-label="Back"
        className="-ml-2 inline-flex size-11 items-center justify-center"
      >
        <ChevronLeft className="size-8" strokeWidth={1.75} />
      </Link>

      <button
        type="button"
        onClick={copyId}
        className="inline-flex items-center gap-2 font-heading text-2xl tracking-tight"
        aria-label={`Copy ${ticket.id}`}
      >
        {ticket.id}
        {copied ? (
          <Check className="size-4" />
        ) : (
          <Copy className="size-4 text-muted-foreground" />
        )}
      </button>
      <p className="mt-1 font-mono text-sm text-muted-foreground">
        {ticket.trackingId}
        {order ? ` · ${formatPrice(order.total)}` : ""}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {formatDate(ticket.createdAt)}
      </p>

      <div className="mt-3">
        {editable ? (
          <Select
            value={ticket.status}
            onValueChange={(value) =>
              updateRefundStatus(ticket.id, value as RefundStatus)
            }
          >
            <SelectTrigger className="h-8 w-auto rounded-none border-0 bg-transparent px-0 shadow-none focus-visible:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <p className="text-sm">{ticket.status}</p>
        )}
      </div>

      <div className="mt-8 space-y-1 text-sm">
        <p>{ticket.customerName}</p>
        {ticket.customerPhone ? (
          <p className="text-muted-foreground">{ticket.customerPhone}</p>
        ) : null}
        <p className="text-muted-foreground">{ticket.customerEmail}</p>
      </div>

      {order ? (
        <div className="mt-6 text-sm">
          {order.items.map((item) => (
            <p key={`${item.productId}-${item.name}`}>
              {item.name} × {item.quantity}
            </p>
          ))}
        </div>
      ) : null}

      {ticket.note ? (
        <p className="mt-6 text-sm text-muted-foreground">{ticket.note}</p>
      ) : null}

      {ticket.photos.length ? (
        <div className="mt-8 flex flex-wrap gap-2">
          {ticket.photos.map((src, index) => (
            <button
              key={`${ticket.id}-${index}`}
              type="button"
              onClick={() => setPhotoIndex(index)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`Proof ${index + 1}`}
                className="h-28 w-24 object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}

      {ticket.voiceNote ? (
        <VoicePlayer src={ticket.voiceNote} className="mt-6 max-w-md" />
      ) : null}

      <div className="mt-10 max-w-md">
        <p className="text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
          Remark
        </p>
        <Textarea
          value={remark}
          onChange={(event) => setRemark(event.target.value)}
          placeholder="Leave a note for the customer"
          disabled={!editable}
          className="mt-1 min-h-16 rounded-none border-0 border-b border-foreground/15 px-0 text-sm shadow-none focus-visible:border-foreground/40 focus-visible:ring-0"
        />
        {editable ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={saveRemark}
              className="h-8 rounded-none"
            >
              Update
            </Button>
            {!ticket.askBankDetails &&
            !ticket.payoutAccount &&
            !ticket.payoutProof &&
            ticket.status !== "Rejected" ? (
              <Button
                type="button"
                variant="outline"
                onClick={askForBank}
                className="h-8 rounded-none"
              >
                Ask for bank details
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="mt-8 max-w-md">
        <p className="text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
          Bank account for refund
        </p>
        {ticket.payoutAccount ? (
          <div className="mt-2 text-sm">
            <p>{ticket.payoutAccount.bankName}</p>
            <p>{ticket.payoutAccount.accountTitle}</p>
            <p className="font-mono text-muted-foreground">
              {ticket.payoutAccount.iban}
            </p>
          </div>
        ) : ticket.payoutProof ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Paid without waiting for account details.
          </p>
        ) : ticket.skipBankWait ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Skipped wait. Attach the payout screenshot after sending the money.
          </p>
        ) : ticket.askBankDetails ? (
          <>
            <p className="mt-2 text-sm text-muted-foreground">
              Waiting for the customer to send account details.
            </p>
            {editable && ticket.status !== "Rejected" ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => skipRefundBankWait(ticket.id)}
                className="mt-3 h-8 rounded-none"
              >
                Skip wait and pay
              </Button>
            ) : null}
          </>
        ) : (
          editable && ticket.status !== "Rejected" ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => skipRefundBankWait(ticket.id)}
              className="mt-3 h-8 rounded-none"
            >
              Skip wait and pay
            </Button>
          ) : null
        )}
      </div>

      {ticket.payoutAccount || ticket.skipBankWait || ticket.payoutProof ? (
        <div className="mt-8 max-w-md">
          <div className="flex items-baseline justify-between gap-4">
            <p className="text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
              Payout screenshot
            </p>
            {editable && ticket.status !== "Rejected" ? (
              <>
                <input
                  ref={proofRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => addPayoutProof(event.target.files)}
                />
                <button
                  type="button"
                  onClick={() => proofRef.current?.click()}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  {ticket.payoutProof ? "Replace" : "Attach"}
                </button>
              </>
            ) : null}
          </div>
          {ticket.payoutProof ? (
            <>
              <button
                type="button"
                onClick={() => setPayoutOpen(true)}
                className="mt-2"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={ticket.payoutProof}
                  alt="Refund transfer"
                  className="max-h-36 w-auto object-contain"
                />
              </button>
              {ticket.payoutProofAt ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  {formatDate(ticket.payoutProofAt)} · Completed
                </p>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">Completed</p>
              )}
            </>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              After sending the money, attach the transfer screenshot.
            </p>
          )}
        </div>
      ) : null}

      {photoIndex != null && ticket.photos[photoIndex] ? (
        <PhotoLightbox
          photos={ticket.photos}
          index={photoIndex}
          onClose={() => setPhotoIndex(null)}
          onIndex={setPhotoIndex}
        />
      ) : null}
      {payoutOpen && ticket.payoutProof ? (
        <PhotoLightbox
          photos={[ticket.payoutProof]}
          index={0}
          onClose={() => setPayoutOpen(false)}
          onIndex={() => {}}
        />
      ) : null}
    </div>
  );
}
