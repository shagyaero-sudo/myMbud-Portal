// Main Game Loop - Space Hunter

import { initRenderer, clearCanvas, generateStars, renderStarfield, updateStarfield, 
         generateAsteroidVertices, renderAsteroid, renderPlayer, renderBullet, 
         renderParticle, renderWeapon, renderHealthPickup, updateHUD, renderPowerupIcons } from './modules/renderer.js';
import { updatePlayer, updateAsteroids, updateBullets, updateParticles, 
         checkCollision, splitAsteroid, createParticles } from './modules/physics.js';
import { initInput, isMobileDevice, getInput } from './modules/input.js';
import { initAudio, playShootSound, playExplosionSound, playAsteroidHit, playSpacecraftImpact, playLevelUpSound, playVoice, startEngineHum, stopEngineHum, updateEngineHum } from './modules/audio.js';

// Initialize canvas
const canvas = document.getElementById('gameCanvas');
const ctx = initRenderer(canvas);

// Initialize input
const input = initInput(canvas, togglePause);

// Initialize audio
initAudio();

// Migration: Move legacy voidHunter data to spaceHunter
(function migrateLegacyData() {
    const legacyScores = localStorage.getItem('voidHunterHighScores');
    if (legacyScores && !localStorage.getItem('spaceHunterHighScores')) {
        localStorage.setItem('spaceHunterHighScores', legacyScores);
        localStorage.removeItem('voidHunterHighScores');
    }
    const legacyMute = localStorage.getItem('voidHunterMuted');
    if (legacyMute && !localStorage.getItem('spaceHunterMuted')) {
        localStorage.setItem('spaceHunterMuted', legacyMute);
        localStorage.removeItem('voidHunterMuted');
    }
})();

// Create particle pool
const particlePool = [];
for (let i = 0; i < 300; i++) {
    particlePool.push({
        x: 0, y: 0, vx: 0, vy: 0, alpha: 0, color: '', lifetime: 0, active: false
    });
}

// Initialize starfield
const stars = [
    ...generateStars(50, 1),
    ...generateStars(100, 2),
    ...generateStars(150, 3)
];

// Difficulty Settings
const DIFFICULTY_SETTINGS = [
    { label: 'EASY', health: 40, speed: 0.4, interval: 80, color: 'hsl(120, 100%, 50%)', desc: 'Relaxed space exploration with extra durability.', healFactor: 0.8 },
    { label: 'NORMAL', health: 25, speed: 0.5, interval: 100, color: 'hsl(200, 100%, 50%)', desc: 'The intended Space Hunter experience.', healFactor: 0.6 },
    { label: 'HARD', health: 15, speed: 0.6, interval: 120, color: 'hsl(40, 100%, 50%)', desc: 'Aggressive asteroids and fragile systems.', healFactor: 0.4 },
    { label: 'EXPERT', health: 10, speed: 0.7, interval: 150, color: 'hsl(0, 100%, 50%)', desc: 'One mistake is usually your last.', healFactor: 0.2 }
];

