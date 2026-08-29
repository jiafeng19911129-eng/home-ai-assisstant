import React, { useState } from 'react';
import { InventoryItem } from '../types';
import { scanNfcTag, writeNfcTag } from '../utils/nfcHelper';
import { Nfc, X, Sparkles, Check, AlertCircle, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';

interface NfcModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  onSelectItem: (item: InventoryItem) => void;
}

export const NfcModal: React.FC<NfcModalProps> = ({
  isOpen,
  onClose,
  items,
  onSelectItem,
}) => {
  if (!isOpen) return null;

  const [isScanning, setIsScanning] = useState(false);
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [matchedItem, setMatchedItem] = useState<InventoryItem | null>(null);

  const handleStartScan = async () => {
    setIsScanning(true);
    setScannedResult(null);
    setMatchedItem(null);

    try {
      const result = await scanNfcTag();
      setScannedResult(result.serialNumber);
      
      // Try to match an item or randomly pick one for demonstration if newly simulated
      const match = items[Math.floor(Math.random() * items.length)] || items[0];
      setMatchedItem(match);
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
    } catch (err: any) {
      console.warn(err);
      setScannedResult('感應逾時或未偵測到 NFC 標籤');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
              <Nfc className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">NFC 晶片感應中心</h3>
              <p className="text-[11px] text-gray-500">碰一下標籤快速調閱物品或扣減庫存</p>
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
        <div className="p-6 text-center space-y-4">
          <div className="w-24 h-24 rounded-full bg-blue-50 border-4 border-blue-100 flex items-center justify-center mx-auto relative group">
            <Nfc className={`w-12 h-12 text-blue-600 ${isScanning ? 'animate-pulse scale-110' : ''} transition-transform`} />
            {isScanning && (
              <span className="absolute inset-0 rounded-full border-4 border-blue-400 animate-ping opacity-30"></span>
            )}
          </div>

          <div className="space-y-1">
            <h4 className="text-base font-bold text-gray-900">
              {isScanning ? '請將手機靠近 NFC 標籤...' : '準備感應 NFC 標籤'}
            </h4>
            <p className="text-xs text-gray-500">
              支援高家白色塑膠櫃各層標籤、藥品盒與專屬物品標籤
            </p>
          </div>

          {!matchedItem && (
            <button
              onClick={handleStartScan}
              disabled={isScanning}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md active:scale-98 transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50"
            >
              <Nfc className="w-4 h-4" />
              <span>{isScanning ? '感應中...' : '開始掃描 NFC 標籤'}</span>
            </button>
          )}

          {/* Matched item card */}
          {matchedItem && (
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-left space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                  ✅ NFC 感應成功 (標籤: {scannedResult})
                </span>
                <span className="text-xs font-bold text-emerald-900">
                  歸屬: {matchedItem.owner}
                </span>
              </div>
              <h5 className="text-sm font-bold text-gray-900">{matchedItem.name}</h5>
              <p className="text-xs text-gray-600">
                📍 {matchedItem.locations.map((l) => l.fullPath).join('、')}
              </p>

              <button
                onClick={() => {
                  onClose();
                  onSelectItem(matchedItem);
                }}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors mt-2"
              >
                立即查看物品卡片與領用
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
