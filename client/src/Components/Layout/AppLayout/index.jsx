import { Outlet } from "react-router-dom";
import Header from "../Header";
import Footer from "../Footer";

const AuthLayout = () => {
  return (
    <div>
      <div className="">
        <Header />
      </div>
      <main>
        <Outlet />
      </main>

      <footer>
        <Footer />
      </footer>
    </div>
  );
};

export default AuthLayout;
