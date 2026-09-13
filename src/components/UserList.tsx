import React, { useState } from 'react';
import { User } from '../types';
import { 
  Search, 
  Settings,
  MoreHorizontal,
  Check,
  Edit
} from 'lucide-react';

interface UserListProps {
  users: User[];
  currentUser: User;
  activePartnerId: string;
  onSelectUser: (user: User) => void;
  onSwitchCurrentUser: (user: User) => void;
  onNavigateToEdit: () => void;
  conversationsSummary: Record<string, { lastText: string; time: string; senderId: string; isLiked?: boolean }>;
}

export const UserList: React.FC<UserListProps> = ({
  users,
  currentUser,
  activePartnerId,
  onSelectUser,
  onSwitchCurrentUser,
  onNavigateToEdit,
  conversationsSummary
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserSwitcher, setShowUserSwitcher] = useState(false);

  const otherUsers = users.filter((u) => u.id !== currentUser.id);

  const filteredUsers = otherUsers.filter((u) => {
    const nameMatch = u.name.toLowerCase().includes(searchQuery.toLowerCase());
    const displayMatch = (u.displayName || '').toLowerCase().includes(searchQuery.toLowerCase());
    return nameMatch || displayMatch;
  });

  return (
    <aside 
      id="user-sidebar" 
      aria-label="ユーザー一覧サイドバー"
      className="w-full md:w-80 lg:w-96 bg-white border-r border-gray-200 flex flex-col h-full select-none"
    >
      {/* Top Header matching Screenshot 1 */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          {/* User Profile Switcher Trigger */}
          <div className="relative">
            <button
              id="user-profile-menu-button"
              onClick={() => setShowUserSwitcher(!showUserSwitcher)}
              className="flex items-center gap-2 hover:bg-gray-100 px-2 py-1 -ml-2 rounded-xl transition cursor-pointer"
            >
              <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-1.5">
                メッセージ
                {users.length > 1 && (
                  <svg className={`w-4 h-4 text-gray-500 transition-transform ${showUserSwitcher ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                )}
              </h1>
            </button>

            {/* Current POV Switcher Dropdown */}
            {showUserSwitcher && users.length > 1 && (
              <div 
                id="user-switch-dropdown"
                className="absolute left-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  操作アカウント切り替え
                </div>
                {users.map((u) => {
                  const isCurrent = u.id === currentUser.id;
                  return (
                    <button
                      key={u.id}
                      id={`switch-user-${u.id}`}
                      onClick={() => {
                        onSwitchCurrentUser(u);
                        setShowUserSwitcher(false);
                      }}
                      className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-gray-50 transition cursor-pointer ${
                        isCurrent ? 'bg-blue-50/70 text-blue-600 font-medium' : 'text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <img 
                          src={u.avatarUrl} 
                          alt={u.name} 
                          className="w-7 h-7 rounded-full object-cover ring-1 ring-gray-200" 
                        />
                        <span className="text-sm truncate">{u.name}</span>
                      </div>
                      {isCurrent && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Header: New Message / Edit Action Icon matching standard chat app */}
          <div className="flex items-center gap-1 text-gray-700">
            <button
              id="navigate-to-edit-btn"
              onClick={onNavigateToEdit}
              title="ユーザー追加・設定編集画面へ移動 (#edit)"
              className="p-2 text-gray-700 hover:text-blue-600 hover:bg-gray-100 rounded-full transition cursor-pointer"
            >
              <Edit className="w-5 h-5" />
            </button>
            <button
              id="sidebar-settings-btn"
              onClick={onNavigateToEdit}
              title="設定・ユーザー管理 (#edit)"
              className="p-2 text-gray-700 hover:text-blue-600 hover:bg-gray-100 rounded-full transition cursor-pointer"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar matching Screenshot 1 */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="search-user-input"
            type="text"
            placeholder="検索"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9.5 pr-4 py-2 bg-[#efefef] hover:bg-[#e8e8e8] focus:bg-white text-sm text-gray-900 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 transition-all placeholder-gray-500"
          />
        </div>
      </div>

      {/* Active User Status Banner */}
      <div className="px-3.5 py-2 bg-gradient-to-r from-blue-50/60 to-indigo-50/60 border-b border-gray-100 flex items-center justify-between text-xs text-gray-600">
        <div className="flex items-center gap-2 truncate">
          <img
            src={currentUser.avatarUrl}
            alt={currentUser.name}
            className="w-5 h-5 rounded-full object-cover ring-1 ring-blue-500/30 shrink-0"
          />
          <span className="truncate">ログイン中: <strong className="text-gray-900">{currentUser.name}</strong></span>
        </div>
        <button
          id="banner-manage-users-btn"
          onClick={onNavigateToEdit}
          className="text-[11px] text-blue-600 font-medium cursor-pointer hover:underline shrink-0 ml-2"
        >
          編集・設定
        </button>
      </div>

      {/* User List rows matching Screenshot 1 */}
      <div 
        id="user-conversation-list" 
        tabIndex={0}
        aria-label="会話相手一覧"
        className="flex-1 overflow-y-auto divide-y divide-gray-50/80 focus:outline-none"
      >
        {filteredUsers.map((user) => {
          const isActive = user.id === activePartnerId;
          const summary = conversationsSummary[user.id] || {
            lastText: user.bio || 'メッセージはありません',
            time: user.lastActive || '今',
            senderId: user.id
          };

          const isSentByMe = summary.senderId === currentUser.id;
          
          let previewText = summary.lastText;
          if (summary.isLiked) {
            previewText = 'メッセージに「いいね！」がありま...';
          } else if (isSentByMe) {
            previewText = `あなた: ${summary.lastText}`;
          }

          return (
            <button
              key={user.id}
              id={`user-item-${user.id}`}
              onClick={() => onSelectUser(user)}
              className={`w-full px-4 py-3.5 flex items-center gap-3.5 transition-all text-left cursor-pointer group relative ${
                isActive 
                  ? 'bg-gray-100/90 font-medium' 
                  : 'hover:bg-gray-50/90'
              }`}
            >
              {/* Circular Avatar */}
              <div className="relative shrink-0">
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-13 h-13 rounded-full object-cover border border-black/5"
                />
                {user.status === 'online' && (
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></span>
                )}
              </div>

              {/* User info & last message preview */}
              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-center justify-between mb-0.5">
                  <span className={`text-[15px] truncate ${isActive ? 'text-gray-900 font-semibold' : 'text-gray-900 font-medium'}`}>
                    {user.name}
                  </span>
                </div>
                <p className="text-[13px] text-gray-500 truncate flex items-center">
                  <span className="truncate">{previewText}</span>
                  <span className="mx-1 shrink-0">·</span>
                  <span className="shrink-0 text-gray-400">{summary.time}</span>
                </p>
              </div>

              {/* 3-dots indicator */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-gray-700 rounded-full shrink-0">
                <MoreHorizontal className="w-5 h-5" />
              </div>
            </button>
          );
        })}

        {filteredUsers.length === 0 && (
          <div className="p-8 text-center flex flex-col items-center justify-center h-48">
            <p className="text-sm text-gray-500 mb-3">ユーザーがいません</p>
            <button
              id="empty-state-manage-btn"
              onClick={onNavigateToEdit}
              className="px-4 py-2 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              ユーザー管理画面 (#edit) へ
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
