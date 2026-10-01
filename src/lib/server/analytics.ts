import { withClient } from "@/lib/server/db";

export type PixelEventInput = {
  visitorId: string;
  sessionId: string;
  type: "pageview" | "heartbeat" | "feature";
  path: string;
  feature?: string;
  durationMs?: number;
  referrer?: string;
  userAgent?: string;
  isAdmin?: boolean;
};

export type AnalyticsSummary = {
  visitors: {
    today: number;
    yesterday: number;
    week: number;
    month: number;
    all: number;
  };
  pageviews: {
    today: number;
    yesterday: number;
    week: number;
    month: number;
    all: number;
  };
  pages: {
    path: string;
    label: string;
    views: number;
    visitors: number;
    avgSeconds: number;
    totalSeconds: number;
  }[];
  features: { feature: string; label: string; count: number; visitors: number }[];
  daily: { day: string; visitors: number; pageviews: number }[];
};

let ready = false;

const BOT_UA =
  /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|bytespider|gptbot|claudebot|wget|curl|python-requests|headless/i;

export function isInternalPath(path: string) {
  const p = path.toLowerCase();
  return (
    p.startsWith("/api") ||
    p.startsWith("/admin") ||
    p.includes("/admin") ||
    p.startsWith("/mian/") ||
    /^\/mian(\/|$)/.test(p) ||
    p.startsWith("/_next") ||
    p.startsWith("/media")
  );
}

/** Store paths under /main collapse to clean public paths. */
export function normalizeAnalyticsPath(path: string) {
  let raw = path.trim() || "/";
  try {
    raw = new URL(raw, "https://ayeshaswear.store").pathname || "/";
  } catch {
    raw = raw.split("?")[0] || "/";
  }
  raw = raw.replace(/\/{2,}/g, "/");
  if (raw.length > 1 && raw.endsWith("/")) raw = raw.slice(0, -1);
  raw = raw.replace(/^\/mian(\/|$)/i, "/main$1");

  if (raw === "/main") return "/store";
  if (raw.startsWith("/main/")) {
    const rest = raw.slice("/main".length);
    return rest || "/store";
  }
  if (raw === "/" || raw === "") return "/launch";
  return raw.slice(0, 240);
}

export function pageLabel(path: string) {
  if (path === "/launch") return "Coming soon";
  if (path === "/store" || path === "/") return "Store home";
  if (path === "/shop") return "Shop";
  if (path === "/cart") return "Bag";
  if (path === "/checkout") return "Checkout";
  if (path === "/checkout/success") return "Order success";
  if (path === "/track") return "Track order";
  if (path === "/help") return "Help / refund";
  if (path === "/about") return "About";
  if (path.startsWith("/product/")) {
    const slug = path.slice("/product/".length).replace(/-/g, " ");
    return slug ? `Product · ${slug}` : "Product";
  }
  return path;
}

export function featureLabel(feature: string) {
  const map: Record<string, string> = {
    add_to_bag: "Add to bag",
    place_order: "Place order",
    notify_me: "Notify me",
    search: "Search",
  };
  return map[feature] || feature.replace(/_/g, " ");
}

