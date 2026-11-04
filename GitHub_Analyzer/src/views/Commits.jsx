import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import "../CSS/Views.css";
import { useGitHub } from "../Context/GitHubContext";
import { EmptyState, InlineError, ShowMore, SkeletonList, ViewHeader, tooltipProps, usePaged } from "../components/ui";
import { formatDate, formatNumber, timeAgo } from "../utils/format";

const Commits = () => {
  const { profile, chart, reload } = useGitHub();
  const { commits, pending, errors, user } = profile;
  const [repoFilter, setRepoFilter] = useState("all");
  const [query, setQuery] = useState("");

  const items = commits?.items || [];

  const byRepo = useMemo(() => {
    const map = new Map();
    items.forEach((c) => map.set(c.repository.full_name, (map.get(c.repository.full_name) || 0) + 1));
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, short: name.split("/")[1], value }));
  }, [items]);

  const filteredList = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(
      (c) =>
        (repoFilter === "all" || c.repository.full_name === repoFilter) &&
        (!q || c.commit.message.toLowerCase().includes(q))
    );
  }, [items, repoFilter, query]);
  const paged = usePaged(filteredList, 25, `${repoFilter}|${query}`);

  const groups = useMemo(() => {
    const map = new Map();
    paged.visible.forEach((c) => {
      const day = formatDate(c.commit.author.date, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
      if (!map.has(day)) map.set(day, []);
      map.get(day).push(c);
    });
    return { count: filteredList.length, days: [...map.entries()] };
  }, [paged.visible, filteredList.length]);

  if (pending.commits) return <div className="view"><ViewHeader icon="fa-solid fa-code-commit" title="Commits" /><SkeletonList rows={6} /></div>;
  if (errors.commits)
    return (
      <div className="view">
        <ViewHeader icon="fa-solid fa-code-commit" title="Commits" />
        <InlineError error={errors.commits} what="commits" onRetry={reload} />
      </div>
    );

  return (
    <div className="view">
      <ViewHeader
        icon="fa-solid fa-code-commit"
        title="Commits"
        subtitle={`${formatNumber(commits.total_count)} public commits authored by @${user.login}${
          commits.total_count > items.length ? ` · showing the latest ${items.length}` : ""
        }`}
      />

      {!items.length ? (
        <EmptyState icon="fa-solid fa-code-commit" title="No public commits found" text="GitHub search only indexes commits on public repositories' default branches." />
      ) : (
        <div className="split">
          <section className="panel">
            <div className="toolbar compact">
              <div className="toolbar-search">
                <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search commit messages…" aria-label="Search commit messages" />
              </div>
              <select value={repoFilter} onChange={(e) => setRepoFilter(e.target.value)} aria-label="Repository">
                <option value="all">All repositories</option>
                {byRepo.map((r) => (
                  <option key={r.name} value={r.name}>
                    {r.name} ({r.value})
                  </option>
                ))}
              </select>
            </div>

            {groups.count === 0 ? (
              <EmptyState compact icon="fa-solid fa-filter-circle-xmark" title="No commits match" />
            ) : (
              groups.days.map(([day, list]) => (
                <div className="commit-day" key={day}>
                  <h4>
                    <i className="fa-solid fa-code-commit" aria-hidden="true" /> {day}
                  </h4>
                  <ul className="row-list">
                    {list.map((c) => {
                      const [title, ...rest] = c.commit.message.split("\n");
                      return (
                        <li key={c.sha} className="row">
                          <div className="row-main">
                            <a href={c.html_url} target="_blank" rel="noreferrer" className="row-title" title={c.commit.message}>
                              {title}
                            </a>
                            <span className="row-sub">
                              <a href={c.repository.html_url} target="_blank" rel="noreferrer">
                                {c.repository.full_name}
                              </a>
                              {rest.join("").trim() && <span className="muted"> · has description</span>}
                            </span>
                          </div>
                          <a className="sha" href={c.html_url} target="_blank" rel="noreferrer">
                            {c.sha.slice(0, 7)}
                          </a>
                          <span className="row-time" title={new Date(c.commit.author.date).toLocaleString()}>
                            {timeAgo(c.commit.author.date)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))
            )}
            <ShowMore remaining={paged.remaining} onClick={paged.more} />
          </section>

          <aside className="panel chart-panel">
            <h3>Commits by repository</h3>
            <p className="card-subtitle">Latest {items.length} commits</p>
            <div style={{ height: Math.max(180, Math.min(byRepo.length, 10) * 34) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byRepo.slice(0, 10)} layout="vertical" margin={{ left: 0, right: 16 }}>
                  <CartesianGrid stroke={chart.grid} horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fill: chart.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="short" width={110} tickFormatter={(v) => (v.length > 15 ? `${v.slice(0, 14)}…` : v)} tick={{ fill: chart.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip {...tooltipProps(chart)} formatter={(v) => [v, "commits"]} labelFormatter={(l, p) => p?.[0]?.payload?.name || l} />
                  <Bar
                    dataKey="value"
                    fill={chart.accent}
                    radius={[0, 4, 4, 0]}
                    cursor="pointer"
                    onClick={(d) => setRepoFilter(d?.payload?.name ?? d?.name ?? "all")}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="hint">Tip: click a bar to filter the list.</p>
          </aside>
        </div>
      )}
    </div>
  );
};

export default Commits;
