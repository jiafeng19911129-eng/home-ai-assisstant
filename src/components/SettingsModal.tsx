import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Key, 
  Check, 
  ShieldCheck, 
  Cpu, 
  RefreshCw, 
  AlertCircle,
  Cloud,
  Database,
  UploadCloud,
  Layers,
  Flame
} from 'lucide-react';
import { getStoredGeminiKey, setStoredGeminiKey } from '../utils/aiService';
import { 
  getStoredFirebaseConfig, 
  setStoredFirebaseConfig, 
  initFirebase, 
  isFirebaseConfigured,
  FirebaseConfig 
} from '../services/firebase';
import { syncAllLocalItemsToCloud } from '../services/firestoreSync';
import { InventoryItem, TodoItem } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  todos: TodoItem[];
  onCloudSyncSuccess?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose,
  items,
  todos,
  onCloudSyncSuccess 
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'firebase' | 'gemini'>('firebase');

  // Gemini State
  const [apiKey, setApiKey] = useState('');
  const [geminiSaved, setGeminiSaved] = useState(false);
  const [geminiTestStatus, setGeminiTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [geminiErrorMessage, setGeminiErrorMessage] = useState('');

  // Firebase State
  const [fbConfigText, setFbConfigText] = useState('');
  const [fbConfigObj, setFbConfigObj] = useState<FirebaseConfig | null>(null);
  const [fbSaved, setFbSaved] = useState(false);
  const [fbTestStatus, setFbTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [fbErrorMessage, setFbErrorMessage] = useState('');
  const [isBulkSyncing, setIsBulkSyncing] = useState(false);
  const [bulkSyncResult, setBulkSyncResult] = useState<string | null>(null);

  useEffect(() => {
    setApiKey(getStoredGeminiKey());
    const existingFb = getStoredFirebaseConfig();
    setFbConfigObj(existingFb);
    if (existingFb) {
      setFbConfigText(JSON.stringify(existingFb, null, 2));
    }
  }, [isOpen]);

  // Handle Gemini
  const handleSaveGemini = () => {
    setStoredGeminiKey(apiKey);
    setGeminiSaved(true);
    setTimeout(() => setGeminiSaved(false), 2000);
  };

  const handleTestGemini = async () => {
    if (!apiKey.trim()) {
      alert('請先輸入 Gemini API Key');
      return;
    }
    setGeminiTestStatus('testing');
    setGeminiErrorMessage('');
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
      setGeminiTestStatus('success');
      setStoredGeminiKey(apiKey);
    } catch (err: any) {
      setGeminiTestStatus('error');
      setGeminiErrorMessage(err.message || '測試失敗');
    }
  };

  // Handle Firebase
  const handleParseAndSaveFirebase = () => {
    setFbErrorMessage('');
    if (!fbConfigText.trim()) {
      setStoredFirebaseConfig(null);
      setFbConfigObj(null);
      setFbSaved(true);
      setTimeout(() => setFbSaved(false), 2000);
      return;
    }

    try {
      let parsed: any;
      const clean = fbConfigText
        .replace(/const\s+firebaseConfig\s*=\s*/, '')
        .replace(/;?\s*$/, '')
        .trim();

      // Relaxed JSON / JS object parse
      try {
        parsed = JSON.parse(clean);
      } catch {
        // Evaluate JS object safely
        const fn = new Function(`return (${clean});`);
        parsed = fn();
      }

      if (!parsed || !parsed.apiKey || !parsed.projectId) {
        throw new Error('設定缺少 apiKey 或 projectId 欄位');
      }

      const formatted: FirebaseConfig = {
        apiKey: parsed.apiKey,
        authDomain: parsed.authDomain || `${parsed.projectId}.firebaseapp.com`,
        projectId: parsed.projectId,
        storageBucket: parsed.storageBucket || `${parsed.projectId}.firebasestorage.app`,
        messagingSenderId: parsed.messagingSenderId || '',
        appId: parsed.appId || '',
      };

      setStoredFirebaseConfig(formatted);
      setFbConfigObj(formatted);
      setFbConfigText(JSON.stringify(formatted, null, 2));
      initFirebase();
      setFbSaved(true);
      setTimeout(() => setFbSaved(false), 2000);
    } catch (err: any) {
      setFbErrorMessage(`解析失敗：${err.message}。請確認貼上的 Firebase Config 格式是否正確。`);
    }
  };

  const handleTestFirebase = async () => {
    setFbTestStatus('testing');
    setFbErrorMessage('');
    try {
      handleParseAndSaveFirebase();
      const res = initFirebase();
      if (!res) {
        throw new Error('Firebase 初始化失敗，請確認設定內容');
      }
      setFbTestStatus('success');
      onCloudSyncSuccess?.();
    } catch (err: any) {
      setFbTestStatus('error');
      setFbErrorMessage(err.message || '連線測試失敗');
    }
  };

  const handleBulkSyncToCloud = async () => {
    setIsBulkSyncing(true);
    setBulkSyncResult(null);
    try {
      const res = await syncAllLocalItemsToCloud(items, todos);
      if (res.success) {
        setBulkSyncResult(`✅ 成功將 ${res.itemsCount} 項物品與 ${res.todosCount} 項待辦同步至 Firebase 雲端！`);
        onCloudSyncSuccess?.();
      } else {
        setBulkSyncResult('❌ 雲端同步失敗，請確認 Firestore 安全性規則已開放或設定正確。');
      }
    } catch (err: any) {
      setBulkSyncResult(`❌ 同步發生錯誤：${err.message}`);
    } finally {
      setIsBulkSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-gray-200 flex flex-col max-h-[90vh] my-auto">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">系統與雲端同步設定</h3>
              <p className="text-[11px] text-gray-500">Google Firebase 跨手機同步 ＆ Gemini AI</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="p-3 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-gray-200/80 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveTab('firebase')}
              className={`py-2 rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
                activeTab === 'firebase'
                  ? 'bg-white text-orange-600 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Cloud className="w-4 h-4" />
              <span>☁️ Firebase 雲端同步</span>
            </button>
            <button
              onClick={() => setActiveTab('gemini')}
              className={`py-2 rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
                activeTab === 'gemini'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>✨ Gemini AI 金鑰</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Firebase Cloud Sync */}
        {activeTab === 'firebase' && (
          <div className="p-5 space-y-4 text-xs text-gray-600 overflow-y-auto flex-1">
            {/* Status Banner */}
            <div className={`p-3.5 rounded-2xl border flex items-start space-x-2.5 ${
              fbConfigObj 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950' 
                : 'bg-amber-50 border-amber-200 text-amber-950'
            }`}>
              {fbConfigObj ? (
                <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <Cloud className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-0.5">
                <p className="font-bold text-xs">
                  {fbConfigObj ? '🔥 Firebase 雲端即時同步已就緒' : '尚未設定 Firebase 雲端專案'}
                </p>
                <p className="text-[11px] opacity-90 leading-relaxed">
                  {fbConfigObj 
                    ? `專案 ID: ${fbConfigObj.projectId}。全家人手機新增的物品、照片與待辦事項將即時雙向同步！` 
                    : '只要貼上您 Firebase 專案的 SDK 設定，全家手機即可享受即時雲端同步與照片雲端庫！'}
                </p>
              </div>
            </div>

            {/* Input Config Area */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-gray-800 flex items-center space-x-1">
                  <Database className="w-3.5 h-3.5 text-orange-600" />
                  <span>貼上 Firebase Config (JSON 或 JavaScript 程式碼)</span>
                </label>
                <a
                  href="https://console.firebase.google.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-orange-600 hover:underline font-normal text-[11px]"
                >
                  前往 Firebase 主控台 ➔
                </a>
              </div>

              <textarea
                rows={6}
                value={fbConfigText}
                onChange={(e) => setFbConfigText(e.target.value)}
                placeholder={`貼上 Firebase Console 中的設定，例如：\n{\n  "apiKey": "AIzaSy...",\n  "authDomain": "home-assistant.firebaseapp.com",\n  "projectId": "home-assistant-12345",\n  "storageBucket": "home-assistant.appspot.com",\n  "appId": "1:12345:web:..."\n}`}
                className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-xs font-mono text-gray-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-500"
              />
              <p className="text-[10px] text-gray-400">
                💡 可在 Firebase Console ➔ 專案設定 ➔ 您的應用程式 ➔ 複製 <code>firebaseConfig</code> 物件直接貼上。
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2 pt-1">
              <button
                type="button"
                onClick={handleTestFirebase}
                disabled={fbTestStatus === 'testing' || !fbConfigText.trim()}
                className="flex-1 px-3 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold flex items-center justify-center space-x-1.5 transition-all disabled:opacity-50"
              >
                {fbTestStatus === 'testing' ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>測試連線中...</span>
                  </>
                ) : (
                  <>
                    <Cloud className="w-3.5 h-3.5 text-orange-600" />
                    <span>測試並儲存連線</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleParseAndSaveFirebase}
                className="flex-1 px-3 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold flex items-center justify-center space-x-1.5 transition-all shadow-xs"
              >
                {fbSaved ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>已儲存設定！</span>
                  </>
                ) : (
                  <span>儲存 Firebase 設定</span>
                )}
              </button>
            </div>

            {/* Error Message */}
            {fbErrorMessage && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center space-x-2 font-medium">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{fbErrorMessage}</span>
              </div>
            )}

            {/* One-click Full Cloud Sync */}
            {fbConfigObj && (
              <div className="pt-2 border-t border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-800 flex items-center space-x-1">
                    <UploadCloud className="w-3.5 h-3.5 text-blue-600" />
                    <span>本機庫存一鍵上傳至雲端</span>
                  </span>
                  <span className="text-[10px] text-gray-400">目前有 {items.length} 件物品</span>
                </div>
                <button
                  type="button"
                  onClick={handleBulkSyncToCloud}
                  disabled={isBulkSyncing}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold flex items-center justify-center space-x-1.5 shadow-sm active:scale-98 transition-all disabled:opacity-50"
                >
                  {isBulkSyncing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>正在同步全家物品至 Firebase...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      <span>將現有 {items.length} 件物品全部上傳至 Firebase 雲端</span>
                    </>
                  )}
                </button>
                {bulkSyncResult && (
                  <p className="text-[11px] font-semibold text-blue-900 bg-blue-50 p-2 rounded-lg">
                    {bulkSyncResult}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Gemini API Key */}
        {activeTab === 'gemini' && (
          <div className="p-5 space-y-4 text-xs text-gray-600 overflow-y-auto flex-1">
            <div className="p-3.5 bg-blue-50 border border-blue-100 rounded-2xl space-y-1.5">
              <div className="flex items-center space-x-2 text-blue-900 font-bold">
                <Cpu className="w-4 h-4 text-blue-600" />
                <span>雙核心 AI 解析架構</span>
              </div>
              <p className="text-[11px] text-blue-700 leading-relaxed">
                系統內建「高家專屬本地智慧語意引擎」，未填寫金鑰時亦能自動辨識家庭成員（瑋、珍、朋、淨、炘、豐、柔）、樓層空間、效期與數量。
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-gray-800 flex items-center justify-between">
                <span>Google Gemini API Key</span>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline font-normal text-[11px]"
                >
                  免費取得 Key ➔
                </a>
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="貼上 AI Studio 的 Gemini API Key..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono text-xs"
              />
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <button
                type="button"
                onClick={handleTestGemini}
                disabled={geminiTestStatus === 'testing'}
                className="flex-1 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold flex items-center justify-center space-x-1 transition-all"
              >
                {geminiTestStatus === 'testing' ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>測試中...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>測試連線</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleSaveGemini}
                className="flex-1 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center space-x-1 transition-all shadow-xs"
              >
                {geminiSaved ? <span>已儲存！</span> : <span>儲存設定</span>}
              </button>
            </div>

            {geminiTestStatus === 'success' && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center space-x-2 font-medium">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Gemini 2.5 Flash API 連線成功！已啟用頂級多模態分析。</span>
              </div>
            )}

            {geminiTestStatus === 'error' && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center space-x-2 font-medium">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{geminiErrorMessage}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};