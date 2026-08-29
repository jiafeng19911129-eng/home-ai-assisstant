import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  InventoryItem, 
  FAMILY_MEMBERS_CONFIG, 
  CATEGORY_LABELS, 
  ItemCategory, 
  FamilyMember 
} from '../types';
import { KAO_LOCATION_STRUCTURE } from '../data/initialData';
import { SpeechRecognizer } from '../utils/speechRecognition';
import { 
  X, 
  Search, 
  Mic, 
  MicOff, 
  Tag, 
  MapPin, 
  Clock, 
  ExternalLink, 
  Layers, 
  Sparkles, 
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  SlidersHorizontal
} from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  initialTag?: string;
  onOpenConsumeModal: (item: InventoryItem) => void;
  onViewPhotoLightbox: (item: InventoryItem) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  items,
  initialTag,
  onOpenConsumeModal,
  onViewPhotoLightbox,
}) => {
  const [searchQuery, setSearchQuery] = useState(initialTag || '');
  const [selectedTag, setSelectedTag] = useState<string | null>(initialTag || null);
  const [selectedFloor, setSelectedFloor] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [selectedOwner, setSelectedOwner] = useState<FamilyMember | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiSearchResultNote, setAiSearchResultNote] = useState<string | null>(null);

  const speechRecognizerRef = useRef<SpeechRecognizer | null>(null);

  useEffect(() => {
    if (initialTag) {
      setSearchQuery(initialTag);
      setSelectedTag(initialTag);
    }
  }, [initialTag]);

  useEffect(() => {
    speechRecognizerRef.current = new SpeechRecognizer();
    return () => {
      speechRecognizerRef.current?.stop();
    };
  }, []);

  // Hierarchical Tags extraction from Kao Location Structure
  const locationHierarchyTags = useMemo(() => {
    const floors: string[] = [];
    const roomsMap: Record<string, string[]> = {};
    const unitsMap: Record<string, string[]> = {};

    KAO_LOCATION_STRUCTURE.forEach((fl) => {
      floors.push(fl.floor);
      roomsMap[fl.floor] = [];
      fl.rooms.forEach((rm) => {
        const fullRoomKey = `${fl.floor}${rm.name}`;
        roomsMap[fl.floor].push(rm.name);
        unitsMap[fullRoomKey] = rm.storageUnits.map((u) => u.name);
      });
    });

    return { floors, roomsMap, unitsMap };
  }, []);

  // Filtered Items (Client-side offline-first)
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return items.filter((item) => {
      // 1. Tag filter if selected
      if (selectedTag) {
        const hasTag =
          item.tags?.some((t) => t.includes(selectedTag)) ||
          item.locations?.some((l) => l.fullPath.includes(selectedTag)) ||
          item.owner === selectedTag;
        if (!hasTag) return false;
      }

      // 2. Floor filter
      if (selectedFloor) {
        const matchesFloor = item.locations.some((l) => l.floor === selectedFloor);
        if (!matchesFloor) return false;
      }

      // 3. Room filter
      if (selectedRoom) {
        const matchesRoom = item.locations.some((l) => l.room === selectedRoom);
        if (!matchesRoom) return false;
      }

      // 4. Storage Unit filter
      if (selectedUnit) {
        const matchesUnit = item.locations.some((l) => l.storageUnit.includes(selectedUnit));
        if (!matchesUnit) return false;
      }

      // 5. Owner filter
      if (selectedOwner && item.owner !== selectedOwner) {
        return false;
      }

      // 6. Text query matching (Name, Locations, Tags, Notes, Owners)
      if (q) {
        const nameMatch = item.name.toLowerCase().includes(q);
        const locMatch = item.locations.some((l) => l.fullPath.toLowerCase().includes(q));
        const tagMatch = item.tags?.some((t) => t.toLowerCase().includes(q));
        const ownerMatch = item.owner.toLowerCase().includes(q);
        const noteMatch = item.rawInputTranscript?.toLowerCase().includes(q) || item.aiAnalysisSummary?.toLowerCase().includes(q);
        return nameMatch || locMatch || tagMatch || ownerMatch || noteMatch;
      }

      return true;
    });
  }, [items, searchQuery, selectedTag, selectedFloor, selectedRoom, selectedUnit, selectedOwner]);

  if (!isOpen) return null;

  // Toggle voice search
  const handleToggleVoice = () => {
    if (isRecording) {
      speechRecognizerRef.current?.stop();
      setIsRecording(false);
    } else {
      setIsRecording(true);
      speechRecognizerRef.current?.start(
        (text) => {
          setSearchQuery(text);
        },
        (err) => {
          console.warn(err);
          setIsRecording(false);
        },
        () => {
          setIsRecording(false);
        }
      );
    }
  };

  // Trigger Gemini AI Semantic Search (when natural language needs smart interpretation)
  const handleAiSemanticSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsAiSearching(true);
    try {
      const response = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: `使用者在尋找物品：「${searchQuery}」，請分析可能關聯的物品關鍵字與存放櫃位。`,
          currentUser: '瑋',
        }),
      });
      const data = await response.json();
      if (data.itemData?.summary) {
        setAiSearchResultNote(`💡 AI 智能建議：${data.itemData.summary}`);
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setIsAiSearching(false);
    }
  };

  const handleSelectHierarchyTag = (level: 'floor' | 'room' | 'unit', val: string) => {
    if (level === 'floor') {
      setSelectedFloor(selectedFloor === val ? null : val);
      setSelectedRoom(null);
      setSelectedUnit(null);
    } else if (level === 'room') {
      setSelectedRoom(selectedRoom === val ? null : val);
      setSelectedUnit(null);
    } else if (level === 'unit') {
      setSelectedUnit(selectedUnit === val ? null : val);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedTag(null);
    setSelectedFloor(null);
    setSelectedRoom(null);
    setSelectedUnit(null);
    setSelectedOwner(null);
    setAiSearchResultNote(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#f2f2f7] w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-gray-200">
        {/* iOS Modal Header */}
        <div className="px-5 py-3.5 bg-white border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 tracking-tight">智能層級搜尋中心</h2>
              <p className="text-[11px] text-gray-500">
                單機即時搜尋 • 語音輸入 • 樓層標籤導航
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* Search Input Bar with Voice & AI button */}
          <div className="bg-white p-3 rounded-2xl border border-gray-200 space-y-2 shadow-2xs">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
              <input
                id="input-search-modal"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="輸入物品名稱、存放櫃位、家人（如：普拿疼、白色4層櫃、珍）..."
                className="w-full pl-9 pr-20 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
              />

              <div className="absolute right-2 flex items-center space-x-1">
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded-full"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleToggleVoice}
                  className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                    isRecording
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-gray-100 text-gray-600 hover:bg-amber-50 hover:text-amber-700'
                  }`}
                  title="語音辨識搜尋"
                >
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* AI Deep Search Trigger */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-gray-400">
                即時找到 {filteredItems.length} 項物品
              </span>
              <button
                type="button"
                onClick={handleAiSemanticSearch}
                disabled={isAiSearching || !searchQuery}
                className="inline-flex items-center space-x-1 text-[11px] font-bold text-amber-700 hover:text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 transition-colors disabled:opacity-40"
              >
                <Sparkles className="w-3 h-3" />
                <span>{isAiSearching ? 'AI 正在推論中...' : 'Gemini 智能語意查詢'}</span>
              </button>
            </div>

            {aiSearchResultNote && (
              <div className="p-2 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 font-medium">
                {aiSearchResultNote}
              </div>
            )}
          </div>

          {/* Hierarchical Tags Explorer (Requirement 5: 存放地點1樓客廳玄關4層櫃，可進行1樓/客廳/玄關/4層櫃各層級分類) */}
          <div className="bg-white p-3.5 rounded-2xl border border-gray-200 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-gray-800 flex items-center space-x-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>高家樓層層級收納標籤 (點選即時篩選)</span>
              </h3>
              {(selectedFloor || selectedRoom || selectedUnit || selectedTag || selectedOwner) && (
                <button
                  onClick={handleClearFilters}
                  className="text-[11px] text-blue-600 font-bold hover:underline"
                >
                  重設所有標籤
                </button>
              )}
            </div>

            {/* Level 1: Floors (1樓, 2樓, 3樓...) */}
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-gray-400">① 樓層分類</div>
              <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
                {locationHierarchyTags.floors.map((fl) => (
                  <button
                    key={fl}
                    onClick={() => handleSelectHierarchyTag('floor', fl)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                      selectedFloor === fl
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    🏢 {fl}
                  </button>
                ))}
              </div>
            </div>

            {/* Level 2: Rooms (客廳, 玄關, 廚房...) */}
            {selectedFloor && locationHierarchyTags.roomsMap[selectedFloor] && (
              <div className="space-y-1 pt-1 border-t border-gray-100 animate-fadeIn">
                <div className="text-[10px] font-bold text-blue-600">② {selectedFloor} 空間分類</div>
                <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
                  {locationHierarchyTags.roomsMap[selectedFloor].map((rm) => (
                    <button
                      key={rm}
                      onClick={() => handleSelectHierarchyTag('room', rm)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                        selectedRoom === rm
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
                      }`}
                    >
                      🚪 {selectedFloor} {rm}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Level 3: Storage Units (白色塑膠4層櫃, 5層櫃, 雙門大冰箱...) */}
            {selectedFloor && selectedRoom && locationHierarchyTags.unitsMap[`${selectedFloor}${selectedRoom}`] && (
              <div className="space-y-1 pt-1 border-t border-gray-100 animate-fadeIn">
                <div className="text-[10px] font-bold text-indigo-600">
                  ③ {selectedFloor} {selectedRoom} 櫃位/收納箱
                </div>
                <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
                  {locationHierarchyTags.unitsMap[`${selectedFloor}${selectedRoom}`].map((unit) => (
                    <button
                      key={unit}
                      onClick={() => handleSelectHierarchyTag('unit', unit)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                        selectedUnit === unit
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100'
                      }`}
                    >
                      📦 {unit}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Family Members Quick Filter */}
            <div className="space-y-1 pt-1 border-t border-gray-100">
              <div className="text-[10px] font-bold text-gray-400">④ 歸屬家人</div>
              <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
                {(['瑋', '珍', '朋', '淨', '炘', '豐', '柔'] as FamilyMember[]).map((m) => {
                  const cfg = FAMILY_MEMBERS_CONFIG[m];
                  const isSel = selectedOwner === m;
                  return (
                    <button
                      key={m}
                      onClick={() => setSelectedOwner(isSel ? null : m)}
                      className={`px-2 py-0.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                        isSel
                          ? `${cfg.avatarBg} text-white shadow-xs`
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Results List */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1">
              搜尋結果 ({filteredItems.length} 項)
            </h4>

            {filteredItems.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 border border-gray-200 text-center space-y-2">
                <Search className="w-8 h-8 text-gray-300 mx-auto" />
                <p className="text-xs font-bold text-gray-700">找不到相符的物品</p>
                <p className="text-[11px] text-gray-400">
                  請嘗試更換關鍵字或點擊「重設所有標籤」重新瀏覽。
                </p>
              </div>
            ) : (
              filteredItems.map((item) => {
                const ownerCfg = FAMILY_MEMBERS_CONFIG[item.owner] || FAMILY_MEMBERS_CONFIG['瑋'];
                const catInfo = CATEGORY_LABELS[item.category] || CATEGORY_LABELS['other'];

                return (
                  <div
                    key={item.id}
                    id={`search-card-${item.id}`}
                    className={`bg-white rounded-2xl p-3.5 border-2 ${ownerCfg.cardBorder} shadow-2xs space-y-2.5`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${catInfo.badgeColor}`}>
                            {catInfo.icon} {catInfo.label}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${ownerCfg.badgeBg}`}>
                            歸屬: {item.owner}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-gray-900 mt-1">{item.name}</h4>
                      </div>

                      <div className="px-2 py-1 rounded-lg bg-gray-100 text-xs font-bold text-gray-800">
                        {item.totalQuantity} {item.unit}
                      </div>
                    </div>

                    {/* Multi-Location Display (Requirement: If stored in 2 places, shows both on card) */}
                    <div className="bg-[#f9f9fb] p-2 rounded-xl border border-gray-200/80 space-y-1">
                      <div className="text-[11px] font-bold text-gray-600 flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-blue-600" />
                        <span>存放地點 ({item.locations.length} 個位置):</span>
                      </div>
                      {item.locations.map((loc, idx) => (
                        <div
                          key={loc.id || idx}
                          className="flex items-center justify-between text-xs bg-white px-2 py-1 rounded-lg border border-gray-100"
                        >
                          <span className="font-semibold text-gray-900">{loc.fullPath}</span>
                          <span className="text-gray-500 font-bold">
                            {loc.quantity} {loc.unit}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Tags Hyperlinks (Clicking any tag sets filter) */}
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex items-center space-x-1 flex-wrap gap-y-1">
                        <Tag className="w-3 h-3 text-gray-400" />
                        {item.tags.map((t) => (
                          <button
                            key={t}
                            onClick={() => {
                              setSelectedTag(t);
                              setSearchQuery(t);
                            }}
                            className="px-2 py-0.5 bg-gray-100 hover:bg-amber-100 hover:text-amber-900 rounded text-[10px] text-gray-600 font-medium transition-colors"
                          >
                            #{t}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                      {(item.closeUpPhotoUrl || item.widePhotoUrl) ? (
                        <button
                          onClick={() => onViewPhotoLightbox(item)}
                          className="text-[11px] font-bold text-blue-600 hover:underline"
                        >
                          查看近照/遠照 🖼️
                        </button>
                      ) : (
                        <span className="text-[10px] text-gray-400">無照片</span>
                      )}

                      <button
                        onClick={() => {
                          onClose();
                          onOpenConsumeModal(item);
                        }}
                        className="px-3 py-1 bg-gray-100 hover:bg-rose-50 hover:text-rose-700 text-xs font-bold rounded-lg transition-colors"
                      >
                        拿取 / 消耗
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
