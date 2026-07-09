import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { levelFromXp } from "@/lib/gamification";

export interface XpPoint {
  /** ISO date or short label, e.g. "Mon", "2026-05-04". */
  date: string;
  /** XP earned that day. */
  xp: number;
}

export interface XpChartProps {
  data: XpPoint[];
  height?: number;
  days?: 7 | 30;
}

/**
 * XpChart — a small Recharts area chart of XP earned over time,
 * used on the dashboard and the achievements page.
 */
export function XpChart({ data, height = 200, days = 7 }: XpChartProps) {
  const cumulative = cumulativeSeries(data);
  const fmt = days === 30 ? "short" : days === 7 ? "weekday" : "auto";

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={cumulative} margin={{ top: 6, right: 6, bottom: 0, left: -18 }}>
        <defs>
          <linearGradient id="xp-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-xp)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--chart-xp)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          tickFormatter={(v) => formatLabel(v, fmt)}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          width={36}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          labelStyle={{ fontSize: 11, color: "var(--muted-foreground)" }}
          formatter={(value) => [`${Number(value).toLocaleString()} XP`, "Cumulative"]}
        />
        <Area
          type="monotone"
          dataKey="cumulative"
          stroke="var(--chart-xp)"
          strokeWidth={2}
          fill="url(#xp-grad)"
          dot={{ r: 3, fill: "var(--chart-xp)", stroke: "var(--background)", strokeWidth: 1 }}
          activeDot={{ r: 5 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

const tooltipStyle: React.CSSProperties = {
  backgroundColor: "var(--popover)",
  color: "var(--popover-foreground)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
  padding: "8px 10px",
  boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
};

function cumulativeSeries(
  data: XpPoint[],
): Array<{ label: string; cumulative: number; xp: number }> {
  let acc = 0;
  return data.map((p) => {
    acc += p.xp;
    return { label: p.date, cumulative: acc, xp: p.xp };
  });
}

function formatLabel(value: string, fmt: "weekday" | "short" | "auto"): string {
  if (fmt === "weekday") {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d.toLocaleDateString("en-US", { weekday: "short" });
  }
  if (fmt === "short") {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString("en-US", { month: "numeric", day: "numeric" });
    }
  }
  return value;
}

/** Build a sample 7/30-day series (used everywhere the backend isn't ready yet). */
export function buildXpSeries(dailyXps: number[], startDate: Date = new Date()): XpPoint[] {
  const out: XpPoint[] = [];
  const today = new Date(startDate);
  for (let i = dailyXps.length - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    out.push({ date: d.toISOString().slice(0, 10), xp: dailyXps[i] ?? 0 });
  }
  return out;
}

/** Use level progression + a flat-series to estimate a plausible series from a total. */
export function seriesFromXpTrail(trailDays: number, totalXp: number): XpPoint[] {
  const days = Math.max(7, trailDays);
  const base = Math.max(40, Math.round((totalXp || 0) / Math.max(1, Math.ceil(days * 0.6))));
  const jitter = () => Math.round((Math.random() * 0.6 - 0.1) * base);
  return buildXpSeries(
    Array.from({ length: days }, (_, i) =>
      i === Math.floor(days / 2) ? Math.round(base * 2.4) : Math.max(0, base + jitter()),
    ),
  );
}

/** Helper: returns milestone label (e.g. "Level 4 needed") for a total XP. */
export function nextMilestoneLabel(totalXp: number): string {
  const { level, xpForNextLevel, xpIntoLevel } = levelFromXp(totalXp);
  const remaining = xpForNextLevel - xpIntoLevel;
  return remaining > 0
    ? `${remaining.toLocaleString()} XP to Level ${level + 1}`
    : `Level ${level} maxed`;
}
