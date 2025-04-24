// Phone App JavaScript with Twilio VoIP Integration
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const display = document.getElementById('dialer-display');
    const keys = document.querySelectorAll('.keypad .key:not(.dtmf-key)');
    const dtmfKeys = document.querySelectorAll('.dtmf-key');
    const backspaceButton = document.getElementById('dialer-backspace');
    const callButton = document.getElementById('dialer-call-button');
    const callInterface = document.getElementById('call-interface');
    const callNumberDisplay = document.getElementById('call-number');
    const callStatusText = document.getElementById('call-status-text');
    const callTimer = document.getElementById('call-timer');
    const endCallButton = document.getElementById('end-call-button');
    const muteButton = document.getElementById('mute-button');
    const speakerButton = document.getElementById('speaker-button');
    const keypadButton = document.getElementById('keypad-button');
    const dtmfKeypad = document.getElementById('dtmf-keypad');
    const closeDtmfButton = document.getElementById('close-dtmf');

    // Twilio Device
    let device;
    let currentConnection = null;
    let callId = null;
    let timerInterval = null;
    let callStartTime = null;
    let isMuted = false;
    let isSpeaker = false;

    // Update the time in the status bar
    function updateTime() {
        const now = new Date();
        let hours = now.getHours();
        let minutes = now.getMinutes();
        
        // Format the time as HH:MM
        hours = hours < 10 ? '0' + hours : hours;
        minutes = minutes < 10 ? '0' + minutes : minutes;
        
        document.getElementById('status-time').textContent = hours + ':' + minutes;
    }
    
    // Update time immediately and then every minute
    updateTime();
    setInterval(updateTime, 60000);

    // Initialize Twilio Device
    async function setupTwilioDevice() {
        try {
            // Fetch token from our backend
            const response = await fetch('/api/token?identity=iphone-user');
            const data = await response.json();
            
            // Initialize the device with the token
            device = new Twilio.Device(data.token, {
                // Log level can be debug, info, warn, error (debug is most verbose)
                logLevel: 'info',
                // Use WebRTC audio processing to improve call quality
                enableRingingSound: true,
                codecPreferences: ['opus', 'pcmu']
            });
            
            // Setup event listeners
            device.on('ready', function() {
                console.log('Twilio Device is ready for calls');
            });
            
            device.on('error', function(error) {
                console.error('Twilio Device Error:', error);
                alert(`Call error: ${error.message}`);
                resetCallInterface();
            });
            
            device.on('connect', function(conn) {
                console.log('Call connected');
                currentConnection = conn;
                updateCallInterface('connected');
                startCallTimer();
                
                // Setup connection events
                conn.on('disconnect', function() {
                    console.log('Call disconnected');
                    resetCallInterface();
                });
            });
            
            device.on('disconnect', function() {
                console.log('Call disconnected from device');
                resetCallInterface();
            });
            
            // Register the device
            await device.register();
            console.log('Twilio device registered');
            
        } catch (error) {
            console.error('Error setting up Twilio device:', error);
            alert('Failed to initialize phone capabilities. Please try again later.');
        }
    }
    
    // Initialize Twilio when the page loads
    setupTwilioDevice();
    
    // Function to update backspace button visibility
    function updateBackspaceVisibility() {
        if (display.value.length > 0) {
            backspaceButton.classList.add('visible');
        } else {
            backspaceButton.classList.remove('visible');
        }
    }
    
    // Add click event to each key
    keys.forEach(key => {
        key.addEventListener('click', () => {
            const value = key.dataset.value;
            display.value += value;
            updateBackspaceVisibility();
            
            // Play DTMF tone
            playDTMFTone(value);
        });
    });
    
    // DTMF keypad functionality
    dtmfKeys.forEach(key => {
        key.addEventListener('click', () => {
            const value = key.dataset.value;
            
            // If we have an active call, send DTMF tone
            if (currentConnection) {
                currentConnection.sendDigits(value);
                playDTMFTone(value);
            }
        });
    });
    
    // Play DTMF tone
    function playDTMFTone(digit) {
        // Create audio element for the tone
        const audio = new Audio(`/static/sounds/dtmf-${digit}.mp3`);
        audio.volume = 0.5;
        audio.play();
    }
    
    // Backspace button functionality
    backspaceButton.addEventListener('click', () => {
        display.value = display.value.slice(0, -1);
        updateBackspaceVisibility();
    });
    
    // Call button functionality
    callButton.addEventListener('click', () => {
        const numberToCall = display.value;
        if (numberToCall) {
            initiateCall(numberToCall);
        } else {
            alert("Please enter a phone number to call");
        }
    });
    
    // Initiate a call
    async function initiateCall(phoneNumber) {
        try {
            console.log(`Attempting to call: ${phoneNumber} via VoIP`);
            
            // Show call interface
            callNumberDisplay.textContent = phoneNumber;
            callStatusText.textContent = 'Calling...';
            callInterface.classList.remove('hidden');
            
            // Make API call to initiate call on backend
            const response = await fetch('/api/make_call', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ phone_number: phoneNumber })
            });
            
            const data = await response.json();
            
            if (data.status === 'success') {
                callId = data.call_id;
                
                // Make the actual call using Twilio Device
                const params = {
                    To: phoneNumber
                };
                
                currentConnection = await device.connect({
                currentConnection = await device.connect({
                    params: params
                });
                
                console.log('Twilio connection initiated', currentConnection);
                
                // The connect event will handle updating the UI
            } else {
                // Handle error
                console.error('Failed to initiate call:', data.message);
                alert(`Failed to initiate call: ${data.message}`);
                resetCallInterface();
            }
        } catch (error) {
            console.error('Error making call:', error);
            alert('Failed to initiate call. Please try again.');
            resetCallInterface();
        }
    }
    
    // Update call interface based on call state
    function updateCallInterface(state) {
        switch (state) {
            case 'connecting':
                callStatusText.textContent = 'Calling...';
                break;
            case 'connected':
                callStatusText.textContent = 'Connected';
                break;
            case 'reconnecting':
                callStatusText.textContent = 'Reconnecting...';
                break;
            case 'disconnected':
                resetCallInterface();
                break;
        }
    }
    
    // Start call timer
    function startCallTimer() {
        callStartTime = new Date();
        
        // Clear any existing timer
        if (timerInterval) {
            clearInterval(timerInterval);
        }
        
        // Update timer immediately and then every second
        updateCallTimer();
        timerInterval = setInterval(updateCallTimer, 1000);
    }
    
    // Update call timer display
    function updateCallTimer() {
        if (!callStartTime) return;
        
        const now = new Date();
        const diff = now - callStartTime;
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        
        // Format as MM:SS
        const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
        const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds;
        
        callTimer.textContent = `${formattedMinutes}:${formattedSeconds}`;
    }
    
    // Reset call interface
    function resetCallInterface() {
        // Hide call interface
        callInterface.classList.add('hidden');
        dtmfKeypad.classList.add('hidden');
        
        // Reset call state
        currentConnection = null;
        callId = null;
        
        // Stop timer
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        callStartTime = null;
        callTimer.textContent = '00:00';
        
        // Reset buttons
        muteButton.classList.remove('active');
        speakerButton.classList.remove('active');
        isMuted = false;
        isSpeaker = false;
    }
    
    // End call button
    endCallButton.addEventListener('click', async () => {
        try {
            // Disconnect Twilio connection
            if (currentConnection) {
                currentConnection.disconnect();
            }
            
            // Notify backend about call end
            if (callId) {
                await fetch('/api/end_call', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ call_id: callId })
                });
            }
            
            resetCallInterface();
        } catch (error) {
            console.error('Error ending call:', error);
            // Still reset the interface even if there's an error
            resetCallInterface();
        }
    });
    
    // Mute button
    muteButton.addEventListener('click', () => {
        if (!currentConnection) return;
        
        isMuted = !isMuted;
        
        if (isMuted) {
            currentConnection.mute(true);
            muteButton.classList.add('active');
            muteButton.querySelector('i').className = 'fas fa-microphone-slash';
        } else {
            currentConnection.mute(false);
            muteButton.classList.remove('active');
            muteButton.querySelector('i').className = 'fas fa-microphone';
        }
    });
    
    // Speaker button
    speakerButton.addEventListener('click', () => {
        isSpeaker = !isSpeaker;
        
        if (isSpeaker) {
            // Enable speaker mode
            speakerButton.classList.add('active');
            
            // In a real implementation, you would switch audio output to speaker
            // This is a simplified example - in a real app you would use the Web Audio API
            // or device-specific APIs to switch audio output
            
            // For demonstration purposes:
            const audioElements = document.querySelectorAll('audio');
            audioElements.forEach(audio => {
                // Set volume higher for speaker mode
                audio.volume = 1.0;
            });
        } else {
            // Disable speaker mode
            speakerButton.classList.remove('active');
            
            // For demonstration purposes:
            const audioElements = document.querySelectorAll('audio');
            audioElements.forEach(audio => {
                // Set volume back to normal
                audio.volume = 0.5;
            });
        }
    });
    
    // Keypad button
    keypadButton.addEventListener('click', () => {
        dtmfKeypad.classList.remove('hidden');
    });
    
    // Close DTMF keypad
    closeDtmfButton.addEventListener('click', () => {
        dtmfKeypad.classList.add('hidden');
    });
    
    // Handle incoming calls
    function handleIncomingCall(connection) {
        const incomingPhoneNumber = connection.parameters.From || 'Unknown';
        
        // Show call interface for incoming call
        callNumberDisplay.textContent = incomingPhoneNumber;
        callStatusText.textContent = 'Incoming Call';
        callInterface.classList.remove('hidden');
        
        // Auto-answer for this demo (in a real app, you'd show accept/decline buttons)
        setTimeout(() => {
            connection.accept();
        }, 1000);
    }
    
    // Register for incoming calls
    if (device) {
        device.on('incoming', handleIncomingCall);
    }
    
    // Handle page visibility changes to manage WebRTC connections
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            // Page is hidden, could pause audio processing to save resources
            console.log('App in background');
        } else {
            // Page is visible again
            console.log('App in foreground');
            // Reconnect device if needed
            if (device && !device.isRegistered) {
                device.register();
            }
        }
    });
    
    // Initial backspace button state
    updateBackspaceVisibility();
    
    // Handle audio permissions
    async function requestAudioPermissions() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            console.log('Microphone access granted');
            
            // Keep the stream active to maintain microphone access
            window.localStream = stream;
            
            // Create a silent audio context to keep audio system active
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const silentOscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            gainNode.gain.value = 0; // Silent
            silentOscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            silentOscillator.start();
            
            // Store for cleanup
            window.audioContext = audioContext;
            window.silentOscillator = silentOscillator;
        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('Microphone access is required for calls. Please allow microphone access and reload the page.');
        }
    }
    
    // Request audio permissions when the page loads
    requestAudioPermissions();
    
    // Cleanup function for page unload
    window.addEventListener('beforeunload', () => {
        // Stop any active calls
        if (currentConnection) {
            currentConnection.disconnect();
        }
        
        // Unregister device
        if (device) {
            device.destroy();
        }
        
        // Clean up audio resources
        if (window.localStream) {
            window.localStream.getTracks().forEach(track => track.stop());
        }
        
        if (window.silentOscillator) {
            window.silentOscillator.stop();
        }
        
        if (window.audioContext) {
            window.audioContext.close();
        }
    });
});
