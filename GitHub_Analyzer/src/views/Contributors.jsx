import { useEffect, useMemo } from "react";
import "../CSS/Views.css";
import { useGitHub } from "../Context/GitHubContext";
import { EmptyState, InlineError, SkeletonList, ViewHeader } from "../components/ui";
import { formatNumber } from "../utils/format";

const isBot = (c) => c.type === "Bot" || /\[bot\]$/i.test(c.login);

const Contributors = () => {
  const { profile, ensure, retryKey } = useGitHub();
  const { contributors, pending, errors, user, repos } = profile;

  useEffect(() => {
    ensure("contributors");
  }, [ensure]);

  const { people, perRepo } = useMemo(() => {
    if (!contributors) return { people: [], perRepo: [] };
    const map = new Map();
    const perRepo = contributors.map(({ repo, contributors: list }) => {
      const humans = list.filter((c) => !isBot(c));
      const total = humans.reduce((s, c) => s + c.contributions, 0);
      const self = humans.find((c) => c.login.toLowerCase() === user.login.toLowerCase());
      humans.forEach((c) => {
        if (c.login.toLowerCase() === user.login.toLowerCase()) return;
        const entry = map.get(c.login) || { ...c, contributions: 0, repos: [] };
        entry.contributions += c.contributions;
        entry.repos.push(repo.name);
        map.set(c.login, entry);
      });
      return { repo, humans, total, selfShare: total && self ? (self.contributions / total) * 100 : 0 };
    });
    return { people: [...map.values()].sort((a, b) => b.contributions - a.contributions), perRepo };
  }, [contributors, user.login]);

  const header = (
    <ViewHeader
      icon="fa-solid fa-users"
      title="Contributors"
      subtitle={`People who contribute to @${user.login}'s most popular repositories`}
    />
  );

  if (pending.repos || pending.contributors || (!contributors && !errors.contributors && repos))
    return (
      <div className="view">
        {header}
        <SkeletonList rows={5} height={64} />
      </div>
    );

  if (errors.contributors || errors.repos)
    return (
      <div className="view">
        {header}
        <InlineError error={errors.contributors || errors.repos} what="contributors" onRetry={() => retryKey("contributors")} />
      </div>
    );

  if (!perRepo.length)
    return (
      <div className="view">
        {header}
        <EmptyState icon="fa-solid fa-users-slash" title="No repositories to analyze" />
      </div>
    );

  return (
    <div className="view">
      {header}

      <section className="panel">
        <h3>Collaborators ({people.length})</h3>
        <p className="card-subtitle">Combined commits across the top {perRepo.length} repositories (bots excluded)</p>
        {people.length === 0 ? (
          <EmptyState compact icon="fa-solid fa-user" title="Solo projects" text={`Nobody else has committed to these repositories yet — it's all @${user.login}.`} />
        ) : (
          <div className="people-grid">
            {people.slice(0, 24).map((p) => (
              <a className="person" key={p.login} href={p.html_url} target="_blank" rel="noreferrer">
                <img src={p.avatar_url} alt="" loading="lazy" />
                <div>
                  <strong>{p.login}</strong>
                  <span>
                    {formatNumber(p.contributions)} commits · {p.repos.length} repo{p.repos.length > 1 ? "s" : ""}
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <h3>By repository</h3>
        <ul className="row-list">
          {perRepo.map(({ repo, humans, total, selfShare }) => (
            <li className="row repo-contrib-row" key={repo.id}>
              <div className="row-main">
                <a className="row-title" href={`${repo.html_url}/graphs/contributors`} target="_blank" rel="noreferrer">
                  {repo.name}
                </a>
                <span className="row-sub">
                  {humans.length} contributor{humans.length === 1 ? "" : "s"} · {formatNumber(total)} commits · @{user.login} wrote{" "}
                  {selfShare.toFixed(0)}%
                </span>
                <div className="share-bar" aria-hidden="true">
                  <span style={{ width: `${selfShare}%` }} />
                </div>
              </div>
              <div className="avatar-stack">
                {humans.slice(0, 6).map((c) => (
                  <a key={c.login} href={c.html_url} target="_blank" rel="noreferrer" title={`${c.login}: ${c.contributions} commits`}>
                    <img src={c.avatar_url} alt={c.login} loading="lazy" />
                  </a>
                ))}
                {humans.length > 6 && <span className="avatar-more">+{humans.length - 6}</span>}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default Contributors;
