// Message types
export interface Message {
  _id?: string;
  sender: 'user' | 'ai';
  content: string;
  timestamp: Date;
  role?: 'system' | 'user' | 'assistant'; // Optional role field for system prompts
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

// View types for the main content area
export type ViewType = 'chat' | 'saved-prompts' | 'configuration'; 