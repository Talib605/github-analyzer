import { useEffect, useRef, useState } from "react";
import "../CSS/Navbar.css";
import ThemeToggle from "./ThemeToggle";
import Profilepic from "./Profilepic";
import { useGitHub } from "../Context/GitHubContext";
import { Spinner } from "./ui";

const Navbar = () => {
  const { search, status, navigate, route, profile } = useGitHub();
  const [username, setusername] = useState("");
  const [message, setMessage] = useState("");
  const inputRef = useRef(null);

  // Press "/" anywhere to jump to the search box
  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName;
      if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA" && tag !== "SELECT") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape" && document.activeElement === inputRef.current) inputRef.current.blur();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Clear the box once the searched profile has loaded
  useEffect(() => {
    if (status === "ready" && profile?.login) setusername("");
  }, [status, profile?.login]);

  const handlesearch = (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setMessage("Type a GitHub username first.");
      inputRef.current?.focus();
      return;
    }
    const result = search(username);
    setMessage(result.ok ? "" : result.message);
  };

  return (
    <header className="navbar">
      <button className="logo" onClick={() => navigate("home")} aria-label="GitHub Analyzer home">
        <i className="fa-solid fa-chart-simple" aria-hidden="true"></i>
        <span className="logo-span">GitHub Analyzer</span>
      </button>

      <form className="nav-search-bar" onSubmit={handlesearch} role="search">
        <div className="nav-search-input">
          <i className="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search GitHub username or owner/repo…"
            value={username}
            onChange={(e) => {
              setusername(e.target.value);
              if (message) setMessage("");
            }}
            aria-label="Search GitHub username or repository"
            autoComplete="off"
            spellCheck="false"
          />
          {!username && <kbd className="kbd-hint">/</kbd>}
          {message && <span className="nav-search-message" role="alert">{message}</span>}
        </div>

        <button className="search-btn" type="submit" disabled={status === "loading"}>
          {status === "loading" && route.login ? <Spinner size={14} /> : "Search"}
        </button>
      </form>

      <div className="nav-right-section">
        <ThemeToggle />
        <Profilepic />
      </div>
    </header>
  );
};

export default Navbar;
