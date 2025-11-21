
import { Search, Filter as FilterIcon, RotateCcw } from 'lucide-react';
import DatePicker from 'react-datepicker';

const CATEGORIES = ['All', 'Stick Fights', 'Tutorials', 'Collabs', 'Assets', 'Animations', 'Other'];

const VideoFilters = ({ tempFilters, setTempFilters, onApply, onReset, limit, onLimitChange }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search videos..."
            value={tempFilters.search}
            onChange={(e) => setTempFilters(prev => ({ ...prev, search: e.target.value }))}
            className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
          />
        </div>

        <select
          value={tempFilters.isApproved}
          onChange={(e) => setTempFilters(prev => ({ ...prev, isApproved: e.target.value }))}
          className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="All">All Approval</option>
          <option value="Approved">Approved</option>
          <option value="Unapproved">Unapproved</option>
        </select>

        <select
          value={tempFilters.category}
          onChange={(e) => setTempFilters(prev => ({ ...prev, category: e.target.value }))}
          className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        >
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <select
          value={tempFilters.featured}
          onChange={(e) => setTempFilters(prev => ({ ...prev, featured: e.target.value }))}
          className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="All">All Featured</option>
          <option value="Featured">Featured</option>
          <option value="Not Featured">Not Featured</option>
        </select>

        <DatePicker
          selected={tempFilters.startDate}
          onChange={(date) => setTempFilters(prev => ({ ...prev, startDate: date }))}
          placeholderText="Start Date"
          className="px-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />

        <DatePicker
          selected={tempFilters.endDate}
          onChange={(date) => setTempFilters(prev => ({ ...prev, endDate: date }))}
          placeholderText="End Date"
          className="px-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />

        <select
          value={limit}
          onChange={(e) => onLimitChange(Number(e.target.value))}
          className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value={10}>10 per page</option>
          <option value={25}>25 per page</option>
          <option value={50}>50 per page</option>
        </select>
      </div>

      <div className="flex gap-3 mt-6">
        <button
          onClick={onApply}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
        >
          Apply Filters
        </button>
        <button
          onClick={onReset}
          className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
      </div>
    </div>
  );
};

export default VideoFilters;