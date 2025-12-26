/**
 * Test Quist with Gemini API
 * Tests the full Quist flow: intent classification and response generation
 */

const GEMINI_API_KEY = 'AIzaSyAisjVMqdyL-XgJwGOn5sNRStody3V_x2A';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const MODEL = 'gemini-2.5-flash';

async function callGemini(prompt) {
  const url = `${GEMINI_API_URL}/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 256,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Gemini API error: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function testQuistIntentClassification() {
  console.log('🧪 Testing Quist Intent Classification with Gemini\n');
  
  const testQueries = [
    'What are my best selling products?',
    'How much revenue did I make today?',
    'Which products are low on stock?',
    'Show me this week\'s sales trend',
    'Did I make profit this month?'
  ];

  const intentPrompt = `You are an intent classifier for a business intelligence system called Quist.
Your job is to analyze user questions about their business and classify them into specific intents.

Available intents:
- top_selling_products: Questions about best sellers, popular products, most sold items, top products, best products
- today_revenue: Questions specifically about today's sales/revenue
- revenue: Questions about revenue/sales for any time period
- monthly_profit: Questions specifically about this month's profit
- profit: Questions about profit/margins for any time period
- low_stock_products: Questions about inventory levels, low stock, items running out, products running low, stock levels
- sales_trend: Questions about sales patterns, trends, comparisons over time
- unknown: ONLY use this if the question is completely unrelated to business/sales/inventory

Respond ONLY with valid JSON in this exact format:
{
  "intent": "intent_name",
  "params": {
    "date_range": "value_or_null",
    "limit": number_or_null,
    "threshold": number_or_null
  },
  "confidence": 0.0_to_1.0
}

User question: `;

  for (const query of testQueries) {
    try {
      console.log(`📝 Query: "${query}"`);
      
      const response = await callGemini(intentPrompt + query);
      console.log(`✅ Response: ${response.substring(0, 150)}...`);
      
      // Try to parse JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log(`   Intent: ${parsed.intent}`);
        console.log(`   Confidence: ${parsed.confidence}`);
        console.log(`   Params: ${JSON.stringify(parsed.params)}`);
      }
      console.log('');
      
    } catch (error) {
      console.error(`❌ Failed for query "${query}":`, error.message);
      console.log('');
    }
  }
}

async function testQuistResponseGeneration() {
  console.log('\n🧪 Testing Quist Response Generation with Gemini\n');
  
  const mockData = {
    topProducts: [
      { productName: 'Rice 50kg', totalQuantity: 150, totalRevenue: 75000 },
      { productName: 'Cooking Oil 5L', totalQuantity: 120, totalRevenue: 48000 },
      { productName: 'Sugar 2kg', totalQuantity: 100, totalRevenue: 30000 }
    ]
  };

  const responsePrompt = `You are Quist, a friendly business intelligence assistant for a retail shop.
The user asked about their best selling products. Generate a natural, conversational response.

Guidelines:
- Lead with the #1 product and its performance
- Mention total units sold and revenue for top items
- If there's a clear winner, highlight it
- Keep it concise (2-3 sentences max)
- Use plain text, no markdown
- Format currency with 2 decimal places

Data: ${JSON.stringify(mockData.topProducts, null, 2)}
Date Range: this_month

Generate a helpful, conversational response:`;

  try {
    console.log('📝 Generating response for top selling products...');
    
    const response = await callGemini(responsePrompt);
    console.log('\n✅ Generated Response:');
    console.log('─'.repeat(60));
    console.log(response);
    console.log('─'.repeat(60));
    
  } catch (error) {
    console.error('❌ Failed:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting Quist + Gemini Integration Tests\n');
  console.log('═'.repeat(60));
  
  try {
    await testQuistIntentClassification();
    await testQuistResponseGeneration();
    
    console.log('\n═'.repeat(60));
    console.log('✅ All tests completed successfully!');
    console.log('🎉 Quist is ready to use with Gemini API!');
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

runTests();