// Game State
const GameState = {
    player: {
        x: 400,
        y: 300,
        vx: 0,
        vy: 0,
        rotation: 0,
        health: 25,
        maxHealth: 25, // Added for dynamic scaling
        powerups: {
            tripleShot: { active: false, expiryTime: 0 },
            rapidFire: { active: false, expiryTime: 0 }
        },
        invulnerable: false,
        invulnerableTimer: 0,
        radius: 15
    },
    asteroids: [],
    bullets: [],
    particles: particlePool,
    weapons: [],
    stars: stars,
    score: 0,
    level: 1,
    gameState: 'menu', // Start in menu
    currentDifficultyIndex: 1, // Track selected difficulty
    speedMultiplier: 0.5,
    lastKillTime: 0,
    comboActive: false,
    isLevelingUp: false,
    levelStartTime: Date.now(),
    bonusWavesSpawned: 0,
    bonusMessage: { active: false, text: '', alpha: 1.0 },
    screenShake: {
        active: false,
        amplitude: 0,
        frameCount: 0,
        offsetX: 0,
        offsetY: 0
    },
    lastShootTime: 0,
    shootInterval: 100,
    nextWeaponSpawn: 0,
    healthPickups: [],
    nextHealthSpawn: 0,
    // Material definitions (Session 4 - Updated: Harder materials)
    materials: [
        { name: 'Rock',     hpMult: 1,  speedMult: 1.0, damageMult: 1.0, soundFreq: 800,  color: 'hsl(30, 50%, 40%)' },
        { name: 'Iron',     hpMult: 3,  speedMult: 0.8, damageMult: 1.5, soundFreq: 1200, color: 'hsl(0, 10%, 50%)' },
        { name: 'Steel',    hpMult: 5,  speedMult: 0.6, damageMult: 2.0, soundFreq: 1800, color: 'hsl(200, 20%, 60%)' },
        { name: 'Titanium', hpMult: 8,  speedMult: 0.5, damageMult: 2.5, soundFreq: 2400, color: 'hsl(40, 30%, 70%)' },
        { name: 'Tungsten', hpMult: 12, speedMult: 0.4, damageMult: 3.0, soundFreq: 3200, color: 'hsl(0, 0%, 30%)' }
    ]
};

// Menu Initialization
const difficultySlider = document.getElementById('difficultySlider');
const difficultyLabel = document.getElementById('difficultyLabel');
const difficultyDesc = document.getElementById('difficultyDesc');
const menuScreen = document.getElementById('menuScreen');
const startBtn = document.getElementById('startBtn');

// Load saved difficulty
const savedDifficulty = localStorage.getItem('spaceHunterDifficulty');
if (savedDifficulty !== null) {
    difficultySlider.value = savedDifficulty;
    updateDifficultyUI(savedDifficulty);
}

difficultySlider.addEventListener('input', (e) => {
    updateDifficultyUI(e.target.value);
    localStorage.setItem('spaceHunterDifficulty', e.target.value);
});

function updateDifficultyUI(index) {
    const settings = DIFFICULTY_SETTINGS[index];
    difficultyLabel.textContent = settings.label;
    difficultyLabel.style.color = settings.color;
    difficultyDesc.textContent = settings.desc;
}

function requestFullscreen() {
    try {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
        }
    } catch (err) {
        console.warn('Fullscreen request failed:', err);
    }
}

const pauseScreen = document.getElementById('pauseScreen');
const resumeBtn = document.getElementById('resumeBtn');
const quitBtn = document.getElementById('quitBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');

function toggleFullscreen() {
    if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
        requestFullscreen();
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }
}

fullscreenBtn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    toggleFullscreen();
});

// Update fullscreen button icon based on state
document.addEventListener('fullscreenchange', updateFullscreenIcon);
document.addEventListener('webkitfullscreenchange', updateFullscreenIcon);
document.addEventListener('mozfullscreenchange', updateFullscreenIcon);
document.addEventListener('MSFullscreenChange', updateFullscreenIcon);

function updateFullscreenIcon() {
    const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
    // ⛶ (Fullscreen) vs ⧉ (Windowed) or similar
    fullscreenBtn.textContent = isFullscreen ? '🗗' : '⛶';
}

function togglePause() {
    if (GameState.gameState === 'playing') {
        GameState.gameState = 'paused';
        pauseScreen.classList.remove('hidden');
    } else if (GameState.gameState === 'paused') {
        GameState.gameState = 'playing';
        pauseScreen.classList.add('hidden');
        requestFullscreen(); // Ensure we stay in fullscreen
    }
}

resumeBtn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    togglePause();
});

quitBtn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    pauseScreen.classList.add('hidden');
    menuScreen.classList.remove('hidden');
    GameState.gameState = 'menu';
    stopEngineHum(); // Stop hum on quit
});

