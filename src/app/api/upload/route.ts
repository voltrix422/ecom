import { NextResponse } from "next/server";
import { isDatabaseEnabled } from "@/lib/server/db";
import { saveUpload } from "@/lib/server/files";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isDatabaseEnabled()) {
    return NextResponse.json({ mode: "local" });
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Choose a file" }, { status: 400 });
    }
    const saved = await saveUpload(file);
    return NextResponse.json({ url: saved.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
