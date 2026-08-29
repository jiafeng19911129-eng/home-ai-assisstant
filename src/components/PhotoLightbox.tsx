import React from 'react';
import { InventoryItem, FAMILY_MEMBERS_CONFIG } from '../types';
import { X, MapPin, Tag } from 'lucide-react';

interface PhotoLightboxProps {
  item: InventoryItem | null;
  onClose: () => void;
}

export const PhotoLightbox: React.FC<PhotoLightboxProps> = ({ item, onClose }) => {
  if (!item) return null;

  const ownerConfig = FAMILY_MEMBERS_CONFIG[item.owner] || FAMILY_MEMBERS_CONFIG['瑋'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${ownerConfig.badgeBg}`}>
                歸屬: {item.owner}
              </span>
              <h3 className="text-base font-bold text-gray-900">{item.name}</h3>
            </div>
            <p className="text-xs text-gray-500 mt-0.5 flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>{item.locations.map((l) => l.fullPath).join('、')}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Photos side by side */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {item.closeUpPhotoUrl && (
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-gray-700 flex items-center justify-between">
                  <span>🔍 近照 (物品細節)</span>
                  <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded font-bold">
                    已存入 Firebase
                  </span>
                </div>
                <div className="rounded-2xl overflow-hidden aspect-4/3 bg-gray-100 border border-gray-200 shadow-inner">
                  <img
                    src={item.closeUpPhotoUrl}
                    alt={`${item.name} 近照`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            {item.widePhotoUrl && (
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-gray-700 flex items-center justify-between">
                  <span>🏠 遠照 (存放環境與櫃位)</span>
                  <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded font-bold">
                    環境標定
                  </span>
                </div>
                <div className="rounded-2xl overflow-hidden aspect-4/3 bg-gray-100 border border-gray-200 shadow-inner">
                  <img
                    src={item.widePhotoUrl}
                    alt={`${item.name} 遠照環境`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
          </div>

          {/* AI Analysis Summary Note if available */}
          {item.aiAnalysisSummary && (
            <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 text-xs text-blue-900 space-y-1">
              <span className="font-bold">✨ Gemini Spark AI 整理摘要：</span>
              <p className="text-blue-800">{item.aiAnalysisSummary}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
