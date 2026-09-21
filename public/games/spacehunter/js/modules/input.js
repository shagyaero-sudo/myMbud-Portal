// Input Module - Handles keyboard, mouse, and touch input

let canvas;
let input = {
    up: false,
    down: false,
    left: false,
    right: false,
    shooting: false,
    mouseX: 400,
    mouseY: 300,
    joystickX: 0,
    joystickY: 0
};

let isMobile = false;
let joystickActive = false;
let joystickTouchId = null;
let onPauseCallback = null;

export function initInput(canvasElement, onPause) {
    canvas = canvasElement;
    onPauseCallback = onPause;
    isMobile = detectMobile();
    
    if (isMobile) {
        setupMobileControls();
    } else {
        setupDesktopControls();
    }
    
    return input;
}

export function detectMobile() {
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function isMobileDevice() {
    return isMobile;
}

function setupDesktopControls() {
    // Keyboard
    document.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
        if (key === 'w' || key === 'arrowup') input.up = true;
        if (key === 's' || key === 'arrowdown') input.down = true;
        if (key === 'a' || key === 'arrowleft') input.left = true;
        if (key === 'd' || key === 'arrowright') input.right = true;
        
        if (key === 'escape' && onPauseCallback) {
            onPauseCallback();
        }

        if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) {
            e.preventDefault();
        }
    });
    
    document.addEventListener('keyup', (e) => {
        const key = e.key.toLowerCase();
        if (key === 'w' || key === 'arrowup') input.up = false;
        if (key === 's' || key === 'arrowdown') input.down = false;
        if (key === 'a' || key === 'arrowleft') input.left = false;
        if (key === 'd' || key === 'arrowright') input.right = false;
    });
    
    // Mouse
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        input.mouseX = e.clientX - rect.left;
        input.mouseY = e.clientY - rect.top;
    });
    
    canvas.addEventListener('mousedown', () => {
        input.shooting = true;
    });
    
    canvas.addEventListener('mouseup', () => {
        input.shooting = false;
    });
}

function setupMobileControls() {
    const mobileControls = document.getElementById('mobileControls');
    const joystick = document.getElementById('joystick');
    const joystickKnob = document.getElementById('joystickKnob');
    const fireBtn = document.getElementById('fireBtn');
    
    mobileControls.classList.remove('hidden');
    
    // Virtual Joystick - Enhanced Multi-touch handling
    joystick.addEventListener('touchstart', (e) => {
        e.preventDefault();
        // Look for the touch that just started on the joystick
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            if (!joystickActive) {
                joystickActive = true;
                joystickTouchId = touch.identifier;
                updateJoystick(touch, joystick, joystickKnob);
                break;
            }
        }
    });
    
    joystick.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (joystickActive) {
            // Only update if the specific joystick finger moved
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === joystickTouchId) {
                    updateJoystick(e.changedTouches[i], joystick, joystickKnob);
                    break;
                }
            }
        }
    });
    
    const handleJoystickEnd = (e) => {
        if (joystickActive) {
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === joystickTouchId) {
                    joystickActive = false;
                    joystickTouchId = null;
                    input.joystickX = 0;
                    input.joystickY = 0;
                    joystickKnob.style.transform = 'translate(-50%, -50%)';
                    break;
                }
            }
        }
    };

    joystick.addEventListener('touchend', handleJoystickEnd);
    joystick.addEventListener('touchcancel', handleJoystickEnd);
    
    // Fire Button - Independent handling
    fireBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        input.shooting = true;
        fireBtn.classList.add('pressed');
    });
    
    const handleFireEnd = (e) => {
        input.shooting = false;
        fireBtn.classList.remove('pressed');
    };

    fireBtn.addEventListener('touchend', handleFireEnd);
    fireBtn.addEventListener('touchcancel', handleFireEnd);
}

function updateJoystick(touch, joystick, joystickKnob) {
    const rect = joystick.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    let offsetX = touch.clientX - centerX;
    let offsetY = touch.clientY - centerY;
    
    // Clamp to joystick radius
    const distance = Math.sqrt(offsetX ** 2 + offsetY ** 2);
    const maxDistance = 31; // Adjusted for 108px base / 45px knob
    
    if (distance > maxDistance) {
        offsetX = (offsetX / distance) * maxDistance;
        offsetY = (offsetY / distance) * maxDistance;
    }
    
    // Update visual position
    joystickKnob.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`;
    
    // Normalize to -1 to 1 range
    input.joystickX = offsetX / maxDistance;
    input.joystickY = offsetY / maxDistance;
}

export function getInput() {
    return input;
}
