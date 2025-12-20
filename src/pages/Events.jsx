import React, { useState, useEffect, useCallback } from "react";
import { useAppContext } from "../contexts/AppContext";
import { toast } from "sonner";
import {
  RefreshCw,
  Download,
  ChevronDown,
  ChevronUp,
  Search,
  Calendar,
  User,
  Video,
  MessageSquare,
  Globe,
  Smartphone,
  Shield,
  LogIn,
  LogOut,
  ThumbsUp,
  Bookmark,
  Trash2,
  CheckCircle,
  XCircle,
  Star,
  Flag,
  AlertCircle,
} from "lucide-react";
import axios from "axios";

// Bro, this maps actions to icons and colors — makes table look sexy AF
const actionConfig = {
  USER_LOGIN: { icon: LogIn, color: "text-green-600", label: "Login" },
  USER_LOGIN_FAILED: { icon: LogOut, color: "text-red-600", label: "Login Failed" },
  USER_REGISTER: { icon: User, color: "text-blue-600", label: "Register" },
  USER_LOGOUT: { icon: LogOut, color: "text-gray-600", label: "Logout" },
  VIDEO_UPLOAD: { icon: Video, color: "text-purple-600", label: "Upload" },
  VIDEO_APPROVE: { icon: CheckCircle, color: "text-green-600", label: "Approved" },
  VIDEO_REJECT: { icon: XCircle, color: "text-red-600", label: "Rejected" },
  VIDEO_DELETE: { icon: Trash2, color: "text-red-600", label: "Deleted" },
  VIDEO_FEATURE: { icon: Star, color: "text-yellow-600", label: "Featured" },
  VIDEO_UNFEATURE: { icon: Star, color: "text-gray-500", label: "Unfeatured" },
  COMMENT_CREATE: { icon: MessageSquare, color: "text-indigo-600", label: "Comment" },
  COMMENT_DELETE: { icon: Trash2, color: "text-red-600", label: "Comment Deleted" },
  VIDEO_LIKE: { icon: ThumbsUp, color: "text-pink-600", label: "Liked" },
  VIDEO_SAVE: { icon: Bookmark, color: "text-orange-600", label: "Saved" },
  ADMIN_LOGIN: { icon: Shield, color: "text-teal-600", label: "Admin Login" },
  default: { icon: AlertCircle, color: "text-gray-600", label: "Unknown" },
};

