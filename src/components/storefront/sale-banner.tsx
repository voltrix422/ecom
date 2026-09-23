const notices = [
  "Shop online at ayeshaswear.store",
  "Free delivery on orders over Rs 15,000",
  "Flat 50% off unstitched suits",
  "Track your order anytime",
];

function NoticeRow() {
  return (
    <div className="flex min-w-full shrink-0 items-center justify-around gap-16 px-10">
      {notices.map((notice) => (
        <span key={notice} className="whitespace-nowrap">
          {notice}
        </span>
      ))}
    </div>
  );
}

export function SaleBanner() {
  return (
    <div
      className="flex h-10 items-center overflow-hidden bg-black text-[13px] font-bold tracking-[0.02em] text-white uppercase sm:text-[15px]"
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif',
      }}
    >
      <div className="flex w-max animate-sale-marquee">
        <NoticeRow />
        <NoticeRow />
      </div>
    </div>
  );
}
