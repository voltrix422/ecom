import type {
  AdminUser,
  BankDetails,
  HeroBanner,
  Order,
  Product,
  RefundTicket,
} from "@/lib/types";

export type RemoteAdminState = {
  user: AdminUser;
  users: AdminUser[];
  orders: Order[];
  refunds: RefundTicket[];
  products: Product[];
  categories: string[];
  bank: BankDetails;
  heroes: HeroBanner[];
};

let remote = false;

export function setRemoteMode(enabled: boolean) {
  remote = enabled;
}

export function isRemoteMode() {
  return remote;
}

async function readError(response: Response) {
  const data = (await response.json().catch(() => ({}))) as { error?: string };
  return data.error || "Could not reach the server";
}

export async function adminMutate(body: Record<string, unknown>) {
  const response = await fetch("/api/admin/mutate", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(await readError(response));
  return (await response.json()) as RemoteAdminState;
}