async function ensureTable() {
  if (ready) return;
  await withClient(async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS analytics_events (
        id BIGSERIAL PRIMARY KEY,
        visitor_id TEXT NOT NULL,
        session_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        path TEXT NOT NULL,
        feature TEXT,
        duration_ms INTEGER NOT NULL DEFAULT 0,
        referrer TEXT,
        user_agent TEXT,
        is_admin BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS analytics_events_created_at_idx
      ON analytics_events (created_at)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS analytics_events_visitor_created_idx
      ON analytics_events (visitor_id, created_at)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS analytics_events_path_created_idx
      ON analytics_events (path, created_at)
    `);

    // Drop admin / junk hits that polluted early data
    await client.query(`
      DELETE FROM analytics_events
      WHERE is_admin = TRUE
         OR path ILIKE '%/admin%'
         OR path ILIKE '/mian%'
         OR path ILIKE '/api%'
         OR path ILIKE '/_next%'
    `);

    // Normalize /main store paths into clean public paths
    await client.query(`
      UPDATE analytics_events
      SET path = CASE
        WHEN path = '/main' OR path = '/main/' THEN '/store'
        WHEN path LIKE '/main/%' THEN substring(path from 6)
        WHEN path = '/' THEN '/launch'
        ELSE path
      END
      WHERE path = '/'
         OR path = '/main'
         OR path = '/main/'
         OR path LIKE '/main/%'
    `);

    // Fix leftover leading-slash issues after substring
    await client.query(`
      UPDATE analytics_events
      SET path = '/' || path
      WHERE path <> '' AND path NOT LIKE '/%'
    `);
    await client.query(`
      UPDATE analytics_events
      SET path = '/store'
      WHERE path = '' OR path IS NULL
    `);
  });
  ready = true;
}

const REAL_WHERE = `
  is_admin = FALSE
  AND path NOT ILIKE '%/admin%'
  AND path NOT ILIKE '/mian%'
  AND path NOT ILIKE '/api%'
  AND path NOT IN ('/admin')
`;

export async function recordPixelEvents(events: PixelEventInput[]) {
  if (!events.length) return;
  await ensureTable();
  await withClient(async (client) => {
    for (const event of events) {
      if (event.isAdmin) continue;
      if (event.userAgent && BOT_UA.test(event.userAgent)) continue;

      const visitorId = event.visitorId.trim().slice(0, 80);
      const sessionId = event.sessionId.trim().slice(0, 80);
      if (!visitorId || !sessionId) continue;
      if (!["pageview", "heartbeat", "feature"].includes(event.type)) continue;

      const path = normalizeAnalyticsPath(event.path);
      if (isInternalPath(event.path) || isInternalPath(path)) continue;

      await client.query(
        `INSERT INTO analytics_events
          (visitor_id, session_id, event_type, path, feature, duration_ms, referrer, user_agent, is_admin)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE)`,
        [
          visitorId,
          sessionId,
          event.type,
          path,
          event.feature?.trim().slice(0, 80) || null,
          Math.max(0, Math.min(event.durationMs || 0, 60 * 60 * 1000)),
          event.referrer?.trim().slice(0, 300) || null,
          event.userAgent?.trim().slice(0, 300) || null,
        ]
      );
    }
  });
}

function emptySummary(): AnalyticsSummary {
  return {
    visitors: { today: 0, yesterday: 0, week: 0, month: 0, all: 0 },
    pageviews: { today: 0, yesterday: 0, week: 0, month: 0, all: 0 },
    pages: [],
    features: [],
    daily: [],
  };
}

async function countVisitors(since?: string, until?: string) {
  return withClient(async (client) => {
    const params: string[] = [];
    let where = `WHERE ${REAL_WHERE}`;
    if (since) {
      params.push(since);
      where += ` AND created_at >= $${params.length}::timestamptz`;
    }
    if (until) {
      params.push(until);
      where += ` AND created_at < $${params.length}::timestamptz`;
    }
    const { rows } = await client.query<{ count: string }>(
      `SELECT COUNT(DISTINCT visitor_id)::text AS count
       FROM analytics_events
       ${where}`,
      params
    );
    return Number(rows[0]?.count || 0);
  });
}

async function countPageviews(since?: string, until?: string) {
  return withClient(async (client) => {
    const params: string[] = [];
    let where = `WHERE ${REAL_WHERE} AND event_type = 'pageview'`;
    if (since) {
      params.push(since);
      where += ` AND created_at >= $${params.length}::timestamptz`;
    }
    if (until) {
      params.push(until);
      where += ` AND created_at < $${params.length}::timestamptz`;
    }
    const { rows } = await client.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM analytics_events ${where}`,
      params
    );
    return Number(rows[0]?.count || 0);
  });
}

