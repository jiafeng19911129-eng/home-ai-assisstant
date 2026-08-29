import React, { useState, useMemo } from 'react';
import { 
  InventoryItem, 
  TodoItem, 
  FamilyMember, 
  FAMILY_MEMBERS_CONFIG, 
  CATEGORY_LABELS, 
  ItemCategory 
} from '../types';
import { 
  Plus, 
  Search, 
  AlertTriangle, 
  Clock, 
  MapPin, 
  Package, 
  CheckCircle2, 
  Calendar, 
  ExternalLink, 
  Minus, 
  Layers, 
  Sparkles,
  Tag,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  ChevronRight,
  Info,
  ShoppingBag,
  Receipt,
  Link as LinkIcon
} from 'lucide-react';

interface FrontstageProps {
  items: InventoryItem[];
  todos: TodoItem[];
  activeMember: FamilyMember;
  onOpenRegisterModal: () => void;
  onOpenSearchModal: (initialTag?: string) => void;
  onOpenConsumeModal: (item: InventoryItem) => void;
  onViewPhotoLightbox: (item: InventoryItem) => void;
  onToggleTodo: (todoId: string) => void;
  onSelectMemberFilter: (member: FamilyMember | 'all') => void;
  selectedMemberFilter: FamilyMember | 'all';
  lastSavedItemId?: string | null;
}

