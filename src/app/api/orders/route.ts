import { NextResponse } from "next/server";
import { isDatabaseEnabled } from "@/lib/server/db";
import { placeOrder } from "@/lib/server/documents";
import type { CustomerInfo, PaymentMethod } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isDatabaseEnabled()) {
    return NextResponse.json({ mode: "local" }, { status: 409 });
  }

  try {
    const body = (await request.json()) as {
      customer?: CustomerInfo;
      items?: { productId: string; quantity: number }[];
      paymentMethod?: PaymentMethod;
      notes?: string;
      paymentProof?: string;
    };
    if (!body.customer || !body.items?.length) {
      return NextResponse.json({ error: "Missing order details" }, { status: 400 });
    }
    const result = await placeOrder({
      customer: body.customer,
      items: body.items,
      paymentMethod: body.paymentMethod,
      notes: body.notes,
      paymentProof: body.paymentProof,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not place order";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
