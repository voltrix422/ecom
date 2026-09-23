"use client";

import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhotoLightbox } from "@/components/photo-lightbox";
import { formatDate } from "@/lib/format";
import { refundLabel } from "@/lib/orders";
import { useStore } from "@/lib/store";
import type { RefundTicket } from "@/lib/types";

const fieldClass =
  "h-8 rounded-none border-0 border-b border-foreground/15 px-0 text-sm shadow-none focus-visible:border-foreground/40 focus-visible:ring-0";

export function RefundFollowUp({
  ticket,
  align = "left",
}: {
  ticket: RefundTicket;
  align?: "left" | "center";
}) {
  const { submitRefundPayoutAccount } = useStore();
  const [bankName, setBankName] = useState(ticket.payoutAccount?.bankName ?? "");
  const [accountTitle, setAccountTitle] = useState(
    ticket.payoutAccount?.accountTitle ?? ""
  );
  const [iban, setIban] = useState(ticket.payoutAccount?.iban ?? "");
  const [proofOpen, setProofOpen] = useState(false);

  useEffect(() => {
    setBankName(ticket.payoutAccount?.bankName ?? "");
    setAccountTitle(ticket.payoutAccount?.accountTitle ?? "");
    setIban(ticket.payoutAccount?.iban ?? "");
  }, [
    ticket.id,
    ticket.payoutAccount?.bankName,
    ticket.payoutAccount?.accountTitle,
    ticket.payoutAccount?.iban,
  ]);

  const rejected = ticket.status === "Rejected";
  const canSendBank =
    Boolean(ticket.askBankDetails) &&
    !rejected &&
    !ticket.payoutAccount &&
    !ticket.payoutProof;

  async function onSend(event: FormEvent) {
    event.preventDefault();
    const result = await submitRefundPayoutAccount(ticket.id, {
      bankName,
      accountTitle,
      iban,
    });
    if (!result.ok) {
      toast.error(result.error ?? "Could not save");
      return;
    }
    toast.success("Bank details sent");
  }

  if (ticket.payoutProof) {
    return (
      <div className={align === "center" ? "mt-8" : "mt-8"}>
        <p className="text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
          Refund sent
        </p>
        <p className="mt-1.5 text-sm">
          {refundLabel(ticket.status)}
          {ticket.payoutProofAt ? ` · ${formatDate(ticket.payoutProofAt)}` : ""}
        </p>
        <button
          type="button"
          onClick={() => setProofOpen(true)}
          className="mt-3"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ticket.payoutProof}
            alt="Refund transfer"
            className="mx-auto max-h-36 w-auto object-contain"
          />
        </button>
        {proofOpen ? (
          <PhotoLightbox
            photos={[ticket.payoutProof]}
            index={0}
            onClose={() => setProofOpen(false)}
            onIndex={() => {}}
          />
        ) : null}
      </div>
    );
  }

  if (
    !ticket.remark &&
    !canSendBank &&
    !ticket.payoutAccount &&
    !ticket.skipBankWait
  ) {
    return null;
  }

  return (
    <div className={align === "center" ? "mt-8 text-left" : "mt-8"}>
      {ticket.remark ? (
        <div>
          <p className="text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
            Remark
          </p>
          <p className="mt-1.5 text-sm whitespace-pre-wrap">{ticket.remark}</p>
        </div>
      ) : null}

      {ticket.skipBankWait && !ticket.payoutProof && !rejected ? (
        <p className="mt-3 text-sm text-muted-foreground">
          We are sending the refund.
        </p>
      ) : null}

      {canSendBank ? (
        <form onSubmit={onSend} className="mt-6 space-y-3">
          <p className="text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
            Bank account for refund
          </p>
          <p className="text-sm text-muted-foreground">
            Send your account details so we can return the money.
          </p>
          <label className="block">
            <span className="text-[11px] text-muted-foreground">Bank</span>
            <Input
              value={bankName}
              onChange={(event) => setBankName(event.target.value)}
              className={fieldClass}
              required
            />
          </label>
          <label className="block">
            <span className="text-[11px] text-muted-foreground">
              Account title
            </span>
            <Input
              value={accountTitle}
              onChange={(event) => setAccountTitle(event.target.value)}
              className={fieldClass}
              required
            />
          </label>
          <label className="block">
            <span className="text-[11px] text-muted-foreground">IBAN</span>
            <Input
              value={iban}
              onChange={(event) => setIban(event.target.value)}
              className={`${fieldClass} font-mono`}
              required
            />
          </label>
          <Button type="submit" className="h-9 rounded-none">
            Send details
          </Button>
        </form>
      ) : null}

      {ticket.payoutAccount ? (
        <div className={ticket.remark || canSendBank ? "mt-6" : undefined}>
          <p className="text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
            Bank account for refund
          </p>
          <p className="mt-1.5 text-sm">{ticket.payoutAccount.bankName}</p>
          <p className="text-sm">{ticket.payoutAccount.accountTitle}</p>
          <p className="font-mono text-sm text-muted-foreground">
            {ticket.payoutAccount.iban}
          </p>
        </div>
      ) : null}

      {ticket.payoutAccount && !rejected ? (
        <p className="mt-3 text-sm text-muted-foreground">
          We will send the refund to this account.
        </p>
      ) : null}
    </div>
  );
}
