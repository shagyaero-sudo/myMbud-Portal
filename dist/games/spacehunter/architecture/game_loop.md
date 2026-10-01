# Game Loop SOP

## Purpose
Defines the main game loop logic using `requestAnimationFrame` for 60fps rendering.

## Algorithm

### 1. Initialization
```
- Get canvas context
- Initialize GameState
- Start audio context on first user interaction
- Begin game loop
```

### 2. Game Loop (Recursive)
```
function gameLoop(currentTime) {
  // Calculate delta time
  deltaTime = currentTime - lastTime
  lastTime = currentTime
  
  // Update phase
  if (GameState.gameState === 'playing') {
    updatePlayer(GameState.player, GameState.input, deltaTime)
    updateAsteroids(GameState.asteroids, GameState.speedMultiplier)
    updateBullets(GameState.bullets)
    updateParticles(GameState.particles)
    updateWeapons(GameState.weapons, currentTime)
    checkCollisions(GameState)
    checkLevelComplete(GameState)
  }
  
  // Render phase
  clearCanvas(ctx, canvas.width, canvas.height)
  renderStarfield(ctx, GameState.stars, GameState.speedMultiplier)
  renderAsteroids(ctx, GameState.asteroids)
  renderBullets(ctx, GameState.bullets)
  renderPlayer(ctx, GameState.player)
  renderParticles(ctx, GameState.particles)
  renderHUD(ctx, GameState)
  
  // Request next frame
  requestAnimationFrame(gameLoop)
}
```

### 3. State Transitions
```
'menu' -> 'playing': User clicks "Start"
'playing' -> 'paused': User presses ESC
'playing' -> 'gameover': Player health <= 0
'gameover' -> 'menu': User clicks "Restart"
```

## Edge Cases

1. **Tab Switched:** Delta time can spike to 1000ms+. Clamp to 33ms max (30fps minimum).
2. **Initial Frame:** `lastTime` is undefined. Set to `currentTime` on first call.
3. **Garbage Collection Pause:** Monitor frame times. Log warning if > 33ms.

## Performance Monitoring
```javascript
// Add to gameLoop
const fps = 1000 / deltaTime;
if (frameCount % 60 === 0) {
  console.log(`FPS: ${fps.toFixed(1)}`);
}
```

## References
- Implementation: `js/main.js`
- Physics: `js/modules/physics.js`
- Rendering: `js/modules/renderer.js`
