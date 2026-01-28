import { Outlet } from "react-router-dom";
import NavBar from "./NavBar";

function Layout() {
  return (
    <>
      <NavBar />
      <section className="section">
        <div className="container">
          <Outlet />
        </div>
      </section>
    </>
  );
}

export default Layout;
