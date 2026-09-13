import React, { useState, useEffect, useMemo } from 'react';
import { User, ChatMessage, MessageReply } from './types';
import { CURRENT_USER, INITIAL_USERS, TOKUDOME_INITIAL_MESSAGES, OTHER_USERS_SEEDS } from './lib/sampleData';
import { 
  getChatId, 
  seedInitialDataIfNeeded, 
  subscribeToMessages, 
  sendChatMessage, 
  toggleMessageReaction, 
  deleteChatMessage,
  resetTokudomeChat 
} from './lib/chatService';
import { UserList } from './components/UserList';
import { ChatArea } from './components/ChatArea';
import { GithubDeployModal } from './components/GithubDeployModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User>(CURRENT_USER);
  const [users, setUsers] = useState<User[]>([CURRENT_USER, ...INITIAL_USERS]);
  const [activePartner, setActivePartner] = useState<User>(INITIAL_USERS[0]); // Tokudome Hiroki
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState<boolean>(false);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState<boolean>(false);

  // Active chat ID based on current user & active partner
  const currentChatId = useMemo(() => {
    return getChatId(currentUser.id, activePartner.id);
  }, [currentUser.id, activePartner.id]);

  // Seed and initial setup
  useEffect(() => {
    seedInitialDataIfNeeded();
  }, []);

  // Subscribe to real-time messages for the active conversation
  useEffect(() => {
    // Initial fallback messages while Firestore loads
    if (activePartner.id === 'tokudome' && currentUser.id === 'user_me') {
      setMessages(TOKUDOME_INITIAL_MESSAGES.map((m) => ({ ...m, chatId: currentChatId })));
    } else if (OTHER_USERS_SEEDS[activePartner.id]) {
      setMessages(OTHER_USERS_SEEDS[activePartner.id].map((m) => ({ ...m, chatId: currentChatId })));
    } else {
      setMessages([]);
    }

    const unsubscribe = subscribeToMessages(currentChatId, (liveMsgs) => {
      if (liveMsgs && liveMsgs.length > 0) {
        setMessages(liveMsgs);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [currentChatId, activePartner.id, currentUser.id]);

  // Handle Send Message
  const handleSendMessage = async (text: string, replyTo?: MessageReply, imageUrl?: string) => {
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
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    try {
      await deleteChatMessage(currentChatId, messageId);
    } catch (err) {
      console.warn('Delete Firestore sync notice:', err);
    }
  };

  // Reset sample data
  const handleResetData = async () => {
    try {
      await resetTokudomeChat();
      setMessages(TOKUDOME_INITIAL_MESSAGES.map((m) => ({ ...m, chatId: currentChatId })));
    } catch (err) {
      console.error('Reset error:', err);
      setMessages(TOKUDOME_INITIAL_MESSAGES.map((m) => ({ ...m, chatId: currentChatId })));
    }
  };

  // Switch current POV user (e.g. Test from Tokudome's side)
  const handleSwitchCurrentUser = (newUser: User) => {
    setCurrentUser(newUser);
    // If currently talking to self, change active partner to someone else
    if (activePartner.id === newUser.id) {
      const nextPartner = users.find((u) => u.id !== newUser.id) || CURRENT_USER;
      setActivePartner(nextPartner);
    }
  };

  // Build conversations summary for sidebar
  const conversationsSummary = useMemo(() => {
    const summary: Record<string, { lastText: string; time: string; senderId: string; isLiked?: boolean }> = {
      tokudome: {
        lastText: messages.length > 0 ? messages[messages.length - 1].text : 'よろしく',
        time: '1時間',
        senderId: messages.length > 0 ? messages[messages.length - 1].senderId : 'tokudome',
        isLiked: true
      },
      rikito: {
        lastText: 'てかスマホ返却されたん？',
        time: '2時間',
        senderId: 'user_me'
      },
      km_film: {
        lastText: '添付ファイルを送信しました。',
        time: '16時間',
        senderId: 'km_film'
      },
      satomichi: {
        lastText: '担任をどう説得したのか気になって',
        time: '16時間',
        senderId: 'user_me'
      },
      hinata: {
        lastText: '頼んだ',
        time: '18時間',
        senderId: 'user_me'
      },
      mert: {
        lastText: 'Hey Yuto it was nice to meet you. I wish ...',
        time: '4日',
        senderId: 'mert'
      },
      ren: {
        lastText: 'ありがとうね',
        time: '5日',
        senderId: 'ren'
      },
      sueno: {
        lastText: 'ありがとう！！',
        time: '5日',
        senderId: 'sueno'
      },
      naoki: {
        lastText: '写真を送信しました。',
        time: '5日',
        senderId: 'naoki'
      }
    };

    // If active conversation has live messages, update its preview
    if (messages.length > 0 && activePartner) {
      const last = messages[messages.length - 1];
      summary[activePartner.id] = {
        lastText: last.text || (last.imageUrl ? '写真を送信しました。' : '添付ファイル'),
        time: '今',
        senderId: last.senderId,
        isLiked: last.reactions && Object.keys(last.reactions).length > 0
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
            activePartnerId={activePartner.id}
            onSelectUser={(partner) => {
              setActivePartner(partner);
              setIsMobileChatOpen(true);
            }}
            onSwitchCurrentUser={handleSwitchCurrentUser}
            onResetData={handleResetData}
            onOpenDeployModal={() => setIsDeployModalOpen(true)}
            conversationsSummary={conversationsSummary}
          />
        </div>

        {/* Right: Active Chat Area */}
        <div className={`flex-1 h-full ${!isMobileChatOpen ? 'hidden md:flex' : 'flex'}`}>
          <ChatArea
            partner={activePartner}
            currentUser={currentUser}
            messages={messages}
            onSendMessage={handleSendMessage}
            onToggleReaction={handleToggleReaction}
            onDeleteMessage={handleDeleteMessage}
            onBackMobile={() => setIsMobileChatOpen(false)}
          />
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
