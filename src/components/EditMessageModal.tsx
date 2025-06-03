import React, { useState, useEffect, useRef } from 'react';
import { X, Send } from 'lucide-react';

interface EditMessageModalProps {
  isOpen: boolean;
  message: string;
  onClose: () => void;
  onSave: (newMessage: string) => void;
  loading?: boolean;
}

const EditMessageModal: React.FC<EditMessageModalProps> = ({
  isOpen,
  message,
  onClose,
  onSave,
  loading = false
}) => {
  const [editedMessage, setEditedMessage] = useState(message);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditedMessage(message);
  }, [message]);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(textareaRef.current.value.length, textareaRef.current.value.length);
    }
  }, [isOpen]);

  const handleSave = () => {
    if (editedMessage.trim() && editedMessage.trim() !== message) {
      onSave(editedMessage.trim());
    } else {
      onClose();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Edit Message</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 min-h-0">
          <textarea
            ref={textareaRef}
            value={editedMessage}
            onChange={(e) => setEditedMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Edit your message..."
            className="w-full h-32 min-h-[8rem] resize-y border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
            disabled={loading}
          />
          <p className="text-sm text-gray-500 mt-2">
            Press Enter to save, Shift+Enter for new line, Esc to cancel
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!editedMessage.trim() || editedMessage.trim() === message || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Send size={16} />
            {loading ? 'Saving...' : 'Save & Continue'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditMessageModal; 