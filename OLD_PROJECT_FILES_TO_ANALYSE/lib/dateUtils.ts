import { Conversation } from '@/types';

export interface ConversationGroup {
  label: string;
  conversations: Conversation[];
}

export function groupConversationsByTime(conversations: Conversation[]): ConversationGroup[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thisMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  const groups: { [key: string]: Conversation[] } = {
    today: [],
    yesterday: [],
    thisWeek: [],
    thisMonth: [],
    older: []
  };

  conversations.forEach(conversation => {
    const conversationDate = new Date(conversation.updatedAt);
    
    if (conversationDate >= today) {
      groups.today.push(conversation);
    } else if (conversationDate >= yesterday) {
      groups.yesterday.push(conversation);
    } else if (conversationDate >= thisWeek) {
      groups.thisWeek.push(conversation);
    } else if (conversationDate >= thisMonth) {
      groups.thisMonth.push(conversation);
    } else {
      groups.older.push(conversation);
    }
  });

  const result: ConversationGroup[] = [];
  
  if (groups.today.length > 0) {
    result.push({ label: 'Today', conversations: groups.today });
  }
  if (groups.yesterday.length > 0) {
    result.push({ label: 'Yesterday', conversations: groups.yesterday });
  }
  if (groups.thisWeek.length > 0) {
    result.push({ label: 'This Week', conversations: groups.thisWeek });
  }
  if (groups.thisMonth.length > 0) {
    result.push({ label: 'This Month', conversations: groups.thisMonth });
  }
  if (groups.older.length > 0) {
    result.push({ label: 'Older', conversations: groups.older });
  }

  return result;
}

export function formatConversationDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

  if (date >= today) {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } else if (date >= yesterday) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }
} 