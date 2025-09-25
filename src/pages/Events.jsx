// NEW ADDITION: Import required dependencies
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import DatePicker from 'react-datepicker'; // NEW ADDITION: For date range picker
import 'react-datepicker/dist/react-datepicker.css'; // NEW ADDITION: Date picker styles

// NO CHANGES: Existing COLORS object
const COLORS = {
  background: '#F5F7FA',
  primary: '#2B6CB0',
  secondary: '#38A169',
  text: '#1A202C',
  error: '#E53E3E',
};

// NEW ADDITION: Action and resource type enums from backend
const actionTypes = [
  'VIDEO_SUBMIT',
  'VIDEO_DELETE',
  'COMMENT_ADD',
  'LIKE_TOGGLE',
  'FAVOURITE_TOGGLE',
  'VIDEO_APPROVE',
  'VIDEO_REJECT',
  'VIDEO_FEATURE',
  'USER_CONNECT',
  'USER_DISCONNECT',
];
const resourceTypes = ['Video', 'Comment', 'User'];

const Events = () => {
  // NEW ADDITION: State for audit logs, filters, pagination, and modal
  const { fetchAuditLogs, accessToken, socket } = useAppContext();
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    currentPage: 1,
    hasNextPage: false,
    hasPrevPage: false,
    nextPage: null,
    previousPage: null,
    limit: 10,
  });
  const [filters, setFilters] = useState({
    actionType: '',
    resourceType: '',
    userSearch: '',
    startDate: null,
    endDate: null,
  });
  const [stats, setStats] = useState({
    totalActions: 0,
    actionCounts: {},
    categoryCounts: {},
  });
  const [loading, setLoading] = useState(true);
  const [modalUser, setModalUser] = useState(null);

  // NEW ADDITION: Fetch audit logs and stats
  const fetchLogs = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pagination.limit,
        ...(filters.actionType && { actionType: filters.actionType }),
        ...(filters.resourceType && { resourceType: filters.resourceType }),
        ...(filters.userSearch && { userId: filters.userSearch }),
        ...(filters.startDate && { startDate: filters.startDate.toISOString() }),
        ...(filters.endDate && { endDate: filters.endDate.toISOString() }),
      };
      const response = await fetchAuditLogs(params); // NEW ADDITION: Use context function
      if (response.success) {
        setLogs(response.data.logs);
        setPagination(response.data.pagination);
        // NEW ADDITION: Compute stats
        const actionCounts = response.data.logs.reduce((acc, log) => {
          acc[log.actionType] = (acc[log.actionType] || 0) + 1;
          return acc;
        }, {});
        const categoryCounts = response.data.logs.reduce((acc, log) => {
          if (log.category) acc[log.category] = (acc[log.category] || 0) + 1;
          return acc;
        }, {});
        setStats({
          totalActions: response.data.pagination.total,
          actionCounts,
          categoryCounts,
        });
      } else {
        toast.error(response.message || 'Failed to fetch audit logs');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  }, [fetchAuditLogs, filters, pagination.limit]);

  // NEW ADDITION: Handle filter changes and reset pagination
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, currentPage: 1 })); // NEW ADDITION: Reset to page 1
  };

  // NEW ADDITION: Handle pagination
  const handlePageChange = (page) => {
    fetchLogs(page);
  };

  // NEW ADDITION: Fetch user details for modal
  const fetchUserDetails = useCallback(async (userId) => {
    try {
      const response = await fetchAuditLogs({ userId }); // NEW ADDITION: Reuse fetchAuditLogs to get user data
      if (response.success && response.data.logs.length > 0) {
        setModalUser(response.data.logs[0].userId);
      } else {
        toast.error('User details not found');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to fetch user details');
    }
  }, [fetchAuditLogs]);

  // NEW ADDITION: Socket.IO for real-time updates
  useEffect(() => {
    if (socket) {
      socket.on('auditNotification', (data) => {
        // NEW ADDITION: Prepend new log to table
        setLogs((prev) => [data.auditLog, ...prev.slice(0, pagination.limit - 1)]);
        // NEW ADDITION: Show toast for critical actions
        if (['VIDEO_SUBMIT', 'VIDEO_APPROVE', 'VIDEO_REJECT', 'VIDEO_FEATURE'].includes(data.auditLog.actionType)) {
          toast.info(data.message, {
            action: {
              label: 'Refresh',
              onClick: () => fetchLogs(pagination.currentPage),
            },
          });
        }
        // NEW ADDITION: Update stats
        setStats((prev) => ({
          ...prev,
          totalActions: prev.totalActions + 1,
          actionCounts: {
            ...prev.actionCounts,
            [data.auditLog.actionType]: (prev.actionCounts[data.auditLog.actionType] || 0) + 1,
          },
          categoryCounts: data.auditLog.category
            ? {
                ...prev.categoryCounts,
                [data.auditLog.category]: (prev.categoryCounts[data.auditLog.category] || 0) + 1,
              }
            : prev.categoryCounts,
        }));
      });
      return () => socket.off('auditNotification'); // NEW ADDITION: Cleanup
    }
  }, [socket, pagination.currentPage, pagination.limit, fetchLogs]);

  // NEW ADDITION: Initial fetch
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // NEW ADDITION: Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  // NEW ADDITION: Render resource link
  const renderResourceLink = (log) => {
    if (log.resourceType === 'Video' && log.resourceId) {
      return (
        <Link
          to={`/admin/videos/${log.resourceId}`}
          className="text-blue-500 hover:underline"
          style={{ color: COLORS.primary }}
        >
          {log.resourceId}
        </Link>
      );
    }
    return log.resourceId || 'N/A';
  };

  // NEW ADDITION: Render user link
  const renderUserLink = (log) => {
    if (log.userId?._id) {
      return (
        <button
          onClick={() => fetchUserDetails(log.userId._id)}
          className="text-blue-500 hover:underline"
          style={{ color: COLORS.primary }}
        >
          {log.userId.name || log.userId.email || log.userId._id}
        </button>
      );
    }
    return 'Anonymous';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen" style={{ backgroundColor: COLORS.background }}>
        <Loader2 className="animate-spin" size={40} style={{ color: COLORS.primary }} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8" style={{ backgroundColor: COLORS.background }}>
      <h2 className="text-2xl font-semibold mb-6" style={{ color: COLORS.text }}>
        Events Management
      </h2>

      {/* NEW ADDITION: Stats Section */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4" style={{ color: COLORS.text }}>
          Audit Log Statistics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="font-medium" style={{ color: COLORS.text }}>
              Total Actions: {stats.totalActions}
            </p>
          </div>
          <div>
            <p className="font-medium" style={{ color: COLORS.text }}>
              Top Action Types:
            </p>
            {Object.entries(stats.actionCounts)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 3)
              .map(([type, count]) => (
                <p key={type} style={{ color: COLORS.text }}>
                  {type}: {count}
                </p>
              ))}
          </div>
          <div>
            <p className="font-medium" style={{ color: COLORS.text }}>
              Top Categories:
            </p>
            {Object.entries(stats.categoryCounts)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 3)
              .map(([category, count]) => (
                <p key={category} style={{ color: COLORS.text }}>
                  {category}: {count}
                </p>
              ))}
          </div>
        </div>
      </div>

      {/* NEW ADDITION: Filters */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4" style={{ color: COLORS.text }}>
          Filters
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium" style={{ color: COLORS.text }}>
              Action Type
            </label>
            <select
              value={filters.actionType}
              onChange={(e) => handleFilterChange('actionType', e.target.value)}
              className="w-full p-2 border rounded"
              style={{ borderColor: COLORS.primary, color: COLORS.text }}
            >
              <option value="">All</option>
              {actionTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium" style={{ color: COLORS.text }}>
              Resource Type
            </label>
            <select
              value={filters.resourceType}
              onChange={(e) => handleFilterChange('resourceType', e.target.value)}
              className="w-full p-2 border rounded"
              style={{ borderColor: COLORS.primary, color: COLORS.text }}
            >
              <option value="">All</option>
              {resourceTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium" style={{ color: COLORS.text }}>
              User Search
            </label>
            <input
              type="text"
              value={filters.userSearch}
              onChange={(e) => handleFilterChange('userSearch', e.target.value)}
              placeholder="Search by user name or email"
              className="w-full p-2 border rounded"
              style={{ borderColor: COLORS.primary, color: COLORS.text }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium" style={{ color: COLORS.text }}>
              Date Range
            </label>
            <div className="flex gap-2">
              <DatePicker
                selected={filters.startDate}
                onChange={(date) => handleFilterChange('startDate', date)}
                selectsStart
                startDate={filters.startDate}
                endDate={filters.endDate}
                placeholderText="Start Date"
                className="w-full p-2 border rounded"
                style={{ borderColor: COLORS.primary, color: COLORS.text }}
              />
              <DatePicker
                selected={filters.endDate}
                onChange={(date) => handleFilterChange('endDate', date)}
                selectsEnd
                startDate={filters.startDate}
                endDate={filters.endDate}
                minDate={filters.startDate}
                placeholderText="End Date"
                className="w-full p-2 border rounded"
                style={{ borderColor: COLORS.primary, color: COLORS.text }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* NEW ADDITION: Audit Logs Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead style={{ backgroundColor: COLORS.primary }}>
            <tr>
              {[
                'Date',
                'User',
                'Action',
                'Resource ID',
                'Resource Type',
                'Details',
                'Device',
                'Location',
                'IP Address',
                'Category',
              ].map((header) => (
                <th
                  key={header}
                  className="px-4 py-3 text-left text-sm font-medium uppercase tracking-wider"
                  style={{ color: COLORS.background }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {logs.length === 0 ? (
              <tr>
                <td colSpan="10" className="px-4 py-4 text-center" style={{ color: COLORS.text }}>
                  No audit logs found
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 text-sm" style={{ color: COLORS.text }}>
                    {formatDate(log.createdAt)}
                  </td>
                  <td className="px-4 py-4 text-sm" style={{ color: COLORS.text }}>
                    {renderUserLink(log)}
                  </td>
                  <td className="px-4 py-4 text-sm" style={{ color: COLORS.text }}>
                    {log.actionType}
                  </td>
                  <td className="px-4 py-4 text-sm" style={{ color: COLORS.text }}>
                    {renderResourceLink(log)}
                  </td>
                  <td className="px-4 py-4 text-sm" style={{ color: COLORS.text }}>
                    {log.resourceType}
                  </td>
                  <td className="px-4 py-4 text-sm" style={{ color: COLORS.text }}>
                    {log.details || 'N/A'}
                  </td>
                  <td className="px-4 py-4 text-sm" style={{ color: COLORS.text }}>
                    {log.deviceType}
                  </td>
                  <td className="px-4 py-4 text-sm" style={{ color: COLORS.text }}>
                    {log.location}
                  </td>
                  <td className="px-4 py-4 text-sm" style={{ color: COLORS.text }}>
                    {log.ipAddress || 'N/A'}
                  </td>
                  <td className="px-4 py-4 text-sm" style={{ color: COLORS.text }}>
                    {log.category || 'N/A'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* NEW ADDITION: Pagination */}
      {pagination.total > 0 && (
        <div className="mt-4 flex justify-between items-center">
          <p style={{ color: COLORS.text }}>
            Showing {logs.length} of {pagination.total} logs
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(pagination.previousPage)}
              disabled={!pagination.hasPrevPage}
              className="px-4 py-2 rounded disabled:opacity-50"
              style={{ backgroundColor: COLORS.primary, color: COLORS.background }}
            >
              Previous
            </button>
            <span style={{ color: COLORS.text }}>
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.nextPage)}
              disabled={!pagination.hasNextPage}
              className="px-4 py-2 rounded disabled:opacity-50"
              style={{ backgroundColor: COLORS.primary, color: COLORS.background }}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* NEW ADDITION: User Details Modal */}
      {modalUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full" style={{ backgroundColor: COLORS.background }}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold" style={{ color: COLORS.text }}>
                User Details
              </h3>
              <button onClick={() => setModalUser(null)}>
                <X size={20} style={{ color: COLORS.text }} />
              </button>
            </div>
            <p style={{ color: COLORS.text }}>
              <strong>Name:</strong> {modalUser.name || 'Unknown'}
            </p>
            <p style={{ color: COLORS.text }}>
              <strong>Email:</strong> {modalUser.email || 'N/A'}
            </p>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setModalUser(null)}
                className="px-4 py-2 rounded"
                style={{ backgroundColor: COLORS.secondary, color: COLORS.background }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;