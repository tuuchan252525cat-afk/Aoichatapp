import React, { useState, useEffect, useMemo } from 'react';
import { User, ChatMessage, MessageReply } from './types';
import { CURRENT_USER, INITIAL_USERS } from './lib/sampleData';
import { 
  getChatId, 
  subscribeToUsers,
  subscribeToMessages, 
  sendChatMessage, 
  toggleMessageReaction, 
  deleteChatMessage,
  resetTokudomeChat,
  clearAllUsersAndChats,
  createFirestoreUser,
  updateFirestoreUser,
  deleteFirestoreUser
} from './lib/chatService';
import { UserList } from './components/UserList';
import { ChatArea } from './components/ChatArea';
import { EditPage } from './components/EditPage';
import { GithubDeployModal } from './components/GithubDeployModal';

const USERS_STORAGE_KEY = 'chat_app_custom_users_v4';
const CURRENT_USER_STORAGE_KEY = 'chat_app_current_user_v4';

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

  // Hash-based routing (#edit or standard chat)
  const [currentHash, setCurrentHash] = useState<string>(() => {
    return window.location.hash || '';
  });

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash || '');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const navigateToEdit = () => {
    window.location.hash = '#edit';
  };

  const navigateToChat = () => {
    window.location.hash = '';
    if (window.location.href.includes('#')) {
      history.pushState('', document.title, window.location.pathname + window.location.search);
      setCurrentHash('');
    }
  };

  // Real-time synchronization of users from Firestore across all devices and sessions
  useEffect(() => {
    const unsubscribe = subscribeToUsers((liveUsers) => {
      if (liveUsers && liveUsers.length > 0) {
        setUsers(liveUsers);

        // Sync currentUser if it was updated in Firestore
        setCurrentUser((prevCurrent) => {
          const matched = liveUsers.find((u) => u.id === prevCurrent.id);
          if (matched) {
            return matched;
          }
          // If previous user doesn't exist anymore, fallback to first user in list
          return liveUsers[0];
        });

        // Sync active partner if it was updated in Firestore
        setActivePartner((prevPartner) => {
          if (!prevPartner) {
            const defaultPartner = liveUsers.find((u) => u.id !== currentUser.id);
            return defaultPartner || null;
          }
          const matched = liveUsers.find((u) => u.id === prevPartner.id);
          if (matched) {
            return matched;
          }
          const nextPartner = liveUsers.find((u) => u.id !== currentUser.id);
          return nextPartner || null;
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [currentUser.id]);

  // Sync users to localStorage as local cache
  useEffect(() => {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }, [users]);

  // Sync currentUser to localStorage as local cache
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
      text: text || '',
      timestamp: Date.now(),
      reactions: {},
      ...(imageUrl ? { imageUrl } : {}),
      ...(replyTo ? { replyTo } : {})
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

  // Clear all users request
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

    if (!activePartner) {
      setActivePartner(newUser);
    }
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

  // Delete an existing user
  const handleDeleteUser = async (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));

    if (activePartner && activePartner.id === userId) {
      const nextPartner = users.find((u) => u.id !== userId && u.id !== currentUser.id) || null;
      setActivePartner(nextPartner);
    }

    try {
      await deleteFirestoreUser(userId);
    } catch (err) {
      console.error('Failed to delete user in Firestore:', err);
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

  // If URL hash is #edit, render the comprehensive Edit & User Management Page
  if (currentHash === '#edit' || currentHash.startsWith('#edit')) {
    return (
      <div className="min-h-screen bg-gray-50">
        <EditPage
          users={users}
          currentUser={currentUser}
          onAddUser={handleAddUser}
          onUpdateUser={handleUpdateUser}
          onDeleteUser={handleDeleteUser}
          onSwitchCurrentUser={handleSwitchCurrentUser}
          onResetData={handleResetData}
          onClearAllUsers={handleClearAllUsers}
          onOpenDeployModal={() => setIsDeployModalOpen(true)}
          onBackToChat={navigateToChat}
        />

        {/* GitHub Pages Deployment Guide Modal */}
        <GithubDeployModal
          isOpen={isDeployModalOpen}
          onClose={() => setIsDeployModalOpen(false)}
        />
      </div>
    );
  }

  // Standard Chat View
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
            onNavigateToEdit={navigateToEdit}
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
                左側のユーザー一覧から会話相手を選択するか、管理画面から新しいユーザーを追加してください。
              </p>
              <button
                id="empty-chat-go-edit-btn"
                onClick={navigateToEdit}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                新規ユーザーを追加・管理 (#edit)
              </button>
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
