# 🏡 高家智能管家 (Kao Family Smart Butler)

> 專為「高家」量身打造的 iOS 風格頂級智能家庭物業管家 App。支援語音、雙照拍照、文字 AI 多模態辨識登錄、高家 1~4 樓立體空間收納對照、家庭成員色彩標記、智能效期預警、NFC 快速感應盤點、Google Sheets 雲端同步以及 LINE 晨報推播。

---

## 🌟 核心功能特色

- 🎙️ **多模態 AI 智慧辨識登錄**：
  - 支援 **語音口述**（Web Speech API）、**雙照拍照**（細節特寫 + 廣角全景）與 **文字描述**。
  - 整合 **Google Gemini AI (Gemini 2.5)** 伺服器端解析，自動萃取物品名稱、類別、存放樓層/收納單元、數量、單位、保鮮期/保固期與歸屬人。
- 👥 **高家專屬成員對照與色彩識別**：
  - 支援「瑋（老爸）」、「珍（老媽）」、「朋（哥哥）」、「淨（姊姊）」、「炘（語炘）」、「豐（家豐）」、「柔（彩柔）」專屬暱稱對照與家族顏色。
- 🏢 **立體樓層空間層級收納**：
  - 精準對照高家 1F（客廳/廚房/玄關/車庫）、2F（主臥/儲藏室）、3F（次臥/洗衣陽台）、4F（頂樓水塔雜物區）。
- ⏳ **智慧效期與庫存預警**：
  - 食品 3 天內過期緊急紅燈警示、30 天內即期黃燈提醒、常備藥品/耗材低水位通知。
- 📱 **NFC 標籤快速感應**：
  - 支援 Web NFC API，手機碰觸收納箱/層架上的 NFC 標籤即可直接定位物品清單。
- 📊 **可視化數據分析與報表**：
  - 各樓層/空間物品佔比、過期風險趨勢、家人物品分佈圓餅圖/柱狀圖 (Recharts)。
- 📋 **LINE 每日晨報與 Google Sheets 備份**：
  - 一鍵生成格式化 LINE 通知訊息、模擬推播發送；支援匯出與同步至 Google Sheets。

---

## 🛠️ 技術棧 (Tech Stack)

| 領域 | 技術 / 套件 | 說明 |
| :--- | :--- | :--- |
| **前端核心** | React 19, TypeScript 5.8 | 最新版 React 與嚴格型別定義 |
| **建置工具** | Vite 6, @vitejs/plugin-react | 極速 HMR 開發與最佳化打包 |
| **樣式與動效** | Tailwind CSS 4, @tailwindcss/vite, Lucide React, Motion, Canvas Confetti | 現代 iOS 風格毛玻璃介面與流暢動效 |
| **圖表可視化** | Recharts 3.x | 現代響應式資料視覺化 |
| **後端與 API** | Node.js (20+), Express 4.x, tsx, esbuild | 輕量全端伺服器與 API 端點 |
| **AI 引擎** | Google GenAI SDK (`@google/genai`) | 支援 Gemini 2.5 Flash / Flash Lite 智能分析 |
| **CI / CD** | GitHub Actions | 自動化型別驗證、打包與 GitHub Pages 部署 |
| **容器化** | Docker (Multi-stage build) | 支援雲端平台 (Cloud Run / Railway / Render) 部署 |

---

## 🚀 快速開始 (Quick Start)

### 1. 環境需求
- **Node.js**：`>= 20.0.0` (建議 LTS 版本)
- **npm**：`>= 10.0.0`

### 2. 安裝套件
```bash
npm install
```

### 3. 設定環境變數
複製 `.env.example` 並建立 `.env`：
```bash
cp .env.example .env
```
在 `.env` 中填入您的 Google Gemini API 金鑰：
```env
GEMINI_API_KEY="your_google_gemini_api_key_here"
PORT=3000
```
> 💡 若未設定 `GEMINI_API_KEY`，系統亦內建智慧型本地 Local Parser 作為 Fallback 離線運行！

### 4. 啟動開發伺服器
```bash
npm run dev
```
啟動後打開瀏覽器訪問：**`http://localhost:3000`**

---

## 📜 NPM 指令清單

| 指令 | 說明 |
| :--- | :--- |
| `npm run dev` | 啟動全端整合開發環境（Express API + Vite 即時編譯） |
| `npm run dev:client` | 僅啟動 Vite 前端開發伺服器 |
| `npm run build` | 完整建置前端靜態資源與後端伺服器至 `dist/` |
| `npm run build:client` | 僅建置前端 SPA 靜態檔案至 `dist/`（適合 GitHub Pages） |
| `npm run start` | 以 Production 模式啟動編譯後的 Express 伺服器 |
| `npm run preview` | 本地預覽前端靜態打包成果 |
| `npm run lint` | 執行 TypeScript 型別檢查 (`tsc --noEmit`) |
| `npm run clean` | 跨平台清理 `dist/` 打包產出 |

