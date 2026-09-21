# Input Handling SOP

## Purpose
Defines event listener patterns for keyboard, mouse, and touch input.

## Desktop Input

### Keyboard Events
```javascript
const keys = {};

document.addEventListener('keydown', (e) => {
  keys[e.key.toLowerCase()] = true;
  
  // Prevent default for arrow keys (no scrolling)
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(e.key.toLowerCase())) {
    e.preventDefault();
  }
});

document.addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
});

// Map to input state
GameState.input.up = keys['w'] || keys['arrowup'];
GameState.input.down = keys['s'] || keys['arrowdown'];
GameState.input.left = keys['a'] || keys['arrowleft'];
GameState.input.right = keys['d'] || keys['arrowright'];
```

### Mouse Events
```javascript
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  GameState.input.mouseX = e.clientX - rect.left;
  GameState.input.mouseY = e.clientY - rect.top;
});

canvas.addEventListener('mousedown', () => {
  GameState.input.shooting = true;
});

canvas.addEventListener('mouseup', () => {
  GameState.input.shooting = false;
});
```

## Mobile Input

### Touch Events (Virtual Joystick)
```javascript
joystick.addEventListener('touchstart', (e) => {
  e.preventDefault();
  joystickActive = true;
  updateJoystickPosition(e.touches[0]);
});

joystick.addEventListener('touchmove', (e) => {
  e.preventDefault();
  if (joystickActive) {
    updateJoystickPosition(e.touches[0]);
  }
});

joystick.addEventListener('touchend', () => {
  joystickActive = false;
  GameState.input.joystickX = 0;
  GameState.input.joystickY = 0;
});

function updateJoystickPosition(touch) {
  const rect = joystick.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  
  let offsetX = touch.clientX - centerX;
  let offsetY = touch.clientY - centerY;
  
  // Clamp to joystick radius
  const distance = Math.sqrt(offsetX ** 2 + offsetY ** 2);
  const maxDistance = 60; // Half of outer circle
  if (distance > maxDistance) {
    offsetX = (offsetX / distance) * maxDistance;
    offsetY = (offsetY / distance) * maxDistance;
  }
  
  // Normalize to -1 to 1 range
  GameState.input.joystickX = offsetX / maxDistance;
  GameState.input.joystickY = offsetY / maxDistance;
}
```

### Touch Events (Fire Button)
```javascript
fireButton.addEventListener('touchstart', (e) => {
  e.preventDefault();
  GameState.input.shooting = true;
  fireButton.classList.add('pressed');
});

fireButton.addEventListener('touchend', () => {
  GameState.input.shooting = false;
  fireButton.classList.remove('pressed');
});
```

## Edge Cases

1. **Multi-Touch:** Use `e.touches[0]` to handle only the first touch on each element.
2. **Touch Outside Boundary:** Clamp joystick offset to outer circle radius.
3. **Rapid Key Toggling:** Debounce not needed; state-based approach handles it.
4. **Focus Loss:** Add `window.addEventListener('blur')` to pause game.

## Platform Detection
```javascript
function isMobile() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}
```

## References
- Implementation: `js/modules/input.js`
- Mobile UI: `css/style.css`
