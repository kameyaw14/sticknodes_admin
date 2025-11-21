
const VideoStats = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <p className="text-sm text-gray-600">Total Videos</p>
        <p className="text-2xl font-bold text-gray-900">{stats.totalVideos || 0}</p>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <p className="text-sm text-gray-600">Approved</p>
        <p className="text-2xl font-bold text-green-600">{stats.approvedVideos || 0}</p>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <p className="text-sm text-gray-600">Pending</p>
        <p className="text-2xl font-bold text-orange-600">{stats.unapprovedVideos || 0}</p>
      </div>
    </div>
  );
};

export default VideoStats;