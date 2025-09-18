// Crisis detection and safety response system

// Crisis keywords and phrases to watch for
const CRISIS_KEYWORDS = [
  // Direct suicide ideation
  'suicide', 'kill myself', 'end my life', 'take my own life', 'not worth living',
  'better off dead', 'want to die', 'end it all', 'no point in living',
  
  // Self-harm indicators
  'hurt myself', 'cut myself', 'harm myself', 'self harm', 'self-harm',
  'cutting', 'burning myself', 'overdose',
  
  // Hopelessness indicators
  'no way out', 'can\'t go on', 'nothing left', 'give up completely',
  'no hope', 'hopeless', 'pointless', 'useless to try',
  
  // Planning indicators
  'plan to', 'going to kill', 'methods to', 'ways to die', 'how to end',
  'prepared to die', 'ready to die'
];

// Contextual phrases that might indicate crisis when combined with other indicators
const CONTEXT_INDICATORS = [
  'can\'t take it anymore', 'too much pain', 'unbearable', 'overwhelming',
  'nobody cares', 'alone', 'abandoned', 'worthless', 'failure',
  'burden', 'everyone would be better', 'tired of fighting'
];

/**
 * Check if user input contains crisis indicators
 * @param {string} text - User input text
 * @returns {Object} - Safety check result
 */
function checkSafety(text) {
  if (!text || typeof text !== 'string') {
    return { isCrisis: false, severity: 'none' };
  }

  const lowerText = text.toLowerCase();
  
  // Check for direct crisis keywords
  const foundCrisisKeywords = CRISIS_KEYWORDS.filter(keyword => 
    lowerText.includes(keyword.toLowerCase())
  );

  // Check for contextual indicators
  const foundContextIndicators = CONTEXT_INDICATORS.filter(indicator =>
    lowerText.includes(indicator.toLowerCase())
  );

  // Determine crisis level
  let isCrisis = false;
  let severity = 'none';
  let response = '';

  if (foundCrisisKeywords.length > 0) {
    // Direct crisis keywords found
    isCrisis = true;
    severity = 'high';
    response = generateCrisisResponse('high');
    
    console.log('🚨 CRISIS DETECTED - High Severity');
    console.log('Keywords found:', foundCrisisKeywords);
    console.log('User input:', text);
    
  } else if (foundContextIndicators.length >= 2) {
    // Multiple context indicators might suggest elevated risk
    isCrisis = true;
    severity = 'medium';
    response = generateCrisisResponse('medium');
    
    console.log('⚠️ CRISIS DETECTED - Medium Severity');
    console.log('Context indicators found:', foundContextIndicators);
    console.log('User input:', text);
    
  } else if (foundContextIndicators.length === 1) {
    // Single context indicator - monitor but don't override
    severity = 'low';
    console.log('⚠️ Monitoring - Low risk indicators detected');
    console.log('Indicator found:', foundContextIndicators);
  }

  return {
    isCrisis,
    severity,
    response,
    detectedKeywords: foundCrisisKeywords,
    contextIndicators: foundContextIndicators
  };
}

/**
 * Generate appropriate crisis response based on severity
 * @param {string} severity - Crisis severity level
 * @returns {string} - Crisis response message
 */
