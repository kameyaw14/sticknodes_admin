import { Check, Star, Trash2 } from 'lucide-react';
import { FcApprove } from 'react-icons/fc';
import { GoStarFill } from 'react-icons/go';

const ActionButtons = ({ video, openAction }) => {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => openAction(video.isApproved ? 'unapprove' : 'approve', video.id)}
        className="p-2 rounded-lg hover:bg-gray-100 transition"
        title={video.isApproved ? 'Unapprove' : 'Approve'}
      >
        {video.isApproved ? <Check className="w-4 h-4 text-green-600" /> : <FcApprove size={18} />}
      </button>

      <button
        onClick={() => openAction(video.featured ? 'unfeature' : 'feature', video.id)}
        className="p-2 rounded-lg hover:bg-gray-100 transition"
        title={video.featured ? 'Unfeature' : 'Feature'}
      >
        {video.featured ? <GoStarFill className="text-yellow-500" /> : <Star className="w-4 h-4 text-gray-500" />}
      </button>

      <button
        onClick={() => openAction('delete', video.id)}
        className="p-2 rounded-lg hover:bg-red-50 transition"
        title="Delete"
      >
        <Trash2 className="w-4 h-4 text-red-600" />
      </button>
    </div>
  );
};

export default ActionButtons;