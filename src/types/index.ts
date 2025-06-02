// Message types
export interface Message {
  _id?: string;
  sender: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

// Conversation types
export interface Conversation {
  _id?: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

// Model Configuration types
export interface ModelConfiguration {
  provider: string;
  modelName: string;
  temperature: number;
  topP: number;
  renderMarkdown: boolean;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// View types for the main content area
export type ViewType = 'chat' | 'saved-prompts' | 'configuration'; 