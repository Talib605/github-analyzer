import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import "../CSS/TopLanguages.css";
import { useGitHub } from "../Context/GitHubContext";
import { languageBreakdown } from "../utils/stats";
import { languageColor } from "../utils/format";
import { EmptyState, InlineError, Skeleton, tooltipProps } from "./ui";

const TopLanguages = () => {
  const { profile, chart, reload } = useGitHub();
  const { languages, pending, errors } = profile;
  const data = languageBreakdown(languages?.totals).map((d) => ({ ...d, color: languageColor(d.name) }));

  let body;
  if (pending.languages) {
    body = (
      <div className="languages-content">
        <Skeleton width={170} height={170} radius={999} />
        <div className="language-list">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} height={14} />
          ))}
        </div>
      </div>
    );
  } else if (errors.languages) {
    body = <InlineError error={errors.languages} what="languages" onRetry={reload} />;
  } else if (!data.length) {
    body = <EmptyState compact icon="fa-solid fa-code" title="No languages detected" text="This user has no public code repositories yet." />;
  } else {
    body = (
      <div className="languages-content">
        <div className="language-chart">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius="58%"
                outerRadius="88%"
                stroke={chart.surface}
                strokeWidth={2}
                isAnimationActive={false}
              >
                {data.map((item) => (
                  <Cell key={item.name} fill={item.color} />
                ))}
              </Pie>
              <Tooltip {...tooltipProps(chart)} formatter={(v, name) => [`${v.toFixed(1)}%`, name]} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <ul className="language-list">
          {data.map((item) => (
            <li className="language-item" key={item.name}>
              <div className="language-name">
                <span className="language-dot" style={{ backgroundColor: item.color }}></span>
                <span>{item.name}</span>
              </div>
              <span className="language-percent">{item.value.toFixed(1)}%</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="languages-card card">
      <h3>Top Languages</h3>
      {languages?.basis && !pending.languages && <p className="card-subtitle">{languages.basis}</p>}
      {body}
    </div>
  );
};

export default TopLanguages;
