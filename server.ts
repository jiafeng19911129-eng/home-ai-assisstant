import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Lazy Google Gen AI helper
let genAiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY is not set. Falling back to intelligent local parser.');
    return null;
  }
  if (!genAiClient) {
    genAiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAiClient;
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    appName: '高家智能管家 (Kao Family Smart Butler)',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    serverTime: new Date().toISOString(),
  });
});

// Helper: Calculate date + days in YYYY-MM-DD
function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

// 1. POST /api/gemini/analyze: Analyze speech, photos, or text input
app.post('/api/gemini/analyze', async (req, res) => {
  try {
    const {
      transcript = '',
      currentUser = '瑋',
      closeUpPhotoBase64,
      closeUpMime = 'image/jpeg',
      widePhotoBase64,
      wideMime = 'image/jpeg',
      existingInventory = [],
    } = req.body;

    const ai = getGenAI();
    const todayStr = new Date().toISOString().split('T')[0];

    // Build existing inventory summary for conflict & match detection
    const existingNames = (existingInventory as Array<{ id: string; name: string; locations: any[]; owner: string }>).map(
      (item) => ({
        id: item.id,
        name: item.name,
        locations: item.locations?.map((l: any) => l.fullPath || `${l.floor}${l.room}${l.storageUnit}`).join('、') || '',
        owner: item.owner,
      })
    );

    if (ai) {
      const systemInstruction = `
你是一位專屬於「高家」的頂級智能家庭管家 AI (Gemini Spark)。
高家家庭成員代碼與稱謂別名完全對照表（嚴格遵從）：
- 【瑋】：稱謂別名包含「樹瑋」、「老爸」、「爸爸」、「瑋瑋」、「瑋」。當使用者說「樹瑋」或「老爸」時，歸屬人一律精確辨識為「瑋」。
- 【珍】：稱謂別名包含「美珍」、「老媽」、「媽媽」、「阿珍」、「珍」。當使用者說「美珍」或「老媽」時，歸屬人一律精確辨識為「珍」。
- 【朋】：稱謂別名包含「有朋」、「哥哥」、「大哥」、「朋朋」、「朋」。當使用者說「有朋」或「哥哥」時，歸屬人一律精確辨識為「朋」。
- 【淨】：稱謂別名包含「于淨」、「姊姊」、「姐姐」、「大姊」、「淨淨」、「淨」。當使用者說「于淨」或「姊姊/姐姐」時，歸屬人一律精確辨識為「淨」。
- 【炘】：稱謂別名包含「語炘」、「炘炘」、「阿炘」、「炘」。當使用者說「語炘」時，歸屬人一律精確辨識為「炘」。
- 【豐】：稱謂別名包含「家豐」、「阿豐」、「豐豐」、「豐」。當使用者說「家豐」時，歸屬人一律精確辨識為「豐」。
- 【柔】：稱謂別名包含「彩柔」、「阿柔」、「柔柔」、「柔」。當使用者說「彩柔」時，歸屬人一律精確辨識為「柔」。

高家樓層與空間配置原則：
- 1樓：客廳（有「白色塑膠4層櫃」、「白色塑膠5層櫃」、「木質電視櫃」）、玄關（「玄關4層收納架」、「木質鞋櫃」）、廚房（「雙門大冰箱」、「系統流理台下櫃」、「廚房電器架」、「食材乾貨吊櫃」）、餐廳（「餐邊木櫃」）、車庫/庭院（「工具收納鐵架」）。
- 2樓：主臥室（大衣櫃、床頭櫃）、儲藏室（重型鐵架A、塑膠整理箱區）、2樓衛浴。
- 3樓：次臥多功能室（書架）、洗衣陽台（洗衣用品層架）。
- 4樓/頂樓：水塔與雜物棚。

分析任務規則：
1. 判斷輸入是「物品登錄 (Item)」還是「待辦事項 (Todo)」：
   - 重要原則：若內容描述物品、實體物品名稱、存放位置（如放冰箱、放櫃子、放客廳）、購買入庫、消耗等，一律視為「物品登錄 (Item, isTodo: false)」。即使含有「買」、「拿」等字眼（例如「買了牛奶放冰箱」、「珍買的鮮奶」），只要指涉具體物品，都屬於物品登錄！
   - 只有明確的行動指示/提醒/待辦行程（例如「近期拿蔬菜去大潭」、「去全聯買牛奶」、「星期五記得繳電費」、「修理3樓陽台水龍頭」）且無指涉具體已放置庫存時，才判定為「待辦事項 (isTodo: true)」。
2. 若為待辦事項 (isTodo: true)：
   - 若提及「近期」或未指明精確日期，預設 targetDate 為 3 天後（今天是 ${todayStr}，3天後是 ${addDays(3)}）。
   - 歸屬人若提及稱謂別名，請自動轉換為單字代碼（瑋、珍、朋、淨、炘、豐、柔）；若未提及則預設為當前登錄者【${currentUser}】。
3. 若為物品登錄 (isTodo: false)：
   - 物品名稱 (name)：萃取乾淨簡潔的名稱（例如「好市多鮮奶」、「普拿疼加強錠」、「象印電子鍋」）。
   - 類別 (category)：'food' (食品生鮮) | 'appliance' (家電電器) | 'medical' (醫療耗材) | 'daily' (日用品) | 'hardware' (五金備品) | 'other' (其他)。
   - 歸屬人 (owner)：嚴格依照稱謂別名對照表辨識（如「老爸買的」->「瑋」，「美珍買的」->「珍」，「哥哥買的」->「朋」，「姊姊買的」->「淨」，「語炘買的」->「炘」，「家豐買的」->「豐」，「彩柔買的」->「柔」；未提及時預設為【${currentUser}】）。
   - 購買來源 (purchaseSource)：分析發話中提及的購買通路或來源（例如「好市多 Costco」、「全聯福利中心」、「蝦皮購物」、「Momo 購物」、「家樂福」、「屈臣氏」、「大潭實體」、「海外代購」、「親友贈送」等），若無提及則設為 null 或常見來源。
   - 存放地點層級分析 (location)：
     - floor: 1樓 / 2樓 / 3樓 / 4樓 / 戶外
     - room: 客廳 / 廚房 / 玄關 / 餐廳 / 主臥室 / 儲藏室 / 陽台 等
     - storageUnit: 例如「白色塑膠4層櫃」、「白色塑膠5層櫃」、「雙門大冰箱」、「廚房電器架」、「重型鐵架A」等。
     - subLocation: 例如「第1層」、「第2層」、「冷藏室中層」、「蔬果保鮮抽屜」等。
     - quantity 與 unit: 數量與單位（如 2 瓶、3 盒、1 台、4 包、1 袋）。
   - 食物保存期限 (expiryDate)：若為食物，提取精確到期日；若未提及且語意模糊，可預估合理天數（例如鮮乳5天）。
   - 電器保固 (warrantyDate, isWarrantyValid)：電器預設為已過期 (isWarrantyValid: false)，除非發話中有特別提及「剛買、新買、保固中、保固到XX年」。
   - 醫療耗材/日用品可用時長 (estimatedLifespanWeeks)：若為醫療耗材（如口罩、常備藥）或日用品，分析該數量預估可用多久（例如剩餘 1.5 週用量、2 週用量）。
   - 缺漏關鍵資訊檢測 (missingFields)：若發話完全未提及存放地點或缺少重要資訊，請在 missingFields 列出欄位及詢問提示句，以便前台跳出輸入框讓使用者補充！
   - 重複/衝突檢測 (conflictDetected)：比對現有物品庫存列表 ${JSON.stringify(existingNames)}。若發現名稱相似或相同的物品，設定 conflictDetected 為 true，並回傳 existingItemMatch。
   - 標籤 (tags)：建立層級標籤（例如 ["1樓", "1樓客廳", "好市多", "醫療藥品", "${currentUser}"]）。

請一律以嚴格的 JSON 格式回傳，格式如下：
{
  "isTodo": boolean,
  "todoData": {
    "title": string,
    "assignedTo": "瑋" | "珍" | "朋" | "淨" | "炘" | "豐" | "柔",
    "targetDate": "YYYY-MM-DD",
    "locationTag": string,
    "note": string
  },
  "itemData": {
    "name": string,
    "category": "food" | "appliance" | "medical" | "daily" | "hardware" | "other",
    "owner": "瑋" | "珍" | "朋" | "淨" | "炘" | "豐" | "柔",
    "purchaseSource": string | null,
    "purchaseUrl": string | null,
    "purchaseProofUrl": string | null,
    "location": {
      "floor": string,
      "room": string,
      "storageUnit": string,
      "subLocation": string,
      "quantity": number,
      "unit": string
    },
    "totalQuantity": number,
    "unit": string,
    "expiryDate": "YYYY-MM-DD" | null,
    "warrantyDate": "YYYY-MM-DD" | null,
    "isWarrantyValid": boolean,
    "manualUrl": string | null,
    "estimatedLifespanWeeks": number | null,
    "tags": string[],
    "summary": string
  },
  "conflictDetected": boolean,
  "existingItemMatch": {
    "id": string,
    "name": string,
    "locationsSummary": string,
    "owner": string
  } | null,
  "missingFields": [
    {
      "field": "location" | "quantity" | "expiryDate" | "todoDate" | "owner",
      "question": string,
      "defaultValue": string
    }
  ],
  "rawTranscript": string
}
`;

      const promptText = `
當前登錄者：【${currentUser}】
使用者輸入內容/語音轉文字："""${transcript}"""
${closeUpPhotoBase64 ? '（附帶物品近照分析）' : ''}
${widePhotoBase64 ? '（附帶物品遠照/環境放置點分析）' : ''}
請詳細分析並輸出 JSON。
`;

      const parts: any[] = [];
      if (closeUpPhotoBase64) {
        parts.push({
          inlineData: {
            mimeType: closeUpMime,
            data: closeUpPhotoBase64.replace(/^data:image\/\w+;base64,/, ''),
          },
        });
      }
      if (widePhotoBase64) {
        parts.push({
          inlineData: {
            mimeType: wideMime,
            data: widePhotoBase64.replace(/^data:image\/\w+;base64,/, ''),
          },
        });
      }
      parts.push({ text: promptText });

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: { parts },
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const responseText = response.text || '{}';
      const parsed = JSON.parse(responseText);
      return res.json(parsed);
    }

    // Fallback intelligent parser if no Gemini API key
    const isExplicitTodo = transcript.startsWith('待辦') || transcript.startsWith('提醒') || transcript.includes('記得要') || transcript.includes('近期去') || transcript.includes('近期拿') || (transcript.includes('去大潭') && !transcript.includes('放'));
    const isTodo = isExplicitTodo;

    // Family Member Alias Mapping
    let matchedOwner = currentUser;
    if (transcript.includes('樹瑋') || transcript.includes('老爸') || transcript.includes('爸爸') || transcript.includes('瑋')) {
      matchedOwner = '瑋';
    } else if (transcript.includes('美珍') || transcript.includes('老媽') || transcript.includes('媽媽') || transcript.includes('珍')) {
      matchedOwner = '珍';
    } else if (transcript.includes('有朋') || transcript.includes('哥哥') || transcript.includes('大哥') || transcript.includes('朋')) {
      matchedOwner = '朋';
    } else if (transcript.includes('于淨') || transcript.includes('姊姊') || transcript.includes('姐姐') || transcript.includes('大姊') || transcript.includes('淨')) {
      matchedOwner = '淨';
    } else if (transcript.includes('語炘') || transcript.includes('炘')) {
      matchedOwner = '炘';
    } else if (transcript.includes('家豐') || transcript.includes('豐')) {
      matchedOwner = '豐';
    } else if (transcript.includes('彩柔') || transcript.includes('柔')) {
      matchedOwner = '柔';
    }
    
    // Check purchase source
    let purchaseSource: string | null = null;
    if (transcript.includes('好市多') || transcript.includes('Costco') || transcript.includes('costco')) {
      purchaseSource = '好市多 Costco';
    } else if (transcript.includes('全聯')) {
      purchaseSource = '全聯福利中心';
    } else if (transcript.includes('蝦皮')) {
      purchaseSource = '蝦皮購物';
    } else if (transcript.includes('momo') || transcript.includes('Momo') || transcript.includes('MOMO')) {
      purchaseSource = 'Momo 購物';
    } else if (transcript.includes('家樂福')) {
      purchaseSource = '家樂福';
    } else if (transcript.includes('屈臣氏') || transcript.includes('康是美')) {
      purchaseSource = '屈臣氏 / 康是美';
    } else if (transcript.includes('大潭')) {
      purchaseSource = '大潭實體門市';
    } else if (transcript.includes('代購') || transcript.includes('日本') || transcript.includes('國外')) {
      purchaseSource = '海外代購';
    } else if (transcript.includes('送') || transcript.includes('禮物')) {
      purchaseSource = '親友贈送';
    }

    // Check floor
    let floor = '1樓';
    if (transcript.includes('2樓') || transcript.includes('二樓')) floor = '2樓';
    else if (transcript.includes('3樓') || transcript.includes('三樓')) floor = '3樓';
    else if (transcript.includes('4樓') || transcript.includes('頂樓')) floor = '4樓';
    else if (transcript.includes('車庫')) floor = '戶外車庫';

    // Check room
    let room = '客廳';
    if (transcript.includes('廚房') || transcript.includes('冰箱')) room = '廚房';
    else if (transcript.includes('玄關') || transcript.includes('鞋櫃')) room = '玄關';
    else if (transcript.includes('儲藏室') || transcript.includes('鐵架')) room = '儲藏室';
    else if (transcript.includes('主臥')) room = '主臥室';
    else if (transcript.includes('陽台')) room = '陽台';

    // Check storage unit
    let storageUnit = '白色塑膠4層櫃';
    if (transcript.includes('5層') || transcript.includes('五層')) storageUnit = '白色塑膠5層櫃';
    else if (transcript.includes('4層') || transcript.includes('四層')) storageUnit = '白色塑膠4層櫃';
    else if (transcript.includes('冰箱')) storageUnit = '雙門大冰箱';
    else if (transcript.includes('電器架')) storageUnit = '廚房電器架';
    else if (transcript.includes('鐵架')) storageUnit = '重型鐵架A';
    else if (transcript.includes('鞋櫃')) storageUnit = '木質鞋櫃';

    let subLoc = '第1層';
    if (transcript.includes('第2層') || transcript.includes('第二層')) subLoc = '第2層';
    else if (transcript.includes('第3層') || transcript.includes('第三層')) subLoc = '第3層';
    else if (transcript.includes('第4層') || transcript.includes('第四層')) subLoc = '第4層';
    else if (transcript.includes('冷藏中層') || transcript.includes('冷藏室中層')) subLoc = '冷藏室中層';
    else if (transcript.includes('冷藏上層')) subLoc = '冷藏室上層';
    else if (transcript.includes('冷凍')) subLoc = '冷凍庫上抽屜';
    else if (transcript.includes('蔬果')) subLoc = '蔬果保鮮抽屜';

    // Clean name
    let cleanName = transcript
      .replace(/樹瑋|老爸|爸爸|美珍|老媽|媽媽|有朋|哥哥|大哥|于淨|姊姊|姐姐|大姊|語炘|家豐|彩柔/g, '')
      .replace(/珍買的|瑋買的|朋買的|淨買的|炘買的|豐買的|柔買的|買的|買了/g, '')
      .replace(/好市多|Costco|全聯|蝦皮|momo|Momo|家樂福|屈臣氏|康是美|大潭/g, '')
      .replace(/放在|放|存放在|在/g, ' ')
      .replace(/1樓|2樓|3樓|4樓|廚房|客廳|玄關|冰箱|白色塑膠4層櫃|白色塑膠5層櫃|電器架|冷藏室中層|冷藏中層|第\d層/g, ' ')
      .trim();
    if (!cleanName || cleanName.length < 1) {
      cleanName = transcript.slice(0, 15) || '高家新物品';
    }

    const hasLocation = transcript.includes('放') || transcript.includes('櫃') || transcript.includes('樓') || transcript.includes('廚房') || transcript.includes('冰箱') || transcript.includes('抽屜');

    const tagsList = [floor, `${floor}${room}`, matchedOwner];
    if (purchaseSource) tagsList.push(purchaseSource.split(' ')[0]);

    const fallbackResponse = {
      isTodo,
      todoData: isTodo
        ? {
            title: transcript || '近期家庭待辦事項',
            assignedTo: matchedOwner,
            targetDate: addDays(3),
            locationTag: transcript.includes('大潭') ? '大潭' : '高家',
            note: transcript,
          }
        : undefined,
      itemData: !isTodo
        ? {
            name: cleanName,
            category: transcript.includes('奶') || transcript.includes('菜') || transcript.includes('吃') || transcript.includes('蛋') || transcript.includes('肉') || transcript.includes('米') || transcript.includes('果') ? 'food' : transcript.includes('藥') || transcript.includes('口罩') || transcript.includes('普拿疼') ? 'medical' : transcript.includes('鍋') || transcript.includes('機') || transcript.includes('器') || transcript.includes('扇') ? 'appliance' : transcript.includes('紙') || transcript.includes('洗') || transcript.includes('潔') ? 'daily' : 'other',
            owner: matchedOwner,
            purchaseSource,
            purchaseUrl: null,
            purchaseProofUrl: null,
            location: {
              floor,
              room,
              storageUnit,
              subLocation: subLoc,
              quantity: 1,
              unit: '件',
            },
            totalQuantity: 1,
            unit: '件',
            expiryDate: transcript.includes('過期') ? addDays(5) : (transcript.includes('奶') || transcript.includes('菜') ? addDays(7) : null),
            warrantyDate: null,
            isWarrantyValid: transcript.includes('新買') || transcript.includes('剛買') || transcript.includes('保固中'),
            estimatedLifespanWeeks: 4,
            tags: tagsList,
            summary: `${matchedOwner} 登錄之物品${purchaseSource ? `（購自 ${purchaseSource}）` : ''}，存放於 ${floor} ${room} ${storageUnit} ${subLoc}`,
          }
        : undefined,
      conflictDetected: false,
      missingFields: !hasLocation && !isTodo
        ? [
            {
              field: 'location',
              question: '請問這件物品存放在高家哪裡呢？（例如：1樓客廳白色塑膠4層櫃第2層）',
              defaultValue: '1樓客廳白色塑膠4層櫃第1層',
            },
          ]
        : [],
      rawTranscript: transcript,
    };

    return res.json(fallbackResponse);
  } catch (error: any) {
    console.error('Error in /api/gemini/analyze:', error);
    res.status(500).json({ error: error.message || 'Analysis failed' });
  }
});

