"use client";

import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "cn";
import {
  ADMIN_MODULES,
  ADMIN_ROLES,
  defaultModulesForRole,
  roleLabel,
} from "@/lib/admin";
import { useStore } from "@/lib/store";
import type { AdminModule, AdminRole, AdminUser } from "@/lib/types";

const emptyForm = {
  name: "",
  email: "",
  password: "",
  role: "user" as AdminRole,
  modules: ["overview"] as AdminModule[],
};

const fieldClass =
  "h-8 rounded-none border-0 border-b border-foreground/15 px-0 shadow-none focus-visible:border-foreground/40 focus-visible:ring-0";

function randomPassword(length = 12) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => chars[byte % chars.length]).join("");
}

function moduleLabel(id: AdminModule) {
  return ADMIN_MODULES.find((item) => item.id === id)?.label ?? id;
}

export default function AdminUsersPage() {
  const { adminUsers, adminUser, upsertAdminUser, deleteAdminUser } =
    useStore();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const moduleChoices = useMemo(
    () => ADMIN_MODULES.filter((module) => module.id !== "users"),
    []
  );

  const showModules = form.role === "user" || form.role === "view-only";

  function startEdit(user: AdminUser) {
    setEditingId(user.id);
    setFormOpen(true);
    setForm({
      name: user.name,
      email: user.email,
      password: user.password,
      role: user.role,
      modules: user.modules.filter((module) => module !== "users"),
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(false);
  }

  function toggleModule(module: AdminModule, checked: boolean) {
    setForm((current) => ({
      ...current,
      modules: checked
        ? [...current.modules, module]
        : current.modules.filter((item) => item !== module),
    }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (showModules && form.modules.length === 0) {
      toast.error("Pick at least one module");
      return;
    }

    const user: AdminUser = {
      id: editingId ?? `au-${Date.now()}`,
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      role: form.role,
      modules:
        form.role === "user" || form.role === "view-only"
          ? form.modules
          : defaultModulesForRole(form.role),
    };

    const result = await upsertAdminUser(user);
    if (!result.ok) {
      toast.error(result.error ?? "Could not save user");
      return;
    }

    toast.success(editingId ? "User updated" : "User added");
    resetForm();
  }

  if (adminUser?.role !== "superadmin") {
    return (
      <p className="text-sm text-muted-foreground">
        Only a superadmin can manage users.
      </p>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {adminUsers.length} {adminUsers.length === 1 ? "user" : "users"}
        </p>
        <button
          type="button"
          onClick={() => {
            if (formOpen && !editingId) {
              setFormOpen(false);
              return;
            }
            setEditingId(null);
            setForm(emptyForm);
            setFormOpen(true);
          }}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          {formOpen && !editingId ? "Close" : "Add"}
        </button>
      </div>

      {formOpen ? (
        <form onSubmit={onSubmit} className="mt-6 max-w-2xl">
          <p className="text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
            {editingId ? "Edit user" : "Add user"}
          </p>
          <div className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-[11px] text-muted-foreground">Name</span>
              <Input
                required
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                className={fieldClass}
              />
            </label>
            <label className="block">
              <span className="text-[11px] text-muted-foreground">Email</span>
              <Input
                type="email"
                required
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                className={fieldClass}
              />
            </label>
            <label className="block">
              <span className="flex items-baseline justify-between gap-3">
                <span className="text-[11px] text-muted-foreground">
                  Password
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      password: randomPassword(),
                    }))
                  }
                  className="text-[11px] text-muted-foreground hover:text-foreground"
                >
                  Generate
                </button>
              </span>
              <Input
                type="text"
                required={!editingId}
                value={form.password}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    password: event.target.value,
                  }))
                }
                className={fieldClass}
              />
            </label>
            <div>
              <p className="text-[11px] text-muted-foreground">Role</p>
              <Select
                value={form.role}
                onValueChange={(value) => {
                  const role = value as AdminRole;
                  setForm((current) => ({
                    ...current,
                    role,
                    modules:
                      role === "user" || role === "view-only"
                        ? current.modules.length
                          ? current.modules
                          : defaultModulesForRole(role)
                        : defaultModulesForRole(role),
                  }));
                }}
              >
                <SelectTrigger
                  className={cn(
                    fieldClass,
                    "w-full min-w-0 rounded-none px-0 shadow-none !border-0 border-b border-foreground/15 focus-visible:ring-0"
                  )}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ADMIN_ROLES.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {showModules ? (
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
              {moduleChoices.map((module) => {
                const checked = form.modules.includes(module.id);
                return (
                  <label
                    key={module.id}
                    className="flex cursor-pointer items-center gap-2 text-sm"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(value) =>
                        toggleModule(module.id, value === true)
                      }
                    />
                    {module.label}
                  </label>
                );
              })}
            </div>
          ) : null}

          <div className="mt-6 flex items-center gap-4">
            <button type="submit" className="text-sm">
              {editingId ? "Save" : "Add user"}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      ) : null}

      <div className="mt-8 overflow-x-auto">
        <table className="w-full border-separate border-spacing-0 text-[13px]">
          <thead>
            <tr className="text-left text-[11px] text-muted-foreground">
              <th className="px-2 pb-2 font-medium">User</th>
              <th className="px-2 pb-2 font-medium">Role</th>
              <th className="px-2 pb-2 font-medium">Modules</th>
              <th className="px-2 pb-2 text-right font-medium" />
            </tr>
          </thead>
          <tbody>
            {adminUsers.map((user) => (
              <tr
                key={user.id}
                className="[&>td]:border-b [&>td]:border-foreground/10 last:[&>td]:border-b-0"
              >
                <td className="px-2 py-2">
                  <p>{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </td>
                <td className="px-2 py-2 whitespace-nowrap">
                  {roleLabel(user.role)}
                </td>
                <td className="px-2 py-2 text-muted-foreground">
                  {user.modules.map(moduleLabel).join(", ")}
                </td>
                <td className="px-2 py-2 text-right whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => startEdit(user)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={user.id === adminUser?.id}
                    onClick={async () => {
                      const result = await deleteAdminUser(user.id);
                      if (!result.ok) {
                        toast.error(result.error ?? "Could not delete");
                        return;
                      }
                      toast.success("User removed");
                      if (editingId === user.id) resetForm();
                    }}
                    className="ml-3 text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
