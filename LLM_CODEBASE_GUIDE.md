# 🤖 Freedom Jianghu (自由江湖) - Ultimate LLM Codebase Guide

This document is a comprehensive technical manual designed for Large Language Models (Claude, Gemini, GPT-4, etc.) to immediately understand the architecture, data flow, styling conventions, and modification patterns of the `freedom-jianghu` project. Read this before making any structural changes.

---

## 1. Architecture & Tech Stack
*   **Core Framework:** Next.js 16.1 (App Router) + React 19.
*   **Styling:** Tailwind CSS v4 + Extensive Custom CSS (`src/app/globals.css`).
*   **State Management:** `zustand` (with `persist` middleware for local browser saves).
*   **Backend / DB:** Supabase (Handles Auth, Row Level Security, and Player Quotas/Turns).
*   **AI Engine:** Vercel AI SDK + Google Generative AI SDK. **Crucially, it supports multi-providers** (Gemini, Claude, Grok, DeepSeek, OpenAI) routed through a single Next.js API endpoint.

---

## 2. Core State Management (`zustand`)
The entire game operates on a single monolithic state object.
*   **File:** `src/lib/engine/store.ts` (`useGameStore`)
*   **Key State Slices:**
    *   `player`: Stats (HP, Qi), attributes (strength, constitution), skills (basics, internal, light), inventory, unlocked titles, reputation.
    *   `world`: Current location, weather, time system.
    *   `worldState`: Quest tracking (`mainQuest`, `questArc`, `questHistory`).
    *   `narrative`: The chat log history between 'user' and 'assistant'.
    *   `usage`: Tracks AI token consumption and cost.

**Important Note on Derived Stats:**
When modifying player attributes (like `constitution` or `spirit`), derived stats (`maxHp`, `maxQi`) are recalculated inside the `updatePlayerStats` action in `store.ts`.

---

## 3. The AI Integration Pipeline (Critical)
The game relies on structured JSON outputs from AI models to drive game logic.

### A. The Server-Side Proxy
*   **File:** `src/app/api/gemini/route.ts`
*   **Purpose:** To securely hold the `AI_API_KEY` environment variable. It receives requests from the client, determines the provider (e.g., 'gemini', 'claude'), makes the actual API call, and returns the response. All providers are instructed to return **JSON formats**.

### B. The Client-Side Helpers
*   **File:** `src/lib/engine/gemini.ts`
*   **Purpose:** Wraps the API route calls. Contains specific functions for different game systems:
    *   `generateGameResponse()`: Used for standard turn-by-turn action resolution.
    *   `generateNextQuest()`: Generates a short, punchy 20-character goal.
    *   `generateQuestArc()`: Generates an array of 10 interconnected chapter goals.
    *   `generateStorySummary()`: Compresses old summaries and new narrative logs to save context window tokens.

### C. The Prompt Engine
*   **File:** `src/lib/engine/prompt.ts`
*   **Purpose:** Translates the `zustand` GameState into a massive System Prompt. It injects the player's current health, location, inventory, and rules of the world. **If you need to change how the AI interprets an action or formats its response, modify this file.**

---

## 4. Styling & Theme System (Tailwind v4)
The project uses a highly customized "Wuxia" (Martial Arts) aesthetic. Do not use standard Tailwind colors if a custom theme color fits better.

