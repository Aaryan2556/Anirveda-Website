import React, { useState, useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import LoadingScreen from "./LoadingScreen";

import HomePage from "./Pages/HomePage";
import Committee from "./Pages/Committee";
import Events from "./Pages/Events";
import Gallery from "./Pages/Gallery";
import DepartmentPage from "./Pages/DepartmentPage";
import Registration from "./Pages/Registration";
import Sponsors from "./Pages/Sponsors";
import Blogs from "./Pages/Blogs";

// Data of all the departments (shortened for clarity)
import emLogisticsHead from "./data/departments/emNlogistics/emLogisticsHead";
import emLogisticsCore from "./data/departments/emNlogistics/emLogisticsCore";
import dmHeads from "./data/departments/dm/dmHeads";
import dmCore from "./data/departments/dm/dmCore";
import prHeads from "./data/departments/pr/prHeads"
import prCore from "./data/departments/pr/prCore"
import cndHeads from "./data/departments/cnd/cndHeads"
import cndCore from "./data/departments/cnd/cndCore"
import techHeads from "./data/departments/tech/techHeads"
import techCore from "./data/departments/tech/techCore"
import gdHeads from "./data/departments/gd/gdHeads"
import gdCore from "./data/departments/gd/gdCore"
import sponsorshipHeads from "./data/departments/sponsorship/sponsorshipHeads"
import sponsorshipCore from "./data/departments/sponsorship/sponsorshipCore"


import ScrollToTop from "./ScrollToTop";

import BlogDetails from "./Pages/BlogDetails";
import Cityscapes from "./Pages/CityScapes";
import Economania from "./Pages/Economania";
import GalaxEcon from "./Pages/GalaxEcon";

import Home from './Pages/MockRBI/Home';
import AdminLogin from "./Pages/MockRBI/AdminLogin";
import AdminPanel from "./Pages/MockRBI/AdminPanel";
import PlayerLogin from "./Pages/MockRBI/PlayerLogin";
import PlayerPanel from "./Pages/MockRBI/PlayerPanel";
import LeaderBoard from "./Pages/MockRBI/LeaderBoard";

// IPL Auction, lazy-loaded to keep it out of the main bundle
const IPLAuctionAdmin = lazy(() => import("./Pages/IPLAuction/AdminPage"));
const IPLAuctionPlay = lazy(() => import("./Pages/IPLAuction/PlayPage"));
const IPLAuctionLobby = lazy(() => import("./Pages/IPLAuction/LobbyPage"));
const IPLAuctionScreen = lazy(() => import("./Pages/IPLAuction/ScreenPage"));

// IPL Elimination Round (3 files)
const TeamLogin = lazy(() => import("./Pages/elimination/TeamLogin"));
const TeamQuiz = lazy(() => import("./Pages/elimination/TeamQuiz"));
const AdminReferee = lazy(() => import("./Pages/elimination/AdminReferee"));

// Helper wrapper to switch between Login and Quiz for participants
const EliminationPlayer = () => {
  const [activeTeam, setActiveTeam] = useState(() => {
    const saved = sessionStorage.getItem("ipl_active_team");
    return saved ? JSON.parse(saved) : null;
  });

  if (!activeTeam) {
    return <TeamLogin onLoginSuccess={(team) => setActiveTeam(team)} />;
  }

  return (
    <TeamQuiz
      team={activeTeam}
      onExit={() => {
        sessionStorage.removeItem("ipl_active_team");
        setActiveTeam(null);
      }}
    />
  );
};



const AppContent = ({ symbols, heading }) => {
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  // Check if current route is a Mock RBI route
  const isMockRBIRoute = location.pathname.startsWith('/mock-rbi') ||
    location.pathname.startsWith('/adminlogin') ||
    location.pathname.startsWith('/adminpanel') ||
    location.pathname.startsWith('/playerlogin') ||
    location.pathname.startsWith('/playerpanel') ||
    location.pathname.startsWith('/leaderboard');
  const isIPLAuctionRoute = location.pathname.startsWith('/ipl-auction');
  const skipLoadingScreen = isMockRBIRoute || isIPLAuctionRoute;

  useEffect(() => {
    // Skip loading screen for Mock RBI and IPL Auction routes
    if (skipLoadingScreen) {
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 4000); //time to change after which the loading page ends

    return () => clearTimeout(timer);
  }, [location.pathname, skipLoadingScreen]);

  return (
    <>
      {isLoading && !skipLoadingScreen ? (
        <LoadingScreen symbols={symbols} heading={heading} />
      ) : (
        <>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/committee" element={<Committee />} />
            <Route path="/events" element={<Events />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/registration" element={<Registration />} />
            <Route path="/sponsors" element={<Sponsors />} />
            <Route path="/blogs" element={<Blogs />} />
            <Route path='/blogs/:id' element={<BlogDetails />} />
            <Route path="/cityscapes" element={<Cityscapes />} />

            <Route path="/economania" element={<Economania />} />
            <Route
              path="/em-logs"
              element={
                <DepartmentPage
                  heading="Event Management & Creative"
                  heads={emLogisticsHead}
                  core={emLogisticsCore}
                />
              }
            />
            <Route
              path="/dm"
              element={
                <DepartmentPage
                  heading="Digital Marketing"
                  heads={dmHeads}
                  core={dmCore}
                />
              }
            />
            <Route
              path="/pr"
              element={
                <DepartmentPage
                  heading="Public Relations"
                  heads={prHeads}
                  core={prCore}
                />
              }
            />
            <Route
              path="/cnd"
              element={
                <DepartmentPage
                  heading="Content & Documentation"
                  heads={cndHeads}
                  core={cndCore}
                />
              }
            />
            <Route
              path="/tech"
              element={
                <DepartmentPage
                  heading="Technical"
                  heads={techHeads}
                  core={techCore}
                />
              }
            />
            {/* <Route
            path="/cr"
            element={<DepartmentPage heading="Creative" heads={veHeads} />}
          /> */}
            <Route
              path="/gd"
              element={
                <DepartmentPage
                  heading="Graphics Design"
                  heads={gdHeads}
                  core={gdCore}
                />
              }
            />
            <Route
              path="/sponsorship"
              element={
                <DepartmentPage
                  heading="Sponsorship"
                  heads={sponsorshipHeads}
                  core={sponsorshipCore}
                />
              }
            />
            <Route path="/galaxecon" element={<GalaxEcon />} />
            {/* Mock RBI Simulation */}
            <Route path="/mock-rbi" element={<Home />} />
            <Route path="/mock-rbi/adminlogin" element={<AdminLogin />} />
            <Route path="/mock-rbi/adminpanel" element={<AdminPanel />} />
            <Route path="/mock-rbi/playerlogin" element={<PlayerLogin />} />
            <Route path="/mock-rbi/playerpanel" element={<PlayerPanel />} />
            <Route path="/mock-rbi/leaderboard" element={<LeaderBoard />} />
            {/* IPL Auction */}
            <Route path="/ipl-auction" element={<Suspense fallback={null}><IPLAuctionLobby /></Suspense>} />
            <Route path="/ipl-auction/sabka_malik" element={<Suspense fallback={null}><IPLAuctionAdmin /></Suspense>} />
            <Route path="/ipl-auction/sabka_malik/screen" element={<Suspense fallback={null}><IPLAuctionScreen /></Suspense>} />
            <Route path="/ipl-auction/play" element={<Suspense fallback={null}><IPLAuctionPlay /></Suspense>} />

            {/* IPL Elimination Round */}
            <Route path="/ipl-auction/elimination/play" element={<Suspense fallback={null}><EliminationPlayer /></Suspense>} />
            <Route path="/ipl-auction/elimination/referee" element={<Suspense fallback={null}><AdminReferee /></Suspense>} />
            <Route path="/ipl-auction/elimination/refree" element={<Suspense fallback={null}><AdminReferee /></Suspense>} />
            <Route path="/elimination/play" element={<Suspense fallback={null}><EliminationPlayer /></Suspense>} />
            <Route path="/elimination/quiz" element={<Suspense fallback={null}><EliminationPlayer /></Suspense>} />
            <Route path="/elimination/referee" element={<Suspense fallback={null}><AdminReferee /></Suspense>} />
            <Route path="/elimination/refree" element={<Suspense fallback={null}><AdminReferee /></Suspense>} />
          </Routes>
        </>
      )}
    </>
  );
};

const App = () => {
  const symbols = ['$', '€', '#', '</>', '¥', '&', '%', '&', '💸', '🚀', '🌟', '⚖️', '💡', '💹'];
  const heading = "Hey World! This is ANIRVEDA"; //must be changed from LoadingScreen.jsx

  return (
    <div>
      <BrowserRouter>
        <AppContent symbols={symbols} heading={heading} />
      </BrowserRouter>
    </div>
  );
};

export default App;
