import type { PoolClient } from "pg";
import { resolveModules, seedAdminUsers, seedBankDetails } from "@/lib/admin";
import {
  categories as seedCategories,
  seedProducts,
} from "@/lib/data";
import { salePrice } from "@/lib/format";
import { isDeliveredStatus, findOrdersByQuery } from "@/lib/orders";
import type {
  AdminUser,
  BankDetails,
  HeroBanner,
  Order,
  OrderStatus,
  PaymentMethod,
  Product,
  RefundTicket,
} from "@/lib/types";
import { withClient } from "@/lib/server/db";
import { hashPassword, verifyPassword } from "@/lib/server/password";

export type Docs = {
  products: Product[];
  orders: Order[];
  categories: string[];
  bank: BankDetails;
  users: AdminUser[];
  refunds: RefundTicket[];
  heroes: HeroBanner[];
};

const KEYS = [
  "products",
  "orders",
  "categories",
  "bank",
  "users",
  "refunds",
  "heroes",
] as const;

type DocKey = (typeof KEYS)[number];

let ready: Promise<void> | null = null;

function seedUsers(): AdminUser[] {
  const email = (process.env.ADMIN_EMAIL || "admin@suitwear.store")
    .trim()
    .toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "admin";
  return seedAdminUsers.map((user, index) => {
    const next = index === 0 ? { ...user, email, password } : user;
    return { ...next, password: hashPassword(next.password) };
  });
}

function seedDocs(): Docs {
  return {
    products: seedProducts,
    orders: [],
    categories: [...seedCategories],
    bank: seedBankDetails,
    users: seedUsers(),
    refunds: [],
    heroes: [],
  };
}

export function ensureDatabase() {
  if (!ready) ready = migrate();
  return ready;
}

async function migrate() {
  await withClient(async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS app_documents (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    const seed = seedDocs();
    for (const key of KEYS) {
      await client.query(
        `INSERT INTO app_documents (key, value)
         VALUES ($1, $2::jsonb)
         ON CONFLICT (key) DO NOTHING`,
        [key, JSON.stringify(seed[key])]
      );
    }
    await removeSampleData(client);
  });
}

const SAMPLE_ORDER_IDS = new Set([
  "ORD-1048",
  "ORD-1047",
  "ORD-1046",
  "ORD-1045",
]);
const SAMPLE_HERO_IDS = new Set(["hero-seed-rose", "hero-seed-yellow"]);

async function removeSampleData(client: PoolClient) {
  const orders = await client.query<{ value: Order[] }>(
    `SELECT value FROM app_documents WHERE key = 'orders'`
  );
  const currentOrders = orders.rows[0]?.value ?? [];
  const nextOrders = currentOrders.filter(
    (order) => !SAMPLE_ORDER_IDS.has(order.id)
  );
  if (nextOrders.length !== currentOrders.length) {
    await client.query(
      `UPDATE app_documents SET value = $1::jsonb, updated_at = NOW() WHERE key = 'orders'`,
      [JSON.stringify(nextOrders)]
    );
  }

  const heroes = await client.query<{ value: HeroBanner[] }>(
    `SELECT value FROM app_documents WHERE key = 'heroes'`
  );
  const currentHeroes = heroes.rows[0]?.value ?? [];
  const nextHeroes = currentHeroes.filter(
    (banner) => !SAMPLE_HERO_IDS.has(banner.id)
  );
  if (nextHeroes.length !== currentHeroes.length) {
    await client.query(
      `UPDATE app_documents SET value = $1::jsonb, updated_at = NOW() WHERE key = 'heroes'`,
      [JSON.stringify(nextHeroes)]
    );
  }
}

async function readDocs(client: PoolClient): Promise<Docs> {
  const result = await client.query<{ key: string; value: unknown }>(
    `SELECT key, value FROM app_documents WHERE key = ANY($1::text[]) FOR UPDATE`,
    [KEYS]
  );
  const found = new Map(result.rows.map((row) => [row.key, row.value]));
  const seed = seedDocs();
  const docs = {} as Docs;
  docs.products = (found.get("products") as Product[]) ?? seed.products;
  docs.orders = (found.get("orders") as Order[]) ?? seed.orders;
  docs.categories = (found.get("categories") as string[]) ?? seed.categories;
  docs.bank = (found.get("bank") as BankDetails) ?? seed.bank;
  docs.users = (found.get("users") as AdminUser[]) ?? seed.users;
  docs.refunds = (found.get("refunds") as RefundTicket[]) ?? seed.refunds;
  docs.heroes = (found.get("heroes") as HeroBanner[]) ?? seed.heroes;
  return docs;
}

async function writeDocs(client: PoolClient, docs: Docs, keys: DocKey[]) {
  for (const key of keys) {
    await client.query(
      `UPDATE app_documents SET value = $2::jsonb, updated_at = NOW() WHERE key = $1`,
      [key, JSON.stringify(docs[key])]
    );
  }
}

