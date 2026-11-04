import { useGitHub } from "../Context/GitHubContext";

const ThemeToggle = () => {
  const { theme, toggleTheme } = useGitHub();
  const next = theme === "dark" ? "light" : "dark";
  return (
    <button
      className={`theme-toggle ${theme}`}
      onClick={toggleTheme}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
    >
      <i className={`fa-solid fa-sun ${theme === "light" ? "active" : ""}`} aria-hidden="true"></i>
      <i className={`fa-solid fa-moon ${theme === "dark" ? "active" : ""}`} aria-hidden="true"></i>
    </button>
  );
};

export default ThemeToggle;
