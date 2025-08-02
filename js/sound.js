// সাউন্ড ম্যানেজমেন্ট সিস্টেম
class SoundManager {
    constructor() {
        this.sounds = {};
        this.enabled = true;
        this.volume = 0.3; // 30% ভলিউম
        this.loadSounds();
        this.setupVolumeControl();
    }

    loadSounds() {
        // সাউন্ড ফাইলগুলো লোড করা
        this.sounds = {
            click: new Audio('audio/click.wav'),
            success: new Audio('audio/success.wav'),
            error: new Audio('audio/error.wav'),
            // সিন্থেটিক সাউন্ড তৈরি করা
            beep: this.createBeepSound(800, 100), // 800Hz, 100ms
            ding: this.createBeepSound(1200, 150), // 1200Hz, 150ms
            buzz: this.createBeepSound(300, 200)   // 300Hz, 200ms
        };

        // সব সাউন্ডের ভলিউম সেট করা
        Object.values(this.sounds).forEach(sound => {
            if (sound instanceof Audio) {
                sound.volume = this.volume;
                sound.preload = 'auto';
            }
        });
    }

    // সিন্থেটিক বিপ সাউন্ড তৈরি করা
    createBeepSound(frequency, duration) {
        return () => {
            if (!this.enabled) return;
            
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                oscillator.frequency.value = frequency;
                oscillator.type = 'sine';

                gainNode.gain.setValueAtTime(0, audioContext.currentTime);
                gainNode.gain.linearRampToValueAtTime(this.volume, audioContext.currentTime + 0.01);
                gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration / 1000);

                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + duration / 1000);
            } catch (error) {
                console.warn('অডিও কনটেক্সট তৈরি করতে সমস্যা:', error);
            }
        };
    }

    // সাউন্ড প্লে করা
    play(soundName) {
        if (!this.enabled) return;

        try {
            const sound = this.sounds[soundName];
            if (sound) {
                if (typeof sound === 'function') {
                    // সিন্থেটিক সাউন্ড
                    sound();
                } else {
                    // অডিও ফাইল
                    sound.currentTime = 0;
                    const playPromise = sound.play();
                    if (playPromise !== undefined) {
                        playPromise.catch(error => {
                            console.warn('সাউন্ড প্লে করতে সমস্যা:', error);
                        });
                    }
                }
            }
        } catch (error) {
            console.warn('সাউন্ড প্লে করতে সমস্যা:', error);
        }
    }

    // ভলিউম সেট করা
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        Object.values(this.sounds).forEach(sound => {
            if (sound instanceof Audio) {
                sound.volume = this.volume;
            }
        });
        localStorage.setItem('pos_sound_volume', this.volume);
    }

    // সাউন্ড চালু/বন্ধ করা
    toggle() {
        this.enabled = !this.enabled;
        localStorage.setItem('pos_sound_enabled', this.enabled);
        return this.enabled;
    }

    // সাউন্ড চালু করা
    enable() {
        this.enabled = true;
        localStorage.setItem('pos_sound_enabled', this.enabled);
    }

    // সাউন্ড বন্ধ করা
    disable() {
        this.enabled = false;
        localStorage.setItem('pos_sound_enabled', this.enabled);
    }

    // ভলিউম কন্ট্রোল সেটআপ
    setupVolumeControl() {
        // localStorage থেকে সেটিংস লোড করা
        const savedVolume = localStorage.getItem('pos_sound_volume');
        const savedEnabled = localStorage.getItem('pos_sound_enabled');

        if (savedVolume !== null) {
            this.setVolume(parseFloat(savedVolume));
        }

        if (savedEnabled !== null) {
            this.enabled = savedEnabled === 'true';
        }
    }

    // প্রিসেট সাউন্ড ইফেক্ট
    playClick() {
        this.play('beep');
    }

    playSuccess() {
        this.play('ding');
    }

    playError() {
        this.play('buzz');
    }

    playNavigation() {
        this.play('beep');
    }

    playAddToCart() {
        this.play('ding');
    }

    playRemoveFromCart() {
        this.play('buzz');
    }

    playPaymentComplete() {
        // দুইটি সাউন্ড একসাথে
        this.play('ding');
        setTimeout(() => this.play('ding'), 200);
    }
}

