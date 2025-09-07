// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import Users from './pages/Users';
import Videos from './pages/Videos';
import Comments from './pages/Comments';
import Events from './pages/Events';
import VideoDetail from './pages/VideoDetail'; // NEW ADDITION: Import VideoDetail
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import Layout from './components/Layout';
import { useAppContext } from './contexts/AppContext';

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
                  <Route path="videos/:videoId" element={<VideoDetail />} /> {/* NEW ADDITION: Route for VideoDetail */}
                  <Route path="comments" element={<Comments />} />
                  <Route path="events" element={<Events />} />
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