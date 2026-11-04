import "../CSS/ActivityStats.css";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";
import { useGitHub } from "../Context/GitHubContext";
import { formatNumber } from "../utils/format";
import { flattenDays, trendFromDays, trendFromTimestamps, weeklySeries, weeklySeriesFromDays } from "../utils/stats";
import { Skeleton } from "./ui";

const searchCard = (result, getDate) => {
  if (!result) return null;
  const stamps = result.items.map((item) => new Date(getDate(item)).getTime()).filter(Boolean);
  return {
    value: result.total_count,
    trend: trendFromTimestamps(stamps, result.total_count),
    data: weeklySeries(stamps),
  };
};

const ActivityStats = () => {
  const { profile, navigate, hasToken, chart } = useGitHub();
  const { commits, prs, issues, contributions, pending, errors } = profile;

  const days = flattenDays(contributions);

  const cards = [
    {
      key: "commits",
      label: "Total Commits",
      icon: "fa-solid fa-code-commit",
      color: "#7c85ff",
      bg: "rgba(124, 133, 255, 0.15)",
      view: "commits",
      ...searchCard(commits, (c) => c.commit.author.date),
    },
    {
      key: "contributions",
      label: "Contributions (1y)",
      icon: "fa-solid fa-calendar-days",
      color: "#3fb950",
      bg: "rgba(63, 185, 80, 0.15)",
      view: "analytics",
      ...(contributions
        ? {
            value: contributions.contributionCalendar.totalContributions,
            trend: trendFromDays(days),
            data: weeklySeriesFromDays(days),
          }
        : {}),
      missing: !hasToken ? "Needs a GitHub token" : null,
    },
    {
      key: "prs",
      label: "Pull Requests",
      icon: "fa-solid fa-code-pull-request",
      color: "#e3b341",
      bg: "rgba(227, 179, 65, 0.15)",
      view: "issues",
      ...searchCard(prs, (i) => i.created_at),
    },
    {
      key: "issues",
      label: "Issues",
      icon: "fa-solid fa-circle-exclamation",
      color: "#f85149",
      bg: "rgba(248, 81, 73, 0.15)",
      view: "issues",
      ...searchCard(issues, (i) => i.created_at),
    },
  ];

  return (
    <div className="activity-stats-grid">
      {cards.map((stat) => {
        const loading = pending[stat.key];
        const error = errors[stat.key];
        const onClick = stat.missing ? () => navigate("settings") : () => navigate(stat.view);

        return (
          <button className="stat-card" key={stat.key} onClick={onClick} title={stat.missing ? "Add a token in Settings" : `Open ${stat.view}`}>
            <div className="stat-card-top">
              <span className="stat-label">{stat.label}</span>
              <div className="stat-icon-box" style={{ background: stat.bg, color: stat.color }}>
                <i className={stat.icon} aria-hidden="true"></i>
              </div>
            </div>

            {loading ? (
              <>
                <Skeleton width={90} height={30} />
                <Skeleton width={130} height={12} style={{ marginTop: 10 }} />
              </>
            ) : stat.value !== undefined ? (
              <>
                <div className="stat-value">{formatNumber(stat.value)}</div>
                <div className={`stat-change ${stat.trend.kind}`}>
                  {stat.trend.kind === "up" && <i className="fa-solid fa-arrow-up" aria-hidden="true"></i>}
                  {stat.trend.kind === "down" && <i className="fa-solid fa-arrow-down" aria-hidden="true"></i>}
                  {stat.trend.kind === "busy" && <i className="fa-solid fa-fire" aria-hidden="true"></i>}
                  {stat.trend.text}
                </div>
                <div className="stat-sub">{stat.trend.sub}</div>
              </>
            ) : (
              <>
                <div className="stat-value muted">—</div>
                <div className="stat-sub stat-missing">
                  {stat.missing ? (
                    <>
                      <i className="fa-solid fa-key" aria-hidden="true"></i> {stat.missing}
                    </>
                  ) : (
                    error?.message || "Unavailable"
                  )}
                </div>
              </>
            )}

            <div className="stat-sparkline">
              {stat.data && stat.data.some((d) => d.v > 0) && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stat.data}>
                    <Tooltip
                      cursor={false}
                      contentStyle={{ background: chart.tooltipBg, border: `1px solid ${chart.tooltipBorder}`, borderRadius: 6, fontSize: 11, padding: "2px 8px" }}
                      itemStyle={{ color: chart.text }}
                      labelFormatter={(i) => `${stat.data.length - i - 1 === 0 ? "This week" : `${stat.data.length - i - 1} wk ago`}`}
                      formatter={(v) => [v, ""]}
                      separator=""
                    />
                    <Line type="monotone" dataKey="v" stroke={stat.color} strokeWidth={2} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default ActivityStats;
