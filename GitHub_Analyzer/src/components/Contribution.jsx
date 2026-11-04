import { useEffect, useMemo, useState } from "react";
import "../CSS/Contribution.css";
import { useGitHub } from "../Context/GitHubContext";
import { getContributions } from "./services/githubApi";
import { LEVELS, MONTHS } from "../utils/stats";
import { InlineError, Skeleton } from "./ui";

const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

const describeDay = (day) => {
  const date = new Date(`${day.date}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const n = day.contributionCount;
  return `${n === 0 ? "No" : n} contribution${n === 1 ? "" : "s"} on ${date}`;
};

const Contribution = () => {
  const { profile, hasToken, retryKey, reload } = useGitHub();
  const { login, contributions: initial, pending, errors } = profile;

  const [year, setYear] = useState("");
  const [yearData, setYearData] = useState(null);
  const [yearLoading, setYearLoading] = useState(false);
  const [yearError, setYearError] = useState(null);

  // reset when switching users
  useEffect(() => {
    setYear("");
    setYearData(null);
    setYearError(null);
  }, [login]);

  useEffect(() => {
    if (!year) return;
    let cancelled = false;
    setYearLoading(true);
    setYearError(null);
    getContributions(login, year)
      .then((data) => !cancelled && setYearData(data))
      .catch((err) => !cancelled && setYearError(err))
      .finally(() => !cancelled && setYearLoading(false));
    return () => {
      cancelled = true;
    };
  }, [year, login]);

  const collection = year ? yearData : initial;
  const weeks = collection?.contributionCalendar?.weeks ?? [];
  const years = initial?.contributionYears ?? [];

  const monthLabels = useMemo(() => {
    const labels = [];
    let lastMonth = -1;
    weeks.forEach((week, i) => {
      const first = week.contributionDays[0];
      if (!first) return;
      const month = Number(first.date.slice(5, 7)) - 1;
      if (month !== lastMonth) {
        // skip a label that would collide with the previous one
        if (!labels.length || i - labels[labels.length - 1].col >= 3) labels.push({ col: i, label: MONTHS[month] });
        else labels[labels.length - 1] = { col: i, label: MONTHS[month] };
        lastMonth = month;
      }
    });
    return labels;
  }, [weeks]);

  const loading = year ? yearLoading : pending.contributions;
  const error = year ? yearError : errors.contributions;
  const total = collection?.contributionCalendar?.totalContributions;

  let body;
  if (!hasToken) {
    body = (
      <InlineError
        error={{
          kind: "needs-token",
          message: "GitHub only shares the contribution calendar through its GraphQL API, which requires a (free, read-only) token.",
        }}
      />
    );
  } else if (loading) {
    body = <Skeleton height={130} radius={8} />;
  } else if (error) {
    body = (
      <InlineError
        error={error}
        what="the contribution calendar"
        onRetry={() => {
          if (year) {
            setYear("");
          } else {
            retryKey("contributions");
            reload();
          }
        }}
      />
    );
  } else if (!weeks.length) {
    body = <p className="muted">No contribution data.</p>;
  } else {
    body = (
      <div className="contribution-scroll">
        <div className="contribution-calendar" style={{ gridTemplateColumns: `28px repeat(${weeks.length}, minmax(9px, 1fr))` }}>
          {monthLabels.map((m) => (
            <span key={`m-${m.col}`} className="cal-month" style={{ gridColumn: m.col + 2, gridRow: 1 }}>
              {m.label}
            </span>
          ))}
          {DAY_LABELS.map((label, i) => (
            <span key={`d-${i}`} className="cal-day-label" style={{ gridColumn: 1, gridRow: i + 2 }}>
              {label}
            </span>
          ))}
          {weeks.map((week, w) =>
            week.contributionDays.map((day) => (
              <div
                key={day.date}
                className={`contribution level-${LEVELS[day.contributionLevel] ?? 0}`}
                style={{ gridColumn: w + 2, gridRow: day.weekday + 2 }}
                title={describeDay(day)}
                aria-label={describeDay(day)}
              />
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="contribution-card card">
      <div className="contribution-header">
        <div>
          <h3>Contribution Activity</h3>
          {total !== undefined && !loading && (
            <p className="card-subtitle">
              {total.toLocaleString()} contributions {year ? `in ${year}` : "in the last year"}
            </p>
          )}
        </div>

        {hasToken && years.length > 0 && (
          <select value={year} onChange={(e) => setYear(e.target.value)} aria-label="Contribution period">
            <option value="">Last 12 months</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="contribution-body">{body}</div>

      {hasToken && weeks.length > 0 && !loading && (
        <div className="legend">
          {collection.restrictedContributionsCount > 0 && (
            <span className="legend-note">
              Includes {collection.restrictedContributionsCount} private contributions
            </span>
          )}
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((l) => (
            <div key={l} className={`legend-box level-${l}`}></div>
          ))}
          <span>More</span>
        </div>
      )}
    </div>
  );
};

export default Contribution;
