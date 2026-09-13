import React, { useState } from 'react';
import { X, Github, Check, Copy, ExternalLink, Terminal, Globe, Rocket } from 'lucide-react';

interface GithubDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GithubDeployModal: React.FC<GithubDeployModalProps> = ({ isOpen, onClose }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const copyCode = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const steps = [
    {
      title: '1. GitHubリポジトリを作成してプッシュ',
      code: `git init
git add .
git commit -m "Initial commit for 1on1 Chat App"
git branch -M main
git remote add origin https://github.com/<あなたのユーザー名>/<リポジトリ名>.git
git push -u origin main`
    },
    {
      title: '2. GitHub Pagesの設定を有効化',
      description: 'GitHubリポジトリの「Settings」タブ → 「Pages」に移動し、「Build and deployment」のSourceで「GitHub Actions」を選択します。'
    },
    {
      title: '3. 自動デプロイの完了',
      description: 'プロジェクト内に既にある `.github/workflows/deploy.yml` が自動検知され、GitHub Actionsによって `https://<あなたのユーザー名>.github.io/<リポジトリ名>/` に自動公開されます。'
    }
  ];

  return (
    <div 
      id="deploy-modal-overlay"
      className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150"
    >
      <div 
        id="deploy-modal-content"
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-gray-900 to-gray-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Github className="w-6 h-6 text-white" />
            <div>
              <h3 className="font-bold text-base">GitHub Pages デプロイ手順</h3>
              <p className="text-xs text-gray-300">完全静的ビルド & Firebase連携対応</p>
            </div>
          </div>
          <button 
            id="close-deploy-modal-btn"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm text-gray-700">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-2.5 text-emerald-800 text-xs">
            <Rocket className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong>GitHub Pages対応完了:</strong> <code>vite.config.ts</code> に <code>base: './'</code> が設定済みで、Firebaseのリアルタイム同期もクライアントから直接動作します。
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-blue-900 text-xs leading-relaxed">
            <strong>ℹ️ 「Node.js 20 is deprecated...」の警告について:</strong>
            <p className="mt-1 text-blue-800">
              これはGitHub側の環境移行に伴う<strong>事前アナウンス警告</strong>であり、ビルドエラーではありません。デプロイ自体は正常に完了しサイトは動作します。最新の <code>.github/workflows/deploy.yml</code> ではこの警告を防止する設定が適用されています。
            </p>
          </div>

          <div className="space-y-4">
            {steps.map((step, idx) => (
              <div key={idx} className="bg-gray-50 border border-gray-200/80 rounded-2xl p-4">
                <h4 className="font-semibold text-gray-900 text-sm mb-1.5 flex items-center justify-between">
                  <span>{step.title}</span>
                </h4>
                {step.description && (
                  <p className="text-xs text-gray-600 leading-relaxed">{step.description}</p>
                )}
                {step.code && (
                  <div className="relative mt-2">
                    <pre className="bg-gray-900 text-gray-100 text-xs p-3 rounded-xl overflow-x-auto font-mono">
                      {step.code}
                    </pre>
                    <button
                      onClick={() => copyCode(step.code!, idx)}
                      className="absolute top-2 right-2 px-2 py-1 bg-white/10 hover:bg-white/20 text-white rounded-md text-[11px] flex items-center gap-1 transition cursor-pointer"
                    >
                      {copiedIndex === idx ? (
                        <>
                          <Check className="w-3 h-3 text-green-400" />
                          <span>コピー完了</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>コピー</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button
            id="close-deploy-modal-bottom-btn"
            onClick={onClose}
            className="px-5 py-2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
