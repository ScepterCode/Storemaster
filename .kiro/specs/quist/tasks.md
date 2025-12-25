# Quist - Implementation Tasks

## Task 1: Create Quist Query Functions
- [x] Create `src/services/quistQueries.ts` with secure, predefined query functions


- [x] Implement: `getTopSellingProducts`, `getTodayRevenue`, `getMonthlyProfit`, `getLowStockProducts`, `getSalesTrend`

- [x] All queries must filter by `organization_id` and respect date ranges



- [x] Add TypeScript types for query params and results




## Task 2: Build Intent Classification
- [x] Create `src/services/quistService.ts` as main orchestrator





- [x] Add Gemini prompt for intent classification (returns structured JSON)





- [x] Map intents to query functions





- [x] Handle unknown intents gracefully with fallback response






## Task 3: Implement Response Generation
- [x] After data fetch, send results to Gemini for natural language formatting





- [x] Create response types: `text`, `table`, `chart`, `action`





- [x] Build response formatter that combines AI text with structured data






## Task 4: Upgrade Chat UI
- [x] Refactor `AIChatbotPage.tsx` → `QuistPage.tsx`


- [x] Add rich response rendering (tables, simple charts)



- [x] Add quick query shortcut buttons





- [x] Implement conversation context (remember previous query for follow-ups)






## Task 5: Add Quick Queries & Polish
- [x] Pre-built shortcuts: "Today's sales", "Low stock", "Top products", "This month's profit"





- [x] Save recent queries for quick re-run



- [x] Add loading states and error handling





- [x] Update sidebar navigation to "Quist" branding





