import "../CSS/Views.css";
import { useGitHub } from "../Context/GitHubContext";
import { RecentChips, SearchForm } from "../components/ui";

const EXAMPLES = ["torvalds", "gaearon", "sindresorhus", "yyx990803", "tj"];

const FEATURES = [
  { icon: "fa-solid fa-chart-pie", title: "Profile dashboard", text: "Followers, stars, commits, PRs and issues with 30-day trends.", view: "dashboard" },
  { icon: "fa-solid fa-calendar-days", title: "Contribution calendar", text: "The full year heatmap, with past years one click away.", view: "dashboard" },
  { icon: "fa-solid fa-code-branch", title: "Repository explorer", text: "Search, filter and sort every public repository.", view: "repositories" },
  { icon: "fa-solid fa-code-commit", title: "Commit history", text: "Latest commits grouped by day and by repository.", view: "commits" },
  { icon: "fa-solid fa-users", title: "Collaborators", text: "Who else contributes to their most popular projects.", view: "contributors" },
  { icon: "fa-solid fa-chart-line", title: "Analytics", text: "Streaks, busiest weekdays, language mix and more.", view: "analytics" },
];

const Home = () => {
  const { search, profile, navigate, hasToken } = useGitHub();

  return (
    <div className="view home">
      <section className="hero panel">
        <div className="hero-badge">
          <i className="fa-brands fa-github" aria-hidden="true" /> Live data from the GitHub API
        </div>
        <h1>Analyze any GitHub profile</h1>
        <p>Enter a username to see their repositories, languages, contributions and activity — all in one dashboard.</p>
        <SearchForm large autoFocus />
        <div className="examples">
          <span className="muted">Try:</span>
          {EXAMPLES.map((e) => (
            <button key={e} className="chip" onClick={() => search(e, "dashboard")}>
              {e}
            </button>
          ))}
        </div>
        <RecentChips />
        {!hasToken && (
          <p className="hero-note">
            <i className="fa-solid fa-key" aria-hidden="true" /> Running without a token (60 requests/hour).{" "}
            <button className="link-btn" onClick={() => navigate("settings")}>Add one in Settings</button> to unlock the contribution calendar.
          </p>
        )}
      </section>

      {profile?.user && (
        <button className="continue panel" onClick={() => navigate("dashboard")}>
          <img src={profile.user.avatar_url} alt="" />
          <div>
            <span className="muted">Continue where you left off</span>
            <strong>{profile.user.name || profile.login}</strong>
          </div>
          <i className="fa-solid fa-arrow-right" aria-hidden="true" />
        </button>
      )}

      <div className="feature-grid">
        {FEATURES.map((f) => (
          <button className="feature panel" key={f.title} onClick={() => navigate(f.view)}>
            <i className={f.icon} aria-hidden="true" />
            <h3>{f.title}</h3>
            <p>{f.text}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Home;
