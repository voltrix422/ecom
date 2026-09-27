/** Event the header listens for so the bag is on screen when the ghost lands. */
export const REVEAL_HEADER_EVENT = "suitwear:reveal-header";

const GHOST_WIDTH = 96;
const GHOST_HEIGHT = 120;
const FLIGHT_MS = 860;

/**
 * Sends a small copy of the product image arcing up into the bag icon, so
 * adding to the bag is confirmed without taking over the page with the drawer.
 */
export function flyToCart(imageSrc: string, origin: DOMRect | null) {
  if (typeof window === "undefined" || !imageSrc || !origin) return;

  const target = document.querySelector<HTMLElement>("[data-cart-target]");
  if (!target) return;

  window.dispatchEvent(new Event(REVEAL_HEADER_EVENT));

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    pulse(target);
    return;
  }

  const dest = target.getBoundingClientRect();

  const startLeft = origin.left + origin.width / 2 - GHOST_WIDTH / 2;
  const startTop = origin.top + origin.height / 2 - GHOST_HEIGHT / 2;
  const dx = dest.left + dest.width / 2 - (startLeft + GHOST_WIDTH / 2);
  const dy = dest.top + dest.height / 2 - (startTop + GHOST_HEIGHT / 2);

  const ghost = document.createElement("img");
  ghost.src = imageSrc;
  ghost.alt = "";
  ghost.setAttribute("aria-hidden", "true");
  ghost.style.cssText = [
    "position:fixed",
    `left:${startLeft}px`,
    `top:${startTop}px`,
    `width:${GHOST_WIDTH}px`,
    `height:${GHOST_HEIGHT}px`,
    "object-fit:cover",
    "border-radius:14px",
    "z-index:80",
    "pointer-events:none",
    "box-shadow:0 22px 48px rgba(0,0,0,0.22)",
    "will-change:transform,opacity,filter",
  ].join(";");
  document.body.appendChild(ghost);

  const arc = Math.min(180, Math.abs(dy) * 0.5 + 90);
  const sway = dx >= 0 ? -18 : 18;

  const flight = ghost.animate(
    [
      {
        transform: "translate(0px, 0px) scale(1) rotate(0deg)",
        opacity: 1,
        filter: "blur(0px)",
      },
      {
        transform: `translate(${dx * 0.35}px, ${dy * 0.22 - arc}px) scale(0.72) rotate(${sway}deg)`,
        opacity: 1,
        filter: "blur(0px)",
        offset: 0.45,
      },
      {
        transform: `translate(${dx * 0.82}px, ${dy * 0.78 - arc * 0.15}px) scale(0.28) rotate(${sway * 0.4}deg)`,
        opacity: 0.85,
        filter: "blur(0.4px)",
        offset: 0.78,
      },
      {
        transform: `translate(${dx}px, ${dy}px) scale(0.08) rotate(0deg)`,
        opacity: 0.05,
        filter: "blur(1px)",
      },
    ],
    { duration: FLIGHT_MS, easing: "cubic-bezier(0.22, 0.8, 0.2, 1)" }
  );

  const cleanup = () => {
    ghost.remove();
    pulse(target);
  };
  flight.addEventListener("finish", cleanup, { once: true });
  flight.addEventListener("cancel", () => ghost.remove(), { once: true });
}

function pulse(target: HTMLElement) {
  target.animate(
    [
      { transform: "scale(1) rotate(0deg)" },
      { transform: "scale(1.45) rotate(-8deg)" },
      { transform: "scale(0.9) rotate(6deg)" },
      { transform: "scale(1.12) rotate(-2deg)" },
      { transform: "scale(1) rotate(0deg)" },
    ],
    { duration: 520, easing: "cubic-bezier(0.22, 1.2, 0.36, 1)" }
  );

  const badge = target.querySelector("span");
  if (badge) {
    badge.animate(
      [
        { transform: "scale(1)" },
        { transform: "scale(1.35)" },
        { transform: "scale(1)" },
      ],
      { duration: 420, easing: "ease-out", delay: 40 }
    );
  }

  const ring = document.createElement("span");
  ring.setAttribute("aria-hidden", "true");
  ring.style.cssText = [
    "position:absolute",
    "inset:-8px",
    "border-radius:9999px",
    "border:1.5px solid rgba(0,0,0,0.35)",
    "pointer-events:none",
    "z-index:1",
  ].join(";");
  const host = target.parentElement ?? target;
  const previous = getComputedStyle(host).position;
  if (previous === "static") host.style.position = "relative";
  host.appendChild(ring);
  const ringAnim = ring.animate(
    [
      { transform: "scale(0.6)", opacity: 0.7 },
      { transform: "scale(1.6)", opacity: 0 },
    ],
    { duration: 520, easing: "ease-out" }
  );
  ringAnim.addEventListener(
    "finish",
    () => {
      ring.remove();
      if (previous === "static") host.style.position = "";
    },
    { once: true }
  );
}
