import { createContext, useContext, useEffect, useState, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import { io } from "socket.io-client";

const AppContext = createContext();

axios.defaults.withCredentials = true;

export const AppProvider = ({ children }) => {
  const BASE_URL = import.meta.env.VITE_SERVER_URL || 
    (import.meta.env.VITE_ENV === "development"
      ? "http://localhost:3100/api/"
      : "https://sticknodestv-server.onrender.com/api/");

  const [admin, setAdmin] = useState(() => {
    const savedAdmin = localStorage.getItem("admin");
    return savedAdmin ? JSON.parse(savedAdmin) : null;
  });
  const [isCheckingAdminAuth, setIsCheckingAdminAuth] = useState(true);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(!!localStorage.getItem("adminAccessToken"));
  const [error, setError] = useState(null);
  const [videos, setVideos] = useState([]);
  const [accessToken, setAccessToken] = useState(localStorage.getItem("adminAccessToken") || "");
    const [socket, setSocket] = useState(null);

     useEffect(() => {
    const socketInstance = io(BASE_URL.replace('/api/', ''), {
      auth: { token: `Bearer ${accessToken}` },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    setSocket(socketInstance);
    return () => {
      socketInstance.disconnect(); // NEW ADDITION: Cleanup on unmount
    };
  }, [accessToken, BASE_URL]);

  const adminLogin = useCallback(async (email, password, secretKey) => {
    try {
      const response = await axios.post(`${BASE_URL}admin/login`, { email, password, secretKey });
      const { admin, accessToken, refreshToken } = response.data;

      setAdmin(admin);
      setAccessToken(accessToken);
      setIsAdminAuthenticated(true);
      localStorage.setItem("admin", JSON.stringify(admin));
      localStorage.setItem("adminAccessToken", accessToken);
      localStorage.setItem("adminRefreshToken", refreshToken);
      toast.success("Admin logged in successfully");
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || "Failed to login";
      setError(message);
      toast.error(message);
      return { success: false, message };
    }
  }, [BASE_URL]);

  const adminLogout = useCallback(() => {
    setAdmin(null);
    setAccessToken("");
    setIsAdminAuthenticated(false);
    localStorage.removeItem("admin");
    localStorage.removeItem("adminAccessToken");
    localStorage.removeItem("adminRefreshToken");
    toast.success("Logged out successfully");
  }, []);

  const refreshAdminToken = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem("adminRefreshToken");
      if (!refreshToken) throw new Error("No refresh token available");
      const response = await axios.post(`${BASE_URL}admin/refresh-token`, { refreshToken });
      const { accessToken } = response.data;
      setAccessToken(accessToken);
      localStorage.setItem("adminAccessToken", accessToken);
      setIsAdminAuthenticated(true);
      return accessToken;
    } catch (error) {
      console.error("Token refresh error:", error);
      adminLogout();
      return null;
    }
  }, [BASE_URL, adminLogout]);

  const checkAdminAuth = useCallback(async () => {
    if (!localStorage.getItem("adminAccessToken")) {
      setIsCheckingAdminAuth(false);
      setIsAdminAuthenticated(false);
      return;
    }

    try {
      setIsCheckingAdminAuth(true);
      const response = await axios.get(`${BASE_URL}admin/check-auth`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setAdmin(response.data.admin);
      setIsAdminAuthenticated(true);
      localStorage.setItem("admin", JSON.stringify(response.data.admin));
    } catch (error) {
      if (error.response?.status === 401) {
        const newToken = await refreshAdminToken();
        if (newToken) {
          try {
            const response = await axios.get(`${BASE_URL}admin/check-auth`, {
              headers: { Authorization: `Bearer ${newToken}` },
            });
            setAdmin(response.data.admin);
            setIsAdminAuthenticated(true);
            localStorage.setItem("admin", JSON.stringify(response.data.admin));
          } catch (retryError) {
            adminLogout();
          }
        } else {
          adminLogout();
        }
      } else {
        adminLogout();
      }
    } finally {
      setIsCheckingAdminAuth(false);
    }
  }, [BASE_URL, accessToken, refreshAdminToken, adminLogout]);

  const fetchVideos = useCallback(async (params = {}) => {
    try {
      const response = await axios.get(`${BASE_URL}admin/videos`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params,
      });
      setVideos(response.data.data.videos);
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        const newToken = await refreshAdminToken();
        if (newToken) {
          try {
            const response = await axios.get(`${BASE_URL}admin/videos`, {
              headers: { Authorization: `Bearer ${newToken}` },
              params,
            });
            setVideos(response.data.data.videos);
            return response.data;
          } catch (retryError) {
            const message = retryError.response?.data?.message || "Failed to fetch videos";
            toast.error(message);
            return { success: false, message };
          }
        } else {
          adminLogout();
          return { success: false, message: "Authentication failed" };
        }
      } else {
        const message = error.response?.data?.message || "Failed to fetch videos";
        toast.error(message);
        return { success: false, message };
      }
    }
  }, [BASE_URL, accessToken, refreshAdminToken, adminLogout]);

  useEffect(() => {
    checkAdminAuth();
  }, [checkAdminAuth]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const newToken = await refreshAdminToken();
      if (!newToken) {
        console.log("Token refresh failed, logging out");
      }
    }, 15 * 60 * 1000); // Refresh every 15 minutes
    return () => clearInterval(interval);
  }, [refreshAdminToken]);

    const fetchAuditLogs = useCallback(async (params = {}) => {
    try {
      const response = await axios.get(`${BASE_URL}admin/audit-logs`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params,
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        const newToken = await refreshAdminToken();
        if (newToken) {
          try {
            const response = await axios.get(`${BASE_URL}admin/audit-logs`, {
              headers: { Authorization: `Bearer ${newToken}` },
              params,
            });
            return response.data;
          } catch (retryError) {
            const message = retryError.response?.data?.message || "Failed to fetch audit logs";
            toast.error(message);
            return { success: false, message };
          }
        } else {
          adminLogout();
          return { success: false, message: "Authentication failed" };
        }
      } else {
        const message = error.response?.data?.message || "Failed to fetch audit logs";
        toast.error(message);
        return { success: false, message };
      }
    }
  }, [BASE_URL, accessToken, refreshAdminToken, adminLogout]);

  return (
    <AppContext.Provider
      value={{
        admin,
        BASE_URL,
        isAdminAuthenticated,
        isCheckingAdminAuth,
        adminLogin,
        adminLogout,
        checkAdminAuth,
        refreshAdminToken,
        fetchVideos,
        accessToken,
        videos,
        setVideos,
        error,
        setError,
        socket,
        fetchAuditLogs
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  return useContext(AppContext);
};