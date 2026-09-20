"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  canAccessModule,
  canWrite,
  defaultModulesForRole,
  resolveModules,
  seedAdminUsers,
  seedBankDetails,
} from "@/lib/admin";
import { seedOrders, seedProducts, categories as seedCategories } from "@/lib/data";
import { salePrice } from "@/lib/format";
import { isDeliveredStatus } from "@/lib/orders";
import {
  loadHeroBanners,
  persistHeroBanners,
  subscribeHeroBanners,
} from "@/lib/hero-storage";
import {
  loadRefunds,
  mergeTickets,
  persistRefunds,
  subscribeRefunds,
} from "@/lib/refund-storage";
import type {
  AdminModule,
  AdminUser,
  BankDetails,
  CartItem,
  Customer,
  CustomerInfo,
  HeroBanner,
  Order,
  OrderStatus,
  PaymentMethod,
  Product,
  RefundStatus,
  RefundTicket,
} from "@/lib/types";

const KEYS = {
  products: "form-suits-products-v3",
  cart: "form-suits-cart",
  orders: "form-suits-orders",
  admin: "form-admin",
  adminUsers: "form-admin-users-v1",
  adminSession: "form-admin-session-v1",
  categories: "form-suits-categories-v1",
  bankDetails: "form-suits-bank-v1",
  refunds: "form-suits-refunds-v1",
};

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

