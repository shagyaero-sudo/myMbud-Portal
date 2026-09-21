# Physics SOP

## Purpose
Defines collision detection formulas and velocity calculations for all physics interactions.

## Collision Detection

### Circle-Circle Collision
```javascript
function checkCollision(entity1, entity2) {
  const dx = entity1.x - entity2.x;
  const dy = entity1.y - entity2.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const minDistance = entity1.radius + entity2.radius;
  return distance < minDistance;
}
```

### Collision Pairs
1. **Player vs Asteroids:** Damage player, trigger invulnerability
2. **Bullets vs Asteroids:** Destroy bullet, damage asteroid
3. **Player vs Weapons:** Collect weapon, remove from array

**Note:** Do NOT check asteroid-to-asteroid collisions (performance optimization).

## Velocity Calculations

### Player Movement (Inertia-Based)
```javascript
function updatePlayer(player, input, deltaTime) {
  const acceleration = 0.5;
  const maxSpeed = 5;
  const decay = 0.95;
  
  // Apply input acceleration
  if (input.up) player.vy -= acceleration;
  if (input.down) player.vy += acceleration;
  if (input.left) player.vx -= acceleration;
  if (input.right) player.vx += acceleration;
  
  // Clamp to max speed
  const speed = Math.sqrt(player.vx ** 2 + player.vy ** 2);
  if (speed > maxSpeed) {
    player.vx = (player.vx / speed) * maxSpeed;
    player.vy = (player.vy / speed) * maxSpeed;
  }
  
  // Apply inertia decay
  player.vx *= decay;
  player.vy *= decay;
  
  // Stop if very slow (prevent drift forever)
  if (Math.abs(player.vx) < 0.1) player.vx = 0;
  if (Math.abs(player.vy) < 0.1) player.vy = 0;
  
  // Update position
  player.x += player.vx;
  player.y += player.vy;
  
  // Screen wrapping
  wrapPosition(player, canvas.width, canvas.height);
  
  // Rotation matches velocity
  if (Math.abs(player.vx) > 0.1 || Math.abs(player.vy) > 0.1) {
    player.rotation = Math.atan2(player.vy, player.vx) + Math.PI / 2;
  }
}
```

### Asteroid Movement
```javascript
function updateAsteroids(asteroids, speedMultiplier) {
  for (let asteroid of asteroids) {
    asteroid.x += asteroid.vx * speedMultiplier;
    asteroid.y += asteroid.vy * speedMultiplier;
    asteroid.rotation += asteroid.rotationSpeed * speedMultiplier;
    
    wrapPosition(asteroid, canvas.width, canvas.height);
  }
}
```

### Bullet Movement
```javascript
function updateBullets(bullets) {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];
    bullet.x += bullet.vx;
    bullet.y += bullet.vy;
    bullet.distanceTraveled += Math.sqrt(bullet.vx ** 2 + bullet.vy ** 2);
    
    // Remove if traveled too far
    if (bullet.distanceTraveled > 800) {
      bullets.splice(i, 1);
    }
  }
}
```

### Screen Wrapping (Toroidal Topology)
```javascript
function wrapPosition(entity, width, height) {
  if (entity.x < 0) entity.x = width;
  if (entity.x > width) entity.x = 0;
  if (entity.y < 0) entity.y = height;
  if (entity.y > height) entity.y = 0;
}
```

## Asteroid Splitting Mechanics

### Velocity Divergence
```javascript
function splitAsteroid(asteroid) {
  const children = [];
  const newSize = asteroid.size === 'large' ? 'medium' : 'small';
  const newRadius = asteroid.size === 'large' ? 25 : 12;
  
  // Divergence angles (120 degrees apart)
  const angles = [120 * Math.PI / 180, -120 * Math.PI / 180];
  
  for (let angle of angles) {
    const vx = asteroid.vx * 0.5 + Math.cos(angle) * 2;
    const vy = asteroid.vy * 0.5 + Math.sin(angle) * 2;
    
    children.push({
      x: asteroid.x,
      y: asteroid.y,
      vx: vx,
      vy: vy,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: asteroid.rotationSpeed * 1.5,
      size: newSize,
      radius: newRadius,
      vertices: generateAsteroidVertices(newRadius),
      damage: newSize === 'medium' ? 1 : 0.5
    });
  }
  
  return children;
}
```

## Invulnerability Mechanics

```javascript
function handlePlayerCollision(player, asteroid) {
  if (player.invulnerable) return;
  
  // Apply damage
  player.health -= asteroid.damage;
  if (player.health < 0) player.health = 0;
  
  // Trigger invulnerability
  player.invulnerable = true;
  player.invulnerableTimer = 60; // 60 frames = 1 second at 60fps
}

function updateInvulnerability(player) {
  if (player.invulnerable) {
    player.invulnerableTimer--;
    if (player.invulnerableTimer <= 0) {
      player.invulnerable = false;
    }
  }
}
```

## Edge Cases

1. **High Delta Time:** If deltaTime > 33ms, physics may skip collisions. Clamp delta time to 33ms max.
2. **Diagonal Movement:** Normalize velocity vectors to prevent faster diagonal movement.
3. **Simultaneous Collisions:** Check all collisions in single pass, then apply effects (prevent double-hit).
4. **Asteroid Spawns on Wrap:** Verify spawn positions after wrapping to prevent overlap with player.

## Performance Optimizations

1. **Spatial Partitioning:** Not needed for <50 asteroids. Brute-force O(n²) is acceptable.
2. **AABB Pre-Check:** Not needed for circle collisions (distance formula is already fast).
3. **Cache Math.sqrt:** Store squared distances if threshold checks are common.

## References
- Implementation: `js/modules/physics.js`
- Game Loop: `architecture/game_loop.md`
- Collision Events: `js/main.js` (checkCollisions function)
