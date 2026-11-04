# GitHub Analyzer

Analyze any GitHub profile — repositories, languages, contributions, commits, PRs, issues, stars and collaborators — using live data from the GitHub API.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

## GitHub token (optional but recommended)

Without a token GitHub allows **60 requests/hour** and the contribution calendar is unavailable (it only comes from the GraphQL API).

1. Create a fine-grained token: https://github.com/settings/personal-access-tokens/new — *Public repositories (read-only)* is enough.
2. Open the app → **Settings** → paste the token → **Save token**.

The token is stored only in your browser (localStorage) and sent only to `api.github.com`.
You *can* put it in `.env` as `VITE_GITHUB_TOKEN` for local development, but Vite embeds it into the built JS, so never deploy a build made that way.

## Features

| Page | What it shows |
| --- | --- |
| Home | Search, example users, recent searches |
| Dashboard | Profile, followers/stars, 30-day trends, contribution calendar (with year picker), top languages, top repos, recent activity |
| Repositories | Every public repo with search, type/language filters and sorting |
| Commits | Latest commits grouped by day, filter by repo/message, commits-per-repo chart |
| Contributors | Collaborators across the user's most popular repos |
| Analytics | KPIs, streaks, stars per repo, repos per year, languages, weekday activity, event breakdown |
| Issues & PRs | Opened issues/PRs with open/merged/closed filters and merge rate |
| Stars | Stars earned + repos the user starred |
| Settings | Token, API rate-limit meters, dark/light theme, clear data |
| Help | FAQ, metric definitions, shortcuts |

Other details: dark/light theme, shareable URLs (`#/torvalds/analytics`), `/` keyboard shortcut, `owner/repo` or profile-URL search, per-session caching, loading skeletons, and clear errors for unknown users and rate limits.

## Structure

```
src/
  Context/GitHubContext.jsx      app state, routing, data loading, cache, theme
  components/services/githubApi.js  all GitHub API calls + error/rate-limit handling
  components/                    navbar, sidebar, dashboard widgets, shared UI
  views/                         one file per sidebar page
  utils/                         formatting + stats helpers
  CSS/                           styles (theme variables live in src/index.css)
```
