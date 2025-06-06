import React, { useState, useRef, useEffect } from 'react';
import { Send, Edit2, Check, X, Edit } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import { Conversation, Message, ModelConfiguration } from '@/types';
import EditMessageModal from './EditMessageModal';

interface ChatViewProps {
  conversation: Conversation | null;
  onSendMessage: (content: string) => void;
  onUpdateTitle: (conversationId: string, newTitle: string) => void;
  onEditMessage?: (messageIndex: number, newContent: string) => void;
  loading: boolean;
  aiThinking?: boolean;
  editingMessage?: boolean;
  configuration: ModelConfiguration;
}

const ChatView: React.FC<ChatViewProps> = ({
  conversation,
  onSendMessage,
  onUpdateTitle,
  onEditMessage,
  loading,
  aiThinking = false,
  editingMessage = false,
  configuration
}) => {
  const [message, setMessage] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [textareaHeight, setTextareaHeight] = useState(60); // Start with 2 lines height (approx 60px)
  const [isResizing, setIsResizing] = useState(false);
  const [hoveredMessageIndex, setHoveredMessageIndex] = useState<number | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingMessageIndex, setEditingMessageIndex] = useState<number | null>(null);
  const [editingMessageContent, setEditingMessageContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const resizeStartY = useRef<number>(0);
  const resizeStartHeight = useRef<number>(0);

  // Debug: Log configuration changes
  useEffect(() => {
    console.log('💬 ChatView: configuration updated:', configuration.provider, configuration.renderMarkdown);
  }, [configuration]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages]);

  useEffect(() => {
    if (conversation) {
      setEditedTitle(conversation.title);
    }
  }, [conversation]);

  const handleSendMessage = () => {
    if (message.trim() && !loading && !aiThinking && !editingMessage) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    resizeStartY.current = e.clientY;
    resizeStartHeight.current = textareaHeight;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = resizeStartY.current - e.clientY;
      const newHeight = Math.max(40, Math.min(200, resizeStartHeight.current + deltaY));
      setTextareaHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleTitleEdit = () => {
    if (conversation && editedTitle.trim() && editedTitle !== conversation.title) {
      onUpdateTitle(conversation._id!, editedTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const handleCancelTitleEdit = () => {
    setEditedTitle(conversation?.title || '');
    setIsEditingTitle(false);
  };

  const handleEditMessage = (messageIndex: number, messageContent: string) => {
    setEditingMessageIndex(messageIndex);
    setEditingMessageContent(messageContent);
    setEditModalOpen(true);
  };

  const handleSaveEditedMessage = (newContent: string) => {
    if (editingMessageIndex !== null && onEditMessage) {
      onEditMessage(editingMessageIndex, newContent);
      setEditModalOpen(false);
      setEditingMessageIndex(null);
      setEditingMessageContent('');
    }
  };

  const handleCancelEdit = () => {
    setEditModalOpen(false);
    setEditingMessageIndex(null);
    setEditingMessageContent('');
  };

  const formatMessageTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <div className="text-6xl mb-4">💬</div>
          <h2 className="text-2xl font-semibold mb-2">Welcome to AI Chat Interface</h2>
          <p>Start a new conversation to begin chatting with AI</p>
        </div>
      </div>
    );
  }

  // Filter out system messages for display
  const visibleMessages = conversation.messages.filter(msg => msg.role !== 'system');

  return (
    <>
      <div className="flex-1 flex flex-col bg-white h-full min-h-0">
        {/* Header with editable title */}
        <div className="border-b border-gray-200 p-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            {isEditingTitle ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="flex-1 px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleTitleEdit();
                    if (e.key === 'Escape') handleCancelTitleEdit();
                  }}
                  autoFocus
                />
                <button
                  onClick={handleTitleEdit}
                  className="p-1 text-green-600 hover:text-green-700"
                >
                  <Check size={16} />
                </button>
                <button
                  onClick={handleCancelTitleEdit}
                  className="p-1 text-red-600 hover:text-red-700"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-1">
                <h2 className="text-lg font-semibold text-gray-800">{conversation.title}</h2>
                <button
                  onClick={() => setIsEditingTitle(true)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <Edit2 size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {visibleMessages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            visibleMessages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                onMouseEnter={() => msg.sender === 'user' ? setHoveredMessageIndex(index) : null}
                onMouseLeave={() => setHoveredMessageIndex(null)}
              >
                <div className="relative group">
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      msg.sender === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {(() => {
                      // Special handling for AI thinking indicator
                      if (msg.sender === 'ai' && msg.content === '...') {
                        return (
                          <div className="flex items-center space-x-1">
                            <div className="text-gray-600">AI is thinking</div>
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                          </div>
                        );
                      }
                      
                      // Render based on configuration
                      return msg.sender === 'ai' && configuration.renderMarkdown ? (
                        <div className="prose prose-sm prose-gray max-w-none">
                          <ReactMarkdown
                            components={{
                              // Custom components to maintain consistent styling
                              p: ({ children }: { children?: React.ReactNode }) => <p className="mb-2 last:mb-0">{children}</p>,
                              code: ({ children }: { children?: React.ReactNode }) => <code className="bg-gray-800 text-gray-100 px-1 py-0.5 rounded text-xs">{children}</code>,
                              pre: ({ children }: { children?: React.ReactNode }) => <pre className="bg-gray-800 text-gray-100 p-3 rounded-lg overflow-x-auto text-sm my-2">{children}</pre>,
                              h1: ({ children }: { children?: React.ReactNode }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                              h2: ({ children }: { children?: React.ReactNode }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
                              h3: ({ children }: { children?: React.ReactNode }) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
                              ul: ({ children }: { children?: React.ReactNode }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                              ol: ({ children }: { children?: React.ReactNode }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                              li: ({ children }: { children?: React.ReactNode }) => <li className="mb-1">{children}</li>,
                              blockquote: ({ children }: { children?: React.ReactNode }) => <blockquote className="border-l-4 border-gray-300 pl-3 italic my-2">{children}</blockquote>,
                              strong: ({ children }: { children?: React.ReactNode }) => <strong className="font-bold">{children}</strong>,
                              em: ({ children }: { children?: React.ReactNode }) => <em className="italic">{children}</em>,
                            } as Partial<Components>}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      );
                    })()}
                    <p
                      className={`text-xs mt-1 ${
                        msg.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}
                    >
                      {formatMessageTime(msg.timestamp)}
                    </p>
                  </div>
                  
                  {/* Edit button for user messages */}
                  {msg.sender === 'user' && hoveredMessageIndex === index && (
                    <button
                      onClick={() => handleEditMessage(index, msg.content)}
                      className="absolute -right-2 -top-2 p-1.5 bg-white border border-gray-300 rounded-full shadow-sm hover:bg-gray-50 hover:border-gray-400 transition-colors"
                      title="Edit message"
                      disabled={loading || aiThinking || editingMessage}
                    >
                      <Edit size={14} className="text-gray-600" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="border-t border-gray-200 flex-shrink-0 bg-white">
          {/* Resizable Handle */}
          <div 
            className={`h-2 bg-gray-400 cursor-ns-resize hover:bg-gray-500 transition-colors ${isResizing ? 'bg-gray-500' : ''}`}
            onMouseDown={handleMouseDown}
            title="Drag to resize input area"
          />
          
          <div className="p-4">
            <div className="flex gap-2">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={aiThinking ? "AI is responding..." : editingMessage ? "Updating message..." : "Type your message..."}
                className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                rows={2}
                style={{
                  height: `${textareaHeight}px`,
                  minHeight: '40px',
                  maxHeight: '200px'
                }}
                disabled={loading || aiThinking || editingMessage}
              />
              <button
                onClick={handleSendMessage}
                disabled={!message.trim() || loading || aiThinking || editingMessage}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2 flex-shrink-0"
              >
                <Send size={16} />
                {aiThinking ? 'AI thinking...' : editingMessage ? 'Updating...' : loading ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Message Modal */}
      <EditMessageModal
        isOpen={editModalOpen}
        message={editingMessageContent}
        onClose={handleCancelEdit}
        onSave={handleSaveEditedMessage}
        loading={editingMessage}
      />
    </>
  );
};

export default ChatView; 