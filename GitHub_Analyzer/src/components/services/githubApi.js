import axios from "axios";

/* ------------------------------------------------------------------ */
/*  Token handling                                                     */
/*  A token is OPTIONAL. Without it GitHub allows 60 requests/hour and */
/*  the contribution calendar (GraphQL) is unavailable.                */
/*  Priority: token saved in Settings (localStorage) > .env token.     */
/* ------------------------------------------------------------------ */

const TOKEN_KEY = "gha_token";

export const getStoredToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
};

export const getEnvToken = () => (import.meta.env.VITE_GITHUB_TOKEN || "").trim();

export const getToken = () => getStoredToken() || getEnvToken();

export const getTokenSource = () =>
  getStoredToken() ? "settings" : getEnvToken() ? "env" : "none";

export const saveToken = (token) => {
  try {
    if (token && token.trim()) localStorage.setItem(TOKEN_KEY, token.trim());
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable */
  }
};

/* ------------------------------------------------------------------ */
/*  Errors                                                             */
/* ------------------------------------------------------------------ */

export class GitHubError extends Error {
  constructor(message, { status = null, kind = "other" } = {}) {
    super(message);
    this.status = status;
    this.kind = kind; // notfound | auth | ratelimit | network | needs-token | graphql | other
  }
}

const toGitHubError = (err) => {
  if (err instanceof GitHubError) return err;
  const status = err.response?.status;
  const headers = err.response?.headers || {};
  const apiMessage = err.response?.data?.message || err.message;

  if (status === 404) return new GitHubError("Not found", { status, kind: "notfound" });
  if (status === 401)
    return new GitHubError(
      "Your GitHub token is invalid or expired. Update or remove it in Settings.",
      { status, kind: "auth" }
    );
  if (
    (status === 403 || status === 429) &&
    (headers["x-ratelimit-remaining"] === "0" || /rate limit/i.test(apiMessage))
  ) {
    const reset = headers["x-ratelimit-reset"]
      ? new Date(Number(headers["x-ratelimit-reset"]) * 1000)
      : null;
    const when = reset
      ? ` It resets at ${reset.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`
      : "";
    const hint = getToken()
      ? ""
      : " Add a GitHub token in Settings to raise the limit from 60 to 5,000 requests per hour.";
    return new GitHubError(`GitHub API rate limit reached.${when}${hint}`, {
      status,
      kind: "ratelimit",
    });
  }
  if (!err.response)
    return new GitHubError("Network error — couldn't reach GitHub. Check your connection.", {
      kind: "network",
    });
  return new GitHubError(apiMessage || `Request failed (${status})`, { status, kind: "other" });
};

/* ------------------------------------------------------------------ */
/*  Rate-limit tracking (GitHub exposes these headers to browsers)     */
/* ------------------------------------------------------------------ */

const rateLimit = {};
const rateListeners = new Set();

const recordRateLimit = (headers) => {
  if (!headers || headers["x-ratelimit-remaining"] === undefined) return;
  const resource = headers["x-ratelimit-resource"] || "core";
  rateLimit[resource] = {
    limit: Number(headers["x-ratelimit-limit"]),
    remaining: Number(headers["x-ratelimit-remaining"]),
    reset: Number(headers["x-ratelimit-reset"]) * 1000,
  };
  rateListeners.forEach((fn) => fn({ ...rateLimit }));
};

export const getRateLimitSnapshot = () => ({ ...rateLimit });
export const onRateLimitChange = (fn) => {
  rateListeners.add(fn);
  return () => rateListeners.delete(fn);
};

/* ------------------------------------------------------------------ */
/*  HTTP client                                                        */
/* ------------------------------------------------------------------ */

const githubAPI = axios.create({
  baseURL: "https://api.github.com",
  headers: { Accept: "application/vnd.github+json" },
  timeout: 20000,
});

