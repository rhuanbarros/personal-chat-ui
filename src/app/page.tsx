'use client';

import React from 'react';
import { MessageSquare } from 'lucide-react';

export default function Home() {
  return (
    <div className="h-full flex items-center justify-center bg-gray-50 p-6">
      <div className="text-center max-w-2xl">
        <MessageSquare size={64} className="mx-auto mb-4 text-gray-400" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome to AI Chat Interface</h1>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Start a new conversation, browse your saved prompts, or configure your settings using the sidebar.
        </p>
        <div className="text-sm text-gray-500 space-y-1">
          <p>• Click "New Chat" to start a conversation</p>
          <p>• Select an existing conversation to continue</p>
          <p>• Use the navigation buttons to explore features</p>
        </div>
      </div>
    </div>
  );
} 