/** Event the header listens for so the bag is on screen when the ghost lands. */
export const REVEAL_HEADER_EVENT = "suitwear:reveal-header";

const GHOST_WIDTH = 108;
const GHOST_HEIGHT = 135;
const FLIGHT_MS = 720;

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

  // The header slides out of view on scroll, so undo its current translate to
  // aim at where the bag will be once the reveal above has settled.
  let headerOffsetY = 0;
  const header = target.closest("header");
  if (header) {
    const transform = getComputedStyle(header).transform;
    if (transform && transform !== "none") {
      try {
        headerOffsetY = new DOMMatrixReadOnly(transform).m42;
      } catch {
        headerOffsetY = 0;
      }
    }
  }

  const startLeft = origin.left + origin.width / 2 - GHOST_WIDTH / 2;
  const startTop = origin.top + origin.height / 2 - GHOST_HEIGHT / 2;
  const dx = dest.left + dest.width / 2 - (startLeft + GHOST_WIDTH / 2);
  const dy =
    dest.top + dest.height / 2 - headerOffsetY - (startTop + GHOST_HEIGHT / 2);

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
    "z-index:60",
    "pointer-events:none",
    "box-shadow:0 18px 40px rgba(0,0,0,0.18)",
    "will-change:transform,opacity",
  ].join(";");
  document.body.appendChild(ghost);

  // lift on the way across so it reads as a toss rather than a slide
  const arc = Math.min(150, Math.abs(dy) * 0.45 + 70);

  const flight = ghost.animate(
    [
      { transform: "translate(0px, 0px) scale(1) rotate(0deg)", opacity: 1 },
      {
        transform: `translate(${dx * 0.55}px, ${dy * 0.4 - arc}px) scale(0.52) rotate(-6deg)`,
        opacity: 0.95,
        offset: 0.6,
      },
      {
        transform: `translate(${dx}px, ${dy}px) scale(0.1) rotate(-10deg)`,
        opacity: 0.15,
      },
    ],
    { duration: FLIGHT_MS, easing: "cubic-bezier(0.5, 0, 0.35, 1)" }
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
      { transform: "scale(1)" },
      { transform: "scale(1.3)" },
      { transform: "scale(0.94)" },
      { transform: "scale(1)" },
    ],
    { duration: 380, easing: "ease-out" }
  );
}
