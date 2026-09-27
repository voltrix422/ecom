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
    year: number;
    all: number;
  };
  pageviews: {
    today: number;
    yesterday: number;
    week: number;
    month: number;
    year: number;
    all: number;
  };
  pages: {
    path: string;
    views: number;
    visitors: number;
    avgSeconds: number;
    totalSeconds: number;
  }[];
  features: { feature: string; count: number; visitors: number }[];
  daily: { day: string; visitors: number; pageviews: number }[];
};

let migrated = false;

async function ensureTable() {
  if (migrated) return;
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
  });
  migrated = true;
}

function cleanPath(path: string) {
  const raw = path.trim() || "/";
  try {
    const url = new URL(raw, "https://ayeshaswear.store");
    return (url.pathname || "/").slice(0, 240);
  } catch {
    return raw.split("?")[0]?.slice(0, 240) || "/";
  }
}

export async function recordPixelEvents(events: PixelEventInput[]) {
  if (!events.length) return;
  await ensureTable();
  await withClient(async (client) => {
    for (const event of events) {
      const visitorId = event.visitorId.trim().slice(0, 80);
      const sessionId = event.sessionId.trim().slice(0, 80);
      if (!visitorId || !sessionId) continue;
      if (!["pageview", "heartbeat", "feature"].includes(event.type)) continue;
      await client.query(
        `INSERT INTO analytics_events
          (visitor_id, session_id, event_type, path, feature, duration_ms, referrer, user_agent, is_admin)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          visitorId,
          sessionId,
          event.type,
          cleanPath(event.path),
          event.feature?.trim().slice(0, 80) || null,
          Math.max(0, Math.min(event.durationMs || 0, 60 * 60 * 1000)),
          event.referrer?.trim().slice(0, 300) || null,
          event.userAgent?.trim().slice(0, 300) || null,
          Boolean(event.isAdmin),
        ]
      );
    }
  });
}

function emptySummary(): AnalyticsSummary {
  return {
    visitors: { today: 0, yesterday: 0, week: 0, month: 0, year: 0, all: 0 },
    pageviews: { today: 0, yesterday: 0, week: 0, month: 0, year: 0, all: 0 },
    pages: [],
    features: [],
    daily: [],
  };
}

async function countVisitors(since?: string, until?: string) {
  return withClient(async (client) => {
    const params: string[] = [];
    let where = "WHERE is_admin = FALSE";
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
    let where = "WHERE is_admin = FALSE AND event_type = 'pageview'";
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
  const year = startOfLocalDay(-364);

  const [
    visitorsToday,
    visitorsYesterday,
    visitorsWeek,
    visitorsMonth,
    visitorsYear,
    visitorsAll,
    viewsToday,
    viewsYesterday,
    viewsWeek,
    viewsMonth,
    viewsYear,
    viewsAll,
  ] = await Promise.all([
    countVisitors(today),
    countVisitors(yesterday, today),
    countVisitors(week),
    countVisitors(month),
    countVisitors(year),
    countVisitors(),
    countPageviews(today),
    countPageviews(yesterday, today),
    countPageviews(week),
    countPageviews(month),
    countPageviews(year),
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
         COALESCE(SUM(duration_ms), 0)::text AS total_ms
       FROM analytics_events
       WHERE is_admin = FALSE
         AND created_at >= $1::timestamptz
         AND event_type IN ('pageview', 'heartbeat')
       GROUP BY path
       ORDER BY COUNT(*) FILTER (WHERE event_type = 'pageview') DESC
       LIMIT 20`,
      [month]
    );
    return rows.map((row) => {
      const views = Number(row.views || 0);
      const totalMs = Number(row.total_ms || 0);
      return {
        path: row.path,
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
       WHERE is_admin = FALSE
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
         to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day,
         COUNT(DISTINCT visitor_id)::text AS visitors,
         COUNT(*) FILTER (WHERE event_type = 'pageview')::text AS pageviews
       FROM analytics_events
       WHERE is_admin = FALSE
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
      year: visitorsYear,
      all: visitorsAll,
    },
    pageviews: {
      today: viewsToday,
      yesterday: viewsYesterday,
      week: viewsWeek,
      month: viewsMonth,
      year: viewsYear,
      all: viewsAll,
    },
    pages,
    features,
    daily,
  };
}