---

## 🚢 部署上線 (Deployment)

專案支援兩種部署模式：

### 模式 A：GitHub Pages 自動部署（前端靜態網頁）

專案已內建 `.github/workflows/deploy.yml`。

1. 將本專案推送到 GitHub Repository (`main` 或 `master` 分支)。
2. 進入 GitHub 專案頁面 -> 點擊 **Settings** -> **Pages**。
3. 在 **Build and deployment** 下方的 **Source** 選擇 **`GitHub Actions`**。
4. 之後每次 `git push`，GitHub Actions 將會自動執行型別檢查、打包並部署到 GitHub Pages。

---

### 模式 B：Docker / 雲端容器部署（全端 + Gemini API）

若需要完整的 Express 後端 API 與 Google Gemini 伺服器端串接，可使用專案內建的 `Dockerfile`：

```bash
# 1. 建置 Docker 映像檔
docker build -t home-ai-assistant .

# 2. 啟動容器
docker run -d -p 3000:3000 -e GEMINI_API_KEY="your_api_key" --name home-ai home-ai-assistant
```

支援一鍵部署平台：
- **Google Cloud Run**
- **Railway** / **Render** / **Fly.io**
- **Synology NAS / QNAP Container Station**（家庭私有伺服器）

---

## 📁 專案目錄結構

```text
├── .github/
│   └── workflows/
│       ├── deploy.yml         # GitHub Pages 自動化 CI/CD 部署
│       └── ci.yml             # Pull Request & Push 程式碼品質與型別檢查
├── assets/                    # 靜態多媒體資源
├── src/
│   ├── components/            # React 核心元件
│   │   ├── Backstage.tsx      # 後台物品/待辦清單管理與篩選
│   │   ├── BriefingModal.tsx  # 晨報/週報生成與 LINE 格式發送
│   │   ├── ConsumeModal.tsx   # 物品消耗與扣除庫存
│   │   ├── DataAnalytics.tsx  # 空間/效期/成員數據圖表
│   │   ├── Frontstage.tsx     # 前台快捷登錄、即期提醒與搜尋
│   │   ├── Navbar.tsx         # 頂部導航與通知中心
│   │   ├── NfcModal.tsx       # NFC 標籤感應與寫入
│   │   ├── PhotoLightbox.tsx  # 照片大圖燈箱瀏覽
│   │   ├── RegisterModal.tsx  # 物品/待辦多模態登錄彈窗
│   │   └── SearchModal.tsx    # 智能綜合搜尋
│   ├── data/
│   │   └── initialData.ts     # 高家初始空間、成員與示範庫存資料
│   ├── utils/
│   │   ├── nfcHelper.ts       # Web NFC API 封裝
│   │   └── speechRecognition.ts # Web Speech API 語音辨識
│   ├── App.tsx                # 應用主入口
│   ├── index.css              # 全域樣式與 Tailwind 配置
│   ├── main.tsx               # React DOM 渲染入口
│   └── types.ts               # TypeScript 領域模型型別定義
├── .dockerignore              # Docker 忽略清單
├── .env.example               # 環境變數設定範本
├── .gitignore                 # Git 忽略設定（避免敏感資訊與暫存檔外流）
├── Dockerfile                 # 生產環境多階段 Dockerfile
├── index.html                 # HTML 入口模板 (PWA/iOS Meta 優化)
├── metadata.json              # 專案能力宣告元數據
├── package.json               # 專案依賴與執行腳本
├── server.ts                  # Express 後端與 Gemini API 中繼服務
├── tsconfig.json              # TypeScript 編譯配置
└── vite.config.ts             # Vite 配置 (Tailwind 4 + Base Path)
```

---

## 🔒 隱私與安全規範

- 專案已在 `.gitignore` 中嚴格排除 `.env`、`.env.*.local`、金鑰檔（`*.pem`, `*.key`）以及暫存記錄。
- 請勿將真實的 `GEMINI_API_KEY` 提交到公開版本控制系統中。
- 如需在 GitHub Actions 中使用特定金鑰，請至 GitHub Repository -> `Settings` -> `Secrets and variables` -> `Actions` 進行安全配置。

---

## 👨‍👩‍👧‍👦 高家成員說明

| 代號 | 成員 | 預設主題色 | 備註 |
| :---: | :---: | :---: | :---: |
| **瑋** | 樹瑋 (老爸) | 經典海軍藍 | 家長 / 工具與公共設備管理 |
| **珍** | 美珍 (老媽) | 暖珊瑚粉 | 家長 / 廚房食材與日用品管理 |
| **朋** | 有朋 (哥哥) | 翡翠綠 | 長子 |
| **淨** | 于淨 (姊姊) | 薰衣草紫 | 長女 |
| **炘** | 語炘 | 琥珀橘 | 次女 |
| **豐** | 家豐 | 蔚藍海 | 次子 |
| **柔** | 彩柔 | 玫瑰粉 | 么女 |