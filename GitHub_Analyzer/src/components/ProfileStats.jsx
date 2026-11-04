import "../CSS/Profilestats.css";
import ProfileChart from "./ProfileChart";
import { formatNumber } from "../utils/format";
import { useGitHub } from "../Context/GitHubContext";
import { Skeleton } from "./ui";

const ProfileStats = ({ user, stars, starsLoading }) => {
  const { navigate } = useGitHub();

  const stats = [
    { label: "Repositories", value: user?.public_repos, view: "repositories", icon: "fa-solid fa-book" },
    { label: "Followers", value: user?.followers, icon: "fa-solid fa-users", href: `${user?.html_url}?tab=followers` },
    { label: "Following", value: user?.following, icon: "fa-solid fa-user-plus", href: `${user?.html_url}?tab=following` },
    { label: "Stars earned", value: stars, view: "stars", icon: "fa-solid fa-star", loading: starsLoading },
  ];

  return (
    <div className="stats-div">
      <div className="stats-container">
        {stats.map((s) => {
          const inner = (
            <>
              <h4>
                <i className={s.icon} aria-hidden="true"></i>
                {s.label}
              </h4>
              {s.loading ? <Skeleton width={60} height={26} /> : <p title={String(s.value ?? 0)}>{formatNumber(s.value)}</p>}
            </>
          );
          return s.view ? (
            <button key={s.label} className="stat-tile" onClick={() => navigate(s.view)}>
              {inner}
            </button>
          ) : (
            <a key={s.label} className="stat-tile" href={s.href} target="_blank" rel="noreferrer">
              {inner}
            </a>
          );
        })}
      </div>

      <div className="chart-container">
        <ProfileChart />
      </div>
    </div>
  );
};

export default ProfileStats;
