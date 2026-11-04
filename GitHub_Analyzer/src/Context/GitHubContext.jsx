import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import * as api from "../components/services/githubApi";

const GitHubContext = createContext(null);

export const USER_VIEWS = [
  "dashboard",
  "repositories",
  "commits",
  "contributors",
  "analytics",
  "issues",
  "stars",
];
const GLOBAL_VIEWS = ["settings", "help"];

const RECENT_KEY = "gha_recent";
const THEME_KEY = "gha_theme";

const readJSON = (key, fallback) => {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
};
const writeJSON = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
};

/* ---------------- hash routing: #/login/view, #/settings, #/help ---------------- */

const parseHash = () => {
  const parts = window.location.hash
    .replace(/^#\/?/, "")
    .split("/")
    .filter(Boolean)
    .map((p) => decodeURIComponent(p));
  if (!parts.length) return { view: "home", login: null };
  if (GLOBAL_VIEWS.includes(parts[0])) return { view: parts[0], login: null };
  // "#/~/repositories" = a user view opened before any user was searched
  if (parts[0] === "~") return { view: USER_VIEWS.includes(parts[1]) ? parts[1] : "dashboard", login: null };
  return { login: parts[0], view: USER_VIEWS.includes(parts[1]) ? parts[1] : "dashboard" };
};

const buildHash = (view, login) => {
  if (view === "home") return "#/";
  if (GLOBAL_VIEWS.includes(view)) return `#/${view}`;
  const suffix = view === "dashboard" ? "" : `/${view}`;
  return login ? `#/${encodeURIComponent(login)}${suffix}` : `#/~/${view}`;
};

/** Accepts "octocat", "@octocat", "octocat/repo", "https://github.com/octocat/repo". */
export const parseSearchInput = (raw) => {
  let value = (raw || "").trim();
  value = value.replace(/^https?:\/\/(www\.)?github\.com\//i, "").replace(/^@/, "");
  const [login, repo] = value.split(/[/?#]/).filter(Boolean);
  if (!login || !/^[a-z\d](?:[a-z\d-]{0,38})$/i.test(login)) return null;
  return { login, repo: repo || "" };
};

const emptyProfile = (login) => ({
  login,
  user: null,
  repos: null,
  events: null,
  commits: null,
  prs: null,
  issues: null,
  contributions: null,
  languages: null,
  starred: null,
  contributors: null,
  errors: {},
  pending: {},
});

export const CHART_THEME = {
  dark: {
    grid: "#21262d",
    axis: "#8b949e",
    tooltipBg: "#161b22",
    tooltipBorder: "#30363d",
    text: "#f0f6fc",
    accent: "#a371f7",
    surface: "#0d1117",
    cursor: "rgba(163,113,247,0.08)",
  },
  light: {
    grid: "#e5e9ee",
    axis: "#59636e",
    tooltipBg: "#ffffff",
    tooltipBorder: "#d1d9e0",
    text: "#1f2328",
    accent: "#8250df",
    surface: "#ffffff",
    cursor: "rgba(130,80,223,0.08)",
  },
};

export const GitHubProvider = ({ children }) => {
  const [route, setRoute] = useState(parseHash);
  const [profile, setProfile] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | loading | ready | error
  const [error, setError] = useState(null);
  const [repoQuery, setRepoQuery] = useState("");
  const [searchId, setSearchId] = useState(0); // bumps on every search so views reset their filters
  const [recent, setRecent] = useState(() => readJSON(RECENT_KEY, []));
  const [tokenSource, setTokenSource] = useState(api.getTokenSource);
  const [theme, setTheme] = useState(() => {
    const saved = readJSON(THEME_KEY, null);
    if (saved) return saved;
    return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
  });

  const requestId = useRef(0);
  const cache = useRef(new Map());

  /* theme */
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    writeJSON(THEME_KEY, theme);
  }, [theme]);
  const toggleTheme = useCallback(() => setTheme((t) => (t === "dark" ? "light" : "dark")), []);

  /* routing */
  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const navigate = useCallback(
    (view, login) => {
      const target = login ?? profile?.login ?? route.login;
      const hash = buildHash(view, target);
      if (window.location.hash === hash) setRoute(parseHash());
      else window.location.hash = hash;
      window.scrollTo?.({ top: 0, behavior: "smooth" });
    },
    [profile?.login, route.login]
  );

  /* keep cache in sync with the current profile */
  useEffect(() => {
    if (profile?.user) cache.current.set(profile.login.toLowerCase(), profile);
  }, [profile]);

  const addRecent = useCallback((user) => {
    setRecent((list) => {
      const next = [
        { login: user.login, avatar: user.avatar_url, name: user.name },
        ...list.filter((r) => r.login.toLowerCase() !== user.login.toLowerCase()),
      ].slice(0, 8);
      writeJSON(RECENT_KEY, next);
      return next;
    });
  }, []);

  const removeRecent = useCallback((login) => {
    setRecent((list) => {
      const next = login ? list.filter((r) => r.login !== login) : [];
      writeJSON(RECENT_KEY, next);
      return next;
    });
  }, []);

  /* --------------------------- data loading --------------------------- */

  const load = useCallback(
    async (login, { force = false } = {}) => {
      const key = login.toLowerCase();
      if (!force && cache.current.has(key)) {
        requestId.current += 1;
        setProfile(cache.current.get(key));
        setStatus("ready");
        setError(null);
        return;
      }

      const id = ++requestId.current;
      const isCurrent = () => id === requestId.current;
      const hasToken = Boolean(api.getToken());

      setStatus("loading");
      setError(null);
      setProfile({
        ...emptyProfile(login),
        pending: {
          user: true,
          repos: true,
          languages: true,
          events: true,
          commits: true,
          prs: true,
          issues: true,
          contributions: hasToken,
        },
      });

      let user;
      try {
        user = await api.getUser(login);
      } catch (e) {
        if (!isCurrent()) return;
        setStatus("error");
        setError(e.kind === "notfound" ? `No GitHub user named "${login}" was found.` : e.message);
        setProfile(null);
        return;
      }
      if (!isCurrent()) return;

      const canonical = user.login;
      setProfile((p) => ({ ...p, login: canonical, user, pending: { ...p.pending, user: false } }));
      setStatus("ready");
      addRecent(user);

      // fix capitalisation in the URL without reloading
      const current = parseHash();
      if (current.login && current.login !== canonical) {
        window.history.replaceState(null, "", buildHash(current.view, canonical));
        setRoute(parseHash());
      }

      const settle = (key, promise) =>
        promise.then(
          (value) => {
            if (!isCurrent()) return;
            setProfile((p) => ({ ...p, [key]: value, pending: { ...p.pending, [key]: false } }));
          },
          (err) => {
            if (!isCurrent()) return;
            setProfile((p) => ({
              ...p,
              errors: { ...p.errors, [key]: err },
              pending: { ...p.pending, [key]: false },
            }));
          }
        );

      const reposPromise = api.getRepositories(canonical);
      settle("repos", reposPromise);
      settle(
        "languages",
        reposPromise.then((repos) => api.getTopLanguages(repos))
      );
      settle("events", api.getEvents(canonical));
      settle("commits", api.searchCommits(canonical));
      settle("prs", api.searchPullRequests(canonical));
      settle("issues", api.searchIssues(canonical));
      if (hasToken) settle("contributions", api.getContributions(canonical));
    },
    [addRecent]
  );

  /** Lazily loaded data for the Stars / Contributors views. */
  const ensure = useCallback(
    (key) => {
      if (!profile?.user || profile[key] || profile.pending[key] || profile.errors[key]) return;
      const id = requestId.current;
      const login = profile.login;
      let promise;
      if (key === "starred") promise = api.getStarred(login);
      else if (key === "contributors") {
        if (!profile.repos) return;
        const own = profile.repos.filter((r) => !r.fork);
        const top = [...(own.length ? own : profile.repos)]
          .sort((a, b) => b.stargazers_count - a.stargazers_count || new Date(b.pushed_at) - new Date(a.pushed_at))
          .slice(0, 6);
        promise = Promise.allSettled(top.map((r) => api.getRepoContributors(r.full_name))).then((results) => {
          const failed = results.find((r) => r.status === "rejected");
          if (failed && results.every((r) => r.status === "rejected")) throw failed.reason;
          return top.map((repo, i) => ({
            repo,
            contributors: results[i].status === "fulfilled" ? results[i].value : [],
          }));
        });
      } else return;

      setProfile((p) => ({ ...p, pending: { ...p.pending, [key]: true } }));
      promise.then(
        (value) => {
          if (id !== requestId.current) return;
          setProfile((p) => ({ ...p, [key]: value, pending: { ...p.pending, [key]: false } }));
        },
        (err) => {
          if (id !== requestId.current) return;
          setProfile((p) => ({
            ...p,
            errors: { ...p.errors, [key]: err },
            pending: { ...p.pending, [key]: false },
          }));
        }
      );
    },
    [profile]
  );

  const retryKey = useCallback((key) => {
    setProfile((p) => {
      if (!p) return p;
      const errors = { ...p.errors };
      delete errors[key];
      return { ...p, errors };
    });
  }, []);

  /* load whenever the URL points at a different user */
  useEffect(() => {
    if (!route.login) return;
    if (route.login.toLowerCase() === profile?.login?.toLowerCase() && status !== "error") return;
    load(route.login);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.login]);

  const search = useCallback(
    (raw, view) => {
      const parsed = parseSearchInput(raw);
      if (!parsed) {
        return { ok: false, message: `"${raw.trim()}" isn't a valid GitHub username.` };
      }
      setRepoQuery(parsed.repo);
      setSearchId((n) => n + 1);
      const targetView = parsed.repo ? "repositories" : view || (USER_VIEWS.includes(route.view) ? route.view : "dashboard");
      const same = parsed.login.toLowerCase() === profile?.login?.toLowerCase();
      if (same && status === "error") load(parsed.login, { force: true });
      if (!same && route.login?.toLowerCase() === parsed.login.toLowerCase()) load(parsed.login, { force: true });
      navigate(targetView, parsed.login);
      return { ok: true };
    },
    [navigate, route.view, route.login, profile?.login, status, load]
  );

  const reload = useCallback(() => {
    const login = profile?.login || route.login;
    if (login) {
      cache.current.delete(login.toLowerCase());
      load(login, { force: true });
    }
  }, [profile?.login, route.login, load]);

  const updateToken = useCallback(
    (token) => {
      api.saveToken(token);
      setTokenSource(api.getTokenSource());
      cache.current.clear();
      if (profile?.login) load(profile.login, { force: true });
    },
    [profile?.login, load]
  );

  const value = useMemo(
    () => ({
      route,
      navigate,
      profile,
      status,
      error,
      search,
      reload,
      ensure,
      retryKey,
      repoQuery,
      setRepoQuery,
      searchId,
      recent,
      removeRecent,
      theme,
      setTheme,
      toggleTheme,
      chart: CHART_THEME[theme],
      tokenSource,
      hasToken: tokenSource !== "none",
      updateToken,
    }),
    [route, navigate, profile, status, error, search, reload, ensure, retryKey, repoQuery, searchId, recent, removeRecent, theme, toggleTheme, tokenSource, updateToken]
  );

  return <GitHubContext.Provider value={value}>{children}</GitHubContext.Provider>;
};

export const useGitHub = () => {
  const ctx = useContext(GitHubContext);
  if (!ctx) throw new Error("useGitHub must be used inside <GitHubProvider>");
  return ctx;
};