function startOfLocalDay(offsetDays = 0) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString();
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  try {
    await ensureTable();
  } catch {
    return emptySummary();
  }

  const today = startOfLocalDay(0);
  const yesterday = startOfLocalDay(-1);
  const week = startOfLocalDay(-6);
  const month = startOfLocalDay(-29);

  const [
    visitorsToday,
    visitorsYesterday,
    visitorsWeek,
    visitorsMonth,
    visitorsAll,
    viewsToday,
    viewsYesterday,
    viewsWeek,
    viewsMonth,
    viewsAll,
  ] = await Promise.all([
    countVisitors(today),
    countVisitors(yesterday, today),
    countVisitors(week),
    countVisitors(month),
    countVisitors(),
    countPageviews(today),
    countPageviews(yesterday, today),
    countPageviews(week),
    countPageviews(month),
    countPageviews(),
  ]);

  const pages = await withClient(async (client) => {
    const { rows } = await client.query<{
      path: string;
      views: string;
      visitors: string;
      total_ms: string;
    }>(
      `SELECT
         path,
         COUNT(*) FILTER (WHERE event_type = 'pageview')::text AS views,
         COUNT(DISTINCT visitor_id)::text AS visitors,
         COALESCE(SUM(duration_ms) FILTER (WHERE event_type = 'heartbeat'), 0)::text AS total_ms
       FROM analytics_events
       WHERE ${REAL_WHERE}
         AND created_at >= $1::timestamptz
         AND event_type IN ('pageview', 'heartbeat')
       GROUP BY path
       HAVING COUNT(*) FILTER (WHERE event_type = 'pageview') > 0
       ORDER BY COUNT(*) FILTER (WHERE event_type = 'pageview') DESC
       LIMIT 20`,
      [month]
    );
    return rows.map((row) => {
      const views = Number(row.views || 0);
      const totalMs = Number(row.total_ms || 0);
      return {
        path: row.path,
        label: pageLabel(row.path),
        views,
        visitors: Number(row.visitors || 0),
        totalSeconds: Math.round(totalMs / 1000),
        avgSeconds: views > 0 ? Math.round(totalMs / 1000 / views) : 0,
      };
    });
  });

  const features = await withClient(async (client) => {
    const { rows } = await client.query<{
      feature: string;
      count: string;
      visitors: string;
    }>(
      `SELECT
         feature,
         COUNT(*)::text AS count,
         COUNT(DISTINCT visitor_id)::text AS visitors
       FROM analytics_events
       WHERE ${REAL_WHERE}
         AND event_type = 'feature'
         AND feature IS NOT NULL
         AND created_at >= $1::timestamptz
       GROUP BY feature
       ORDER BY COUNT(*) DESC
       LIMIT 20`,
      [month]
    );
    return rows.map((row) => ({
      feature: row.feature,
      label: featureLabel(row.feature),
      count: Number(row.count || 0),
      visitors: Number(row.visitors || 0),
    }));
  });

  const daily = await withClient(async (client) => {
    const { rows } = await client.query<{
      day: string;
      visitors: string;
      pageviews: string;
    }>(
      `SELECT
         to_char((created_at AT TIME ZONE 'Asia/Karachi'), 'YYYY-MM-DD') AS day,
         COUNT(DISTINCT visitor_id)::text AS visitors,
         COUNT(*) FILTER (WHERE event_type = 'pageview')::text AS pageviews
       FROM analytics_events
       WHERE ${REAL_WHERE}
         AND created_at >= $1::timestamptz
       GROUP BY 1
       ORDER BY 1 ASC`,
      [month]
    );
    return rows.map((row) => ({
      day: row.day,
      visitors: Number(row.visitors || 0),
      pageviews: Number(row.pageviews || 0),
    }));
  });

  return {
    visitors: {
      today: visitorsToday,
      yesterday: visitorsYesterday,
      week: visitorsWeek,
      month: visitorsMonth,
      all: visitorsAll,
    },
    pageviews: {
      today: viewsToday,
      yesterday: viewsYesterday,
      week: viewsWeek,
      month: viewsMonth,
      all: viewsAll,
    },
    pages,
    features,
    daily,
  };
}
