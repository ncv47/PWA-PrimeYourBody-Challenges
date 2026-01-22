import { NavLink } from "react-router-dom";
import "./BottomNav.css";

export default function BottomNav() {
  return (
    <nav className="navbar is-fixed-bottom mpakt-bottomnav" role="navigation" aria-label="bottom navigation">
      <div className="navbar-menu is-active">
        <div className="navbar-start mpakt-bottomnav__row">
          <NavLink to="/home" className={({ isActive }) => "mpakt-tab" + (isActive ? " is-active" : "")}>
            <span className="mpakt-tab__icon">🏠</span>
            <span className="mpakt-tab__label">Home</span>
          </NavLink>

          <NavLink to="/community" className={({ isActive }) => "mpakt-tab" + (isActive ? " is-active" : "")}>
            <span className="mpakt-tab__icon">👥</span>
            <span className="mpakt-tab__label">Feed</span>
          </NavLink>

          <NavLink to="/profile" className={({ isActive }) => "mpakt-tab" + (isActive ? " is-active" : "")}>
            <span className="mpakt-tab__icon">👤</span>
            <span className="mpakt-tab__label">Profiel</span>
          </NavLink>

          <NavLink to="/admin" className={({ isActive }) => "mpakt-tab" + (isActive ? " is-active" : "")}>
            <span className="mpakt-tab__icon">⚙️</span>
            <span className="mpakt-tab__label">Admin</span>
          </NavLink>
        </div>
      </div>
    </nav>
  );
}
