"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { Check, ChevronLeft, Copy, Info, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { OrderTags } from "@/components/order-tags";
import { PhotoLightbox } from "@/components/photo-lightbox";
import { RefundFollowUp } from "@/components/storefront/refund-follow-up";
import { VoicePlayer, VoiceRecorder } from "@/components/voice-note";
import { formatDate, formatPrice } from "@/lib/format";
import { fileToDataUrl } from "@/lib/image-upload";
import {
  findOrdersByQuery,
  isDeliveredStatus,
  refundTicketForOrder,
} from "@/lib/orders";
import { useStore } from "@/lib/store";
import type { Order, RefundTicket } from "@/lib/types";
import { cn } from "cn";

const MAX_PHOTOS = 8;

function isDelivered(order: Order) {
  return isDeliveredStatus(order.status);
}

const TOPICS = [
  {
    title: "Returns",
    body: "Unopened, unused fabric can be returned within 7 days of delivery. The parcel must be sealed and in the same condition it arrived.",
  },
  {
    title: "Refunds",
    body: "Once we receive and check the return, refunds are issued to the original payment method within 5–7 working days.",
  },
  {
    title: "Exchanges",
    body: "Want a different suit? Contact us with your order details and we will arrange an exchange if stock is available.",
  },
  {
    title: "Sale items",
    body: "Sale pieces follow the same return window. Flat 50% off items are refundable if unused and returned on time.",
  },
];

