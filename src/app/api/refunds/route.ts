import { NextResponse } from "next/server";
import { isDatabaseEnabled } from "@/lib/server/db";
import { saveRefundPayoutAccount, submitRefund } from "@/lib/server/documents";
import type { BankDetails } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isDatabaseEnabled()) {
    return NextResponse.json({ mode: "local" }, { status: 409 });
  }
  try {
    const body = await request.json();
    const result = await submitRefund({
      orderId: String(body.orderId || ""),
      trackingId: String(body.trackingId || ""),
      photos: Array.isArray(body.photos) ? body.photos.map(String) : [],
      voiceNote: body.voiceNote ? String(body.voiceNote) : undefined,
      note: body.note ? String(body.note) : undefined,
    });
    return NextResponse.json(result, { status: result.ok ? 200 : 409 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save refund";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  if (!isDatabaseEnabled()) {
    return NextResponse.json({ mode: "local" }, { status: 409 });
  }
  try {
    const body = await request.json();
    const ticket = await saveRefundPayoutAccount(
      String(body.id || ""),
      body.account as BankDetails
    );
    return NextResponse.json({ ticket });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save bank details";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
