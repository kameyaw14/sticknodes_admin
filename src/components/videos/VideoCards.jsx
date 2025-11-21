import React from 'react';
import { Link } from 'react-router-dom';
import ActionButtons from './ActionButtons.jsx';

const VideoCards = ({ videos, selectedVideos, toggleVideoSelect, openAction }) => {
  return (
    <div className="grid gap-4">
      {videos.map((video) => (
        <div
          key={video.id}
          className={`bg-white rounded-lg border ${selectedVideos.includes(video.id) ? 'border-blue-500 shadow-lg' : 'border-gray-200'} p-4 transition`}
        >
          <div className="flex gap-4">
            <input
              type="checkbox"
              checked={selectedVideos.includes(video.id)}
              onChange={() => toggleVideoSelect(video.id)}
              className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600"
            />

            <div className="flex-1">
              {video.thumbnail && (
                <img
                  src={video.thumbnail.url}
                  alt={video.title}
                  className="w-full h-48 object-cover rounded-lg mb-3"
                />
              )}

              <Link to={`/admin/videos/${video.id}`} className="text-lg font-semibold text-blue-600 hover:underline">
                {video.title}
              </Link>

              <div className="mt-2 text-sm text-gray-600 space-y-1">
                <p>Category: <span className="font-medium">{video.category}</span></p>
                <p>By: <span className="font-medium">{video.userId?.name || 'Unknown'}</span></p>
                <p>Created: {new Date(video.createdAt).toLocaleDateString()}</p>
                <div className="flex gap-4">
                  <span>Likes: {video.stats?.likes || 0}</span>
                  <span>Views: {video.stats?.views || 0}</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    video.isApproved ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                  }`}>
                    {video.isApproved ? 'Approved' : 'Pending'}
                  </span>
                  {video.featured && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Featured
                    </span>
                  )}
                </div>

                <ActionButtons video={video} openAction={openAction} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default VideoCards;