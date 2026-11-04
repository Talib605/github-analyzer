import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import "../CSS/Views.css";
import { useGitHub } from "../Context/GitHubContext";
import { EmptyState, InlineError, Skeleton, ViewHeader, tooltipProps } from "../components/ui";
import { describeEvent } from "../components/RecentActivity";
import { formatDate, formatNumber, languageColor } from "../utils/format";
import { byWeekday, contributionStreaks, flattenDays, reposPerYear } from "../utils/stats";

const EVENT_COLORS = {
  push: "#7c85ff",
  pull: "#3fb950",
  issue: "#f85149",
  comment: "#58a6ff",
  star: "#e3b341",
  fork: "#a371f7",
  create: "#2dd4bf",
  release: "#f778ba",
  delete: "#8b949e",
  other: "#6e7681",
};
const EVENT_LABELS = {
  push: "Pushes",
  pull: "Pull requests",
  issue: "Issues",
  comment: "Comments",
  star: "Stars",
  fork: "Forks",
  create: "Created",
  release: "Releases",
  delete: "Deletions",
  other: "Other",
};

const ChartCard = ({ title, subtitle, children, height = 240, loading, error, empty }) => (
  <section className="panel chart-panel">
    <h3>{title}</h3>
    {subtitle && <p className="card-subtitle">{subtitle}</p>}
    {loading ? (
      <Skeleton height={height} radius={10} />
    ) : error ? (
      <InlineError error={error} />
    ) : empty ? (
      <EmptyState compact icon="fa-solid fa-chart-simple" title={empty} />
    ) : (
      <div style={{ height }}>{children}</div>
    )}
  </section>
);

