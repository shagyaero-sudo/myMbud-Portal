// Renderer Module - Handles all canvas drawing operations

let ctx;
let canvas;

export function initRenderer(canvasElement) {
    canvas = canvasElement;
    ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 600;
    return ctx;
}

export function clearCanvas(context, width, height) {
    context.fillStyle = 'hsl(240, 30%, 8%)';
    context.fillRect(0, 0, width, height);
}

export function generateStars(count, layer) {
    const stars = [];
    const brightness = layer === 1 ? 40 : (layer === 2 ? 60 : 80);
    for (let i = 0; i < count; i++) {
        stars.push({
            x: Math.random() * 800,
            y: Math.random() * 600,
            layer: layer,
            brightness: brightness,
            size: 1 + Math.random() * 2
        });
    }
    return stars;
}

export function renderStarfield(context, stars, speedMultiplier) {
    for (let star of stars) {
        context.fillStyle = `hsl(0, 0%, ${star.brightness}%)`;
        context.fillRect(star.x, star.y, star.size, star.size);
    }
}

export function updateStarfield(stars, speedMultiplier, canvasHeight) {
    for (let star of stars) {
        const layerSpeed = star.layer === 1 ? 0.5 : (star.layer === 2 ? 1.0 : 1.5);
        star.y += layerSpeed * speedMultiplier;
        if (star.y > canvasHeight) {
            star.y = 0;
            star.x = Math.random() * 800;
        }
    }
}

export function generateAsteroidVertices(radius) {
    const vertexCount = 8 + Math.floor(Math.random() * 5);
    const vertices = [];
    for (let i = 0; i < vertexCount; i++) {
        const angle = (i / vertexCount) * Math.PI * 2;
        const variation = 0.8 + Math.random() * 0.4;
        const r = radius * variation;
        vertices.push({
            x: Math.cos(angle) * r,
            y: Math.sin(angle) * r
        });
    }
    return vertices;
}

export function renderAsteroid(context, asteroid) {
    context.save();
    context.translate(asteroid.x, asteroid.y);
    context.rotate(asteroid.rotation);
    
    context.beginPath();
    context.moveTo(asteroid.vertices[0].x, asteroid.vertices[0].y);
    for (let i = 1; i < asteroid.vertices.length; i++) {
        context.lineTo(asteroid.vertices[i].x, asteroid.vertices[i].y);
    }
    context.closePath();
    
    // Use material-based color (Session 4)
    const baseColor = asteroid.color || 'hsl(30, 50%, 40%)'; // Default to rock
    
    // Extract HSL values for gradient
    const hslMatch = baseColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (hslMatch) {
        const [, h, s, l] = hslMatch.map(Number);
        const gradient = context.createRadialGradient(0, 0, 0, 0, 0, asteroid.radius);
        gradient.addColorStop(0, `hsl(${h}, ${Math.min(s + 10, 100)}%, ${Math.min(l + 15, 100)}%)`);
        gradient.addColorStop(1, baseColor);
        context.fillStyle = gradient;
    } else {
        context.fillStyle = baseColor;
    }
    
    context.fill();
    
    // Darker stroke based on material color
    if (hslMatch) {
        const [, h, s, l] = hslMatch.map(Number);
        context.strokeStyle = `hsl(${h}, ${s}%, ${Math.max(l - 10, 0)}%)`;
    } else {
        context.strokeStyle = 'hsl(30, 50%, 30%)';
    }
    context.lineWidth = 2;
    context.stroke();
    
    context.restore();
}

export function renderPlayer(context, player) {
    if (player.invulnerable && Math.floor(Date.now() / 100) % 2 === 0) {
        return; // Flash effect during invulnerability
    }
    
    context.save();
    context.translate(player.x, player.y);
    context.rotate(player.rotation);
    
    const color = player.invulnerable ? 'hsl(0, 80%, 50%)' : 'hsl(200, 100%, 50%)';
    
    // Draw sleek racer spacecraft
    context.beginPath();
    
    // Nose (top point)
    context.moveTo(0, -18);
    
    // Right wing sweep
    context.lineTo(8, -10);
    context.lineTo(12, -2);
    context.lineTo(6, 0);
    
    // Right rear wing
    context.lineTo(8, 8);
    context.lineTo(3, 12);
    
    // Engine mount (right)
    context.lineTo(3, 14);
    
    // Back to center through left side
    context.lineTo(0, 13);
    context.lineTo(-3, 14);
    
    // Engine mount (left)
    context.lineTo(-3, 12);
    context.lineTo(-8, 8);
    
    // Left rear wing
    context.lineTo(-6, 0);
    
    // Left wing sweep
    context.lineTo(-12, -2);
    context.lineTo(-8, -10);
    
    context.closePath();
    
    // Fill with gradient
    const gradient = context.createLinearGradient(0, -18, 0, 14);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, 'hsl(200, 100%, 30%)');
    context.fillStyle = gradient;
    context.fill();
    
    // Stroke outline
    context.strokeStyle = color;
    context.lineWidth = 2;
    context.stroke();
    
    // Engine glow at rear
    context.shadowBlur = 15;
    context.shadowColor = color;
    context.fillStyle = color;
    context.beginPath();
    context.arc(0, 13, 3, 0, Math.PI * 2);
    context.fill();
    context.shadowBlur = 0;
    
    // Cockpit detail (small window)
    context.fillStyle = 'hsl(200, 50%, 80%)';
    context.beginPath();
    context.ellipse(0, -5, 2, 4, 0, 0, Math.PI * 2);
    context.fill();
    
    context.restore();
}

export function renderBullet(context, bullet) {
    context.fillStyle = 'hsl(200, 100%, 70%)';
    context.beginPath();
    context.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
    context.fill();
    
    context.shadowBlur = 10;
    context.shadowColor = 'hsl(200, 100%, 50%)';
    context.fill();
    context.shadowBlur = 0;
}

export function renderParticle(context, particle) {
    context.globalAlpha = particle.alpha;
    context.fillStyle = particle.color;
    context.beginPath();
    context.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
    context.fill();
    context.globalAlpha = 1.0;
}

export function renderWeapon(context, weapon) {
    context.fillStyle = 'hsl(120, 80%, 50%)';
    context.shadowBlur = 15;
    context.shadowColor = 'hsl(120, 80%, 50%)';
    context.beginPath();
    context.arc(weapon.x, weapon.y, weapon.radius, 0, Math.PI * 2);
    context.fill();
    context.shadowBlur = 0;
    
    context.fillStyle = 'hsl(0, 0%, 95%)';
    context.font = 'bold 14px Courier New';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    const label = weapon.type === 'triple' ? 'X3' : 'X2';
    context.fillText(label, weapon.x, weapon.y);
}

export function renderHealthPickup(context, healthPickup) {
    const now = Date.now();
    
    // Pulsing animation
    const pulseValue = Math.sin(now / 200 + healthPickup.pulsePhase) * 0.5 + 0.5;
    const glowIntensity = 10 + pulseValue * 10;
    const radius = healthPickup.radius + pulseValue * 3;
    
    // Outer glow
    context.shadowBlur = glowIntensity;
    context.shadowColor = 'hsl(0, 100%, 50%)';
    context.fillStyle = 'rgba(255, 0, 0, 0.3)';
    context.beginPath();
    context.arc(healthPickup.x, healthPickup.y, radius, 0, Math.PI * 2);
    context.fill();
    context.shadowBlur = 0;
    
    // Red circle background
    context.fillStyle = 'hsl(0, 100%, 50%)';
    context.beginPath();
    context.arc(healthPickup.x, healthPickup.y, healthPickup.radius, 0, Math.PI * 2);
    context.fill();
    
    // White cross symbol
    const crossSize = healthPickup.radius * 0.6;
    const crossThickness = crossSize * 0.3;
    
    context.fillStyle = 'rgb(255, 255, 255)';
    
    // Horizontal bar
    context.fillRect(
        healthPickup.x - crossSize / 2,
        healthPickup.y - crossThickness / 2,
        crossSize,
        crossThickness
    );
    
    // Vertical bar
    context.fillRect(
        healthPickup.x - crossThickness / 2,
        healthPickup.y - crossSize / 2,
        crossThickness,
        crossSize
    );
}

