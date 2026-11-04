import "../CSS/Userdashboard.css";
import Userinfo from "./Userinfo";
import ProfileStats from "./ProfileStats";
import ActivityStats from "./ActivityStats";
import Contribution from "./Contribution";
import TopLanguages from "./TopLanguages";
import TopRepositories from "./TopRespositories";
import RecentActivity from "./RecentActivity";
import { useGitHub } from "../Context/GitHubContext";

const UserDashboard = () => {
  const { profile } = useGitHub();
  const { user, repos, pending } = profile;

  const stars = repos ? repos.reduce((total, repo) => total + repo.stargazers_count, 0) : null;

  return (
    <div className="dashboard">
      <section className="userdashboard-info">
        <Userinfo user={user} />
        <ProfileStats user={user} stars={stars} starsLoading={pending.repos} />
      </section>

      <ActivityStats />

      <div className="activity-container">
        <Contribution />
        <TopLanguages />
      </div>

      <div className="profile-bottom">
        <TopRepositories />
        <RecentActivity />
      </div>
    </div>
  );
};

export default UserDashboard;