// 2. POST /api/gemini/briefing: Generate Monday & Friday Line Push Briefing
app.post('/api/gemini/briefing', async (req, res) => {
  try {
    const { items = [], todos = [] } = req.body;
    const ai = getGenAI();

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const dayNames = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
    const currentDayName = dayNames[today.getDay()] || '週一';

    // 1. Urgent food (within 3 days)
    const urgentFoodAlerts: any[] = [];
    const monthFoodAlerts: any[] = [];
    const lowMedicalSupplies: any[] = [];

    const currentMonth = today.getMonth() + 1;

    items.forEach((item: any) => {
      if (item.category === 'food' && item.expiryDate) {
        const exp = new Date(item.expiryDate);
        const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 3600 * 24));
        const locStr = item.locations?.map((l: any) => l.fullPath || `${l.floor}${l.room}${l.storageUnit}`).join('、') || '高家';

        if (diffDays <= 3) {
          urgentFoodAlerts.push({
            id: item.id,
            name: item.name,
            daysLeft: diffDays,
            expiryDate: item.expiryDate,
            location: locStr,
            owner: item.owner,
          });
        } else if (exp.getMonth() + 1 === currentMonth) {
          monthFoodAlerts.push({
            id: item.id,
            name: item.name,
            expiryDate: item.expiryDate,
            location: locStr,
          });
        }
      }

      // 2. Medical / Consumables with <= 2 weeks remaining
      if ((item.category === 'medical' || item.category === 'daily') && item.estimatedLifespanWeeks !== undefined) {
        if (item.estimatedLifespanWeeks <= 2) {
          const locStr = item.locations?.map((l: any) => l.fullPath || `${l.floor}${l.room}${l.storageUnit}`).join('、') || '高家';
          lowMedicalSupplies.push({
            id: item.id,
            name: item.name,
            weeksRemaining: item.estimatedLifespanWeeks,
            location: locStr,
            quantity: `${item.totalQuantity || 1} ${item.unit || '份'}`,
          });
        }
      }
    });

    // 3. Upcoming todos
    const upcomingTodos = (todos as any[])
      .filter((t) => !t.isCompleted)
      .map((t) => {
        const tDate = new Date(t.targetDate);
        const isTodayOrPast = t.targetDate <= todayStr;
        return {
          id: t.id,
          title: t.title,
          targetDate: t.targetDate,
          assignedTo: t.assignedTo,
          isTodayOrPast,
        };
      });

    let lineFormattedText = `📢【高家智能管家・${currentDayName}定期提醒報告】
📅 日期：${todayStr} (${currentDayName})
----------------------------------
🚨【緊急！3天內過期食品】(${urgentFoodAlerts.length} 項)
${
  urgentFoodAlerts.length > 0
    ? urgentFoodAlerts.map((f, idx) => `${idx + 1}. ${f.name}（剩餘 ${f.daysLeft} 天，${f.expiryDate} 到期）\n   📍 存放：${f.location}\n   👤 歸屬：${f.owner}`).join('\n')
    : '✅ 無即將過期食品，保鮮良好！'
}

🗓️【本月內即將到期食品】(${monthFoodAlerts.length} 項)
${
  monthFoodAlerts.length > 0
    ? monthFoodAlerts.map((f, idx) => `${idx + 1}. ${f.name}（到期日：${f.expiryDate}）\n   📍 存放：${f.location}`).join('\n')
    : '✅ 本月無其他到期食品。'
}

💊【醫療耗材／日用品低量警示】(${lowMedicalSupplies.length} 項剩餘<=2週)
${
  lowMedicalSupplies.length > 0
    ? lowMedicalSupplies.map((m, idx) => `${idx + 1}. ${m.name}（剩餘約 ${m.weeksRemaining} 週用量，現存 ${m.quantity}）\n   📍 存放：${m.location}`).join('\n')
    : '✅ 常用常備藥與生活耗材充足。'
}

📝【近期待辦家庭大小事】(${upcomingTodos.length} 項)
${
  upcomingTodos.length > 0
    ? upcomingTodos.map((t, idx) => `${idx + 1}. [${t.assignedTo}] ${t.title}（預計：${t.targetDate}${t.isTodayOrPast ? ' 🔥今日到期' : ''}）`).join('\n')
    : '🎉 目前無待辦事項！'
}
----------------------------------
💡 點擊 App 連結可即時登錄領用或更新庫存！`;

    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.7-flash',
          contents: `
請以溫暖親切的高家智能管家口吻，針對以下家庭庫存與待辦資料，潤飾並生成最適合直接發送到 LINE 官方帳號/LINE家庭群組的精美推播簡報：
日期：${todayStr} (${currentDayName})
緊急3天內過期食品：${JSON.stringify(urgentFoodAlerts)}
當月到期食品：${JSON.stringify(monthFoodAlerts)}
醫療耗材剩下2週用量：${JSON.stringify(lowMedicalSupplies)}
家庭待辦事項：${JSON.stringify(upcomingTodos)}

請確保排版清晰、善用表情符號、標註存放地點與負責家人，方便長輩與年輕家人在手機上一目了然。
`,
        });
        if (response.text) {
          lineFormattedText = response.text;
        }
      } catch (err) {
        console.warn('AI formatting failed, using built-in template', err);
      }
    }

    res.json({
      generatedDate: todayStr,
      dayOfWeek: currentDayName,
      title: `高家智能管家 ${currentDayName} 定期家庭快報`,
      urgentFoodAlerts,
      monthFoodAlerts,
      lowMedicalSupplies,
      upcomingTodos,
      lineFormattedText,
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/briefing:', error);
    res.status(500).json({ error: error.message || 'Briefing generation failed' });
  }
});