export function updateHUD(gameState) {
    const healthBar = document.getElementById('healthBar');
    const healthBarContainer = healthBar.parentElement;
    const scoreElement = document.getElementById('score');
    const levelElement = document.getElementById('level');
    
    const maxHealth = gameState.player.maxHealth || 25;
    const healthPercent = Math.max(0, Math.min(1, gameState.player.health / maxHealth));
    healthBar.style.width = (healthPercent * 100) + '%';
    
    // Pulse effect for critical health (below 20%)
    if (healthPercent < 0.2 && healthPercent > 0) {
        healthBarContainer.classList.add('critical');
    } else {
        healthBarContainer.classList.remove('critical');
    }
    
    scoreElement.textContent = gameState.score;
    levelElement.textContent = gameState.level;
}

export function renderPowerupIcons(context, player) {
    const now = Date.now();
    const powerups = player.powerups;
    let iconX = 10; // Start position from left
    
    // Adjust Y position for landscape mode
    const isLandscape = context.canvas.height < 500;
    const iconY = isLandscape ? 35 : 60; 
    const iconSize = isLandscape ? 25 : 40;
    const spacing = isLandscape ? 35 : 50;
    
    // Triple Shot Icon
    if (powerups.tripleShot.active) {
        const timeLeft = Math.max(0, (powerups.tripleShot.expiryTime - now) / 1000);
        const alpha = timeLeft < 5 ? 0.3 + 0.7 * (Math.sin(now / 100) * 0.5 + 0.5) : 1.0; // Pulse when expiring
        
        context.save();
        context.globalAlpha = alpha;
        
        // Background circle
        context.fillStyle = 'rgba(0, 255, 100, 0.2)';
        context.beginPath();
        context.arc(iconX + iconSize/2, iconY + iconSize/2, iconSize/2, 0, Math.PI * 2);
        context.fill();
        
        // Border
        context.strokeStyle = 'rgba(0, 255, 100, 0.8)';
        context.lineWidth = 2;
        context.stroke();
        
        // "X3" text
        context.fillStyle = 'rgb(0, 255, 100)';
        context.font = `bold ${isLandscape ? 14 : 18}px Courier New`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText('X3', iconX + iconSize/2, iconY + iconSize/2 - (isLandscape ? 1 : 2));
        
        // Timer text
        context.font = `${isLandscape ? 8 : 10}px Courier New`;
        context.fillText(timeLeft.toFixed(1) + 's', iconX + iconSize/2, iconY + iconSize/2 + (isLandscape ? 8 : 10));
        
        context.restore();
        
        iconX += spacing;
    }
    
    // Rapid Fire Icon
    if (powerups.rapidFire.active) {
        const timeLeft = Math.max(0, (powerups.rapidFire.expiryTime - now) / 1000);
        const alpha = timeLeft < 5 ? 0.3 + 0.7 * (Math.sin(now / 100) * 0.5 + 0.5) : 1.0; // Pulse when expiring
        
        context.save();
        context.globalAlpha = alpha;
        
        // Background circle
        context.fillStyle = 'rgba(255, 150, 0, 0.2)';
        context.beginPath();
        context.arc(iconX + iconSize/2, iconY + iconSize/2, iconSize/2, 0, Math.PI * 2);
        context.fill();
        
        // Border
        context.strokeStyle = 'rgba(255, 150, 0, 0.8)';
        context.lineWidth = 2;
        context.stroke();
        
        // "X2" text
        context.fillStyle = 'rgb(255, 150, 0)';
        context.font = `bold ${isLandscape ? 14 : 18}px Courier New`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText('X2', iconX + iconSize/2, iconY + iconSize/2 - (isLandscape ? 1 : 2));
        
        // Timer text
        context.font = `${isLandscape ? 8 : 10}px Courier New`;
        context.fillText(timeLeft.toFixed(1) + 's', iconX + iconSize/2, iconY + iconSize/2 + (isLandscape ? 8 : 10));
        
        context.restore();
        
        iconX += spacing;
    }
    
    // Combined glow effect when both active
    if (powerups.tripleShot.active && powerups.rapidFire.active) {
        context.save();
        context.globalAlpha = 0.3 * (Math.sin(now / 150) * 0.5 + 0.5);
        context.fillStyle = 'rgb(255, 255, 100)';
        context.font = `bold ${isLandscape ? 10 : 12}px Courier New`;
        context.textAlign = 'left';
        context.fillText('COMBO!', isLandscape ? 5 : 10, iconY + iconSize + (isLandscape ? 10 : 15));
        context.restore();
    }
}
