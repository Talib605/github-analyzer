import { useState } from "react";
import {
  GitBranch,
  GitPullRequest,
  Star,
  CircleAlert,
  GitFork,
  MessageSquare,
  Plus,
  Tag,
  Trash2,
  Eye,
  Activity,
} from "lucide-react";
import "../CSS/RecentActivity.css";
import { useGitHub } from "../Context/GitHubContext";
import { timeAgo } from "../utils/format";
import { EmptyState, InlineError, SkeletonList } from "./ui";

const cap = (s = "") => s.charAt(0).toUpperCase() + s.slice(1);

/** Turn a raw GitHub event into { type, text, url }. */
export const describeEvent = (event) => {
  const repo = event.repo?.name || "";
  const repoUrl = `https://github.com/${repo}`;
  const p = event.payload || {};

  switch (event.type) {
    case "PushEvent": {
      const count = p.size ?? p.distinct_size ?? p.commits?.length;
      const branch = (p.ref || "").replace("refs/heads/", "");
      return {
        type: "push",
        text: count
          ? `Pushed ${count} commit${count === 1 ? "" : "s"} to ${repo}${branch ? ` (${branch})` : ""}`
          : `Pushed to ${repo}${branch ? ` (${branch})` : ""}`,
        url: p.head ? `${repoUrl}/commit/${p.head}` : repoUrl,
      };
    }
    case "PullRequestEvent": {
      const action = p.action === "closed" && p.pull_request?.merged ? "merged" : p.action;
      return {
        type: "pull",
        text: `${cap(action)} pull request #${p.number ?? p.pull_request?.number} in ${repo}`,
        url: p.pull_request?.html_url || repoUrl,
      };
    }
    case "PullRequestReviewEvent":
      return { type: "pull", text: `Reviewed pull request #${p.pull_request?.number} in ${repo}`, url: p.review?.html_url || p.pull_request?.html_url || repoUrl };
    case "PullRequestReviewCommentEvent":
      return { type: "comment", text: `Commented on a pull request review in ${repo}`, url: p.comment?.html_url || repoUrl };
    case "IssuesEvent":
      return { type: "issue", text: `${cap(p.action)} issue #${p.issue?.number} in ${repo}`, url: p.issue?.html_url || repoUrl };
    case "IssueCommentEvent":
      return { type: "comment", text: `Commented on #${p.issue?.number} in ${repo}`, url: p.comment?.html_url || repoUrl };
    case "CommitCommentEvent":
      return { type: "comment", text: `Commented on a commit in ${repo}`, url: p.comment?.html_url || repoUrl };
    case "WatchEvent":
      return { type: "star", text: `Starred ${repo}`, url: repoUrl };
    case "ForkEvent":
      return { type: "fork", text: `Forked ${repo}`, url: p.forkee?.html_url || repoUrl };
    case "CreateEvent":
      return {
        type: "create",
        text: p.ref_type === "repository" ? `Created repository ${repo}` : `Created ${p.ref_type} ${p.ref || ""} in ${repo}`,
        url: repoUrl,
      };
    case "DeleteEvent":
      return { type: "delete", text: `Deleted ${p.ref_type} ${p.ref || ""} in ${repo}`, url: repoUrl };
    case "ReleaseEvent":
      return { type: "release", text: `Published release ${p.release?.tag_name || ""} in ${repo}`, url: p.release?.html_url || repoUrl };
    case "PublicEvent":
      return { type: "create", text: `Made ${repo} public`, url: repoUrl };
    case "MemberEvent":
      return { type: "other", text: `${cap(p.action)} ${p.member?.login || "a member"} to ${repo}`, url: repoUrl };
    case "GollumEvent":
      return { type: "other", text: `Updated the wiki in ${repo}`, url: `${repoUrl}/wiki` };
    default:
      return { type: "other", text: `${event.type.replace(/Event$/, "")} in ${repo}`, url: repoUrl };
  }
};

const ICONS = {
  push: GitBranch,
  pull: GitPullRequest,
  star: Star,
  issue: CircleAlert,
  fork: GitFork,
  comment: MessageSquare,
  create: Plus,
  release: Tag,
  delete: Trash2,
  watch: Eye,
  other: Activity,
};

const RecentActivity = () => {
  const { profile, reload } = useGitHub();
  const { events, pending, errors } = profile;
  const [expanded, setExpanded] = useState(false);

  const list = (events || []).map((e) => ({ id: e.id, time: e.created_at, ...describeEvent(e) }));
  const visible = expanded ? list.slice(0, 30) : list.slice(0, 6);

  let body;
  if (pending.events) body = <SkeletonList rows={5} height={36} />;
  else if (errors.events) body = <InlineError error={errors.events} what="recent activity" onRetry={reload} />;
  else if (!list.length)
    body = <EmptyState compact icon="fa-solid fa-clock-rotate-left" title="No public activity" text="Nothing in the last 90 days." />;
  else
    body = (
      <div className={`activity-list ${expanded ? "expanded" : ""}`}>
        {visible.map((activity) => {
          const Icon = ICONS[activity.type] || Activity;
          return (
            <a className="activity-item" key={activity.id} href={activity.url} target="_blank" rel="noreferrer">
              <div className={`activity-icon ${activity.type}`}>
                <Icon size={16} />
              </div>
              <p title={activity.text}>{activity.text}</p>
              <span title={new Date(activity.time).toLocaleString()}>{timeAgo(activity.time)}</span>
            </a>
          );
        })}
      </div>
    );

  return (
    <div className="recent-activity-card card">
      <div className="activity-header">
        <h3>Recent Activity</h3>
        {list.length > 6 && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setExpanded((v) => !v)}>
            {expanded ? "Show less" : `View All (${Math.min(list.length, 30)})`}
          </button>
        )}
      </div>
      {body}
    </div>
  );
};

export default RecentActivity;