function RefundInfo() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="Refund information"
          className="inline-flex size-8 items-center justify-center text-muted-foreground hover:text-foreground"
        >
          <Info className="size-4" strokeWidth={1.75} />
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto rounded-none sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Returns and refunds</DialogTitle>
          <DialogDescription>
            How returns, refunds, and exchanges work.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          {TOPICS.map((topic) => (
            <div key={topic.title}>
              <p className="text-sm">{topic.title}</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {topic.body}
              </p>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function RefundPanel() {
  const { orders, refundTickets, submitRefund, ready } = useStore();
  const photoRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [choosing, setChoosing] = useState(false);
  const [looked, setLooked] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [voiceNote, setVoiceNote] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [ticket, setTicket] = useState<RefundTicket | null>(null);
  const [copied, setCopied] = useState(false);
  const [photoIndex, setPhotoIndex] = useState<number | null>(null);

  const allMatches = useMemo(
    () => (submitted ? findOrdersByQuery(orders, submitted) : []),
    [orders, submitted]
  );
  const matches = useMemo(
    () => allMatches.filter(isDelivered),
    [allMatches]
  );
  const selected =
    matches.find((order) => order.id === selectedId) ??
    (!choosing && matches.length === 1 ? matches[0] : null);
  const existingTicket = selected
    ? refundTicketForOrder(refundTickets, selected.id)
    : undefined;
  const liveTicket = ticket
    ? refundTickets.find((entry) => entry.id === ticket.id) ?? ticket
    : null;
  const hasTicket = Boolean(existingTicket);
  const refunded = existingTicket?.status === "Completed";
  const lightboxPhotos = liveTicket?.photos.length
    ? liveTicket.photos
    : hasTicket && existingTicket?.photos.length
      ? existingTicket.photos
      : photos;

  function onSearch(event: FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    const ticketId = trimmed.toUpperCase().replace(/\s+/g, "");
    const foundTicket = refundTickets.find(
      (entry) => entry.id.toUpperCase().replace(/\s+/g, "") === ticketId
    );
    if (foundTicket) {
      setTicket(foundTicket);
      setSelectedId(null);
      setSubmitted("");
      setChoosing(false);
      setLooked(false);
      return;
    }

    setLooked(true);
    setSubmitted(trimmed);
    setSelectedId(null);
    setChoosing(false);
    setTicket(null);
    setPhotos([]);
    setVoiceNote(null);
    setNote("");
  }

  async function addPhotos(files: FileList | null) {
    if (!files?.length) return;
    const next: string[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      if (photos.length + next.length >= MAX_PHOTOS) break;
      next.push(await fileToDataUrl(file, 1200, 0.7));
    }
    if (!next.length) {
      toast.error("Choose image files");
      return;
    }
    setPhotos((current) => [...current, ...next].slice(0, MAX_PHOTOS));
    if (photoRef.current) photoRef.current.value = "";
  }

  async function copyTicket(id: string) {
    await navigator.clipboard.writeText(id);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  function onSubmit() {
    if (!selected) return;
    const result = submitRefund({
      order: selected,
      photos,
      voiceNote: voiceNote || undefined,
      note,
    });
    if (!result.ok || !result.ticket) {
      toast.error(result.error ?? "Could not submit");
      if (result.ticket) setTicket(result.ticket);
      return;
    }
    setTicket(result.ticket);
    toast.success("Refund ticket created");
  }

  if (!ready) return null;

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <div className="text-center">
        <div className="flex items-center justify-center gap-1">
          <p className="text-xs tracking-[0.22em] text-muted-foreground uppercase">
            Refund
          </p>
          <RefundInfo />
        </div>
        <h1
          className={cn(
            "mt-2 font-heading leading-tight tracking-tight",
          selected || liveTicket ? "text-2xl md:text-3xl" : "text-4xl md:text-6xl"
          )}
        >
          Returns and refunds.
        </h1>
        {!liveTicket ? (
          <form
            onSubmit={onSearch}
            className={cn(
              "mx-auto flex max-w-md flex-col gap-3 sm:flex-row sm:items-center",
              selected ? "mt-6" : "mt-10"
            )}
          >
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tracking ID or phone"
              aria-label="Tracking ID or phone number"
              autoComplete="tel"
              spellCheck={false}
              className="h-10 rounded-none text-center font-mono text-sm sm:text-left"
            />
            <Button type="submit" size="lg" className="rounded-none sm:h-10">
              Find
            </Button>
          </form>
        ) : null}
      </div>

      {liveTicket ? (
        <div className="mx-auto mt-14 max-w-md text-center">
          <p className="text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
            Refund ticket
          </p>
          <button
            type="button"
            onClick={() => copyTicket(liveTicket.id)}
            className="mt-3 inline-flex items-center gap-2 font-heading text-3xl tracking-tight"
            aria-label={`Copy ${liveTicket.id}`}
          >
            {liveTicket.id}
            {copied ? (
              <Check className="size-4" />
            ) : (
              <Copy className="size-4 text-muted-foreground" />
            )}
          </button>
          <p className="mt-2 text-sm text-muted-foreground">
            {formatDate(liveTicket.createdAt)} · {liveTicket.trackingId}
          </p>
          <div className="mt-3 flex justify-center">
            <OrderTags status="Delivered" refund={liveTicket.status} />
          </div>
          {liveTicket.status !== "Completed" ? (
            <>
              <p className="mt-6 text-sm">{liveTicket.customerName}</p>
              {liveTicket.note ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  {liveTicket.note}
                </p>
              ) : null}
              {liveTicket.photos.length ? (
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {liveTicket.photos.map((src, index) => (
                    <button
                      key={`${liveTicket.id}-${index}`}
                      type="button"
                      onClick={() => setPhotoIndex(index)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt={`Proof ${index + 1}`}
                        className="h-24 w-20 object-cover"
                      />
                    </button>
                  ))}
                </div>
              ) : null}
              {liveTicket.voiceNote ? (
                <VoicePlayer src={liveTicket.voiceNote} className="mt-4" />
              ) : null}
            </>
          ) : null}
          <RefundFollowUp ticket={liveTicket} align="center" />
          <button
            type="button"
            onClick={() => {
              setTicket(null);
              setSelectedId(null);
              setSubmitted("");
              setChoosing(false);
              setLooked(false);
              setQuery("");
              setPhotos([]);
              setVoiceNote(null);
              setNote("");
              setPhotoIndex(null);
            }}
            className="mt-8 text-sm text-muted-foreground hover:text-foreground"
          >
            New request
          </button>
        </div>
      ) : (
        <>
          {looked && !selected && matches.length === 0 ? (
            <p className="mt-14 text-center text-sm text-muted-foreground">
              {allMatches.length > 0
                ? "Only delivered orders can be refunded."
                : "No order found."}
            </p>
          ) : null}

          {matches.length > 1 && !selected ? (
            <div className="mt-16">
              <p className="border-b border-foreground/15 px-3 pb-3 text-sm text-muted-foreground">
                {matches.length} delivered{" "}
                {matches.length === 1 ? "order" : "orders"}. Select one.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground">
                      <th className="px-3 pb-3 pt-4 font-medium">Tracking</th>
                      <th className="px-3 pb-3 pt-4 font-medium">Items</th>
                      <th className="px-3 pb-3 pt-4 font-medium">Status</th>
                      <th className="px-3 pb-3 pt-4 text-right font-medium">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {matches.map((order) => (
                      <tr
                        key={order.id}
                        className="cursor-pointer transition-colors hover:bg-muted/50"
                        onClick={() => {
                          setSelectedId(order.id);
                          setChoosing(false);
                        }}
                      >
                        <td className="px-3 py-3 font-mono whitespace-nowrap">
                          {order.trackingId}
                        </td>
                        <td className="px-3 py-3 text-muted-foreground">
                          {order.items.map((item) => item.name).join(", ")}
                        </td>
                        <td className="px-3 py-3">
                          <OrderTags
                            status={order.status}
                            refund={
                              refundTicketForOrder(refundTickets, order.id)
                                ?.status
                            }
                          />
                        </td>
                        <td className="px-3 py-3 text-right whitespace-nowrap text-muted-foreground">
                          {formatDate(order.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {selected ? (
            <div className="relative mx-auto mt-14 max-w-md">
              <div className="absolute -top-1 left-0">
                <button
                  type="button"
                  onClick={() => {
                    setChoosing(true);
                    setSelectedId(null);
                    if (matches.length <= 1) {
                      setLooked(false);
                      setSubmitted("");
                    }
                  }}
                  aria-label="Change order"
                  className="-ml-2 inline-flex size-11 items-center justify-center"
                >
                  <ChevronLeft className="size-8" strokeWidth={1.75} />
                </button>
              </div>
              <div className="text-center">
                <p className="font-heading text-3xl tracking-tight">
                  {selected.trackingId}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {formatDate(selected.createdAt)} · {formatPrice(selected.total)}
                </p>
                <div className="mt-3 flex justify-center">
                  <OrderTags
                    status={selected.status}
                    refund={existingTicket?.status}
                  />
                </div>
              </div>
              {!refunded ? (
                <div className="mt-10">
                  {selected.items.map((item) => (
                    <div
                      key={`${item.productId}-${item.name}`}
                      className="flex items-baseline justify-between gap-6 py-2 text-sm"
                    >
                      <span>
                        {item.name} × {item.quantity}
                      </span>
                      <span className="text-muted-foreground">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}

              {hasTicket && existingTicket ? (
                <div className={refunded ? "mt-8 text-center" : "mt-8 text-left"}>
                  {!refunded ? (
                    <>
                      <button
                        type="button"
                        onClick={() => copyTicket(existingTicket.id)}
                        className="inline-flex items-center gap-1.5 font-heading text-xl tracking-tight"
                        aria-label={`Copy ${existingTicket.id}`}
                      >
                        {existingTicket.id}
                        {copied ? (
                          <Check className="size-3.5" />
                        ) : (
                          <Copy className="size-3.5 text-muted-foreground" />
                        )}
                      </button>
                      {existingTicket.photos.length ? (
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {existingTicket.photos.map((src, index) => (
                            <button
                              key={`${existingTicket.id}-${index}`}
                              type="button"
                              onClick={() => setPhotoIndex(index)}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={src}
                                alt={`Proof ${index + 1}`}
                                className="h-16 w-14 object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      ) : null}
                      {existingTicket.voiceNote ? (
                        <VoicePlayer
                          src={existingTicket.voiceNote}
                          className="mt-4"
                        />
                      ) : null}
                      {existingTicket.note ? (
                        <p className="mt-4 text-sm text-muted-foreground">
                          {existingTicket.note}
                        </p>
                      ) : null}
                    </>
                  ) : null}
                  <RefundFollowUp
                    ticket={existingTicket}
                    align={refunded ? "center" : "left"}
                  />
                </div>
              ) : (
                <>
              <div className="mt-8 border-t border-foreground/10 pt-4 text-left">
                <div className="flex items-baseline justify-between gap-4">
                  <p className="text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
                    Photos
                  </p>
                  <input
                    ref={photoRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(event) => addPhotos(event.target.files)}
                  />
                  <button
                    type="button"
                    onClick={() => photoRef.current?.click()}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    {photos.length ? "Add" : "Upload"}
                  </button>
                </div>
                {photos.length ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {photos.map((src, index) => (
                      <div
                        key={`${src.slice(-12)}-${index}`}
                        className="relative"
                      >
                        <button
                          type="button"
                          onClick={() => setPhotoIndex(index)}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={src}
                            alt={`Proof ${index + 1}`}
                            className="h-16 w-14 object-cover"
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setPhotos((current) =>
                              current.filter((_, i) => i !== index)
                            )
                          }
                          className="absolute top-0.5 right-0.5 bg-black/50 p-0.5 text-white"
                          aria-label="Remove photo"
                        >
                          <Trash2 className="size-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => photoRef.current?.click()}
                    className="mt-1.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Unused item photos
                  </button>
                )}
              </div>

              <div className="mt-3 border-t border-foreground/10 pt-3 text-left">
                <p className="mb-1.5 text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
                  Voice
                </p>
                <VoiceRecorder value={voiceNote} onChange={setVoiceNote} />
              </div>

              <div className="mt-3 border-t border-foreground/10 pt-3 text-left">
                <p className="text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
                  Note
                </p>
                <Textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Optional"
                  className="mt-1 min-h-10 rounded-none border-0 border-b border-foreground/15 px-0 text-sm shadow-none focus-visible:border-foreground/40 focus-visible:ring-0"
                />
              </div>

              <Button
                type="button"
                onClick={onSubmit}
                className="mt-5 h-9 rounded-none"
              >
                Submit refund
              </Button>
                </>
              )}
            </div>
          ) : null}
        </>
      )}
      {photoIndex != null && lightboxPhotos[photoIndex] ? (
        <PhotoLightbox
          photos={lightboxPhotos}
          index={photoIndex}
          onClose={() => setPhotoIndex(null)}
          onIndex={setPhotoIndex}
        />
      ) : null}
    </div>
  );
}
