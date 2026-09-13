import { User, ChatMessage } from '../types';

export const CURRENT_USER: User = {
  id: 'user_me',
  name: 'あなた',
  displayName: 'Yuto',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  status: 'online',
  statusText: 'オンライン',
  bio: '学生 / プロジェクトメンバー'
};

export const INITIAL_USERS: User[] = [
  {
    id: 'tokudome',
    name: '徳留 拓東 / Tokudome Hiroki',
    displayName: '徳留 拓東',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    status: 'online',
    statusText: 'アクティブ中',
    lastActive: '1時間',
    bio: 'Film & Media Director'
  },
  {
    id: 'rikito',
    name: 'rikito',
    displayName: 'rikito',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    status: 'active_recently',
    statusText: '2時間前',
    lastActive: '2時間',
    bio: 'Photography & Design'
  },
  {
    id: 'km_film',
    name: 'K&M_AOI FILM Project',
    displayName: 'K&M_AOI FILM Project',
    avatarUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=150&auto=format&fit=crop&q=80',
    status: 'offline',
    statusText: '16時間前',
    lastActive: '16時間',
    bio: 'Official Production Team'
  },
  {
    id: 'satomichi',
    name: 'さとみち',
    displayName: 'さとみち',
    avatarUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=150&auto=format&fit=crop&q=80',
    status: 'offline',
    statusText: '16時間前',
    lastActive: '16時間',
    bio: 'Cat lover & Tech lead'
  },
  {
    id: 'hinata',
    name: 'ひなた',
    displayName: 'ひなた',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    status: 'offline',
    statusText: '18時間前',
    lastActive: '18時間',
    bio: '王者決定戦 参加中'
  },
  {
    id: 'mert',
    name: 'Mert Şat',
    displayName: 'Mert Şat',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    status: 'offline',
    statusText: '4日前',
    lastActive: '4日',
    bio: 'Exchange student from Istanbul'
  },
  {
    id: 'ren',
    name: 'ren/れん',
    displayName: 'ren',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    status: 'offline',
    statusText: '5日前',
    lastActive: '5日',
    bio: 'Coffee & Chill'
  },
  {
    id: 'sueno',
    name: '末野 友絆',
    displayName: '末野 友絆',
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    status: 'offline',
    statusText: '5日前',
    lastActive: '5日',
    bio: 'Team member'
  },
  {
    id: 'naoki',
    name: 'なおき',
    displayName: 'なおき',
    avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
    status: 'offline',
    statusText: '5日前',
    lastActive: '5日',
    bio: 'Goggles Anime Creator'
  }
];

