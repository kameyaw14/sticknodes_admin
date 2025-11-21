
import axios from 'axios';
import { toast } from 'sonner';

const ConfirmModal = ({ isOpen, onClose, action, videoId, selectedCount, selectedVideos, accessToken, BASE_URL, onSuccess }) => {
  if (!isOpen) return null;

  const getMessage = () => {
    if (action === 'bulkDelete') return `Delete ${selectedCount} selected video(s)? This cannot be undone.`;
    if (action === 'delete') return 'Delete this video permanently?';
    if (action === 'approve') return 'Approve this video?';
    if (action === 'unapprove') return 'Unapprove this video?';
    if (action === 'feature') return 'Feature this video on homepage?';
    if (action === 'unfeature') return 'Remove from featured?';
    return '';
  };

  const handleConfirm = async () => {
    try {
      if (action === 'bulkDelete') {
        await axios.delete(`${BASE_URL}admin/videos/bulk`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          data: { videoIds: selectedVideos },
        });
        toast.success('Videos deleted successfully');
      } else if (action === 'delete') {
        await axios.delete(`${BASE_URL}admin/videos/${videoId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        toast.success('Video deleted');
      } else {
        await axios.put(`${BASE_URL}admin/videos/${videoId}/${action}`, {}, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        toast.success('Action completed');
      }
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4 animate-in fade-in zoom-in duration-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Confirm {action === 'bulkDelete' ? 'Bulk Delete' : action.charAt(0).toUpperCase() + action.slice(1)}
        </h3>
        <p className="text-gray-600 mb-8">{getMessage()}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className={`px-5 py-2.5 rounded-lg text-white transition ${
              action.includes('delete') ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {action === 'bulkDelete' ? 'Delete All' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;