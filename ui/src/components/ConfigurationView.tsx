import React from 'react';
import { Settings } from 'lucide-react';

const ConfigurationView: React.FC = () => {
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50">
      <div className="text-center text-gray-500">
        <Settings size={64} className="mx-auto mb-4 text-gray-300" />
        <h2 className="text-2xl font-semibold mb-2">Configuration</h2>
        <p>This feature will be implemented in a future update.</p>
        <p className="text-sm mt-2">Here you'll be able to configure application settings and preferences.</p>
      </div>
    </div>
  );
};

export default ConfigurationView; 