// Seed messages for Tokudome Hiroki (Screenshot 2 exact replica)
export const TOKUDOME_INITIAL_MESSAGES: Omit<ChatMessage, 'chatId'>[] = [
  {
    id: 'msg_1',
    senderId: 'tokudome',
    senderName: '徳留 拓東 / Tokudome Hiroki',
    senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    text: '自己紹介して企画説明して演技でいいかな？',
    timestamp: Date.now() - 3600000 * 2,
    reactions: {}
  },
  {
    id: 'msg_2',
    senderId: 'user_me',
    senderName: 'あなた',
    senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    text: 'そうだね',
    timestamp: Date.now() - 3600000 * 1.9,
    reactions: {}
  },
  {
    id: 'msg_3',
    senderId: 'user_me',
    senderName: 'あなた',
    senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    text: '企画説明の前に志望理由も聞かなくちゃ',
    timestamp: Date.now() - 3600000 * 1.8,
    reactions: {}
  },
  {
    id: 'msg_4',
    senderId: 'tokudome',
    senderName: '徳留 拓東 / Tokudome Hiroki',
    senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    text: 'OK',
    timestamp: Date.now() - 3600000 * 1.6,
    reactions: {}
  },
  {
    id: 'msg_5',
    senderId: 'tokudome',
    senderName: '徳留 拓東 / Tokudome Hiroki',
    senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    text: 'メモはお互い取っとこう',
    timestamp: Date.now() - 3600000 * 1.5,
    reactions: {}
  },
  {
    id: 'msg_6',
    senderId: 'tokudome',
    senderName: '徳留 拓東 / Tokudome Hiroki',
    senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    text: '最悪録画あるから',
    timestamp: Date.now() - 3600000 * 1.4,
    reactions: {}
  },
  {
    id: 'msg_7',
    senderId: 'user_me',
    senderName: 'あなた',
    senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    text: '多分僕の方が話す時間短いから頑張って取っておくね',
    timestamp: Date.now() - 3600000 * 1.2,
    reactions: {}
  },
  {
    id: 'msg_8',
    senderId: 'user_me',
    senderName: 'あなた',
    senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    text: '多分僕の方が話す時間短いから頑張って取っておくね',
    timestamp: Date.now() - 3600000 * 1.1,
    replyTo: {
      messageId: 'msg_7',
      text: '多分僕の方が話す時間短いから頑張って取っておくね',
      senderId: 'user_me',
      senderName: 'あなた'
    },
    reactions: {}
  },
  {
    id: 'msg_9',
    senderId: 'user_me',
    senderName: 'あなた',
    senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    text: 'Canvaの下の方のページに書いておくね',
    timestamp: Date.now() - 3600000 * 1.0,
    reactions: {}
  },
  {
    id: 'msg_10',
    senderId: 'tokudome',
    senderName: '徳留 拓東 / Tokudome Hiroki',
    senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    text: '自己紹介は最初に僕がして、「で、もうひとりが、」みたいに言ったら自己紹介してもらえば！',
    timestamp: Date.now() - 3600000 * 0.7,
    replyTo: {
      messageId: 'msg_9',
      text: 'Canvaの下の方のページに書いておくね',
      senderId: 'user_me',
      senderName: 'あなた'
    },
    reactions: {}
  },
  {
    id: 'msg_11',
    senderId: 'user_me',
    senderName: 'あなた',
    senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    text: 'OK！',
    timestamp: Date.now() - 3600000 * 0.4,
    reactions: {}
  },
  {
    id: 'msg_12',
    senderId: 'user_me',
    senderName: 'あなた',
    senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    text: 'Zoom入ります',
    timestamp: Date.now() - 3600000 * 0.3,
    reactions: {
      '❤️': ['tokudome']
    }
  },
  {
    id: 'msg_13',
    senderId: 'tokudome',
    senderName: '徳留 拓東 / Tokudome Hiroki',
    senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    text: 'よろしく',
    timestamp: Date.now() - 3600000 * 0.1,
    reactions: {}
  }
];

export const OTHER_USERS_SEEDS: Record<string, Omit<ChatMessage, 'chatId'>[]> = {
  rikito: [
    {
      id: 'rikito_1',
      senderId: 'user_me',
      senderName: 'あなた',
      senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      text: 'てかスマホ返却されたん？',
      timestamp: Date.now() - 3600000 * 2,
      reactions: {}
    }
  ],
  km_film: [
    {
      id: 'km_1',
      senderId: 'km_film',
      senderName: 'K&M_AOI FILM Project',
      senderAvatar: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=150&auto=format&fit=crop&q=80',
      text: '添付ファイルを送信しました。',
      fileName: 'final_storyboard_v2.pdf',
      fileSize: '4.2 MB',
      timestamp: Date.now() - 3600000 * 16,
      reactions: {}
    }
  ],
  satomichi: [
    {
      id: 'satomichi_1',
      senderId: 'user_me',
      senderName: 'あなた',
      senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      text: '担任をどう説得したのか気になって',
      timestamp: Date.now() - 3600000 * 16,
      reactions: {}
    }
  ],
  hinata: [
    {
      id: 'hinata_1',
      senderId: 'user_me',
      senderName: 'あなた',
      senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      text: '頼んだ',
      timestamp: Date.now() - 3600000 * 18,
      reactions: {}
    }
  ],
  mert: [
    {
      id: 'mert_1',
      senderId: 'mert',
      senderName: 'Mert Şat',
      senderAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      text: 'Hey Yuto it was nice to meet you. I wish we could have talked longer about the exchange program!',
      timestamp: Date.now() - 3600000 * 24 * 4,
      reactions: {}
    }
  ],
  ren: [
    {
      id: 'ren_1',
      senderId: 'ren',
      senderName: 'ren/れん',
      senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      text: 'ありがとうね',
      timestamp: Date.now() - 3600000 * 24 * 5,
      reactions: {}
    }
  ],
  sueno: [
    {
      id: 'sueno_1',
      senderId: 'sueno',
      senderName: '末野 友絆',
      senderAvatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
      text: 'ありがとう！！',
      timestamp: Date.now() - 3600000 * 24 * 5,
      reactions: {}
    }
  ],
  naoki: [
    {
      id: 'naoki_1',
      senderId: 'naoki',
      senderName: 'なおき',
      senderAvatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
      text: '写真を送信しました。',
      imageUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&auto=format&fit=crop&q=80',
      timestamp: Date.now() - 3600000 * 24 * 5,
      reactions: {}
    }
  ]
};
