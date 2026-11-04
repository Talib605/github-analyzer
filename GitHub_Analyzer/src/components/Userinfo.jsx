import "../CSS/Userinfo.css";
import { ensureUrl, formatDate, stripUrl } from "../utils/format";

const Userinfo = ({ user }) => {
  if (!user) return null;
  const blog = ensureUrl(user.blog);

  return (
    <div className="user-info">
      <a href={user.html_url} target="_blank" rel="noreferrer" className="user-avatar">
        <img src={user.avatar_url} alt={`${user.login}'s avatar`} />
      </a>

      <div className="user-content">
        <div className="user-title">
          <h3>{user.name || user.login}</h3>
          {user.type === "Organization" && <span className="badge">Organization</span>}
          {user.hireable && <span className="badge badge-success">Open to work</span>}
        </div>
        <a className="user-login" href={user.html_url} target="_blank" rel="noreferrer">
          @{user.login}
        </a>

        {user.bio && <p className="user-bio">{user.bio}</p>}

        <ul className="user-detail">
          {user.company && (
            <li>
              <i className="fa-solid fa-building" aria-hidden="true"></i>
              <span>{user.company}</span>
            </li>
          )}
          {user.location && (
            <li>
              <i className="fa-solid fa-location-dot" aria-hidden="true"></i>
              <span>{user.location}</span>
            </li>
          )}
          {blog && (
            <li>
              <i className="fa-solid fa-link" aria-hidden="true"></i>
              <a href={blog} target="_blank" rel="noreferrer">
                {stripUrl(user.blog)}
              </a>
            </li>
          )}
          {user.twitter_username && (
            <li>
              <i className="fa-brands fa-x-twitter" aria-hidden="true"></i>
              <a href={`https://x.com/${user.twitter_username}`} target="_blank" rel="noreferrer">
                @{user.twitter_username}
              </a>
            </li>
          )}
          <li>
            <i className="fa-solid fa-calendar" aria-hidden="true"></i>
            <span>Joined {formatDate(user.created_at, { month: "long", year: "numeric" })}</span>
          </li>
        </ul>

        <a className="btn btn-outline btn-sm" href={user.html_url} target="_blank" rel="noreferrer">
          <i className="fa-brands fa-github" aria-hidden="true"></i> View on GitHub
        </a>
      </div>
    </div>
  );
};

export default Userinfo;