export async function readPublicDocs() {
  await ensureDatabase();
  return withClient(async (client) => {
    await client.query("BEGIN");
    try {
      const docs = await readDocs(client);
      await client.query("COMMIT");
      return docs;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  });
}

export function publicUser(user: AdminUser): AdminUser {
  return { ...user, password: "" };
}

export function publicCatalog(docs: Docs) {
  return {
    mode: "remote" as const,
    products: docs.products,
    categories: docs.categories,
    bank: docs.bank,
    heroes: docs.heroes,
  };
}

export function adminPayload(docs: Docs, user: AdminUser) {
  return {
    user: publicUser(user),
    users:
      user.role === "superadmin" ? docs.users.map(publicUser) : [],
    orders: docs.orders,
    refunds: docs.refunds,
    products: docs.products,
    categories: docs.categories,
    bank: docs.bank,
    heroes: docs.heroes,
  };
}

export async function findUser(id: string) {
  const docs = await readPublicDocs();
  return docs.users.find((user) => user.id === id) ?? null;
}

export async function loginUser(email: string, password: string) {
  await ensureDatabase();
  return withClient(async (client) => {
    await client.query("BEGIN");
    try {
      const docs = await readDocs(client);
      const user = docs.users.find(
        (entry) => entry.email === email.trim().toLowerCase()
      );
      if (!user || !verifyPassword(password, user.password)) {
        await client.query("ROLLBACK");
        return null;
      }
      await client.query("COMMIT");
      return { docs, user };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  });
}

function normalizeProduct(product: Product): Product {
  const images =
    product.images && product.images.length > 0
      ? product.images
      : product.image
        ? [product.image]
        : [];
  const image = product.image || images[0] || "";
  return {
    ...product,
    image,
    images,
    fabric: product.fabric || image,
    color: product.color || "Neutral",
  };
}

export async function placeOrder(input: {
  customer: Order["customer"];
  items: { productId: string; quantity: number }[];
  paymentMethod?: PaymentMethod;
  notes?: string;
  paymentProof?: string;
}) {
  await ensureDatabase();
  return withClient(async (client) => {
    await client.query("BEGIN");
    try {
      const docs = await readDocs(client);
      const items = input.items
        .map((item) => {
          const product = docs.products.find((entry) => entry.id === item.productId);
          const quantity = Math.floor(Number(item.quantity));
          if (!product || quantity < 1) return null;
          if (product.stock < quantity) {
            throw new Error(`${product.name} does not have enough stock`);
          }
          return {
            productId: product.id,
            name: product.name,
            price: salePrice(product.price),
            quantity,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      if (!items.length) throw new Error("Your bag is empty");

      const subtotal = items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      const shipping = subtotal >= 15000 ? 0 : 250;
      const sequence =
        docs.orders.reduce((max, order) => {
          const value = Number(order.id.replace("ORD-", ""));
          return Number.isFinite(value) ? Math.max(max, value) : max;
        }, 1048) + 1;
      const order: Order = {
        id: `ORD-${sequence}`,
        trackingId: `SW-${sequence}-${Date.now().toString(36).toUpperCase().slice(-4)}`,
        items,
        customer: {
          name: input.customer.name.trim(),
          email: input.customer.email.trim(),
          phone: input.customer.phone?.trim(),
          address: input.customer.address.trim(),
          city: input.customer.city.trim(),
          country: input.customer.country.trim(),
        },
        total: subtotal + shipping,
        shipping,
        status: "Pending",
        paymentMethod: input.paymentMethod ?? "cod",
        notes: input.notes?.trim() || undefined,
        paymentProof: input.paymentProof || undefined,
        createdAt: new Date().toISOString(),
      };

      docs.orders = [order, ...docs.orders];
      docs.products = docs.products.map((product) => {
        const ordered = items.find((item) => item.productId === product.id);
        if (!ordered) return product;
        return { ...product, stock: Math.max(0, product.stock - ordered.quantity) };
      });
      await writeDocs(client, docs, ["orders", "products"]);
      await client.query("COMMIT");
      return { order, products: docs.products };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  });
}

export async function lookupOrders(query: string) {
  const docs = await readPublicDocs();
  const needle = query.trim().toUpperCase().replace(/\s+/g, "");
  const ticket = docs.refunds.find(
    (entry) => entry.id.toUpperCase().replace(/\s+/g, "") === needle
  );
  if (ticket) {
    const order = docs.orders.find((entry) => entry.id === ticket.orderId);
    return { orders: order ? [order] : [], refunds: [ticket] };
  }
  const orders = findOrdersByQuery(docs.orders, query);
  const ids = new Set(orders.map((order) => order.id));
  const refunds = docs.refunds.filter((entry) => ids.has(entry.orderId));
  return { orders, refunds };
}

export async function submitRefund(input: {
  orderId: string;
  trackingId: string;
  photos: string[];
  voiceNote?: string;
  note?: string;
}) {
  await ensureDatabase();
  return withClient(async (client) => {
    await client.query("BEGIN");
    try {
      const docs = await readDocs(client);
      const order = docs.orders.find(
        (entry) =>
          entry.id === input.orderId && entry.trackingId === input.trackingId
      );
      if (!order) throw new Error("Order not found");
      if (!isDeliveredStatus(order.status)) {
        throw new Error("Only delivered orders can be refunded.");
      }
      if (!input.photos.length) throw new Error("Add at least one photo.");
      const open = docs.refunds.find(
        (ticket) =>
          ticket.orderId === order.id &&
          (ticket.status === "Pending" || ticket.status === "Approved")
      );
      if (open) {
        await client.query("COMMIT");
        return { ok: false as const, error: `A ticket already exists: ${open.id}`, ticket: open };
      }
      const nextNumber =
        docs.refunds.reduce((max, ticket) => {
          const value = Number(ticket.id.replace("RF-", ""));
          return Number.isFinite(value) ? Math.max(max, value) : max;
        }, 1000) + 1;
      const ticket: RefundTicket = {
        id: `RF-${nextNumber}`,
        orderId: order.id,
        trackingId: order.trackingId,
        customerName: order.customer.name,
        customerEmail: order.customer.email,
        customerPhone: order.customer.phone,
        photos: input.photos,
        voiceNote: input.voiceNote,
        note: input.note?.trim() || undefined,
        status: "Pending",
        createdAt: new Date().toISOString(),
      };
      docs.refunds = [ticket, ...docs.refunds];
      await writeDocs(client, docs, ["refunds"]);
      await client.query("COMMIT");
      return { ok: true as const, ticket };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  });
}

export async function saveRefundPayoutAccount(
  id: string,
  account: BankDetails
) {
  await ensureDatabase();
  return withClient(async (client) => {
    await client.query("BEGIN");
    try {
      const docs = await readDocs(client);
      const ticket = docs.refunds.find((entry) => entry.id === id);
      if (!ticket) throw new Error("Ticket not found.");
      if (ticket.status === "Rejected") throw new Error("This refund was rejected.");
      if (ticket.payoutProof) throw new Error("Refund has already been sent.");
      if (!ticket.askBankDetails) {
        throw new Error("Wait for the refund note before sending bank details.");
      }
      const bankName = account.bankName.trim();
      const accountTitle = account.accountTitle.trim();
      const iban = account.iban.trim();
      if (!bankName || !accountTitle || !iban) {
        throw new Error("Fill in all bank fields");
      }
      docs.refunds = docs.refunds.map((entry) =>
        entry.id === id
          ? { ...entry, payoutAccount: { bankName, accountTitle, iban } }
          : entry
      );
      await writeDocs(client, docs, ["refunds"]);
      await client.query("COMMIT");
      return docs.refunds.find((entry) => entry.id === id)!;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  });
}

type MutateBody = {
  op: string;
  product?: Product;
  id?: string;
  ids?: string[];
  name?: string;
  status?: OrderStatus;
  bank?: BankDetails;
  user?: AdminUser;
  patch?: Partial<RefundTicket>;
  banners?: HeroBanner[];
};

export async function mutateAs(actor: AdminUser, body: MutateBody) {
  await ensureDatabase();
  return withClient(async (client) => {
    await client.query("BEGIN");
    try {
      const docs = await readDocs(client);
      const current =
        docs.users.find((user) => user.id === actor.id) ?? actor;
      applyMutation(docs, current, body);
      await writeDocs(client, docs, [
        "products",
        "orders",
        "categories",
        "bank",
        "users",
        "refunds",
        "heroes",
      ]);
      await client.query("COMMIT");
      return { docs, user: docs.users.find((user) => user.id === current.id) ?? current };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  });
}

function can(user: AdminUser, module: string) {
  if (user.role === "superadmin") return true;
  if (user.role === "admin") return module !== "users";
  return user.modules.includes(module as AdminUser["modules"][number]);
}

function writable(user: AdminUser) {
  return user.role !== "view-only";
}

function applyMutation(docs: Docs, user: AdminUser, body: MutateBody) {
  if (!writable(user)) throw new Error("This account is view only");

  if (body.op === "upsert-product") {
    if (!can(user, "products") || !body.product) {
      throw new Error("You cannot edit products");
    }
    const next = normalizeProduct(body.product);
    if (
      !docs.categories.some(
        (item) => item.toLowerCase() === next.category.toLowerCase()
      )
    ) {
      docs.categories = [...docs.categories, next.category];
    }
    const index = docs.products.findIndex((entry) => entry.id === next.id);
    if (index === -1) docs.products = [next, ...docs.products];
    else docs.products[index] = next;
    return;
  }

  if (body.op === "delete-product") {
    if (!can(user, "products") || !body.id) throw new Error("You cannot edit products");
    docs.products = docs.products.filter((product) => product.id !== body.id);
    return;
  }

  if (body.op === "reorder-products") {
    if (!can(user, "products") || !body.ids) throw new Error("You cannot edit products");
    const byId = new Map(docs.products.map((product) => [product.id, product]));
    const next = body.ids
      .map((id) => byId.get(id))
      .filter((product): product is Product => Boolean(product));
    for (const product of docs.products) {
      if (!next.some((entry) => entry.id === product.id)) next.push(product);
    }
    docs.products = next;
    return;
  }

  if (body.op === "add-category") {
    if (!can(user, "products")) throw new Error("You cannot edit products");
    const name = body.name?.trim() || "";
    if (!name) throw new Error("Enter a category name.");
    if (docs.categories.some((item) => item.toLowerCase() === name.toLowerCase())) {
      throw new Error("That category already exists.");
    }
    docs.categories = [...docs.categories, name];
    return;
  }

  if (body.op === "order-status") {
    if (!can(user, "orders") || !body.id || !body.status) {
      throw new Error("You cannot edit orders");
    }
    docs.orders = docs.orders.map((order) =>
      order.id === body.id ? { ...order, status: body.status! } : order
    );
    return;
  }

  if (body.op === "bank") {
    if (!can(user, "settings") || !body.bank) throw new Error("You cannot edit settings");
    docs.bank = {
      bankName: body.bank.bankName.trim(),
      accountTitle: body.bank.accountTitle.trim(),
      iban: body.bank.iban.trim(),
    };
    return;
  }

  if (body.op === "refund-patch") {
    if (!can(user, "refunds") || !body.id || !body.patch) {
      throw new Error("You cannot edit refunds");
    }
    docs.refunds = docs.refunds.map((ticket) => {
      if (ticket.id !== body.id) return ticket;
      const patch = body.patch!;
      const status =
        patch.skipBankWait &&
        ticket.status !== "Rejected" &&
        ticket.status !== "Completed"
          ? "Approved"
          : (patch.status ?? ticket.status);
      return {
        ...ticket,
        status,
        remark: patch.remark === undefined ? ticket.remark : patch.remark || undefined,
        askBankDetails: patch.askBankDetails ?? ticket.askBankDetails,
        skipBankWait: patch.skipBankWait ?? ticket.skipBankWait,
        payoutProof: patch.payoutProof ?? ticket.payoutProof,
        payoutProofAt: patch.payoutProofAt ?? ticket.payoutProofAt,
      };
    });
    return;
  }

  if (body.op === "hero-add") {
    if (!can(user, "website") || !body.banners?.length) {
      throw new Error("You cannot edit the website");
    }
    docs.heroes = [...docs.heroes, ...body.banners.filter((banner) => banner.src)];
    return;
  }

  if (body.op === "hero-remove") {
    if (!can(user, "website") || !body.id) throw new Error("You cannot edit the website");
    docs.heroes = docs.heroes.filter((banner) => banner.id !== body.id);
    return;
  }

  if (body.op === "upsert-user") {
    if (user.role !== "superadmin" || !body.user) {
      throw new Error("Only a superadmin can manage users.");
    }
    const incoming = body.user;
    const email = incoming.email.trim().toLowerCase();
    const duplicate = docs.users.some(
      (entry) => entry.email === email && entry.id !== incoming.id
    );
    if (duplicate) throw new Error("That email is already in use.");
    const previous = docs.users.find((entry) => entry.id === incoming.id);
    const password = incoming.password
      ? hashPassword(incoming.password)
      : previous?.password;
    if (!password) throw new Error("Set a password.");
    const next: AdminUser = {
      ...incoming,
      email,
      password,
      modules: resolveModules(incoming.role, incoming.modules ?? []),
    };
    if (!previous) docs.users = [...docs.users, next];
    else docs.users = docs.users.map((entry) => (entry.id === next.id ? next : entry));
    return;
  }

  if (body.op === "delete-user") {
    if (user.role !== "superadmin" || !body.id) {
      throw new Error("Only a superadmin can manage users.");
    }
    if (body.id === user.id) throw new Error("You cannot delete your own account.");
    const target = docs.users.find((entry) => entry.id === body.id);
    if (!target) throw new Error("User not found.");
    if (target.role === "superadmin") {
      const supers = docs.users.filter((entry) => entry.role === "superadmin");
      if (supers.length <= 1) throw new Error("Keep at least one superadmin.");
    }
    docs.users = docs.users.filter((entry) => entry.id !== body.id);
    return;
  }

  throw new Error("Unknown save");
}
