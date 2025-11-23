// src/components/top10/CreateWeekModal.jsx  ← NEW FILE BRO
import React, { useState } from 'react';
import { Calendar, X } from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import axios from 'axios';
import { toast } from 'sonner';
import { useAppContext } from '../../contexts/AppContext';

const CreateWeekModal = ({ isOpen, onClose, onSuccess }) => {
  const { BASE_URL, accessToken } = useAppContext();
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(false);

  const createWeek = async () => {
    if (!selectedDate) return toast.error("Pick a Monday bro");

    const dateStr = selectedDate.toISOString();
    
    setLoading(true);
    try {
      await axios.post(
        `${BASE_URL}admin/top10/week`,
        { weekStart: dateStr },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      toast.success("New week created — time to crown kings!");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create week");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 bg-opacity-60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <Calendar className="text-blue-600" />
            Create New Top 10 Week
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={24} />
          </button>
        </div>

        <p className="text-gray-600 mb-6">
          Select the <strong>Monday</strong> that starts the week.
        </p>

        <div className="mb-8">
          <DatePicker
            selected={selectedDate}
            onChange={setSelectedDate}
            inline
            filterDate={(date) => date.getDay() === 1} // Only Mondays
            className="border-2 border-gray-300 rounded-xl"
          />
        </div>

        {selectedDate && (
          <div className="bg-blue-50 p-4 rounded-lg mb-6 text-center">
            <p className="font-bold text-lg">
              Week: {selectedDate.toLocaleDateString()} → {(d => { d.setDate(d.getDate() + 6); return d; })(new Date(selectedDate)).toLocaleDateString()}
            </p>
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={createWeek}
            disabled={!selectedDate || loading}
            className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-bold disabled:opacity-50 hover:from-green-700 hover:to-emerald-700 flex items-center gap-2"
          >
            {loading ? 'Creating...' : 'Create Week'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateWeekModal;