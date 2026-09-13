import React, { useState } from 'react';
import { User } from '../types';
import { 
  Search, 
  UserPlus, 
  RotateCcw,
  Trash2,
  Github,
  Check,
  MoreHorizontal,
  Camera,
  Edit2
} from 'lucide-react';
import { AddUserModal } from './AddUserModal';
import { EditProfileModal } from './EditProfileModal';

interface UserListProps {
  users: User[];
  currentUser: User;
  activePartnerId: string;
  onSelectUser: (user: User) => void;
  onSwitchCurrentUser: (user: User) => void;
  onUpdateUser: (user: User) => void;
  onResetData: () => void;
  onClearAllUsers: () => void;
  onAddUser: (user: User) => void;
  onOpenDeployModal: () => void;
  conversationsSummary: Record<string, { lastText: string; time: string; senderId: string; isLiked?: boolean }>;
}

export const UserList: React.FC<UserListProps> = ({
  users,
  currentUser,
  activePartnerId,
  onSelectUser,
  onSwitchCurrentUser,
  onUpdateUser,
  onResetData,
  onClearAllUsers,
  onAddUser,
  onOpenDeployModal,
  conversationsSummary
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserSwitcher, setShowUserSwitcher] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

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

          {/* Right Header Actions */}
          <div className="flex items-center gap-1 text-gray-700">
            <button
              id="add-user-header-button"
              onClick={() => setIsAddUserOpen(true)}
              title="新規ユーザーを追加（アイコン画像アップロード対応）"
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-full transition cursor-pointer"
            >
              <UserPlus className="w-5 h-5" />
            </button>
            <button
              id="clear-all-users-button"
              onClick={onClearAllUsers}
              title="ユーザー・メッセージを全削除"
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded-full transition cursor-pointer"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button
              id="reset-sample-data-button"
              onClick={onResetData}
              title="初期サンプルデータを復元"
              className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-gray-100 rounded-full transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              id="github-pages-help-button"
              onClick={onOpenDeployModal}
              title="GitHub Pages デプロイ手順"
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-full transition cursor-pointer"
            >
              <Github className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
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

      {/* Active User Status Banner with Avatar edit quick button */}
      <div className="px-3.5 py-2.5 bg-gradient-to-r from-blue-50/70 to-indigo-50/70 border-b border-gray-100 flex items-center justify-between text-xs text-gray-600">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative group shrink-0">
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.name}
              className="w-7 h-7 rounded-full object-cover ring-1 ring-blue-500/30"
            />
            <button
              id="edit-current-user-avatar-btn"
              onClick={() => setEditingUser(currentUser)}
              title="アイコン画像を変更"
              className="absolute inset-0 bg-black/40 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="truncate flex flex-col">
            <span className="text-[11px] text-gray-500 leading-tight">ログイン中</span>
            <span className="font-semibold text-gray-900 truncate leading-tight">{currentUser.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          <button
            id="edit-profile-banner-btn"
            onClick={() => setEditingUser(currentUser)}
            title="アイコン・プロフィール画像を変更"
            className="px-2 py-1 bg-white hover:bg-blue-50 text-blue-600 rounded-lg text-[11px] font-medium border border-blue-200/60 shadow-2xs flex items-center gap-1 transition cursor-pointer"
          >
            <Camera className="w-3 h-3" />
            アイコン変更
          </button>
          {users.length > 1 && (
            <button
              id="switch-user-banner-btn"
              onClick={() => setShowUserSwitcher(true)}
              className="text-[11px] text-gray-500 hover:text-gray-900 font-medium px-1 cursor-pointer"
            >
              切替
            </button>
          )}
        </div>
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
            <div
              key={user.id}
              className={`w-full px-4 py-3.5 flex items-center gap-3.5 transition-all text-left group relative ${
                isActive 
                  ? 'bg-gray-100/90 font-medium' 
                  : 'hover:bg-gray-50/90'
              }`}
            >
              {/* Circular Avatar */}
              <div 
                className="relative shrink-0 cursor-pointer"
                onClick={() => onSelectUser(user)}
              >
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
              <div 
                className="flex-1 min-w-0 pr-1 cursor-pointer"
                onClick={() => onSelectUser(user)}
              >
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

              {/* Edit User Avatar / Profile action button */}
              <button
                id={`edit-user-btn-${user.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingUser(user);
                }}
                title={`${user.name} のアイコン・プロフィールを変更`}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-gray-400 hover:text-blue-600 hover:bg-gray-200/60 rounded-full shrink-0 cursor-pointer"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}

        {filteredUsers.length === 0 && (
          <div className="p-8 text-center flex flex-col items-center justify-center h-48">
            <p className="text-sm text-gray-500 mb-3">ユーザーがいません</p>
            <button
              id="empty-state-add-user-btn"
              onClick={() => setIsAddUserOpen(true)}
              className="px-4 py-2 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              新しいユーザーを追加
            </button>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      <AddUserModal
        isOpen={isAddUserOpen}
        onClose={() => setIsAddUserOpen(false)}
        onAddUser={onAddUser}
      />

      {/* Edit Profile / Avatar Modal */}
      {editingUser && (
        <EditProfileModal
          isOpen={Boolean(editingUser)}
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onUpdateUser={(updated) => {
            onUpdateUser(updated);
            setEditingUser(null);
          }}
        />
      )}
    </aside>
  );
};
