import React, { useState, useRef, useEffect } from 'react';
import { User, ChatMessage, MessageReply } from '../types';
import { 
  Phone, 
  Video, 
  Info, 
  Smile, 
  Image as ImageIcon, 
  Paperclip, 
  Send, 
  Reply, 
  MoreVertical, 
  Heart, 
  X, 
  ChevronLeft,
  Trash2,
  Copy,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ChatAreaProps {
  partner: User;
  currentUser: User;
  messages: ChatMessage[];
  onSendMessage: (text: string, replyTo?: MessageReply, imageUrl?: string) => void;
  onToggleReaction: (messageId: string, emoji: string, currentReactions?: Record<string, string[]>) => void;
  onDeleteMessage: (messageId: string) => void;
  onBackMobile?: () => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  partner,
  currentUser,
  messages,
  onSendMessage,
  onToggleReaction,
  onDeleteMessage,
  onBackMobile
}) => {
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [activeReactionPickerId, setActiveReactionPickerId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const emojiOptions = ['❤️', '👍', '😂', '😮', '😢', '🔥'];

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !replyingTo) return;

    const replyData: MessageReply | undefined = replyingTo ? {
      messageId: replyingTo.id,
      text: replyingTo.text || (replyingTo.imageUrl ? '画像' : '添付ファイル'),
      senderId: replyingTo.senderId,
      senderName: replyingTo.senderName
    } : undefined;

    const text = inputText;
    setInputText('');
    setReplyingTo(null);
    setIsSending(true);

    try {
      await onSendMessage(text, replyData);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDoubleTap = (msg: ChatMessage) => {
    // Quick heart reaction + confetti
    onToggleReaction(msg.id, '❤️', msg.reactions);
    confetti({
      particleCount: 24,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#ff2a5f', '#ff6b8b', '#ff9a9e']
    });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        onSendMessage('写真を送信しました。', undefined, result);
      };
      reader.readAsDataURL(file);
    }
    if (e.target) e.target.value = '';
  };

  return (
    <section 
      id="chat-main-area" 
      aria-label={`チャット画面: ${partner.name}`}
      className="flex-1 flex flex-col h-full bg-white relative overflow-hidden"
    >
      {/* Top Chat Header matching Screenshot 2 */}
      <div 
        id="chat-header"
        className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-white z-10"
      >
        <div className="flex items-center gap-3">
          {/* Mobile back button */}
          {onBackMobile && (
            <button 
              onClick={onBackMobile}
              className="md:hidden p-1.5 -ml-1 text-gray-700 hover:bg-gray-100 rounded-full cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          <div className="relative">
            <img
              src={partner.avatarUrl}
              alt={partner.name}
              className="w-10 h-10 rounded-full object-cover ring-1 ring-black/5"
            />
            {partner.status === 'online' && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
            )}
          </div>

          <div>
            <h2 className="text-sm font-semibold text-gray-900 tracking-tight leading-snug">
              {partner.name}
            </h2>
            <p className="text-xs text-gray-500">
              {partner.status === 'online' ? 'アクティブ中' : (partner.lastActive ? `${partner.lastActive}前にオンライン` : 'オフライン')}
            </p>
          </div>
        </div>

        {/* Action icons on right */}
        <div className="flex items-center gap-1 text-gray-700">
          <button 
            id="chat-phone-btn"
            title="音声通話" 
            className="p-2 hover:bg-gray-100 rounded-full text-gray-600 hover:text-gray-900 transition cursor-pointer"
          >
            <Phone className="w-5 h-5" />
          </button>
          <button 
            id="chat-video-btn"
            title="ビデオ通話" 
            className="p-2 hover:bg-gray-100 rounded-full text-gray-600 hover:text-gray-900 transition cursor-pointer"
          >
            <Video className="w-5 h-5" />
          </button>
          <button 
            id="chat-info-btn"
            title="詳細情報" 
            className="p-2 hover:bg-gray-100 rounded-full text-gray-600 hover:text-gray-900 transition cursor-pointer"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages Stream Container matching Screenshot 2 */}
      <div 
        id="messages-scroll-container"
        tabIndex={0}
        aria-label="メッセージ履歴"
        className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-4 focus:outline-none"
      >
        {messages.map((msg, index) => {
          const isMe = msg.senderId === currentUser.id;
          const nextMsg = messages[index + 1];
          const isLastInGroup = !nextMsg || nextMsg.senderId !== msg.senderId;
          const isHovered = hoveredMessageId === msg.id;
          const showPicker = activeReactionPickerId === msg.id;
          const showMenu = activeMenuId === msg.id;

          // Check if there are reactions
          const reactionsList = Object.entries(msg.reactions || {}) as [string, string[]][];
          const activeReactions = reactionsList.filter(([_, users]) => Array.isArray(users) && users.length > 0);

          return (
            <div
              key={msg.id}
              id={`message-row-${msg.id}`}
              onMouseEnter={() => setHoveredMessageId(msg.id)}
              onMouseLeave={() => {
                setHoveredMessageId(null);
                setActiveReactionPickerId(null);
                setActiveMenuId(null);
              }}
              className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'} relative`}
            >
              {/* Reply Quote Header if message was a reply matching Screenshot 2 */}
              {msg.replyTo && (
                <div className={`flex flex-col mb-1 max-w-[80%] md:max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                  <span className="text-[11px] text-gray-400 mb-1 px-1">
                    {msg.replyTo.senderId === currentUser.id 
                      ? '自分に返信しました' 
                      : `${msg.replyTo.senderName}さんから返信がありました`}
                  </span>
                  <div className={`px-3 py-1.5 rounded-2xl text-xs truncate max-w-full opacity-70 ${
                    msg.replyTo.senderId === currentUser.id
                      ? 'bg-blue-300/80 text-blue-950'
                      : 'bg-blue-300/80 text-blue-950'
                  }`}>
                    {msg.replyTo.text}
                  </div>
                </div>
              )}

              {/* Message Bubble + Action buttons */}
              <div className={`flex items-center gap-2 max-w-[85%] md:max-w-[75%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Partner Avatar next to bubble (if not me) */}
                {!isMe && (
                  <div className="w-7 h-7 shrink-0 self-end mb-1">
                    {isLastInGroup ? (
                      <img
                        src={partner.avatarUrl}
                        alt={partner.name}
                        className="w-7 h-7 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-7 h-7" />
                    )}
                  </div>
                )}

                {/* Message Bubble */}
                <div className="relative group/bubble">
                  <div
                    onDoubleClick={() => handleDoubleTap(msg)}
                    className={`px-4 py-2.5 transition-all select-text cursor-default ${
                      isMe
                        ? 'bg-[#3797f0] text-white rounded-3xl'
                        : 'bg-[#efefef] text-gray-900 rounded-3xl'
                    }`}
                  >
                    {/* Image if present */}
                    {msg.imageUrl && (
                      <img 
                        src={msg.imageUrl} 
                        alt="添付画像" 
                        className="rounded-2xl max-h-64 object-cover mb-1 border border-black/5" 
                      />
                    )}

                    {/* File if present */}
                    {msg.fileName && (
                      <div className="flex items-center gap-2.5 p-2 bg-black/5 rounded-xl mb-1">
                        <Paperclip className="w-4 h-4 text-gray-500" />
                        <div className="text-xs">
                          <p className="font-medium truncate max-w-[180px]">{msg.fileName}</p>
                          {msg.fileSize && <p className="text-[10px] text-gray-400">{msg.fileSize}</p>}
                        </div>
                      </div>
                    )}

                    {/* Text */}
                    {msg.text && (
                      <p className="text-[14.5px] leading-relaxed whitespace-pre-wrap break-words">
                        {msg.text}
                      </p>
                    )}
                  </div>

                  {/* Reaction Badges matching Screenshot 2 (e.g., ❤️ badge on bottom right) */}
                  {activeReactions.length > 0 && (
                    <div className={`absolute -bottom-2.5 ${isMe ? 'right-2' : 'left-2'} flex items-center gap-1 z-10`}>
                      {activeReactions.map(([emoji, userIds]) => (
                        <button
                          key={emoji}
                          id={`reaction-badge-${msg.id}-${emoji}`}
                          onClick={() => onToggleReaction(msg.id, emoji, msg.reactions)}
                          className="bg-white px-1.5 py-0.5 rounded-full text-xs shadow-md border border-gray-100 flex items-center gap-0.5 hover:scale-110 transition cursor-pointer"
                        >
                          <span>{emoji}</span>
                          {userIds.length > 1 && (
                            <span className="text-[10px] font-semibold text-gray-600">{userIds.length}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Hover Action Toolbar matching Screenshot 2: (⋮, ↩, ☺) */}
                <div className={`flex items-center gap-1 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity ${
                  isMe ? 'flex-row-reverse' : 'flex-row'
                }`}>
                  {/* Reaction Picker Button */}
                  <div className="relative">
                    <button
                      id={`react-btn-${msg.id}`}
                      onClick={() => setActiveReactionPickerId(showPicker ? null : msg.id)}
                      title="リアクションを追加"
                      className="p-1 hover:text-gray-700 hover:bg-gray-100 rounded-full transition cursor-pointer"
                    >
                      <Smile className="w-4 h-4" />
                    </button>

                    {/* Reaction Popup */}
                    {showPicker && (
                      <div className={`absolute bottom-full mb-1 ${isMe ? 'right-0' : 'left-0'} bg-white px-2 py-1.5 rounded-full shadow-lg border border-gray-100 flex items-center gap-1.5 z-50 animate-in fade-in zoom-in-95 duration-100`}>
                        {emojiOptions.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => {
                              onToggleReaction(msg.id, emoji, msg.reactions);
                              setActiveReactionPickerId(null);
                            }}
                            className="hover:scale-130 transition text-base p-1 cursor-pointer"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Reply Button */}
                  <button
                    id={`reply-btn-${msg.id}`}
                    onClick={() => setReplyingTo(msg)}
                    title="返信する"
                    className="p-1 hover:text-gray-700 hover:bg-gray-100 rounded-full transition cursor-pointer"
                  >
                    <Reply className="w-4 h-4" />
                  </button>

                  {/* 3 dots menu button */}
                  <div className="relative">
                    <button
                      id={`menu-btn-${msg.id}`}
                      onClick={() => setActiveMenuId(showMenu ? null : msg.id)}
                      title="その他"
                      className="p-1 hover:text-gray-700 hover:bg-gray-100 rounded-full transition cursor-pointer"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {/* Action Dropdown Menu */}
                    {showMenu && (
                      <div className={`absolute bottom-full mb-1 ${isMe ? 'right-0' : 'left-0'} w-36 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50 animate-in fade-in duration-100`}>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(msg.text);
                            setActiveMenuId(null);
                          }}
                          className="w-full px-3 py-1.5 text-xs text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>テキストをコピー</span>
                        </button>
                        <button
                          onClick={() => {
                            onDeleteMessage(msg.id);
                            setActiveMenuId(null);
                          }}
                          className="w-full px-3 py-1.5 text-xs text-left text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>削除する</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Preview Bar */}
      {replyingTo && (
        <div 
          id="reply-preview-bar"
          className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-600 animate-in slide-in-from-bottom-2"
        >
          <div className="flex items-center gap-2 truncate">
            <Reply className="w-4 h-4 text-blue-500 shrink-0" />
            <span className="font-semibold text-gray-900 shrink-0">{replyingTo.senderName} への返信:</span>
            <span className="truncate text-gray-500">{replyingTo.text}</span>
          </div>
          <button 
            id="cancel-reply-button"
            onClick={() => setReplyingTo(null)}
            className="p-1 text-gray-400 hover:text-gray-700 rounded-full cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Chat Input Bar at Bottom */}
      <div 
        id="chat-input-container"
        className="p-3 md:p-4 bg-white border-t border-gray-100"
      >
        <form onSubmit={handleSend} className="flex items-center gap-2 bg-[#efefef] rounded-3xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:bg-white border border-transparent focus-within:border-gray-200 transition-all">
          {/* File / Image Upload */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/*"
            className="hidden"
          />
          <button
            type="button"
            id="upload-image-button"
            onClick={() => fileInputRef.current?.click()}
            title="画像を添付"
            className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-gray-200/50 rounded-full transition cursor-pointer shrink-0"
          >
            <ImageIcon className="w-5 h-5" />
          </button>

          {/* Text Input */}
          <input
            id="chat-message-input"
            type="text"
            placeholder="メッセージを送信..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 placeholder-gray-500 py-1.5 px-1"
          />

          {/* Quick Heart / Reaction Shortcut */}
          {!inputText.trim() && (
            <button
              type="button"
              id="send-quick-heart-button"
              onClick={() => {
                onSendMessage('❤️');
                confetti({
                  particleCount: 30,
                  spread: 70,
                  origin: { y: 0.9 },
                  colors: ['#ff2a5f', '#ff6b8b', '#ff9a9e']
                });
              }}
              title="いいねを送る"
              className="p-1.5 text-red-500 hover:scale-125 transition cursor-pointer shrink-0"
            >
              <Heart className="w-5 h-5 fill-red-500" />
            </button>
          )}

          {/* Send Button */}
          {inputText.trim() && (
            <button
              type="submit"
              id="send-message-button"
              disabled={isSending}
              className="p-1.5 bg-[#3797f0] hover:bg-blue-600 text-white rounded-full transition cursor-pointer shrink-0 shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </form>
      </div>
    </section>
  );
};