// 3. POST /api/line/push-simulate: Simulate push notification to Line
app.post('/api/line/push-simulate', (req, res) => {
  const { message, targetGroup = '高家大小事 LINE 群組' } = req.body;
  res.json({
    success: true,
    dispatchedAt: new Date().toISOString(),
    targetGroup,
    messageLength: message?.length || 0,
    status: '已成功傳送至 LINE 官方帳號推播佇列！',
  });
});

// 4. POST /api/sync/google-sheets: Export / Synchronize to Google Sheets format
app.post('/api/sync/google-sheets', (req, res) => {
  const { items = [], todos = [] } = req.body;
  const rows = items.map((item: any, idx: number) => ({
    序號: idx + 1,
    物品名稱: item.name,
    類別: item.category,
    擁有者: item.owner,
    登錄者: item.recordedBy,
    購買來源: item.purchaseSource || '未標註',
    總數量: `${item.totalQuantity} ${item.unit}`,
    存放地點: item.locations?.map((l: any) => l.fullPath).join(' | '),
    保存保固期限: item.expiryDate || item.warrantyDate || '無',
    預估可用時長: item.estimatedLifespanWeeks ? `${item.estimatedLifespanWeeks} 週` : '-',
    標籤: item.tags?.join(', '),
    購買證明連結: item.purchaseUrl || item.purchaseProofUrl || '-',
    說明書連結: item.manualUrl || '-',
    更新時間: item.updatedAt || new Date().toISOString(),
  }));

  res.json({
    success: true,
    spreadsheetId: '1KaoFamily_SmartButler_Inventory_Spreadsheet_2026',
    sheetName: '高家物品總表',
    syncedRows: rows.length,
    todosCount: todos.length,
    lastSyncTime: new Date().toISOString(),
    rows,
  });
});

// Start server with Vite middleware
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`高家智能管家 Server running on http://localhost:${PORT}`);
  });
}

startServer();
