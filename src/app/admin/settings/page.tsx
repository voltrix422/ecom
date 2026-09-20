"use client";

import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { useStore } from "@/lib/store";

const fieldClass =
  "h-8 rounded-none border-0 border-b border-foreground/15 px-0 shadow-none focus-visible:border-foreground/40 focus-visible:ring-0";

export default function AdminSettingsPage() {
  const { bankDetails, updateBankDetails, canAccess, canEdit } = useStore();
  const [bankName, setBankName] = useState(bankDetails.bankName);
  const [accountTitle, setAccountTitle] = useState(bankDetails.accountTitle);
  const [iban, setIban] = useState(bankDetails.iban);

  useEffect(() => {
    setBankName(bankDetails.bankName);
    setAccountTitle(bankDetails.accountTitle);
    setIban(bankDetails.iban);
  }, [bankDetails]);

  if (!canAccess("settings")) {
    return (
      <p className="text-sm text-muted-foreground">
        You do not have permission to view settings.
      </p>
    );
  }

  const editable = canEdit();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editable) return;
    if (!bankName.trim() || !accountTitle.trim() || !iban.trim()) {
      toast.error("Fill in all bank fields");
      return;
    }
    updateBankDetails({ bankName, accountTitle, iban });
    toast.success("Bank details saved");
  }

  return (
    <div className="max-w-xl">
      <div className="relative overflow-hidden bg-muted/35 px-5 py-6">
        <div className="pointer-events-none absolute -top-10 -right-8 size-28 rounded-full bg-foreground/[0.03]" />
        <p className="text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
          Bank transfer
        </p>
        <p className="mt-4 font-heading text-3xl tracking-tight">
          {bankDetails.bankName || "Bank"}
        </p>
        <p className="mt-2 text-sm">{bankDetails.accountTitle}</p>
        <p className="mt-1 font-mono text-sm text-muted-foreground">
          {bankDetails.iban}
        </p>
      </div>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <label className="block">
          <span className="text-[11px] text-muted-foreground">Bank</span>
          <Input
            id="bankName"
            value={bankName}
            onChange={(event) => setBankName(event.target.value)}
            disabled={!editable}
            className={fieldClass}
            required
          />
        </label>
        <label className="block">
          <span className="text-[11px] text-muted-foreground">Account title</span>
          <Input
            id="accountTitle"
            value={accountTitle}
            onChange={(event) => setAccountTitle(event.target.value)}
            disabled={!editable}
            className={fieldClass}
            required
          />
        </label>
        <label className="block">
          <span className="text-[11px] text-muted-foreground">IBAN</span>
          <Input
            id="iban"
            value={iban}
            onChange={(event) => setIban(event.target.value)}
            disabled={!editable}
            className={`${fieldClass} font-mono text-sm`}
            required
          />
        </label>
        {editable ? (
          <button type="submit" className="mt-2 text-sm">
            Save
          </button>
        ) : null}
      </form>
    </div>
  );
}