githubAPI.interceptors.request.use((config) => {
  const token = getToken();
  // Only send the header when we actually have a token —
  // "Bearer undefined" makes GitHub reject every request with 401.
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

githubAPI.interceptors.response.use(
  (response) => {
    recordRateLimit(response.headers);
    return response;
  },
  (error) => {
    recordRateLimit(error.response?.headers);
    return Promise.reject(toGitHubError(error));
  }
);

const enc = encodeURIComponent;

/* ------------------------------------------------------------------ */
/*  REST endpoints                                                     */
/* ------------------------------------------------------------------ */

export const getUser = async (username) => {
  const { data } = await githubAPI.get(`/users/${enc(username)}`);
  return data;
};

/** All public repos (paginated, up to maxPages × 100). */
export const getRepositories = async (username, maxPages = 3) => {
  const all = [];
  for (let page = 1; page <= maxPages; page++) {
    const { data } = await githubAPI.get(`/users/${enc(username)}/repos`, {
      params: { per_page: 100, page, sort: "pushed" },
    });
    all.push(...data);
    if (data.length < 100) break;
  }
  return all;
};

/** Public events from the last 90 days (GitHub's limit). */
export const getEvents = async (username) => {
  const { data } = await githubAPI.get(`/users/${enc(username)}/events/public`, {
    params: { per_page: 100 },
  });
  return data;
};

export const getStarred = async (username) => {
  const { data } = await githubAPI.get(`/users/${enc(username)}/starred`, {
    params: { per_page: 100 },
  });
  return data;
};

export const getRepoContributors = async (fullName) => {
  const { data } = await githubAPI.get(`/repos/${fullName}/contributors`, {
    params: { per_page: 15 },
  });
  return Array.isArray(data) ? data : []; // empty repos return 204
};

export const getRepoLanguages = async (fullName) => {
  const { data } = await githubAPI.get(`/repos/${fullName}/languages`);
  return data;
};

export const getRateLimit = async () => {
  const { data } = await githubAPI.get("/rate_limit");
  return data;
};

export const getAuthenticatedUser = async () => {
  const { data } = await githubAPI.get("/user");
  return data;
};

/* ------------------------------------------------------------------ */
/*  Search (returns total_count + latest 100 items)                    */
/* ------------------------------------------------------------------ */

const search = async (type, q, sort) => {
  const { data } = await githubAPI.get(`/search/${type}`, {
    params: { q, sort, order: "desc", per_page: 100 },
  });
  return data;
};

export const searchCommits = (username) => search("commits", `author:${username}`, "author-date");
export const searchPullRequests = (username) =>
  search("issues", `author:${username} is:pr`, "created");
export const searchIssues = (username) =>
  search("issues", `author:${username} is:issue`, "created");

/* ------------------------------------------------------------------ */
/*  GraphQL — contribution calendar (requires a token)                 */
/* ------------------------------------------------------------------ */

const CONTRIBUTIONS_QUERY = `
  query($login: String!, $from: DateTime, $to: DateTime) {
    user(login: $login) {
      contributionsCollection(from: $from, to: $to) {
        contributionYears
        totalCommitContributions
        totalPullRequestContributions
        totalIssueContributions
        totalPullRequestReviewContributions
        restrictedContributionsCount
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
              weekday
              contributionLevel
            }
          }
        }
      }
    }
  }
`;

/** year = undefined → last 12 months; year = 2024 → that calendar year. */
export const getContributions = async (login, year) => {
  if (!getToken()) {
    throw new GitHubError("The contribution calendar needs a GitHub token.", {
      kind: "needs-token",
    });
  }
  const variables = { login };
  if (year) {
    const now = new Date();
    variables.from = `${year}-01-01T00:00:00Z`;
    variables.to =
      Number(year) === now.getUTCFullYear() ? now.toISOString() : `${year}-12-31T23:59:59Z`;
  }
  const { data } = await githubAPI.post("/graphql", { query: CONTRIBUTIONS_QUERY, variables });
  if (data.errors?.length) throw new GitHubError(data.errors[0].message, { kind: "graphql" });
  return data.data?.user?.contributionsCollection ?? null;
};

/* ------------------------------------------------------------------ */
/*  Top languages                                                      */
/*  With a token: real byte counts from the 30 most recently pushed    */
/*  repos. Without: each repo's primary language weighted by size      */
/*  (keeps us inside the 60 req/hour anonymous limit).                 */
/* ------------------------------------------------------------------ */

export const getTopLanguages = async (repos) => {
  const own = repos.filter((r) => !r.fork);
  const source = own.length ? own : repos;

  if (getToken() && source.length) {
    const sample = [...source]
      .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at))
      .slice(0, 30);
    const results = await Promise.allSettled(sample.map((r) => getRepoLanguages(r.full_name)));
    const totals = {};
    results.forEach((result) => {
      if (result.status === "fulfilled") {
        Object.entries(result.value).forEach(([lang, bytes]) => {
          totals[lang] = (totals[lang] || 0) + bytes;
        });
      }
    });
    if (Object.keys(totals).length) {
      return { totals, basis: `Bytes of code in ${sample.length} most recently updated repos` };
    }
  }

  const totals = {};
  source.forEach((repo) => {
    if (repo.language) totals[repo.language] = (totals[repo.language] || 0) + Math.max(repo.size, 1);
  });
  return { totals, basis: `Main language of ${source.length} repos, weighted by size` };
};
