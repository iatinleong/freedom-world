# 《自由江湖》深度技術流程與用戶路徑 (Deep Logic & User Flow)

本文件詳述了遊戲從啟動到交互的核心邏輯鏈條，供開發與調試參考。

## 1. 系統啟動與初始化 (System Boot & Hydration)
當用戶打開網頁時，程式碼按以下順序執行：

1.  **環境掛載 (`Home/page.tsx`)**:
    *   `mounted` 狀態設為 `true`。
    *   呼叫 `useAuthStore.initialize()`：檢查 Supabase Session 狀態。
2.  **存檔恢復 (`saveGameStore.ts`)**:
    *   若用戶已登入且遊戲尚未開始：
        *   呼叫 `restoreLatestAutoSave()`：從伺服器/本地尋找最新的 `gameState`。
        *   呼叫 `loadGameState(save)`：透過 Zustand 批量覆蓋當前狀態。
3.  **條件導向 (Gatekeeping)**:
    *   `if (!user)` -> 顯示 `AuthScreen` (登入/註冊)。
    *   `if (!isConfigured)` -> 顯示 `AIConfigScreen` (設定 API Key)。
    *   `if (!isGameStarted)` -> 顯示 `CharacterCreation` (創角畫面)。

---

## 2. 創角與屬性注入 (Character Creation Logic)

1.  **隨機化 (`CharacterCreation.tsx`)**:
    *   使用 `Math.random()` 產生 7 大基礎屬性 (1-10)。
    *   計算 `totalPoints` 總和。
2.  **屬性寫入 (`store.ts` - `setPlayerProfile`)**:
    *   **初始計算公式**：
        *   `maxHp = constitution (根骨) * 20`
        *   `maxQi = spirit (定力) * 10`
    *   將數值注入 `player.stats` 並初始化狀態。
3.  **啟動遊戲**: `isGameStarted` 設為 `true`，`ActionPanel` 進入對話監聽狀態。

---

## 3. AI 敘事引擎核心循環 (The AI Engine Loop)

### A. 準備階段 (Prompt Construction)
1.  **狀態收集**: `getGameState()` 抓取當前快照。
2.  **系統提示構建 (`prompt.ts`)**:
    *   **前情提要**: 注入 `summary` (滾動摘要)。
    *   **近期記憶**: 取最後 4 條 `narrative` 紀錄。
    *   **數值注入**: 當前 HP, Qi, 屬性, 裝備, 環境標籤。
    *   **GM 規則**: 注入傷害標竿 (-5/-20/-50) 與屬性判定優先權。

### B. API 通訊 (`gemini.ts`)
1.  發送 `POST` 請求至 `/api/gemini`。
2.  根據配置轉接至對應的 AI Provider (Gemini / Grok / Claude)。

### C. 結果解析與狀態更新 (`ActionPanel.tsx`)
AI 回傳 JSON 後，系統按以下邏輯執行 `stateUpdate`：

1.  **數值變動**:
    *   `hp/qi/hunger` 按回傳值累加。
    *   若 `hp <= 0` -> 觸發 `Home` 組件顯示 `DeathScreen`。
2.  **屬性連動 (Logic Reinforcement)**:
    *   若 `attributeChanges` 包含「根骨」或「定力」：
        *   自動更新 `maxHp` (根骨*20) 或 `maxQi` (定力*10)。
        *   同步修復生命/內力當前值，確保不會出現「上限增加但血量沒動」的 Bug。
3.  **資產獲取**:
    *   `addItem(item)`：物品進入背包，若重複則累加 `count`。
    *   `learnSkill(skill)`：更新武學列表，自動計算 `power` (等級 * 品階)。
    *   `addTitle(title)`：將新稱號加入解鎖清單。
4.  **環境同步**: `updateWorld` 更新地點或增減環境標籤 (`tags`)。

---

## 4. 存檔與性能管理 (Persistence & Optimization)

1.  **自動存檔**: 在每一回合 `handleAction` 結束後，非同步將 `GameState` 儲存。
2.  **滾動摘要 (Rolling Summary)**:
    *   每 20 回合觸發 `generateStorySummary`。
    *   將舊摘要 + 最近 20 輪對話合併成 200 字精簡文本。
    *   目的：防止上下文 (Context Window) 溢出，保持長線連貫。
3.  **Token 監控**: 紀錄 `usageStore.ts` 數據，計算美金成本並顯示於 UI。

---

## 5. UI 層級與交互限制 (UI Layers)

*   **z-Index 規劃**:
    *   `z-10`: 背景裝飾。
    *   `z-40`: HUD 狀態欄。
    *   `z-90`: 設置按鈕 (當角色面板打開時移除)。
    *   `z-140`: 面板遮罩 (Backdrop)。
    *   `z-150`: 角色面板側邊欄。
    *   `z-200`: 設置選單 Overlay。
*   **交互衝突修復**:
    *   `CharacterPanel` 開啟時會移除 `GameMenu` 按鈕以防右上角點擊重疊。
    *   所有彈窗皆實作了 `e.stopPropagation()` 以防點擊穿透。
