export const META_PIXEL_ID = "1062000513496408";

type FbqArgs = [string, ...unknown[]];

declare global {
  interface Window {
    fbq?: ((...args: FbqArgs) => void) & {
      callMethod?: (...args: FbqArgs) => void;
      queue?: FbqArgs[];
      push?: (...args: FbqArgs) => void;
      loaded?: boolean;
      version?: string;
    };
    _fbq?: Window["fbq"];
  }
}

export type MetaContentPayload = {
  content_ids: string[];
  content_name?: string;
  content_type?: string;
  num_items?: number;
  value?: number;
  currency?: string;
};

export function metaTrack(
  event: string,
  params?: MetaContentPayload | Record<string, unknown>
) {
  if (typeof window === "undefined") return;
  if (typeof window.fbq !== "function") return;
  if (params) window.fbq("track", event, params);
  else window.fbq("track", event);
}

export function metaPageView() {
  metaTrack("PageView");
}

export function metaViewContent(input: {
  id: string;
  name: string;
  value: number;
}) {
  metaTrack("ViewContent", {
    content_ids: [input.id],
    content_name: input.name,
    content_type: "product",
    value: input.value,
    currency: "PKR",
  });
}

export function metaAddToCart(input: {
  id: string;
  name?: string;
  value: number;
  quantity?: number;
}) {
  metaTrack("AddToCart", {
    content_ids: [input.id],
    content_name: input.name,
    content_type: "product",
    num_items: input.quantity ?? 1,
    value: input.value,
    currency: "PKR",
  });
}

export function metaInitiateCheckout(input: {
  ids: string[];
  numItems: number;
  value: number;
}) {
  metaTrack("InitiateCheckout", {
    content_ids: input.ids,
    content_type: "product",
    num_items: input.numItems,
    value: input.value,
    currency: "PKR",
  });
}

export function metaPurchase(input: {
  ids: string[];
  numItems: number;
  value: number;
}) {
  metaTrack("Purchase", {
    content_ids: input.ids,
    content_type: "product",
    num_items: input.numItems,
    value: input.value,
    currency: "PKR",
  });
}
