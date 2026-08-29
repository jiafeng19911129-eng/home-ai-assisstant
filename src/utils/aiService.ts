import { GeminiAnalysisResult, FamilyMember, ItemCategory, LineWeeklyBriefing, InventoryItem, TodoItem, normalizeMemberAlias, AnalyzedItemDraft } from '../types';

const STORAGE_KEY_GEMINI = 'kao_family_gemini_api_key';

export function getStoredGeminiKey(): string {
  if (typeof window !== 'undefined') {
    const localKey = localStorage.getItem(STORAGE_KEY_GEMINI);
    if (localKey && localKey.trim()) return localKey.trim();
  }
  const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (envKey && typeof envKey === 'string' && envKey.trim() && !envKey.startsWith('MY_')) {
    return envKey.trim();
  }
  return '';
}

export function setStoredGeminiKey(key: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_GEMINI, key.trim());
  }
}

// Helper: Calculate date + days in YYYY-MM-DD
function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

// Helper to parse a single snippet
function parseSingleItemSnippet(
  snippet: string,
  currentUser: FamilyMember,
  defaultFloor = '1樓',
  defaultRoom = '客廳',
  defaultStorageUnit = '白色塑膠4層櫃',
  defaultSubLocation = '第1層'
): AnalyzedItemDraft {
  const text = snippet.trim();
  const matchedOwner = normalizeMemberAlias(text, currentUser);

  // Purchase source
  let purchaseSource: string | null = null;
  if (/好市多|costco/i.test(text)) purchaseSource = '好市多 Costco';
  else if (/全聯/i.test(text)) purchaseSource = '全聯福利中心';
  else if (/蝦皮/i.test(text)) purchaseSource = '蝦皮購物';
  else if (/momo/i.test(text)) purchaseSource = 'Momo 購物';
  else if (/家樂福/i.test(text)) purchaseSource = '家樂福';
  else if (/屈臣氏|康是美/i.test(text)) purchaseSource = '屈臣氏 / 康是美';
  else if (/大潭/i.test(text)) purchaseSource = '大潭實體門市';
  else if (/海外|代購/i.test(text)) purchaseSource = '海外代購';
  else if (/親友|送/i.test(text)) purchaseSource = '親友贈送';

  // Category
  let category: ItemCategory = 'daily';
  let estimatedLifespanWeeks = 4;
  let expiryDate: string | null = null;

  if (/鮮奶|鮮乳|牛奶|蛋|肉|菜|魚|優格|麵包|水果|熟食|起司|豆漿|飲料|零食|餅乾|蘋果|香蕉|雞胸肉|蔬菜|布丁|養樂多|可樂|茶/i.test(text)) {
    category = 'food';
    estimatedLifespanWeeks = 1;
    if (text.includes('下星期五') || text.includes('下週五')) expiryDate = addDays(6);
    else if (text.includes('明天')) expiryDate = addDays(1);
    else if (text.includes('後天')) expiryDate = addDays(2);
    else if (text.includes('3天')) expiryDate = addDays(3);
    else if (text.includes('下週') || text.includes('下星期')) expiryDate = addDays(7);
    else expiryDate = addDays(5);
  } else if (/電視|冰箱|洗衣機|吹風機|微波爐|烤箱|吸塵器|電鍋|電扇|除濕機|冷氣|音響|筆電|ipad|iphone|手機/i.test(text)) {
    category = 'appliance';
    estimatedLifespanWeeks = 260;
  } else if (/藥|普拿疼|維他命|感冒|胃藥|止痛|酒精|棉花棒|ok繃|紗布|血壓計|口罩|益生菌/i.test(text)) {
    category = 'medical';
    estimatedLifespanWeeks = 12;
    expiryDate = addDays(365);
  } else if (/螺絲|板手|鐵鎚|膠帶|電池|燈泡|工具|水管|延長線/i.test(text)) {
    category = 'hardware';
    estimatedLifespanWeeks = 104;
  } else if (/洗髮精|沐浴乳|牙膏|衛生紙|洗碗精|洗衣精|垃圾袋|抹布|肥皂/i.test(text)) {
    category = 'daily';
    estimatedLifespanWeeks = 8;
  }

  // Location
  let floor = defaultFloor;
  let room = defaultRoom;
  let storageUnit = defaultStorageUnit;
  let subLocation = defaultSubLocation;

  if (text.includes('廚房') || text.includes('冰箱') || text.includes('流理台') || category === 'food') {
    floor = '1樓';
    room = '廚房';
    storageUnit = text.includes('流理台') ? '系統流理台下櫃' : text.includes('電器架') ? '廚房電器架' : '雙門大冰箱';
    subLocation = text.includes('冷凍') ? '冷凍庫' : text.includes('蔬果') ? '蔬果保鮮抽屜' : '冷藏室中層';
  } else if (text.includes('玄關') || text.includes('鞋櫃')) {
    floor = '1樓';
    room = '玄關';
    storageUnit = text.includes('鞋') ? '木質鞋櫃' : '玄關4層收納架';
    subLocation = '第1層';
  } else if (text.includes('車庫') || text.includes('庭院') || text.includes('工具')) {
    floor = '1樓';
    room = '車庫/庭院';
    storageUnit = '工具收納鐵架';
    subLocation = '第1層';
  } else if (text.includes('2樓') || text.includes('主臥') || text.includes('儲藏室')) {
    floor = '2樓';
    room = text.includes('主臥') ? '主臥室' : '儲藏室';
    storageUnit = text.includes('主臥') ? '大衣櫃' : '重型鐵架A';
    subLocation = '第1層';
  } else if (text.includes('3樓') || text.includes('陽台') || text.includes('洗衣')) {
    floor = '3樓';
    room = text.includes('陽台') || text.includes('洗衣') ? '洗衣陽台' : '次臥多功能室';
    storageUnit = '洗衣用品層架';
    subLocation = '第1層';
  } else if (text.includes('4樓') || text.includes('頂樓') || text.includes('水塔')) {
    floor = '4樓';
    room = '頂樓水塔雜物棚';
    storageUnit = '雜物儲藏區';
    subLocation = '全區';
  }

  // Quantity & Unit
  let quantity = 1;
  let unit = '件';
  const qtyMatch = text.match(/(\d+)\s*(罐|瓶|盒|包|袋|入|件|個|條|組|台|顆|箱|支|把)/);
  if (qtyMatch) {
    quantity = parseInt(qtyMatch[1], 10);
    unit = qtyMatch[2];
  } else {
    const chineseNumMatch = text.match(/([一二兩三四五六七八九十]+)\s*(罐|瓶|盒|包|袋|入|件|個|條|組|台|顆|箱|支|把)/);
    if (chineseNumMatch) {
      const cMap: Record<string, number> = { '一': 1, '二': 2, '兩': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10 };
      quantity = cMap[chineseNumMatch[1]] || 1;
      unit = chineseNumMatch[2];
    }
  }

  // Clean Name
  let name = text
    .replace(/(老爸|老媽|爸爸|媽媽|哥哥|姊姊|姐姐|美珍|樹瑋|有朋|于淨|語炘|家豐|彩柔|瑋|珍|朋|淨|炘|豐|柔|買了|買的|放|在|在1樓|在2樓|在3樓|在4樓|客廳|廚房|雙門大冰箱|冰箱|白色塑膠4層櫃|白色塑膠5層櫃|儲藏室|保存期限到|期限到|有效期限|下星期五|明天|後天|\d+罐|\d+瓶|\d+盒|\d+包|\d+袋|\d+入|\d+件|\d+個)/g, '')
    .replace(/[，,。！!、還有以及另外和及]/g, ' ')
    .trim();

  if (!name || name.length < 2) {
    name = text.slice(0, 12);
  }

  return {
    name,
    category,
    owner: matchedOwner,
    purchaseSource,
    purchaseUrl: undefined,
    purchaseProofUrl: undefined,
    location: {
      floor,
      room,
      storageUnit,
      subLocation,
      quantity,
      unit,
    },
    totalQuantity: quantity,
    unit,
    expiryDate: expiryDate || undefined,
    warrantyDate: undefined,
    isWarrantyValid: false,
    manualUrl: undefined,
    estimatedLifespanWeeks,
    tags: [floor, `${floor}${room}`, storageUnit, matchedOwner].filter(Boolean),
    summary: `${matchedOwner} 登錄之 ${name} (${quantity}${unit})，存放於 ${floor} ${room} ${storageUnit} ${subLocation}`,
  };
}