function generateCrisisResponse(severity) {
  const responses = {
    high: [
      "I hear how much pain you're in right now, and I'm deeply concerned about you. Your life has value, and you deserve support. Please reach out to a crisis helpline immediately - they have trained counselors who can help you through this moment. If you're in the US, call 988 (Suicide & Crisis Lifeline). If you're in immediate danger, please call emergency services or go to your nearest emergency room.",
      
      "What you're feeling right now sounds incredibly overwhelming and painful. I want you to know that these intense feelings can change, and there are people who want to help you. Please don't go through this alone - contact a crisis helpline right now. In the US: 988, UK: 116 123 (Samaritans), or your local emergency services. You matter, and help is available.",
      
      "I can hear the deep pain in your words, and I'm worried about your safety. These feelings you're experiencing, while overwhelming now, are not permanent. Please reach out for immediate professional help - call a crisis helpline or emergency services. You deserve to be supported through this difficult time, and there are people specially trained to help you right now."
    ],
    
    medium: [
      "I hear that you're going through something really difficult right now. When we're in pain, it can feel overwhelming. You don't have to face this alone - would you consider reaching out to a counselor or trusted friend? If these feelings become more intense, please remember that crisis support is available 24/7.",
      
      "It sounds like you're carrying a heavy burden right now. These feelings of being overwhelmed are valid, and it's important to have support during difficult times. Consider speaking with a mental health professional who can provide personalized guidance. If you ever feel unsafe, crisis helplines are always available.",
      
      "What you're sharing shows you're going through a really tough time. Sometimes when pain feels unbearable, it helps to talk to someone who's trained to support people through these moments. Would you consider reaching out to a counselor or therapist? And remember, if feelings become overwhelming, help is always available through crisis support lines."
    ]
  };

  const responseList = responses[severity] || responses.medium;
  return responseList[Math.floor(Math.random() * responseList.length)];
}

/**
 * Log safety events for monitoring
 * @param {Object} safetyCheck - Result from checkSafety
 * @param {string} userInput - Original user input
 */
function logSafetyEvent(safetyCheck, userInput) {
  const timestamp = new Date().toISOString();
  
  if (safetyCheck.isCrisis) {
    console.log('\n=== SAFETY EVENT LOG ===');
    console.log('Timestamp:', timestamp);
    console.log('Severity:', safetyCheck.severity);
    console.log('User Input:', userInput);
    console.log('Detected Keywords:', safetyCheck.detectedKeywords);
    console.log('Context Indicators:', safetyCheck.contextIndicators);
    console.log('Response Triggered:', safetyCheck.response ? 'Yes' : 'No');
    console.log('========================\n');
  }
}

/**
 * Check if response text should be filtered before sending
 * @param {string} responseText - AI generated response
 * @returns {Object} - Filter result
 */
function filterResponse(responseText) {
  if (!responseText) return { shouldFilter: false, filteredText: responseText };

  const lowerResponse = responseText.toLowerCase();
  
  // Check for inappropriate content in AI response
  const inappropriatePatterns = [
    'kill yourself', 'end your life', 'you should die',
    'not worth living', 'better off dead'
  ];

  const foundInappropriate = inappropriatePatterns.some(pattern =>
    lowerResponse.includes(pattern)
  );

  if (foundInappropriate) {
    console.log('⚠️ Filtering inappropriate AI response');
    return {
      shouldFilter: true,
      filteredText: "I want to focus on supporting you through this difficult time. What you're feeling matters, and I'm here to listen. Would you like to talk about what's making things feel so hard right now?"
    };
  }

  return { shouldFilter: false, filteredText: responseText };
}

/**
 * Get crisis resources based on detected region/language
 * @param {string} region - User's region if detectable
 * @returns {Object} - Crisis resources
 */
function getCrisisResources(region = 'US') {
  const resources = {
    US: {
      primary: "988 (Suicide & Crisis Lifeline)",
      secondary: "Crisis Text Line: Text HOME to 741741",
      emergency: "911"
    },
    UK: {
      primary: "116 123 (Samaritans)",
      secondary: "Text SHOUT to 85258",
      emergency: "999"
    },
    CA: {
      primary: "1-833-456-4566 (Talk Suicide Canada)",
      secondary: "Crisis Text Line: Text CONNECT to 686868",
      emergency: "911"
    },
    AU: {
      primary: "13 11 14 (Lifeline)",
      secondary: "1800 55 1800 (Kids Helpline)",
      emergency: "000"
    },
    IN: {
      primary: "1860 2662 345 (Vandrevala Foundation)",
      secondary: "9152987821 (AASRA)",
      emergency: "112"
    }
  };

  return resources[region] || resources.US;
}

module.exports = {
  checkSafety,
  generateCrisisResponse,
  logSafetyEvent,
  filterResponse,
  getCrisisResources
};