import { BookMarked, Star, GitFork } from "lucide-react";
import "../CSS/TopRepositories.css";
import { useGitHub } from "../Context/GitHubContext";
import { topRepositories } from "../utils/stats";
import { formatNumber, languageColor, timeAgo } from "../utils/format";
import { EmptyState, InlineError, SkeletonList } from "./ui";

const TopRepositories = () => {
  const { profile, navigate, reload } = useGitHub();
  const { repos, pending, errors } = profile;
  const list = repos ? topRepositories(repos, 5) : [];

  let body;
  if (pending.repos) body = <SkeletonList rows={4} height={52} />;
  else if (errors.repos) body = <InlineError error={errors.repos} what="repositories" onRetry={reload} />;
  else if (!list.length) body = <EmptyState compact icon="fa-solid fa-book" title="No public repositories" />;
  else
    body = (
      <div className="repositories-list">
        {list.map((repo) => (
          <a className="repository-item" key={repo.id} href={repo.html_url} target="_blank" rel="noreferrer">
            <div className="repo-icon">
              <BookMarked size={17} />
            </div>

            <div className="repo-content">
              <div className="repo-title-row">
                <h4>{repo.name}</h4>
                {repo.archived && <span className="badge">Archived</span>}
              </div>

              <div className="repo-description-row">
                <p>{repo.description || "No description provided."}</p>
                {repo.language && (
                  <span className="repo-tech" style={{ "--lang": languageColor(repo.language) }}>
                    {repo.language}
                  </span>
                )}
              </div>

              <div className="repo-meta">
                <span title="Stars">
                  <Star size={14} />
                  {formatNumber(repo.stargazers_count)}
                </span>
                <span title="Forks">
                  <GitFork size={14} />
                  {formatNumber(repo.forks_count)}
                </span>
                <span>Updated {timeAgo(repo.pushed_at)}</span>
              </div>
            </div>
          </a>
        ))}
      </div>
    );

  return (
    <div className="repositories-card card">
      <div className="repositories-header">
        <h3>Top Repositories</h3>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate("repositories")}>
          View All
        </button>
      </div>
      {body}
    </div>
  );
};

export default TopRepositories;