*   **File:** `src/app/globals.css`
*   **Custom Colors (Tailwind Classes):**
    *   `text-wuxia-gold` / `bg-wuxia-gold` (#d4af37) - Main accent color.
    *   `text-wuxia-crimson` - For damage, danger, or low HP.
    *   `bg-wuxia-ink-blue` - Deep backgrounds.
    *   `text-wuxia-vermillion` - Keyword highlights.
*   **Custom UI Components (CSS Classes):**
    *   `.bamboo-texture`: Adds a bamboo scroll background pattern.
    *   `.paper-edge`: Adds a subtle paper-like border gradient.
    *   `.scroll-border`: An intricate ancient scroll border.
    *   `.cloud-divider`: A horizontal divider with a diamond '◆' in the middle.
    *   `.wuxia-card`: Used for selectable options with hover effects.
    *   `.animate-dry-ink`: Text reveal animation.
*   **Typography:** It strictly enforces serif fonts (`font-serif`, `font-wuxia-serif`) for the narrative to look like an ancient book.

---

## 5. Step-by-Step Modification Guides

### 🟢 How to Modify Initial Quotas / Turns (for New Users)
Requires changing both the database schema and the frontend fallback state.
1.  **DB:** Edit `supabase/migrations/001_user_quotas.sql` -> Change `default 0` to your desired number (e.g., `default 15`).
2.  **Frontend:** Edit `src/lib/supabase/quotaStore.ts` -> In `fetchQuota`, inside the `if (!data)` block, change the `.insert()` payload and the local `set({ turnsRemaining: X })` to match the DB default.

### 🟢 How to Add a New Item to the Player's Starting Inventory
1.  Open `src/lib/engine/store.ts`.
2.  Locate `const INITIAL_STATE`.
3.  Find `player.inventory` array.
4.  Add a new object: `{ id: 'unique_id', name: 'Item Name', description: '...', type: 'consumable|material|weapon', count: 1 }`.

### 🟢 How to Modify the Damage/Power of a Martial Art Level
Martial art power multipliers (e.g., "初窺門徑" vs "登峰造極") are hardcoded in constants.
1.  Open `src/lib/engine/constants.ts`.
2.  Modify the multipliers in the `getMartialArtPower` or `getMartialArtRankPower` functions.

### 🟢 How to Fix AI JSON Parsing Errors
If the AI returns invalid JSON (e.g., wrapping it in \`\`\`json blocks when not requested, or breaking syntax), look at `src/lib/engine/prompt.ts`.
*   Ensure the prompt strictly commands the AI to output *only* raw JSON.
*   Check `src/app/api/gemini/route.ts` to ensure the specific provider's `response_format` is configured correctly (e.g., Gemini's `responseMimeType: 'application/json'`).

### 🟢 How the Turn Loop Works (For debugging UI lag or unresponsiveness)
1. User types action in `ActionPanel.tsx`.
2. Action is added to `narrative` as a 'user' log.
3. `GameTerminal.tsx` triggers loading overlay.
4. Action string + `GameState` is sent to `generateGameResponse()` (which hits `/api/gemini`).
5. AI responds with JSON containing narrative text, stat changes, item changes.
6. The JSON is parsed, and `store.ts` actions (`updatePlayerStats`, `addLog`, `addItem`) are fired sequentially.
7. `quotaStore.consumeTurn()` is called to deduct 1 turn in Supabase.
8. UI updates.

---

## 6. Payment Integration (NewebPay / 藍新金流)
The game integrates NewebPay for purchasing "turns" (quotas). The flow relies on server-side Next.js APIs to ensure security (AES-256 encryption & SHA-256 hashing).

### A. Key Files & Directories
*   **`src/lib/newebpay.ts`**: Contains the core cryptography (`encryptTradeInfo`, `createTradeSha`, `decryptTradeInfo`) and config validation.
*   **`src/app/api/payment/checkout/route.ts`**: The endpoint that creates a `PENDING` order in the Supabase `orders` table and returns the encrypted form data (`TradeInfo`, `TradeSha`) required to redirect the user to the NewebPay gateway. **Requires the user to be authenticated.**
*   **`src/app/api/payment/notify/route.ts`**: The crucial webhook URL (`NotifyURL`). NewebPay server calls this in the background when a payment succeeds. It bypasses Supabase RLS using the `SUPABASE_SERVICE_ROLE_KEY` to securely grant turns to the user's `user_quotas` table and marks the order as `SUCCESS`.
*   **`src/app/api/payment/query/route.ts`**: A reconciliation API. Uses a specific `CheckValue` logic to query NewebPay for the real status of a pending order.
*   **`src/components/StoreSection.tsx`**: The main UI component for displaying pricing plans and triggering the checkout flow via a dynamically generated hidden form.

### B. Modifying Payment Plans
If you need to change prices, add a new subscription tier, or change the number of turns granted:
1.  **Frontend/UI:** Update the `PlanCard` configurations inside `src/components/StoreSection.tsx`.
2.  **Checkout Logic:** Update the `PLANS` constant mapping inside `src/app/api/payment/checkout/route.ts` to reflect the correct amount and description.
3.  **Fulfillment Logic:** Open `src/app/api/payment/notify/route.ts` and modify the `turnsToAdd` switch/if statement to grant the correct number of turns based on the `order.item_desc` or a plan ID.

---
*Created by Gemini CLI*