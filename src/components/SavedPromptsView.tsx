import React from 'react';
import { BookOpen } from 'lucide-react';

const SavedPromptsView: React.FC = () => {
  return (
    <div className="h-full flex items-center justify-center bg-gray-50 p-6">
      <div className="text-center text-gray-500 max-w-2xl">
        <BookOpen size={64} className="mx-auto mb-4 text-gray-300" />
        <h2 className="text-2xl font-semibold mb-2">Saved Prompts</h2>
        <p>This feature will be implemented in a future update.</p>
        <p className="text-sm mt-2">Here you'll be able to save and manage your favorite prompts.</p>
      </div>
    </div>
  );
};

export default SavedPromptsView; 