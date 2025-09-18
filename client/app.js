// AI Voice Therapist Frontend Application - TISH
class VoiceTherapist {
    constructor() {
        this.isRecording = false;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.currentVoice = 'female';
        
        // Real-time transcription
        this.recognition = null;
        this.isRealTimeTranscribing = false;
        this.finalTranscript = '';
        this.interimTranscript = '';
        
        // Auto-processing timer - SUPER FAST
        this.silenceTimer = null;
        this.lastSpeechTime = 0;
        this.autoProcessDelay = 800; // REDUCED from 1500ms to 800ms for lightning speed!
        
        // DOM elements
        this.recordBtn = document.getElementById('recordBtn');
        this.micIcon = document.getElementById('micIcon');
        this.pulseAnimation = document.getElementById('pulseAnimation');
        this.recordInstruction = document.getElementById('recordInstruction');
        this.transcriptContent = document.getElementById('transcriptContent');
        this.responseContent = document.getElementById('responseContent');
        this.voiceToggle = document.getElementById('voiceToggle');
        this.audioPlayer = document.getElementById('audioPlayer');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.loadingText = document.getElementById('loadingText');
        this.connectionStatus = document.getElementById('connectionStatus');
        
        // Control buttons
        this.clearBtn = document.getElementById('clearBtn');
        this.historyBtn = document.getElementById('historyBtn');
        this.helpBtn = document.getElementById('helpBtn');
        this.closeHelpBtn = document.getElementById('closeHelpBtn');
        this.helpModal = document.getElementById('helpModal');
        // Browser warning
        this.browserWarning = document.getElementById('browserWarning');
        
        this.init();
    }

    async init() {
        console.log('🎙️ Initializing TISH Voice Therapist...');
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Initialize real-time speech recognition
        this.initializeSpeechRecognition();
        
        // Check browser compatibility
        this.checkBrowserCompatibility();
        
        // Request microphone permission
        await this.requestMicrophonePermission();
        
        // Check server connection
        await this.checkServerConnection();
        
        console.log('✅ TISH ready!');
    }

    setupEventListeners() {
        // Record button
        this.recordBtn.addEventListener('click', () => this.toggleRecording());
        
        // Voice toggle
        this.voiceToggle.addEventListener('change', (e) => {
            this.currentVoice = e.target.checked ? 'female' : 'male';
            console.log(`Voice changed to: ${this.currentVoice}`);
        });
        
        // Control buttons
        this.clearBtn.addEventListener('click', () => this.clearConversation());
        this.historyBtn.addEventListener('click', () => this.showHistory());
        this.helpBtn.addEventListener('click', () => this.showHelp());
        this.closeHelpBtn.addEventListener('click', () => this.hideHelp());
        
        // Modal overlay click to close
        this.helpModal.addEventListener('click', (e) => {
            if (e.target === this.helpModal) {
                this.hideHelp();
            }
        });
        
        // Audio player events
        this.audioPlayer.addEventListener('ended', () => {
            console.log('Audio playback completed');
            this.updateConnectionStatus('Ready to listen', 'ready');
        });
        
        this.audioPlayer.addEventListener('error', (e) => {
            console.error('Audio playback error:', e);
            this.updateConnectionStatus('Audio playback failed', 'error');
        });
    }