startBtn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    requestFullscreen();
    
    const index = difficultySlider.value;
    const settings = DIFFICULTY_SETTINGS[index];
    
    // Apply difficulty settings
    GameState.currentDifficultyIndex = index;
    GameState.player.health = settings.health;
    GameState.player.maxHealth = settings.health;
    GameState.speedMultiplier = settings.speed;
    GameState.shootInterval = settings.interval;
    
    // Reset game state
    GameState.score = 0;
    GameState.level = 1;
    GameState.asteroids = [];
    GameState.bullets = [];
    GameState.weapons = [];
    GameState.healthPickups = [];
    GameState.player.x = 400;
    GameState.player.y = 300;
    GameState.player.vx = 0;
    GameState.player.vy = 0;
    GameState.nextWeaponSpawn = Date.now() + 15000;
    GameState.nextHealthSpawn = Date.now() + 30000;
    GameState.gameState = 'playing';
    
    startEngineHum(); // Start hum on mission start

    menuScreen.classList.add('hidden');
    spawnWave();
});

// Game Loop
let lastTime = 0;
let frameCount = 0;

function gameLoop(currentTime) {
    const deltaTime = Math.min(currentTime - lastTime, 33);
    lastTime = currentTime;
    
    if (GameState.gameState === 'menu') {
        clearCanvas(ctx, canvas.width, canvas.height);
        renderStarfield(ctx, GameState.stars, GameState.speedMultiplier);
        requestAnimationFrame(gameLoop);
        return;
    }
    
    if (GameState.gameState === 'paused') {
        // Render current state without updating
        renderFrame();
        requestAnimationFrame(gameLoop);
        return;
    }
    
    frameCount++;
    
    if (GameState.gameState === 'playing') {
        // Update
        updatePlayer(GameState.player, input, canvas.width, canvas.height);
        
        // Update engine hum based on speed
        const speed = Math.sqrt(GameState.player.vx**2 + GameState.player.vy**2);
        updateEngineHum(speed);

        spawnThrustParticles(); 
        updateAsteroids(GameState.asteroids, GameState.speedMultiplier, canvas.width, canvas.height);
        updateBullets(GameState.bullets, canvas.width, canvas.height);
        updateParticles(GameState.particles);
        updateStarfield(GameState.stars, GameState.speedMultiplier, canvas.height);
        updateWeapons();
        updateShooting(currentTime);
        checkCollisions();
        checkLevelComplete();
        updateScreenShake();
        updateBonusMessage();
        
        // Draw
        renderFrame();
    }
    
    requestAnimationFrame(gameLoop);
}

function renderFrame() {
    ctx.save();
    
    if (GameState.screenShake.active) {
        ctx.translate(GameState.screenShake.offsetX, GameState.screenShake.offsetY);
    }
    
    clearCanvas(ctx, canvas.width, canvas.height);
    renderStarfield(ctx, GameState.stars, GameState.speedMultiplier);
    
    for (let asteroid of GameState.asteroids) {
        renderAsteroid(ctx, asteroid);
    }
    
    for (let bullet of GameState.bullets) {
        renderBullet(ctx, bullet);
    }
    
    for (let weapon of GameState.weapons) {
        renderWeapon(ctx, weapon);
    }
    
    for (let healthPickup of GameState.healthPickups) {
        renderHealthPickup(ctx, healthPickup);
    }
    
    renderPlayer(ctx, GameState.player);
    
    for (let particle of GameState.particles) {
        if (particle.active) {
            renderParticle(ctx, particle);
        }
    }
    
    ctx.restore();
    
    updateHUD(GameState);
    renderPowerupIcons(ctx, GameState.player);
    
    if (GameState.bonusMessage.active) {
        renderBonusMessage(ctx);
    }
}

