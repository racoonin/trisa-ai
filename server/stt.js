const fetch = require('node-fetch');
const fs = require('fs');
const FormData = require('form-data');

// AssemblyAI API configuration
const ASSEMBLY_API_KEY = 'f5fd641d1c9e4d64b5df2ada91d21a5b';
const ASSEMBLY_BASE_URL = 'https://api.assemblyai.com/v2';

/**
 * Upload audio file to AssemblyAI
 * @param {string} audioPath - Path to the audio file
 * @returns {Promise<string>} - Upload URL
 */
async function uploadAudio(audioPath) {
  try {
    const data = fs.readFileSync(audioPath);
    
    const response = await fetch(`${ASSEMBLY_BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        'authorization': ASSEMBLY_API_KEY,
        'content-type': 'application/octet-stream'
      },
      body: data
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Audio uploaded successfully:', result.upload_url);
    return result.upload_url;
  } catch (error) {
    console.error('Audio upload error:', error);
    throw error;
  }
}

/**
 * Submit transcription request to AssemblyAI
 * @param {string} audioUrl - URL of uploaded audio
 * @returns {Promise<string>} - Transcription ID
 */
async function submitTranscription(audioUrl) {
  try {
    const response = await fetch(`${ASSEMBLY_BASE_URL}/transcript`, {
      method: 'POST',
      headers: {
        'authorization': ASSEMBLY_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        audio_url: audioUrl,
        language_detection: true,
        punctuate: true,
        format_text: true
      })
    });

    if (!response.ok) {
      throw new Error(`Transcription submission failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Transcription submitted with ID:', result.id);
    return result.id;
  } catch (error) {
    console.error('Transcription submission error:', error);
    throw error;
  }
}

/**
 * Poll for transcription result with optimized timing
 * @param {string} transcriptId - Transcription ID
 * @returns {Promise<string>} - Transcribed text
 */
async function pollTranscription(transcriptId) {
  const maxAttempts = 15; // Reduced from 20 for faster timeout
  let attempts = 0;
  const delays = [300, 500, 700, 1000, 1200]; // FASTER delays: 0.3s, 0.5s, 0.7s, 1s, 1.2s

  while (attempts < maxAttempts) {
    try {
      const response = await fetch(`${ASSEMBLY_BASE_URL}/transcript/${transcriptId}`, {
        headers: {
          'authorization': ASSEMBLY_API_KEY
        }
      });

      if (!response.ok) {
        throw new Error(`Polling failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.status === 'completed') {
        console.log('⚡ SUPER FAST transcription completed!');
        return result.text || '[No speech detected]';
      } else if (result.status === 'error') {
        throw new Error(`Transcription failed: ${result.error}`);
      }

      // Still processing, wait with faster progressive delay
      const delay = delays[Math.min(attempts, delays.length - 1)];
      console.log(`🚀 Status: ${result.status}, waiting ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      attempts++;
    } catch (error) {
      console.error('Polling error:', error);
      throw error;
    }
  }

  throw new Error('Transcription timed out after 15 seconds (FAST MODE)');
}

/**
 * Main function to transcribe audio file
 * @param {string} audioPath - Path to the audio file
 * @returns {Promise<string>} - Transcribed text
 */
async function transcribeAudio(audioPath) {
  try {
    console.log('Starting transcription for:', audioPath);
    
    // Step 1: Upload audio file
    const audioUrl = await uploadAudio(audioPath);
    
    // Step 2: Submit transcription request
    const transcriptId = await submitTranscription(audioUrl);
    
    // Step 3: Poll for result
    const transcript = await pollTranscription(transcriptId);
    
    console.log('Transcription result:', transcript);
    return transcript;
  } catch (error) {
    console.error('Transcription failed:', error);
    throw new Error(`Speech-to-text failed: ${error.message}`);
  }
}

module.exports = {
  transcribeAudio
};