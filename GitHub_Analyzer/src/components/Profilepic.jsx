import { useEffect, useRef, useState } from "react";
import { useGitHub } from "../Context/GitHubContext";

const Profilepic = () => {
  const { profile, navigate, reload } = useGitHub();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const user = profile?.user;

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    const esc = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const go = (view) => {
    setOpen(false);
    navigate(view);
  };

  return (
    <div className="profile-menu" ref={ref}>
      <button
        className="profile-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Open menu"
      >
        <div className="profile-img">
          {user ? (
            <img src={user.avatar_url} alt={user.login} />
          ) : (
            <i className="fa-brands fa-github" aria-hidden="true"></i>
          )}
        </div>
        <i className={`fa-solid fa-chevron-down chevron ${open ? "open" : ""}`} aria-hidden="true"></i>
      </button>

      {open && (
        <div className="dropdown" role="menu">
          {user ? (
            <>
              <div className="dropdown-user">
                <img src={user.avatar_url} alt="" />
                <div>
                  <strong>{user.name || user.login}</strong>
                  <span>@{user.login}</span>
                </div>
              </div>
              <a role="menuitem" href={user.html_url} target="_blank" rel="noreferrer" onClick={() => setOpen(false)}>
                <i className="fa-brands fa-github" aria-hidden="true"></i> Open on GitHub
              </a>
              <button role="menuitem" onClick={() => go("dashboard")}>
                <i className="fa-solid fa-chart-pie" aria-hidden="true"></i> Dashboard
              </button>
              <button
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  reload();
                }}
              >
                <i className="fa-solid fa-rotate" aria-hidden="true"></i> Refresh data
              </button>
              <div className="dropdown-divider" />
            </>
          ) : (
            <p className="dropdown-note">No profile loaded yet.</p>
          )}
          <button role="menuitem" onClick={() => go("settings")}>
            <i className="fa-solid fa-gear" aria-hidden="true"></i> Settings
          </button>
          <button role="menuitem" onClick={() => go("help")}>
            <i className="fa-solid fa-circle-question" aria-hidden="true"></i> Help & Support
          </button>
        </div>
      )}
    </div>
  );
};

export default Profilepic;
