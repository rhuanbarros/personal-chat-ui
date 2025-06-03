# AI Service Architecture

This directory contains the AI service layer with proper separation of concerns. The architecture follows a layered approach where each component has a specific responsibility.

## Architecture Overview

```
┌─────────────────────────────────────────┐
│              Application Layer          │
│         (Next.js API Routes)           │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│              Service Layer              │
│           (ChatService)                 │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│             Provider Layer              │
│        (AIProvider Interface)           │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│              Client Layer               │
│         (AIBackendClient)               │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│              Transport Layer            │
│            (HttpClient)                 │
└─────────────────────────────────────────┘
```

## Components

### 1. HttpClient (`../http/httpClient.ts`)
**Responsibility**: Low-level HTTP transport
- Handles raw HTTP requests/responses
- Manages timeouts, retries, and connection errors
- Provides generic HTTP methods (GET, POST, PUT, DELETE)
- Error handling and logging at transport level

### 2. AIBackendClient (`aiBackendClient.ts`)
**Responsibility**: AI-specific HTTP client
- Wraps HttpClient for AI backend interactions
- Handles AI-specific request/response transformation
- Manages AI endpoint routing (`/invoke_basic_model`, `/health`)
- AI-specific error handling and validation

### 3. AIProvider (`aiProvider.ts`)
**Responsibility**: Provider abstraction
- Defines common interface for AI providers
- Factory pattern for creating different providers
- Extensible for future AI providers (OpenAI direct, Anthropic, etc.)
- Provider-specific configuration management

### 4. ChatService (`../../services/chatService.ts`)
**Responsibility**: High-level chat orchestration
- Message validation and context preparation
- Business logic for chat interactions
- Configuration management and defaults
- Integration with message mapping and logging

## Usage Example

```typescript
import { chatService } from '@/services/chatService';

// Simple usage
const result = await chatService.generateResponse({
  messages: [
    { _id: '1', content: 'Hello', sender: 'user', timestamp: new Date() }
  ]
});

// With configuration
const result = await chatService.generateResponse({
  messages: [...],
  config: {
    model: 'gpt-4',
    temperature: 0.8
  }
});
```

## Benefits of This Architecture

1. **Separation of Concerns**: Each layer has a single responsibility
2. **Testability**: Each component can be tested in isolation
3. **Extensibility**: Easy to add new AI providers or transport methods
4. **Maintainability**: Clear boundaries between components
5. **Configuration**: Centralized configuration management
6. **Error Handling**: Proper error propagation through layers

## Adding New AI Providers

To add a new AI provider:

1. Implement the `AIProvider` interface
2. Add the provider to `AIProviderFactory`
3. Update the configuration types if needed

Example:
```typescript
export class OpenAIDirectProvider implements AIProvider {
  // Implementation...
}

// In factory:
case 'openai-direct':
  return new OpenAIDirectProvider(config);
```

## Environment Variables

- `AI_BACKEND`: Base URL for the Python backend (default: `http://localhost:8000`)

## Migration Notes

The old `AIService` has been deprecated and removed. All functionality has been migrated to the new layered architecture with improved error handling and extensibility. 