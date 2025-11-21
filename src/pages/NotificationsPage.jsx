import React, { useState } from 'react';
import { Megaphone, Send, Eye, Users, User, Globe, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { useAppContext } from '../contexts/AppContext';
import { InputField } from '../components/notifications/InputField.jsx';
import { TextArea } from '../components/notifications/TextArea.jsx';
import { SelectField } from '../components/notifications/SelectField.jsx';

const NotificationPreview = ({ title, message, type }) => {
  const icons = {
    broadcast: <Globe className="w-5 h-5 text-purple-600" />,
    single: <User className="w-5 h-5 text-blue-600" />,
    group: <Users className="w-5 h-5 text-green-600" />,
  };

  return (
    <div className="p-5 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-gray-200">
      <div className="flex items-start gap-3">
        {icons[type]}
        <div className="flex-1">
          <p className="font-bold text-gray-900">{title || "No title"}</p>
          <p className="text-gray-700 mt-1">{message || "No message"}</p>
          <p className="text-xs text-gray-500 mt-2">
            Just now •{' '}
            {type === 'broadcast'
              ? 'All users'
              : type === 'single'
              ? '1 user'
              : 'Multiple users'}
          </p>
        </div>
      </div>
    </div>
  );
};

const ConfirmModal = ({ isOpen, onClose, onConfirm, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()} // Prevent close when clicking inside
      >
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <Megaphone className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Send Broadcast?
          </h2>
          <p className="text-gray-600">
            This message will be sent to <strong>ALL users</strong>{' '}
            immediately.
          </p>
        </div>

        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 rounded-xl border border-gray-300 hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-pink-600 text-white font-bold hover:from-red-700 hover:to-pink-700 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Send to All
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const NotificationsPage = () => {
  const { BASE_URL, accessToken } = useAppContext();
  const [formData, setFormData] = useState({
    type: 'broadcast',
    title: '',
    message: '',
    url: '',
  });
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSendClick = () => {
    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error('Title and message are required');
      return;
    }

    if (formData.type !== 'broadcast') {
      toast.info('Single/Group notifications coming soon!');
      return;
    }

    setShowConfirm(true);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
        console.log("Form : ", formData.message)
      await axios.post(
        `${BASE_URL}admin/broadcast`,
        {
          title: formData.title.trim(),
          message: formData.message.trim(),
          url: formData.url.trim() || null,
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      toast.success('Broadcast sent to all users!', {
        icon: <Megaphone className="w-5 h-5" />,
      });

      // Reset form
      setFormData({ type: 'broadcast', title: '', message: '', url: '' });
      setShowConfirm(false);
    } catch (error) {
      const msg =
        error.response?.data?.message || 'Failed to send broadcast';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Megaphone className="w-8 h-8 text-purple-600" />
          Send Notification
        </h1>
        <p className="text-gray-600 mt-2">
          Reach your users instantly with important updates
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left: Form */}
        <div className="space-y-6">
          <SelectField
            label="Send To"
            id="type"
            value={formData.type}
            onChange={handleChange}
          >
            <option value="broadcast">Broadcast (All Users)</option>
            <option value="single" disabled>
              Single User (Soon)
            </option>
            <option value="group" disabled>
              Group (Soon)
            </option>
          </SelectField>

          <InputField
            label="Title"
            id="title"
            name="title"
            placeholder="e.g. New Feature Released!"
            value={formData.title}
            onChange={handleChange}
          />

          <TextArea
            label="Message"
            id="message"
            name="message"
            placeholder="Write your announcement here..."
            value={formData.message}
            onChange={handleChange}
          />

          <InputField
            label="Link URL (Optional)"
            id="url"
            name="url"
            placeholder="https://example.com/feature"
            value={formData.url}
            onChange={handleChange}
          />

          <div className="flex gap-4 pt-4">
            <button
              onClick={handleSendClick}
              disabled={loading || !formData.title || !formData.message}
              className="flex-1 px-6 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
            >
              <Send className="w-5 h-5" />
              Send Notification
            </button>
          </div>
        </div>

        {/* Right: Live Preview */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Live Preview
          </h3>
          <div className="bg-gray-50 rounded-2xl p-6 border-2 border-dashed border-gray-300">
            <NotificationPreview
              title={formData.title}
              message={formData.message}
              type={formData.type}
            />
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleSubmit}
        loading={loading}
      />
    </div>
  );
};

export default NotificationsPage;