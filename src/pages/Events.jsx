import React from 'react';

const COLORS = {
  background: '#F5F7FA',
  primary: '#2B6CB0',
  secondary: '#38A169',
  text: '#1A202C',
  error: '#E53E3E',
};

const Events = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold" style={{ color: COLORS.text }}>
        Events Management
      </h2>
    </div>
  );
};

export default Events;