function spawnThrustParticles() {
    // Only spawn thrust when player is actively moving
    const isThrusting = input.up || input.down || input.left || input.right || 
                        input.joystickX !== 0 || input.joystickY !== 0;
    
    if (!isThrusting) return;
    
    const player = GameState.player;
    
    // Spawn 2-3 particles per frame from engine exhaust
    const particleCount = 2 + Math.floor(Math.random() * 2);
    
    for (let i = 0; i < particleCount; i++) {
        // Find inactive particle
        let particle = null;
        for (let p of GameState.particles) {
            if (!p.active) {
                particle = p;
                break;
            }
        }
        
        if (!particle) continue;
        
        // Position: Rear of ship (13-14px behind center)
        const exhaustOffset = 13 + Math.random() * 2;
        const exhaustX = player.x + Math.cos(player.rotation + Math.PI / 2) * exhaustOffset;
        const exhaustY = player.y + Math.sin(player.rotation + Math.PI / 2) * exhaustOffset;
        
        // Add some spread to exhaust
        const spread = (Math.random() - 0.5) * 4;
        
        // Velocity: Opposite to ship's facing direction + spread
        const thrustSpeed = 1 + Math.random() * 2;
        const angle = player.rotation + Math.PI / 2 + spread * 0.1;
        
        // Randomly choose flame (orange/yellow) or gas (blue-white) particles
        const isFlame = Math.random() > 0.3;
        const colors = isFlame 
            ? ['hsl(30, 100%, 60%)', 'hsl(50, 100%, 50%)', 'hsl(40, 100%, 55%)']  // Orange/yellow flames
            : ['hsl(200, 80%, 80%)', 'hsl(180, 60%, 70%)'];  // Blue-white gas
        
        particle.x = exhaustX;
        particle.y = exhaustY;
        particle.vx = Math.cos(angle) * thrustSpeed;
        particle.vy = Math.sin(angle) * thrustSpeed;
        particle.alpha = 0.8;
        particle.color = colors[Math.floor(Math.random() * colors.length)];
        particle.lifetime = 10 + Math.floor(Math.random() * 10); // 10-20 frames (0.16-0.33s)
        particle.active = true;
    }
}

function spawnWave() {
    const count = Math.min(3 + GameState.level, 12);
    
    for (let i = 0; i < count; i++) {
        let x, y;
        let attempts = 0;
        
        do {
            const edge = Math.floor(Math.random() * 4);
            if (edge === 0) { x = Math.random() * canvas.width; y = 0; }
            else if (edge === 1) { x = canvas.width; y = Math.random() * canvas.height; }
            else if (edge === 2) { x = Math.random() * canvas.width; y = canvas.height; }
            else { x = 0; y = Math.random() * canvas.height; }
            
            attempts++;
        } while (!isSafeSpawn(x, y) && attempts < 20);
        
        // Each asteroid gets random material tier (Session 4: Mixed materials)
        const materialTier = getRandomMaterialTier(GameState.level);
        const material = GameState.materials[materialTier];
        
        const angle = Math.random() * Math.PI * 2;
        const baseSpeed = 0.5 + Math.random() * 1;
        const speed = baseSpeed * material.speedMult; // Apply material speed modifier
        
        const baseHP = 1; // Large asteroid base HP
        const baseDamage = 2; // Large asteroid base damage
        
        GameState.asteroids.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: 0.01 + Math.random() * 0.02,
            size: 'large',
            radius: 50,
            vertices: generateAsteroidVertices(50),
            damage: baseDamage * material.damageMult, // Apply material damage modifier
            hp: baseHP * material.hpMult, // Apply material HP modifier
            maxHp: baseHP * material.hpMult, // For visual damage indication
            materialTier: materialTier,
            color: material.color
        });
    }
}

function isSafeSpawn(x, y) {
    const dx = x - GameState.player.x;
    const dy = y - GameState.player.y;
    return Math.sqrt(dx * dx + dy * dy) > 200;
}

