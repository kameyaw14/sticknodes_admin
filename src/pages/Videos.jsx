import React, { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Loader2, Search, Filter, ArrowUpDown, Trash2, Check, Star, X } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FcApprove } from 'react-icons/fc';
import { GoStarFill } from 'react-icons/go';

const COLORS = {
  background: '#F5F7FA',
  primary: '#2B6CB0',
  secondary: '#38A169',
  text: '#1A202C',
  error: '#E53E3E',
};

const CATEGORIES = ['All', 'Stick Fights', 'Tutorials', 'Collabs', 'Assets', 'Animations', 'Other'];

const Videos = () => {
  const { fetchVideos, accessToken, BASE_URL, refreshAdminToken } = useAppContext();
  const [videos, setVideos] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, currentPage: 1 });
  const [stats, setStats] = useState({ totalVideos: 0, approvedVideos: 0, unapprovedVideos: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    isApproved: 'All',
    category: 'All',
    featured: 'All',
    search: '',
    startDate: null,
    endDate: null,
  });
  const [sort, setSort] = useState({ column: 'All', direction: 'All' });
  const [limit, setLimit] = useState(10);
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState(null);
  const [actionVideoId, setActionVideoId] = useState(null);

  const fetchVideosData = useCallback(async () => {
    setIsLoading(true);
    const params = {
      page: pagination.currentPage,
      limit,
      ...(filters.isApproved !== 'All' && { isApproved: filters.isApproved === 'Approved' }),
      ...(filters.category !== 'All' && { category: filters.category }),
      ...(filters.featured !== 'All' && { featured: filters.featured === 'Featured' }),
      ...(filters.search && { search: filters.search }),
      ...(filters.startDate && { startDate: filters.startDate.toISOString() }),
      ...(filters.endDate && { endDate: filters.endDate.toISOString() }),
      ...(sort.column !== 'All' && { sort: `${sort.direction === 'Descending' ? '-' : ''}${sort.column}` }),
    };
    const response = await fetchVideos(params);
    if (response.success) {
      setVideos(response.data.videos);
      setPagination(response.data.pagination);
      setStats(response.stats);
    } else {
      setVideos([]);
      toast.error(response.message, { id: 'videos-error' });
    }
    setIsLoading(false);
  }, [fetchVideos, pagination.currentPage, limit, filters, sort]);

  useEffect(() => {
    fetchVideosData();
  }, [fetchVideosData]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleSortChange = (column, direction) => {
    setSort({ column, direction });
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (page) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
  };

  const handleLimitChange = (e) => {
    setLimit(Number(e.target.value));
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleSelectVideo = (videoId) => {
    setSelectedVideos((prev) =>
      prev.includes(videoId) ? prev.filter((id) => id !== videoId) : [...prev, videoId]
    );
  };

  const handleAction = (action, videoId) => {
    setModalAction(action);
    setActionVideoId(videoId);
    setIsModalOpen(true);
  };

  const confirmAction = async () => {
    try {
      if (modalAction === 'delete') {
        await axios.delete(`${BASE_URL}admin/videos/${actionVideoId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        toast.success("Video deleted successfully");
      } else if (modalAction === 'bulkDelete') {
        await axios.delete(`${BASE_URL}admin/videos/bulk`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          data: { videoIds: selectedVideos },
        });
        toast.success("Selected videos deleted successfully");
        setSelectedVideos([]);
      } else {
        const response = await axios.put(
          `${BASE_URL}admin/videos/${actionVideoId}/${modalAction}`,
          {},
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        toast.success(response.data.message);
      }
      fetchVideosData();
    } catch (error) {
      if (error.response?.status === 401) {
        const newToken = await refreshAdminToken();
        if (newToken) {
          try {
            if (modalAction === 'delete') {
              await axios.delete(`${BASE_URL}admin/videos/${actionVideoId}`, {
                headers: { Authorization: `Bearer ${newToken}` },
              });
              toast.success("Video deleted successfully");
            } else if (modalAction === 'bulkDelete') {
              await axios.delete(`${BASE_URL}admin/videos/bulk`, {
                headers: { Authorization: `Bearer ${newToken}` },
                data: { videoIds: selectedVideos },
              });
              toast.success("Selected videos deleted successfully");
              setSelectedVideos([]);
            } else {
              const response = await axios.put(
                `${BASE_URL}admin/videos/${actionVideoId}/${modalAction}`,
                {},
                { headers: { Authorization: `Bearer ${newToken}` } }
              );
              toast.success(response.data.message);
            }
            fetchVideosData();
          } catch (retryError) {
            toast.error(retryError.response?.data?.message || `Failed to ${modalAction} video`);
          }
        }
      } else {
        toast.error(error.response?.data?.message || `Failed to ${modalAction} video`);
      }
    } finally {
      setIsModalOpen(false);
      setModalAction(null);
      setActionVideoId(null);
    }
  };

  const renderPagination = () => {
    const pages = [];
    for (let i = 1; i <= pagination.totalPages; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-1 rounded ${pagination.currentPage === i ? 'font-bold' : ''}`}
          style={{
            backgroundColor: pagination.currentPage === i ? COLORS.primary : 'transparent',
            color: pagination.currentPage === i ? COLORS.background : COLORS.text,
          }}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  const getModalMessage = () => {
    if (modalAction === 'bulkDelete') {
      return `Are you sure you want to delete ${selectedVideos.length} video(s)?`;
    }
    if (modalAction === 'delete') {
      return 'Are you sure you want to delete this video?';
    }
    if (modalAction === 'approve') {
      return 'Are you sure you want to approve this video?';
    }
    if (modalAction === 'unapprove') {
      return 'Are you sure you want to unapprove this video?';
    }
    if (modalAction === 'feature') {
      return 'Are you sure you want to feature this video?';
    }
    if (modalAction === 'unfeature') {
      return 'Are you sure you want to unfeature this video?';
    }
    return '';
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-4" style={{ color: COLORS.text }}>
        Videos Management
      </h2>
      <div className="mb-4" style={{ color: COLORS.text }}>
        Total: {stats.totalVideos}, Approved: {stats.approvedVideos}, Unapproved: {stats.unapprovedVideos}
      </div>
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Search size={20} style={{ color: COLORS.text }} />
            <input
              type="text"
              placeholder="Search videos..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="p-2 border rounded"
              style={{ borderColor: COLORS.primary, color: COLORS.text }}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={20} style={{ color: COLORS.text }} />
            <select
              value={filters.isApproved}
              onChange={(e) => handleFilterChange('isApproved', e.target.value)}
              className="p-2 border rounded"
              style={{ borderColor: COLORS.primary, color: COLORS.text }}
            >
              <option value="All">All</option>
              <option value="Approved">Approved</option>
              <option value="Unapproved">Unapproved</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Filter size={20} style={{ color: COLORS.text }} />
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="p-2 border rounded"
              style={{ borderColor: COLORS.primary, color: COLORS.text }}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Filter size={20} style={{ color: COLORS.text }} />
            <select
              value={filters.featured}
              onChange={(e) => handleFilterChange('featured', e.target.value)}
              className="p-2 border rounded"
              style={{ borderColor: COLORS.primary, color: COLORS.text }}
            >
              <option value="All">All</option>
              <option value="Featured">Featured</option>
              <option value="Not Featured">Not Featured</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <DatePicker
              selected={filters.startDate}
              onChange={(date) => handleFilterChange('startDate', date)}
              placeholderText="Start Date"
              className="p-2 border rounded"
              style={{ borderColor: COLORS.primary, color: COLORS.text }}
            />
          </div>
          <div className="flex items-center gap-2">
            <DatePicker
              selected={filters.endDate}
              onChange={(date) => handleFilterChange('endDate', date)}
              placeholderText="End Date"
              className="p-2 border rounded"
              style={{ borderColor: COLORS.primary, color: COLORS.text }}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={limit}
            onChange={handleLimitChange}
            className="p-2 border rounded"
            style={{ borderColor: COLORS.primary, color: COLORS.text }}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span style={{ color: COLORS.text }}>Videos per page</span>
        </div>
      </div>
      {selectedVideos.length > 0 && (
        <div className="mb-4">
          <button
            onClick={() => {
              setModalAction('bulkDelete');
              setIsModalOpen(true);
            }}
            className="p-2 rounded flex items-center gap-2"
            style={{ backgroundColor: COLORS.error, color: COLORS.background }}
          >
            <Trash2 size={20} />
            Delete Selected ({selectedVideos.length})
          </button>
        </div>
      )}
      {isLoading ? (
        <div className="flex justify-center">
          <Loader2 className="animate-spin" size={40} style={{ color: COLORS.primary }} />
        </div>
      ) : videos.length === 0 ? (
        <p className="text-center" style={{ color: COLORS.text }}>
          No videos found
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ backgroundColor: COLORS.primary, color: COLORS.background }}>
                <th className="p-2">
                  <input
                    type="checkbox"
                    checked={selectedVideos.length === videos.length}
                    onChange={() =>
                      setSelectedVideos(
                        selectedVideos.length === videos.length
                          ? []
                          : videos.map((video) => video._id)
                      )
                    }
                  />
                </th>
                {['Title', 'Category', 'Created At', 'Likes', 'Views'].map((col) => (
                  <th key={col} className="p-2">
                    <div className="flex items-center gap-2">
                      {col}
                      <select
                        value={sort.column === col ? sort.direction : 'All'}
                        onChange={(e) => handleSortChange(col, e.target.value)}
                        className="p-1 border rounded"
                        style={{ borderColor: COLORS.background, color: COLORS.text }}
                      >
                        <option value="All">All</option>
                        <option value="Ascending">Asc</option>
                        <option value="Descending">Desc</option>
                      </select>
                    </div>
                  </th>
                ))}
                <th className="p-2">User</th>
                <th className="p-2">Approval</th>
                <th className="p-2">Featured</th>
                <th className="p-2">Video URL</th>
                <th className="p-2">Thumbnail URL</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {videos.map((video) => (
                <tr key={video._id} className="border-b" style={{ borderColor: COLORS.primary }}>
                  <td className="p-2">
                    <input
                      type="checkbox"
                      checked={selectedVideos.includes(video._id)}
                      onChange={() => handleSelectVideo(video._id)}
                    />
                  </td>
                  <td className="p-2" style={{ color: COLORS.text }}>
                    {video.title}
                  </td>
                  <td className="p-2" style={{ color: COLORS.text }}>
                    {video.category}
                  </td>
                  <td className="p-2" style={{ color: COLORS.text }}>
                    {new Date(video.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-2" style={{ color: COLORS.text }}>
                    {video.stats?.likes || 0}
                  </td>
                  <td className="p-2" style={{ color: COLORS.text }}>
                    {video.stats?.views || 0}
                  </td>
                  <td className="p-2" style={{ color: COLORS.text }}>
                    {video.userId?.name || 'Unknown'}
                  </td>
                  <td className="p-2" style={{ color: COLORS.text }}>
                    {video.isApproved ? 'Approved' : 'Unapproved'}
                  </td>
                  <td className="p-2" style={{ color: COLORS.text }}>
                    {video.featured ? 'Featured' : 'Not Featured'}
                  </td>
                  <td className="p-2" style={{ color: COLORS.text }}>
                    <a href={video.videoURL} target="_blank" rel="noopener noreferrer">
                      View
                    </a>
                  </td>
                  <td className="p-2" style={{ color: COLORS.text }}>
                    <a href={video.thumbnail?.url} target="_blank" rel="noopener noreferrer">
                      View
                    </a>
                  </td>
                  <td className="p-2 flex gap-2">
                    <button
                      onClick={() => handleAction(video.isApproved ? 'unapprove' : 'approve', video._id)}
                      className="p-1 rounded cursor-pointer"
                      style={{ backgroundColor: COLORS.secondary, color: COLORS.background }}
                    >
                     {video.isApproved ? <Check size={16} /> : <FcApprove/>} 
                    </button>
                    <button
                      onClick={() => handleAction(video.featured ? 'unfeature' : 'feature', video._id)}
                      className="p-1 rounded cursor-pointer"
                      style={{ backgroundColor: COLORS.primary, color: COLORS.background }}
                    >
                      {video.featured ?<GoStarFill/> : <Star size={16} />}
                    </button>
                    <button
                      onClick={() => handleAction('delete', video._id)}
                      className="p-1 rounded cursor-pointer"
                      style={{ backgroundColor: COLORS.error, color: COLORS.background }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="flex justify-between items-center mt-4">
        <div style={{ color: COLORS.text }}>
          Page {pagination.currentPage} of {pagination.totalPages}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={!pagination.hasPrevPage}
            className="p-2 rounded disabled:opacity-50"
            style={{ backgroundColor: COLORS.primary, color: COLORS.background }}
          >
            Previous
          </button>
          {renderPagination()}
          <button
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={!pagination.hasNextPage}
            className="p-2 rounded disabled:opacity-50"
            style={{ backgroundColor: COLORS.primary, color: COLORS.background }}
          >
            Next
          </button>
        </div>
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full" style={{ backgroundColor: COLORS.background }}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold" style={{ color: COLORS.text }}>
                Confirm {modalAction === 'bulkDelete' ? 'Bulk Deletion' : modalAction.charAt(0).toUpperCase() + modalAction.slice(1)}
              </h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X size={20} style={{ color: COLORS.text }} />
              </button>
            </div>
            <p className="mb-6" style={{ color: COLORS.text }}>
              {getModalMessage()}
            </p>
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded"
                style={{ backgroundColor: COLORS.secondary, color: COLORS.background }}
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                className="px-4 py-2 rounded"
                style={{ backgroundColor: modalAction.includes('delete') ? COLORS.error : COLORS.primary, color: COLORS.background }}
              >
                {modalAction === 'bulkDelete' ? 'Delete' : modalAction.charAt(0).toUpperCase() + modalAction.slice(1)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Videos;