const Events = () => {
  const { accessToken, adminLogout, BASE_URL } = useAppContext();

  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 50,
    hasNext: false,
    hasPrev: false,
  });
  const [loading, setLoading] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Bro filters — all the power, none of the clutter
  const [filters, setFilters] = useState({
    search: "",
    action: "",
    actorType: "",
    startDate: "",
    endDate: "",
    ip: "",
    country: "",
    resourceType: "",
    resourceId: "",
  });

  // Bro, this fetches logs with all filters applied
  const fetchLogs = useCallback(
    async (page = 1) => {
      setLoading(true);
      // Disable buttons while loading bro — no double clicks
      try {
        const params = {
          page,
          limit: 50,
          ...Object.fromEntries(
            Object.entries(filters).filter(([_, v]) => v !== "")
          ),
        };

        const response = await axios.get(`${BASE_URL}admin/audit-logs`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          params,
        });

        if (response.data.success) {
          setLogs(response.data.data.logs);
          const pag = response.data.data.pagination;
          setPagination({
            total: pag.total,
            totalPages: pag.totalPages,
            currentPage: pag.currentPage,
            limit: pag.limit,
            hasNext: pag.hasNext,
            hasPrev: pag.hasPrev,
          });
        } else {
          toast.error(response.data.message || "Failed to load logs");
        }
      } catch (error) {
        if (error.response?.status === 401) {
          toast.error("Session expired");
          adminLogout();
        } else {
          toast.error("Failed to fetch audit logs");
        }
      } finally {
        setLoading(false);
      }
    },
    [accessToken, adminLogout, BASE_URL, filters]
  );

  // Initial load + refresh
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleRefresh = () => {
    setExpandedRow(null);
    fetchLogs(pagination.currentPage);
    toast.success("Logs refreshed");
  };

  const handleExport = () => {
    // Bro, this triggers full CSV download — backend handles up to 50k
    window.open(
      `${BASE_URL}admin/audit-logs?export=true&${new URLSearchParams({
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v !== "")
        ),
      }).toString()}`,
      "_blank"
    );
    toast.success("CSV export started — check downloads");
  };

  const handlePageChange = (newPage) => {
    fetchLogs(newPage);
  };

  const toggleRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  return (
    <div className="p-6 max-w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Events</h1>
        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            onClick={handleExport}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <Download size={20} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Main Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search details, email, title..."
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              onKeyDown={(e) => e.key === "Enter" && fetchLogs(1)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <input
            type="date"
            value={filters.startDate}
            onChange={(e) =>
              setFilters({ ...filters, startDate: e.target.value })
            }
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />

          <select
            value={filters.action}
            onChange={(e) => setFilters({ ...filters, action: e.target.value })}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Actions</option>
            <option value="USER_LOGIN">Login</option>
            <option value="VIDEO_UPLOAD">Video Upload</option>
            <option value="VIDEO_APPROVE">Approve Video</option>
            <option value="VIDEO_REJECT">Reject Video</option>
            <option value="VIDEO_DELETE">Delete Video</option>
            {/* Add more as needed bro */}
          </select>
        </div>

        {/* Actor Type */}
        <div className="mt-4 flex gap-4">
          <select
            value={filters.actorType}
            onChange={(e) =>
              setFilters({ ...filters, actorType: e.target.value })
            }
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Actors</option>
            <option value="User">User</option>
            <option value="Admin">Admin</option>
            <option value="System">System</option>
            <option value="Guest">Guest</option>
          </select>

          <button
            onClick={() => fetchLogs(1)}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
          >
            Apply Filters
          </button>
        </div>

        {/* Advanced Filters Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="mt-4 flex items-center gap-2 text-blue-600 hover:text-blue-800"
        >
          Advanced Filters
          {showAdvanced ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        {/* Advanced Filters — collapsible */}
        {showAdvanced && (
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="IP Address"
              value={filters.ip}
              onChange={(e) => setFilters({ ...filters, ip: e.target.value })}
              className="px-4 py-3 border border-gray-300 rounded-lg"
            />
            <input
              type="text"
              placeholder="Country"
              value={filters.country}
              onChange={(e) =>
                setFilters({ ...filters, country: e.target.value })
              }
              className="px-4 py-3 border border-gray-300 rounded-lg"
            />
            <select
              value={filters.resourceType}
              onChange={(e) =>
                setFilters({ ...filters, resourceType: e.target.value })
              }
              className="px-4 py-3 border border-gray-300 rounded-lg"
            >
              <option value="">All Resources</option>
              <option value="User">User</option>
              <option value="Video">Video</option>
              <option value="Comment">Comment</option>
            </select>
            <input
              type="text"
              placeholder="Resource ID"
              value={filters.resourceId}
              onChange={(e) =>
                setFilters({ ...filters, resourceId: e.target.value })
              }
              className="px-4 py-3 border border-gray-300 rounded-lg"
            />
          </div>
        )}
      </div>

      {/* Table — matching VideoTable style exactly bro */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actor
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Resource
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP / Country
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Device
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading
                ? // Skeleton rows bro — looks pro while loading
                  Array(10)
                    .fill(0)
                    .map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={6} className="px-6 py-8">
                          <div className="h-4 bg-gray-200 rounded w-full"></div>
                        </td>
                      </tr>
                    ))
                : logs.map((log) => {
                    const config =
                      actionConfig[log.action] || actionConfig.default;
                    const Icon = config.icon;

                    return (
                      <React.Fragment key={log.id}>
                        <tr
                          onClick={() => toggleRow(log.id)}
                          className="hover:bg-gray-50 cursor-pointer transition"
                        >
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <div>
                              <div className="font-medium text-gray-900">
                                {log.actorName || log.actorType}
                              </div>
                              {log.actorEmail && (
                                <div className="text-xs text-gray-500">
                                  {log.actorEmail}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Icon size={18} className={config.color} />
                              <span className="font-medium">{config.label}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {log.resourceType || "-"} {log.resourceId && `#${log.resourceId.slice(-6)}`}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {log.ipAddress || "-"}
                            {log.country && ` (${log.country})`}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {log.deviceInfo || "-"}
                          </td>
                        </tr>

                        {/* Expanded Row — glassmorphism backdrop blur bro */}
                        {expandedRow === log.id && (
                          <tr>
                            <td colSpan={6} className="px-6 py-4 bg-gray-50/80 backdrop-blur-sm border-t border-gray-200">
                              <div className="space-y-4">
                                {log.details && (
                                  <div>
                                    <strong>Details:</strong>
                                    <p className="mt-1 text-gray-700">{log.details}</p>
                                  </div>
                                )}
                                {log.metadata && (
                                  <div>
                                    <strong>Metadata:</strong>
                                    <pre className="mt-2 p-4 bg-gray-900 text-gray-100 rounded-lg text-xs overflow-x-auto">
                                      {JSON.stringify(log.metadata, null, 2)}
                                    </pre>
                                  </div>
                                )}
                                {log.userAgent && (
                                  <div>
                                    <strong>User Agent:</strong>
                                    <p className="mt-1 text-xs text-gray-600 break-all">
                                      {log.userAgent}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
            </tbody>
          </table>
        </div>

        {/* Pagination — same as VideoTable */}
        <div className="bg-white px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-700">
            Page {pagination.currentPage} of {pagination.totalPages} ({pagination.total} total)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={!pagination.hasPrev || loading}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={!pagination.hasNext || loading}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Events;