function getRandomMaterialTier(level) {
    const maxTier = Math.min(Math.floor(level / 5), 4);
    
    if (maxTier === 0) return 0; // Levels 1-4: Only Rock
    
    // Build weighted distribution
    // Newest material: 25% (moderate rarity)
    // Older materials: Split remaining 75% equally
    const tiers = [];
    const weights = [];
    
    for (let tier = 0; tier <= maxTier; tier++) {
        tiers.push(tier);
        if (tier === maxTier) {
            weights.push(0.25); // Newest material gets 25%
        } else {
            weights.push(0.75 / maxTier); // Older materials split 75%
        }
    }
    
    // Weighted random selection
    const random = Math.random();
    let cumulative = 0;
    for (let i = 0; i < weights.length; i++) {
        cumulative += weights[i];
        if (random < cumulative) {
            return tiers[i];
        }
    }
    
    return 0; // Fallback to Rock
}

function updateShooting(currentTime) {
    if (!input.shooting) return;
    
    const player = GameState.player;
    const isRapid = player.powerups.rapidFire.active;
    
    // Rapid fire doubles fire rate (100ms → 50ms)
    const interval = isRapid ? 50 : 100;
    
    if (currentTime - GameState.lastShootTime > interval) {
        shootBullet();
        GameState.lastShootTime = currentTime;
    }
}

function shootBullet() {
    const player = GameState.player;
    const isTriple = player.powerups.tripleShot.active;
    
    const targetX = isMobileDevice() ? player.x + Math.cos(player.rotation - Math.PI / 2) * 100 : input.mouseX;
    const targetY = isMobileDevice() ? player.y + Math.sin(player.rotation - Math.PI / 2) * 100 : input.mouseY;
    
    if (isTriple) {
        // Fire 3 bullets in spread pattern
        const angles = [-15, 0, 15];
        for (let angleOffset of angles) {
            spawnBullet(targetX, targetY, angleOffset * Math.PI / 180);
        }
    } else {
        spawnBullet(targetX, targetY, 0);
    }
    
    playShootSound();
}

function spawnBullet(targetX, targetY, angleOffset) {
    // Calculate bullet spawn position at ship's nose (18px forward)
    const noseOffsetX = Math.cos(GameState.player.rotation - Math.PI / 2) * 18;
    const noseOffsetY = Math.sin(GameState.player.rotation - Math.PI / 2) * 18;
    
    const spawnX = GameState.player.x + noseOffsetX;
    const spawnY = GameState.player.y + noseOffsetY;
    
    // Calculate bullet direction (toward target or forward if mobile)
    const dx = targetX - GameState.player.x;
    const dy = targetY - GameState.player.y;
    const angle = Math.atan2(dy, dx) + angleOffset;
    const speed = 10;
    
    GameState.bullets.push({
        x: spawnX,
        y: spawnY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        damage: 1,
        distanceTraveled: 0,
        radius: 3
    });
}