// 1. Intelligent Local Rule-based NLP Parser (Offline / Fallback) with Multi-Item Batch Support
export function localParseTranscript(
  transcript: string,
  currentUser: FamilyMember,
  existingInventory: Array<{ id: string; name: string; locations?: any[]; owner: string }> = []
): GeminiAnalysisResult {
  const text = transcript.trim();

  // 1. Determine if this is a Todo vs Item
  const isExplicitTodo =
    text.startsWith('待辦') ||
    text.startsWith('提醒') ||
    text.includes('記得要') ||
    text.includes('記得去') ||
    text.includes('記得幫') ||
    text.includes('去大潭') ||
    text.includes('修理') ||
    (text.includes('買') && !text.includes('放') && !text.includes('買了') && !text.includes('庫存') && !text.includes('在'));

  if (isExplicitTodo) {
    let targetDate = addDays(3);
    if (text.includes('明天')) targetDate = addDays(1);
    else if (text.includes('後天')) targetDate = addDays(2);
    else if (text.includes('下週') || text.includes('下星期')) targetDate = addDays(7);
    const matchedOwner = normalizeMemberAlias(text, currentUser);

    return {
      isTodo: true,
      isMultiple: false,
      todoData: {
        title: text.replace(/^(待辦|提醒|記得要|記得)/, '').trim() || text,
        assignedTo: matchedOwner,
        targetDate,
        locationTag: text.includes('陽台') ? '3樓陽台' : text.includes('廚房') ? '1樓廚房' : '高家',
        note: `語音/文字快速登錄：${text}`,
      },
      itemData: undefined,
      conflictDetected: false,
      existingItemMatch: undefined,
      missingFields: [],
      rawTranscript: text,
    };
  }

  // 2. Check for Multiple Items in speech / text
  // Split on "還有", "以及", "另外", "，", "、", "和"
  const rawSplits = text.split(/還有|以及|另外|，|、|和/).map((s) => s.trim()).filter((s) => s.length >= 2);
  const itemsList: AnalyzedItemDraft[] = [];

  if (rawSplits.length > 1) {
    rawSplits.forEach((chunk) => {
      const item = parseSingleItemSnippet(chunk, currentUser);
      if (item.name && item.name.length >= 2 && !item.name.includes('高家新物品')) {
        itemsList.push(item);
      }
    });
  }

  // If multi-item parsed successfully
  if (itemsList.length > 1) {
    return {
      isTodo: false,
      isMultiple: true,
      itemsList,
      itemData: itemsList[0],
      conflictDetected: false,
      existingItemMatch: undefined,
      missingFields: [],
      rawTranscript: text,
    };
  }

  // Single Item fallback
  const singleItem = parseSingleItemSnippet(text, currentUser);
  const match = existingInventory.find((it) => it.name.trim().toLowerCase() === singleItem.name.toLowerCase());

  return {
    isTodo: false,
    isMultiple: false,
    itemsList: [singleItem],
    itemData: singleItem,
    conflictDetected: Boolean(match),
    existingItemMatch: match ? { id: match.id, name: match.name, currentLocations: (match.locations || []) as any, owner: match.owner as FamilyMember } : undefined,
    missingFields: !text.includes('樓') && !text.includes('房') && !text.includes('櫃') && !text.includes('箱')
      ? [
          {
            field: 'location',
            question: '請問這件物品存放在高家哪裡呢？（例如：1樓客廳白色塑膠4層櫃第1層）',
            defaultValue: `${singleItem.location.floor}${singleItem.location.room}${singleItem.location.storageUnit}${singleItem.location.subLocation}`,
          },
        ]
      : [],
    rawTranscript: text,
  };
}

