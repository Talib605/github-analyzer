/* Pure helpers that turn raw GitHub API data into dashboard numbers. */

const DAY = 864e5;
export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const LEVELS = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
};

export const flattenDays = (collection) =>
  collection?.contributionCalendar?.weeks?.flatMap((w) => w.contributionDays) ?? [];

/** Contributions summed per month, oldest → newest. */
export const monthlyContributions = (days) => {
  const map = new Map();
  days.forEach((d) => {
    const key = d.date.slice(0, 7);
    map.set(key, (map.get(key) || 0) + d.contributionCount);
  });
  return [...map.entries()].map(([key, value]) => {
    const [y, m] = key.split("-");
    return { label: `${MONTHS[Number(m) - 1]} ${y.slice(2)}`, value };
  });
};

export const reposPerYear = (repos) => {
  const map = new Map();
  repos.forEach((r) => {
    const y = new Date(r.created_at).getFullYear();
    map.set(y, (map.get(y) || 0) + 1);
  });
  const years = [...map.keys()].sort();
  if (!years.length) return [];
  const out = [];
  for (let y = years[0]; y <= years[years.length - 1]; y++) out.push({ label: String(y), value: map.get(y) || 0 });
  return out;
};

/** Count of timestamps per week for the last `weeks` weeks (sparkline data). */
export const weeklySeries = (timestamps, weeks = 12) => {
  const now = Date.now();
  const buckets = new Array(weeks).fill(0);
  timestamps.forEach((t) => {
    const idx = Math.floor((now - t) / (7 * DAY));
    if (idx >= 0 && idx < weeks) buckets[weeks - 1 - idx] += 1;
  });
  return buckets.map((v, i) => ({ i, v }));
};

export const weeklySeriesFromDays = (days, weeks = 12) => {
  const recent = days.slice(-weeks * 7);
  const out = [];
  for (let i = 0; i < recent.length; i += 7) {
    out.push({ i: out.length, v: recent.slice(i, i + 7).reduce((s, d) => s + d.contributionCount, 0) });
  }
  return out;
};

/**
 * Compare the last 30 days with the 30 before.
 * Search results only include the latest 100 items, so if those 100 items
 * don't reach back 60 days we can't compute a fair trend.
 */
export const trendFromTimestamps = (timestamps, total, windowDays = 30) => {
  const now = Date.now();
  const W = windowDays * DAY;
  const current = timestamps.filter((t) => now - t < W).length;
  const previous = timestamps.filter((t) => now - t >= W && now - t < 2 * W).length;
  const capped = timestamps.length < total;
  const oldest = timestamps.length ? Math.min(...timestamps) : now;
  const span = Math.max(1, Math.round((now - oldest) / DAY));
  if (capped && now - oldest < 2 * W) {
    return { kind: "busy", text: `${timestamps.length}+ in the last ${span} days`, sub: "Very active" };
  }
  return describeTrend(current, previous, windowDays);
};

export const trendFromDays = (days, windowDays = 30) => {
  const recent = days.slice(-windowDays).reduce((s, d) => s + d.contributionCount, 0);
  const before = days.slice(-2 * windowDays, -windowDays).reduce((s, d) => s + d.contributionCount, 0);
  return describeTrend(recent, before, windowDays);
};

const describeTrend = (current, previous, windowDays) => {
  const sub = `${current} in last ${windowDays} days`;
  if (current === 0 && previous === 0) return { kind: "flat", text: "No recent activity", sub: `Last ${windowDays * 2} days` };
  if (previous === 0) return { kind: "up", text: "New activity", sub };
  const pct = ((current - previous) / previous) * 100;
  if (Math.abs(pct) < 0.5) return { kind: "flat", text: "No change", sub };
  return {
    kind: pct > 0 ? "up" : "down",
    text: `${Math.abs(pct).toFixed(1).replace(/\.0$/, "")}%`,
    sub: `${sub} vs previous ${windowDays}`,
  };
};

export const contributionStreaks = (days) => {
  let longest = 0;
  let run = 0;
  days.forEach((d) => {
    run = d.contributionCount > 0 ? run + 1 : 0;
    longest = Math.max(longest, run);
  });
  // current streak: today may still be 0, so start from yesterday in that case
  let i = days.length - 1;
  if (i >= 0 && days[i].contributionCount === 0) i -= 1;
  let current = 0;
  while (i >= 0 && days[i].contributionCount > 0) {
    current += 1;
    i -= 1;
  }
  const best = days.reduce((b, d) => (d.contributionCount > (b?.contributionCount ?? -1) ? d : b), null);
  const activeDays = days.filter((d) => d.contributionCount > 0).length;
  return { current, longest, best, activeDays };
};

export const byWeekday = (items) => {
  const counts = new Array(7).fill(0);
  items.forEach(({ weekday, count }) => {
    counts[weekday] += count;
  });
  return WEEKDAYS.map((label, i) => ({ label, value: counts[i] }));
};

export const topRepositories = (repos, n = 5) => {
  const own = repos.filter((r) => !r.fork);
  const list = own.length ? own : repos;
  return [...list]
    .sort(
      (a, b) =>
        b.stargazers_count - a.stargazers_count ||
        b.forks_count - a.forks_count ||
        new Date(b.pushed_at) - new Date(a.pushed_at)
    )
    .slice(0, n);
};

export const languageBreakdown = (totals, top = 5) => {
  const entries = Object.entries(totals || {}).sort((a, b) => b[1] - a[1]);
  const sum = entries.reduce((s, [, v]) => s + v, 0);
  if (!sum) return [];
  const head = entries.slice(0, top).map(([name, v]) => ({ name, value: (v / sum) * 100 }));
  const rest = entries.slice(top).reduce((s, [, v]) => s + v, 0);
  if (rest > 0) head.push({ name: "Other", value: (rest / sum) * 100 });
  return head;
};
