import React, { useState, useRef } from 'react';
import { X, UserPlus, Upload, Camera, Check } from 'lucide-react';
import { User } from '../types';
import { processAvatarFile } from '../lib/imageUtils';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddUser: (user: User) => void;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150&auto=format&fit=crop&q=80',
];

export const AddUserModal: React.FC<AddUserModalProps> = ({
  isOpen,
  onClose,
  onAddUser,
}) => {
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(AVATAR_PRESETS[0]);
  const [bio, setBio] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (file: File) => {
    try {
      setIsUploading(true);
      const dataUrl = await processAvatarFile(file);
      setAvatarUrl(dataUrl);
    } catch (err) {
      console.error('Failed to process image:', err);
      alert('画像のアップロードに失敗しました。対応形式の画像ファイルをお試しください。');
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

  const handleSubmit = (e: React.FormEvent) => {
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
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <UserPlus className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-gray-900">新しいユーザーを追加</h3>
          </div>
          <button
            id="close-add-user-modal"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Avatar Upload Section */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              アイコン画像
            </label>
            
            <div className="flex items-center gap-4">
              {/* Preview Avatar with quick upload button */}
              <div className="relative group shrink-0">
                <img
                  src={avatarUrl}
                  alt="Avatar Preview"
                  className="w-16 h-16 rounded-full object-cover ring-2 ring-blue-500/30 shadow-sm"
                />
                <button
                  type="button"
                  id="avatar-upload-trigger-btn"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/40 text-white rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
                  title="画像をアップロード"
                >
                  <Camera className="w-5 h-5" />
                </button>
              </div>

              {/* Upload Drop Zone / Button */}
              <div 
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex-1 border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition flex flex-col items-center justify-center ${
                  isDragOver ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <input
                  id="avatar-file-input"
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
                <Upload className="w-4 h-4 text-blue-600 mb-1" />
                <p className="text-xs font-medium text-gray-700">
                  {isUploading ? '処理中...' : 'クリックまたは画像をドロップ'}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">JPG, PNG, GIFなど</p>
              </div>
            </div>

            {/* Avatar Presets */}
            <div className="mt-3">
              <span className="text-[11px] text-gray-500 font-medium block mb-1.5">またはプリセットから選択:</span>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {AVATAR_PRESETS.map((preset, index) => {
                  const isSelected = avatarUrl === preset;
                  return (
                    <button
                      key={index}
                      type="button"
                      id={`avatar-preset-${index}`}
                      onClick={() => setAvatarUrl(preset)}
                      className={`relative shrink-0 rounded-full transition-transform cursor-pointer ${
                        isSelected ? 'ring-2 ring-blue-600 scale-105' : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={preset}
                        alt={`Preset ${index}`}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-blue-600/30 rounded-full flex items-center justify-center text-white">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              名前 <span className="text-red-500">*</span>
            </label>
            <input
              id="new-user-name"
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
              id="new-user-display-name"
              type="text"
              placeholder="例: けんた"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              プロフィール / 一言
            </label>
            <input
              id="new-user-bio"
              type="text"
              placeholder="例: プロジェクトメンバー"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition cursor-pointer"
            >
              キャンセル
            </button>
            <button
              id="submit-add-user"
              type="submit"
              disabled={!name.trim()}
              className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl transition shadow-sm cursor-pointer"
            >
              ユーザーを作成
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
