"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Banknote,
  Package,
  ShoppingBag,
  SlidersHorizontal,
  Users,
  X,
} from "lucide-react";
import { cn } from "cn";
import { formatPrice } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Order, OrderStatus } from "@/lib/types";

const STATUS_ORDER: OrderStatus[] = [
  "Pending",
  "Paid",
  "Shipped",
  "Delivered",
  "Cancelled",
];

type RangeKey = "7" | "14" | "30" | "90" | "all";
type MetricKey = "revenue" | "orders";
type StatusFilter = "all" | "active" | OrderStatus;

const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: "7", label: "7d" },
  { key: "14", label: "14d" },
  { key: "30", label: "30d" },
  { key: "90", label: "90d" },
  { key: "all", label: "All" },
];

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All status" },
  { key: "active", label: "Active" },
  { key: "Paid", label: "Paid" },
  { key: "Shipped", label: "Shipped" },
  { key: "Delivered", label: "Delivered" },
  { key: "Pending", label: "Pending" },
  { key: "Cancelled", label: "Cancelled" },
];

function dayKey(value: Date | string) {
  const d = typeof value === "string" ? new Date(value) : value;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function shortDay(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(`${iso}T12:00:00`));
}

function fullDay(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${iso}T12:00:00`));
}

function rangeDays(range: RangeKey) {
  if (range === "all") return null;
  return Number(range);
}

function matchesStatus(order: Order, filter: StatusFilter) {
  if (filter === "all") return true;
  if (filter === "active") return order.status !== "Cancelled";
  return order.status === filter;
}

function buildSeries(
  orders: Order[],
  range: RangeKey,
  status: StatusFilter,
  metric: MetricKey
) {
  const filtered = orders.filter((order) => matchesStatus(order, status));
  const days = rangeDays(range);
  const end = new Date();
  end.setHours(12, 0, 0, 0);

  let start: Date;
  if (days == null) {
    if (filtered.length === 0) {
      start = new Date(end);
      start.setDate(end.getDate() - 13);
    } else {
      const earliest = filtered.reduce((min, order) => {
        const t = new Date(order.createdAt).getTime();
        return t < min ? t : min;
      }, Date.now());
      start = new Date(earliest);
      start.setHours(12, 0, 0, 0);
      const span = Math.ceil((end.getTime() - start.getTime()) / 86400000);
      if (span < 6) start.setDate(end.getDate() - 6);
    }
  } else {
    start = new Date(end);
    start.setDate(end.getDate() - (days - 1));
  }

  const totalDays =
    Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000)) + 1;
  const buckets = new Map<string, number>();
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    buckets.set(dayKey(d), 0);
  }

  for (const order of filtered) {
    const key = dayKey(order.createdAt);
    if (!buckets.has(key)) continue;
    const add = metric === "revenue" ? order.total : 1;
    buckets.set(key, (buckets.get(key) ?? 0) + add);
  }

  return [...buckets.entries()].map(([date, value]) => ({ date, value }));
}

function smoothPath(points: { x: number; y: number }[]) {
  if (points.length < 2) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? i : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-1.5 py-0.5 text-[10px] tracking-[0.08em] uppercase transition-colors",
        active
          ? "bg-muted text-foreground"
          : "text-muted-foreground/70 hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function FilterPanel({
  range,
  status,
  metric,
  onRange,
  onStatus,
  onMetric,
}: {
  range: RangeKey;
  status: StatusFilter;
  metric: MetricKey;
  onRange: (value: RangeKey) => void;
  onStatus: (value: StatusFilter) => void;
  onMetric: (value: MetricKey) => void;
}) {
  return (
    <div className="w-52 space-y-3 p-3">
      <div>
        <p className="mb-1 text-[9px] tracking-[0.14em] text-muted-foreground/70 uppercase">
          Range
        </p>
        <div className="flex flex-wrap gap-0.5">
          {RANGE_OPTIONS.map((option) => (
            <Chip
              key={option.key}
              active={range === option.key}
              onClick={() => onRange(option.key)}
            >
              {option.label}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1 text-[9px] tracking-[0.14em] text-muted-foreground/70 uppercase">
          Status
        </p>
        <div className="flex flex-wrap gap-0.5">
          {STATUS_FILTERS.map((option) => (
            <Chip
              key={option.key}
              active={status === option.key}
              onClick={() => onStatus(option.key)}
            >
              {option.label}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1 text-[9px] tracking-[0.14em] text-muted-foreground/70 uppercase">
          Metric
        </p>
        <div className="flex flex-wrap gap-0.5">
          <Chip
            active={metric === "revenue"}
            onClick={() => onMetric("revenue")}
          >
            Revenue
          </Chip>
          <Chip active={metric === "orders"} onClick={() => onMetric("orders")}>
            Orders
          </Chip>
        </div>
      </div>
    </div>
  );
}

function RevenueChart({
  data,
  metric,
}: {
  data: { date: string; value: number }[];
  metric: MetricKey;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<number | null>(null);

  const width = 720;
  const height = 280;
  const padL = 12;
  const padR = 12;
  const padT = 28;
  const padB = 30;
  const max = Math.max(...data.map((d) => d.value), 1);
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  const points = data.map((d, i) => {
    const x =
      padL + (data.length <= 1 ? chartW / 2 : (i / (data.length - 1)) * chartW);
    const y = padT + chartH - (d.value / max) * chartH;
    return { x, y, ...d };
  });

  const line = smoothPath(points);
  const area = points.length
    ? `${line} L ${points[points.length - 1].x} ${padT + chartH} L ${points[0].x} ${padT + chartH} Z`
    : "";
  const barW = Math.max(3, chartW / Math.max(data.length, 1) - 6);

  const labels = [0, Math.floor((data.length - 1) / 2), data.length - 1].filter(
    (v, i, arr) => data.length > 0 && arr.indexOf(v) === i
  );

  const activePoint = active != null ? points[active] : null;

  function onMove(clientX: number) {
    const el = wrapRef.current;
    if (!el || points.length === 0) return;
    const rect = el.getBoundingClientRect();
    const ratio = (clientX - rect.left) / rect.width;
    const svgX = ratio * width;
    let nearest = 0;
    let best = Infinity;
    points.forEach((p, i) => {
      const dist = Math.abs(p.x - svgX);
      if (dist < best) {
        best = dist;
        nearest = i;
      }
    });
    setActive(nearest);
  }

  function formatValue(value: number) {
    return metric === "revenue" ? formatPrice(value) : `${value} orders`;
  }

  return (
    <div
      ref={wrapRef}
      className="relative touch-pan-y"
      onMouseMove={(event) => onMove(event.clientX)}
      onMouseLeave={() => setActive(null)}
      onTouchStart={(event) => onMove(event.touches[0].clientX)}
      onTouchMove={(event) => onMove(event.touches[0].clientX)}
      onTouchEnd={() => setActive(null)}
    >
      {activePoint ? (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-sm bg-foreground px-3 py-2 text-background shadow-sm"
          style={{
            left: `${(activePoint.x / width) * 100}%`,
            top: `${(activePoint.y / height) * 100}%`,
            marginTop: -12,
          }}
        >
          <p className="text-[10px] tracking-[0.12em] text-background/65 uppercase">
            {fullDay(activePoint.date)}
          </p>
          <p className="mt-0.5 text-sm tabular-nums">
            {formatValue(activePoint.value)}
          </p>
        </div>
      ) : null}

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full cursor-crosshair"
        role="img"
        aria-label="Interactive revenue chart"
      >
        <defs>
          <linearGradient id="dashRevFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
            <stop offset="55%" stopColor="currentColor" stopOpacity="0.05" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="dashBar" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.03" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.16" />
          </linearGradient>
        </defs>

        {[0, 0.33, 0.66, 1].map((t) => {
          const y = padT + t * chartH;
          return (
            <line
              key={t}
              x1={padL}
              x2={width - padR}
              y1={y}
              y2={y}
              stroke="currentColor"
              strokeOpacity="0.07"
              strokeDasharray={t === 1 ? undefined : "3 6"}
            />
          );
        })}

        {points.map((p, i) => {
          const h = (p.value / max) * chartH;
          return (
            <rect
              key={`bar-${p.date}`}
              x={p.x - barW / 2}
              y={padT + chartH - h}
              width={barW}
              height={Math.max(h, 0)}
              fill="url(#dashBar)"
              opacity={active == null || active === i ? 1 : 0.35}
              rx="1"
            />
          );
        })}

        {area ? <path d={area} fill="url(#dashRevFill)" /> : null}
        {line ? (
          <path
            d={line}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ) : null}

        {activePoint ? (
          <line
            x1={activePoint.x}
            x2={activePoint.x}
            y1={padT}
            y2={padT + chartH}
            stroke="currentColor"
            strokeOpacity="0.2"
            strokeDasharray="3 4"
          />
        ) : null}

        {points.map((p, i) => {
          const show = p.value > 0 || active === i;
          if (!show) return null;
          const focused = active === i;
          return (
            <g key={`dot-${p.date}`}>
              <circle
                cx={p.x}
                cy={p.y}
                r={focused ? 8 : 5}
                fill="currentColor"
                opacity={focused ? 0.12 : 0.08}
              />
              <circle
                cx={p.x}
                cy={p.y}
                r={focused ? 4 : 2.5}
                fill="var(--background)"
                stroke="currentColor"
                strokeWidth="2"
              />
            </g>
          );
        })}

        {labels.map((i) =>
          points[i] ? (
            <text
              key={data[i].date}
              x={points[i].x}
              y={height - 6}
              textAnchor={
                i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"
              }
              fill="currentColor"
              opacity="0.45"
              style={{ fontSize: 11, letterSpacing: "0.08em" }}
            >
              {shortDay(data[i].date).toUpperCase()}
            </text>
          ) : null
        )}
      </svg>
    </div>
  );
}

function StatusRing({
  segments,
  selected,
  onSelect,
}: {
  segments: { label: OrderStatus; value: number; tone: number }[];
  selected?: StatusFilter;
  onSelect?: (status: OrderStatus) => void;
}) {
  const [hovered, setHovered] = useState<OrderStatus | null>(null);
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  const size = 200;
  const stroke = 22;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const cx = size / 2;
  const cy = size / 2;

  const built = useMemo(() => {
    let offset = 0;
    return segments.map((seg) => {
      const len = (seg.value / total) * c;
      const gap = Math.min(4, len * 0.08);
      const draw = Math.max(len - gap, 0);
      const startOffset = offset;
      offset += len;
      const mid = startOffset + len / 2;
      const angle = -Math.PI / 2 + (mid / c) * 2 * Math.PI;
      return {
        ...seg,
        draw,
        rest: c - draw,
        startOffset,
        pct: Math.round((seg.value / total) * 100),
        tipX: cx + Math.cos(angle) * (r + 8),
        tipY: cy + Math.sin(angle) * (r + 8),
      };
    });
  }, [segments, total, c, cx, cy, r]);

  const activeLabel =
    hovered ??
    (selected && selected !== "all" && selected !== "active" ? selected : null);
  const active = built.find((s) => s.label === activeLabel) ?? null;
  const centerValue = active ? active.value : total;
  const centerLabel = active ? active.label : "Orders";
  const centerPct = active ? `${active.pct}%` : null;

  return (
    <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-center">
      <div className="relative shrink-0">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          role="img"
          aria-label="Orders by status"
          className="overflow-visible"
        >
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.06"
            strokeWidth={stroke}
          />
          {built.map((seg) => {
            const isActive = !activeLabel || activeLabel === seg.label;
            const isFocused = activeLabel === seg.label;
            return (
              <circle
                key={seg.label}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke="currentColor"
                strokeOpacity={
                  isActive
                    ? isFocused
                      ? Math.min(seg.tone + 0.15, 1)
                      : seg.tone
                    : 0.12
                }
                strokeWidth={isFocused ? stroke + 4 : stroke}
                strokeDasharray={`${seg.draw} ${seg.rest}`}
                strokeDashoffset={-seg.startOffset}
                transform={`rotate(-90 ${cx} ${cy})`}
                strokeLinecap="butt"
                className="cursor-pointer transition-[stroke-width,stroke-opacity] duration-200"
                onMouseEnter={() => setHovered(seg.label)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => onSelect?.(seg.label)}
              />
            );
          })}
        </svg>

        {active ? (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-sm bg-background px-2.5 py-1.5 text-foreground shadow-sm ring-1 ring-border/60"
            style={{
              left: `${(active.tipX / size) * 100}%`,
              top: `${(active.tipY / size) * 100}%`,
              marginTop: -6,
            }}
          >
            <p className="text-[9px] tracking-[0.12em] text-muted-foreground uppercase">
              {active.label}
            </p>
            <p className="text-xs tabular-nums">
              {active.value}{" "}
              <span className="text-muted-foreground">· {active.pct}%</span>
            </p>
          </div>
        ) : null}

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="font-heading text-4xl tracking-tight">{centerValue}</p>
          <p className="mt-1 text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
            {centerLabel}
          </p>
          {centerPct ? (
            <p className="mt-0.5 text-[10px] tabular-nums text-muted-foreground">
              {centerPct}
            </p>
          ) : null}
        </div>
      </div>

      <ul className="w-full min-w-0 flex-1 space-y-2.5">
        {built.map((seg) => {
          const isActive = !activeLabel || activeLabel === seg.label;
          const isSelected = selected === seg.label;
          return (
            <li key={seg.label}>
              <button
                type="button"
                className={cn(
                  "w-full text-left transition-opacity duration-200",
                  isActive ? "opacity-100" : "opacity-35"
                )}
                onMouseEnter={() => setHovered(seg.label)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => onSelect?.(seg.label)}
              >
                <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2">
                    <span
                      className="size-2 shrink-0 bg-foreground"
                      style={{ opacity: seg.tone }}
                    />
                    <span
                      className={cn(
                        "text-muted-foreground",
                        (hovered === seg.label || isSelected) &&
                          "text-foreground"
                      )}
                    >
                      {seg.label}
                    </span>
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    <span className="text-foreground">{seg.value}</span>
                    <span className="mx-1.5 text-border">·</span>
                    {seg.pct}%
                  </span>
                </div>
                <div className="h-[2px] bg-foreground/5">
                  <div
                    className="h-[2px] bg-foreground transition-[width,opacity] duration-300"
                    style={{
                      width: `${seg.pct}%`,
                      opacity: isActive ? seg.tone : 0.15,
                    }}
                  />
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function statusTone(status: OrderStatus): number {
  switch (status) {
    case "Delivered":
      return 0.95;
    case "Shipped":
      return 0.72;
    case "Paid":
      return 0.52;
    case "Pending":
      return 0.32;
    case "Cancelled":
      return 0.16;
  }
}

const STAT_META = [
  { label: "Revenue", icon: Banknote },
  { label: "Orders", icon: ShoppingBag },
  { label: "Avg order", icon: Package },
  { label: "Customers", icon: Users },
] as const;

export default function AdminDashboardPage() {
  const { orders, customers } = useStore();
  const [range, setRange] = useState<RangeKey>("14");
  const [status, setStatus] = useState<StatusFilter>("active");
  const [metric, setMetric] = useState<MetricKey>("revenue");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!filtersOpen) return;
    function onPointerDown(event: MouseEvent) {
      if (!filterRef.current?.contains(event.target as Node)) {
        setFiltersOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setFiltersOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [filtersOpen]);

  const filteredOrders = useMemo(() => {
    const days = rangeDays(range);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    let start: Date | null = null;
    if (days != null) {
      start = new Date(end);
      start.setDate(end.getDate() - (days - 1));
      start.setHours(0, 0, 0, 0);
    }

    return orders.filter((order) => {
      if (!matchesStatus(order, status)) return false;
      if (!start) return true;
      const t = new Date(order.createdAt).getTime();
      return t >= start.getTime() && t <= end.getTime();
    });
  }, [orders, range, status]);

  const revenue = filteredOrders.reduce((sum, order) => sum + order.total, 0);
  const orderCount = filteredOrders.length;
  const avgOrder = orderCount ? revenue / orderCount : 0;

  const series = useMemo(
    () => buildSeries(orders, range, status, metric),
    [orders, range, status, metric]
  );

  const periodTotal = series.reduce((s, d) => s + d.value, 0);
  const peakDay = useMemo(() => {
    return series.reduce(
      (best, d) => (d.value > best.value ? d : best),
      series[0] ?? { date: "", value: 0 }
    );
  }, [series]);

  const statusSegments = useMemo(() => {
    const days = rangeDays(range);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    let start: Date | null = null;
    if (days != null) {
      start = new Date(end);
      start.setDate(end.getDate() - (days - 1));
      start.setHours(0, 0, 0, 0);
    }

    const inRange = orders.filter((order) => {
      if (!start) return true;
      const t = new Date(order.createdAt).getTime();
      return t >= start.getTime() && t <= end.getTime();
    });

    const counts = Object.fromEntries(STATUS_ORDER.map((s) => [s, 0])) as Record<
      OrderStatus,
      number
    >;
    for (const order of inRange) counts[order.status] += 1;
    return STATUS_ORDER.filter((s) => counts[s] > 0).map((label) => ({
      label,
      value: counts[label],
      tone: statusTone(label),
    }));
  }, [orders, range]);

  const stats = [
    { label: "Revenue", value: formatPrice(revenue) },
    { label: "Orders", value: String(orderCount) },
    { label: "Avg order", value: formatPrice(avgOrder) },
    { label: "Customers", value: String(customers.length) },
  ];

  const rangeLabel =
    RANGE_OPTIONS.find((option) => option.key === range)?.label ?? "14d";
  const statusLabel =
    STATUS_FILTERS.find((option) => option.key === status)?.label ?? "Active";

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const meta = STAT_META.find((m) => m.label === stat.label);
          const Icon = meta?.icon ?? Package;
          return (
            <div
              key={stat.label}
              className="group relative overflow-hidden bg-muted/35 px-5 py-5 transition-colors hover:bg-muted/55"
            >
              <div className="pointer-events-none absolute -top-10 -right-8 size-28 rounded-full bg-foreground/[0.03]" />
              <div className="flex items-start justify-between gap-3">
                <p className="text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
                  {stat.label}
                </p>
                <Icon className="size-4 text-muted-foreground/70" />
              </div>
              <p className="mt-4 font-heading text-3xl tracking-tight">
                {stat.value}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.9fr)]">
        <section className="relative bg-muted/35 px-6 py-6 md:px-8 md:py-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[10px] tracking-[0.22em] text-muted-foreground uppercase">
                {metric === "revenue" ? "Revenue" : "Orders"} · {rangeLabel}
              </p>
              <p className="mt-2 font-heading text-4xl tracking-tight md:text-5xl">
                {metric === "revenue" ? formatPrice(periodTotal) : periodTotal}
              </p>
              {peakDay.value > 0 ? (
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Peak {shortDay(peakDay.date)} ·{" "}
                  {metric === "revenue"
                    ? formatPrice(peakDay.value)
                    : `${peakDay.value} orders`}
                </p>
              ) : null}
            </div>

            <div ref={filterRef} className="relative shrink-0">
              <button
                type="button"
                onClick={() => setFiltersOpen((open) => !open)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-2 py-1 text-[10px] tracking-[0.12em] text-muted-foreground uppercase transition-colors hover:text-foreground",
                  filtersOpen && "text-foreground"
                )}
                aria-expanded={filtersOpen}
                aria-label="Toggle chart filters"
              >
                {filtersOpen ? (
                  <X className="size-3" />
                ) : (
                  <SlidersHorizontal className="size-3" />
                )}
                Filters
              </button>

              {filtersOpen ? (
                <div className="absolute top-full right-0 z-20 mt-2 border border-border/50 bg-background/95 shadow-sm backdrop-blur-sm">
                  <FilterPanel
                    range={range}
                    status={status}
                    metric={metric}
                    onRange={setRange}
                    onStatus={setStatus}
                    onMetric={setMetric}
                  />
                  <p className="border-t border-border/40 px-3 py-2 text-[9px] tracking-[0.08em] text-muted-foreground/70 uppercase">
                    {rangeLabel} · {statusLabel} · {metric}
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-6 text-foreground">
            <RevenueChart data={series} metric={metric} />
          </div>
        </section>

        <section className="bg-muted/35 px-6 py-6 md:px-7 md:py-8">
          <p className="mb-6 text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
            Order status · {rangeLabel}
          </p>
          {statusSegments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            <StatusRing
              segments={statusSegments}
              selected={status}
              onSelect={(value) =>
                setStatus((current) => (current === value ? "active" : value))
              }
            />
          )}
        </section>
      </div>
    </div>
  );
}