const Analytics = () => {
  const { profile, chart, hasToken } = useGitHub();
  const { user, repos, events, contributions, pending, errors } = profile;
  const tip = tooltipProps(chart);
  const axis = { tick: { fill: chart.axis, fontSize: 11 }, axisLine: false, tickLine: false };

  const own = useMemo(() => (repos || []).filter((r) => !r.fork), [repos]);
  const days = useMemo(() => flattenDays(contributions), [contributions]);

  const kpis = useMemo(() => {
    if (!repos) return null;
    const stars = repos.reduce((s, r) => s + r.stargazers_count, 0);
    const forks = repos.reduce((s, r) => s + r.forks_count, 0);
    const langCount = {};
    own.forEach((r) => r.language && (langCount[r.language] = (langCount[r.language] || 0) + 1));
    const topLang = Object.entries(langCount).sort((a, b) => b[1] - a[1])[0]?.[0];
    const years = (Date.now() - new Date(user.created_at)) / (365.25 * 864e5);
    return [
      { label: "Stars earned", value: formatNumber(stars), icon: "fa-solid fa-star" },
      { label: "Forks of their work", value: formatNumber(forks), icon: "fa-solid fa-code-fork" },
      { label: "Avg. stars / repo", value: repos.length ? (stars / repos.length).toFixed(1) : "0", icon: "fa-solid fa-chart-simple" },
      { label: "Original repos", value: `${own.length} / ${repos.length}`, icon: "fa-solid fa-book" },
      { label: "Most used language", value: topLang || "—", icon: "fa-solid fa-code" },
      { label: "On GitHub for", value: `${years.toFixed(1)} yrs`, icon: "fa-solid fa-hourglass-half" },
    ];
  }, [repos, own, user.created_at]);

  const starData = useMemo(
    () =>
      [...own]
        .filter((r) => r.stargazers_count > 0)
        .sort((a, b) => b.stargazers_count - a.stargazers_count)
        .slice(0, 10)
        .map((r) => ({ label: r.name, value: r.stargazers_count })),
    [own]
  );

  const yearData = useMemo(() => reposPerYear(repos || []), [repos]);

  const langData = useMemo(() => {
    const map = {};
    own.forEach((r) => r.language && (map[r.language] = (map[r.language] || 0) + 1));
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([label, value]) => ({ label, value, color: languageColor(label) }));
  }, [own]);

  const weekdayData = useMemo(() => {
    if (days.length) return byWeekday(days.map((d) => ({ weekday: d.weekday, count: d.contributionCount })));
    if (events?.length) return byWeekday(events.map((e) => ({ weekday: new Date(e.created_at).getDay(), count: 1 })));
    return [];
  }, [days, events]);

  const eventData = useMemo(() => {
    const map = {};
    (events || []).forEach((e) => {
      const t = describeEvent(e).type;
      map[t] = (map[t] || 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([type, value]) => ({ label: EVENT_LABELS[type] || type, value, color: EVENT_COLORS[type] || "#6e7681" }));
  }, [events]);

  const streaks = days.length ? contributionStreaks(days) : null;

  return (
    <div className="view">
      <ViewHeader icon="fa-solid fa-chart-line" title="Analytics" subtitle={`A deeper look at @${user.login}'s public GitHub footprint`} />

      <div className="kpi-grid">
        {kpis
          ? kpis.map((k) => (
              <div className="kpi panel" key={k.label}>
                <i className={k.icon} aria-hidden="true" />
                <span>{k.label}</span>
                <strong>{k.value}</strong>
              </div>
            ))
          : Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height={92} radius={12} />)}
      </div>

      {streaks && (
        <div className="streaks panel">
          <div>
            <span>Current streak</span>
            <strong>{streaks.current} days</strong>
          </div>
          <div>
            <span>Longest streak (1y)</span>
            <strong>{streaks.longest} days</strong>
          </div>
          <div>
            <span>Active days (1y)</span>
            <strong>{streaks.activeDays} / {days.length}</strong>
          </div>
          <div>
            <span>Busiest day</span>
            <strong>
              {streaks.best?.contributionCount || 0}
              <small> on {formatDate(`${streaks.best?.date}T00:00:00`)}</small>
            </strong>
          </div>
        </div>
      )}
      {!hasToken && (
        <p className="hint panel-hint">
          <i className="fa-solid fa-key" aria-hidden="true" /> Add a GitHub token in Settings to unlock streaks and contribution-based charts.
        </p>
      )}

      <div className="chart-grid">
        <ChartCard title="Most starred repositories" subtitle="Top 10 original repos" loading={pending.repos} error={errors.repos} empty={!starData.length && "No starred repositories yet"} height={Math.max(200, starData.length * 30)}>
          <ResponsiveContainer>
            <BarChart data={starData} layout="vertical" margin={{ left: 0, right: 16 }}>
              <CartesianGrid stroke={chart.grid} horizontal={false} />
              <XAxis type="number" {...axis} tickFormatter={formatNumber} />
              <YAxis type="category" dataKey="label" width={130} {...axis} tickFormatter={(v) => (v.length > 17 ? `${v.slice(0, 16)}…` : v)} />
              <Tooltip {...tip} formatter={(v) => [formatNumber(v), "stars"]} />
              <Bar dataKey="value" fill="#e3b341" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Repositories created per year" loading={pending.repos} error={errors.repos} empty={!yearData.length && "No repositories yet"}>
          <ResponsiveContainer>
            <BarChart data={yearData} margin={{ left: -20, right: 8 }}>
              <CartesianGrid stroke={chart.grid} vertical={false} />
              <XAxis dataKey="label" {...axis} />
              <YAxis allowDecimals={false} {...axis} />
              <Tooltip {...tip} formatter={(v) => [v, "repos"]} />
              <Bar dataKey="value" fill={chart.accent} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Languages by repository count" subtitle="Main language of each original repo" loading={pending.repos} error={errors.repos} empty={!langData.length && "No languages detected"}>
          <ResponsiveContainer>
            <BarChart data={langData} margin={{ left: -20, right: 8 }}>
              <CartesianGrid stroke={chart.grid} vertical={false} />
              <XAxis dataKey="label" {...axis} interval={0} angle={-25} textAnchor="end" height={50} />
              <YAxis allowDecimals={false} {...axis} />
              <Tooltip {...tip} formatter={(v) => [v, "repos"]} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {langData.map((d) => (
                  <Cell key={d.label} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Activity by day of week"
          subtitle={days.length ? "Contributions over the last year" : "Public events over the last 90 days"}
          loading={pending.contributions || (pending.events && !days.length)}
          empty={!weekdayData.some((d) => d.value) && "No activity recorded"}
        >
          <ResponsiveContainer>
            <BarChart data={weekdayData} margin={{ left: -20, right: 8 }}>
              <CartesianGrid stroke={chart.grid} vertical={false} />
              <XAxis dataKey="label" {...axis} />
              <YAxis allowDecimals={false} {...axis} />
              <Tooltip {...tip} formatter={(v) => [v, days.length ? "contributions" : "events"]} />
              <Bar dataKey="value" fill="#3fb950" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Activity breakdown" subtitle="Public events, last 90 days" loading={pending.events} error={errors.events} empty={!eventData.length && "No public events"}>
          <div className="donut-with-legend">
            <ResponsiveContainer width="55%" height="100%">
              <PieChart>
                <Pie data={eventData} dataKey="value" nameKey="label" innerRadius="55%" outerRadius="90%" stroke={chart.surface} strokeWidth={2} isAnimationActive={false}>
                  {eventData.map((d) => (
                    <Cell key={d.label} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip {...tip} />
              </PieChart>
            </ResponsiveContainer>
            <ul className="legend-list">
              {eventData.map((d) => (
                <li key={d.label}>
                  <span className="language-dot" style={{ background: d.color }} />
                  {d.label}
                  <strong>{d.value}</strong>
                </li>
              ))}
            </ul>
          </div>
        </ChartCard>
      </div>
    </div>
  );
};

export default Analytics;
