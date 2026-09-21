# Entity Manager SOP

## Purpose
Defines spawn and destroy logic for all game entities (asteroids, bullets, particles, weapons).

## Spawning Rules

### Asteroids
```javascript
function spawnWave(level) {
  const count = 3 + level;
  const asteroids = [];
  
  for (let i = 0; i < count; i++) {
    let x, y;
    let attempts = 0;
    
    // Find safe spawn position
    do {
      // Spawn at random edge
      const edge = Math.floor(Math.random() * 4);
      if (edge === 0) { x = Math.random() * canvas.width; y = 0; }
      else if (edge === 1) { x = canvas.width; y = Math.random() * canvas.height; }
      else if (edge === 2) { x = Math.random() * canvas.width; y = canvas.height; }
      else { x = 0; y = Math.random() * canvas.height; }
      
      attempts++;
    } while (!isSafeSpawn(x, y, player) && attempts < 20);
    
    asteroids.push(createAsteroid(x, y, 'large'));
  }
  
  return asteroids;
}

function isSafeSpawn(x, y, player) {
  const dx = x - player.x;
  const dy = y - player.y;
  return Math.sqrt(dx * dx + dy * dy) > 200;
}
```

### Bullets
```javascript
function spawnBullet(player, targetX, targetY) {
  const dx = targetX - player.x;
  const dy = targetY - player.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  const speed = 10;
  const vx = (dx / distance) * speed;
  const vy = (dy / distance) * speed;
  
  return {
    x: player.x,
    y: player.y,
    vx: vx,
    vy: vy,
    damage: 1,
    distanceTraveled: 0,
    radius: 3
  };
}
```

### Particles
```javascript
function spawnParticles(x, y, count) {
  const particles = [];
  const colors = ['hsl(40, 100%, 60%)', 'hsl(20, 90%, 50%)'];
  
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 3;
    
    particles.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      alpha: 1.0,
      color: colors[Math.floor(Math.random() * colors.length)],
      lifetime: 30,
      active: true
    });
  }
  
  return particles;
}
```

### Weapons
```javascript
function spawnWeapon() {
  const margin = 100;
  const x = margin + Math.random() * (canvas.width - margin * 2);
  const y = margin + Math.random() * (canvas.height - margin * 2);
  
  const types = ['triple', 'rapid'];
  const type = types[Math.floor(Math.random() * types.length)];
  
  return {
    x: x,
    y: y,
    type: type,
    expiryTime: Date.now() + 10000, // 10 seconds to collect
    radius: 20
  };
}
```

## Destruction Rules

### Bullets
- Remove if `distanceTraveled > 800`
- Remove if collision with asteroid
- Remove if off-screen (fallback)

### Asteroids
- On hit: Spawn 2 children (if large or medium)
- On hit: Spawn 20-30 particles
- On hit: Award points, play sound
- Remove from array after processing split

### Particles
- Decrement `lifetime` each frame
- Remove if `lifetime <= 0`
- Use object pooling: Set `active = false` instead of array removal

### Weapons
- Remove if collected by player
- Remove if `Date.now() > expiryTime`

## Object Pooling

Particles use object pooling to prevent garbage collection:

```javascript
const particlePool = new Array(300).fill(null).map(() => ({
  x: 0, y: 0, vx: 0, vy: 0, alpha: 0, color: '', lifetime: 0, active: false
}));

function getParticle() {
  for (let p of particlePool) {
    if (!p.active) {
      p.active = true;
      return p;
    }
  }
  return null; // Pool exhausted
}
```

## Edge Cases

1. **Max Spawn Attempts:** If 20 attempts fail, spawn anyway (prevent infinite loop).
2. **Off-Screen Bullets:** Remove bullets that are > canvas.width * 2 from origin.
3. **Particle Pool Exhaustion:** Skip particle spawn if pool full (log warning).
4. **Simultaneous Weapon Spawns:** Only allow 1 weapon on screen at a time.

## References
- Implementation: `js/main.js` (spawn functions)
- Particles: `js/modules/renderer.js` (drawParticles)
