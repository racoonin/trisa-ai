const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Import our modules
const { transcribeAudio } = require('./stt');
const { generateTherapyResponse } = require('./therapy');
const { generateSpeech } = require('./tts');
const { checkSafety } = require('./safety');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve static files from client directory with proper headers
app.use(express.static(path.join(__dirname, '../client'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.css')) {
      res.set('Content-Type', 'text/css');
    }
    if (path.endsWith('.js')) {
      res.set('Content-Type', 'application/javascript');
    }
    if (path.endsWith('.png') || path.endsWith('.jpg') || path.endsWith('.jpeg')) {
      res.set('Cache-Control', 'public, max-age=86400'); // Cache images for 1 day
    }
  }
}));

// For deployment - handle client routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Explicit routes for static assets
app.get('/styles.css', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/styles.css'));
});

app.get('/app.js', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/app.js'));
});

app.get('/logo.png', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/logo.png'));
});

const upload = multer({
  storage: multer.memoryStorage(), // Use memory storage for serverless
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Conversation memory (in-memory storage for MVP)
let conversationHistory = [];
const MAX_HISTORY = 10;

// Helper function to manage conversation history
function addToHistory(userMessage, aiResponse) {
  conversationHistory.push({
    timestamp: new Date().toISOString(),
    user: userMessage,
    ai: aiResponse
  });
  
  // Keep only last 10 conversations
  if (conversationHistory.length > MAX_HISTORY) {
    conversationHistory = conversationHistory.slice(-MAX_HISTORY);
  }
  
  // Log conversation turn
  console.log('=== CONVERSATION TURN ===');
  console.log('User:', userMessage);
  console.log('AI:', aiResponse);
  console.log('History length:', conversationHistory.length);
  console.log('========================');
}

// Speech-to-Text endpoint with performance timing
app.post('/stt', upload.single('audio'), async (req, res) => {
  const startTime = Date.now();
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    console.log('Received audio file:', req.file.originalname, 'Size:', req.file.size, 'bytes');
    
    // For serverless, we'll pass the buffer instead of file path
    const transcript = await transcribeAudio(req.file.buffer, req.file.originalname);
    
    const endTime = Date.now();
    console.log(`STT completed in ${endTime - startTime}ms`);
    
    res.json({ transcript });
  } catch (error) {
    console.error('STT Error:', error);
    res.status(500).json({ error: 'Speech transcription failed: ' + error.message });
  }
});

// Therapy response endpoint with performance timing
app.post('/therapy', async (req, res) => {
  const startTime = Date.now();
  try {
    const { transcript } = req.body;
    
    if (!transcript) {
      return res.status(400).json({ error: 'No transcript provided' });
    }

    console.log('Processing therapy request for:', transcript.substring(0, 50) + '...');

    // Check safety first
    const safetyCheck = checkSafety(transcript);
    if (safetyCheck.isCrisis) {
      const crisisResponse = safetyCheck.response;
      
      // Add to history and return crisis response
      addToHistory(transcript, crisisResponse);
      const endTime = Date.now();
      console.log(`Crisis response generated in ${endTime - startTime}ms`);
      return res.json({ response: crisisResponse, isCrisis: true });
    }

    // Generate therapy response using conversation history
    const therapyResponse = await generateTherapyResponse(transcript, conversationHistory);
    
    // Add to conversation history
    addToHistory(transcript, therapyResponse);
    
    const endTime = Date.now();
    console.log(`Therapy response generated in ${endTime - startTime}ms`);
    
    res.json({ response: therapyResponse, isCrisis: false });
  } catch (error) {
    console.error('Therapy Error:', error);
    res.status(500).json({ error: 'Failed to generate therapy response' });
  }
});

// Text-to-Speech endpoint with EMOTIONAL CONTEXT
app.post('/tts', async (req, res) => {
  try {
    const { text, voice = 'female', emotionalContext = 'supportive' } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }

    console.log(`🎭 Generating EMOTIONAL speech (${emotionalContext}):`, text.substring(0, 50) + '...');
    
    // Start timing
    const startTime = Date.now();
    
    const audioBuffer = await generateSpeech(text, voice, emotionalContext);
    
    const endTime = Date.now();
    console.log(`🎤 Emotional speech generated in ${endTime - startTime}ms: ${audioBuffer.length} bytes`);
    
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length,
      'Cache-Control': 'no-cache'
    });
    
    res.send(audioBuffer);
  } catch (error) {
    console.error('TTS Error:', error);
    res.status(500).json({ error: 'Speech generation failed' });
  }
});

// Get conversation history (for debugging)
app.get('/history', (req, res) => {
  res.json(conversationHistory);
});

// Clear conversation history
app.post('/clear-history', (req, res) => {
  conversationHistory = [];
  console.log('Conversation history cleared');
  res.json({ message: 'History cleared' });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server Error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Create uploads directory if it doesn't exist (only in local environment)
if (process.env.NODE_ENV !== 'production' && !fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Add basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    hasApiKeys: {
      assembly: !!process.env.ASSEMBLY_API_KEY,
      gemini: !!process.env.GEMINI_API_KEY,
      eleven: !!process.env.ELEVEN_API_KEY
    }
  });
});

// Start server (for local development)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🎙️ AI Voice Therapist MVP running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} to start therapy session`);
    console.log('=== Server Ready ===');
  });
}

// Export for Vercel
module.exports = app;