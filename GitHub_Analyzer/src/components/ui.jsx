import { useState } from "react";
import { useGitHub } from "../Context/GitHubContext";
import "../CSS/ui.css";

export const Spinner = ({ size = 16 }) => (
  <span className="spinner" style={{ width: size, height: size }} aria-label="Loading" role="status" />
);

export const Skeleton = ({ height = 16, width = "100%", radius = 8, style }) => (
  <span className="skeleton" style={{ height, width, borderRadius: radius, ...style }} />
);

export const SkeletonList = ({ rows = 4, height = 44 }) => (
  <div className="skeleton-list">
    {Array.from({ length: rows }).map((_, i) => (
      <Skeleton key={i} height={height} />
    ))}
  </div>
);

export const EmptyState = ({ icon = "fa-solid fa-inbox", title, text, children, compact }) => (
  <div className={`empty-state ${compact ? "compact" : ""}`}>
    <i className={icon} aria-hidden="true" />
    {title && <h4>{title}</h4>}
    {text && <p>{text}</p>}
    {children}
  </div>
);

/** Error shown inside a card. Handles the "needs a token" case with a CTA. */
export const InlineError = ({ error, onRetry, what = "this data" }) => {
  const { navigate } = useGitHub();
  if (!error) return null;
  if (error.kind === "needs-token") {
    return (
      <EmptyState compact icon="fa-solid fa-key" title="GitHub token required" text={error.message}>
        <button className="btn btn-primary btn-sm" onClick={() => navigate("settings")}>
          Add token in Settings
        </button>
      </EmptyState>
    );
  }
  return (
    <div className="inline-error" role="alert">
      <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />
      <div>
        <strong>Couldn't load {what}.</strong>
        <span>{error.message}</span>
      </div>
      {onRetry && (
        <button className="btn btn-ghost btn-sm" onClick={onRetry}>
          Retry
        </button>
      )}
      {error.kind === "ratelimit" && (
        <button className="btn btn-ghost btn-sm" onClick={() => navigate("settings")}>
          Settings
        </button>
      )}
    </div>
  );
};

export const ViewHeader = ({ title, subtitle, actions, icon }) => (
  <div className="view-header">
    <div>
      <h2>
        {icon && <i className={icon} aria-hidden="true" />}
        {title}
      </h2>
      {subtitle && <p>{subtitle}</p>}
    </div>
    {actions && <div className="view-actions">{actions}</div>}
  </div>
);

export const SearchForm = ({ autoFocus = false, large = false, placeholder }) => {
  const { search, status } = useGitHub();
  const [value, setValue] = useState("");
  const [message, setMessage] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (!value.trim()) {
      setMessage("Type a GitHub username first.");
      return;
    }
    const result = search(value);
    setMessage(result.ok ? "" : result.message);
  };

  return (
    <form className={`search-form ${large ? "large" : ""}`} onSubmit={submit}>
      <div className="search-form-row">
        <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
        <input
          type="text"
          value={value}
          autoFocus={autoFocus}
          onChange={(e) => {
            setValue(e.target.value);
            if (message) setMessage("");
          }}
          placeholder={placeholder || "Enter a GitHub username, e.g. torvalds"}
          aria-label="GitHub username"
          autoComplete="off"
          spellCheck="false"
        />
        <button className="btn btn-primary" type="submit" disabled={status === "loading"}>
          {status === "loading" ? <Spinner size={14} /> : "Analyze"}
        </button>
      </div>
      {message && <p className="form-message">{message}</p>}
    </form>
  );
};

export const RecentChips = () => {
  const { recent, search, removeRecent } = useGitHub();
  if (!recent.length) return null;
  return (
    <div className="recent-chips">
      <span className="muted">Recent:</span>
      {recent.map((r) => (
        <span className="chip chip-user" key={r.login}>
          <button type="button" onClick={() => search(r.login, "dashboard")}>
            {r.avatar && <img src={r.avatar} alt="" />}
            {r.login}
          </button>
          <button
            type="button"
            className="chip-remove"
            aria-label={`Remove ${r.login} from recent`}
            onClick={() => removeRecent(r.login)}
          >
            ×
          </button>
        </span>
      ))}
    </div>
  );
};

export const NeedsUser = () => {
  const { route } = useGitHub();
  const label = route.view === "dashboard" ? "the dashboard" : `the ${route.view} view`;
  return (
    <div className="panel center-panel">
      <EmptyState
        icon="fa-brands fa-github"
        title="Search for a GitHub user first"
        text={`Enter a username to open ${label}.`}
      >
        <SearchForm autoFocus />
        <RecentChips />
      </EmptyState>
    </div>
  );
};

/** Shows a loading skeleton or a full-page error until the profile is ready. */
export const ProfileGate = ({ children }) => {
  const { status, error, profile, route, reload } = useGitHub();

  if (status === "error") {
    return (
      <div className="panel center-panel">
        <EmptyState icon="fa-solid fa-user-slash" title="Couldn't load this profile" text={error}>
          <div className="btn-row">
            <button className="btn btn-primary" onClick={reload}>
              Try again
            </button>
          </div>
          <SearchForm placeholder="Try another username…" />
        </EmptyState>
      </div>
    );
  }

  const loadingThisUser =
    status === "loading" || !profile?.user || profile.login.toLowerCase() !== route.login?.toLowerCase();

  if (loadingThisUser) {
    return (
      <div className="page-skeleton" aria-busy="true">
        <div className="skeleton-hero">
          <Skeleton width={96} height={96} radius={999} />
          <div style={{ flex: 1, display: "grid", gap: 10 }}>
            <Skeleton width="40%" height={22} />
            <Skeleton width="25%" />
            <Skeleton width="60%" />
          </div>
        </div>
        <div className="skeleton-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height={120} radius={14} />
          ))}
        </div>
        <Skeleton height={220} radius={12} />
      </div>
    );
  }

  return children;
};

export const tooltipProps = (chart) => ({
  contentStyle: {
    background: chart.tooltipBg,
    border: `1px solid ${chart.tooltipBorder}`,
    borderRadius: 8,
    color: chart.text,
    fontSize: 12,
    fontFamily: "Space Grotesk, sans-serif",
  },
  labelStyle: { color: chart.axis, marginBottom: 4 },
  itemStyle: { color: chart.text, padding: 0 },
  cursor: { fill: chart.cursor, stroke: chart.grid },
});

export const LanguageDot = ({ color, size = 10 }) => (
  <span className="language-dot" style={{ backgroundColor: color, width: size, height: size }} />
);

/** Show a list 25 items at a time. Resets when `resetKey` changes. */
export const usePaged = (items, pageSize = 25, resetKey) => {
  const [count, setCount] = useState(pageSize);
  const [key, setKey] = useState(resetKey);
  if (key !== resetKey) {
    setKey(resetKey);
    setCount(pageSize);
  }
  return {
    visible: items.slice(0, count),
    remaining: Math.max(0, items.length - count),
    more: () => setCount((c) => c + pageSize),
  };
};

export const ShowMore = ({ remaining, onClick }) =>
  remaining > 0 ? (
    <div className="show-more">
      <button className="btn btn-ghost" onClick={onClick}>
        Show more ({remaining} left)
      </button>
    </div>
  ) : null;
