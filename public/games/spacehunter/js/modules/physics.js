// Physics Module - Handles movement, collisions, and game physics

export function updatePlayer(player, input, canvasWidth, canvasHeight) {
    const acceleration = 0.5;
    const maxSpeed = 5;
    const decay = 0.95;
    
    // Apply input acceleration
    if (input.up) player.vy -= acceleration;
    if (input.down) player.vy += acceleration;
    if (input.left) player.vx -= acceleration;
    if (input.right) player.vx += acceleration;
    
    // Apply joystick input (mobile)
    if (input.joystickX !== 0 || input.joystickY !== 0) {
        player.vx += input.joystickX * acceleration;
        player.vy += input.joystickY * acceleration;
    }
    
    // Clamp to max speed
    const speed = Math.sqrt(player.vx ** 2 + player.vy ** 2);
    if (speed > maxSpeed) {
        player.vx = (player.vx / speed) * maxSpeed;
        player.vy = (player.vy / speed) * maxSpeed;
    }
    
    // Apply inertia decay
    player.vx *= decay;
    player.vy *= decay;
    
    // Stop if very slow
    if (Math.abs(player.vx) < 0.1) player.vx = 0;
    if (Math.abs(player.vy) < 0.1) player.vy = 0;
    
    // Update position
    player.x += player.vx;
    player.y += player.vy;
    
    // Screen wrapping
    wrapPosition(player, canvasWidth, canvasHeight);
    
    // Rotation toward cursor (desktop) or joystick (mobile)
    let targetAngle;
    
    if (input.joystickX !== 0 || input.joystickY !== 0) {
        // Mobile: rotate toward joystick direction
        targetAngle = Math.atan2(input.joystickY, input.joystickX) + Math.PI / 2;
    } else if (input.mouseX !== undefined && input.mouseY !== undefined) {
        // Desktop: rotate toward mouse cursor
        targetAngle = Math.atan2(input.mouseY - player.y, input.mouseX - player.x) + Math.PI / 2;
    } else {
        // Fallback: keep current rotation
        targetAngle = player.rotation;
    }
    
    // Smooth rotation using lerp
    player.rotation = lerpAngle(player.rotation, targetAngle, 0.15);
    
    // Update invulnerability
    if (player.invulnerable) {
        player.invulnerableTimer--;
        if (player.invulnerableTimer <= 0) {
            player.invulnerable = false;
        }
    }
}

function lerpAngle(current, target, alpha) {
    let diff = target - current;
    // Handle angle wrapping (shortest path)
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    return current + diff * alpha;
}

export function updateAsteroids(asteroids, speedMultiplier, canvasWidth, canvasHeight) {
    for (let asteroid of asteroids) {
        asteroid.x += asteroid.vx * speedMultiplier;
        asteroid.y += asteroid.vy * speedMultiplier;
        asteroid.rotation += asteroid.rotationSpeed * speedMultiplier;
        wrapPosition(asteroid, canvasWidth, canvasHeight);
    }
}

export function updateBullets(bullets, canvasWidth, canvasHeight) {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;
        bullet.distanceTraveled += Math.sqrt(bullet.vx ** 2 + bullet.vy ** 2);
        
        // Remove if traveled too far or off-screen
        if (bullet.distanceTraveled > 800 || 
            bullet.x < -50 || bullet.x > canvasWidth + 50 ||
            bullet.y < -50 || bullet.y > canvasHeight + 50) {
            bullets.splice(i, 1);
        }
    }
}

export function updateParticles(particles) {
    for (let particle of particles) {
        if (!particle.active) continue;
        
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.lifetime--;
        particle.alpha = particle.lifetime / 30;
        
        if (particle.lifetime <= 0) {
            particle.active = false;
        }
    }
}

export function wrapPosition(entity, width, height) {
    if (entity.x < 0) entity.x = width;
    if (entity.x > width) entity.x = 0;
    if (entity.y < 0) entity.y = height;
    if (entity.y > height) entity.y = 0;
}

export function checkCollision(entity1, entity2) {
    const dx = entity1.x - entity2.x;
    const dy = entity1.y - entity2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < (entity1.radius + entity2.radius);
}

export function splitAsteroid(asteroid, generateVertices) {
    if (asteroid.size === 'small') {
        return [];
    }
    
    const children = [];
    const newSize = asteroid.size === 'large' ? 'medium' : 'small';
    const newRadius = asteroid.size === 'large' ? 25 : 12;
    
    // Base damage for new size (without material multiplier)
    const baseDamage = newSize === 'medium' ? 1 : 0.5;
    const baseHP = 1; // All sizes have base 1 HP
    
    // Get material multiplier from parent asteroid
    const materialMult = asteroid.materialTier !== undefined ? 
        (asteroid.damage / (asteroid.size === 'large' ? 2 : (asteroid.size === 'medium' ? 1 : 0.5))) : 1;
    
    // Create 2 children with divergent velocities
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
            vertices: generateVertices(newRadius),
            damage: baseDamage * materialMult, // Preserve material damage multiplier
            hp: baseHP * (asteroid.hp / (asteroid.maxHp || 1)), // Preserve material HP multiplier
            maxHp: baseHP * (asteroid.hp / (asteroid.maxHp || 1)),
            materialTier: asteroid.materialTier || 0, // Preserve material tier
            color: asteroid.color || 'hsl(30, 50%, 40%)' // Preserve color
        });
    }
    
    return children;
}

export function createParticles(x, y, count, particlePool) {
    const colors = ['hsl(40, 100%, 60%)', 'hsl(20, 90%, 50%)'];
    const newParticles = [];
    
    for (let i = 0; i < count; i++) {
        // Find inactive particle in pool
        let particle = null;
        for (let p of particlePool) {
            if (!p.active) {
                particle = p;
                break;
            }
        }
        
        if (!particle) continue; // Pool exhausted
        
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 3;
        
        particle.x = x;
        particle.y = y;
        particle.vx = Math.cos(angle) * speed;
        particle.vy = Math.sin(angle) * speed;
        particle.alpha = 1.0;
        particle.color = colors[Math.floor(Math.random() * colors.length)];
        particle.lifetime = 30;
        particle.active = true;
        
        newParticles.push(particle);
    }
    
    return newParticles;
}
