import "../CSS/Views.css";
import { useGitHub } from "../Context/GitHubContext";
import { ViewHeader } from "../components/ui";

const FAQ = [
  {
    q: "How do I analyze a profile?",
    a: (
      <>
        Type a GitHub username in the search bar (or press <kbd>/</kbd> to jump to it) and hit Enter. You can also paste a profile URL like{" "}
        <code>https://github.com/torvalds</code>, or <code>owner/repo</code> to jump straight to that repository in the Repositories view.
      </>
    ),
  },
  {
    q: "Why do I need a GitHub token?",
    a: (
      <>
        Without a token GitHub allows only 60 API requests per hour per IP address — about 6–8 profile lookups. The contribution calendar also comes
        from GitHub's GraphQL API, which always requires a token. A free, read-only token raises the limit to 5,000 requests/hour.
      </>
    ),
  },
  {
    q: "How do I create a token?",
    a: (
      <ol>
        <li>
          Open <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noreferrer">GitHub → Settings → Developer settings → Fine-grained tokens</a>.
        </li>
        <li>Give it a name and expiry, and leave repository access on <em>Public repositories (read-only)</em>.</li>
        <li>Click <em>Generate token</em>, copy it, and paste it in this app's Settings page.</li>
      </ol>
    ),
  },
  {
    q: "What does each number mean?",
    a: (
      <ul>
        <li><strong>Total commits</strong> — commits authored by the user that GitHub's search has indexed (public repos, default branches).</li>
        <li><strong>Contributions</strong> — the same number GitHub shows on the profile: commits, PRs, issues and reviews over the last year.</li>
        <li><strong>Pull requests / Issues</strong> — everything the user has opened, in any public repository.</li>
        <li><strong>Trend %</strong> — activity in the last 30 days compared with the 30 days before.</li>
        <li><strong>Stars earned</strong> — sum of stars on the user's own public repositories.</li>
        <li><strong>Top languages</strong> — bytes of code per language (with a token) or each repo's main language weighted by size (without).</li>
      </ul>
    ),
  },
  {
    q: "Why is some data limited to the latest 100 items?",
    a: "GitHub's search API returns at most 100 results per request. Totals are always exact, but lists and charts based on items (commits by repository, merge rate) use the latest 100.",
  },
  {
    q: "Recent activity looks empty, but the user is active.",
    a: "GitHub's public events feed only covers the last 90 days and only public actions. Private contributions appear in the calendar count only if the user enabled that on their profile.",
  },
  {
    q: "I see “rate limit reached”.",
    a: "Wait until the reset time shown in the message (or in Settings → API rate limits), or add a token in Settings. Profiles you already opened in this session are cached and load instantly.",
  },
];

const SHORTCUTS = [
  ["/", "Focus the search bar"],
  ["Enter", "Run the search"],
  ["Esc", "Leave the search bar / close menus"],
];

const Help = () => {
  const { navigate } = useGitHub();
  return (
    <div className="view help">
      <ViewHeader icon="fa-solid fa-circle-question" title="Help & Support" subtitle="How GitHub Analyzer works and how to get the most out of it" />

      <section className="panel">
        <h3>Frequently asked questions</h3>
        <div className="faq">
          {FAQ.map((item, i) => (
            <details key={item.q} open={i === 0}>
              <summary>{item.q}</summary>
              <div className="faq-body">{item.a}</div>
            </details>
          ))}
        </div>
      </section>

      <div className="split even">
        <section className="panel">
          <h3>Keyboard shortcuts</h3>
          <ul className="shortcut-list">
            {SHORTCUTS.map(([k, d]) => (
              <li key={k}>
                <kbd>{k}</kbd>
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="panel">
          <h3>Still stuck?</h3>
          <p className="muted">Check the API status, read GitHub's REST API docs, or adjust your token in Settings.</p>
          <div className="btn-row">
            <a className="btn btn-ghost" href="https://www.githubstatus.com" target="_blank" rel="noreferrer">
              <i className="fa-solid fa-signal" aria-hidden="true" /> GitHub status
            </a>
            <a className="btn btn-ghost" href="https://docs.github.com/en/rest" target="_blank" rel="noreferrer">
              <i className="fa-solid fa-book" aria-hidden="true" /> API docs
            </a>
            <button className="btn btn-primary" onClick={() => navigate("settings")}>
              <i className="fa-solid fa-gear" aria-hidden="true" /> Open Settings
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Help;
