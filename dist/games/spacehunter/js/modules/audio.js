// Audio Module - Handles Web Audio API and Speech Synthesis

let audioContext;
let isMuted = false;
let audioInitialized = false;

let engineOsc;
let engineGain;

export function initAudio() {
    // Load mute state from localStorage
    const savedMuteState = localStorage.getItem('spaceHunterMuted');
    if (savedMuteState === 'true') {
        isMuted = true;
        updateMuteButton();
    }
    
    // Setup mute button
    const muteBtn = document.getElementById('muteBtn');
    muteBtn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        toggleMute();
    });
    
    // Initialize AudioContext on first user interaction
    document.addEventListener('click', initAudioContext, { once: true });
    document.addEventListener('touchstart', initAudioContext, { once: true });
}

function initAudioContext() {
    if (!audioInitialized) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioInitialized = true;
        console.log('Audio Context initialized');
        startEngineHum();
    }
}

export function toggleMute() {
    isMuted = !isMuted;
    localStorage.setItem('spaceHunterMuted', isMuted);
    updateMuteButton();
    
    if (isMuted) {
        stopEngineHum();
    } else if (audioInitialized) {
        startEngineHum();
    }
}

export function startEngineHum() {
    if (isMuted || !audioInitialized || engineOsc) return;
    
    engineOsc = audioContext.createOscillator();
    engineGain = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    
    engineOsc.type = 'sawtooth';
    engineOsc.frequency.value = 60;
    
    filter.type = 'lowpass';
    filter.frequency.value = 200;
    
    engineGain.gain.value = 0.05;
    
    engineOsc.connect(filter);
    filter.connect(engineGain);
    engineGain.connect(audioContext.destination);
    
    engineOsc.start();
}

export function updateEngineHum(speed) {
    if (!engineOsc || isMuted) return;
    
    // speed is usually 0-5
    const targetFreq = 60 + (speed * 12);
    engineOsc.frequency.setTargetAtTime(targetFreq, audioContext.currentTime, 0.1);
    
    const targetGain = 0.02 + (speed * 0.01);
    engineGain.gain.setTargetAtTime(targetGain, audioContext.currentTime, 0.1);
}

export function stopEngineHum() {
    if (engineOsc) {
        try {
            engineOsc.stop();
            engineOsc.disconnect();
        } catch (e) {}
        engineOsc = null;
    }
}

function updateMuteButton() {
    const muteBtn = document.getElementById('muteBtn');
    if (isMuted) {
        muteBtn.classList.add('muted');
        muteBtn.textContent = '🔇';
    } else {
        muteBtn.classList.remove('muted');
        muteBtn.textContent = '🔊';
    }
}

export function playShootSound() {
    if (isMuted || !audioInitialized) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.value = 200;
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.05);
}

export function playExplosionSound() {
    if (isMuted || !audioInitialized) return;
    
    // Deprecated - use playAsteroidHit(materialTier) instead
    playAsteroidHit(0); // Default to rock sound
}

export function playAsteroidHit(materialTier = 0) {
    if (isMuted || !audioInitialized) return;
    
    // Material-based sound properties
    const baseFreq = 800;
    const freqStep = 400;
    const frequency = baseFreq + (materialTier * freqStep); // 800, 1200, 1800, 2400, 3200
    const qFactor = 1 + (materialTier * 2); // 1, 3, 5, 7, 9 (sharper for harder materials)
    const duration = 0.3 - (materialTier * 0.04); // 0.30, 0.26, 0.22, 0.18, 0.14
    
    const bufferSize = audioContext.sampleRate * duration;
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    // Generate white noise
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    
    const gainNode = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    
    // Bandpass filter for metallic resonance
    filter.type = 'bandpass';
    filter.frequency.value = frequency;
    filter.Q.value = qFactor; // Higher Q = sharper, more metallic sound
    
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    source.start(audioContext.currentTime);
}

export function playSpacecraftImpact(materialTier = 0) {
    if (isMuted || !audioInitialized) return;
    
    // Spacecraft impact sound (lower frequency, bass-heavy)
    // Different from asteroid hit to distinguish events
    const baseFreq = 400;
    const freqStep = 200;
    const frequency = baseFreq + (materialTier * freqStep); // 400, 600, 800, 1000, 1200
    const qFactor = 0.5 + (materialTier * 1); // 0.5, 1.5, 2.5, 3.5, 4.5 (lower Q = more bass)
    const duration = 0.2; // Shorter, punchier
    
    const bufferSize = audioContext.sampleRate * duration;
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    // Generate white noise
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    
    const gainNode = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    
    // Bandpass filter for impact character
    filter.type = 'bandpass';
    filter.frequency.value = frequency;
    filter.Q.value = qFactor; // Lower Q than hit = more thuddish
    
    // Slightly louder for impact emphasis
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    source.start(audioContext.currentTime);
}

export function playLevelUpSound() {
    if (isMuted || !audioInitialized) return;
    
    const notes = [261.63, 329.63, 392.00]; // C, E, G
    const duration = 0.15;
    
    notes.forEach((frequency, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = 'triangle';
        oscillator.frequency.value = frequency;
        
        const startTime = audioContext.currentTime + (index * 0.1);
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.05);
        gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
    });
}

export function playVoice(eventType) {
    if (isMuted || !audioInitialized) return;
    
    let notes = [];
    let oscType = 'sine';
    let tempo = 0.1;
    
    switch (eventType) {
        case 'good': // Health pickup
            notes = [523.25, 659.25, 783.99]; // C5, E5, G5
            oscType = 'triangle';
            break;
        case 'excellent': // Weapon pickup
            notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
            oscType = 'square';
            tempo = 0.08;
            break;
        case 'ohyes': // Combo/Score bonus
            notes = [392, 523.25, 659.25, 783.99]; // G4, C5, E5, G5
            oscType = 'sine';
            break;
        case 'levelUp':
            notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
            oscType = 'triangle';
            break;
        case 'gameOver':
            notes = [440, 349.23, 293.66, 220]; // A4, F4, D4, A3
            oscType = 'sawtooth';
            tempo = 0.2;
            break;
    }

    const duration = tempo * 1.5;
    notes.forEach((freq, i) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const startTime = audioContext.currentTime + (i * tempo);
        
        osc.type = oscType;
        osc.frequency.setValueAtTime(freq, startTime);
        
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.1, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        osc.connect(gain);
        gain.connect(audioContext.destination);
        
        osc.start(startTime);
        osc.stop(startTime + duration);
    });
}
