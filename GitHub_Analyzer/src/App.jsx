import React from "react";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import UserDashboard from "./components/UserDashboard";
import { useGitHub } from "./Context/GitHubContext";
import { NeedsUser, ProfileGate } from "./components/ui";
import Home from "./views/Home";
import Repositories from "./views/Repositories";
import Commits from "./views/Commits";
import Contributors from "./views/Contributors";
import Analytics from "./views/Analytics";
import Issues from "./views/Issues";
import Stars from "./views/Stars";
import Settings from "./views/Settings";
import Help from "./views/Help";

const USER_VIEW_COMPONENTS = {
  dashboard: UserDashboard,
  repositories: Repositories,
  commits: Commits,
  contributors: Contributors,
  analytics: Analytics,
  issues: Issues,
  stars: Stars,
};

const App = () => {
  const { route, searchId } = useGitHub();

  let content;
  if (route.view === "home") content = <Home />;
  else if (route.view === "settings") content = <Settings />;
  else if (route.view === "help") content = <Help />;
  else {
    const View = USER_VIEW_COMPONENTS[route.view] || UserDashboard;
    content = route.login ? (
      <ProfileGate>
        <View />
      </ProfileGate>
    ) : (
      <NeedsUser />
    );
  }

  return (
    <div className="main-container">
      <div className="app">
        <Navbar />
        <div className="layout">
          <Sidebar />
          <main className="main" key={`${route.view}-${searchId}`}>
            {content}
          </main>
        </div>
      </div>
    </div>
  );
};

export default App;
