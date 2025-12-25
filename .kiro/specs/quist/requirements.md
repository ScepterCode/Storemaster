# Quist - Natural Language Business Intelligence

## Overview
Quist allows shop managers to query their business data using natural language prompts, powered by Gemini AI. Instead of navigating reports, users simply ask questions like "What are my best selling products?" or "Did I make profit this month?"

## Requirements

### REQ-1: Natural Language Query Processing
**User Story:** As a shop manager, I want to ask business questions in plain English and get accurate answers based on my actual data.

**Acceptance Criteria:**
- User can type questions in natural language
- System understands intent and extracts query parameters (date ranges, product names, etc.)
- Supports common business questions: sales, inventory, profits, trends
- Returns accurate data from the database, not hallucinated responses

### REQ-2: Smart Data Fetching
**User Story:** As a user, I want Quist to fetch only the relevant data needed to answer my question efficiently.

**Acceptance Criteria:**
- System maps questions to appropriate database queries
- Fetches real-time data from Supabase (products, transactions, invoices)
- Respects organization/tenant boundaries (RLS)
- Handles date-relative queries ("today", "this month", "last week")

### REQ-3: Rich Response Formatting
**User Story:** As a shop manager, I want answers presented clearly with numbers, summaries, and visual elements when appropriate.

**Acceptance Criteria:**
- Text responses with key metrics highlighted
- Tables for list-based answers (top products, recent sales)
- Simple charts for trend questions
- Actionable suggestions when relevant

### REQ-4: Quick Query Shortcuts
**User Story:** As a user, I want common questions available as one-click shortcuts for faster access.

**Acceptance Criteria:**
- Pre-built query buttons for frequent questions
- Shortcuts update based on time of day/context
- Recent queries saved for quick re-run

### REQ-5: Conversation Context
**User Story:** As a user, I want to ask follow-up questions without repeating context.

**Acceptance Criteria:**
- System remembers previous question context within session
- "What about last month?" understands reference to previous query
- Can refine/filter previous results with follow-ups
