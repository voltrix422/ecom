import { jsPDF, GState } from "jspdf";
import { brand } from "@/lib/data";
import { formatDate, formatPrice } from "@/lib/format";
import type { BankDetails, Order } from "@/lib/types";

const RECEIPT_WIDTH = 80;

/** Lockup artwork aspect after trim (w/h) */
const LOCKUP_RATIO = 384 / 446;

async function loadLogoDataUrl() {
  const response = await fetch(brand.lockup);
  const blob = await response.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not load logo"));
    reader.readAsDataURL(blob);
  });
}

export async function downloadOrderReceiptPdf(
  order: Order,
  bankDetails?: BankDetails
) {
  const logoDataUrl = await loadLogoDataUrl().catch(() => null);

  const doc = new jsPDF({
    unit: "mm",
    format: "a4",
    orientation: "portrait",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const left = (pageWidth - RECEIPT_WIDTH) / 2;
  const right = left + RECEIPT_WIDTH;
  const contentWidth = RECEIPT_WIDTH - 8;
  const margin = left + 4;
  let y = 24;

  const drawWatermark = () => {
    doc.saveGraphicsState();
    doc.setGState(new GState({ opacity: 0.07 }));
    doc.setTextColor(20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(72);
    doc.text(brand.name, pageWidth / 2, pageHeight / 2, {
      align: "center",
      baseline: "middle",
      angle: 32,
    });
    doc.restoreGraphicsState();
  };

  drawWatermark();

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - 20) {
      doc.addPage("a4", "portrait");
      drawWatermark();
      y = 28;
    }
  };

  const center = (
    text: string,
    size: number,
    style: "normal" | "bold" = "normal"
  ) => {
    doc.setFont("courier", style);
    doc.setFontSize(size);
    doc.text(text, pageWidth / 2, y, { align: "center" });
  };

  const rule = () => {
    ensureSpace(5);
    doc.setDrawColor(180);
    doc.setLineDashPattern([1, 1], 0);
    doc.line(margin, y, right - 4, y);
    doc.setLineDashPattern([], 0);
    y += 5;
  };

  const row = (leftText: string, rightText: string, muted = false) => {
    ensureSpace(6);
    doc.setFont("courier", "normal");
    doc.setFontSize(9);
    doc.setTextColor(muted ? 100 : 20);
    const leftLines = doc.splitTextToSize(
      leftText,
      contentWidth * 0.62
    ) as string[];
    doc.text(leftLines[0] ?? leftText, margin, y);
    doc.setTextColor(20);
    doc.text(rightText, right - 4, y, { align: "right" });
    y += Math.max(5, leftLines.length * 4);
  };

  const mutedLine = (text: string) => {
    if (!text) return;
    ensureSpace(5);
    doc.setFont("courier", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(100);
    const lines = doc.splitTextToSize(text, contentWidth) as string[];
    doc.text(lines, margin, y);
    y += lines.length * 4;
  };

  if (logoDataUrl) {
    // The lockup already contains the brand name curved above the mark, so no
    // separate wordmark is drawn below it.
    const logoHeight = 24;
    const logoWidth = logoHeight * LOCKUP_RATIO;
    doc.addImage(
      logoDataUrl,
      "PNG",
      (pageWidth - logoWidth) / 2,
      y,
      logoWidth,
      logoHeight
    );
    y += logoHeight + 6;
  }

  doc.setTextColor(120);
  center("RECEIPT", 8);
  y += 7;

  doc.setFont("courier", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(120);
  doc.text("Order", pageWidth / 2, y, { align: "center" });
  y += 4;
  doc.setTextColor(20);
  doc.setFontSize(8.5);
  doc.text(order.id, pageWidth / 2, y, { align: "center" });
  y += 5;
  doc.setTextColor(120);
  doc.setFontSize(7.5);
  doc.text("Tracking ID", pageWidth / 2, y, { align: "center" });
  y += 4;
  doc.setTextColor(20);
  doc.setFontSize(8.5);
  doc.text(order.trackingId, pageWidth / 2, y, { align: "center" });
  y += 5;
  doc.setTextColor(120);
  doc.setFontSize(7.5);
  center(formatDate(order.createdAt), 7.5);
  y += 7;
  doc.setTextColor(20);

  rule();

  doc.setFont("courier", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(20);
  ensureSpace(5);
  doc.text(order.customer.name, margin, y);
  y += 5;
  mutedLine(order.customer.phone || "");
  mutedLine(order.customer.email);
  mutedLine(`${order.customer.address}, ${order.customer.city}`);
  mutedLine(order.customer.country);
  y += 3;

  rule();

  for (const item of order.items) {
    row(
      `${item.name} × ${item.quantity}`,
      formatPrice(item.price * item.quantity),
      true
    );
  }

  rule();

  const subtotal = order.total - (order.shipping || 0);
  row("Subtotal", formatPrice(subtotal), true);
  row(
    "Shipping",
    order.shipping === 0 ? "Free" : formatPrice(order.shipping),
    true
  );
  row("Payment", order.paymentMethod === "bank" ? "Bank" : "COD", true);

  ensureSpace(3);
  doc.setDrawColor(40);
  doc.setLineWidth(0.35);
  doc.line(margin, y, right - 4, y);
  y += 6;

  doc.setFont("courier", "bold");
  doc.setFontSize(11);
  doc.setTextColor(20);
  doc.text("Total", margin, y);
  doc.text(formatPrice(order.total), right - 4, y, { align: "right" });
  y += 8;

  if (order.notes) {
    rule();
    mutedLine(`Note: ${order.notes}`);
    y += 2;
  }

  if (order.paymentMethod === "bank" && bankDetails) {
    rule();
    mutedLine("Bank transfer");
    mutedLine(bankDetails.bankName);
    mutedLine(bankDetails.accountTitle);
    mutedLine(bankDetails.iban);
    y += 2;
  }

  y += 8;
  doc.setTextColor(120);
  center("Thank you", 8);

  if (order.paymentProof) {
    doc.addPage("a4", "portrait");
    drawWatermark();
    y = 28;

    doc.setTextColor(120);
    center("Payment proof", 10);
    y += 10;

    try {
      const format = order.paymentProof.startsWith("data:image/jpeg")
        ? "JPEG"
        : "PNG";
      const props = doc.getImageProperties(order.paymentProof);
      const maxW = pageWidth - 40;
      const maxH = pageHeight - y - 24;
      const ratio = props.width / props.height;
      let drawW = maxW;
      let drawH = drawW / ratio;
      if (drawH > maxH) {
        drawH = maxH;
        drawW = drawH * ratio;
      }
      const imageLeft = (pageWidth - drawW) / 2;
      doc.addImage(order.paymentProof, format, imageLeft, y, drawW, drawH);
    } catch {
      mutedLine("Proof attached (preview unavailable in PDF)");
    }
  }

  doc.save(`${order.id}-receipt.pdf`);
}
