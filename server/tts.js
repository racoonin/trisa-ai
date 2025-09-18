const fetch = require('node-fetch');

// ElevenLabs API configuration
const ELEVEN_API_KEY = process.env.ELEVEN_API_KEY || 'sk_22e53af4de835c358c896a7c1b1e3f2106ed997642342308';
const ELEVEN_BASE_URL = 'https://api.elevenlabs.io/v1';

// Validate API key
if (!ELEVEN_API_KEY || ELEVEN_API_KEY === 'your_eleven_api_key_here') {
  console.error('❌ ELEVEN_API_KEY not configured!');
}

// Voice configurations for therapeutic conversations
const VOICE_CONFIGS = {
  female: {
    voice_id: 'EXAVITQu4vr4xnSDxMaL', // Bella - calm, warm female voice
    name: 'Bella',
    description: 'Warm, empathetic female voice'
  },
  male: {
    voice_id: 'pNInz6obpgDQGcFmaJgB', // Adam - calm, supportive male voice  
    name: 'Adam',
    description: 'Calm, supportive male voice'
  }
};

// Voice settings optimized for EMOTIONAL, HUMAN-LIKE therapeutic conversations
const VOICE_SETTINGS = {
  stability: 0.5,         // LOWER stability for more emotion and variation
  similarity_boost: 0.75, // Slightly lower for more natural variation
  style: 0.6,            // HIGHER style for more expressive, emotional delivery
  use_speaker_boost: true // Enhanced clarity
};

/**
 * Generate speech with EMOTIONAL CONTEXT and natural human-like delivery
 * @param {string} text - Text to convert to speech
 * @param {string} voiceType - 'male' or 'female'
 * @param {string} emotionalContext - Context for emotional tone
 * @returns {Promise<Buffer>} - Audio buffer
 */
async function generateSpeech(text, voiceType = 'female', emotionalContext = 'supportive') {
  try {
    // Validate voice type
    if (!VOICE_CONFIGS[voiceType]) {
      console.warn(`Invalid voice type: ${voiceType}, defaulting to female`);
      voiceType = 'female';
    }

    const voiceConfig = VOICE_CONFIGS[voiceType];
    
    // OPTIMIZE TEXT FOR EMOTIONAL DELIVERY
    const emotionalText = optimizeTextForSpeech(text, emotionalContext);
    console.log(`🎭 Generating EMOTIONAL speech with ${voiceConfig.name}:`, emotionalText.substring(0, 100));

    // DYNAMIC VOICE SETTINGS based on emotional context
    let dynamicSettings = { ...VOICE_SETTINGS };
    
    // Adjust settings based on content emotion
    if (text.toLowerCase().includes('amazing') || text.toLowerCase().includes('awesome') || text.toLowerCase().includes('excited')) {
      dynamicSettings.stability = 0.3; // More variation for excitement
      dynamicSettings.style = 0.8;     // Higher style for enthusiasm
    } else if (text.toLowerCase().includes('tough') || text.toLowerCase().includes('difficult')) {
      dynamicSettings.stability = 0.6; // Gentle variation for empathy
      dynamicSettings.style = 0.4;     // Softer style for comfort
    } else if (text.toLowerCase().includes('understand') || text.toLowerCase().includes('hear you')) {
      dynamicSettings.stability = 0.65; // Warm and steady
      dynamicSettings.style = 0.5;      // Balanced warmth
    }

    // Prepare the request
    const url = `${ELEVEN_BASE_URL}/text-to-speech/${voiceConfig.voice_id}`;
    
    const requestBody = {
      text: emotionalText,
      model_id: "eleven_multilingual_v2", // Better emotional expression
      voice_settings: dynamicSettings
    };

    // Make the TTS request
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVEN_API_KEY
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
    }

    // Get the audio buffer
    const audioBuffer = await response.buffer();
    console.log(`🎤 EMOTIONAL speech generated: ${audioBuffer.length} bytes`);
    
    return audioBuffer;

  } catch (error) {
    console.error('Speech generation error:', error);
    throw new Error(`Text-to-speech failed: ${error.message}`);
  }
}

/**
 * Get available voices from ElevenLabs API
 * @returns {Promise<Array>} - List of available voices
 */
async function getAvailableVoices() {
  try {
    const response = await fetch(`${ELEVEN_BASE_URL}/voices`, {
      headers: {
        'xi-api-key': ELEVEN_API_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch voices: ${response.status}`);
    }

    const data = await response.json();
    return data.voices;

  } catch (error) {
    console.error('Error fetching voices:', error);
    return [];
  }
}

/**
 * Check ElevenLabs API quota/usage
 * @returns {Promise<Object>} - Usage information
 */
async function getUsageInfo() {
  try {
    const response = await fetch(`${ELEVEN_BASE_URL}/user`, {
      headers: {
        'xi-api-key': ELEVEN_API_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch usage info: ${response.status}`);
    }

    const data = await response.json();
    return {
      character_count: data.subscription?.character_count || 0,
      character_limit: data.subscription?.character_limit || 0,
      can_extend_character_limit: data.subscription?.can_extend_character_limit || false
    };

  } catch (error) {
    console.error('Error fetching usage info:', error);
    return null;
  }
}

/**
 * Optimize text for EMOTIONAL, HUMAN-LIKE speech synthesis
 * @param {string} text - Original text
 * @param {string} emotionalContext - Context for emotional tone
 * @returns {string} - Optimized text with emotions and pauses
 */
function optimizeTextForSpeech(text, emotionalContext = 'supportive') {
  let optimizedText = text;
  
  // Add emotional context markers and natural speech patterns
  optimizedText = optimizedText
    // Add excited emphasis for positive words
    .replace(/\b(amazing|awesome|great|fantastic|wonderful|incredible)\b/gi, (match) => `<emphasis level="strong">${match}!</emphasis>`)
    // Add warm empathetic tone
    .replace(/\b(understand|hear you|feel you|get that)\b/gi, (match) => `<prosody rate="slow" pitch="-2st">${match}</prosody>`)
    // Add gentle questioning tone
    .replace(/\?/g, '<break time="0.3s"/>?<break time="0.5s"/>')
    // Add natural breathing pauses
    .replace(/\. /g, '.<break time="0.5s"/> ')
    // Add thoughtful pauses before insights
    .replace(/\b(you know what|here's the thing|what I notice|the thing is)\b/gi, (match) => `<break time="0.3s"/>${match}<break time="0.2s"/>`)
    // Add emphasis on validation
    .replace(/\b(totally|absolutely|definitely|completely)\b/gi, (match) => `<emphasis level="moderate">${match}</emphasis>`)
    // Add gentle tone for difficult topics
    .replace(/\b(tough|difficult|hard|challenging|struggle)\b/gi, (match) => `<prosody pitch="-1st">${match}</prosody>`)
    // Add encouraging tone for strength words
    .replace(/\b(courage|strength|brave|strong|resilient)\b/gi, (match) => `<emphasis level="strong"><prosody pitch="+1st">${match}</prosody></emphasis>`)
    // Add natural speech hesitations
    .replace(/\b(so|and|but)\b/g, (match) => `<break time="0.2s"/>${match}`)
    // Add conversational filler sounds
    .replace(/\b(hmm|well|okay)\b/gi, (match) => `<prosody rate="slow">${match}</prosody><break time="0.3s"/>`)
    // Add natural intonation for lists
    .replace(/, /g, ',<break time="0.2s"/> ')
    // Add excitement for achievements
    .replace(/\b(proud|accomplished|achieved|success)\b/gi, (match) => `<prosody pitch="+2st" rate="fast"><emphasis>${match}</emphasis></prosody>`);
    
  return optimizedText;
}

module.exports = {
  generateSpeech,
  getAvailableVoices,
  getUsageInfo,
  optimizeTextForSpeech,
  VOICE_CONFIGS
};