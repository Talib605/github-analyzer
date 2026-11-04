import "../CSS/ProfileChart.css";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useGitHub } from "../Context/GitHubContext";
import { flattenDays, monthlyContributions, reposPerYear } from "../utils/stats";
import { Skeleton, tooltipProps } from "./ui";

/**
 * GitHub has no follower history API, so this chart shows real data instead:
 * contributions per month (with a token) or repositories created per year.
 */
function ProfileChart() {
  const { profile, chart } = useGitHub();
  const { contributions, repos, pending } = profile;

  let title;
  let data = [];
  let unit;
  if (contributions) {
    title = "Contributions per month";
    unit = "contributions";
    data = monthlyContributions(flattenDays(contributions));
  } else if (repos) {
    title = "Repositories created per year";
    unit = "repositories";
    data = reposPerYear(repos);
  }

  if ((pending.contributions || pending.repos) && !data.length) {
    return <Skeleton height="100%" radius={10} />;
  }
  if (!data.length) {
    return <div className="profile-chart-empty">No activity data to chart yet.</div>;
  }

  return (
    <div className="profile-chart">
      <div className="profile-chart-title">{title}</div>
      <div className="profile-chart-body">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="profileFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={chart.accent} stopOpacity={0.35} />
                <stop offset="100%" stopColor={chart.accent} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={chart.grid} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: chart.axis, fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={12} />
            <YAxis tick={{ fill: chart.axis, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} width={44} />
            <Tooltip {...tooltipProps(chart)} formatter={(v) => [v, unit]} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={chart.accent}
              strokeWidth={2}
              fill="url(#profileFill)"
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default ProfileChart;