function normalizeOrder(order: Order): Order {
  const seed = seedOrders.find((entry) => entry.id === order.id);
  return {
    ...order,
    trackingId:
      order.trackingId || `SW-${order.id.replace("ORD-", "")}-LEGACY`,
    shipping: order.shipping ?? 0,
    customer: {
      ...order.customer,
      phone: order.customer.phone || seed?.customer.phone,
    },
  };
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function peekAdminSession() {
  if (typeof window === "undefined") return false;
  try {
    return Boolean(
      window.localStorage.getItem(KEYS.adminSession) ||
        window.localStorage.getItem(KEYS.admin) === "1"
    );
  } catch {
    return false;
  }
}

function applyOrderToCustomer(customer: Customer, order: Order) {
  customer.orders += 1;
  customer.spent += order.total;
  if (order.status === "Pending") customer.pending += order.total;
  else if (order.status === "Paid") customer.paid += order.total;
  else if (order.status === "Shipped") customer.shipped += order.total;
  else if (order.status === "Delivered") customer.delivered += order.total;
  else if (order.status === "Cancelled") customer.cancelled += order.total;
}

function customersFromOrders(orders: Order[]): Customer[] {
  const map = new Map<string, Customer>();
  for (const order of orders) {
    const existing = map.get(order.customer.email);
    if (existing) {
      applyOrderToCustomer(existing, order);
    } else {
      const customer: Customer = {
        id: order.customer.email,
        name: order.customer.name,
        email: order.customer.email,
        orders: 0,
        spent: 0,
        pending: 0,
        paid: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
      };
      applyOrderToCustomer(customer, order);
      map.set(order.customer.email, customer);
    }
  }
  return Array.from(map.values()).sort((a, b) => b.spent - a.spent);
}

function normalizeAdminUser(user: AdminUser): AdminUser {
  return {
    ...user,
    email: user.email.trim().toLowerCase(),
    modules: resolveModules(user.role, user.modules ?? []),
  };
}

type StoreContextValue = {
  ready: boolean;
  products: Product[];
  categories: string[];
  cart: CartItem[];
  orders: Order[];
  customers: Customer[];
  isAdmin: boolean;
  adminUser: AdminUser | null;
  adminUsers: AdminUser[];
  login: (email: string, password: string) => boolean;
  logout: () => void;
  canAccess: (module: AdminModule) => boolean;
  canEdit: () => boolean;
  upsertAdminUser: (user: AdminUser) => { ok: boolean; error?: string };
  deleteAdminUser: (id: string) => { ok: boolean; error?: string };
  addCategory: (name: string) => { ok: boolean; error?: string };
  addToCart: (productId: string, quantity?: number) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  getProduct: (idOrSlug: string) => Product | undefined;
  bankDetails: BankDetails;
  updateBankDetails: (details: BankDetails) => void;
  placeOrder: (
    customer: CustomerInfo,
    options?: {
      paymentMethod?: PaymentMethod;
      notes?: string;
      paymentProof?: string;
      shipping?: number;
    }
  ) => Order;
  upsertProduct: (product: Product) => void;
  reorderProducts: (activeId: string, overId: string) => void;
  deleteProduct: (id: string) => void;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  refundTickets: RefundTicket[];
  submitRefund: (input: {
    order: Order;
    photos: string[];
    voiceNote?: string;
    note?: string;
  }) => { ok: boolean; ticket?: RefundTicket; error?: string };
  updateRefundStatus: (id: string, status: RefundStatus) => void;
  updateRefundRemark: (id: string, remark: string) => void;
  requestRefundBankDetails: (id: string, remark?: string) => void;
  skipRefundBankWait: (id: string) => void;
  submitRefundPayoutAccount: (
    id: string,
    account: BankDetails
  ) => { ok: boolean; error?: string };
  attachRefundPayoutProof: (id: string, proof: string) => void;
  heroBanners: HeroBanner[];
  addHeroBanners: (srcs: string[]) => void;
  removeHeroBanner: (id: string) => void;
};

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [products, setProducts] = useState<Product[]>(seedProducts);
  const [categories, setCategories] = useState<string[]>([...seedCategories]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>(seedOrders);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>(seedAdminUsers);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [bankDetails, setBankDetails] = useState<BankDetails>(seedBankDetails);
  const [refundTickets, setRefundTickets] = useState<RefundTicket[]>([]);
  const [refundsHydrated, setRefundsHydrated] = useState(false);
  const [heroBanners, setHeroBanners] = useState<HeroBanner[]>([]);
  const [heroHydrated, setHeroHydrated] = useState(false);
  const heroTouched = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setProducts(readJson(KEYS.products, seedProducts).map(normalizeProduct));
        setCart(readJson(KEYS.cart, []));
        setOrders(readJson(KEYS.orders, seedOrders).map(normalizeOrder));
        const storedCategories = readJson<string[]>(
          KEYS.categories,
          [...seedCategories]
        );
        setCategories(
          storedCategories.length > 0 ? storedCategories : [...seedCategories]
        );
        setBankDetails(readJson(KEYS.bankDetails, seedBankDetails));

        const storedUsers = readJson<AdminUser[]>(
          KEYS.adminUsers,
          seedAdminUsers
        ).map(normalizeAdminUser);
        let users =
          storedUsers.length > 0
            ? storedUsers
            : seedAdminUsers.map(normalizeAdminUser);

        for (const seed of seedAdminUsers) {
          const normalized = normalizeAdminUser(seed);
          if (!users.some((user) => user.email === normalized.email)) {
            users = [...users, normalized];
          }
        }
        setAdminUsers(users);

        const sessionId = window.localStorage.getItem(KEYS.adminSession);
        if (sessionId) {
          const sessionUser = users.find((user) => user.id === sessionId) ?? null;
          setAdminUser(sessionUser);
          if (!sessionUser) window.localStorage.removeItem(KEYS.adminSession);
        } else if (window.localStorage.getItem(KEYS.admin) === "1") {
          const fallback =
            users.find((user) => user.role === "superadmin") ?? users[0];
          if (fallback) {
            setAdminUser(fallback);
            window.localStorage.setItem(KEYS.adminSession, fallback.id);
          }
        }

        const tickets = await loadRefunds();
        const banners = await loadHeroBanners();
        if (cancelled) return;
        setRefundTickets((current) => mergeTickets(tickets, current));
        if (!heroTouched.current) setHeroBanners(banners);
        setRefundsHydrated(true);
        setHeroHydrated(true);
      } catch (error) {
        console.error("Failed to hydrate store", error);
      } finally {
        if (!cancelled) {
          setRefundsHydrated(true);
          setHeroHydrated(true);
          setReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(
    () =>
      subscribeRefunds((incoming) => {
        setRefundTickets((current) => mergeTickets(current, incoming));
      }),
    []
  );

  useEffect(
    () =>
      subscribeHeroBanners((incoming) => {
        setHeroBanners(incoming);
      }),
    []
  );

  useEffect(() => {
    if (!ready) return;
    writeJson(KEYS.products, products);
  }, [products, ready]);

  useEffect(() => {
    if (!ready) return;
    writeJson(KEYS.cart, cart);
  }, [cart, ready]);

  useEffect(() => {
    if (!ready) return;
    writeJson(KEYS.orders, orders);
  }, [orders, ready]);

  useEffect(() => {
    if (!ready) return;
    writeJson(KEYS.categories, categories);
  }, [categories, ready]);

  useEffect(() => {
    if (!ready) return;
    writeJson(KEYS.adminUsers, adminUsers);
  }, [adminUsers, ready]);

  useEffect(() => {
    if (!ready) return;
    writeJson(KEYS.bankDetails, bankDetails);
  }, [bankDetails, ready]);

  useEffect(() => {
    if (!refundsHydrated) return;
    persistRefunds(refundTickets);
  }, [refundTickets, refundsHydrated]);

  useEffect(() => {
    if (!heroHydrated) return;
    persistHeroBanners(heroBanners);
  }, [heroBanners, heroHydrated]);

  const login = useCallback(
    (email: string, password: string) => {
      const normalizedEmail = email.trim().toLowerCase();
      let match = adminUsers.find(
        (user) =>
          user.email === normalizedEmail && user.password === password
      );

      if (!match) {
        const seedMatch = seedAdminUsers
          .map(normalizeAdminUser)
          .find(
            (user) =>
              user.email === normalizedEmail && user.password === password
          );
        if (seedMatch) {
          setAdminUsers((current) =>
            current.some((user) => user.email === seedMatch.email)
              ? current
              : [...current, seedMatch]
          );
          match = seedMatch;
        }
      }

      if (!match) return false;
      window.localStorage.setItem(KEYS.adminSession, match.id);
      window.localStorage.setItem(KEYS.admin, "1");
      setAdminUser(match);
      return true;
    },
    [adminUsers]
  );

  const logout = useCallback(() => {
    window.localStorage.removeItem(KEYS.adminSession);
    window.localStorage.removeItem(KEYS.admin);
    setAdminUser(null);
  }, []);

  const canAccess = useCallback(
    (module: AdminModule) => canAccessModule(adminUser, module),
    [adminUser]
  );

  const canEdit = useCallback(() => canWrite(adminUser), [adminUser]);

  const upsertAdminUser = useCallback(
    (user: AdminUser) => {
      if (!adminUser || adminUser.role !== "superadmin") {
        return { ok: false, error: "Only a superadmin can manage users." };
      }

      const nextUser = normalizeAdminUser({
        ...user,
        modules:
          user.role === "user" || user.role === "view-only"
            ? user.modules
            : defaultModulesForRole(user.role),
      });

      const duplicate = adminUsers.some(
        (entry) => entry.email === nextUser.email && entry.id !== nextUser.id
      );
      if (duplicate) {
        return { ok: false, error: "That email is already in use." };
      }

      setAdminUsers((current) => {
        const index = current.findIndex((entry) => entry.id === nextUser.id);
        if (index === -1) return [...current, nextUser];
        const next = [...current];
        next[index] = nextUser;
        return next;
      });

      if (adminUser.id === nextUser.id) {
        setAdminUser(nextUser);
      }

      return { ok: true };
    },
    [adminUser, adminUsers]
  );

  const deleteAdminUser = useCallback(
    (id: string) => {
      if (!adminUser || adminUser.role !== "superadmin") {
        return { ok: false, error: "Only a superadmin can manage users." };
      }
      if (id === adminUser.id) {
        return { ok: false, error: "You cannot delete your own account." };
      }
      const target = adminUsers.find((user) => user.id === id);
      if (!target) return { ok: false, error: "User not found." };
      if (target.role === "superadmin") {
        const supers = adminUsers.filter((user) => user.role === "superadmin");
        if (supers.length <= 1) {
          return { ok: false, error: "Keep at least one superadmin." };
        }
      }
      setAdminUsers((current) => current.filter((user) => user.id !== id));
      return { ok: true };
    },
    [adminUser, adminUsers]
  );

  const addCategory = useCallback(
    (name: string) => {
      const next = name.trim();
      if (!next) return { ok: false, error: "Enter a category name." };
      if (categories.some((item) => item.toLowerCase() === next.toLowerCase())) {
        return { ok: false, error: "That category already exists." };
      }
      setCategories((current) => [...current, next]);
      return { ok: true };
    },
    [categories]
  );

  const addToCart = useCallback((productId: string, quantity = 1) => {
    setCart((current) => {
      const existing = current.find((item) => item.productId === productId);
      if (existing) {
        return current.map((item) =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...current, { productId, quantity }];
    });
  }, []);

  const updateCartQuantity = useCallback((productId: string, quantity: number) => {
    setCart((current) => {
      if (quantity <= 0) {
        return current.filter((item) => item.productId !== productId);
      }
      return current.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      );
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((current) => current.filter((item) => item.productId !== productId));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const getProduct = useCallback(
    (idOrSlug: string) =>
      products.find(
        (product) => product.id === idOrSlug || product.slug === idOrSlug
      ),
    [products]
  );

  const placeOrder = useCallback(
    (
      customer: CustomerInfo,
      options: {
        paymentMethod?: PaymentMethod;
        notes?: string;
        paymentProof?: string;
        shipping?: number;
      } = {}
    ) => {
      const paymentMethod = options.paymentMethod ?? "cod";
      const shipping = options.shipping ?? 0;
      const items = cart
        .map((item) => {
          const product = products.find((entry) => entry.id === item.productId);
          if (!product) return null;
          return {
            productId: product.id,
            name: product.name,
            price: salePrice(product.price),
            quantity: item.quantity,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      const subtotal = items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      const orderId = `ORD-${1049 + orders.length}`;
      const order: Order = {
        id: orderId,
        trackingId: `SW-${orderId.replace("ORD-", "")}-${Date.now()
          .toString(36)
          .toUpperCase()
          .slice(-4)}`,
        items,
        customer,
        total: subtotal + shipping,
        shipping,
        status: "Pending",
        paymentMethod,
        notes: options.notes?.trim() || undefined,
        paymentProof: options.paymentProof || undefined,
        createdAt: new Date().toISOString(),
      };

      setOrders((current) => [order, ...current]);
      setProducts((current) =>
        current.map((product) => {
          const ordered = items.find((item) => item.productId === product.id);
          if (!ordered) return product;
          return {
            ...product,
            stock: Math.max(0, product.stock - ordered.quantity),
          };
        })
      );
      setCart([]);
      return order;
    },
    [cart, orders.length, products]
  );

  const updateBankDetails = useCallback(
    (details: BankDetails) => {
      if (!canWrite(adminUser) || !canAccessModule(adminUser, "settings")) return;
      setBankDetails({
        bankName: details.bankName.trim(),
        accountTitle: details.accountTitle.trim(),
        iban: details.iban.trim(),
      });
    },
    [adminUser]
  );

  const upsertProduct = useCallback(
    (product: Product) => {
      if (!canWrite(adminUser) || !canAccessModule(adminUser, "products")) return;
      const next = normalizeProduct(product);
      setCategories((current) =>
        current.some(
          (item) => item.toLowerCase() === next.category.toLowerCase()
        )
          ? current
          : [...current, next.category]
      );
      setProducts((current) => {
        const index = current.findIndex((entry) => entry.id === next.id);
        if (index === -1) return [next, ...current];
        const copy = [...current];
        copy[index] = next;
        return copy;
      });
    },
    [adminUser]
  );

  const reorderProducts = useCallback(
    (activeId: string, overId: string) => {
      if (!canWrite(adminUser) || !canAccessModule(adminUser, "products")) return;
      if (activeId === overId) return;
      setProducts((current) => {
        const from = current.findIndex((product) => product.id === activeId);
        const to = current.findIndex((product) => product.id === overId);
        if (from === -1 || to === -1) return current;
        const next = [...current];
        const [item] = next.splice(from, 1);
        next.splice(to, 0, item);
        return next;
      });
    },
    [adminUser]
  );

  const deleteProduct = useCallback(
    (id: string) => {
      if (!canWrite(adminUser) || !canAccessModule(adminUser, "products")) return;
      setProducts((current) => current.filter((product) => product.id !== id));
      setCart((current) => current.filter((item) => item.productId !== id));
    },
    [adminUser]
  );

  const updateOrderStatus = useCallback(
    (id: string, status: OrderStatus) => {
      if (!canWrite(adminUser) || !canAccessModule(adminUser, "orders")) return;
      setOrders((current) =>
        current.map((order) => (order.id === id ? { ...order, status } : order))
      );
    },
    [adminUser]
  );

  const submitRefund = useCallback(
    (input: {
      order: Order;
      photos: string[];
      voiceNote?: string;
      note?: string;
    }) => {
      if (!isDeliveredStatus(input.order.status)) {
        return { ok: false, error: "Only delivered orders can be refunded." };
      }
      if (!input.photos.length) {
        return { ok: false, error: "Add at least one photo." };
      }

      const open = refundTickets.find(
        (ticket) =>
          ticket.orderId === input.order.id &&
          (ticket.status === "Pending" || ticket.status === "Approved")
      );
      if (open) {
        return {
          ok: false,
          error: `A ticket already exists: ${open.id}`,
          ticket: open,
        };
      }

      const nextNumber =
        refundTickets.reduce((max, ticket) => {
          const value = Number(ticket.id.replace("RF-", ""));
          return Number.isFinite(value) ? Math.max(max, value) : max;
        }, 1000) + 1;

      const ticket: RefundTicket = {
        id: `RF-${nextNumber}`,
        orderId: input.order.id,
        trackingId: input.order.trackingId,
        customerName: input.order.customer.name,
        customerEmail: input.order.customer.email,
        customerPhone: input.order.customer.phone,
        photos: input.photos,
        voiceNote: input.voiceNote,
        note: input.note?.trim() || undefined,
        status: "Pending",
        createdAt: new Date().toISOString(),
      };

      setRefundTickets((current) => {
        const next = [ticket, ...current];
        persistRefunds(next);
        return next;
      });
      return { ok: true, ticket };
    },
    [refundTickets]
  );

  const updateRefundStatus = useCallback(
    (id: string, status: RefundStatus) => {
      if (!canWrite(adminUser) || !canAccessModule(adminUser, "refunds")) return;
      setRefundTickets((current) => {
        const next = current.map((ticket) =>
          ticket.id === id ? { ...ticket, status } : ticket
        );
        persistRefunds(next);
        return next;
      });
    },
    [adminUser]
  );

  const updateRefundRemark = useCallback(
    (id: string, remark: string) => {
      if (!canWrite(adminUser) || !canAccessModule(adminUser, "refunds")) return;
      const text = remark.trim();
      setRefundTickets((current) => {
        const next = current.map((ticket) =>
          ticket.id === id
            ? { ...ticket, remark: text || undefined }
            : ticket
        );
        persistRefunds(next);
        return next;
      });
    },
    [adminUser]
  );

  const requestRefundBankDetails = useCallback(
    (id: string, remark?: string) => {
      if (!canWrite(adminUser) || !canAccessModule(adminUser, "refunds")) return;
      const text = remark?.trim();
      setRefundTickets((current) => {
        const next = current.map((ticket) => {
          if (ticket.id !== id || ticket.payoutProof) return ticket;
          return {
            ...ticket,
            askBankDetails: true,
            remark: text || ticket.remark,
          };
        });
        persistRefunds(next);
        return next;
      });
    },
    [adminUser]
  );

  const skipRefundBankWait = useCallback(
    (id: string) => {
      if (!canWrite(adminUser) || !canAccessModule(adminUser, "refunds")) return;
      setRefundTickets((current) => {
        const next = current.map((ticket) => {
          if (ticket.id !== id || ticket.payoutProof) return ticket;
          return {
            ...ticket,
            skipBankWait: true,
            status:
              ticket.status === "Rejected" || ticket.status === "Completed"
                ? ticket.status
                : "Approved",
          };
        });
        persistRefunds(next);
        return next;
      });
    },
    [adminUser]
  );

  const submitRefundPayoutAccount = useCallback(
    (id: string, account: BankDetails) => {
      const bankName = account.bankName.trim();
      const accountTitle = account.accountTitle.trim();
      const iban = account.iban.trim();
      if (!bankName || !accountTitle || !iban) {
        return { ok: false, error: "Fill in all bank fields" };
      }
      let found = false;
      let blocked: string | undefined;
      setRefundTickets((current) => {
        const ticket = current.find((entry) => entry.id === id);
        if (!ticket) return current;
        found = true;
        if (ticket.status === "Rejected") {
          blocked = "This refund was rejected.";
          return current;
        }
        if (ticket.payoutProof) {
          blocked = "Refund has already been sent.";
          return current;
        }
        if (!ticket.askBankDetails) {
          blocked = "Wait for the refund note before sending bank details.";
          return current;
        }
        const next = current.map((entry) =>
          entry.id === id
            ? { ...entry, payoutAccount: { bankName, accountTitle, iban } }
            : entry
        );
        persistRefunds(next);
        return next;
      });
      if (!found) return { ok: false, error: "Ticket not found." };
      if (blocked) return { ok: false, error: blocked };
      return { ok: true };
    },
    []
  );

  const attachRefundPayoutProof = useCallback(
    (id: string, proof: string) => {
      if (!canWrite(adminUser) || !canAccessModule(adminUser, "refunds")) return;
      setRefundTickets((current) => {
        const next = current.map((ticket) =>
          ticket.id === id
            ? {
                ...ticket,
                payoutProof: proof,
                payoutProofAt: new Date().toISOString(),
                status: "Completed" as const,
              }
            : ticket
        );
        persistRefunds(next);
        return next;
      });
    },
    [adminUser]
  );

  const addHeroBanners = useCallback(
    (srcs: string[]) => {
      if (!canWrite(adminUser) || !canAccessModule(adminUser, "website")) return;
      const next = srcs
        .filter(Boolean)
        .map((src) => ({
          id: `hero-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          src,
        }));
      if (!next.length) return;
      heroTouched.current = true;
      setHeroBanners((current) => {
        const banners = [...current, ...next];
        persistHeroBanners(banners);
        return banners;
      });
    },
    [adminUser]
  );

  const removeHeroBanner = useCallback(
    (id: string) => {
      if (!canWrite(adminUser) || !canAccessModule(adminUser, "website")) return;
      heroTouched.current = true;
      setHeroBanners((current) => {
        const banners = current.filter((banner) => banner.id !== id);
        persistHeroBanners(banners);
        return banners;
      });
    },
    [adminUser]
  );

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => {
    const product = products.find((entry) => entry.id === item.productId);
    return sum + (product ? salePrice(product.price) * item.quantity : 0);
  }, 0);

  const customers = useMemo(() => customersFromOrders(orders), [orders]);
  const isAdmin = Boolean(adminUser);

  const value = useMemo(
    () => ({
      ready,
      products,
      categories,
      cart,
      orders,
      customers,
      isAdmin,
      adminUser,
      adminUsers,
      login,
      logout,
      canAccess,
      canEdit,
      upsertAdminUser,
      deleteAdminUser,
      addCategory,
      addToCart,
      updateCartQuantity,
      removeFromCart,
      clearCart,
      cartCount,
      cartTotal,
      cartOpen,
      setCartOpen,
      getProduct,
      bankDetails,
      updateBankDetails,
      placeOrder,
      upsertProduct,
      reorderProducts,
      deleteProduct,
      updateOrderStatus,
      refundTickets,
      submitRefund,
      updateRefundStatus,
      updateRefundRemark,
      requestRefundBankDetails,
      skipRefundBankWait,
      submitRefundPayoutAccount,
      attachRefundPayoutProof,
      heroBanners,
      addHeroBanners,
      removeHeroBanner,
    }),
    [
      ready,
      products,
      categories,
      cart,
      orders,
      customers,
      isAdmin,
      adminUser,
      adminUsers,
      login,
      logout,
      canAccess,
      canEdit,
      upsertAdminUser,
      deleteAdminUser,
      addCategory,
      addToCart,
      updateCartQuantity,
      removeFromCart,
      clearCart,
      cartCount,
      cartTotal,
      cartOpen,
      getProduct,
      bankDetails,
      updateBankDetails,
      placeOrder,
      upsertProduct,
      reorderProducts,
      deleteProduct,
      updateOrderStatus,
      refundTickets,
      submitRefund,
      updateRefundStatus,
      updateRefundRemark,
      requestRefundBankDetails,
      skipRefundBankWait,
      submitRefundPayoutAccount,
      attachRefundPayoutProof,
      heroBanners,
      addHeroBanners,
      removeHeroBanner,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within StoreProvider");
  }
  return context;
}
