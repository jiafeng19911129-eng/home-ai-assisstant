import React, { useState, useMemo } from 'react';
import { 
  InventoryItem, 
  FamilyMember, 
  FAMILY_MEMBERS_CONFIG, 
  CATEGORY_LABELS, 
  ItemCategory 
} from '../types';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend, 
  Sector
} from 'recharts';
import { 
  PieChart as PieChartIcon, 
  Sparkles, 
  RefreshCw, 
  Users, 
  Package, 
  Layers, 
  ArrowUpRight, 
  Award,
  Check,
  BarChart3,
  Flame,
  Info
} from 'lucide-react';

interface DataAnalyticsProps {
  items: InventoryItem[];
}

const CATEGORY_COLORS: Record<string, string> = {
  food: '#10b981',       // Green
  daily: '#6366f1',      // Indigo
  medical: '#ef4444',    // Red
  appliance: '#0284c7',  // Sky Blue
  hardware: '#f59e0b',   // Amber
  other: '#64748b',      // Slate
  todo: '#a855f7',       // Purple
};

export const DataAnalytics: React.FC<DataAnalyticsProps> = ({ items }) => {
  // On-demand generation state
  const [isGenerated, setIsGenerated] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [lastGeneratedTime, setLastGeneratedTime] = useState<string | null>(null);

  // View mode toggles
  const [categoryMetric, setCategoryMetric] = useState<'itemsCount' | 'totalQuantity'>('itemsCount');
  const [memberMetric, setMemberMetric] = useState<'recordedBy' | 'owner'>('recordedBy');

  // Active hover indexes for interactive donut highlight
  const [activeCategoryIndex, setActiveCategoryIndex] = useState<number | undefined>(undefined);
  const [activeMemberIndex, setActiveMemberIndex] = useState<number | undefined>(undefined);

  // Trigger calculation and generation on demand
  const handleGenerateAnalytics = () => {
    setIsCalculating(true);
    setTimeout(() => {
      setIsGenerated(true);
      setIsCalculating(false);
      setLastGeneratedTime(new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 450); // slight simulated computation delay for feedback
  };

  // 1. Calculate Category Distribution Data
  const categoryData = useMemo(() => {
    if (!isGenerated) return [];
    
    const countMap: Record<string, { itemsCount: number; totalQuantity: number; name: string; icon: string }> = {};

    // Initialize categories
    (Object.keys(CATEGORY_LABELS) as ItemCategory[])
      .filter(c => c !== 'todo')
      .forEach(cat => {
        countMap[cat] = {
          itemsCount: 0,
          totalQuantity: 0,
          name: CATEGORY_LABELS[cat]?.label || cat,
          icon: CATEGORY_LABELS[cat]?.icon || '📦',
        };
      });

    items.forEach(item => {
      const cat = item.category || 'other';
      if (!countMap[cat]) {
        countMap[cat] = {
          itemsCount: 0,
          totalQuantity: 0,
          name: CATEGORY_LABELS[cat as ItemCategory]?.label || cat,
          icon: CATEGORY_LABELS[cat as ItemCategory]?.icon || '📦',
        };
      }
      countMap[cat].itemsCount += 1;
      countMap[cat].totalQuantity += (Number(item.totalQuantity) || 1);
    });

    const totalItems = items.length || 1;
    const totalQty = items.reduce((acc, it) => acc + (Number(it.totalQuantity) || 1), 0) || 1;

    return Object.entries(countMap)
      .map(([key, val]) => ({
        key,
        name: val.name,
        icon: val.icon,
        value: categoryMetric === 'itemsCount' ? val.itemsCount : val.totalQuantity,
        itemsCount: val.itemsCount,
        totalQuantity: val.totalQuantity,
        percentage: categoryMetric === 'itemsCount' 
          ? ((val.itemsCount / totalItems) * 100).toFixed(1)
          : ((val.totalQuantity / totalQty) * 100).toFixed(1),
        color: CATEGORY_COLORS[key] || '#94a3b8',
      }))
      .filter(entry => entry.itemsCount > 0)
      .sort((a, b) => b.value - a.value);
  }, [items, isGenerated, categoryMetric]);

  // 2. Calculate Family Member Registration and Ownership Share
  const memberData = useMemo(() => {
    if (!isGenerated) return [];

    const memberMap: Record<FamilyMember, { count: number; totalQty: number }> = {
      '瑋': { count: 0, totalQty: 0 },
      '珍': { count: 0, totalQty: 0 },
      '朋': { count: 0, totalQty: 0 },
      '淨': { count: 0, totalQty: 0 },
      '炘': { count: 0, totalQty: 0 },
      '豐': { count: 0, totalQty: 0 },
      '柔': { count: 0, totalQty: 0 },
    };

    items.forEach(item => {
      const targetMember = memberMetric === 'recordedBy' ? item.recordedBy : item.owner;
      if (targetMember && memberMap[targetMember]) {
        memberMap[targetMember].count += 1;
        memberMap[targetMember].totalQty += (Number(item.totalQuantity) || 1);
      }
    });

    const total = items.length || 1;

    return (Object.keys(memberMap) as FamilyMember[]).map(member => {
      const cfg = FAMILY_MEMBERS_CONFIG[member];
      const count = memberMap[member].count;
      return {
        member,
        name: `${member}（${cfg.relation}）`,
        shortName: member,
        relation: cfg.relation,
        value: count,
        totalQty: memberMap[member].totalQty,
        percentage: ((count / total) * 100).toFixed(1),
        color: cfg.themeColorHex,
        avatarBg: cfg.avatarBg,
      };
    }).sort((a, b) => b.value - a.value);
  }, [items, isGenerated, memberMetric]);

  // Stats Summary
  const stats = useMemo(() => {
    const totalItems = items.length;
    const totalQuantity = items.reduce((acc, it) => acc + (Number(it.totalQuantity) || 1), 0);
    const topCategory = categoryData[0];
    const topMember = memberData[0];

    return {
      totalItems,
      totalQuantity,
      topCategory,
      topMember,
      activeCategoriesCount: categoryData.length,
    };
  }, [items, categoryData, memberData]);

  // Custom Active Shape for Pie Hover
  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius - 4}
          outerRadius={outerRadius + 8}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 10}
          outerRadius={outerRadius + 14}
          fill={fill}
        />
      </g>
    );
  };

  return (
    <div className="space-y-4">
      {/* Action Header Card */}
      <div className="bg-white p-4.5 rounded-2xl border border-gray-200 shadow-xs">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                <BarChart3 className="w-4 h-4" />
              </span>
              <span>高家庫存統計與成員數據可視化</span>
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              視需求即時計算並繪製物品類別佔比圓餅圖與 7 位家庭成員登錄貢獻分佈
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {isGenerated && lastGeneratedTime && (
              <span className="text-[11px] text-gray-400 font-medium hidden sm:inline-block">
                分析時間：{lastGeneratedTime}
              </span>
            )}
            <button
              id="btn-generate-analytics"
              type="button"
              onClick={handleGenerateAnalytics}
              disabled={isCalculating}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-xs active:scale-98 ${
                isGenerated
                  ? 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCalculating ? 'animate-spin' : ''}`} />
              <span>{isCalculating ? '正在計算數據...' : isGenerated ? '重新計算圖表' : '點選生成可視化圖表'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* When NOT generated yet, show friendly on-demand prompt */}
      {!isGenerated && (
        <div className="bg-white p-8 rounded-3xl border-2 border-dashed border-gray-200 text-center space-y-4 shadow-2xs">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
            <PieChartIcon className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h4 className="text-sm font-bold text-gray-800">尚未生成數據圖表</h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              目前高家共儲存有 <span className="font-bold text-blue-600">{items.length} 件</span> 物品資料。
              點擊下方按鈕即可立即計算各類別分佈圓餅圖及各成員的登錄佔比。
            </p>
          </div>
          <button
            type="button"
            onClick={handleGenerateAnalytics}
            disabled={isCalculating}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all inline-flex items-center space-x-2 active:scale-98"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>開始生成可視化圖表分析</span>
          </button>
        </div>
      )}

      {/* Generated Charts and Stats */}
      {isGenerated && (
        <div className="space-y-4 animate-fadeIn">
          {/* Key Metric Overview Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-white rounded-2xl border border-gray-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-[11px] font-bold">總物品品項</span>
                <Package className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-xl font-black text-gray-900">{stats.totalItems} <span className="text-xs font-semibold text-gray-500">項</span></p>
              <p className="text-[10px] text-gray-400">總庫存件數：{stats.totalQuantity} 件</p>
            </div>

            <div className="p-3.5 bg-white rounded-2xl border border-gray-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-[11px] font-bold">涵蓋分類數</span>
                <Layers className="w-4 h-4 text-indigo-600" />
              </div>
              <p className="text-xl font-black text-gray-900">{stats.activeCategoriesCount} <span className="text-xs font-semibold text-gray-500">類</span></p>
              <p className="text-[10px] text-gray-400">主要：{stats.topCategory?.name || '無'}</p>
            </div>

            <div className="p-3.5 bg-white rounded-2xl border border-gray-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-[11px] font-bold">最多庫存類別</span>
                <span className="text-base">{stats.topCategory?.icon}</span>
              </div>
              <p className="text-base font-black text-gray-900 truncate">{stats.topCategory?.name || '無'}</p>
              <p className="text-[10px] text-emerald-600 font-bold">佔比 {stats.topCategory?.percentage}% ({stats.topCategory?.itemsCount} 項)</p>
            </div>

            <div className="p-3.5 bg-white rounded-2xl border border-gray-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-[11px] font-bold">登錄最多成員</span>
                <Award className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-base font-black text-gray-900 flex items-center space-x-1.5">
                <span className={`w-2.5 h-2.5 rounded-full`} style={{ backgroundColor: stats.topMember?.color }} />
                <span>{stats.topMember?.shortName}</span>
              </p>
              <p className="text-[10px] text-indigo-600 font-bold">貢獻 {stats.topMember?.percentage}% ({stats.topMember?.value} 項)</p>
            </div>
          </div>

          {/* Charts Dual Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Chart 1: Category Distribution Pie Chart */}
            <div className="bg-white p-4.5 rounded-2xl border border-gray-200 shadow-xs flex flex-col space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-gray-100">
                <div>
                  <h4 className="text-xs font-bold text-gray-900 flex items-center space-x-1.5">
                    <PieChartIcon className="w-4 h-4 text-emerald-600" />
                    <span>高家各類物品庫存分佈圓餅圖</span>
                  </h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">滑鼠懸停或點選查看各分類佔比與總件數</p>
                </div>

                {/* Metric toggle */}
                <div className="flex items-center space-x-1 bg-gray-100 p-0.5 rounded-lg text-[10px] font-bold text-gray-600">
                  <button
                    type="button"
                    onClick={() => setCategoryMetric('itemsCount')}
                    className={`px-2 py-1 rounded-md transition-all ${
                      categoryMetric === 'itemsCount' ? 'bg-white text-emerald-700 shadow-2xs' : 'hover:text-gray-900'
                    }`}
                  >
                    依品項數
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategoryMetric('totalQuantity')}
                    className={`px-2 py-1 rounded-md transition-all ${
                      categoryMetric === 'totalQuantity' ? 'bg-white text-emerald-700 shadow-2xs' : 'hover:text-gray-900'
                    }`}
                  >
                    依總件數
                  </button>
                </div>
              </div>

              {/* Chart Render Area */}
              <div className="h-64 w-full relative flex items-center justify-center">
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                        activeIndex={activeCategoryIndex}
                        activeShape={renderActiveShape}
                        onMouseEnter={(_, index) => setActiveCategoryIndex(index)}
                        onMouseLeave={() => setActiveCategoryIndex(undefined)}
                      >
                        {categoryData.map((entry) => (
                          <Cell key={`cell-cat-${entry.key}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-gray-900 text-white p-2.5 rounded-xl text-xs shadow-xl border border-gray-800 space-y-1">
                                <p className="font-bold flex items-center space-x-1.5">
                                  <span>{data.icon}</span>
                                  <span>{data.name}</span>
                                </p>
                                <p className="text-[11px] text-gray-300">
                                  品項數量：<span className="font-bold text-white">{data.itemsCount} 項</span>
                                </p>
                                <p className="text-[11px] text-gray-300">
                                  庫存件數：<span className="font-bold text-white">{data.totalQuantity} 件</span>
                                </p>
                                <p className="text-[11px] text-emerald-400 font-bold">
                                  佔比：{data.percentage}%
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-xs text-gray-400">暫無類別數據</p>
                )}

                {/* Center Badge */}
                <div className="absolute pointer-events-none text-center">
                  <span className="text-[10px] text-gray-400 block font-semibold">總計</span>
                  <span className="text-lg font-black text-gray-800">
                    {categoryMetric === 'itemsCount' ? stats.totalItems : stats.totalQuantity}
                  </span>
                  <span className="text-[9px] text-gray-400 block font-bold">
                    {categoryMetric === 'itemsCount' ? '品項' : '件'}
                  </span>
                </div>
              </div>

              {/* Category Breakdown Chips List */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-gray-100">
                {categoryData.map((cat, idx) => (
                  <div
                    key={cat.key}
                    onMouseEnter={() => setActiveCategoryIndex(idx)}
                    onMouseLeave={() => setActiveCategoryIndex(undefined)}
                    className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      activeCategoryIndex === idx
                        ? 'bg-gray-50 border-gray-400 shadow-xs'
                        : 'border-gray-100 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5 truncate">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                      <span className="text-xs font-bold text-gray-800 truncate">
                        {cat.icon} {cat.name}
                      </span>
                    </div>
                    <span className="text-[11px] font-extrabold text-gray-600 shrink-0 ml-1">
                      {cat.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart 2: Family Members Contribution Share Pie Chart */}
            <div className="bg-white p-4.5 rounded-2xl border border-gray-200 shadow-xs flex flex-col space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-gray-100">
                <div>
                  <h4 className="text-xs font-bold text-gray-900 flex items-center space-x-1.5">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span>各家庭成員物品登錄與歸屬佔比</span>
                  </h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">高家 7 位成員專屬色彩與貢獻分佈</p>
                </div>

                {/* Member Metric Toggle */}
                <div className="flex items-center space-x-1 bg-gray-100 p-0.5 rounded-lg text-[10px] font-bold text-gray-600">
                  <button
                    type="button"
                    onClick={() => setMemberMetric('recordedBy')}
                    className={`px-2 py-1 rounded-md transition-all ${
                      memberMetric === 'recordedBy' ? 'bg-white text-blue-700 shadow-2xs' : 'hover:text-gray-900'
                    }`}
                  >
                    依登錄者
                  </button>
                  <button
                    type="button"
                    onClick={() => setMemberMetric('owner')}
                    className={`px-2 py-1 rounded-md transition-all ${
                      memberMetric === 'owner' ? 'bg-white text-blue-700 shadow-2xs' : 'hover:text-gray-900'
                    }`}
                  >
                    依擁有者
                  </button>
                </div>
              </div>

              {/* Chart Render Area */}
              <div className="h-64 w-full relative flex items-center justify-center">
                {memberData.some(m => m.value > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={memberData.filter(m => m.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                        activeIndex={activeMemberIndex}
                        activeShape={renderActiveShape}
                        onMouseEnter={(_, index) => setActiveMemberIndex(index)}
                        onMouseLeave={() => setActiveMemberIndex(undefined)}
                      >
                        {memberData.filter(m => m.value > 0).map((entry) => (
                          <Cell key={`cell-member-${entry.member}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-gray-900 text-white p-2.5 rounded-xl text-xs shadow-xl border border-gray-800 space-y-1">
                                <p className="font-bold flex items-center space-x-1.5">
                                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
                                  <span>{data.name}</span>
                                </p>
                                <p className="text-[11px] text-gray-300">
                                  {memberMetric === 'recordedBy' ? '登錄品項：' : '擁有品項：'}
                                  <span className="font-bold text-white">{data.value} 項</span>
                                </p>
                                <p className="text-[11px] text-gray-300">
                                  庫存件數：<span className="font-bold text-white">{data.totalQty} 件</span>
                                </p>
                                <p className="text-[11px] text-blue-400 font-bold">
                                  佔比：{data.percentage}%
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-xs text-gray-400">暫無成員數據</p>
                )}

                {/* Center Badge */}
                <div className="absolute pointer-events-none text-center">
                  <span className="text-[10px] text-gray-400 block font-semibold">成員總數</span>
                  <span className="text-lg font-black text-gray-800">7</span>
                  <span className="text-[9px] text-gray-400 block font-bold">位家人</span>
                </div>
              </div>

              {/* Members Breakdown List */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-gray-100">
                {memberData.map((mem, idx) => (
                  <div
                    key={mem.member}
                    onMouseEnter={() => setActiveMemberIndex(idx)}
                    onMouseLeave={() => setActiveMemberIndex(undefined)}
                    className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      activeMemberIndex === idx
                        ? 'bg-gray-50 border-gray-400 shadow-xs'
                        : 'border-gray-100 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5 truncate">
                      <span className="w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0" style={{ backgroundColor: mem.color }}>
                        {mem.shortName}
                      </span>
                      <span className="text-xs font-bold text-gray-800 truncate">
                        {mem.relation.split(' ')[0]}
                      </span>
                    </div>
                    <span className="text-[11px] font-extrabold text-gray-700 shrink-0 ml-1">
                      {mem.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