function checkCollisions() {
    // Player vs Asteroids
    if (!GameState.player.invulnerable) {
        for (let asteroid of GameState.asteroids) {
            if (checkCollision(GameState.player, asteroid)) {
                GameState.player.health -= asteroid.damage;
                GameState.player.invulnerable = true;
                GameState.player.invulnerableTimer = 60;
                triggerScreenShake();
                createParticles(asteroid.x, asteroid.y, 10, GameState.particles);
                playSpacecraftImpact(asteroid.materialTier || 0); // Bass-heavy impact sound
                
                if (GameState.player.health <= 0) {
                    gameOver();
                }
            }
        }
    }
    
    // Bullets vs Asteroids
    for (let i = GameState.bullets.length - 1; i >= 0; i--) {
        const bullet = GameState.bullets[i];
        let hit = false;
        
        for (let j = GameState.asteroids.length - 1; j >= 0; j--) {
            const asteroid = GameState.asteroids[j];
            
            if (checkCollision(bullet, asteroid)) {
                hit = true;
                
                // Damage asteroid (Session 4: HP system)
                asteroid.hp -= bullet.damage || 1;
                
                // Play material-specific hit sound
                playAsteroidHit(asteroid.materialTier || 0);
                
                // If asteroid still has HP, just hit effect
                if (asteroid.hp > 0) {
                    createParticles(asteroid.x, asteroid.y, 5, GameState.particles);
                    break; // Bullet consumed, but asteroid survives
                }
                
                // Asteroid destroyed - award points
                const points = asteroid.size === 'large' ? 20 : (asteroid.size === 'medium' ? 50 : 100);
                addScore(points);
                
                // Create explosion particles
                const particleCount = asteroid.size === 'large' ? 25 : (asteroid.size === 'medium' ? 20 : 15);
                createParticles(asteroid.x, asteroid.y, particleCount, GameState.particles);
                
                // Split or destroy
                const children = splitAsteroid(asteroid, generateAsteroidVertices);
                GameState.asteroids.splice(j, 1);
                GameState.asteroids.push(...children);
                
                if (children.length === 0) {
                    playVoice('ohyes');
                }
                
                break;
            }
        }
        
        if (hit) {
            GameState.bullets.splice(i, 1);
        }
    }
    
    // Player vs Weapons
    for (let i = GameState.weapons.length - 1; i >= 0; i--) {
        const weapon = GameState.weapons[i];
        
        if (checkCollision(GameState.player, weapon)) {
            // Activate the appropriate powerup
            const powerupName = weapon.type === 'triple' ? 'tripleShot' : 'rapidFire';
            GameState.player.powerups[powerupName].active = true;
            GameState.player.powerups[powerupName].expiryTime = Date.now() + 20000;
            
            GameState.weapons.splice(i, 1);
            playVoice('excellent');
        }
    }
    
    // Player vs Health Pickups
    for (let i = GameState.healthPickups.length - 1; i >= 0; i--) {
        const healthPickup = GameState.healthPickups[i];
        
        if (checkCollision(GameState.player, healthPickup)) {
            const settings = DIFFICULTY_SETTINGS[GameState.currentDifficultyIndex];
            const missingHealth = GameState.player.maxHealth - GameState.player.health;
            
            if (missingHealth > 0.1) {
                // Heal a percentage of missing health based on difficulty
                const healAmount = Math.max(1, Math.floor(missingHealth * settings.healFactor));
                GameState.player.health += healAmount;
                
                // Never fill completely - stay at least 0.1 below max
                if (GameState.player.health >= GameState.player.maxHealth) {
                    GameState.player.health = GameState.player.maxHealth - 0.1;
                }
                
                GameState.healthPickups.splice(i, 1);
                playVoice('good');
                
                // Show healing message
                showBonusMessage(`+${healAmount} HP`);
            }
        }
    }
}

function addScore(points) {
    const now = Date.now();
    
    if (now - GameState.lastKillTime < 2000) {
        points = Math.floor(points * 1.5);
        GameState.comboActive = true;
    } else {
        GameState.comboActive = false;
    }
    
    GameState.score += points;
    GameState.lastKillTime = now;
}

function checkLevelComplete() {
    if (GameState.asteroids.length === 0 && !GameState.isLevelingUp) {
        const levelDuration = Date.now() - GameState.levelStartTime;
        const MIN_LEVEL_TIME = 90000; // 90 seconds
        
        if (levelDuration < MIN_LEVEL_TIME && GameState.bonusWavesSpawned < 2) {
            // Spawn bonus wave
            GameState.bonusWavesSpawned++;
            spawnBonusWave(4);
            showBonusMessage("BONUS WAVE!");
            playLevelUpSound();
        } else {
            // Level complete - advance
            advanceLevel();
        }
    }
}

function advanceLevel() {
    GameState.isLevelingUp = true;
    GameState.level++;
    GameState.speedMultiplier = 0.5 + (GameState.level * 0.05);
    GameState.levelStartTime = Date.now();
    GameState.bonusWavesSpawned = 0;
    
    playLevelUpSound();
    playVoice('levelUp');
    
    setTimeout(() => {
        spawnWave();
        GameState.isLevelingUp = false;
    }, 5000);
}

