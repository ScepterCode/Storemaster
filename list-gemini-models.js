/**
 * List available Gemini models
 */

const GEMINI_API_KEY = 'AIzaSyAisjVMqdyL-XgJwGOn5sNRStody3V_x2A';

async function listModels() {
  console.log('📋 Fetching available Gemini models...\n');
  
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Error:', JSON.stringify(error, null, 2));
      process.exit(1);
    }

    const data = await response.json();
    
    console.log('✅ Available models:\n');
    
    if (data.models && data.models.length > 0) {
      data.models.forEach(model => {
        console.log(`📦 ${model.name}`);
        console.log(`   Display Name: ${model.displayName}`);
        console.log(`   Description: ${model.description}`);
        console.log(`   Supported Methods: ${model.supportedGenerationMethods?.join(', ')}`);
        console.log('');
      });
    } else {
      console.log('No models found');
    }
    
  } catch (error) {
    console.error('❌ Failed:', error.message);
    process.exit(1);
  }
}

listModels();
