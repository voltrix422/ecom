export type Category = string;

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  category: Category;
  image: string;
  images?: string[];
  fabric: string;
  color: string;
  stock: number;
  featured: boolean;
  details: string[];
};

export type CartItem = {
  productId: string;
  quantity: number;
};

export type OrderStatus =
  | "Pending"
  | "Paid"
  | "Shipped"
  | "Delivered"
  | "Cancelled";

export type OrderItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
};

export type PaymentMethod = "cod" | "bank";

export type BankDetails = {
  bankName: string;
  accountTitle: string;
  iban: string;
};

export type CustomerInfo = {
  name: string;
  email: string;
  phone?: string;
  address: string;
  city: string;
  country: string;
};

export type Order = {
  id: string;
  trackingId: string;
  items: OrderItem[];
  customer: CustomerInfo;
  total: number;
  shipping: number;
  status: OrderStatus;
  paymentMethod?: PaymentMethod;
  notes?: string;
  paymentProof?: string;
  createdAt: string;
};

export type RefundStatus = "Pending" | "Approved" | "Rejected" | "Completed";

export type RefundPayoutAccount = {
  bankName: string;
  accountTitle: string;
  iban: string;
};

export type RefundTicket = {
  id: string;
  orderId: string;
  trackingId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  photos: string[];
  voiceNote?: string;
  note?: string;
  remark?: string;
  askBankDetails?: boolean;
  payoutAccount?: RefundPayoutAccount;
  skipBankWait?: boolean;
  payoutProof?: string;
  payoutProofAt?: string;
  status: RefundStatus;
  createdAt: string;
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  orders: number;
  spent: number;
  pending: number;
  paid: number;
  shipped: number;
  delivered: number;
  cancelled: number;
};

export type AdminRole = "superadmin" | "admin" | "user" | "view-only";

export type AdminModule =
  | "overview"
  | "products"
  | "orders"
  | "customers"
  | "refunds"
  | "users"
  | "website"
  | "settings";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: AdminRole;
  modules: AdminModule[];
};

export type HeroBanner = {
  id: string;
  src: string;
};
