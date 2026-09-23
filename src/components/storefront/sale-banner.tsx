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
    <div className="overflow-hidden bg-black py-2.5 text-[10px] tracking-[0.18em] text-white uppercase sm:text-[11px]">
      <div className="flex w-max animate-sale-marquee">
        <NoticeRow />
        <NoticeRow />
      </div>
    </div>
  );
}
