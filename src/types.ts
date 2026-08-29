export type FamilyMember = '瑋' | '珍' | '朋' | '淨' | '炘' | '豐' | '柔';

export interface FamilyMemberConfig {
  id: FamilyMember;
  name: string;
  relation: string; // 稱謂別名 (如: 樹瑋 / 老爸)
  aliases: string[]; // 所有別名列表
  avatarBg: string;
  avatarText: string;
  cardBorder: string;
  badgeBg: string;
  badgeText: string;
  ringColor: string;
  themeColorHex: string;
}

export const FAMILY_MEMBERS_CONFIG: Record<FamilyMember, FamilyMemberConfig> = {
  '瑋': {
    id: '瑋',
    name: '瑋',
    relation: '樹瑋 / 老爸',
    aliases: ['樹瑋', '老爸', '爸爸', '瑋瑋', '瑋'],
    avatarBg: 'bg-emerald-500',
    avatarText: 'text-white',
    cardBorder: 'border-emerald-500',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    badgeText: 'text-emerald-700',
    ringColor: 'ring-emerald-400',
    themeColorHex: '#10b981',
  },
  '珍': {
    id: '珍',
    name: '珍',
    relation: '美珍 / 老媽',
    aliases: ['美珍', '老媽', '媽媽', '阿珍', '珍'],
    avatarBg: 'bg-rose-500',
    avatarText: 'text-white',
    cardBorder: 'border-rose-500',
    badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
    badgeText: 'text-rose-700',
    ringColor: 'ring-rose-400',
    themeColorHex: '#f43f5e',
  },
  '朋': {
    id: '朋',
    name: '朋',
    relation: '有朋 / 哥哥',
    aliases: ['有朋', '哥哥', '大哥', '朋朋', '朋'],
    avatarBg: 'bg-blue-600',
    avatarText: 'text-white',
    cardBorder: 'border-blue-600',
    badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
    badgeText: 'text-blue-700',
    ringColor: 'ring-blue-400',
    themeColorHex: '#2563eb',
  },
  '淨': {
    id: '淨',
    name: '淨',
    relation: '于淨 / 姊姊',
    aliases: ['于淨', '姊姊', '姐姐', '大姊', '淨淨', '淨'],
    avatarBg: 'bg-purple-600',
    avatarText: 'text-white',
    cardBorder: 'border-purple-600',
    badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
    badgeText: 'text-purple-700',
    ringColor: 'ring-purple-400',
    themeColorHex: '#9333ea',
  },
  '炘': {
    id: '炘',
    name: '炘',
    relation: '語炘',
    aliases: ['語炘', '炘炘', '阿炘', '炘'],
    avatarBg: 'bg-amber-500',
    avatarText: 'text-white',
    cardBorder: 'border-amber-500',
    badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
    badgeText: 'text-amber-700',
    ringColor: 'ring-amber-400',
    themeColorHex: '#f59e0b',
  },
  '豐': {
    id: '豐',
    name: '豐',
    relation: '家豐',
    aliases: ['家豐', '阿豐', '豐豐', '豐'],
    avatarBg: 'bg-cyan-600',
    avatarText: 'text-white',
    cardBorder: 'border-cyan-600',
    badgeBg: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    badgeText: 'text-cyan-700',
    ringColor: 'ring-cyan-400',
    themeColorHex: '#0891b2',
  },
  '柔': {
    id: '柔',
    name: '柔',
    relation: '彩柔',
    aliases: ['彩柔', '阿柔', '柔柔', '柔'],
    avatarBg: 'bg-orange-500',
    avatarText: 'text-white',
    cardBorder: 'border-orange-500',
    badgeBg: 'bg-orange-50 text-orange-700 border-orange-200',
    badgeText: 'text-orange-700',
    ringColor: 'ring-orange-400',
    themeColorHex: '#ea580c',
  },
};

/**
 * 稱謂別名自動正規化工具：
 * 當輸入「樹瑋」、「老爸」-> 自動辨識為「瑋」
 * 當輸入「美珍」、「老媽」-> 自動辨識為「珍」
 * 當輸入「有朋」、「哥哥」-> 自動辨識為「朋」
 * 當輸入「于淨」、「姊姊」、「姐姐」-> 自動辨識為「淨」
 * 當輸入「語炘」-> 自動辨識為「炘」
 * 當輸入「家豐」-> 自動辨識為「豐」
 * 當輸入「彩柔」-> 自動辨識為「柔」
 */
export const normalizeMemberAlias = (input: string, fallback: FamilyMember = '瑋'): FamilyMember => {
  if (!input) return fallback;
  const str = input.trim();
  
  for (const [memberKey, config] of Object.entries(FAMILY_MEMBERS_CONFIG) as [FamilyMember, FamilyMemberConfig][]) {
    if (memberKey === str || config.aliases.some((alias) => str.includes(alias) || alias === str)) {
      return memberKey;
    }
  }
  return fallback;
};

export type ItemCategory = 'food' | 'appliance' | 'medical' | 'daily' | 'hardware' | 'todo' | 'other';

