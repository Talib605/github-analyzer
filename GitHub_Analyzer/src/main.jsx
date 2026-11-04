import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { GitHubProvider } from "./Context/GitHubContext.jsx";

// StrictMode is intentionally not used: in development it runs effects twice,
// which doubles GitHub API calls and burns through the 60 req/hour anonymous limit.
createRoot(document.getElementById("root")).render(
  <GitHubProvider>
    <App />
  </GitHubProvider>
);