function spawnBonusWave(count) {
    for (let i = 0; i < count; i++) {
        let x, y;
        let attempts = 0;
        
        do {
            const edge = Math.floor(Math.random() * 4);
            if (edge === 0) { x = Math.random() * canvas.width; y = 0; }
            else if (edge === 1) { x = canvas.width; y = Math.random() * canvas.height; }
            else if (edge === 2) { x = Math.random() * canvas.width; y = canvas.height; }
            else { x = 0; y = Math.random() * canvas.height; }
            
            attempts++;
        } while (!isSafeSpawn(x, y) && attempts < 20);
        
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.5 + Math.random() * 1;
        
        GameState.asteroids.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: 0.01 + Math.random() * 0.02,
            size: 'large',
            radius: 50,
            vertices: generateAsteroidVertices(50),
            damage: 2
        });
    }
}

function showBonusMessage(text) {
    GameState.bonusMessage.active = true;
    GameState.bonusMessage.text = text;
    GameState.bonusMessage.alpha = 1.0;
    
    setTimeout(() => {
        GameState.bonusMessage.active = false;
    }, 2000);
}

function updateWeapons() {
    // Check powerup expiry
    const now = Date.now();
    const powerups = GameState.player.powerups;
    
    if (powerups.tripleShot.active && now > powerups.tripleShot.expiryTime) {
        powerups.tripleShot.active = false;
    }
    if (powerups.rapidFire.active && now > powerups.rapidFire.expiryTime) {
        powerups.rapidFire.active = false;
    }
    
    // Remove expired weapon pickups
    for (let i = GameState.weapons.length - 1; i >= 0; i--) {
        if (Date.now() > GameState.weapons[i].expiryTime) {
            GameState.weapons.splice(i, 1);
        }
    }
    
    // Spawn new weapon pickup
    if (GameState.weapons.length === 0 && Date.now() > GameState.nextWeaponSpawn) {
        spawnWeapon();
        GameState.nextWeaponSpawn = Date.now() + 15000;
    }
    
    // Remove expired health pickups
    for (let i = GameState.healthPickups.length - 1; i >= 0; i--) {
        if (Date.now() > GameState.healthPickups[i].expiryTime) {
            GameState.healthPickups.splice(i, 1);
        }
    }
    
    // Spawn new health pickup
    if (Date.now() > GameState.nextHealthSpawn) {
        spawnHealthPickup();
    }
}