// 2. Client-side Direct Gemini API Call (Supports Multiple Items & Visual Image Counting)
export async function callGeminiDirectly(
  apiKey: string,
  transcript: string,
  currentUser: FamilyMember,
  closeUpPhotoBase64?: string | null,
  widePhotoBase64?: string | null,
  existingInventory: Array<{ id: string; name: string; locations?: any[]; owner: string }> = []
): Promise<GeminiAnalysisResult> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const systemInstruction = `
你是一位專屬於「高家」的頂級智能家庭管家 AI (Gemini Spark)。
高家家庭成員代碼與稱謂別名完全對照表：
- 【瑋】：樹瑋、老爸、爸爸、瑋瑋、瑋。
- 【珍】：美珍、老媽、媽媽、阿珍、珍。
- 【朋】：有朋、哥哥、大哥、朋朋、朋。
- 【淨】：于淨、姊姊、姐姐、大姊、淨淨、淨。
- 【炘】：語炘、炘炘、阿炘、炘。
- 【豐】：家豐、阿豐、豐豐、豐。
- 【柔】：彩柔、阿柔、柔柔、柔。

多物品辨識與圖片數量分析重要規則：
1. 若使用者輸入一段話提到「多個物品」（例如買了鮮奶、普拿疼、衛生紙），或者照片中出現多個物品：
   - 必須將每一個物品辨識出來，並放在 \`itemsList\` 陣列中！
   - \`isMultiple\` 設為 true。
   - 針對圖片分析：請仔細清點圖片中的每一種物品與瓶罐包裝，精確計算數量 (如: 2罐、4包、1盒)！
2. 實體物品歸為 item (isTodo: false)，明確待辦事項歸為 todo (isTodo: true)。
3. 回傳嚴格 JSON 格式：
{
  "isTodo": boolean,
  "isMultiple": boolean,
  "itemsList": [
    {
      "name": string,
      "category": "food" | "appliance" | "medical" | "daily" | "hardware" | "other",
      "owner": "瑋" | "珍" | "朋" | "淨" | "炘" | "豐" | "柔",
      "purchaseSource": string | null,
      "location": { "floor": string, "room": string, "storageUnit": string, "subLocation": string, "quantity": number, "unit": string },
      "totalQuantity": number,
      "unit": string,
      "expiryDate": "YYYY-MM-DD" | null,
      "warrantyDate": "YYYY-MM-DD" | null,
      "isWarrantyValid": boolean,
      "estimatedLifespanWeeks": number | null,
      "tags": string[],
      "summary": string
    }
  ],
  "itemData": {
    "name": string,
    "category": "food" | "appliance" | "medical" | "daily" | "hardware" | "other",
    "owner": string,
    "purchaseSource": string | null,
    "location": { "floor": string, "room": string, "storageUnit": string, "subLocation": string, "quantity": number, "unit": string },
    "totalQuantity": number,
    "unit": string,
    "expiryDate": "YYYY-MM-DD" | null,
    "warrantyDate": "YYYY-MM-DD" | null,
    "isWarrantyValid": boolean,
    "estimatedLifespanWeeks": number | null,
    "tags": string[],
    "summary": string
  },
  "todoData": { "title": string, "assignedTo": string, "targetDate": "YYYY-MM-DD", "locationTag": string, "note": string },
  "conflictDetected": boolean,
  "missingFields": [{ "field": string, "question": string, "defaultValue": string }],
  "rawTranscript": string
}
`;

  const parts: any[] = [];
  if (closeUpPhotoBase64) {
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: closeUpPhotoBase64.replace(/^data:image\/\w+;base64,/, ''),
      },
    });
  }
  if (widePhotoBase64) {
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: widePhotoBase64.replace(/^data:image\/\w+;base64,/, ''),
      },
    });
  }
  parts.push({
    text: `當前登錄者：【${currentUser}】\n使用者輸入："""${transcript}"""\n${closeUpPhotoBase64 || widePhotoBase64 ? '【注意：請分析照片中的物品種類與精確數量，若有多個物品請分別列入 itemsList】' : ''}\n請詳細分析並輸出上述 JSON。`,
  });

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      systemInstruction: { parts: [{ text: systemInstruction }] },
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API Error: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();
  const textOutput = result.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  const parsed = JSON.parse(textOutput);

  // Normalization
  if (parsed.itemsList && Array.isArray(parsed.itemsList) && parsed.itemsList.length > 0) {
    parsed.itemData = parsed.itemsList[0];
    if (parsed.itemsList.length > 1) {
      parsed.isMultiple = true;
    }
  } else if (parsed.itemData) {
    parsed.itemsList = [parsed.itemData];
  }

  return parsed;
}

