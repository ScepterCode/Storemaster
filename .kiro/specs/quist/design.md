# Quist - Technical Design

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   User Query    │────▶│  Quist Service   │────▶│    Supabase     │
│  "Best sellers" │     │                  │     │   (Real Data)   │
└─────────────────┘     │  1. Intent Parse │     └─────────────────┘
                        │  2. Query Build  │              │
                        │  3. Data Fetch   │◀─────────────┘
                        │  4. AI Interpret │
                        └────────┬─────────┘
                                 │
                        ┌────────▼─────────┐
                        │  Rich Response   │
                        │  (Text + Charts) │
                        └──────────────────┘
```

## Core Components

### 1. QuistService (`src/services/quistService.ts`)
Main orchestrator that:
- Sends user question to Gemini for intent classification
- Maps intent to predefined query functions
- Fetches data from Supabase
- Sends data back to Gemini for natural language response

### 2. Query Functions (`src/services/quistQueries.ts`)
Pre-built, secure query functions:
- `getTopSellingProducts(orgId, dateRange, limit)`
- `getTodayRevenue(orgId)`
- `getMonthlyProfit(orgId, month)`
- `getLowStockProducts(orgId, threshold)`
- `getSalesTrend(orgId, period)`
- `getCustomerStats(orgId, dateRange)`

### 3. Intent Classifier
Gemini prompt that returns structured JSON:
```json
{
  "intent": "top_selling_products",
  "params": {
    "date_range": "this_month",
    "limit": 5
  }
}
```

### 4. Response Formatter
Transforms raw data + AI interpretation into rich UI:
- Markdown text with highlights
- Data tables (using existing UI components)
- Simple bar/line charts (recharts)

## Data Flow Example

**User asks:** "What are my best selling products this week?"

1. **Intent Classification** → `{ intent: "top_selling_products", params: { date_range: "this_week", limit: 5 }}`
2. **Query Execution** → Fetch from `transactions` joined with `products`, grouped by product, ordered by quantity
3. **AI Interpretation** → Gemini formats: "Your top 5 products this week are: 1. Rice (234 units)..."
4. **Rich Response** → Text + bar chart + "View all products" action

## Security
- All queries use existing RLS policies (organization_id filtering)
- No raw SQL from AI — only predefined query functions
- Rate limiting on Gemini API calls

## Integration Points
- Extends existing `geminiService.ts`
- Uses existing hooks: `useProducts`, `useTransactions`, `useInvoices`
- Replaces/upgrades current `AIChatbotPage.tsx`
