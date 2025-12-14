import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import Users from "./pages/Users";
import Videos from "./pages/Videos";
import Comments from "./pages/Comments";
import Events from "./pages/Events";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import Layout from "./components/Layout";
import { useAppContext } from "./contexts/AppContext";
import VideoDetail from "./pages/VideoDetail";
import NotificationsPage from "./pages/NotificationsPage";
import Top10Manager from "./pages/Top10";
import BestOfTheWeek from "./pages/BestOfTheWeek";
import AddNominees from "./pages/AddNominees";
import CurrentWeekManager from "./pages/CurrentWeekManager";

const App = () => {
  const { admin } = useAppContext();
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/" element={<AdminLogin />} />
        <Route
          path="/admin/*"
          element={
            <ProtectedAdminRoute>
              <Layout>
                <Routes>
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="users" element={<Users />} />
                  <Route path="videos" element={<Videos />} />
                  <Route path="videos/:videoId" element={<VideoDetail />} />
                  <Route path="comments" element={<Comments />} />
                  <Route path="events" element={<Events />} />
                  <Route path="notifications" element={<NotificationsPage />} />
                  <Route path="top10" element={<Top10Manager />} />

                  <Route path="best-of-the-week" element={<BestOfTheWeek />} />
                  <Route path="best-of-the-week/add-nominees" element={<AddNominees />} />
                   <Route path="best-of-the-week/current" element={<CurrentWeekManager />} />
                   {/* <Route path="best-of-the-week/past" element={<PastWeeks />} />  */}
                </Routes>
              </Layout>
            </ProtectedAdminRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
