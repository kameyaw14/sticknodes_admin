import React from 'react';
import { Check, Star, Trash2, ExternalLink } from 'lucide-react';
import { GoStarFill } from 'react-icons/go';
import { FcApprove } from 'react-icons/fc';
import { Link } from 'react-router-dom';
import ActionButtons from './ActionButtons.jsx';

const VideoTable = ({
  videos,
  selectedVideos,
  toggleSelectAll,
  toggleVideoSelect,
  openAction,
  sort,
  setSort,
  pagination,
  handlePageChange,
  accessToken,
  BASE_URL,
  fetchVideosData,
}) => {
  const headers = [
    { key: 'title', label: 'Title' },
    { key: 'category', label: 'Category' },
    { key: 'createdAt', label: 'Created' },
    { key: 'likes', label: 'Likes' },
    { key: 'views', label: 'Views' },
    { key: 'user', label: 'User' },
    { key: 'approval', label: 'Approval' },
    { key: 'featured', label: 'Featured' },
  ];

  const handleSort = (key) => {
    setSort(prev => ({
      column: key,
      direction: prev.column === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left">
                <input
                  type="checkbox"
                  checked={selectedVideos.length === videos.length && videos.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              {headers.map(h => (
                <th key={h.key} className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort(h.key)}
                    className="flex items-center gap-1 hover:text-gray-900"
                  >
                    {h.label}
                    {sort.column === h.key && (
                      <span className="text-blue-600">{sort.direction === 'desc' ? '↓' : '↑'}</span>
                    )}
                  </button>
                </th>
              ))}
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {videos.map((video) => (
              <tr key={video.id} className="hover:bg-gray-50 transition group">
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedVideos.includes(video.id)}
                    onChange={() => toggleVideoSelect(video.id)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {video.thumbnail && (
                      <div className="relative">
                        <img
                          src={video.thumbnail.url}
                          alt="thumb"
                          className="w-16 h-12 object-cover rounded opacity-0 group-hover:opacity-100 transition duration-300 absolute -top-16 left-0 shadow-lg z-10"
                        />
                        <div className="w-16 h-12 bg-gray-200 border-2 border-dashed rounded" />
                      </div>
                    )}
                    <Link
                      to={`/admin/videos/${video.id}`}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      {video.title}
                    </Link>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{video.category}</td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {new Date(video.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{video.stats?.likes || 0}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{video.stats?.views || 0}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{video.userId?.name || '—'}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    video.isApproved ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                  }`}>
                    {video.isApproved ? 'Approved' : 'Pending'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {video.featured ? (
                    <span className="inline-flex items-center gap-1 text-yellow-600">
                      <GoStarFill /> Featured
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <ActionButtons
                    video={video}
                    openAction={openAction}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="bg-white px-6 py-4 border-t border-gray-200 flex items-center justify-between">
        <p className="text-sm text-gray-700">
          Page {pagination.currentPage} of {pagination.totalPages}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={!pagination.hasPrevPage}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition"
          >
            Previous
          </button>
          <button
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={!pagination.hasNextPage}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoTable;