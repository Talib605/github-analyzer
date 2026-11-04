import "../CSS/Sidebar.css";
import { useGitHub } from "../Context/GitHubContext";

const MAIN = [
  { view: "home", icon: "fa-solid fa-house", label: "Home" },
  { view: "dashboard", icon: "fa-solid fa-chart-pie", label: "Dashboard" },
  { view: "repositories", icon: "fa-solid fa-code-branch", label: "Repositories" },
  { view: "commits", icon: "fa-solid fa-code-commit", label: "Commits" },
  { view: "contributors", icon: "fa-solid fa-users", label: "Contributors" },
];

const ANALYTICS = [
  { view: "analytics", icon: "fa-solid fa-chart-line", label: "Analytics" },
  { view: "issues", icon: "fa-solid fa-bug", label: "Issues & PRs" },
  { view: "stars", icon: "fa-solid fa-star", label: "Stars" },
];

const BOTTOM = [
  { view: "settings", icon: "fa-solid fa-gear", label: "Settings" },
  { view: "help", icon: "fa-solid fa-circle-question", label: "Help & Support" },
];

const Sidebar = () => {
  const { route, navigate, profile } = useGitHub();

  const Item = ({ view, icon, label }) => (
    <button
      className={`nav-item ${route.view === view ? "active" : ""}`}
      onClick={() => navigate(view)}
      aria-current={route.view === view ? "page" : undefined}
      title={label}
    >
      <i className={icon} aria-hidden="true"></i>
      <span>{label}</span>
    </button>
  );

  return (
    <aside className="sidebar" aria-label="Main navigation">
      {profile?.user && (
        <button className="sidebar-user" onClick={() => navigate("dashboard")} title={`@${profile.login}`}>
          <img src={profile.user.avatar_url} alt="" />
          <span>
            <small>Analyzing</small>
            <strong>@{profile.login}</strong>
          </span>
        </button>
      )}

      <nav className="sidebar-nav">
        {MAIN.map((item) => (
          <Item key={item.view} {...item} />
        ))}

        <div className="nav-section-title">ANALYTICS</div>

        {ANALYTICS.map((item) => (
          <Item key={item.view} {...item} />
        ))}
      </nav>

      <div className="sidebar-bottom">
        {BOTTOM.map((item) => (
          <Item key={item.view} {...item} />
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;