// গ্লোবাল সাউন্ড ম্যানেজার ইনস্ট্যান্স
const soundManager = new SoundManager();

// সব ক্লিকযোগ্য এলিমেন্টে সাউন্ড যোগ করা
function addSoundToElements() {
    // বাটন এলিমেন্ট
    document.querySelectorAll('button, .btn').forEach(button => {
        button.addEventListener('click', () => {
            if (button.classList.contains('btn-success')) {
                soundManager.playSuccess();
            } else if (button.classList.contains('btn-danger') || button.classList.contains('remove-btn')) {
                soundManager.playError();
            } else {
                soundManager.playClick();
            }
        });
    });

    // নেভিগেশন লিংক
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            soundManager.playNavigation();
        });
    });

    // প্রোডাক্ট কার্ড
    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', () => {
            soundManager.playAddToCart();
        });
    });

    // ফিল্টার বাটন
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            soundManager.playClick();
        });
    });

    // পেমেন্ট বাটন
    document.querySelectorAll('.payment-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            soundManager.playClick();
        });
    });

    // কোয়ান্টিটি বাটন
    document.querySelectorAll('.qty-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            soundManager.playClick();
        });
    });

    // রিমুভ বাটন
    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            soundManager.playRemoveFromCart();
        });
    });
}

// ইনপুট ফিল্ডে টাইপিং সাউন্ড
function addInputSounds() {
    document.querySelectorAll('input, select, textarea').forEach(input => {
        input.addEventListener('focus', () => {
            soundManager.play('beep');
        });
    });
}

// ডকুমেন্ট লোড হওয়ার পর সাউন্ড যোগ করা
document.addEventListener('DOMContentLoaded', () => {
    addSoundToElements();
    addInputSounds();
});

// ডায়নামিক কন্টেন্টের জন্য সাউন্ড আপডেট করা
function updateSounds() {
    addSoundToElements();
    addInputSounds();
}

// সাউন্ড কন্ট্রোল UI তৈরি করা
function createSoundControl() {
    const soundControl = document.createElement('div');
    soundControl.className = 'sound-control';
    soundControl.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-lg);
        padding: var(--space-md);
        box-shadow: var(--shadow-lg);
        z-index: 1001;
        display: flex;
        align-items: center;
        gap: var(--space-sm);
        font-size: 0.875rem;
    `;

    soundControl.innerHTML = `
        <button id="soundToggle" class="btn btn-sm" style="padding: var(--space-xs) var(--space-sm);">
            🔊
        </button>
        <input type="range" id="volumeSlider" min="0" max="1" step="0.1" value="${soundManager.volume}" 
               style="width: 80px;">
        <span id="volumeText">${Math.round(soundManager.volume * 100)}%</span>
    `;

    document.body.appendChild(soundControl);

    // সাউন্ড টগল বাটন
    const toggleBtn = document.getElementById('soundToggle');
    const volumeSlider = document.getElementById('volumeSlider');
    const volumeText = document.getElementById('volumeText');

    function updateToggleButton() {
        toggleBtn.textContent = soundManager.enabled ? '🔊' : '🔇';
        toggleBtn.title = soundManager.enabled ? 'সাউন্ড বন্ধ করুন' : 'সাউন্ড চালু করুন';
    }

    toggleBtn.addEventListener('click', () => {
        soundManager.toggle();
        updateToggleButton();
    });

    volumeSlider.addEventListener('input', (e) => {
        const volume = parseFloat(e.target.value);
        soundManager.setVolume(volume);
        volumeText.textContent = Math.round(volume * 100) + '%';
    });

    updateToggleButton();
}

// পেজ লোড হওয়ার পর সাউন্ড কন্ট্রোল যোগ করা
window.addEventListener('load', () => {
    setTimeout(createSoundControl, 1000);
});

// এক্সপোর্ট করা
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { soundManager, addSoundToElements, updateSounds };
}

