import React, { useState } from 'react';
import { InventoryItem, FAMILY_MEMBERS_CONFIG } from '../types';
import { Minus, Plus, MapPin, X, Check, ArrowRight, Trash2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ConsumeModalProps {
  isOpen: boolean;
  item: InventoryItem | null;
  onClose: () => void;
  onUpdateItem: (updated: InventoryItem) => void;
  onDeleteItem?: (itemId: string) => void;
}

export const ConsumeModal: React.FC<ConsumeModalProps> = ({
  isOpen,
  item,
  onClose,
  onUpdateItem,
  onDeleteItem,
}) => {
  if (!isOpen || !item) return null;

  const [selectedLocId, setSelectedLocId] = useState<string>(item.locations[0]?.id || '');
  const [consumeAmount, setConsumeAmount] = useState<number>(1);
  const [isRelocating, setIsRelocating] = useState<boolean>(false);
  const [newLocationPath, setNewLocationPath] = useState<string>('');

  const targetLoc = item.locations.find((l) => l.id === selectedLocId) || item.locations[0];

  const handleConfirmConsume = () => {
    if (!targetLoc) return;
    const newLocQty = Math.max(0, targetLoc.quantity - consumeAmount);
    targetLoc.quantity = newLocQty;
    
    // Recalculate total quantity
    item.totalQuantity = item.locations.reduce((sum, l) => sum + l.quantity, 0);
    item.updatedAt = new Date().toISOString();

    onUpdateItem({ ...item });
    confetti({ particleCount: 35, spread: 50, origin: { y: 0.6 } });
    onClose();
  };

  const handleConfirmMove = () => {
    if (!newLocationPath.trim() || !targetLoc) return;
    targetLoc.fullPath = newLocationPath.trim();
    item.updatedAt = new Date().toISOString();
    onUpdateItem({ ...item });
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
    onClose();
  };

  const ownerConfig = FAMILY_MEMBERS_CONFIG[item.owner] || FAMILY_MEMBERS_CONFIG['瑋'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className={`bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border-2 ${ownerConfig.cardBorder}`}>
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-gray-200 flex items-center justify-between">
          <div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${ownerConfig.badgeBg}`}>
              歸屬: {item.owner}
            </span>
            <h3 className="text-base font-bold text-gray-900 mt-1">{item.name}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Toggle: 拿取/消耗 vs 移動位置 */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-gray-100 rounded-xl text-xs font-bold">
            <button
              onClick={() => setIsRelocating(false)}
              className={`py-1.5 rounded-lg transition-all ${
                !isRelocating ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500'
              }`}
            >
              拿取 / 消耗數量
            </button>
            <button
              onClick={() => setIsRelocating(true)}
              className={`py-1.5 rounded-lg transition-all ${
                isRelocating ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500'
              }`}
            >
              移動存放位置
            </button>
          </div>

          {/* Location Picker (if item stored in multiple places) */}
          {item.locations.length > 1 && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600">選擇操作的存放地點：</label>
              <div className="space-y-1">
                {item.locations.map((loc) => (
                  <button
                    key={loc.id}
                    onClick={() => setSelectedLocId(loc.id)}
                    className={`w-full p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all ${
                      selectedLocId === loc.id
                        ? 'border-blue-600 bg-blue-50/50 text-blue-900 ring-1 ring-blue-500'
                        : 'border-gray-200 bg-white text-gray-700'
                    }`}
                  >
                    <span>📍 {loc.fullPath}</span>
                    <span className="font-bold">現存 {loc.quantity} {loc.unit}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {!isRelocating ? (
            /* Consume / Decrease Section */
            <div className="space-y-3 bg-[#f9f9fb] p-4 rounded-2xl border border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700">本次拿取/消耗數量：</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setConsumeAmount(Math.max(1, consumeAmount - 1))}
                    className="w-8 h-8 rounded-full bg-white border border-gray-300 flex items-center justify-center font-bold text-gray-700 active:scale-95 shadow-2xs"
                  >
                    -
                  </button>
                  <span className="w-10 text-center font-extrabold text-base text-gray-900">
                    {consumeAmount}
                  </span>
                  <button
                    onClick={() => setConsumeAmount(Math.min(targetLoc.quantity, consumeAmount + 1))}
                    className="w-8 h-8 rounded-full bg-white border border-gray-300 flex items-center justify-center font-bold text-gray-700 active:scale-95 shadow-2xs"
                  >
                    +
                  </button>
                  <span className="text-xs text-gray-500">{item.unit}</span>
                </div>
              </div>

              <p className="text-[11px] text-gray-400">
                扣除後該位置剩餘：{Math.max(0, targetLoc.quantity - consumeAmount)} {item.unit}
              </p>
            </div>
          ) : (
            /* Relocation Section */
            <div className="space-y-2.5 bg-[#f9f9fb] p-4 rounded-2xl border border-gray-200">
              <label className="text-xs font-bold text-gray-700 flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>移動至新地點（如：1樓客廳白色塑膠5層櫃第1層）：</span>
              </label>
              <input
                type="text"
                defaultValue={targetLoc.fullPath}
                onChange={(e) => setNewLocationPath(e.target.value)}
                placeholder="輸入新存放位置..."
                className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-100 transition-colors"
          >
            取消
          </button>

          {!isRelocating ? (
            <button
              onClick={handleConfirmConsume}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs active:scale-98 transition-all flex items-center space-x-1"
            >
              <Check className="w-4 h-4" />
              <span>確認扣減消耗</span>
            </button>
          ) : (
            <button
              onClick={handleConfirmMove}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs active:scale-98 transition-all flex items-center space-x-1"
            >
              <Check className="w-4 h-4" />
              <span>確認移動位置</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
