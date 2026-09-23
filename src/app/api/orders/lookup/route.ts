import { NextResponse } from "next/server";
import { isDatabaseEnabled } from "@/lib/server/db";
import { lookupOrders } from "@/lib/server/documents";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isDatabaseEnabled()) {
    return NextResponse.json({ mode: "local", orders: [], refunds: [] });
  }
  const query = new URL(request.url).searchParams.get("q") || "";
  try {
    const result = await lookupOrders(query);
    return NextResponse.json({ mode: "remote", ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lookup failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
