export interface User {
  id: string;
  name: string;
  displayName: string;
  avatarUrl: string;
  status: 'online' | 'offline' | 'active_recently';
  statusText?: string;
  bio?: string;
  lastActive?: string;
}

export interface MessageReaction {
  emoji: string;
  count: number;
  userIds: string[];
}

export interface MessageReply {
  messageId: string;
  text: string;
  senderId: string;
  senderName: string;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  imageUrl?: string;
  fileName?: string;
  fileSize?: string;
  timestamp: number;
  reactions?: Record<string, string[]>; // emoji -> array of userIds
  replyTo?: MessageReply;
  isRead?: boolean;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  partner: User;
  lastMessageText: string;
  lastMessageSenderId: string;
  lastMessageTime: number;
  lastMessageFormattedTime: string;
  unreadCount: number;
  isLikedNotification?: boolean;
  hasAttachment?: boolean;
  attachmentType?: 'photo' | 'file';
}
