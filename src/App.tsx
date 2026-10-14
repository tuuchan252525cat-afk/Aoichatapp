import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, ChatMessage, MessageReply } from './types';
import { CURRENT_USER, INITIAL_USERS } from './lib/sampleData';
import { 
  getChatId, 
  subscribeToUsers,
  subscribeToMessages,
  subscribeToAllChats,
  sendChatMessage, 
  toggleMessageReaction, 
  deleteChatMessage,
  resetTokudomeChat,
  clearAllUsersAndChats,
  createFirestoreUser,
  updateFirestoreUser,
  deleteFirestoreUser
} from './lib/chatService';
import { 
  isNotificationSupported,
  getNotificationPermissionState,
  requestNotificationPermission,
  registerNotificationServiceWorker,
  triggerIncomingMessageNotification
} from './lib/notificationService';
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

  // Notification Permission State & Prompt
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() => 
    getNotificationPermissionState()
  );
  const [showNotificationBanner, setShowNotificationBanner] = useState<boolean>(() => {
    if (!isNotificationSupported()) return false;
    const dismissed = localStorage.getItem('dismissed_notification_prompt');
    return getNotificationPermissionState() === 'default' && !dismissed;
  });

  const [allChatsSummaries, setAllChatsSummaries] = useState<Record<string, { lastMessageText: string; lastMessageSenderId: string; lastMessageTime: number }>>({});
  const initialMountTimeRef = useRef<number>(Date.now());

  // Register Service Worker on mount & listen to notification click events
  useEffect(() => {
    registerNotificationServiceWorker();

    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      const handleSwMessage = (event: MessageEvent) => {
        if (event.data?.type === 'OPEN_CHAT_PARTNER' && event.data?.partnerId) {
          const partnerId = event.data.partnerId;
          const target = users.find((u) => u.id === partnerId);
          if (target) {
            setActivePartner(target);
            setIsMobileChatOpen(true);
            navigateToChat();
          }
        }
      };

      navigator.serviceWorker.addEventListener('message', handleSwMessage);
      return () => {
        navigator.serviceWorker.removeEventListener('message', handleSwMessage);
      };
    }
  }, [users]);

  // Request Notification permission
  const handleAllowNotification = async () => {
    const res = await requestNotificationPermission();
    setNotificationPermission(res);
    setShowNotificationBanner(false);
  };

  const handleDismissNotificationBanner = () => {
    setShowNotificationBanner(false);
    localStorage.setItem('dismissed_notification_prompt', 'true');
  };

  // Hash-based routing (#edit or standard chat)
  const [currentHash, setCurrentHash] = useState<string>(() => {
    return window.location.hash || '';
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash || '';
      setCurrentHash(hash);

      // Handle #partner=userId navigation (e.g. from notification click in new tab)
      if (hash.startsWith('#partner=')) {
        const pId = hash.replace('#partner=', '');
        const target = users.find((u) => u.id === pId);
        if (target) {
          setActivePartner(target);
          setIsMobileChatOpen(true);
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [users]);

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

  // Subscribe to all chats to update sidebar summaries & fire background notifications
  useEffect(() => {
    const unsubscribe = subscribeToAllChats((chats) => {
      setAllChatsSummaries(chats);

      // Check for incoming messages across all conversations
      for (const [chatId, info] of Object.entries(chats)) {
        if (info.lastMessageTime > initialMountTimeRef.current && info.lastMessageSenderId !== currentUser.id) {
          const partner = users.find((u) => u.id === info.lastMessageSenderId || getChatId(currentUser.id, u.id) === chatId);
          if (partner) {
            // Control Rule: If user is actively looking at this chat in foreground -> Suppress notification
            const isViewingThisChat = (activePartner?.id === partner.id) && isMobileChatOpen && !document.hidden && currentHash !== '#edit';
            triggerIncomingMessageNotification({
              senderId: partner.id,
              senderName: partner.name,
              senderAvatar: partner.avatarUrl,
              text: info.lastMessageText,
              partnerId: partner.id
            }, {
              isCurrentChatActive: isViewingThisChat,
              onNotificationClick: (pId) => {
                const target = users.find((u) => u.id === pId);
                if (target) {
                  setActivePartner(target);
                  setIsMobileChatOpen(true);
                  navigateToChat();
                }
              }
            });
          }
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [currentUser.id, users, activePartner, isMobileChatOpen, currentHash]);

  // Subscribe to real-time messages for the active conversation
  useEffect(() => {
    if (!currentChatId || !activePartner) {
      setMessages([]);
      return;
    }

    const unsubscribe = subscribeToMessages(currentChatId, (liveMsgs) => {
      setMessages(liveMsgs || []);

      // If document is in background (hidden) and a new message arrived from active partner
      if (liveMsgs && liveMsgs.length > 0) {
        const lastMsg = liveMsgs[liveMsgs.length - 1];
        if (
          lastMsg.timestamp > initialMountTimeRef.current && 
          lastMsg.senderId !== currentUser.id && 
          document.hidden
        ) {
          triggerIncomingMessageNotification({
            senderId: lastMsg.senderId,
            senderName: lastMsg.senderName,
            senderAvatar: lastMsg.senderAvatar,
            text: lastMsg.text,
            imageUrl: lastMsg.imageUrl,
            partnerId: activePartner.id
          }, {
            isCurrentChatActive: false, // Tab is hidden, show OS notification
            onNotificationClick: () => {
              window.focus();
            }
          });
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [currentChatId, activePartner, currentUser.id]);

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

    // Populate from all chats in Firestore
    for (const u of users) {
      if (u.id === currentUser.id) continue;
      const cId = getChatId(currentUser.id, u.id);
      const chatInfo = allChatsSummaries[cId];
      if (chatInfo && chatInfo.lastMessageText) {
        summary[u.id] = {
          lastText: chatInfo.lastMessageText,
          time: '今',
          senderId: chatInfo.lastMessageSenderId,
          isLiked: false
        };
      }
    }

    // Override active conversation with latest live messages
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
  }, [messages, activePartner, users, currentUser.id, allChatsSummaries]);

  // If URL hash is #edit, render the comprehensive Edit & User Management Page
  if (currentHash === '#edit' || currentHash.startsWith('#edit')) {
    return (
      <div className="min-h-screen h-[100dvh] overflow-y-auto bg-gray-50 flex flex-col">
        {/* Optional Notification Permission Prompt in Edit Page too */}
        {showNotificationBanner && notificationPermission === 'default' && (
          <div 
            id="notification-permission-banner-edit"
            className="bg-blue-600 text-white px-4 py-2 text-xs flex items-center justify-between shrink-0 shadow-sm"
          >
            <div className="flex items-center gap-2 truncate mr-2">
              <span className="text-sm">🔔</span>
              <span className="truncate">新着メッセージのプッシュ通知を受け取りますか？</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                id="edit-banner-allow-notification-btn"
                onClick={handleAllowNotification}
                className="bg-white text-blue-700 hover:bg-blue-50 font-bold px-3 py-1 rounded-lg text-xs transition cursor-pointer"
              >
                許可する
              </button>
              <button
                id="edit-banner-dismiss-notification-btn"
                onClick={handleDismissNotificationBanner}
                className="text-blue-100 hover:text-white px-2 py-1 cursor-pointer"
              >
                あとで
              </button>
            </div>
          </div>
        )}

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
      className="flex flex-col h-[100dvh] min-h-[100dvh] w-full bg-gray-100 font-sans text-gray-900 overflow-hidden relative"
    >
      {/* Non-intrusive Notification Permission Prompt Banner */}
      {showNotificationBanner && notificationPermission === 'default' && (
        <div 
          id="notification-permission-banner"
          className="bg-blue-600 text-white px-4 py-2 text-xs flex items-center justify-between shrink-0 shadow-md z-40 animate-in slide-in-from-top duration-200"
        >
          <div className="flex items-center gap-2 truncate mr-2">
            <span className="text-base shrink-0">🔔</span>
            <span className="truncate">新着メッセージのプッシュ通知を受け取りますか？（バックグラウンド受信対応）</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              id="banner-allow-notification-btn"
              onClick={handleAllowNotification}
              className="bg-white text-blue-700 hover:bg-blue-50 font-bold px-3 py-1 rounded-lg shadow-2xs transition cursor-pointer"
            >
              許可する
            </button>
            <button
              id="banner-dismiss-notification-btn"
              onClick={handleDismissNotificationBanner}
              className="text-blue-100 hover:text-white px-2 py-1 cursor-pointer"
            >
              あとで
            </button>
          </div>
        </div>
      )}

      {/* 2-Column Responsive Layout */}
      <div className="flex flex-1 w-full h-full max-w-7xl mx-auto shadow-2xl overflow-hidden bg-white md:border-x md:border-gray-200">
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
              users={users}
              onSendMessage={handleSendMessage}
              onToggleReaction={handleToggleReaction}
              onDeleteMessage={handleDeleteMessage}
              onBackMobile={() => setIsMobileChatOpen(false)}
              onSwitchCurrentUser={handleSwitchCurrentUser}
              onNavigateToEdit={navigateToEdit}
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
