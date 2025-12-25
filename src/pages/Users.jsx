import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAppContext } from "../contexts/AppContext";
import { toast } from "sonner";
import { Search, CheckCircle, Ban, UserX, Loader2 } from "lucide-react";

const Users = () => {
  const { accessToken, refreshAdminToken, adminLogout, BASE_URL } = useAppContext();

  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 10,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    isVerified: "",
    startDate: "",
    endDate: "",
    sortByFollowers: false,
  });

  const [selectedUser, setSelectedUser] = useState(null);
  const [userVideos, setUserVideos] = useState([]);
  const [videoPagination, setVideoPagination] = useState({
    total: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 10,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [actionType, setActionType] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editBio, setEditBio] = useState("");

  // Lock body scroll when any modal is open
  useEffect(() => {
    if (isModalOpen || isConfirmOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isModalOpen, isConfirmOpen]);

  // Fetch users list
  const fetchUsers = useCallback(
    async (page = 1, params = {}) => {
      setIsLoading(true);
      try {
        const query = new URLSearchParams({
          page: page.toString(),
          limit: "10",
          ...params,
        }).toString();

        const response = await fetch(`${BASE_URL}admin/users?${query}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }).then((res) => res.json());

        if (!response.success) {
          if (response.status === 401) {
            const newToken = await refreshAdminToken();
            if (newToken) {
              const retry = await fetch(`${BASE_URL}admin/users?${query}`, {
                headers: { Authorization: `Bearer ${newToken}` },
              }).then((res) => res.json());
              if (retry.success) {
                setUsers(retry.data.users);
                setPagination(retry.data.pagination);
              } else {
                toast.error(retry.message || "Authentication failed");
                adminLogout();
              }
            } else {
              adminLogout();
            }
          } else {
            toast.error(response.message || "Failed to fetch users");
          }
        } else {
          setUsers(response.data.users);
          setPagination(response.data.pagination);
        }
      } catch (error) {
        console.error("Fetch users error:", error);
        toast.error("Network error while fetching users");
      } finally {
        setIsLoading(false);
      }
    },
    [accessToken, refreshAdminToken, adminLogout, BASE_URL]
  );

  // Fetch user details + videos (with pagination)
  const fetchUserDetails = useCallback(
    async (userId, videoPage = 1) => {
      try {
        const query = new URLSearchParams({ page: videoPage.toString(), limit: "10" }).toString();
        const response = await fetch(`${BASE_URL}admin/users/${userId}?${query}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }).then((res) => res.json());

        if (!response.success) {
          if (response.status === 401) {
            const newToken = await refreshAdminToken();
            if (newToken) {
              const retry = await fetch(`${BASE_URL}admin/users/${userId}?${query}`, {
                headers: { Authorization: `Bearer ${newToken}` },
              }).then((res) => res.json());
              if (retry.success) {
                setSelectedUser(retry.data.user);
                setUserVideos(retry.data.videos);
                setVideoPagination(retry.data.pagination);
                setEditBio(retry.data.user.bio || "");
                setIsModalOpen(true);
              } else {
                toast.error(retry.message || "Failed to load user details");
              }
            } else {
              adminLogout();
            }
          } else {
            toast.error(response.message || "Failed to load user details");
          }
        } else {
          setSelectedUser(response.data.user);
          setUserVideos(response.data.videos);
          setVideoPagination(response.data.pagination);
          setEditBio(response.data.user.bio || "");
          setIsModalOpen(true);
        }
      } catch (error) {
        console.error("Fetch user details error:", error);
        toast.error("Network error while loading user details");
      }
    },
    [accessToken, refreshAdminToken, adminLogout, BASE_URL]
  );

  // Handle update (bio + verification)
  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    setIsUpdating(true);
    try {
      const payload = {
        bio: editBio,
      };
      if (actionType === "verify") payload.isVerified = true;
      if (actionType === "unverify") payload.isVerified = false;

      const response = await fetch(`${BASE_URL}admin/users/${selectedUser.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }).then((res) => res.json());

      if (!response.success) {
        if (response.status === 401) {
          const newToken = await refreshAdminToken();
          if (newToken) {
            const retry = await fetch(`${BASE_URL}admin/users/${selectedUser.id}`, {
              method: "PUT",
              headers: {
                Authorization: `Bearer ${newToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(payload),
            }).then((res) => res.json());

            if (retry.success) {
              toast.success("User updated successfully");
              setIsConfirmOpen(false);
              fetchUsers(pagination.currentPage, { ...filters, search });
              fetchUserDetails(selectedUser.id, videoPagination.currentPage);
            } else {
              toast.error(retry.message || "Update failed");
            }
          } else {
            adminLogout();
          }
        } else {
          toast.error(response.message || "Update failed");
        }
      } else {
        toast.success("User updated successfully");
        setIsConfirmOpen(false);
        fetchUsers(pagination.currentPage, { ...filters, search });
        fetchUserDetails(selectedUser.id, videoPagination.currentPage);
      }
    } catch (error) {
      console.error("Update user error:", error);
      toast.error("Network error during update");
    } finally {
      setIsUpdating(false);
    }
  };

  // Manual search
  const handleSearch = () => {
    fetchUsers(1, { ...filters, search: search.trim() || undefined });
  };

  // Filter change
  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    fetchUsers(1, { ...newFilters, search: search.trim() || undefined });
  };

  // Pagination
  const handlePageChange = (page) => {
    fetchUsers(page, { ...filters, search: search.trim() || undefined });
  };

  const handleVideoPageChange = (page) => {
    if (selectedUser) {
      fetchUserDetails(selectedUser.id, page);
    }
  };

  // Initial load
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Users Management</h2>

        {/* Search & Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name, email, or ID"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                />
                <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Search
            </button>

            <select
              value={filters.isVerified}
              onChange={(e) => handleFilterChange("isVerified", e.target.value)}
              disabled={isLoading}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Verification</option>
              <option value="true">Verified</option>
              <option value="false">Unverified</option>
            </select>

            <select
              value={filters.sortByFollowers ? "true" : ""}
              onChange={(e) => handleFilterChange("sortByFollowers", e.target.value === "true")}
              disabled={isLoading}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Newest First</option>
              <option value="true">Most Followers</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
              disabled={isLoading}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
              disabled={isLoading}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Followers
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  Array(10)
                    .fill(0)
                    .map((_, i) => (
                      <tr key={i}>
                        <td colSpan={6} className="px-6 py-8">
                          <div className="animate-pulse flex items-center space-x-4">
                            <div className="rounded-full bg-gray-300 h-10 w-10"></div>
                            <div className="flex-1 space-y-2">
                              <div className="h-4 bg-gray-300 rounded w-48"></div>
                              <div className="h-3 bg-gray-300 rounded w-32"></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No users found matching your criteria
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <img
                            src={user.avatarUrl || "https://via.placeholder.com/40"}
                            alt={user.name}
                            className="h-10 w-10 rounded-full object-cover border-2 border-gray-200"
                          />
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.isVerified
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {user.isVerified ? "Verified" : "Unverified"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{user.followerCount}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => fetchUserDetails(user.id)}
                            className="text-blue-600 hover:text-blue-800"
                            title="View Details"
                          >
                            <Search className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setActionType(user.isVerified ? "unverify" : "verify");
                              setIsConfirmOpen(true);
                            }}
                            className="text-green-600 hover:text-green-800"
                            title={user.isVerified ? "Unverify" : "Verify"}
                          >
                            <CheckCircle className="h-5 w-5" />
                          </button>
                          <button
                            disabled
                            className="text-red-400 cursor-not-allowed opacity-50"
                            title="Ban (Not Implemented)"
                          >
                            <Ban className="h-5 w-5" />
                          </button>
                          <button
                            disabled
                            className="text-red-400 cursor-not-allowed opacity-50"
                            title="Delete (Not Implemented)"
                          >
                            <UserX className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!isLoading && pagination.totalPages > 1 && (
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPrevPage || isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNextPage || isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* User Details Modal */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-md"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-8 overflow-y-auto flex-1">
              <div className="text-center mb-8">
                <img
                  src={selectedUser.avatarUrl || "https://via.placeholder.com/150"}
                  alt={selectedUser.name}
                  className="h-32 w-32 rounded-full object-cover mx-auto border-4 border-gray-200 shadow-lg"
                />
                <h3 className="text-2xl font-bold text-gray-900 mt-4">{selectedUser.name}</h3>
                <p className="text-gray-600">{selectedUser.email}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <span className="text-sm font-medium text-gray-500">Bio</span>
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    rows={3}
                    className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Verification Status</span>
                    <p className="mt-1 text-lg">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                          selectedUser.isVerified
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {selectedUser.isVerified ? "Verified" : "Unverified"}
                      </span>
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Followers</span>
                    <p className="mt-1 text-lg font-semibold">{selectedUser.followerCount}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Following</span>
                    <p className="mt-1 text-lg font-semibold">{selectedUser.followingCount}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Joined</span>
                    <p className="mt-1">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Last Login</span>
                    <p className="mt-1">{new Date(selectedUser.lastLogin).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xl font-semibold mb-4">Uploaded Videos ({videoPagination.total})</h4>
                {userVideos.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No videos uploaded yet</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {userVideos.map((video) => {
                      let statusColor = "bg-orange-100 text-orange-800";
                      let statusText = "Pending";
                      if (video.isApproved) {
                        statusColor = "bg-green-100 text-green-800";
                        statusText = "Approved";
                      } else if (video.isRejected) {
                        statusColor = "bg-red-100 text-red-800";
                        statusText = "Rejected";
                      }

                      return (
                        <div key={video.id} className="bg-gray-50 rounded-xl overflow-hidden shadow hover:shadow-md transition">
                          <img
                            src={video.thumbnailUrl}
                            alt={video.title}
                            className="w-full h-48 object-cover"
                          />
                          <div className="p-4">
                            <h5 className="font-medium text-gray-900 truncate">{video.title}</h5>
                            <div className="flex items-center justify-between mt-2">
                              <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColor}`}>
                                {statusText}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(video.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Video Pagination */}
                {videoPagination.totalPages > 1 && (
                  <div className="mt-8 flex justify-center gap-4">
                    <button
                      onClick={() => handleVideoPageChange(videoPagination.currentPage - 1)}
                      disabled={videoPagination.currentPage === 1}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="py-2 text-gray-700">
                      Page {videoPagination.currentPage} of {videoPagination.totalPages}
                    </span>
                    <button
                      onClick={() => handleVideoPageChange(videoPagination.currentPage + 1)}
                      disabled={videoPagination.currentPage === videoPagination.totalPages}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="border-t border-gray-200 px-8 py-5 flex justify-end gap-4 bg-gray-50">
              <button
                onClick={() => {
                  setActionType(selectedUser.isVerified ? "unverify" : "verify");
                  setIsConfirmOpen(true);
                }}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
              >
                <CheckCircle className="h-5 w-5" />
                {selectedUser.isVerified ? "Unverify" : "Verify"} User
              </button>
              <button
                onClick={handleUpdateUser}
                disabled={isUpdating}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition flex items-center gap-2"
              >
                {isUpdating && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Changes
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-md"
            onClick={() => setIsConfirmOpen(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Confirm Action</h3>
            <p className="text-gray-700 mb-8">
              Are you sure you want to <strong>{actionType}</strong> this user?
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setIsConfirmOpen(false)}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateUser}
                disabled={isUpdating}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition flex items-center gap-2"
              >
                {isUpdating && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;