// 3. Universal Analyzer: Server API ➔ Client Gemini API ➔ Intelligent Local Parser
export async function analyzeSmartInput(params: {
  transcript: string;
  currentUser: FamilyMember;
  closeUpPhoto?: string | null;
  widePhoto?: string | null;
  existingInventory?: Array<{ id: string; name: string; locations?: any[]; owner: string }>;
}): Promise<GeminiAnalysisResult> {
  const { transcript, currentUser, closeUpPhoto, widePhoto, existingInventory = [] } = params;

  // Step A: Try backend Express API if running
  try {
    const res = await fetch('/api/gemini/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcript,
        currentUser,
        closeUpPhotoBase64: closeUpPhoto,
        widePhotoBase64: widePhoto,
        existingInventory,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && (data.itemData || data.todoData)) {
        return data;
      }
    }
  } catch {
    // Backend not available (e.g. GitHub Pages)
  }

  // Step B: Try client-side direct Gemini API if user has stored an API Key
  const storedKey = getStoredGeminiKey();
  if (storedKey) {
    try {
      const directResult = await callGeminiDirectly(
        storedKey,
        transcript,
        currentUser,
        closeUpPhoto,
        widePhoto,
        existingInventory
      );
      if (directResult && (directResult.itemData || directResult.todoData)) {
        return directResult;
      }
    } catch (e) {
      console.warn('Direct Gemini API call failed, falling back to local NLP parser:', e);
    }
  }

  // Step C: High-precision Intelligent Local NLP Parser (Guaranteed to succeed)
  return localParseTranscript(transcript, currentUser, existingInventory);
}