export const CATEGORY_LABELS: Record<ItemCategory, { label: string; icon: string; badgeColor: string }> = {
  food: { label: '食品生鮮', icon: '🍎', badgeColor: 'bg-green-100 text-green-800 border-green-200' },
  appliance: { label: '家電電器', icon: '🔌', badgeColor: 'bg-sky-100 text-sky-800 border-sky-200' },
  medical: { label: '醫療耗材', icon: '💊', badgeColor: 'bg-red-100 text-red-800 border-red-200' },
  daily: { label: '日用品', icon: '🧻', badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  hardware: { label: '五金備品', icon: '🔧', badgeColor: 'bg-amber-100 text-amber-800 border-amber-200' },
  todo: { label: '待辦事項', icon: '📝', badgeColor: 'bg-purple-100 text-purple-800 border-purple-200' },
  other: { label: '其他物品', icon: '📦', badgeColor: 'bg-gray-100 text-gray-800 border-gray-200' },
};

export interface ItemLocation {
  id: string;
  floor: string; // e.g. 1樓, 2樓, 3樓, 4樓/頂樓, 戶外
  room: string; // e.g. 客廳, 玄關, 廚房, 餐廳, 主臥, 次臥, 儲藏室, 陽台
  storageUnit: string; // e.g. 白色塑膠4層櫃, 白色塑膠5層櫃, 雙門大冰箱, 木質電視櫃, 流理台下櫃
  subLocation?: string; // e.g. 第1層, 第2層, 冷藏上層, 蔬果抽屜, 左門
  quantity: number;
  unit: string;
  note?: string;
  fullPath: string; // e.g. "1樓客廳玄關白色塑膠4層櫃第2層"
}

export interface InventoryItem {
  id: string;
  name: string;
  category: ItemCategory;
  owner: FamilyMember;
  recordedBy: FamilyMember;
  locations: ItemLocation[];
  totalQuantity: number;
  unit: string;
  
  // Photos
  closeUpPhotoUrl?: string; // 近照
  widePhotoUrl?: string; // 遠照 (環境上下文)
  
  // Purchase Info & Source (購買來源、連結與證明)
  purchaseSource?: string; // e.g. 好市多 Costco, 全聯, 蝦皮, 大潭, 屈臣氏, 實體店, 海外代購, 親友贈送
  purchaseUrl?: string; // 購買連結 / 電商商品網址
  purchaseProofUrl?: string; // 購買證明 / 電子發票截圖 / 明細圖檔
  
  // Food specific
  expiryDate?: string; // YYYY-MM-DD
  
  // Appliance specific
  warrantyDate?: string; // YYYY-MM-DD
  isWarrantyValid?: boolean;
  manualUrl?: string;
  manualNote?: string;
  
  // Medical & Consumables specific
  estimatedLifespanWeeks?: number; // 剩餘可用週數 (e.g. 2週用量)
  estimatedDaysRemaining?: number;
  lowStockThreshold?: number;
  
  // Tags & NFC
  tags: string[];
  nfcTagId?: string;
  
  // Timestamps & Meta
  recordedAt: string;
  updatedAt: string;
  rawInputTranscript?: string;
  aiAnalysisSummary?: string;
}

export interface TodoItem {
  id: string;
  title: string;
  assignedTo: FamilyMember;
  recordedBy: FamilyMember;
  targetDate: string; // YYYY-MM-DD (Defaults to +3 days if '近期')
  isCompleted: boolean;
  priority: 'urgent' | 'high' | 'normal';
  note?: string;
  locationTag?: string; // e.g. "大潭", "全聯", "好市多"
  createdAt: string;
}

export interface KaoLocationDefinition {
  floor: string;
  rooms: {
    name: string;
    storageUnits: {
      name: string;
      description?: string;
      subLocations: string[];
    }[];
  }[];
}

export interface AnalyzedItemDraft {
  name: string;
  category: ItemCategory;
  owner: FamilyMember;
  purchaseSource?: string;
  purchaseUrl?: string;
  purchaseProofUrl?: string;
  location: {
    floor: string;
    room: string;
    storageUnit: string;
    subLocation?: string;
    quantity: number;
    unit: string;
  };
  totalQuantity: number;
  unit: string;
  expiryDate?: string;
  warrantyDate?: string;
  isWarrantyValid?: boolean;
  manualUrl?: string;
  estimatedLifespanWeeks?: number;
  tags: string[];
  summary: string;
}

export interface GeminiAnalysisResult {
  isTodo: boolean;
  isMultiple?: boolean;
  itemsList?: AnalyzedItemDraft[];
  todoData?: {
    title: string;
    assignedTo: FamilyMember;
    targetDate: string;
    locationTag?: string;
    note?: string;
  };
  itemData?: AnalyzedItemDraft;
  conflictDetected?: boolean;
  existingItemMatch?: {
    id: string;
    name: string;
    currentLocations: ItemLocation[];
    owner: FamilyMember;
  };
  missingFields?: {
    field: 'location' | 'quantity' | 'expiryDate' | 'todoDate' | 'owner';
    question: string;
    defaultValue?: string;
  }[];
  rawTranscript: string;
}

export interface LineWeeklyBriefing {
  generatedDate: string;
  dayOfWeek: '週一' | '週五' | string;
  title: string;
  urgentFoodAlerts: {
    id: string;
    name: string;
    daysLeft: number;
    expiryDate: string;
    location: string;
    owner: string;
  }[];
  monthFoodAlerts: {
    id: string;
    name: string;
    expiryDate: string;
    location: string;
  }[];
  lowMedicalSupplies: {
    id: string;
    name: string;
    weeksRemaining: number;
    location: string;
    quantity: string;
  }[];
  upcomingTodos: {
    id: string;
    title: string;
    targetDate: string;
    assignedTo: string;
    isTodayOrPast: boolean;
  }[];
  lineFormattedText: string;
}

export interface GoogleSheetsSyncStatus {
  lastSyncedAt: string | null;
  spreadsheetId: string;
  spreadsheetTitle: string;
  rowCount: number;
  isSyncing: boolean;
}
