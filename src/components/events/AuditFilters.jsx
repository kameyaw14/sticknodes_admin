import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const AuditFilters = ({ filters, setFilters }) => {
  const handleChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Action Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Action Type</label>
          <select
            value={filters.actionType}
            onChange={(e) => handleChange('actionType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Actions</option>
            <option value="VIDEO_UPLOAD">Video Upload</option>
            <option value="VIDEO_APPROVE">Video Approve</option>
            <option value="VIDEO_REJECT">Video Reject</option>
            <option value="COMMENT_CREATE">Comment Create</option>
            <option value="USER_LOGIN">User Login</option>
            <option value="ADMIN_LOGIN">Admin Login</option>
          </select>
        </div>

        {/* Resource Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Resource</label>
          <select
            value={filters.resourceType}
            onChange={(e) => handleChange('resourceType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Resources</option>
            <option value="Video">Video</option>
            <option value="User">User</option>
            <option value="Comment">Comment</option>
          </select>
        </div>

        {/* User Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">User (Name/ID)</label>
          <input
            type="text"
            value={filters.userSearch}
            onChange={(e) => handleChange('userSearch', e.target.value)}
            placeholder="Search user..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Date Range */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Date Range</label>
          <div className="flex flex-col sm:flex-row gap-2">
            <DatePicker
              selected={filters.startDate}
              onChange={(date) => handleChange('startDate', date)}
              placeholderText="Start Date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
            <DatePicker
              selected={filters.endDate}
              onChange={(date) => handleChange('endDate', date)}
              minDate={filters.startDate}
              placeholderText="End Date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditFilters;