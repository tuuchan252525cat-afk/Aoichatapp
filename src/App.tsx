import React, { useState, useEffect, useMemo } from 'react';
import { User, ChatMessage, MessageReply } from './types';
import { CURRENT_USER, INITIAL_USERS } from './lib/sampleData';
import { 
  getChatId, 
  subscribeToMessages, 
  sendChatMessage, 
  toggleMessageReaction, 
  deleteChatMessage,
  resetTokudomeChat,
  clearAllUsersAndChats,
  createFirestoreUser,
  updateFirestoreUser
} from './lib/chatService';
import { UserList } from './components/UserList';
import { ChatArea } from './components/ChatArea';
import { GithubDeployModal } from './components/GithubDeployModal';

const USERS_STORAGE_KEY = 'chat_app_custom_users_v2';
const CURRENT_USER_STORAGE_KEY = 'chat_app_current_user_v2';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User>(() => {
    try {
      const saved = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
      return saved ? JSON.parse(saved) : CURRENT_USER;
    } catch {
      return CURRENT_USER;
    }
  });

  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(USERS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [CURRENT_USER, ...INITIAL_USERS];
    } catch {
      return [CURRENT_USER, ...INITIAL_USERS];
    }
  });

  const [activePartner, setActivePartner] = useState<User | null>(() => {
    const saved = users.find(u => u.id !== currentUser.id);
    return saved || null;
  });

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState<boolean>(false);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState<boolean>(false);

  // Sync users to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }, [users]);

  // Sync currentUser to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(currentUser));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }, [currentUser]);

  // Active chat ID based on current user & active partner
  const currentChatId = useMemo(() => {
    if (!activePartner) return '';
    return getChatId(currentUser.id, activePartner.id);
  }, [currentUser.id, activePartner]);

  // Subscribe to real-time messages for the active conversation
  useEffect(() => {
    if (!currentChatId || !activePartner) {
      setMessages([]);
      return;
    }

    const unsubscribe = subscribeToMessages(currentChatId, (liveMsgs) => {
      setMessages(liveMsgs || []);
    });

    return () => {
      unsubscribe();
    };
  }, [currentChatId, activePartner]);

  // Handle Send Message
  const handleSendMessage = async (text: string, replyTo?: MessageReply, imageUrl?: string) => {
    if (!activePartner || !currentChatId) return;

    const newMsgData: Omit<ChatMessage, 'id' | 'chatId'> = {
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatarUrl,
      text,
      imageUrl,
      timestamp: Date.now(),
      replyTo,
      reactions: {}
    };

    // Optimistic local update
    const tempId = `temp_${Date.now()}`;
    const optimisticMsg: ChatMessage = {
      ...newMsgData,
      id: tempId,
      chatId: currentChatId
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      await sendChatMessage(currentChatId, newMsgData);
    } catch (err) {
      console.error('Failed to sync to Firestore, message stored locally:', err);
    }
  };

  // Handle Emoji Reaction Toggle
  const handleToggleReaction = async (
    messageId: string, 
    emoji: string, 
    currentReactions?: Record<string, string[]>
  ) => {
    if (!currentChatId) return;

    // Optimistic reaction update
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== messageId) return msg;
        const reactions = { ...(msg.reactions || {}) };
        const userList = reactions[emoji] ? [...reactions[emoji]] : [];
        const index = userList.indexOf(currentUser.id);

        if (index > -1) {
          userList.splice(index, 1);
          if (userList.length === 0) {
            delete reactions[emoji];
          } else {
            reactions[emoji] = userList;
          }
        } else {
          userList.push(currentUser.id);
          reactions[emoji] = userList;
        }

        return { ...msg, reactions };
      })
    );

    try {
      await toggleMessageReaction(currentChatId, messageId, emoji, currentUser.id, currentReactions);
    } catch (err) {
      console.warn('Reaction Firestore sync notice:', err);
    }
  };

  // Handle Delete Message
  const handleDeleteMessage = async (messageId: string) => {
    if (!currentChatId) return;
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    try {
      await deleteChatMessage(currentChatId, messageId);
    } catch (err) {
      console.warn('Delete Firestore sync notice:', err);
    }
  };

  // Clear all users request from user
  const handleClearAllUsers = async () => {
    try {
      await clearAllUsersAndChats();
    } catch (err) {
      console.error('Failed to clear from Firestore:', err);
    }
    setUsers([currentUser]);
    setActivePartner(null);
    setMessages([]);
    setIsMobileChatOpen(false);
  };

  // Add a new user
  const handleAddUser = async (newUser: User) => {
    setUsers((prev) => {
      const exists = prev.some((u) => u.id === newUser.id);
      if (exists) return prev;
      return [...prev, newUser];
    });

    try {
      await createFirestoreUser(newUser);
    } catch (err) {
      console.error('Failed to save new user to Firestore:', err);
    }

    setActivePartner(newUser);
  };

  // Update existing user or currentUser
  const handleUpdateUser = async (updatedUser: User) => {
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));

    if (currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }

    if (activePartner && activePartner.id === updatedUser.id) {
      setActivePartner(updatedUser);
    }

    try {
      await updateFirestoreUser(updatedUser);
    } catch (err) {
      console.error('Failed to update user in Firestore:', err);
    }
  };

  // Reset sample data
  const handleResetData = async () => {
    try {
      await resetTokudomeChat();
    } catch (err) {
      console.error('Reset error:', err);
    }
    setUsers([CURRENT_USER, ...INITIAL_USERS]);
    setCurrentUser(CURRENT_USER);
    setActivePartner(INITIAL_USERS[0]);
  };

  // Switch current POV user (e.g. Test from other user side)
  const handleSwitchCurrentUser = (newUser: User) => {
    setCurrentUser(newUser);
    if (activePartner && activePartner.id === newUser.id) {
      const nextPartner = users.find((u) => u.id !== newUser.id) || null;
      setActivePartner(nextPartner);
    }
  };

  // Build conversations summary for sidebar
  const conversationsSummary = useMemo(() => {
    const summary: Record<string, { lastText: string; time: string; senderId: string; isLiked?: boolean }> = {};

    if (messages.length > 0 && activePartner) {
      const last = messages[messages.length - 1];
      summary[activePartner.id] = {
        lastText: last.text || (last.imageUrl ? '写真を送信しました。' : '添付ファイル'),
        time: '今',
        senderId: last.senderId,
        isLiked: Boolean(last.reactions && Object.keys(last.reactions).length > 0)
      };
    }

    return summary;
  }, [messages, activePartner]);

  return (
    <div 
      id="app-container"
      className="flex h-screen w-screen bg-gray-100 font-sans text-gray-900 overflow-hidden"
    >
      {/* 2-Column Responsive Layout */}
      <div className="flex w-full h-full max-w-7xl mx-auto shadow-2xl overflow-hidden bg-white md:border-x md:border-gray-200">
        {/* Left: User List (Sidebar) */}
        <div className={`w-full md:w-80 lg:w-96 shrink-0 h-full ${isMobileChatOpen ? 'hidden md:flex' : 'flex'}`}>
          <UserList
            users={users}
            currentUser={currentUser}
            activePartnerId={activePartner?.id || ''}
            onSelectUser={(partner) => {
              setActivePartner(partner);
              setIsMobileChatOpen(true);
            }}
            onSwitchCurrentUser={handleSwitchCurrentUser}
            onUpdateUser={handleUpdateUser}
            onResetData={handleResetData}
            onClearAllUsers={handleClearAllUsers}
            onAddUser={handleAddUser}
            onOpenDeployModal={() => setIsDeployModalOpen(true)}
            conversationsSummary={conversationsSummary}
          />
        </div>

        {/* Right: Active Chat Area */}
        <div className={`flex-1 h-full ${!isMobileChatOpen ? 'hidden md:flex' : 'flex'}`}>
          {activePartner ? (
            <ChatArea
              partner={activePartner}
              currentUser={currentUser}
              messages={messages}
              onSendMessage={handleSendMessage}
              onToggleReaction={handleToggleReaction}
              onDeleteMessage={handleDeleteMessage}
              onBackMobile={() => setIsMobileChatOpen(false)}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-[#fafafa]">
              <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-4 text-2xl">
                💬
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">メッセージをはじめよう</h2>
              <p className="text-sm text-gray-500 max-w-xs mb-4">
                左側のユーザー一覧から会話相手を選択するか、上部の「+」ボタンから新しいユーザーを追加してください。
              </p>
            </div>
          )}
        </div>
      </div>

      {/* GitHub Pages Deployment Guide Modal */}
      <GithubDeployModal
        isOpen={isDeployModalOpen}
        onClose={() => setIsDeployModalOpen(false)}
      />
    </div>
  );
}
