import { useMemo, useState } from "react";
import "../CSS/Views.css";
import { useGitHub } from "../Context/GitHubContext";
import { EmptyState, InlineError, ShowMore, SkeletonList, ViewHeader, usePaged } from "../components/ui";
import { formatNumber, timeAgo } from "../utils/format";

const stateOf = (item) => {
  if (item.pull_request?.merged_at) return "merged";
  if (item.state === "closed") return item.state_reason === "not_planned" ? "not-planned" : "closed";
  return item.draft ? "draft" : "open";
};

const ICON = {
  open: "fa-regular fa-circle-dot",
  draft: "fa-regular fa-circle-dot",
  closed: "fa-regular fa-circle-check",
  "not-planned": "fa-solid fa-ban",
  merged: "fa-solid fa-code-merge",
};
const PR_ICON = { open: "fa-solid fa-code-pull-request", draft: "fa-solid fa-code-pull-request", closed: "fa-solid fa-code-pull-request" };

const repoFromUrl = (url) => url.replace("https://api.github.com/repos/", "");

const Issues = () => {
  const { profile, reload } = useGitHub();
  const { prs, issues, pending, errors, user } = profile;
  const [tab, setTab] = useState("prs");
  const [state, setState] = useState("all");
  const [query, setQuery] = useState("");

  const source = tab === "prs" ? prs : issues;
  const loading = tab === "prs" ? pending.prs : pending.issues;
  const error = tab === "prs" ? errors.prs : errors.issues;

  const items = useMemo(() => (source?.items || []).map((i) => ({ ...i, _state: stateOf(i), _repo: repoFromUrl(i.repository_url) })), [source]);

  const counts = useMemo(() => {
    const c = { open: 0, closed: 0, merged: 0 };
    items.forEach((i) => {
      if (i._state === "merged") c.merged += 1;
      else if (i._state === "open" || i._state === "draft") c.open += 1;
      else c.closed += 1;
    });
    return c;
  }, [items]);

  const filtered = items.filter((i) => {
    if (state === "open" && !(i._state === "open" || i._state === "draft")) return false;
    if (state === "closed" && !(i._state === "closed" || i._state === "not-planned")) return false;
    if (state === "merged" && i._state !== "merged") return false;
    const q = query.trim().toLowerCase();
    return !q || i.title.toLowerCase().includes(q) || i._repo.toLowerCase().includes(q);
  });

  const paged = usePaged(filtered, 25, `${tab}|${state}|${query}`);

  const mergeRate = tab === "prs" && items.length ? Math.round((counts.merged / items.length) * 100) : null;

  return (
    <div className="view">
      <ViewHeader icon="fa-solid fa-bug" title="Issues & Pull Requests" subtitle={`Opened by @${user.login} across all public repositories`} />

      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === "prs"} className={tab === "prs" ? "active" : ""} onClick={() => { setTab("prs"); setState("all"); }}>
          <i className="fa-solid fa-code-pull-request" aria-hidden="true" /> Pull requests
          <span className="count">{prs ? formatNumber(prs.total_count) : "…"}</span>
        </button>
        <button role="tab" aria-selected={tab === "issues"} className={tab === "issues" ? "active" : ""} onClick={() => { setTab("issues"); setState("all"); }}>
          <i className="fa-regular fa-circle-dot" aria-hidden="true" /> Issues
          <span className="count">{issues ? formatNumber(issues.total_count) : "…"}</span>
        </button>
      </div>

      {loading ? (
        <SkeletonList rows={6} />
      ) : error ? (
        <InlineError error={error} what={tab === "prs" ? "pull requests" : "issues"} onRetry={reload} />
      ) : !items.length ? (
        <EmptyState icon={tab === "prs" ? "fa-solid fa-code-pull-request" : "fa-regular fa-circle-dot"} title={`No ${tab === "prs" ? "pull requests" : "issues"} yet`} />
      ) : (
        <>
          <div className="mini-stats">
            <div><strong>{counts.open}</strong><span>Open</span></div>
            {tab === "prs" && <div><strong>{counts.merged}</strong><span>Merged</span></div>}
            <div><strong>{counts.closed}</strong><span>Closed</span></div>
            {mergeRate !== null && <div><strong>{mergeRate}%</strong><span>Merge rate</span></div>}
            <div className="mini-note">Based on the latest {items.length} of {formatNumber(source.total_count)}</div>
          </div>

          <div className="toolbar compact">
            <div className="toolbar-search">
              <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter by title or repository…" aria-label="Filter" />
            </div>
            <div className="segmented" role="group" aria-label="State">
              {["all", "open", ...(tab === "prs" ? ["merged"] : []), "closed"].map((s) => (
                <button key={s} className={state === s ? "active" : ""} onClick={() => setState(s)}>
                  {s[0].toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState compact icon="fa-solid fa-filter-circle-xmark" title="Nothing matches these filters" />
          ) : (
            <>
            <ul className="row-list panel">
              {paged.visible.map((i) => (
                <li className="row" key={i.id}>
                  <i className={`state-icon ${i._state} ${tab === "prs" && PR_ICON[i._state] ? PR_ICON[i._state] : ICON[i._state]}`} title={i._state} aria-label={i._state} />
                  <div className="row-main">
                    <a className="row-title" href={i.html_url} target="_blank" rel="noreferrer">
                      {i.title}
                    </a>
                    <span className="row-sub">
                      <a href={`https://github.com/${i._repo}`} target="_blank" rel="noreferrer">{i._repo}</a> #{i.number} · opened {timeAgo(i.created_at)}
                      {i._state === "draft" && <span className="badge">Draft</span>}
                    </span>
                  </div>
                  {i.comments > 0 && (
                    <span className="row-time" title="Comments">
                      <i className="fa-regular fa-comment" aria-hidden="true" /> {i.comments}
                    </span>
                  )}
                </li>
              ))}
            </ul>
            <ShowMore remaining={paged.remaining} onClick={paged.more} />
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Issues;
