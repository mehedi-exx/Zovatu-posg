// Sound Management System for POS

class SoundManager {
    constructor() {
        this.sounds = {};
        this.enabled = true;
        this.volume = 0.5;
        this.initializeSounds();
    }

    // Initialize sound effects
    initializeSounds() {
        // Create audio context for better browser support
        this.audioContext = null;
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API not supported');
        }

        // Define sound effects with fallback to beep sounds
        this.soundDefinitions = {
            click: {
                frequency: 800,
                duration: 100,
                type: 'sine'
            },
            success: {
                frequency: 1000,
                duration: 200,
                type: 'sine'
            },
            error: {
                frequency: 300,
                duration: 300,
                type: 'square'
            },
            notification: {
                frequency: 600,
                duration: 150,
                type: 'triangle'
            },
            checkout: {
                frequency: 1200,
                duration: 250,
                type: 'sine'
            }
        };

        // Try to load audio files first, fallback to generated sounds
        this.loadAudioFiles();
    }

    // Load audio files if available
    loadAudioFiles() {
        const audioFiles = {
            click: 'audio/click.wav',
            success: 'audio/success.wav',
            error: 'audio/error.wav'
        };

        Object.keys(audioFiles).forEach(key => {
            const audio = new Audio();
            audio.preload = 'auto';
            audio.volume = this.volume;
            
            audio.addEventListener('canplaythrough', () => {
                this.sounds[key] = audio;
            });
            
            audio.addEventListener('error', () => {
                console.log(`Could not load ${key} sound, using generated sound`);
                this.sounds[key] = null;
            });
            
            audio.src = audioFiles[key];
        });
    }

    // Generate beep sound using Web Audio API
    generateBeep(frequency, duration, type = 'sine') {
        if (!this.audioContext) return;

        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.frequency.value = frequency;
            oscillator.type = type;

            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(this.volume * 0.3, this.audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration / 1000);
        } catch (error) {
            console.error('Error generating beep:', error);
        }
    }

    // Play sound effect
    play(soundName) {
        if (!this.enabled) return;

        // Resume audio context if suspended (required by some browsers)
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        // Try to play audio file first
        if (this.sounds[soundName] && this.sounds[soundName] instanceof Audio) {
            try {
                this.sounds[soundName].currentTime = 0;
                this.sounds[soundName].volume = this.volume;
                this.sounds[soundName].play().catch(e => {
                    console.log('Could not play audio file, using generated sound');
                    this.playGeneratedSound(soundName);
                });
                return;
            } catch (error) {
                console.log('Error playing audio file:', error);
            }
        }

        // Fallback to generated sound
        this.playGeneratedSound(soundName);
    }

    // Play generated sound
    playGeneratedSound(soundName) {
        const soundDef = this.soundDefinitions[soundName];
        if (soundDef) {
            this.generateBeep(soundDef.frequency, soundDef.duration, soundDef.type);
        } else {
            // Default click sound
            this.generateBeep(800, 100, 'sine');
        }
    }

    // Play click sound
    playClick() {
        this.play('click');
    }

    // Play success sound
    playSuccess() {
        this.play('success');
    }

    // Play error sound
    playError() {
        this.play('error');
    }

    // Play notification sound
    playNotification() {
        this.play('notification');
    }

    // Play checkout sound
    playCheckout() {
        this.play('checkout');
    }

    // Enable/disable sounds
    setEnabled(enabled) {
        this.enabled = enabled;
        localStorage.setItem('pos_sound_enabled', enabled);
    }

    // Set volume (0.0 to 1.0)
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        localStorage.setItem('pos_sound_volume', this.volume);
        
        // Update volume for loaded audio files
        Object.values(this.sounds).forEach(sound => {
            if (sound instanceof Audio) {
                sound.volume = this.volume;
            }
        });
    }

    // Get current settings
    isEnabled() {
        return this.enabled;
    }

    getVolume() {
        return this.volume;
    }

    // Load settings from localStorage
    loadSettings() {
        const enabled = localStorage.getItem('pos_sound_enabled');
        const volume = localStorage.getItem('pos_sound_volume');
        
        if (enabled !== null) {
            this.enabled = enabled === 'true';
        }
        
        if (volume !== null) {
            this.volume = parseFloat(volume);
        }
    }

    // Test sound
    testSound(soundName = 'click') {
        this.play(soundName);
    }
}

// Create global sound manager instance
const soundManager = new SoundManager();

// Load settings on initialization
soundManager.loadSettings();

// Add click sound to all clickable elements
document.addEventListener('DOMContentLoaded', function() {
    // Add click sounds to buttons
    document.addEventListener('click', function(e) {
        const element = e.target;
        
        // Check if element is clickable
        if (element.tagName === 'BUTTON' || 
            element.classList.contains('nav-link') ||
            element.classList.contains('product-card') ||
            element.classList.contains('category-btn') ||
            element.classList.contains('payment-btn') ||
            element.classList.contains('action-btn') ||
            element.type === 'submit') {
            
            soundManager.playClick();
        }
    });

    // Add success sound to form submissions
    document.addEventListener('submit', function(e) {
        soundManager.playSuccess();
    });
});

// Export for use in other modules
window.soundManager = soundManager;

