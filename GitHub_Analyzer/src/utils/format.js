export const formatNumber = (num) => {
  if (num === undefined || num === null || Number.isNaN(num)) return "0";
  const abs = Math.abs(num);
  if (abs >= 1e9) return (num / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
  if (abs >= 1e6) return (num / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  if (abs >= 1e3) return (num / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
  return String(num);
};

export const timeAgo = (input) => {
  if (!input) return "";
  const seconds = Math.round((Date.now() - new Date(input).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const units = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, size] of units) {
    const value = Math.floor(seconds / size);
    if (value >= 1) return `${value} ${unit}${value > 1 ? "s" : ""} ago`;
  }
  return "just now";
};

export const formatDate = (input, opts = { day: "numeric", month: "short", year: "numeric" }) =>
  input ? new Date(input).toLocaleDateString("en-US", opts) : "";

export const pluralize = (n, word) => `${formatNumber(n)} ${word}${n === 1 ? "" : "s"}`;

export const ensureUrl = (url) => (!url ? "" : /^https?:\/\//i.test(url) ? url : `https://${url}`);

export const stripUrl = (url) => (url || "").replace(/^https?:\/\//i, "").replace(/\/$/, "");

/* GitHub linguist colours for the most common languages */
const LANGUAGE_COLORS = {
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  Python: "#3572A5",
  Java: "#b07219",
  C: "#555555",
  "C++": "#f34b7d",
  "C#": "#178600",
  Go: "#00ADD8",
  Rust: "#dea584",
  Ruby: "#701516",
  PHP: "#4F5D95",
  HTML: "#e34c26",
  CSS: "#563d7c",
  SCSS: "#c6538c",
  Shell: "#89e051",
  Kotlin: "#A97BFF",
  Swift: "#F05138",
  Dart: "#00B4AB",
  Vue: "#41b883",
  "Jupyter Notebook": "#DA5B0B",
  Lua: "#000080",
  Svelte: "#ff3e00",
  "Objective-C": "#438eff",
  Scala: "#c22d40",
  Elixir: "#6e4a7e",
  Haskell: "#5e5086",
  R: "#198CE7",
  Perl: "#0298c3",
  Makefile: "#427819",
  Dockerfile: "#384d54",
  Zig: "#ec915c",
  Nix: "#7e7eff",
  MDX: "#fcb32c",
  Astro: "#ff5a03",
  "Vim Script": "#199f4b",
  PowerShell: "#012456",
  Assembly: "#6E4C13",
  Clojure: "#db5855",
  Julia: "#a270ba",
  OCaml: "#3be133",
  Erlang: "#B83998",
  Solidity: "#AA6746",
  TeX: "#3D6117",
  "Emacs Lisp": "#c065db",
  Groovy: "#4298b8",
  Batchfile: "#C1F12E",
  Other: "#8b949e",
};

export const languageColor = (lang) => {
  if (!lang) return "#8b949e";
  if (LANGUAGE_COLORS[lang]) return LANGUAGE_COLORS[lang];
  let hash = 0;
  for (const ch of lang) hash = (hash * 31 + ch.charCodeAt(0)) % 360;
  return `hsl(${hash}, 55%, 55%)`;
};