// 4. Generate Family LINE Briefing (Universal)
export function generateLocalBriefing(items: InventoryItem[], todos: TodoItem[]): LineWeeklyBriefing {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const dayOfWeekNames = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
  const dayOfWeek = dayOfWeekNames[today.getDay()];

  const urgentFoodAlerts: Array<{ id: string; name: string; daysLeft: number; expiryDate: string; location: string; owner: string }> = [];
  const monthFoodAlerts: Array<{ id: string; name: string; expiryDate: string; location: string }> = [];
  const lowMedicalSupplies: Array<{ id: string; name: string; weeksRemaining: number; location: string; quantity: string }> = [];
  const upcomingTodos: Array<{ id: string; title: string; targetDate: string; assignedTo: string; isTodayOrPast: boolean }> = [];

  // Categorize items
  items.forEach((item) => {
    const locStr = item.locations?.map((l) => l.fullPath || `${l.floor}${l.room}`).join('、') || '1樓廚房';
    if (item.category === 'food' && item.expiryDate) {
      const exp = new Date(item.expiryDate);
      const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 3 && diffDays >= -1) {
        urgentFoodAlerts.push({
          id: item.id,
          name: item.name,
          daysLeft: diffDays,
          expiryDate: item.expiryDate,
          location: locStr,
          owner: item.owner,
        });
      } else if (diffDays <= 30 && diffDays > 3) {
        monthFoodAlerts.push({
          id: item.id,
          name: item.name,
          expiryDate: item.expiryDate,
          location: locStr,
        });
      }
    } else if (item.category === 'medical' || item.category === 'daily') {
      if (item.estimatedLifespanWeeks && item.estimatedLifespanWeeks <= 2) {
        lowMedicalSupplies.push({
          id: item.id,
          name: item.name,
          weeksRemaining: item.estimatedLifespanWeeks,
          location: locStr,
          quantity: `${item.totalQuantity} ${item.unit}`,
        });
      }
    }
  });

  todos.forEach((t) => {
    if (!t.isCompleted) {
      upcomingTodos.push({
        id: t.id,
        title: t.title,
        targetDate: t.targetDate || '近期',
        assignedTo: t.assignedTo,
        isTodayOrPast: t.targetDate ? t.targetDate <= todayStr : false,
      });
    }
  });

  let lineText = `📢【高家智能管家・${dayOfWeek}定期提醒報告】\n`;
  lineText += `📅 日期：${todayStr} (${dayOfWeek})\n`;
  lineText += `----------------------------------\n`;
  lineText += `🚨【緊急！3天內過期食品】(${urgentFoodAlerts.length} 項)\n`;
  lineText += urgentFoodAlerts.length > 0
    ? urgentFoodAlerts.map((f) => `• [${f.owner}] ${f.name} - 存放於「${f.location}」，期限：${f.expiryDate}`).join('\n') + '\n'
    : `✅ 無即將過期食品，保鮮良好！\n`;
  lineText += `\n🗓️【本月內即將到期食品】(${monthFoodAlerts.length} 項)\n`;
  lineText += monthFoodAlerts.length > 0
    ? monthFoodAlerts.map((f) => `• ${f.name} - 期限：${f.expiryDate}`).join('\n') + '\n'
    : `✅ 本月無其他到期食品。\n`;
  lineText += `\n💊【醫療耗材／日用品低量警示】(${lowMedicalSupplies.length} 項剩餘<=2週)\n`;
  lineText += lowMedicalSupplies.length > 0
    ? lowMedicalSupplies.map((m) => `• ${m.name} 僅剩約 ${m.weeksRemaining} 週用量 (${m.quantity})`).join('\n') + '\n'
    : `✅ 常用常備藥與生活耗材充足。\n`;
  lineText += `\n📝【近期待辦家庭大小事】(${upcomingTodos.length} 項)\n`;
  lineText += upcomingTodos.length > 0
    ? upcomingTodos.map((t, idx) => `${idx + 1}. [${t.assignedTo}] ${t.title}（預計：${t.targetDate}）`).join('\n') + '\n'
    : `✅ 目前無未完成待辦事項。\n`;
  lineText += `----------------------------------\n`;
  lineText += `💡 點擊 App 連結可即時登錄領用或更新庫存！`;

  return {
    generatedDate: todayStr,
    dayOfWeek,
    title: `高家智能管家 ${dayOfWeek} 定期家庭快報`,
    urgentFoodAlerts,
    monthFoodAlerts,
    lowMedicalSupplies,
    upcomingTodos,
    lineFormattedText: lineText,
  };
}