    async requestMicrophonePermission() {
        try {
            // Check if getUserMedia is available
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Browser does not support microphone access. Please use Chrome, Firefox, or Edge.');
            }

            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                } 
            });
            
            console.log('✅ Microphone permission granted');
            this.updateConnectionStatus('Microphone ready', 'ready');
            
            // Stop the stream for now
            stream.getTracks().forEach(track => track.stop());
            
        } catch (error) {
            console.error('❌ Microphone permission denied:', error);
            
            // Provide specific error messages
            if (error.name === 'NotAllowedError') {
                this.updateConnectionStatus('Microphone permission denied', 'error');
                this.showMicrophoneError('Permission denied. Please allow microphone access and refresh the page.');
            } else if (error.name === 'NotFoundError') {
                this.updateConnectionStatus('No microphone found', 'error');
                this.showMicrophoneError('No microphone detected. Please connect a microphone and refresh.');
            } else if (error.name === 'NotSupportedError') {
                this.updateConnectionStatus('Browser not supported', 'error');
                this.showMicrophoneError('Browser not supported. Please use Chrome, Firefox, or Edge.');
            } else {
                this.updateConnectionStatus('Microphone error', 'error');
                this.showMicrophoneError(`Microphone error: ${error.message}`);
            }
        }
    }

    initializeSpeechRecognition() {
        // Check for speech recognition support
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            
            // Configure recognition for real-time transcription
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.lang = 'en-US';
            
            this.recognition.onstart = () => {
                console.log('Real-time transcription started');
                this.isRealTimeTranscribing = true;
            };
            
            this.recognition.onresult = (event) => {
                let interimTranscript = '';
                let finalTranscript = this.finalTranscript;
                
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript + ' ';
                    } else {
                        interimTranscript += transcript;
                    }
                }
                
                this.finalTranscript = finalTranscript;
                this.interimTranscript = interimTranscript;
                
                // Update UI with real-time transcript
                this.updateRealTimeTranscript(finalTranscript, interimTranscript);
                
                // AUTO-PROCESS when user pauses (silence detection)
                this.handleSilenceDetection();
            };
            
            this.recognition.onerror = (error) => {
                console.error('Speech recognition error:', error);
                if (error.error === 'no-speech') {
                    // Restart recognition if no speech detected
                    setTimeout(() => {
                        if (this.isRecording) {
                            this.recognition.start();
                        }
                    }, 1000);
                }
            };
            
            this.recognition.onend = () => {
                console.log('Real-time transcription ended');
                if (this.isRecording) {
                    // Restart recognition if still recording
                    this.recognition.start();
                }
            };
            
            console.log('✅ Real-time speech recognition initialized');
        } else {
            console.warn('⚠️ Real-time speech recognition not supported');
        }
    }

    checkBrowserCompatibility() {
        const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
        const isFirefox = /Firefox/.test(navigator.userAgent);
        const isEdge = /Edg/.test(navigator.userAgent);
        const isSafari = /Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor);
        
        // Check for required APIs
        const hasGetUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
        const hasMediaRecorder = !!(window.MediaRecorder);
        
        if (!hasGetUserMedia || !hasMediaRecorder) {
            this.updateConnectionStatus('Browser not supported', 'error');
            this.browserWarning.style.display = 'flex';
            this.browserWarning.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i>
                <p>Your browser doesn't support voice recording. Please use Chrome, Firefox, or Edge for the best experience.</p>
            `;
            return false;
        }
        
        if (isSafari) {
            this.browserWarning.style.display = 'flex';
            this.browserWarning.innerHTML = `
                <i class="fas fa-info-circle"></i>
                <p>Safari may have limited microphone support. For best experience, try Chrome, Firefox, or Edge.</p>
            `;
        }
        
        console.log('Browser compatibility check passed');
        return true;
    }

    async checkServerConnection() {
        try {
            const response = await fetch('/history');
            if (response.ok) {
                console.log('✅ Server connection established');
                this.updateConnectionStatus('Connected and ready', 'ready');
            } else {
                throw new Error('Server not responding');
            }
        } catch (error) {
            console.error('❌ Server connection failed:', error);
            this.updateConnectionStatus('Server connection failed', 'error');
        }
    }

    async toggleRecording() {
        if (this.isRecording) {
            await this.stopRecording();
        } else {
            await this.startRecording();
        }
    }

    async startRecording() {
        try {
            console.log('🎙️ Starting recording...');
            
            // Check browser support
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Browser does not support microphone recording');
            }

            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                } 
            });

            // Check MediaRecorder support
            if (!MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                console.warn('Opus codec not supported, trying alternative...');
                if (MediaRecorder.isTypeSupported('audio/webm')) {
                    this.mediaRecorder = new MediaRecorder(stream, {
                        mimeType: 'audio/webm'
                    });
                } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
                    this.mediaRecorder = new MediaRecorder(stream, {
                        mimeType: 'audio/mp4'
                    });
                } else {
                    this.mediaRecorder = new MediaRecorder(stream);
                }
            } else {
                this.mediaRecorder = new MediaRecorder(stream, {
                    mimeType: 'audio/webm;codecs=opus'
                });
            }
            
            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };

            this.mediaRecorder.onstop = () => {
                this.processRecording();
            };

            this.mediaRecorder.onerror = (error) => {
                console.error('MediaRecorder error:', error);
                this.updateConnectionStatus('Recording error', 'error');
                this.isRecording = false;
                this.updateRecordingUI(false);
            };

            this.mediaRecorder.start();
            this.isRecording = true;
            
            // Update UI
            this.updateRecordingUI(true);
            this.updateConnectionStatus('Listening...', 'recording');
            
        } catch (error) {
            console.error('❌ Recording failed:', error);
            
            // Provide specific error messages
            if (error.name === 'NotAllowedError') {
                this.updateConnectionStatus('Microphone permission denied', 'error');
                alert('Microphone access denied. Please:\n1. Click the microphone icon in your browser address bar\n2. Select "Always allow"\n3. Refresh the page');
            } else if (error.name === 'NotFoundError') {
                this.updateConnectionStatus('No microphone found', 'error');
                alert('No microphone found. Please connect a microphone and try again.');
            } else if (error.name === 'NotSupportedError') {
                this.updateConnectionStatus('Recording not supported', 'error');
                alert('Recording not supported in this browser. Please use Chrome, Firefox, or Edge.');
            } else {
                this.updateConnectionStatus('Recording failed', 'error');
                alert(`Recording failed: ${error.message}

Troubleshooting:
1. Ensure microphone is connected
2. Grant microphone permission
3. Try refreshing the page`);
            }
        }
    }

    handleSilenceDetection() {
        // Clear existing timer
        if (this.silenceTimer) {
            clearTimeout(this.silenceTimer);
        }
        
        // Only auto-process if we have substantial text
        if (this.finalTranscript.trim().length > 10) {
            this.silenceTimer = setTimeout(() => {
                if (this.isRecording && this.finalTranscript.trim()) {
                    console.log('🔥 Auto-processing due to silence...');
                    this.autoProcessSpeech();
                }
            }, this.autoProcessDelay);
        }
    }

    async autoProcessSpeech() {
        if (!this.finalTranscript.trim()) return;
        
        console.log('⚡ INSTANT processing:', this.finalTranscript);
        
        // Stop recording but don't wait
        if (this.recognition) {
            this.recognition.stop();
        }
        
        this.isRecording = false;
        this.updateRecordingUI(false);
        this.updateConnectionStatus('Processing...', 'playing');
        
        try {
            // NO LOADING SCREEN - direct processing
            const transcript = this.finalTranscript.trim();
            this.displayTranscript(transcript);
            
            // Show immediate thinking indicator instead of loading screen
            this.responseContent.innerHTML = `
                <div class="message-text typing-indicator">
                    <span class="typing-dots">💭</span> thinking...
                </div>
            `;
            
            // Start therapy response immediately
            const therapyPromise = this.getTherapyResponse(transcript);
            
            const therapyResponse = await therapyPromise;
            
            // Start TTS generation in parallel with displaying response
            const ttsPromise = this.textToSpeech(therapyResponse.response);
            
            this.displayResponse(therapyResponse.response, therapyResponse.isCrisis);
            
            // Play audio when ready
            const audioUrl = await ttsPromise;
            if (audioUrl) {
                this.playAudio(audioUrl);
            } else {
                this.updateConnectionStatus('Ready for more!', 'ready');
            }
            
        } catch (error) {
            console.error('⚡ Auto-processing failed:', error);
            this.updateConnectionStatus('Ready to try again', 'ready');
        }
    }

    updateRealTimeTranscript(finalText, interimText) {
        const displayText = finalText + '<span class="interim-transcript">' + interimText + '</span>';
        this.transcriptContent.innerHTML = `
            <div class="message-text">${displayText}</div>
            <div class="live-indicator">🔴 Live transcription...</div>
        `;
    }

    async stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            console.log('⏹️ Stopping recording...');
            
            // Stop real-time speech recognition
            if (this.recognition) {
                this.recognition.stop();
                this.isRealTimeTranscribing = false;
            }
            
            this.mediaRecorder.stop();
            this.isRecording = false;
            
            // Stop all tracks
            this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
            
            // Update UI
            this.updateRecordingUI(false);
            
            // Use final transcript if available, otherwise fall back to audio processing
            if (this.finalTranscript.trim()) {
                console.log('📝 Using real-time transcript:', this.finalTranscript);
                this.displayTranscript(this.finalTranscript.trim());
                
                // NO LOADING SCREEN - immediate processing
                this.responseContent.innerHTML = `
                    <div class="message-text typing-indicator">
                        <span class="typing-dots">💭</span> thinking...
                    </div>
                `;
                
                try {
                    const therapyResponse = await this.getTherapyResponse(this.finalTranscript.trim());
                    
                    // Start TTS in parallel
                    const ttsPromise = this.textToSpeech(therapyResponse.response);
                    
                    this.displayResponse(therapyResponse.response, therapyResponse.isCrisis);
                    
                    const audioUrl = await ttsPromise;
                    if (audioUrl) {
                        this.playAudio(audioUrl);
                    } else {
                        this.updateConnectionStatus('Ready to listen', 'ready');
                    }
                } catch (error) {
                    console.error('❌ Real-time processing failed:', error);
                    this.updateConnectionStatus('Ready to try again', 'ready');
                }
            } else {
                // Only show minimal processing for audio backup
                console.log('No real-time transcript, using audio backup...');
            }
        }
    }

    async processRecording() {
        try {
            // Create audio blob
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
            console.log('📼 Audio blob created:', audioBlob.size, 'bytes');

            // NO LOADING SCREEN - direct processing
            const transcript = await this.speechToText(audioBlob);
            
            if (!transcript || transcript.trim() === '') {
                this.updateConnectionStatus('No speech detected. Try again.', 'warning');
                return;
            }

            // Display transcript immediately
            this.displayTranscript(transcript);

            // Show thinking indicator instead of loading
            this.responseContent.innerHTML = `
                <div class="message-text typing-indicator">
                    <span class="typing-dots">💭</span> thinking...
                </div>
            `;

            const therapyResponse = await this.getTherapyResponse(transcript);

            // Start TTS in parallel
            const audioUrl = await this.textToSpeech(therapyResponse.response);

            // Display response and play audio
            this.displayResponse(therapyResponse.response, therapyResponse.isCrisis);
            
            if (audioUrl) {
                this.playAudio(audioUrl);
            } else {
                this.updateConnectionStatus('Ready to listen', 'ready');
            }

        } catch (error) {
            console.error('❌ Processing failed:', error);
            this.updateConnectionStatus('Processing failed. Try again.', 'error');
        }
    }

    async speechToText(audioBlob) {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');

        const response = await fetch('/stt', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`STT failed: ${response.status}`);
        }

        const data = await response.json();
        return data.transcript;
    }

    async getTherapyResponse(transcript) {
        const response = await fetch('/therapy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ transcript })
        });

        if (!response.ok) {
            throw new Error(`Therapy response failed: ${response.status}`);
        }

        return await response.json();
    }

    async textToSpeech(text, emotionalContext = 'supportive') {
        try {
            // Detect emotional context from text
            const detectedEmotion = this.detectEmotionalContext(text);
            
            const response = await fetch('/tts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    text: text,
                    voice: this.currentVoice,
                    emotionalContext: detectedEmotion
                })
            });

            if (!response.ok) {
                console.error('TTS failed:', response.status);
                return null;
            }

            const audioBlob = await response.blob();
            return URL.createObjectURL(audioBlob);
            
        } catch (error) {
            console.error('TTS error:', error);
            return null;
        }
    }
    
    detectEmotionalContext(text) {
        const lowerText = text.toLowerCase();
        
        // Detect excitement/positive emotions
        if (lowerText.includes('amazing') || lowerText.includes('awesome') || lowerText.includes('excited') || 
            lowerText.includes('fantastic') || lowerText.includes('great') || lowerText.includes('wonderful')) {
            return 'excited';
        }
        
        // Detect empathy/gentle emotions
        if (lowerText.includes('tough') || lowerText.includes('difficult') || lowerText.includes('hard') ||
            lowerText.includes('struggle') || lowerText.includes('challenging')) {
            return 'empathetic';
        }
        
        // Detect warm/understanding emotions
        if (lowerText.includes('understand') || lowerText.includes('hear you') || lowerText.includes('feel you') ||
            lowerText.includes('get that') || lowerText.includes('makes sense')) {
            return 'warm';
        }
        
        // Detect encouraging emotions
        if (lowerText.includes('strength') || lowerText.includes('courage') || lowerText.includes('proud') ||
            lowerText.includes('brave') || lowerText.includes('resilient')) {
            return 'encouraging';
        }
        
        return 'supportive'; // Default
    }

    displayTranscript(transcript) {
        this.transcriptContent.innerHTML = `
            <div class="message-text">${this.escapeHtml(transcript)}</div>
            <div class="message-time">${new Date().toLocaleTimeString()}</div>
        `;
        console.log('📝 Transcript displayed:', transcript);
    }

    displayResponse(response, isCrisis = false) {
        const crisisClass = isCrisis ? 'crisis-response' : '';
        this.responseContent.innerHTML = `
            <div class="message-text ${crisisClass}">${this.escapeHtml(response)}</div>
            <div class="message-time">${new Date().toLocaleTimeString()}</div>
        `;
        
        if (isCrisis) {
            console.log('🚨 Crisis response displayed');
        } else {
            console.log('💬 Therapy response displayed:', response);
        }
    }

    playAudio(audioUrl) {
        this.audioPlayer.src = audioUrl;
        this.updateConnectionStatus('Playing response...', 'playing');
        
        this.audioPlayer.play().catch(error => {
            console.error('Audio play error:', error);
            this.updateConnectionStatus('Audio playback failed', 'error');
        });
    }

    updateRecordingUI(isRecording) {
        if (isRecording) {
            this.recordBtn.classList.add('recording');
            this.pulseAnimation.classList.add('active');
            this.micIcon.className = 'fas fa-stop';
            this.recordInstruction.textContent = 'Tap to stop recording';
        } else {
            this.recordBtn.classList.remove('recording');
            this.pulseAnimation.classList.remove('active');
            this.micIcon.className = 'fas fa-microphone';
            this.recordInstruction.textContent = 'Tap to start speaking';
        }
    }

    showLoading(text) {
        // DISABLED - No more loading screens!
        console.log('Loading disabled:', text);
    }

    hideLoading() {
        // DISABLED - No more loading screens!
        console.log('Loading disabled');
    }

    updateLoadingText(text) {
        // DISABLED - No more loading screens!
        console.log('Loading text disabled:', text);
    }

    updateConnectionStatus(text, status) {
        this.connectionStatus.className = `connection-status ${status}`;
        this.connectionStatus.querySelector('span').textContent = text;
    }

    async clearConversation() {
        if (confirm('Clear conversation history?')) {
            try {
                await fetch('/clear-history', { method: 'POST' });
                this.transcriptContent.innerHTML = 'Your words will appear here as you speak...';
                this.responseContent.innerHTML = `
                    <div class="welcome-message">
                        Hello, I'm here to listen and support you today. Press the microphone button when you're ready to share what's on your mind.
                    </div>
                `;
                console.log('🗑️ Conversation cleared');
            } catch (error) {
                console.error('Clear failed:', error);
            }
        }
    }

    async showHistory() {
        try {
            const response = await fetch('/history');
            const history = await response.json();
            console.log('📚 Conversation history:', history);
            
            // Simple alert for now - could be enhanced with a proper modal
            if (history.length === 0) {
                alert('No conversation history yet.');
            } else {
                let historyText = 'Recent Conversation:\n\n';
                history.slice(-3).forEach((turn, index) => {
                    historyText += `${index + 1}. You: ${turn.user}\n`;
                    historyText += `   AI: ${turn.ai}\n\n`;
                });
                alert(historyText);
            }
        } catch (error) {
            console.error('History fetch failed:', error);
        }
    }

    showHelp() {
        this.helpModal.classList.add('active');
    }

    hideHelp() {
        this.helpModal.classList.remove('active');
    }

    showMicrophoneError(message = 'Microphone access is required for voice therapy. Please allow microphone access and refresh the page.') {
        alert(`${message}

Troubleshooting steps:
1. Look for microphone icon in browser address bar
2. Click it and select "Always allow"
3. Refresh the page
4. Ensure microphone is connected and working
5. Try using Chrome, Firefox, or Edge browser`);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Starting AI Voice Therapist...');
    new VoiceTherapist();
});