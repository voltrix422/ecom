import type {
  AdminModule,
  AdminRole,
  AdminUser,
  BankDetails,
} from "@/lib/types";

export const ADMIN_MODULES: { id: AdminModule; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "products", label: "Products" },
  { id: "orders", label: "Orders" },
  { id: "refunds", label: "Refunds" },
  { id: "customers", label: "Customers" },
  { id: "users", label: "Users" },
  { id: "website", label: "Website" },
  { id: "settings", label: "Settings" },
];

export const ADMIN_ROLES: { id: AdminRole; label: string; hint: string }[] = [
  {
    id: "superadmin",
    label: "Superadmin",
    hint: "Full access, including user management",
  },
  {
    id: "admin",
    label: "Admin",
    hint: "Store modules with edit access",
  },
  {
    id: "user",
    label: "User",
    hint: "Selected modules with edit access",
  },
  {
    id: "view-only",
    label: "View only",
    hint: "Selected modules, read only",
  },
];

const STORE_MODULES: AdminModule[] = [
  "overview",
  "products",
  "orders",
  "refunds",
  "customers",
  "website",
  "settings",
];

export const seedAdminUsers: AdminUser[] = [
  {
    id: "au-001",
    name: "Suitwear Superadmin",
    email: "admin@suitwear.store",
    password: "admin",
    role: "superadmin",
    modules: [...STORE_MODULES, "users"],
  },
];

export const seedBankDetails: BankDetails = {
  bankName: "HBL",
  accountTitle: "Suitwear",
  iban: "PK00 HABB 0000 0000 0000 0000",
};

export function defaultModulesForRole(role: AdminRole): AdminModule[] {
  if (role === "superadmin") return [...STORE_MODULES, "users"];
  if (role === "admin") return [...STORE_MODULES];
  return ["overview"];
}

export function resolveModules(
  role: AdminRole,
  modules: AdminModule[]
): AdminModule[] {
  if (role === "superadmin") return [...STORE_MODULES, "users"];
  if (role === "admin") return [...STORE_MODULES];
  return modules.filter((module) => module !== "users");
}

export function canAccessModule(
  user: AdminUser | null,
  module: AdminModule
): boolean {
  if (!user) return false;
  return resolveModules(user.role, user.modules).includes(module);
}

export function canWrite(user: AdminUser | null): boolean {
  if (!user) return false;
  return user.role !== "view-only";
}

export function roleLabel(role: AdminRole) {
  return ADMIN_ROLES.find((item) => item.id === role)?.label ?? role;
}
