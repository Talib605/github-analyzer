import { useEffect, useState } from "react";
import "../CSS/Views.css";
import { useGitHub } from "../Context/GitHubContext";
import { ViewHeader, Spinner } from "../components/ui";
import * as api from "../components/services/githubApi";

const RESOURCES = [
  ["core", "REST API"],
  ["search", "Search API"],
  ["graphql", "GraphQL API"],
];

const Settings = () => {
  const { tokenSource, updateToken, theme, setTheme, recent, removeRecent, profile, reload } = useGitHub();
  const [token, setToken] = useState("");
  const [show, setShow] = useState(false);
  const [check, setCheck] = useState(null); // {state, text}
  const [limits, setLimits] = useState(api.getRateLimitSnapshot());
  const [loadingLimits, setLoadingLimits] = useState(false);

  useEffect(() => api.onRateLimitChange(setLimits), []);

  const refreshLimits = async () => {
    setLoadingLimits(true);
    try {
      const data = await api.getRateLimit();
      const next = {};
      RESOURCES.forEach(([key]) => {
        const v = data.resources?.[key];
        if (v) next[key] = { limit: v.limit, remaining: v.remaining, reset: v.reset * 1000 };
      });
      setLimits(next);
    } catch (e) {
      setCheck({ state: "error", text: e.message });
    } finally {
      setLoadingLimits(false);
    }
  };

  useEffect(() => {
    refreshLimits();
  }, [tokenSource]);

  const testToken = async (candidate) => {
    setCheck({ state: "loading", text: "Checking token…" });
    const previous = api.getStoredToken();
    api.saveToken(candidate); // temporarily use the candidate token
    try {
      const me = await api.getAuthenticatedUser();
      setCheck({ state: "ok", text: `Token works — authenticated as @${me.login}.` });
      return true;
    } catch (e) {
      setCheck({ state: "error", text: e.kind === "auth" ? "GitHub rejected this token. Check that you copied it fully and it hasn't expired." : e.message });
      return false;
    } finally {
      api.saveToken(previous);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    const value = token.trim();
    if (!value) return;
    const ok = await testToken(value);
    if (ok) {
      updateToken(value);
      setToken("");
    }
  };

  const sourceText = {
    settings: "Using the token saved in this browser.",
    env: "Using VITE_GITHUB_TOKEN from your .env file. Note: Vite embeds this into the built JavaScript, so anyone can read it from a deployed site.",
    none: "No token — limited to 60 requests/hour and no contribution calendar.",
  }[tokenSource];

  return (
    <div className="view settings">
      <ViewHeader icon="fa-solid fa-gear" title="Settings" subtitle="Personal access token, appearance and stored data" />

      <section className="panel">
        <h3>GitHub token</h3>
        <p className={`token-status ${tokenSource}`}>
          <i className={tokenSource === "none" ? "fa-solid fa-circle-exclamation" : "fa-solid fa-circle-check"} aria-hidden="true" /> {sourceText}
        </p>
        <p className="muted small">
          A token raises the limit to 5,000 requests/hour and enables the contribution calendar, streaks and accurate language stats. Create a{" "}
          <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noreferrer">fine-grained token</a> with{" "}
          <em>Public repositories (read-only)</em> access — no extra permissions are needed. It's stored only in this browser's localStorage and is sent only to api.github.com.
        </p>

        <form className="token-form" onSubmit={save}>
          <div className="input-with-action">
            <input
              type={show ? "text" : "password"}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="github_pat_… or ghp_…"
              aria-label="GitHub personal access token"
              autoComplete="off"
              spellCheck="false"
            />
            <button type="button" className="icon-btn" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide token" : "Show token"}>
              <i className={show ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"} aria-hidden="true" />
            </button>
          </div>
          <button className="btn btn-primary" type="submit" disabled={!token.trim() || check?.state === "loading"}>
            Save token
          </button>
          {tokenSource === "settings" && (
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                updateToken("");
                setCheck({ state: "ok", text: "Saved token removed from this browser." });
              }}
            >
              Remove saved token
            </button>
          )}
          {tokenSource !== "none" && (
            <button type="button" className="btn btn-ghost" onClick={() => testToken(api.getToken())}>
              Test current token
            </button>
          )}
        </form>
        {check && (
          <p className={`check-result ${check.state}`} role="status">
            {check.state === "loading" && <Spinner size={12} />} {check.text}
          </p>
        )}
      </section>

      <section className="panel">
        <div className="panel-title-row">
          <h3>API rate limits</h3>
          <button className="btn btn-ghost btn-sm" onClick={refreshLimits} disabled={loadingLimits}>
            {loadingLimits ? <Spinner size={12} /> : <i className="fa-solid fa-rotate" aria-hidden="true" />} Refresh
          </button>
        </div>
        <div className="limit-grid">
          {RESOURCES.map(([key, label]) => {
            const l = limits[key]?.limit > 0 ? limits[key] : null;
            const pct = l ? (l.remaining / l.limit) * 100 : 0;
            return (
              <div className="limit" key={key}>
                <div className="limit-head">
                  <span>{label}</span>
                  <strong>{l ? `${l.remaining.toLocaleString()} / ${l.limit.toLocaleString()}` : "—"}</strong>
                </div>
                <div className={`meter ${pct < 15 ? "low" : ""}`}>
                  <span style={{ width: `${pct}%` }} />
                </div>
                <small className="muted">
                  {l ? `Resets at ${new Date(l.reset).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : key === "graphql" && tokenSource === "none" ? "Requires a token" : "Not used yet"}
                </small>
              </div>
            );
          })}
        </div>
      </section>

      <section className="panel">
        <h3>Appearance</h3>
        <div className="segmented" role="radiogroup" aria-label="Theme">
          {["dark", "light"].map((t) => (
            <button key={t} role="radio" aria-checked={theme === t} className={theme === t ? "active" : ""} onClick={() => setTheme(t)}>
              <i className={t === "dark" ? "fa-solid fa-moon" : "fa-solid fa-sun"} aria-hidden="true" /> {t === "dark" ? "Dark" : "Light"}
            </button>
          ))}
        </div>
      </section>

      <section className="panel">
        <h3>Data</h3>
        <div className="btn-row">
          <button className="btn btn-ghost" onClick={() => removeRecent(null)} disabled={!recent.length}>
            <i className="fa-solid fa-clock-rotate-left" aria-hidden="true" /> Clear recent searches ({recent.length})
          </button>
          <button className="btn btn-ghost" onClick={reload} disabled={!profile?.login}>
            <i className="fa-solid fa-rotate" aria-hidden="true" /> Re-fetch {profile?.login ? `@${profile.login}` : "current profile"}
          </button>
        </div>
      </section>
    </div>
  );
};

export default Settings;
