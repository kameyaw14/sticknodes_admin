import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import axios from "axios";
import { toast } from "sonner";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const BASE_URL =
    `${import.meta.env.VITE_SERVER_URL}/api/` ||
    (import.meta.env.VITE_ENV === "development"
      ? "http://localhost:3100/api/"
      : `${import.meta.env.VITE_SERVER_URL}/api/`);

  // Admin state
  const [admin, setAdmin] = useState(() => {
    const saved = localStorage.getItem("admin");
    return saved ? JSON.parse(saved) : null;
  });

  const [isCheckingAdminAuth, setIsCheckingAdminAuth] = useState(true);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(
    !!localStorage.getItem("adminAccessToken")
  );

  // REMOVED: global error state — now handled locally in components
  // REMOVED: global loading state

  const [videos, setVideos] = useState([]);
  const [accessToken, setAccessToken] = useState(
    localStorage.getItem("adminAccessToken") || ""
  );

  // UPDATED: Removed refreshToken handling completely (as requested)
  const adminLogin = async (email, password, secretKey) => {
    try {
      const response = await axios.post(`${BASE_URL}admin/login`, {
        email,
        password,
        secretKey,
      });
      const { admin, accessToken } = response.data;

      // NEW ADDITION: Save everything properly
      setAdmin(admin);
      setAccessToken(accessToken);
      setIsAdminAuthenticated(true);

      localStorage.setItem("admin", JSON.stringify(admin));
      localStorage.setItem("adminAccessToken", accessToken);
      // NO refreshToken saved — intentionally

      toast.success("Admin logged in successfully");
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || "Failed to login";
      toast.error(message);
      return { success: false, message };
    }
  };

  // NO CHANGES — logout is perfect
  const adminLogout = () => {
    setAdmin(null);
    setAccessToken("");
    setIsAdminAuthenticated(false);
    localStorage.removeItem("admin");
    localStorage.removeItem("adminAccessToken");
    toast.success("Logged out successfully");
  };

  // UPDATED: Simplified & more reliable auth check
  const checkAdminAuth = async () => {
    const token = localStorage.getItem("adminAccessToken");
    if (!token) {
      setIsAdminAuthenticated(false);
      setIsCheckingAdminAuth(false);
      return;
    }

    try {
      setIsCheckingAdminAuth(true);
      const response = await axios.get(`${BASE_URL}admin/check-auth`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const freshAdmin = response.data.admin;
      setAdmin(freshAdmin);
      setIsAdminAuthenticated(true);
      localStorage.setItem("admin", JSON.stringify(freshAdmin)); // Keep in sync
    } catch (error) {
      console.log("Admin auth check failed → logging out");
      adminLogout();
    } finally {
      setIsCheckingAdminAuth(false);
    }
  };

  // NO CHANGES — runs on mount
  useEffect(() => {
    checkAdminAuth();
  }, []);

  // UPDATED: fetchVideos now uses current accessToken from localStorage fallback
  const fetchVideos = useCallback(
    async (params = {}) => {
      const token = accessToken || localStorage.getItem("adminAccessToken");
      if (!token) {
        adminLogout();
        return { success: false };
      }

      try {
        const response = await axios.get(`${BASE_URL}admin/videos`, {
          headers: { Authorization: `Bearer ${token}` },
          params,
        });
        setVideos(response.data.data.videos);
        return response.data;
      } catch (error) {
        const message =
          error.response?.data?.message || "Failed to fetch videos";
        toast.error(message);
        if (error.response?.status === 401) adminLogout();
        return { success: false, message };
      }
    },
    [accessToken]
  );

  // NO CHANGES — audit logs fetch
  const fetchAuditLogs = useCallback(
    async (params = {}) => {
      const token = accessToken || localStorage.getItem("adminAccessToken");
      if (!token) return { success: false };

      try {
        const response = await axios.get(`${BASE_URL}admin/audit-logs`, {
          headers: { Authorization: `Bearer ${token}` },
          params,
        });
        return response.data;
      } catch (error) {
        const message =
          error.response?.data?.message || "Failed to fetch audit logs";
        toast.error(message);
        if (error.response?.status === 401) adminLogout();
        return { success: false, message };
      }
    },
    [accessToken]
  );

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
        fetchVideos,
        accessToken,
        videos,
        setVideos,
        fetchAuditLogs,
        // REMOVED: error, setError → no longer global
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
