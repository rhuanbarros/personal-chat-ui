// Message types
export interface Message {
  _id?: string;
  sender: 'user' | 'ai';
  content: string;
  timestamp: Date;
  role?: 'system' | 'user' | 'assistant'; // Optional role field for system prompts
}

// AI Message format for backend communication
export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
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

// AI Service Configuration
export interface AIServiceConfig {
  responseDelay?: number;
  provider?: 'openai' | 'google';
  model?: string;
  temperature?: number;
  topP?: number;
  maxOutputTokens?: number;
  backendUrl?: string;
}

// Chat Service Request
export interface ChatRequest {
  messages: Message[];
  config?: Partial<AIServiceConfig>;
  maxContextMessages?: number;
}

// Chat Service Response
export interface ChatResponse {
  content: string;
  tokensUsed?: number;
  model?: string;
  provider?: string;
}

// Agent Configuration types (placeholder for future implementation)
export interface AgentConfiguration {
  agentId: string;
  agentName: string;
  endpoint: string;
  parameters: Record<string, any>;
}

// Tab Configuration types
export type ConfigurationTabType = 'simple-models' | 'agents';

export interface TabConfiguration {
  activeTab: ConfigurationTabType;
  modelConfig: ModelConfiguration;
  agentConfig?: AgentConfiguration;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Service Result types for better error handling
export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// View types for the main content area
export type ViewType = 'chat' | 'saved-prompts' | 'configuration'; 