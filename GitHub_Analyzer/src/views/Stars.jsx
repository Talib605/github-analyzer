import { useEffect, useMemo, useState } from "react";
import "../CSS/Views.css";
import { useGitHub } from "../Context/GitHubContext";
import { EmptyState, InlineError, LanguageDot, ShowMore, SkeletonList, ViewHeader, usePaged } from "../components/ui";
import { formatNumber, languageColor, timeAgo } from "../utils/format";
import { topRepositories } from "../utils/stats";

const Stars = () => {
  const { profile, ensure, retryKey } = useGitHub();
  const { starred, repos, pending, errors, user } = profile;
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState("all");

  useEffect(() => {
    ensure("starred");
  }, [ensure]);

  const received = repos ? repos.reduce((s, r) => s + r.stargazers_count, 0) : null;
  const topOwn = repos ? topRepositories(repos, 5).filter((r) => r.stargazers_count > 0) : [];

  const languages = useMemo(() => {
    const map = {};
    (starred || []).forEach((r) => r.language && (map[r.language] = (map[r.language] || 0) + 1));
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [starred]);

  const filtered = (starred || []).filter((r) => {
    if (language !== "all" && r.language !== language) return false;
    const q = query.trim().toLowerCase();
    return !q || r.full_name.toLowerCase().includes(q) || (r.description || "").toLowerCase().includes(q);
  });

  const paged = usePaged(filtered, 25, `${language}|${query}`);

  return (
    <div className="view">
      <ViewHeader icon="fa-solid fa-star" title="Stars" subtitle={`Stars @${user.login} has earned, and repositories they've starred`} />

      <section className="panel stars-received">
        <div className="stars-total">
          <i className="fa-solid fa-star" aria-hidden="true" />
          <div>
            <strong>{received === null ? "…" : formatNumber(received)}</strong>
            <span>stars earned across {repos ? repos.length : "…"} public repositories</span>
          </div>
        </div>
        {topOwn.length > 0 && (
          <ol className="star-leaders">
            {topOwn.map((r) => (
              <li key={r.id}>
                <a href={r.html_url} target="_blank" rel="noreferrer">{r.name}</a>
                <span>
                  <i className="fa-solid fa-star" aria-hidden="true" /> {formatNumber(r.stargazers_count)}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="panel">
        <h3>
          Starred by @{user.login}
          {starred && <span className="count-pill">{starred.length === 100 ? "100 most recent" : starred.length}</span>}
        </h3>

        {pending.starred || (!starred && !errors.starred) ? (
          <SkeletonList rows={5} height={60} />
        ) : errors.starred ? (
          <InlineError error={errors.starred} what="starred repositories" onRetry={() => retryKey("starred")} />
        ) : !starred.length ? (
          <EmptyState compact icon="fa-regular fa-star" title="Hasn't starred anything yet" />
        ) : (
          <>
            <div className="toolbar compact">
              <div className="toolbar-search">
                <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search starred repositories…" aria-label="Search starred" />
              </div>
            </div>
            <div className="topic-row lang-filter">
              <button className={`chip ${language === "all" ? "active" : ""}`} onClick={() => setLanguage("all")}>All</button>
              {languages.slice(0, 10).map(([l, n]) => (
                <button key={l} className={`chip ${language === l ? "active" : ""}`} onClick={() => setLanguage(l)}>
                  <LanguageDot color={languageColor(l)} size={8} /> {l} <span className="muted">{n}</span>
                </button>
              ))}
            </div>
            {filtered.length === 0 ? (
              <EmptyState compact icon="fa-solid fa-filter-circle-xmark" title="No starred repos match" />
            ) : (
              <>
              <ul className="row-list">
                {paged.visible.map((r) => (
                  <li className="row" key={r.id}>
                    <img className="row-avatar" src={r.owner.avatar_url} alt="" loading="lazy" />
                    <div className="row-main">
                      <a className="row-title" href={r.html_url} target="_blank" rel="noreferrer">{r.full_name}</a>
                      <span className="row-sub">{r.description || "No description provided."}</span>
                    </div>
                    <div className="row-meta">
                      {r.language && (
                        <span>
                          <LanguageDot color={languageColor(r.language)} /> {r.language}
                        </span>
                      )}
                      <span>
                        <i className="fa-regular fa-star" aria-hidden="true" /> {formatNumber(r.stargazers_count)}
                      </span>
                      <span className="muted">Updated {timeAgo(r.pushed_at)}</span>
                    </div>
                  </li>
                ))}
              </ul>
              <ShowMore remaining={paged.remaining} onClick={paged.more} />
              </>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default Stars;