export const Frontstage: React.FC<FrontstageProps> = ({
  items,
  todos,
  activeMember,
  onOpenRegisterModal,
  onOpenSearchModal,
  onOpenConsumeModal,
  onViewPhotoLightbox,
  onToggleTodo,
  selectedMemberFilter,
  onSelectMemberFilter,
  lastSavedItemId,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | 'all'>('all');
  const [activeQuickFilter, setActiveQuickFilter] = useState<'all' | 'expiring' | 'low_stock' | 'todos'>('all');

  const todayStr = new Date().toISOString().split('T')[0];
  const today = new Date();

  // Urgent Food (< 3 days)
  const urgentFoodItems = useMemo(() => {
    return items.filter((item) => {
      if (item.category === 'food' && item.expiryDate) {
        const exp = new Date(item.expiryDate);
        const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 3600 * 24));
        return diffDays <= 3 && diffDays >= -5; // within 3 days or recently expired
      }
      return false;
    });
  }, [items, today]);

  // Low Medical Supplies (< 2 weeks)
  const lowMedicalItems = useMemo(() => {
    return items.filter(
      (item) =>
        (item.category === 'medical' || item.category === 'daily') &&
        item.estimatedLifespanWeeks !== undefined &&
        item.estimatedLifespanWeeks <= 2
    );
  }, [items]);

  // Pending Todos
  const pendingTodos = useMemo(() => {
    return todos.filter((t) => !t.isCompleted);
  }, [todos]);

  // Filtered Items
  const displayedItems = useMemo(() => {
    return items.filter((item) => {
      // Member filter
      if (selectedMemberFilter !== 'all' && item.owner !== selectedMemberFilter) {
        return false;
      }
      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      // Quick alert filter
      if (activeQuickFilter === 'expiring') {
        if (item.category !== 'food' || !item.expiryDate) return false;
        const exp = new Date(item.expiryDate);
        const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 3600 * 24));
        return diffDays <= 7;
      }
      if (activeQuickFilter === 'low_stock') {
        return (item.estimatedLifespanWeeks !== undefined && item.estimatedLifespanWeeks <= 2) || item.totalQuantity <= 1;
      }
      return true;
    });
  }, [items, selectedMemberFilter, selectedCategory, activeQuickFilter, today]);

  return (
    <div className="space-y-5 pb-20">
      {/* 1. iOS Big Hero Action Buttons (+ 登錄 and 🔍 搜尋) */}
      <div className="grid grid-cols-2 gap-3.5 pt-1">
        {/* Big Plus Button */}
        <button
          id="btn-big-register"
          onClick={onOpenRegisterModal}
          className="group relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-600 active:scale-[0.98] transition-all rounded-2xl p-4 text-left shadow-md hover:shadow-lg border border-blue-400/30 text-white"
        >
          <div className="absolute top-0 right-0 -mt-2 -mr-2 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:bg-white/20 transition-all pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner group-hover:rotate-6 transition-transform">
              <Plus className="w-7 h-7 text-white stroke-[2.5]" />
            </div>
            <span className="text-[11px] font-semibold bg-white/20 px-2 py-0.5 rounded-full text-blue-100">
              AI 智能
            </span>
          </div>
          <h2 className="text-lg font-bold tracking-tight">智能登錄</h2>
          <p className="text-xs text-blue-100/90 mt-0.5 line-clamp-1">
            雙照拍照 • 語音 • 文字分析
          </p>
        </button>

        {/* Big Search Button */}
        <button
          id="btn-big-search"
          onClick={() => onOpenSearchModal()}
          className="group relative overflow-hidden bg-white active:scale-[0.98] transition-all rounded-2xl p-4 text-left shadow-md hover:shadow-lg border border-gray-200 text-gray-900"
        >
          <div className="absolute top-0 right-0 -mt-2 -mr-2 w-24 h-24 bg-amber-500/10 rounded-full blur-xl group-hover:bg-amber-500/20 transition-all pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Search className="w-6 h-6 text-amber-600 stroke-[2.5]" />
            </div>
            <span className="text-[11px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
              層級標籤
            </span>
          </div>
          <h2 className="text-lg font-bold tracking-tight text-gray-900">物品搜尋</h2>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
            語音 / 單機 / 樓層櫃位
          </p>
        </button>
      </div>

      {/* 2. Urgent Widgets Bar (3天內過期、醫療耗材低量、家庭待辦) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>高家即時提醒看板</span>
          </h3>
          <span className="text-[11px] text-gray-400">目前使用者: {activeMember}</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {/* Urgent Food Widget */}
          <button
            id="widget-urgent-food"
            onClick={() => setActiveQuickFilter(activeQuickFilter === 'expiring' ? 'all' : 'expiring')}
            className={`p-2.5 rounded-xl border text-left transition-all relative overflow-hidden ${
              urgentFoodItems.length > 0
                ? 'bg-rose-50/80 border-rose-200 text-rose-900'
                : 'bg-white border-gray-200 text-gray-700'
            } ${activeQuickFilter === 'expiring' ? 'ring-2 ring-rose-500 shadow-xs' : ''}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-base">🍎</span>
              <span className={`text-xs font-extrabold px-1.5 py-0.2 rounded-full ${
                urgentFoodItems.length > 0 ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                {urgentFoodItems.length}
              </span>
            </div>
            <p className="text-xs font-bold mt-1 tracking-tight">3天內過期</p>
            <p className="text-[10px] text-gray-500 line-clamp-1">
              {urgentFoodItems.length > 0 ? `${urgentFoodItems[0].name}` : '無急迫到期'}
            </p>
          </button>

          {/* Low Medical Supplies Widget */}
          <button
            id="widget-low-medical"
            onClick={() => setActiveQuickFilter(activeQuickFilter === 'low_stock' ? 'all' : 'low_stock')}
            className={`p-2.5 rounded-xl border text-left transition-all relative overflow-hidden ${
              lowMedicalItems.length > 0
                ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                : 'bg-white border-gray-200 text-gray-700'
            } ${activeQuickFilter === 'low_stock' ? 'ring-2 ring-amber-500 shadow-xs' : ''}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-base">💊</span>
              <span className={`text-xs font-extrabold px-1.5 py-0.2 rounded-full ${
                lowMedicalItems.length > 0 ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                {lowMedicalItems.length}
              </span>
            </div>
            <p className="text-xs font-bold mt-1 tracking-tight">耗材&lt;2週</p>
            <p className="text-[10px] text-gray-500 line-clamp-1">
              {lowMedicalItems.length > 0 ? `${lowMedicalItems[0].name}` : '常備庫存充裕'}
            </p>
          </button>

          {/* Pending Todos Widget */}
          <button
            id="widget-pending-todos"
            onClick={() => setActiveQuickFilter(activeQuickFilter === 'todos' ? 'all' : 'todos')}
            className={`p-2.5 rounded-xl border text-left transition-all relative overflow-hidden ${
              pendingTodos.length > 0
                ? 'bg-indigo-50/80 border-indigo-200 text-indigo-900'
                : 'bg-white border-gray-200 text-gray-700'
            } ${activeQuickFilter === 'todos' ? 'ring-2 ring-indigo-500 shadow-xs' : ''}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-base">📝</span>
              <span className={`text-xs font-extrabold px-1.5 py-0.2 rounded-full ${
                pendingTodos.length > 0 ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                {pendingTodos.length}
              </span>
            </div>
            <p className="text-xs font-bold mt-1 tracking-tight">近期待辦</p>
            <p className="text-[10px] text-gray-500 line-clamp-1">
              {pendingTodos.length > 0 ? `${pendingTodos[0].title}` : '全部完成'}
            </p>
          </button>
        </div>
      </div>

      {/* 3. Family Todos Interactive Card Section (if any todos or if filter clicked) */}
      {pendingTodos.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-gray-900">家庭待辦與提醒事項</h3>
            </div>
            <span className="text-xs text-gray-500">預設3天內提醒</span>
          </div>

          <div className="space-y-2">
            {pendingTodos.map((todo) => {
              const cfg = FAMILY_MEMBERS_CONFIG[todo.assignedTo] || FAMILY_MEMBERS_CONFIG['瑋'];
              return (
                <div
                  key={todo.id}
                  id={`todo-item-${todo.id}`}
                  className="flex items-start justify-between p-2.5 rounded-xl bg-gray-50/80 border border-gray-100 hover:bg-gray-50 transition-all"
                >
                  <div className="flex items-start space-x-2.5">
                    <button
                      onClick={() => onToggleTodo(todo.id)}
                      className="mt-0.5 text-gray-400 hover:text-indigo-600 transition-colors"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-sm font-semibold text-gray-900">{todo.title}</span>
                        {todo.locationTag && (
                          <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-medium">
                            📍 {todo.locationTag}
                          </span>
                        )}
                      </div>
                      {todo.note && <p className="text-xs text-gray-500 mt-0.5">{todo.note}</p>}
                      <div className="flex items-center space-x-2 mt-1 text-[11px] text-gray-500">
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${cfg.badgeBg}`}>
                          👤 {todo.assignedTo}
                        </span>
                        <span className="flex items-center space-x-1 text-gray-400">
                          <Clock className="w-3 h-3" />
                          <span>預計：{todo.targetDate}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Filters (Category & Member) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            高家物品清單 ({displayedItems.length} 項)
          </h3>

          {/* Quick reset if filtered */}
          {(selectedMemberFilter !== 'all' || selectedCategory !== 'all' || activeQuickFilter !== 'all') && (
            <button
              onClick={() => {
                onSelectMemberFilter('all');
                setSelectedCategory('all');
                setActiveQuickFilter('all');
              }}
              className="text-xs text-blue-600 font-semibold hover:underline"
            >
              清除篩選
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-gray-900 text-white shadow-xs'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            全部類別
          </button>
          {(Object.keys(CATEGORY_LABELS) as ItemCategory[]).map((catKey) => {
            const cat = CATEGORY_LABELS[catKey];
            const isSel = selectedCategory === catKey;
            return (
              <button
                key={catKey}
                onClick={() => setSelectedCategory(catKey)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center space-x-1 transition-all ${
                  isSel
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Inventory Items List with Family Color Borders */}
      <div className="space-y-3">
        {displayedItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-gray-200 text-center space-y-3">
            <Package className="w-12 h-12 text-gray-300 mx-auto" />
            <h4 className="text-sm font-bold text-gray-800">目前沒有符合的物品</h4>
            <p className="text-xs text-gray-500">
              點擊上方「+ 智能登錄」即可用雙照拍照、語音或文字快速新增！
            </p>
            <button
              onClick={onOpenRegisterModal}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>立即登錄物品</span>
            </button>
          </div>
        ) : (
          displayedItems.map((item) => {
            const ownerCfg = FAMILY_MEMBERS_CONFIG[item.owner] || FAMILY_MEMBERS_CONFIG['瑋'];
            const catInfo = CATEGORY_LABELS[item.category] || CATEGORY_LABELS['other'];

            // Food expiry check
            let isUrgentFood = false;
            let daysLeft = 999;
            if (item.category === 'food' && item.expiryDate) {
              const exp = new Date(item.expiryDate);
              daysLeft = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 3600 * 24));
              if (daysLeft <= 3) isUrgentFood = true;
            }

            const isNewlySaved = lastSavedItemId === item.id;

            return (
              <div
                key={item.id}
                id={`item-card-${item.id}`}
                className={`bg-white rounded-2xl p-4 border-2 ${
                  isNewlySaved ? 'border-blue-500 ring-4 ring-blue-400/30 shadow-lg scale-[1.01]' : ownerCfg.cardBorder
                } shadow-sm hover:shadow-md transition-all space-y-3 relative overflow-hidden`}
              >
                {/* Newly Saved Badge */}
                {isNewlySaved && (
                  <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-extrabold px-3 py-0.5 rounded-bl-xl shadow-xs animate-pulse flex items-center space-x-1">
                    <Sparkles className="w-3 h-3" />
                    <span>剛剛登錄</span>
                  </div>
                )}

                {/* Top Header: Category, Name, Owner Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border ${catInfo.badgeColor}`}>
                        <span className="mr-1">{catInfo.icon}</span>
                        {catInfo.label}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border ${ownerCfg.badgeBg}`}>
                        歸屬: {item.owner}
                      </span>
                      {item.recordedBy !== item.owner && (
                        <span className="text-[10px] text-gray-400">
                          (由 {item.recordedBy} 登錄)
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-gray-900 tracking-tight leading-snug">
                      {item.name}
                    </h3>
                  </div>

                  {/* Quantity Badge */}
                  <div className="text-right shrink-0">
                    <div className="px-2.5 py-1 rounded-xl bg-gray-100 font-extrabold text-gray-900 text-sm">
                      {item.totalQuantity} <span className="text-xs font-normal text-gray-500">{item.unit}</span>
                    </div>
                  </div>
                </div>

                {/* Photos Row (Close-up & Wide context) */}
                {(item.closeUpPhotoUrl || item.widePhotoUrl) && (
                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    {item.closeUpPhotoUrl && (
                      <div 
                        onClick={() => onViewPhotoLightbox(item)}
                        className="relative rounded-xl overflow-hidden aspect-4/3 bg-gray-100 border border-gray-200 cursor-pointer group"
                      >
                        <img
                          src={item.closeUpPhotoUrl}
                          alt={`${item.name} 近照`}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[10px] font-semibold text-white">
                          🔍 近照
                        </span>
                      </div>
                    )}

                    {item.widePhotoUrl && (
                      <div 
                        onClick={() => onViewPhotoLightbox(item)}
                        className="relative rounded-xl overflow-hidden aspect-4/3 bg-gray-100 border border-gray-200 cursor-pointer group"
                      >
                        <img
                          src={item.widePhotoUrl}
                          alt={`${item.name} 遠照環境`}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[10px] font-semibold text-white">
                          🏠 遠照環境
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Multi-Location Display (Requirement: If stored in multiple places, show both!) */}
                <div className="space-y-1.5 bg-[#f9f9fb] p-2.5 rounded-xl border border-gray-200/80">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-600">
                    <span className="flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-blue-600" />
                      <span>存放地點 ({item.locations.length} 處)</span>
                    </span>
                    <span className="text-[10px] text-gray-400 font-normal">高家樓層配置</span>
                  </div>

                  <div className="space-y-1">
                    {item.locations.map((loc, idx) => (
                      <div
                        key={loc.id || idx}
                        className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-gray-100 text-xs text-gray-800 shadow-2xs"
                      >
                        <div className="flex items-center space-x-1.5 font-medium">
                          <span className="w-4 h-4 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="text-gray-900 font-semibold">{loc.fullPath}</span>
                        </div>
                        <span className="text-gray-500 font-bold">
                          {loc.quantity} {loc.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status Badges: Food Expiry / Appliance Warranty / Medical Lifespan */}
                <div className="flex items-center flex-wrap gap-2 text-xs">
                  {/* Food Expiry */}
                  {item.category === 'food' && item.expiryDate && (
                    <div
                      className={`inline-flex items-center px-2 py-1 rounded-lg font-bold ${
                        isUrgentFood
                          ? 'bg-red-100 text-red-800 border border-red-200 animate-pulse'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5 mr-1" />
                      <span>
                        {daysLeft <= 0 ? '已過期！' : `剩餘 ${daysLeft} 天到期`} ({item.expiryDate})
                      </span>
                    </div>
                  )}

                  {/* Appliance Warranty & Manual */}
                  {item.category === 'appliance' && (
                    <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                      <div
                        className={`inline-flex items-center px-2 py-1 rounded-lg font-bold text-xs ${
                          item.isWarrantyValid
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : 'bg-gray-100 text-gray-600 border border-gray-200'
                        }`}
                      >
                        {item.isWarrantyValid ? (
                          <>
                            <ShieldCheck className="w-3.5 h-3.5 mr-1 text-blue-600" />
                            <span>保固中 ({item.warrantyDate || '有效'})</span>
                          </>
                        ) : (
                          <>
                            <ShieldAlert className="w-3.5 h-3.5 mr-1 text-gray-400" />
                            <span>已過保固 (默認過期)</span>
                          </>
                        )}
                      </div>

                      {item.manualUrl && (
                        <a
                          href={item.manualUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold hover:bg-indigo-100 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          <span>雲端說明書/保固卡</span>
                        </a>
                      )}
                    </div>
                  )}

                  {/* Medical / Consumables Lifespan */}
                  {item.estimatedLifespanWeeks !== undefined && (
                    <div
                      className={`inline-flex items-center px-2 py-1 rounded-lg font-bold ${
                        item.estimatedLifespanWeeks <= 2
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-gray-100 text-gray-700 border border-gray-200'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5 mr-1" />
                      <span>預估可用：約 {item.estimatedLifespanWeeks} 週用量</span>
                    </div>
                  )}
                </div>

                {/* Purchase Source & Proof / Purchase URL Bar */}
                {(item.purchaseSource || item.purchaseUrl || item.purchaseProofUrl) && (
                  <div className="bg-[#f7f9fd] p-2 rounded-xl border border-blue-100 flex items-center justify-between flex-wrap gap-2 text-xs">
                    <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                      {item.purchaseSource && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-100/70 text-blue-800 font-bold text-[11px]">
                          <ShoppingBag className="w-3 h-3 mr-1 text-blue-600" />
                          來源：{item.purchaseSource}
                        </span>
                      )}
                      {item.purchaseUrl && (
                        <a
                          href={item.purchaseUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center px-2 py-0.5 rounded-md bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 font-semibold text-[11px] transition-colors"
                        >
                          <LinkIcon className="w-3 h-3 mr-1 text-blue-500" />
                          <span>商品連結</span>
                        </a>
                      )}
                    </div>

                    {item.purchaseProofUrl && (
                      <a
                        href={item.purchaseProofUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 font-semibold text-[11px] transition-colors"
                      >
                        <Receipt className="w-3 h-3 mr-1 text-emerald-600" />
                        <span>購買證明 / 發票</span>
                      </a>
                    )}
                  </div>
                )}

                {/* Hierarchical Tags (Clickable -> Opens Search Explorer) */}
                {item.tags && item.tags.length > 0 && (
                  <div className="flex items-center space-x-1.5 flex-wrap gap-y-1 pt-1 border-t border-gray-100">
                    <Tag className="w-3 h-3 text-gray-400 shrink-0" />
                    {item.tags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => onOpenSearchModal(tag)}
                        className="px-2 py-0.5 rounded-md bg-gray-100 hover:bg-blue-50 hover:text-blue-700 text-[11px] font-medium text-gray-600 transition-colors"
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                )}

                {/* Bottom Quick Action: 拿取/消耗/減少 + 移動 + 詳情 */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span className="text-[11px] text-gray-400">
                    更新於 {new Date(item.updatedAt).toLocaleDateString('zh-TW')}
                  </span>

                  <div className="flex items-center space-x-1.5">
                    <button
                      id={`btn-consume-${item.id}`}
                      onClick={() => onOpenConsumeModal(item)}
                      className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-rose-50 hover:text-rose-700 text-gray-700 text-xs font-bold transition-all flex items-center space-x-1"
                    >
                      <Minus className="w-3.5 h-3.5" />
                      <span>拿取 / 消耗</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
