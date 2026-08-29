import React, { useState, useEffect } from 'react';
import { InventoryItem, TodoItem, LineWeeklyBriefing } from '../types';
import { Sparkles, X, Copy, Check, Send, CheckCircle2 } from 'lucide-react';

interface BriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  todos: TodoItem[];
}

export const BriefingModal: React.FC<BriefingModalProps> = ({
  isOpen,
  onClose,
  items,
  todos,
}) => {
  if (!isOpen) return null;

  const [briefing, setBriefing] = useState<LineWeeklyBriefing | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pushed, setPushed] = useState(false);

  useEffect(() => {
    const loadBriefing = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/gemini/briefing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items, todos }),
        });
        const data = await response.json();
        setBriefing(data);
      } catch (e) {
        console.warn(e);
      } finally {
        setLoading(false);
      }
    };
    loadBriefing();
  }, [items, todos]);

  const handleCopy = () => {
    if (!briefing?.lineFormattedText) return;
    navigator.clipboard.writeText(briefing.lineFormattedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePush = async () => {
    if (!briefing?.lineFormattedText) return;
    try {
      await fetch('/api/line/push-simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: briefing.lineFormattedText,
          targetGroup: '高家大小事 LINE 群組 (瑋、珍、朋、淨、炘、豐、柔)',
        }),
      });
      setPushed(true);
      setTimeout(() => setPushed(false), 3000);
    } catch (e) {
      console.warn(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-gray-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center font-bold text-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">週一/週五 LINE 定期快報</h3>
              <p className="text-[11px] text-gray-500">Gemini Spark 自動彙整全家即時警示</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          <div className="bg-[#1e1e1e] text-emerald-400 p-4 rounded-2xl font-mono text-xs leading-relaxed whitespace-pre-wrap shadow-inner border border-gray-800">
            {loading ? 'Spark AI 正在分析全家庫存中...' : briefing?.lineFormattedText}
          </div>

          {pushed && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-bold flex items-center space-x-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>已成功推播通知至高家 LINE 群組！</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-2xs"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? '已複製' : '複製內容'}</span>
          </button>

          <button
            onClick={handlePush}
            className="px-4 py-2 bg-[#06c755] hover:bg-[#05b34c] text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-xs transition-colors"
          >
            <Send className="w-4 h-4" />
            <span>推播至 LINE 群組</span>
          </button>
        </div>
      </div>
    </div>
  );
};
