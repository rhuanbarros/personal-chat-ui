import { ISavedPrompt, IPromptVersion } from '@/models/SavedPrompt';

export interface SavedPromptSummary {
  _id: string;
  name: string;
  latestVersion: IPromptVersion | null;
  versionsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedSavedPrompts {
  savedPrompts: SavedPromptSummary[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasMore: boolean;
    limit: number;
  };
}

export interface CreateSavedPromptRequest {
  name: string;
  text: string;
}

export interface UpdateSavedPromptRequest {
  name?: string;
  text?: string;
  addVersion?: boolean;
}

class SavedPromptService {
  private baseUrl = '/api/saved-prompts';

  async getAllSavedPrompts(page: number = 1, limit: number = 20): Promise<PaginatedSavedPrompts> {
    const response = await fetch(`${this.baseUrl}?page=${page}&limit=${limit}`);
    if (!response.ok) {
      throw new Error('Failed to fetch saved prompts');
    }
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch saved prompts');
    }
    return data.data;
  }

  async getSavedPromptById(id: string): Promise<ISavedPrompt> {
    const response = await fetch(`${this.baseUrl}/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch saved prompt');
    }
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch saved prompt');
    }
    return data.data;
  }

  async createSavedPrompt(prompt: CreateSavedPromptRequest): Promise<ISavedPrompt> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(prompt),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create saved prompt');
    }
    
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to create saved prompt');
    }
    return data.data;
  }

  async updateSavedPrompt(id: string, updates: UpdateSavedPromptRequest): Promise<ISavedPrompt> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update saved prompt');
    }
    
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to update saved prompt');
    }
    return data.data;
  }

  async deleteSavedPrompt(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete saved prompt');
    }
    
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to delete saved prompt');
    }
  }

  async addVersionToPrompt(id: string, text: string): Promise<ISavedPrompt> {
    return this.updateSavedPrompt(id, { text, addVersion: true });
  }
}

export default new SavedPromptService(); 