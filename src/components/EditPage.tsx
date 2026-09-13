import React, { useState, useRef } from 'react';
import { User } from '../types';
import { 
  ArrowLeft, 
  UserPlus, 
  Upload, 
  Camera, 
  Check, 
  Trash2, 
  Edit3, 
  RotateCcw, 
  Sparkles, 
  Github, 
  UserCheck, 
  ShieldAlert,
  MessageSquare,
  Plus
} from 'lucide-react';
import { processAvatarFile } from '../lib/imageUtils';
import { EditProfileModal } from './EditProfileModal';

interface EditPageProps {
  users: User[];
  currentUser: User;
  onAddUser: (user: User) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  onSwitchCurrentUser: (user: User) => void;
  onResetData: () => void;
  onClearAllUsers: () => void;
  onOpenDeployModal: () => void;
  onBackToChat: () => void;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150&auto=format&fit=crop&q=80',
];

export const EditPage: React.FC<EditPageProps> = ({
  users,
  currentUser,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onSwitchCurrentUser,
  onResetData,
  onClearAllUsers,
  onOpenDeployModal,
  onBackToChat,
}) => {
  // New user form state
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(AVATAR_PRESETS[0]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (file: File) => {
    try {
      setIsUploading(true);
      const dataUrl = await processAvatarFile(file);
      setAvatarUrl(dataUrl);
    } catch (err) {
      console.error('Failed to process image:', err);
      alert('画像のアップロードに失敗しました。画像ファイルをお選びください。');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newUser: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      displayName: displayName.trim() || name.trim(),
      avatarUrl: avatarUrl || AVATAR_PRESETS[0],
      status: 'online',
      statusText: 'オンライン',
      bio: bio.trim() || 'メンバー',
      lastActive: '今'
    };

    onAddUser(newUser);
    setName('');
    setDisplayName('');
    setBio('');
    setAvatarUrl(AVATAR_PRESETS[0]);
    
    setSuccessMessage(`「${newUser.name}」を追加しました！`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  return (
    <div 
      id="edit-page-container"
      className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900"
    >
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            id="back-to-chat-btn"
            onClick={onBackToChat}
            className="p-2 -ml-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium hidden sm:inline">チャットに戻る</span>
          </button>
          <div className="h-4 w-px bg-gray-200 hidden sm:block" />
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
            ユーザー管理・編集
            <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full border border-blue-200/50">
              #edit
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="edit-page-github-btn"
            onClick={onOpenDeployModal}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs sm:text-sm font-medium rounded-xl transition flex items-center gap-1.5 cursor-pointer"
          >
            <Github className="w-4 h-4" />
            <span className="hidden sm:inline">GitHub Pages手順</span>
          </button>
          <button
            id="edit-page-chat-action-btn"
            onClick={onBackToChat}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            チャットを開く
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* Success Alert */}
        {successMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-sm flex items-center gap-2.5 shadow-xs animate-in fade-in duration-200">
            <Check className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        {/* Top Grid: Add User Form & Current Account Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Section 1: Add New User Form (7 Cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 shadow-xs border border-gray-200/80">
            <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-gray-100">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">新規ユーザーの追加</h2>
                <p className="text-xs text-gray-500">アイコン画像をアップロードして新しいアカウントを作成できます</p>
              </div>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              {/* Avatar Upload Area */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  アイコン画像（アップロードまたはプリセット）
                </label>
                
                <div className="flex items-center gap-4">
                  {/* Current Selected Avatar Preview */}
                  <div className="relative group shrink-0">
                    <img
                      src={avatarUrl}
                      alt="Avatar Preview"
                      className="w-18 h-18 rounded-full object-cover ring-3 ring-blue-500/20 shadow-sm border border-gray-100"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-black/40 text-white rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
                      title="画像を選択"
                    >
                      <Camera className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Dropzone */}
                  <div 
                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex-1 border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center ${
                      isDragOver ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      id="edit-page-avatar-input"
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileChange(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />
                    <Upload className="w-5 h-5 text-blue-600 mb-1" />
                    <p className="text-xs font-semibold text-gray-800">
                      {isUploading ? 'アップロード処理中...' : 'クリックして画像ファイルを選択'}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">またはここに画像をドラッグ＆ドロップ</p>
                  </div>
                </div>

                {/* Preset Avatars */}
                <div className="mt-3">
                  <span className="text-[11px] text-gray-500 font-medium block mb-1.5">プリセットから選ぶ:</span>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {AVATAR_PRESETS.map((preset, index) => {
                      const isSelected = avatarUrl === preset;
                      return (
                        <button
                          key={index}
                          type="button"
                          id={`preset-btn-${index}`}
                          onClick={() => setAvatarUrl(preset)}
                          className={`relative shrink-0 rounded-full transition-transform cursor-pointer ${
                            isSelected ? 'ring-2 ring-blue-600 scale-105' : 'opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img
                            src={preset}
                            alt={`Preset ${index}`}
                            className="w-9 h-9 rounded-full object-cover"
                          />
                          {isSelected && (
                            <div className="absolute inset-0 bg-blue-600/30 rounded-full flex items-center justify-center text-white">
                              <Check className="w-4 h-4 stroke-[3]" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Name fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    ユーザー本名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="edit-new-name"
                    type="text"
                    required
                    placeholder="例: 佐藤 健太"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    表示名 / ニックネーム
                  </label>
                  <input
                    id="edit-new-display-name"
                    type="text"
                    placeholder="例: けんた"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  ステータス / プロフィール一言
                </label>
                <input
                  id="edit-new-bio"
                  type="text"
                  placeholder="例: よろしくお願いします！"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                />
              </div>

              <div className="pt-2">
                <button
                  id="create-user-submit-btn"
                  type="submit"
                  disabled={!name.trim()}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  ユーザーを作成する
                </button>
              </div>
            </form>
          </div>

          {/* Section 2: Current Logged-in User & Quick Controls (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Current POV Card */}
            <div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-200/80">
              <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-gray-100">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">現在ログイン中のアカウント</h2>
                  <p className="text-xs text-gray-500">チャットで送信者となるアカウント</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 p-3.5 bg-indigo-50/50 rounded-2xl border border-indigo-100/80 mb-4">
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="w-14 h-14 rounded-full object-cover ring-2 ring-indigo-500/30 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-gray-900 truncate">{currentUser.name}</h3>
                  <p className="text-xs text-gray-500 truncate">{currentUser.displayName || currentUser.name}</p>
                  <p className="text-[11px] text-indigo-600 font-medium truncate mt-0.5">{currentUser.bio || 'ログイン中'}</p>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  id="edit-current-account-btn"
                  onClick={() => setEditingUser(currentUser)}
                  className="w-full py-2 px-3 bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-gray-600" />
                  ログイン中アカウントのアイコン・名前を編集
                </button>
              </div>
            </div>

            {/* Quick Data Operations */}
            <div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-200/80">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                データ初期化・メンテナンス
              </h3>
              
              <div className="space-y-2.5">
                <button
                  id="edit-page-reset-sample-btn"
                  onClick={onResetData}
                  className="w-full py-2.5 px-3.5 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 text-xs font-medium rounded-xl border border-emerald-200/60 transition flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-emerald-600" />
                    初期サンプルデータを復元
                  </span>
                  <span className="text-[11px] text-emerald-600">リセット</span>
                </button>

                <button
                  id="edit-page-clear-all-btn"
                  onClick={onClearAllUsers}
                  className="w-full py-2.5 px-3.5 bg-red-50 hover:bg-red-100/80 text-red-800 text-xs font-medium rounded-xl border border-red-200/60 transition flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-red-600" />
                    ユーザー・チャットを全削除
                  </span>
                  <span className="text-[11px] text-red-600">全消去</span>
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Section 3: Existing User List & Management */}
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-200/80">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
            <div>
              <h2 className="text-base font-bold text-gray-900">登録済みユーザー一覧 ({users.length}名)</h2>
              <p className="text-xs text-gray-500">アイコンの変更、プロフィールの更新、削除、ログイン切り替えが可能です</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {users.map((user) => {
              const isCurrent = user.id === currentUser.id;

              return (
                <div
                  key={user.id}
                  id={`user-card-${user.id}`}
                  className={`p-4 rounded-2xl border transition flex items-center justify-between gap-3 ${
                    isCurrent 
                      ? 'bg-blue-50/40 border-blue-200/80' 
                      : 'bg-gray-50/70 hover:bg-white border-gray-200/70 hover:border-gray-300 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <img
                        src={user.avatarUrl}
                        alt={user.name}
                        className="w-12 h-12 rounded-full object-cover ring-1 ring-gray-200"
                      />
                      {isCurrent && (
                        <span className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-[9px] px-1 py-0.2 rounded-full font-bold">
                          YOU
                        </span>
                      )}
                    </div>
                    
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-gray-900 truncate">{user.name}</span>
                        {isCurrent && (
                          <span className="text-[10px] text-blue-600 bg-blue-100/70 px-1.5 py-0.5 rounded-md font-medium shrink-0">
                            現在
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">{user.bio || 'メンバー'}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {!isCurrent && (
                      <button
                        id={`switch-to-user-${user.id}`}
                        onClick={() => onSwitchCurrentUser(user)}
                        title="このユーザーとして操作"
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-white rounded-xl border border-transparent hover:border-gray-200 transition cursor-pointer text-xs font-medium"
                      >
                        切替
                      </button>
                    )}

                    <button
                      id={`edit-user-icon-btn-${user.id}`}
                      onClick={() => setEditingUser(user)}
                      title="アイコン・プロフィールを編集"
                      className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-white rounded-xl border border-transparent hover:border-gray-200 transition cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {users.length > 1 && (
                      <button
                        id={`delete-user-btn-${user.id}`}
                        onClick={() => {
                          if (window.confirm(`ユーザー「${user.name}」を削除してもよろしいですか？`)) {
                            onDeleteUser(user.id);
                          }
                        }}
                        title="ユーザーを削除"
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-white rounded-xl border border-transparent hover:border-gray-200 transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </main>

      {/* Edit Profile Modal */}
      {editingUser && (
        <EditProfileModal
          isOpen={Boolean(editingUser)}
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onUpdateUser={(updated) => {
            onUpdateUser(updated);
            setEditingUser(null);
            setSuccessMessage(`「${updated.name}」の情報を更新しました！`);
            setTimeout(() => setSuccessMessage(''), 3000);
          }}
        />
      )}
    </div>
  );
};
