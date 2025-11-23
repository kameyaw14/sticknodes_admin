// src/components/top10/AddVideoModal.jsx  ← NEW FILE BRO
import React, { useState, useEffect, useCallback } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { useAppContext } from '../../contexts/AppContext';

const AddVideoModal = ({ isOpen, onClose, weekId, onSuccess }) => {
  const { BASE_URL, accessToken } = useAppContext();
  const [search, setSearch] = useState('');
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);

  // NEW ADDITION: fetch approved videos (public route nigga!)
  const fetchVideos = useCallback(async (reset = false) => {
    if (!search.trim()) return;
    setLoading(true);
    console.log("loading...")
    try {
      const res = await axios.get(`${BASE_URL}video/videos`, {
        params: {
          search: search.trim(),
          page: reset ? 1 : page,
          limit: 10,
        },
      });

      console.log(res.data)

      const newVideos = res.data.data.videos;
      setVideos(prev => reset ? newVideos : [...prev, ...newVideos]);
      setHasMore(res.data.data.pagination.hasNextPage);
      if (reset) setPage(1);
    } catch (err) {
      console.error(err)
      toast.error("Failed to search videos nigga");
    } finally {
      setLoading(false);
    }
  }, [BASE_URL, search, page]);

  useEffect(() => {
    const delay = setTimeout(() => {
      if (search) fetchVideos(true);
    }, 500);
    return () => clearTimeout(delay);
  }, [search]);

  useEffect(() => {
    if (page > 1) fetchVideos();
  }, [page]);

  // NEW ADDITION: Add video to Top 10
  const addToTop10 = async () => {
    if (!selectedVideo) return toast.error("Pick a video first bro");

    try {
      await axios.post(
        `${BASE_URL}admin/top10/week/${weekId}/video`,
        { videoId: selectedVideo.id },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      toast.success(`"${selectedVideo.title}" added to #${videos.findIndex(v => v.id === selectedVideo.id) + 1}`);
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || "Can't add this video";
      toast.error(msg);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop blur + lock background */}
      <div className="absolute inset-0 bg-black/30 bg-opacity-60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Add Video to Top 10</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="relative mb-6">
            <Search className="absolute left-4 top-4 text-gray-400" size={20} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, user, or tags..."
              className="w-full pl-12 pr-4 py-4 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none text-lg"
            />
          </div>

          <div className="max-h-96 overflow-y-auto space-y-3">
            {loading && page === 1 ? (
              <div className="flex justify-center py-12">
                <Loader2 className="animate-spin" size={40} />
              </div>
            ) : videos.length === 0 ? (
              <p className="text-center text-gray-500 py-12">No approved videos found nigga</p>
            ) : (
              videos.map(video => (
                <div
                  key={video.id}
                  onClick={() => setSelectedVideo(video)}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedVideo?.id === video.id
                      ? 'border-blue-500 bg-blue-50 shadow-lg'
                      : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <img
                    src={video.thumbnail.url}
                    alt="thumb"
                    className="w-32 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{video.title}</h3>
                    <p className="text-gray-600">by {video.user.name}</p>
                    <div className="flex gap-4 text-sm text-gray-500 mt-1">
                      <span>Views: {video.stats.views.toLocaleString()}</span>
                      <span>Likes: {video.stats.likes.toLocaleString()}</span>
                    </div>
                  </div>
                  {video.hasWonTop10 && (
                    <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                      Past Winner
                    </span>
                  )}
                </div>
              ))
            )}
            {hasMore && (
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={loading}
                className="w-full py-3 text-blue-600 font-semibold hover:bg-blue-50 rounded-lg"
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={addToTop10}
            disabled={!selectedVideo}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-700 hover:to-purple-700"
          >
            Add to Top 10
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddVideoModal;