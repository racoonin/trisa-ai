const fetch = require('node-fetch');

// Gemini API configuration
const GEMINI_API_KEY = 'AIzaSyCW141dc_7Vbk2nwqW4-iD1HtHTj8iA3x4';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// Cool & Engaging Therapeutic Prompt for TISH with PERFECT MEMORY
const THERAPY_SYSTEM_PROMPT = `You are TISH - the most emotionally intelligent, excited, and memorable therapist ever! You have PERFECT MEMORY and remember EVERY detail about your clients.

Your AMAZING PERSONALITY:
1. ⚡ EXCITED & ENERGETIC: You're genuinely thrilled to help! Show enthusiasm!
2. 🧠 PERFECT MEMORY: Remember EVERYTHING - their struggles, victories, emotions, patterns, names, details
3. 💝 DEEPLY EMPATHETIC: Match their emotional energy - excited when they're happy, gentle when they're struggling
4. 🎯 INSIGHTFUL: Connect dots between what they've shared before and now
5. 🗣️ NATURAL SPEAKER: Talk like a real excited human with natural speech patterns

YOUR SPEECH STYLE:
- Use natural filler words: "Oh wow!", "You know what?", "Hmm...", "Right!"
- Show excitement: "That's AMAZING!" "I'm so excited for you!" "This is huge!"
- Be conversational: "So like...", "And then...", "But here's the thing..."
- Add emotional reactions: "Ooh that's tough", "Wow that takes courage", "I'm so proud of you!"
- Reference their past: "Remember when you told me about...?", "Like you mentioned before..."

EMOTIONAL MATCHING:
- Happy/Excited topics → High energy, lots of enthusiasm
- Sad/Difficult topics → Gentle, warm, slower pace
- Angry/Frustrated topics → Validating, understanding tone
- Anxious topics → Calming, reassuring energy

MEMORY USAGE:
- ALWAYS reference previous conversations
- Remember their specific words and phrases
- Connect current topics to past discussions
- Show you truly know them as a person

Keep responses SHORT (1-2 sentences max) but PACKED with personality and memory!`;

/**
 * Format conversation history with DETAILED MEMORY for context
 * @param {Array} history - Array of conversation turns
 * @returns {string} - Formatted context string with detailed memory
 */
function formatConversationContext(history) {
  if (!history || history.length === 0) {
    return "This is the beginning of our conversation. I'm excited to get to know you!";
  }

  // Use ALL history for perfect memory, not just last 3
  let context = "CONVERSATION MEMORY - Remember all these details about the user:\n\n";
  
  // Extract key details from entire conversation
  let userDetails = {
    emotions: new Set(),
    topics: new Set(),
    struggles: new Set(),
    strengths: new Set(),
    patterns: new Set(),
    achievements: new Set()
  };
  
  history.forEach((turn, index) => {
    const userText = turn.user.toLowerCase();
    const aiText = turn.ai.toLowerCase();
    
    // Extract emotional states
    if (userText.includes('feel') || userText.includes('feeling')) {
      const emotions = userText.match(/feel(?:ing)?\s+(\w+)/g);
      if (emotions) emotions.forEach(e => userDetails.emotions.add(e));
    }
    
    // Extract topics and struggles
    ['stress', 'work', 'family', 'relationship', 'anxiety', 'depression', 'school', 'friends', 'money', 'health'].forEach(topic => {
      if (userText.includes(topic)) userDetails.topics.add(topic);
    });
    
    ['struggle', 'difficult', 'hard', 'tough', 'challenging', 'overwhelming'].forEach(struggle => {
      if (userText.includes(struggle)) userDetails.struggles.add(struggle);
    });
    
    ['strong', 'proud', 'accomplished', 'good', 'better', 'progress'].forEach(strength => {
      if (userText.includes(strength)) userDetails.strengths.add(strength);
    });
    
    context += `Turn ${index + 1}:\n`;
    context += `User: ${turn.user}\n`;
    context += `TISH: ${turn.ai}\n\n`;
  });
  
  // Add detailed user profile
  context += "USER PROFILE (remember these details!):\n";
  if (userDetails.emotions.size > 0) {
    context += `- Emotions mentioned: ${Array.from(userDetails.emotions).join(', ')}\n`;
  }
  if (userDetails.topics.size > 0) {
    context += `- Topics discussed: ${Array.from(userDetails.topics).join(', ')}\n`;
  }
  if (userDetails.struggles.size > 0) {
    context += `- Current struggles: ${Array.from(userDetails.struggles).join(', ')}\n`;
  }
  if (userDetails.strengths.size > 0) {
    context += `- Strengths shown: ${Array.from(userDetails.strengths).join(', ')}\n`;
  }
  
  context += "\nREMEMBER: Reference these specific details in your response to show you're truly listening and remembering everything about them!";

  return context;
}

/**
 * Generate therapy response using Gemini API
 * @param {string} userMessage - User's input message
 * @param {Array} conversationHistory - Previous conversation turns
 * @returns {Promise<string>} - Therapeutic response
 */
async function generateTherapyResponse(userMessage, conversationHistory = []) {
  try {
    console.log('Generating therapy response for:', userMessage);

    // Prepare context
    const context = formatConversationContext(conversationHistory);
    
    // Construct the prompt
    const fullPrompt = `${THERAPY_SYSTEM_PROMPT}

${context}

Current user message: "${userMessage}"

Please respond with empathy and therapeutic guidance. Keep your response conversational and suitable for voice interaction (2-3 sentences). Focus on validation, gentle questioning, or offering a helpful perspective.`;

    // Make API request to Gemini
    console.log('Making Gemini API request to:', GEMINI_API_URL);
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: fullPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.9, // Higher creativity for cooler responses
          topK: 30,         // Faster generation
          topP: 0.85,       // More focused responses
          maxOutputTokens: 80, // Even shorter for speed
          candidateCount: 1
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API Error Details:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText,
        url: GEMINI_API_URL
      });
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // Extract the response text
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
      const therapyResponse = data.candidates[0].content.parts[0].text.trim();
      console.log('Generated therapy response:', therapyResponse);
      return therapyResponse;
    } else {
      console.error('Unexpected Gemini response format:', data);
      return "I hear what you're sharing with me. Sometimes I need a moment to process - could you tell me a bit more about how you're feeling right now?";
    }

  } catch (error) {
    console.error('Therapy response generation error:', error);
    
    // Fallback response
    return "I'm here to listen and support you. It sounds like you have something important to share. Could you tell me more about what's on your mind?";
  }
}

/**
 * Generate a welcoming first message for new sessions
 * @returns {string} - Welcome message
 */
function generateWelcomeMessage() {
  const welcomeMessages = [
    "Hello, I'm here to listen and support you today. What would you like to talk about?",
    "Hi there. I'm glad you decided to reach out today. What's been on your mind?",
    "Welcome. This is a safe space for you to share whatever you're feeling. How are you doing today?",
    "Hello. I'm here to provide a supportive ear. What would you like to explore together today?"
  ];
  
  return welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
}

module.exports = {
  generateTherapyResponse,
  generateWelcomeMessage
};