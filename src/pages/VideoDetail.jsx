
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { Loader2, Check, Star, Trash2, X, Eye, MessageSquare, Maximize2, Heart, Bookmark } from 'lucide-react';
import { FcApprove } from 'react-icons/fc';
import { GoStarFill } from 'react-icons/go';
import { toast } from 'sonner';
import axios from 'axios';
import ReactPlayer from 'react-player/youtube';

const COLORS = {
  background: '#F5F7FA',
  primary: '#2B6CB0',
  secondary: '#38A169',
  text: '#1A202C',
  error: '#E53E3E',
};

const VideoDetail = () => {
  const { accessToken, BASE_URL, refreshAdminToken } = useAppContext();
  const { videoId } = useParams();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [playerLoading, setPlayerLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState(null);
  const [actionId, setActionId] = useState(null); // For video or comment ID
  const playerRef = useRef(null);

  const fetchVideo = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}admin/videos/${videoId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (response.data.success) {
        setVideo(response.data.video);
      } else {
        toast.error(response.data.message || 'Failed to load video');
      }
    } catch (error) {
      if (error.response?.status === 401) {
        const newToken = await refreshAdminToken();
        if (newToken) {
          try {
            const response = await axios.get(`${BASE_URL}admin/videos/${videoId}`, {
              headers: { Authorization: `Bearer ${newToken}` },
            });
            if (response.data.success) {
              setVideo(response.data.video);
            } else {
              toast.error(response.data.message || 'Failed to load video');
            }
          } catch (retryError) {
            toast.error(retryError.response?.data?.message || 'Failed to load video');
          }
        } else {
          toast.error('Authentication failed');
        }
      } else {
        toast.error(error.response?.data?.message || 'Failed to load video');
      }
    } finally {
      setLoading(false);
    }
  }, [accessToken, BASE_URL, refreshAdminToken, videoId]);

  const handleAction = (action, id, isComment = false) => {
    setModalAction(action);
    setActionId(id);
    setIsModalOpen(true);
  };

  const confirmAction = async () => {
    try {
      if (modalAction === 'delete') {
        await axios.delete(`${BASE_URL}admin/videos/${actionId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        toast.success('Video deleted successfully');
        window.close(); // Close the tab after deletion
      } else if (modalAction === 'deleteComment') {
        await axios.delete(`${BASE_URL}admin/videos/${videoId}/comments/${actionId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        toast.success('Comment deleted successfully');
        fetchVideo(); // Refresh video data
      } else {
        const response = await axios.put(
          `${BASE_URL}admin/videos/${actionId}/${modalAction}`,
          {},
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        toast.success(response.data.message);
        fetchVideo(); // Refresh video data
      }
    } catch (error) {
      if (error.response?.status === 401) {
        const newToken = await refreshAdminToken();
        if (newToken) {
          try {
            if (modalAction === 'delete') {
              await axios.delete(`${BASE_URL}admin/videos/${actionId}`, {
                headers: { Authorization: `Bearer ${newToken}` },
              });
              toast.success('Video deleted successfully');
              window.close();
            } else if (modalAction === 'deleteComment') {
              await axios.delete(`${BASE_URL}admin/videos/${videoId}/comments/${actionId}`, {
                headers: { Authorization: `Bearer ${newToken}` },
              });
              toast.success('Comment deleted successfully');
              fetchVideo();
            } else {
              const response = await axios.put(
                `${BASE_URL}admin/videos/${actionId}/${modalAction}`,
                {},
                { headers: { Authorization: `Bearer ${newToken}` } }
              );
              toast.success(response.data.message);
              fetchVideo();
            }
          } catch (retryError) {
            toast.error(retryError.response?.data?.message || `Failed to ${modalAction}`);
          }
        } else {
          toast.error('Authentication failed');
        }
      } else {
        toast.error(error.response?.data?.message || `Failed to ${modalAction}`);
      }
    } finally {
      setIsModalOpen(false);
      setModalAction(null);
      setActionId(null);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      toast.error('Please enter a comment');
      return;
    }
    try {
      const response = await axios.post(
        `${BASE_URL}video/${videoId}/add-comment`,
        { content: newComment },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (response.data.success) {
        toast.success('Comment added successfully');
        setNewComment('');
        fetchVideo();
      } else {
        toast.error(response.data.message || 'Failed to add comment');
      }
    } catch (error) {
      if (error.response?.status === 401) {
        const newToken = await refreshAdminToken();
        if (newToken) {
          try {
            const response = await axios.post(
              `${BASE_URL}video/${videoId}/add-comment`,
              { content: newComment },
              { headers: { Authorization: `Bearer ${newToken}` } }
            );
            if (response.data.success) {
              toast.success('Comment added successfully');
              setNewComment('');
              fetchVideo();
            } else {
              toast.error(response.data.message || 'Failed to add comment');
            }
          } catch (retryError) {
            toast.error(retryError.response?.data?.message || 'Failed to add comment');
          }
        } else {
          toast.error('Authentication failed');
        }
      } else {
        toast.error(error.response?.data?.message || 'Failed to add comment');
      }
    }
  };

  const handlePlayClick = () => {
    setPlaying(true);
    setPlayerLoading(true);
  };

  const handleFullscreen = () => {
    if (playerRef.current) {
      const wrapper = playerRef.current.wrapper;
      if (wrapper.requestFullscreen) {
        wrapper.requestFullscreen();
      } else if (wrapper.webkitRequestFullscreen) {
        wrapper.webkitRequestFullscreen();
      } else if (wrapper.msRequestFullscreen) {
        wrapper.msRequestFullscreen();
      }
      setIsFullscreen(true);
    }
  };

  useEffect(() => {
    fetchVideo();
  }, [fetchVideo]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen" style={{ backgroundColor: COLORS.background }}>
        <Loader2 className="animate-spin" size={40} style={{ color: COLORS.primary }} />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="flex flex-col items-center justify-center h-screen" style={{ backgroundColor: COLORS.background }}>
        <h2 className="text-2xl font-bold" style={{ color: COLORS.text }}>Video not found</h2>
        <Link to="/admin/videos" className="mt-4 text-blue-500 hover:underline">
          Back to Videos
        </Link>
      </div>
    );
  }

  const getModalMessage = () => {
    if (modalAction === 'delete') {
      return 'Are you sure you want to delete this video?';
    }
    if (modalAction === 'deleteComment') {
      return 'Are you sure you want to delete this comment?';
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
    <div className="max-w-6xl mx-auto px-4 py-8" style={{ backgroundColor: COLORS.background }}>
      {/* Back Button */}
      <Link
        to="/admin/videos"
        className="flex items-center text-blue-500 hover:underline mb-6"
        style={{ color: COLORS.primary }}
      >
        <X className="mr-1" size={20} />
        Close
      </Link>

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="md:flex">
          {/* Left Column - Video Player and Info */}
          <div className="md:w-2/3 p-6">
            <div className="relative pt-[56.25%] bg-black">
              {!playing && (
                <div
                  className="absolute bg-white/20 inset-0 cursor-pointer"
                  onClick={handlePlayClick}
                >
                  <Loader2 className="animate-spin absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" size={40} style={{ color: COLORS.primary }} />
                </div>
              )}
              <ReactPlayer
                ref={playerRef}
                url={video.videoURL}
                light={video.thumbnail.url}
                playing={playing}
                controls={playing}
                onClickPreview={handlePlayClick}
                onReady={() => setPlayerLoading(false)}
                onPlay={() => setPlaying(true)}
                width="100%"
                height="100%"
                style={{ position: 'absolute', top: 0, left: 0 }}
                config={{
                  youtube: {
                    playerVars: {
                      modestbranding: 1,
                      rel: 0,
                      origin: 'https://sticknodestv.onrender.com',
                    },
                  },
                }}
                onError={(e) => {
                  console.error('Player error:', e);
                  setPlayerLoading(false);
                  toast.error('Failed to load video. Please try again later.');
                }}
              />
              {playerLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <Loader2 className="animate-spin" size={40} style={{ color: COLORS.background }} />
                </div>
              )}
              <button
                onClick={handleFullscreen}
                className="absolute bottom-4 right-4 bg-black/50 text-white p-2 rounded-full z-10 hover:bg-black/70 transition-colors"
              >
                <Maximize2 size={20} />
              </button>
            </div>

            {/* Video Info */}
            <div className="mt-6">
              <h1 className="text-2xl font-bold mb-2" style={{ color: COLORS.text }}>
                {video.title}
              </h1>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4" style={{ color: COLORS.text }}>
                  <span className="flex items-center">
                    <Eye className="mr-1" size={18} />
                    {video.stats.views.toLocaleString()}
                  </span>
                  <span className="flex items-center">
                    <MessageSquare className="mr-1" size={18} />
                    {video.stats.comments.toLocaleString()}
                  </span>
                  <span className="flex items-center">
                    <Heart className="mr-1" size={18} />
                    {video.stats.likes.toLocaleString()}
                  </span>
                  <span className="flex items-center">
                    <Bookmark className="mr-1" size={18} />
                    {video.stats.saves.toLocaleString()}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction(video.isApproved ? 'unapprove' : 'approve', video._id)}
                    className="p-2 rounded cursor-pointer"
                    style={{ backgroundColor: COLORS.secondary, color: COLORS.background }}
                  >
                    {video.isApproved ? <Check size={16} /> : <FcApprove />}
                  </button>
                  <button
                    onClick={() => handleAction(video.featured ? 'unfeature' : 'feature', video._id)}
                    className="p-2 rounded cursor-pointer"
                    style={{ backgroundColor: COLORS.primary, color: COLORS.background }}
                  >
                    {video.featured ? <GoStarFill /> : <Star size={16} />}
                  </button>
                  <button
                    onClick={() => handleAction('delete', video._id)}
                    className="p-2 rounded cursor-pointer"
                    style={{ backgroundColor: COLORS.error, color: COLORS.background }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Creator Info */}
              <div className="flex items-center mb-6 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white mr-3">
                    <img
                      src={video.userId?.avatar?.url || 'https://via.placeholder.com/40'}
                      alt={video.userId?.name || 'Unknown'}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  </div>
                  <div>
                    <span className="font-medium" style={{ color: COLORS.text }}>
                      {video.userId?.name || 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2" style={{ color: COLORS.text }}>
                  Description
                </h2>
                <p style={{ color: COLORS.text }}>
                  {video.description || 'No description available.'}
                </p>
              </div>

              {/* Category and Tags */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2" style={{ color: COLORS.text }}>
                  Details
                </h2>
                <p style={{ color: COLORS.text }}>
                  <strong>Category:</strong> {video.category}
                </p>
                <p style={{ color: COLORS.text }}>
                  <strong>Tags:</strong> {video.tags.length > 0 ? video.tags.join(', ') : 'None'}
                </p>
              </div>

              {/* Comments Section */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2" style={{ color: COLORS.text }}>
                  Comments ({video.comments.length})
                </h2>
                <div className="mb-4">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="w-full p-2 border rounded"
                    style={{ borderColor: COLORS.primary, color: COLORS.text }}
                    rows={4}
                  />
                  <button
                    onClick={handleAddComment}
                    className="mt-2 px-4 py-2 rounded"
                    style={{ backgroundColor: COLORS.primary, color: COLORS.background }}
                  >
                    Post Comment
                  </button>
                </div>
                {video.comments.length === 0 ? (
                  <p style={{ color: COLORS.text }}>No comments yet.</p>
                ) : (
                  <div className="space-y-4">
                    {video.comments.map((comment) => (
                      <div key={comment._id} className="p-3 bg-gray-50 rounded-lg flex justify-between items-start">
                        <div>
                          <p className="font-medium" style={{ color: COLORS.text }}>
                            {comment.userId?.name || 'Unknown'}
                          </p>
                          <p style={{ color: COLORS.text }}>{comment.content}</p>
                          <p className="text-sm" style={{ color: COLORS.text }}>
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={() => handleAction('deleteComment', comment._id, true)}
                          className="p-1 rounded"
                          style={{ backgroundColor: COLORS.error, color: COLORS.background }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full" style={{ backgroundColor: COLORS.background }}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold" style={{ color: COLORS.text }}>
                Confirm {modalAction === 'deleteComment' ? 'Comment Deletion' : modalAction.charAt(0).toUpperCase() + modalAction.slice(1)}
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
                {modalAction === 'deleteComment' ? 'Delete' : modalAction.charAt(0).toUpperCase() + modalAction.slice(1)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoDetail;