import React, { useState, useEffect } from 'react';
import { 
  InventoryItem, 
  TodoItem, 
  LineWeeklyBriefing, 
  GoogleSheetsSyncStatus,
  FamilyMember,
  FAMILY_MEMBERS_CONFIG
} from '../types';
import { KAO_LOCATION_STRUCTURE } from '../data/initialData';
import { DataAnalytics } from './DataAnalytics';
import { 
  Database, 
  Table, 
  HardDrive, 
  Share2, 
  Nfc, 
  Sparkles, 
  Copy, 
  Check, 
  Send, 
  Download, 
  RefreshCw, 
  Layers, 
  Image as ImageIcon,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  FileSpreadsheet,
  ExternalLink,
  ShieldCheck,
  PieChart as PieChartIcon
} from 'lucide-react';

interface BackstageProps {
  items: InventoryItem[];
  todos: TodoItem[];
  activeMember: FamilyMember;
  onRefreshItems: () => void;
}

export const Backstage: React.FC<BackstageProps> = ({
  items,
  todos,
  activeMember,
}) => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'line_spark' | 'sheets_drive' | 'photos_storage' | 'locations' | 'nfc'>('analytics');

  // LINE Briefing State
  const [briefing, setBriefing] = useState<LineWeeklyBriefing | null>(null);
  const [isGeneratingBriefing, setIsGeneratingBriefing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isPushingLine, setIsPushingLine] = useState(false);
  const [pushSuccessMsg, setPushSuccessMsg] = useState<string | null>(null);

  // Google Sheets Sync State
  const [syncStatus, setSyncStatus] = useState<GoogleSheetsSyncStatus>({
    lastSyncedAt: '2026-08-28 17:00:00',
    spreadsheetId: '1KaoFamily_SmartButler_Inventory_2026',
    spreadsheetTitle: '高家智慧管家_全家物品總表.gsheet',
    rowCount: items.length,
    isSyncing: false,
  });

  // Generate LINE Briefing on load or on button click
  const fetchBriefing = async () => {
    setIsGeneratingBriefing(true);
    try {
      const response = await fetch('/api/gemini/briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, todos }),
      });
      const data = await response.json();
      setBriefing(data);
    } catch (e) {
      console.warn('Failed to fetch briefing:', e);
    } finally {
      setIsGeneratingBriefing(false);
    }
  };

  useEffect(() => {
    fetchBriefing();
  }, [items, todos]);

  // Copy LINE message to clipboard
  const handleCopyLineText = () => {
    if (!briefing?.lineFormattedText) return;
    navigator.clipboard.writeText(briefing.lineFormattedText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Simulate pushing to LINE Official Account Webhook
  const handlePushLineWebhook = async () => {
    if (!briefing?.lineFormattedText) return;
    setIsPushingLine(true);
    try {
      const response = await fetch('/api/line/push-simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: briefing.lineFormattedText,
          targetGroup: '高家大小事 LINE 群組 (瑋、珍、朋、淨、炘、豐、柔)',
        }),
      });
      const resData = await response.json();
      setPushSuccessMsg(`✅ 已成功透過 LINE 官方帳號推播至【高家大小事群組】！`);
      setTimeout(() => setPushSuccessMsg(null), 4000);
    } catch (e) {
      console.warn(e);
    } finally {
      setIsPushingLine(false);
    }
  };

  // Trigger Google Sheets Sync
  const handleSyncSheets = async () => {
    setSyncStatus((prev) => ({ ...prev, isSyncing: true }));
    try {
      const response = await fetch('/api/sync/google-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, todos }),
      });
      const data = await response.json();
      setSyncStatus({
        lastSyncedAt: new Date().toLocaleTimeString('zh-TW'),
        spreadsheetId: data.spreadsheetId,
        spreadsheetTitle: '高家智慧管家_全家物品總表.gsheet',
        rowCount: data.syncedRows,
        isSyncing: false,
      });
    } catch (e) {
      console.warn(e);
      setSyncStatus((prev) => ({ ...prev, isSyncing: false }));
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = ['序號', '物品名稱', '類別', '擁有者', '登錄者', '總數量', '單位', '存放地點', '保存保固日', '可用時長', '標籤'];
    const rows = items.map((it, idx) => [
      idx + 1,
      `"${it.name.replace(/"/g, '""')}"`,
      it.category,
      it.owner,
      it.recordedBy,
      it.totalQuantity,
      it.unit,
      `"${it.locations.map((l) => l.fullPath).join('; ')}"`,
      it.expiryDate || it.warrantyDate || '無',
      it.estimatedLifespanWeeks ? `${it.estimatedLifespanWeeks}週` : '-',
      `"${it.tags.join(', ')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `高家智慧管家_庫存清單_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Backstage Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl p-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-white/10 text-white">
                <Database className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold tracking-tight">高家智慧後台管理中心</h2>
            </div>
            <p className="text-xs text-gray-300">
              自動備份 Google 雲端硬碟 • LINE 每週一/五推播 • 試算表即時連線
            </p>
          </div>

          <div className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-semibold flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>雲端自動同步中</span>
          </div>
        </div>

        {/* Backstage Sub Tabs */}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center space-x-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'analytics', label: '庫存與成員圖表分析', icon: PieChartIcon },
            { id: 'line_spark', label: 'LINE 推播 & Spark 簡報', icon: Send },
            { id: 'sheets_drive', label: 'Google 試算表 & 雲端硬碟', icon: FileSpreadsheet },
            { id: 'photos_storage', label: 'Firebase 照片儲存庫', icon: ImageIcon },
            { id: 'locations', label: '高家樓層空間配置', icon: Layers },
            { id: 'nfc', label: 'NFC 標籤管理', icon: Nfc },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSel = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center space-x-1.5 transition-all ${
                  isSel
                    ? 'bg-white text-gray-950 shadow-xs'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 0: Data Visualization & Analytics (On-Demand) */}
      {activeTab === 'analytics' && (
        <DataAnalytics items={items} />
      )}

      {/* Tab 1: LINE & Gemini Spark Weekly Briefing */}
      {activeTab === 'line_spark' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900 flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>每週一與週五 Gemini Spark 自動家庭快報</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  整合 3天內過期食品、當月過期、剩餘 &le; 2週醫療耗材與待辦事項
                </p>
              </div>

              <button
                onClick={fetchBriefing}
                disabled={isGeneratingBriefing}
                className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold flex items-center space-x-1 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingBriefing ? 'animate-spin' : ''}`} />
                <span>重新生成分析</span>
              </button>
            </div>

            {/* Notification preview box (Line style) */}
            <div className="bg-[#1e1e1e] text-emerald-400 p-4 rounded-2xl font-mono text-xs leading-relaxed whitespace-pre-wrap shadow-inner border border-gray-800">
              {isGeneratingBriefing ? 'Spark AI 正在為高家整理週一/週五推播簡報...' : briefing?.lineFormattedText}
            </div>

            {/* Push / Copy Actions */}
            <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
              <span className="text-[11px] text-gray-400">
                推播對象：高家大小事 LINE 官方群組 (瑋、珍、朋、淨、炘、豐、柔)
              </span>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCopyLineText}
                  className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-2xs"
                >
                  {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{isCopied ? '已複製到剪貼簿' : '複製推播文字'}</span>
                </button>

                <button
                  onClick={handlePushLineWebhook}
                  disabled={isPushingLine}
                  className="px-4 py-2 rounded-xl bg-[#06c755] hover:bg-[#05b34c] text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm active:scale-98 transition-all disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isPushingLine ? '發送中...' : '發送推播測試至 LINE'}</span>
                </button>
              </div>
            </div>

            {pushSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-bold flex items-center space-x-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{pushSuccessMsg}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Google Sheets & Google Drive */}
      {activeTab === 'sheets_drive' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900 flex items-center space-x-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Google 試算表 (Google Sheets) 即時同步總表</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  物品名稱、類別、存放地點、保存保固期限、擁有者自動歸檔
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleExportCsv}
                  className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold flex items-center space-x-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>匯出 CSV</span>
                </button>

                <button
                  onClick={handleSyncSheets}
                  disabled={syncStatus.isSyncing}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center space-x-1 shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncStatus.isSyncing ? 'animate-spin' : ''}`} />
                  <span>{syncStatus.isSyncing ? '同步中...' : '立即同步 Google 試算表'}</span>
                </button>
              </div>
            </div>

            {/* Google Drive Folder Schema View */}
            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 flex items-center justify-between text-xs text-blue-900">
              <div className="flex items-center space-x-2">
                <HardDrive className="w-4 h-4 text-blue-600" />
                <span className="font-bold">雲端硬碟路徑：Google Drive / 高家智能管家備份資料夾 /</span>
              </div>
              <span className="text-[11px] font-semibold text-blue-700">自動排程備份中</span>
            </div>

            {/* Live Sheets Table Preview */}
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                  <tr>
                    <th className="p-2.5">序號</th>
                    <th className="p-2.5">照片</th>
                    <th className="p-2.5">物品名稱</th>
                    <th className="p-2.5">類別</th>
                    <th className="p-2.5">擁有者</th>
                    <th className="p-2.5">存放地點</th>
                    <th className="p-2.5">數量</th>
                    <th className="p-2.5">期限/保固</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-800">
                  {items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="p-2.5 text-gray-400">{idx + 1}</td>
                      <td className="p-2.5">
                        {item.closeUpPhotoUrl || item.widePhotoUrl ? (
                          <img
                            src={item.closeUpPhotoUrl || item.widePhotoUrl}
                            alt={item.name}
                            className="w-10 h-10 object-cover rounded-lg border border-gray-200 shadow-2xs"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-[10px]">
                            無圖
                          </div>
                        )}
                      </td>
                      <td className="p-2.5 font-bold text-gray-900">{item.name}</td>
                      <td className="p-2.5">
                        <span className="px-2 py-0.5 rounded bg-gray-100 text-[10px] font-semibold">
                          {item.category}
                        </span>
                      </td>
                      <td className="p-2.5 font-bold">{item.owner}</td>
                      <td className="p-2.5 max-w-[200px] truncate text-gray-600">
                        {item.locations.map((l) => l.fullPath).join('、')}
                      </td>
                      <td className="p-2.5 font-bold">
                        {item.totalQuantity} {item.unit}
                      </td>
                      <td className="p-2.5 text-gray-600">
                        {item.expiryDate || item.warrantyDate || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Firebase Storage Photo Vault */}
      {activeTab === 'photos_storage' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900 flex items-center space-x-1.5">
                  <ImageIcon className="w-4 h-4 text-orange-500" />
                  <span>Firebase Storage 圖片與照片整理庫</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  儲存每件物品的「近照」與「環境遠照」，搭配 Gemini Spark 進行視覺辨識
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {items
                .filter((it) => it.closeUpPhotoUrl || it.widePhotoUrl)
                .map((it) => (
                  <div
                    key={it.id}
                    className="p-2 bg-gray-50 rounded-xl border border-gray-200 space-y-1.5"
                  >
                    <div className="aspect-4/3 rounded-lg overflow-hidden bg-gray-200 relative">
                      <img
                        src={it.closeUpPhotoUrl || it.widePhotoUrl}
                        alt={it.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded bg-black/60 text-white text-[9px]">
                        歸屬: {it.owner}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-gray-900 truncate">{it.name}</p>
                    <p className="text-[10px] text-gray-500 truncate">
                      {it.locations[0]?.fullPath}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Location Hierarchy Map */}
      {activeTab === 'locations' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-gray-900 flex items-center space-x-1.5">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>高家樓層與空間收納結構樹 (白色塑膠櫃4層/5層/冰箱/鐵架)</span>
            </h3>

            <div className="space-y-3">
              {KAO_LOCATION_STRUCTURE.map((floor) => (
                <div key={floor.floor} className="border border-gray-200 rounded-xl p-3 bg-gray-50/50 space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded-lg bg-blue-600 text-white text-xs font-extrabold">
                      {floor.floor}
                    </span>
                    <span className="text-xs font-bold text-gray-700">共 {floor.rooms.length} 個空間</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {floor.rooms.map((rm) => (
                      <div key={rm.name} className="p-2.5 bg-white rounded-xl border border-gray-200 space-y-1.5">
                        <h4 className="text-xs font-bold text-gray-900 flex items-center justify-between">
                          <span>🚪 {rm.name}</span>
                          <span className="text-[10px] text-gray-400 font-normal">{rm.storageUnits.length} 個櫃位</span>
                        </h4>
                        <div className="space-y-1">
                          {rm.storageUnits.map((unit) => (
                            <div key={unit.name} className="p-1.5 rounded-lg bg-gray-50 border border-gray-100 text-[11px]">
                              <p className="font-bold text-gray-800">📦 {unit.name}</p>
                              {unit.description && <p className="text-[10px] text-gray-400">{unit.description}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: NFC Manager */}
      {activeTab === 'nfc' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-gray-900 flex items-center space-x-1.5">
              <Nfc className="w-4 h-4 text-blue-600" />
              <span>NFC 晶片標籤綁定與感應管理</span>
            </h3>
            <p className="text-xs text-gray-500">
              將 NFC 標籤貼在「白色塑膠4層櫃第2層」或特定物品上，手機碰一下即可自動跳出卡片或快速減少數量！
            </p>

            <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-xs text-blue-900 space-y-1">
              <p className="font-bold">✨ NFC 運作模式說明：</p>
              <p>1. 支援 Web NFC API（Chrome on Android / iOS 捷徑讀取）。</p>
              <p>2. 於前台導航列點擊 NFC 圖案即可啟動感應。</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
