import React, { useState, useEffect } from 'react';
import { X, Sparkles, Key, Check, ShieldCheck, Cpu, RefreshCw, AlertCircle } from 'lucide-react';
import { getStoredGeminiKey, setStoredGeminiKey } from '../utils/aiService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setApiKey(getStoredGeminiKey());
  }, [isOpen]);

  const handleSave = () => {
    setStoredGeminiKey(apiKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTestKey = async () => {
    if (!apiKey.trim()) {
      alert('請先輸入 Gemini API Key');
      return;
    }
    setTestStatus('testing');
    setErrorMessage('');
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey.trim()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Hello, respond with {"status":"ok"}' }] }],
          generationConfig: { responseMimeType: 'application/json' }
        })
      });
      if (!res.ok) {
        throw new Error(`API 連線失敗 (${res.status})，請確認 Key 是否正確`);
      }
      setTestStatus('success');
      setStoredGeminiKey(apiKey);
    } catch (err: any) {
      setTestStatus('error');
      setErrorMessage(err.message || '測試失敗');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-gray-200 flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">AI 引擎與金鑰設定</h3>
              <p className="text-[11px] text-gray-500">Google Gemini & 本地雙核心設定</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs text-gray-600">
          {/* Status Box */}
          <div className="p-3.5 bg-blue-50 border border-blue-100 rounded-2xl space-y-1.5">
            <div className="flex items-center space-x-2 text-blue-900 font-bold">
              <Cpu className="w-4 h-4 text-blue-600" />
              <span>雙核心 AI 解析架構</span>
            </div>
            <p className="text-[11px] text-blue-700 leading-relaxed">
              系統內建「高家專屬本地智慧語意引擎」，未填寫金鑰時亦能自動辨識家庭成員（瑋、珍、朋、淨、炘、豐、柔）、樓層空間、效期與數量。
            </p>
          </div>

          {/* API Key Input */}
          <div className="space-y-1.5">
            <label className="block font-bold text-gray-800 flex items-center justify-between">
              <span>Google Gemini API Key (可選填)</span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline font-normal text-[11px]"
              >
                免費取得 Key ➔
              </a>
            </label>
            <div className="relative">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="貼上 AI Studio 的 Gemini API Key..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono text-xs"
              />
            </div>
            <p className="text-[10px] text-gray-400">
              🔒 金鑰僅儲存在您的瀏覽器本地（LocalStorage），絕不會傳送至未經授權的第三方。
            </p>
          </div>

          {/* Test & Save Actions */}
          <div className="flex items-center space-x-2 pt-1">
            <button
              onClick={handleTestKey}
              disabled={testStatus === 'testing'}
              className="flex-1 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold flex items-center justify-center space-x-1 transition-all"
            >
              {testStatus === 'testing' ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>測試連線中...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>測試連線</span>
                </>
              )}
            </button>

            <button
              onClick={handleSave}
              className="flex-1 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center space-x-1 transition-all shadow-xs"
            >
              {saved ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>已儲存！</span>
                </>
              ) : (
                <span>儲存設定</span>
              )}
            </button>
          </div>

          {/* Test Results */}
          {testStatus === 'success' && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center space-x-2 font-medium">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Gemini 2.5 Flash API 連線成功！已啟用頂級多模態分析。</span>
            </div>
          )}

          {testStatus === 'error' && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center space-x-2 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};