function spawnWeapon() {
    const margin = 100;
    const x = margin + Math.random() * (canvas.width - margin * 2);
    const y = margin + Math.random() * (canvas.height - margin * 2);
    const types = ['triple', 'rapid'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    GameState.weapons.push({
        x: x,
        y: y,
        type: type,
        expiryTime: Date.now() + 10000,
        radius: 20
    });
}

function spawnHealthPickup() {
    const margin = 100;
    const x = margin + Math.random() * (canvas.width - margin * 2);
    const y = margin + Math.random() * (canvas.height - margin * 2);
    
    GameState.healthPickups.push({
        x: x,
        y: y,
        expiryTime: Date.now() + 15000, // Despawn after 15 seconds
        radius: 15,
        pulsePhase: Math.random() * Math.PI * 2 // Random start phase for pulse animation
    });
    
    // Schedule next health pickup spawn (30-40 seconds)
    GameState.nextHealthSpawn = Date.now() + 30000 + Math.random() * 10000;
}

function triggerScreenShake() {
    GameState.screenShake.active = true;
    GameState.screenShake.amplitude = 5;
    GameState.screenShake.frameCount = 0;
}

function updateScreenShake() {
    if (!GameState.screenShake.active) return;
    
    GameState.screenShake.frameCount++;
    const amplitude = 5 * Math.pow(0.9, GameState.screenShake.frameCount);
    
    if (amplitude < 0.5 || GameState.screenShake.frameCount > 12) {
        GameState.screenShake.active = false;
        GameState.screenShake.offsetX = 0;
        GameState.screenShake.offsetY = 0;
    } else {
        GameState.screenShake.offsetX = (Math.random() - 0.5) * amplitude * 2;
        GameState.screenShake.offsetY = (Math.random() - 0.5) * amplitude * 2;
    }
}

function gameOver() {
    GameState.gameState = 'gameover';
    playVoice('gameOver');
    stopEngineHum(); // Stop hum on game over
    
    // Check if high score
    const highScores = JSON.parse(localStorage.getItem('spaceHunterHighScores') || '[]');
    const isHighScore = GameState.score > 0 && (highScores.length < 5 || GameState.score > highScores[highScores.length - 1].score);
    
    showGameOverScreen(isHighScore);
}

function saveHighScore(initials) {
    let highScores = JSON.parse(localStorage.getItem('spaceHunterHighScores') || '[]');
    highScores.push({ initials: initials, score: GameState.score, date: new Date().toLocaleDateString() });
    highScores.sort((a, b) => b.score - a.score);
    highScores = highScores.slice(0, 5);
    localStorage.setItem('spaceHunterHighScores', JSON.stringify(highScores));
}

function showGameOverScreen(isHighScore) {
    const gameOverScreen = document.getElementById('gameOverScreen');
    const finalScore = document.getElementById('finalScore');
    const initialsContainer = document.getElementById('initialsContainer');
    
    finalScore.textContent = GameState.score;
    
    if (isHighScore) {
        initialsContainer.classList.remove('hidden');
        const input = document.getElementById('playerInitials');
        input.value = '';
        setTimeout(() => input.focus(), 100);
    } else {
        initialsContainer.classList.add('hidden');
    }
    
    renderHighScores();
    gameOverScreen.classList.remove('hidden');
}

function renderHighScores() {
    const highScoresDiv = document.getElementById('highScores');
    const highScores = JSON.parse(localStorage.getItem('spaceHunterHighScores') || '[]');
    let html = '<h2>High Scores</h2><ol>';
    for (let entry of highScores) {
        html += `<li><span style="color:hsl(200, 100%, 50%)">${entry.initials || 'ACE'}</span> - ${entry.score}</li>`;
    }
    html += '</ol>';
    highScoresDiv.innerHTML = html;
}

document.getElementById('saveScoreBtn').addEventListener('pointerdown', (e) => {
    e.preventDefault();
    const input = document.getElementById('playerInitials');
    const initials = input.value.toUpperCase() || 'ACE';
    saveHighScore(initials);
    document.getElementById('initialsContainer').classList.add('hidden');
    renderHighScores();
});

function updateBonusMessage() {
    if (GameState.bonusMessage.active) {
        GameState.bonusMessage.alpha -= 0.01;
        if (GameState.bonusMessage.alpha <= 0) {
            GameState.bonusMessage.active = false;
        }
    }
}

function renderBonusMessage(ctx) {
    ctx.save();
    ctx.globalAlpha = GameState.bonusMessage.alpha;
    ctx.fillStyle = 'hsl(200, 100%, 50%)';
    ctx.shadowBlur = 20;
    ctx.shadowColor = 'hsl(200, 100%, 50%)';
    ctx.font = 'bold 48px Courier New';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(GameState.bonusMessage.text, canvas.width / 2, canvas.height / 2);
    ctx.restore();
}

// Restart button
document.getElementById('restartBtn').addEventListener('pointerdown', (e) => {
    e.preventDefault();
    document.getElementById('gameOverScreen').classList.add('hidden');
    document.getElementById('menuScreen').classList.remove('hidden');
    GameState.gameState = 'menu';
});

// Start game loop
requestAnimationFrame(gameLoop);

console.log('Space Hunter - Game Started');
console.log('Platform:', isMobileDevice() ? 'Mobile' : 'Desktop');
