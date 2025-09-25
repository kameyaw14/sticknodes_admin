import React, { useState, useEffect, useCallback } from "react";
import { useAppContext } from "../contexts/AppContext";
import { toast } from "sonner"; // NO CHANGES: Toast notifications
import { Search, CheckCircle, Ban, UserX } from "lucide-react"; // NO CHANGES: Icons for actions

// NO CHANGES: Color definitions
const COLORS = {
  background: "#F5F7FA",
  primary: "#2B6CB0",
  secondary: "#38A169",
  text: "#1A202C",
  error: "#E53E3E",
};

const Users = () => {
  // NO CHANGES: State definitions
  const { accessToken, refreshAdminToken, adminLogout,BASE_URL } = useAppContext();
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
  const [selectedUser, setSelectedUser] = useState(null); // For user details modal
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal visibility
  const [isConfirmOpen, setIsConfirmOpen] = useState(false); // Confirmation dialog for actions
  const [actionType, setActionType] = useState(""); // Track action (verify/unverify)
  const [isLoading, setIsLoading] = useState(false); // Loading state for API calls
  const [editBio, setEditBio] = useState(""); // Bio for editing

  // NO CHANGES: Fetch users from API
  const fetchUsers = useCallback(async (page = 1, params = {}) => {
    setIsLoading(true);
    try {
      // NEW ADDITION: Use URLSearchParams to handle query parameters correctly
      const query = new URLSearchParams({
        page,
        limit: 10,
        ...params,
      }).toString();
      const response = await fetch(`${BASE_URL}admin/users?${query}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      }).then(res => res.json());
      console.log(response);

      let retryResponse;
      if (!response.success) {
        if (response.status === 401) {
          const newToken = await refreshAdminToken();
          if (newToken) {
            retryResponse = await fetch(`${BASE_URL}admin/users?${query}`, {
              headers: { Authorization: `Bearer ${newToken}` },
            }).then(res => res.json());
            if (retryResponse.success) {
              setUsers(retryResponse.data.users);
              setPagination(retryResponse.data.pagination);
            } else {
              toast.error(retryResponse.message);
              adminLogout();
            }
          } else {
            adminLogout();
          }
        } else {
          toast.error(response.message);
        }
      } else {
        setUsers(response.data.users);
        setPagination(retryResponse?.data?.pagination);
      }
    } catch (error) {
      console.error("Fetch users error:", error);
      toast.error("Failed to fetch users");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, refreshAdminToken, adminLogout]);

  // NO CHANGES: Fetch user details for modal
  const fetchUserDetails = useCallback(async (userId) => {
    try {
      const response = await fetch(`${BASE_URL}admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      }).then(res => res.json());

      if (!response.success) {
        if (response.status === 401) {
          const newToken = await refreshAdminToken();
          if (newToken) {
            const retryResponse = await fetch(`${BASE_URL}admin/users/${userId}`, {
              headers: { Authorization: `Bearer ${newToken}` },
            }).then(res => res.json());
            if (retryResponse.success) {
              setSelectedUser(retryResponse.data);
              setEditBio(retryResponse.data.user.bio);
              setIsModalOpen(true);
            } else {
              toast.error(retryResponse.message);
            }
          } else {
            adminLogout();
          }
        } else {
          toast.error(response.message);
        }
      } else {
        setSelectedUser(response.data);
        setEditBio(response.data.user.bio);
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error("Fetch user details error:", error);
      toast.error("Failed to fetch user details");
    }
  }, [accessToken, refreshAdminToken, adminLogout]);

  // NO CHANGES: Handle user update (bio or verification status)
  const handleUpdateUser = async () => {
    try {
      const response = await fetch(`${BASE_URL}admin/users/${selectedUser.user._id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bio: editBio,
          isVerified: actionType === "verify" ? true : actionType === "unverify" ? false : undefined,
        }),
      }).then(res => res.json());

      if (!response.success) {
        if (response.status === 401) {
          const newToken = await refreshAdminToken();
          if (newToken) {
            const retryResponse = await fetch(`${BASE_URL}admin/users/${selectedUser.user._id}`, {
              method: "PUT",
              headers: {
                Authorization: `Bearer ${newToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                bio: editBio,
                isVerified: actionType === "verify" ? true : actionType === "unverify" ? false : undefined,
              }),
            }).then(res => res.json());
            if (retryResponse.success) {
              setSelectedUser({ ...selectedUser, user: retryResponse.user });
              setIsModalOpen(false);
              setIsConfirmOpen(false);
              fetchUsers(pagination.currentPage, filters);
              toast.success("User updated successfully");
            } else {
              toast.error(retryResponse.message);
            }
          } else {
            adminLogout();
          }
        } else {
          toast.error(response.message);
        }
      } else {
        setSelectedUser({ ...selectedUser, user: response.user });
        setIsModalOpen(false);
        setIsConfirmOpen(false);
        fetchUsers(pagination.currentPage, filters);
        toast.success("User updated successfully");
      }
    } catch (error) {
      console.error("Update user error:", error);
      toast.error("Failed to update user");
    }
  };

  // NO CHANGES: Handle search and filter changes
  const handleSearch = () => {
    fetchUsers(1, { ...filters, search });
  };

  // NO CHANGES: Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    fetchUsers(1, { ...filters, [key]: value, search });
  };

  // NO CHANGES: Handle pagination
  const handlePageChange = (page) => {
    fetchUsers(page, { ...filters, search });
  };

  // NO CHANGES: Initial fetch of users
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return (
    <div className="max-w-4xl mx-auto p-4" style={{ background: COLORS.background }}>
      {/* NO CHANGES: Title */}
      <h2 className="text-2xl font-semibold mb-4" style={{ color: COLORS.text }}>
        Users Management
      </h2>

      {/* NO CHANGES: Search and filters using native input and select */}
      <div className="mb-4 flex space-x-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by name, email, or ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              width: "100%",
              boxSizing: "border-box",
            }}
          />
        </div>
        <button
          onClick={handleSearch}
          style={{
            padding: "8px 16px",
            borderRadius: "4px",
            border: "none",
            background: COLORS.primary,
            color: "white",
            cursor: "pointer",
          }}
        >
          Search
        </button>
        <select
          value={filters.isVerified}
          onChange={(e) => handleFilterChange("isVerified", e.target.value)}
          style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
        >
          <option value="">All</option>
          <option value="true">Verified</option>
          <option value="false">Unverified</option>
        </select>
        <select
          value={filters.sortByFollowers ? "true" : ""}
          onChange={(e) => handleFilterChange("sortByFollowers", e.target.value === "true")}
          style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
        >
          <option value="">Newest</option>
          <option value="true">Most Followers</option>
        </select>
      </div>

      {/* NO CHANGES: Date range filters using native input */}
      <div className="mb-4 flex space-x-4">
        <input
          type="date"
          value={filters.startDate}
          onChange={(e) => handleFilterChange("startDate", e.target.value)}
          style={{
            padding: "8px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            width: "100%",
            boxSizing: "border-box",
          }}
        />
        <input
          type="date"
          value={filters.endDate}
          onChange={(e) => handleFilterChange("endDate", e.target.value)}
          style={{
            padding: "8px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            width: "100%",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* NEW ADDITION: Simple table instead of virtualized list */}
      <div className="border rounded">
        <div className="flex font-semibold bg-gray-100 py-2">
          <div className="w-1/4 px-4">Name</div>
          <div className="w-1/4 px-4">Email</div>
          <div className="w-1/4 px-4">Verification Status</div>
          <div className="w-1/4 px-4">Actions</div>
          <div className="w-1/4 px-4">Date Joined</div>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-4">Loading...</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              {users.map(user => (
                <tr key={user._id} style={{ borderBottom: "1px solid #ccc" }}>
                  <td className="w-1/4 px-4 py-2">{user.name}</td>
                  <td className="w-1/4 px-4 py-2">{user.email}</td>
                  <td className="w-1/4 px-4 py-2">{user.isVerified ? "Verified" : "Unverified"}</td>
                  <td className="w-1/4 px-4 py-2 flex space-x-2">
                    <button
                      onClick={() => fetchUserDetails(user._id)}
                      className="text-blue-500 hover:text-blue-700"
                      title="View Details"
                    >
                      <Search size={20} />
                    </button>
                    <button
                      onClick={() => {
                        setActionType(user.isVerified ? "unverify" : "verify");
                        setIsConfirmOpen(true);
                        setSelectedUser({ user });
                      }}
                      className="text-green-500 hover:text-green-700"
                      title={user.isVerified ? "Unverify" : "Verify"}
                    >
                      <CheckCircle size={20} />
                    </button>
                    <button
                      disabled
                      className="text-red-500 hover:text-red-700 opacity-50 cursor-not-allowed"
                      title="Ban (Coming Soon)"
                    >
                      <Ban size={20} />
                    </button>
                    <button
                      disabled
                      className="text-red-500 hover:text-red-700 opacity-50 cursor-not-allowed"
                      title="Delete (Coming Soon)"
                    >
                      <UserX size={20} />
                    </button>
                  </td>
                  <td className="w-1/4 px-4 py-2">{new Date(user.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* NO CHANGES: Pagination controls using native button */}
      <div className="mt-4 flex justify-between">
        <button
          disabled={!pagination?.hasPrevPage} 
          onClick={() => handlePageChange(pagination.currentPage - 1)}
          style={{
            padding: "8px 16px",
            borderRadius: "4px",
            border: "none",
            background: pagination?.hasPrevPage ? COLORS.primary : "gray",
            color: "white",
            cursor: pagination?.hasPrevPage ? "pointer" : "not-allowed",
          }}
        >
          Previous
        </button>
        <span>
          Page {pagination?.currentPage} of {pagination?.totalPages}
        </span>
        <button
          disabled={!pagination?.hasNextPage}
          onClick={() => handlePageChange(pagination?.currentPage + 1)}
          style={{
            padding: "8px 16px",
            borderRadius: "4px",
            border: "none",
            background: pagination?.hasNextPage ? COLORS.primary : "gray",
            color: "white",
            cursor: pagination?.hasNextPage ? "pointer" : "not-allowed",
          }}
        >
          Next
        </button>
      </div>

      {/* NO CHANGES: User details modal using div and CSS */}
      {selectedUser && isModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "8px",
              maxWidth: "500px",
              width: "90%",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
          >
            <h3 style={{ color: COLORS.text, fontSize: "1.5rem", marginBottom: "16px" }}>
              User Details
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <strong>Name:</strong> {selectedUser.user.name}
              </div>
              <div>
                <strong>Email:</strong> {selectedUser.user.email}
              </div>
              <div>
                <strong>Bio:</strong>
                <input
                  type="text"
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Edit bio"
                  style={{
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div>
                <strong>Verification Status:</strong> {selectedUser.user.isVerified ? "Verified" : "Unverified"}
              </div>
              <div>
                <strong>Registered:</strong> {new Date(selectedUser.user.createdAt).toLocaleDateString()}
              </div>
              <div>
                <strong>Last Login:</strong> {new Date(selectedUser.user.lastLogin).toLocaleDateString()}
              </div>
              <div>
                <strong>Followers:</strong> {selectedUser.user.followerCount}
              </div>
              <div>
                <strong>Following:</strong> {selectedUser.user.followingCount}
              </div>
              <div>
                <strong>Videos:</strong>
                {selectedUser.videos.length > 0 ? (
                  <ul style={{ listStyleType: "disc", paddingLeft: "20px" }}>
                    {selectedUser.videos.map(video => (
                      <li key={video._id}>
                        {video.title} ({new Date(video.createdAt).toLocaleDateString()})
                      </li>
                    ))}
                  </ul>
                ) : (
                  "No videos"
                )}
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px", marginTop: "16px", justifyContent: "flex-end" }}>
              <button
                onClick={() => {
                  setActionType(selectedUser.user.isVerified ? "unverify" : "verify");
                  setIsConfirmOpen(true);
                }}
                style={{
                  padding: "8px 16px",
                  borderRadius: "4px",
                  border: "none",
                  background: COLORS.secondary,
                  color: "white",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <CheckCircle size={20} style={{ marginRight: "8px" }} />
                {selectedUser.user.isVerified ? "Unverify" : "Verify"}
              </button>
              <button
                disabled
                style={{
                  padding: "8px 16px",
                  borderRadius: "4px",
                  border: "none",
                  background: COLORS.error,
                  color: "white",
                  opacity: 0.5,
                  cursor: "not-allowed",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Ban size={20} style={{ marginRight: "8px" }} />
                Ban (Coming Soon)
              </button>
              <button
                onClick={() => handleUpdateUser()}
                style={{
                  padding: "8px 16px",
                  borderRadius: "4px",
                  border: "none",
                  background: COLORS.primary,
                  color: "white",
                  cursor: "pointer",
                }}
              >
                Save Changes
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "4px",
                  border: "none",
                  background: "gray",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NO CHANGES: Confirmation dialog using div and CSS */}
      {isConfirmOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "8px",
              maxWidth: "400px",
              width: "90%",
            }}
          >
            <h3 style={{ color: COLORS.text, fontSize: "1.25rem", marginBottom: "16px" }}>
              Confirm Action
            </h3>
            <p>Are you sure you want to {actionType} this user?</p>
            <div style={{ display: "flex", gap: "8px", marginTop: "16px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setIsConfirmOpen(false)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "4px",
                  border: "none",
                  background: "gray",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateUser}
                style={{
                  padding: "8px 16px",
                  borderRadius: "4px",
                  border: "none",
                  background: COLORS.secondary,
                  color: "white",
                  cursor: "pointer",
                }}
              >
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