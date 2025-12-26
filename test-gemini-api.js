/**
 * Test script to verify Gemini API is working
 * Run with: node test-gemini-api.js
 */

const GEMINI_API_KEY = 'AIzaSyAisjVMqdyL-XgJwGOn5sNRStody3V_x2A';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const MODEL = 'gemini-2.5-flash'; // Latest stable Gemini model

async function testGeminiAPI() {
  console.log('🧪 Testing Gemini API...\n');
  
  try {
    const url = `${GEMINI_API_URL}/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    
    console.log('📡 Making request to Gemini API...');
    console.log('Model:', MODEL);
    console.log('URL:', url.replace(GEMINI_API_KEY, 'API_KEY_HIDDEN'));
    console.log('');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: 'Hello! Please respond with a short greeting to confirm you are working.'
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 100,
        },
      }),
    });

    console.log('📥 Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const error = await response.json();
      console.error('❌ API Error:', JSON.stringify(error, null, 2));
      process.exit(1);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    console.log('\n✅ SUCCESS! Gemini API is working!\n');
    console.log('📝 Response from Gemini:');
    console.log('─'.repeat(50));
    console.log(text);
    console.log('─'.repeat(50));
    console.log('');
    console.log('📊 Token Usage:');
    console.log('  - Prompt tokens:', data.usageMetadata?.promptTokenCount || 0);
    console.log('  - Response tokens:', data.usageMetadata?.candidatesTokenCount || 0);
    console.log('  - Total tokens:', data.usageMetadata?.totalTokenCount || 0);
    console.log('');
    console.log('🎉 Gemini API is configured correctly and ready for Quist!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('');
    console.error('Troubleshooting:');
    console.error('1. Check your internet connection');
    console.error('2. Verify API key is active at https://aistudio.google.com/');
    console.error('3. Check API quotas and billing');
    process.exit(1);
  }
}

// Run the test
testGeminiAPI();
