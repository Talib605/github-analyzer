import { useMemo, useState } from "react";
import "../CSS/Views.css";
import { useGitHub } from "../Context/GitHubContext";
import { EmptyState, InlineError, LanguageDot, SkeletonList, ViewHeader } from "../components/ui";
import { formatDate, formatNumber, languageColor, timeAgo } from "../utils/format";

const SORTS = {
  pushed: { label: "Recently updated", fn: (a, b) => new Date(b.pushed_at) - new Date(a.pushed_at) },
  stars: { label: "Most stars", fn: (a, b) => b.stargazers_count - a.stargazers_count },
  forks: { label: "Most forks", fn: (a, b) => b.forks_count - a.forks_count },
  created: { label: "Newest", fn: (a, b) => new Date(b.created_at) - new Date(a.created_at) },
  name: { label: "Name (A–Z)", fn: (a, b) => a.name.localeCompare(b.name) },
};

const Repositories = () => {
  const { profile, repoQuery, setRepoQuery, reload } = useGitHub();
  const { repos, pending, errors, user } = profile;
  const [type, setType] = useState("all");
  const [language, setLanguage] = useState("all");
  const [sort, setSort] = useState("pushed");

  const languages = useMemo(
    () => [...new Set((repos || []).map((r) => r.language).filter(Boolean))].sort(),
    [repos]
  );

  const filtered = useMemo(() => {
    if (!repos) return [];
    const q = repoQuery.trim().toLowerCase();
    return repos
      .filter((r) => {
        if (type === "sources" && r.fork) return false;
        if (type === "forks" && !r.fork) return false;
        if (type === "archived" && !r.archived) return false;
        if (language !== "all" && r.language !== language) return false;
        if (!q) return true;
        return (
          r.name.toLowerCase().includes(q) ||
          (r.description || "").toLowerCase().includes(q) ||
          (r.topics || []).some((t) => t.includes(q))
        );
      })
      .sort(SORTS[sort].fn);
  }, [repos, repoQuery, type, language, sort]);

  const anyFilter = repoQuery || type !== "all" || language !== "all";

  return (
    <div className="view">
      <ViewHeader
        icon="fa-solid fa-code-branch"
        title="Repositories"
        subtitle={`${formatNumber(user.public_repos)} public repositories owned by @${user.login}`}
      />

      <div className="toolbar">
        <div className="toolbar-search">
          <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
          <input
            value={repoQuery}
            onChange={(e) => setRepoQuery(e.target.value)}
            placeholder="Find a repository…"
            aria-label="Filter repositories"
          />
        </div>
        <select value={type} onChange={(e) => setType(e.target.value)} aria-label="Type">
          <option value="all">All types</option>
          <option value="sources">Sources</option>
          <option value="forks">Forks</option>
          <option value="archived">Archived</option>
        </select>
        <select value={language} onChange={(e) => setLanguage(e.target.value)} aria-label="Language">
          <option value="all">All languages</option>
          {languages.map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
          {Object.entries(SORTS).map(([key, s]) => (
            <option key={key} value={key}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {pending.repos ? (
        <SkeletonList rows={6} height={110} />
      ) : errors.repos ? (
        <InlineError error={errors.repos} what="repositories" onRetry={reload} />
      ) : (
        <>
          <p className="result-count">
            Showing {filtered.length} of {repos.length} repositories
            {anyFilter && (
              <button
                className="link-btn"
                onClick={() => {
                  setRepoQuery("");
                  setType("all");
                  setLanguage("all");
                }}
              >
                Clear filters
              </button>
            )}
          </p>

          {filtered.length === 0 ? (
            <EmptyState icon="fa-solid fa-filter-circle-xmark" title="No repositories match" text="Try a different search or filter." />
          ) : (
            <div className="repo-grid">
              {filtered.map((repo) => (
                <article className="repo-card panel" key={repo.id}>
                  <div className="repo-card-title">
                    <a href={repo.html_url} target="_blank" rel="noreferrer">
                      {repo.name}
                    </a>
                    {repo.fork && <span className="badge">Fork</span>}
                    {repo.archived && <span className="badge badge-warning">Archived</span>}
                    {repo.is_template && <span className="badge">Template</span>}
                  </div>
                  <p className="repo-card-desc">{repo.description || "No description provided."}</p>
                  {repo.topics?.length > 0 && (
                    <div className="topic-row">
                      {repo.topics.slice(0, 5).map((t) => (
                        <button key={t} className="chip chip-topic" onClick={() => setRepoQuery(t)}>
                          {t}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="repo-card-meta">
                    {repo.language && (
                      <span>
                        <LanguageDot color={languageColor(repo.language)} /> {repo.language}
                      </span>
                    )}
                    <span title="Stars">
                      <i className="fa-regular fa-star" aria-hidden="true" /> {formatNumber(repo.stargazers_count)}
                    </span>
                    <span title="Forks">
                      <i className="fa-solid fa-code-fork" aria-hidden="true" /> {formatNumber(repo.forks_count)}
                    </span>
                    {repo.open_issues_count > 0 && (
                      <span title="Open issues & PRs">
                        <i className="fa-regular fa-circle-dot" aria-hidden="true" /> {formatNumber(repo.open_issues_count)}
                      </span>
                    )}
                    {repo.license?.spdx_id && repo.license.spdx_id !== "NOASSERTION" && (
                      <span title="License">
                        <i className="fa-solid fa-scale-balanced" aria-hidden="true" /> {repo.license.spdx_id}
                      </span>
                    )}
                    <span title={`Created ${formatDate(repo.created_at)}`}>Updated {timeAgo(repo.pushed_at)}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Repositories;
