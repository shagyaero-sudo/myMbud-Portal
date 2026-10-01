// ─── Brick Breaker ───────────────────────────────────────────────────────────
// A classic Breakout/Arkanoid clone built with vanilla HTML Canvas.
// No frameworks, no dependencies.

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ─── DOM refs ────────────────────────────────────────────────────────────────
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const levelEl = document.getElementById('level');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayMsg = document.getElementById('overlay-message');
const overlayBtn = document.getElementById('overlay-btn');

// ─── Constants ──────────────────────────────────────────────────────────────
const W = 780, H = 520;
const PADDLE_W = 110;
const PADDLE_H = 14;
const PADDLE_RADIUS = 7;
const BALL_RADIUS = 8;
const BALL_BASE_SPEED = 5.5;
const BALL_SPEED_INC = 0.6; // per level
const BRICK_ROWS = 8;
const BRICK_COLS = 10;
const BRICK_W = 68;
const BRICK_H = 22;
const BRICK_GAP = 6;
const BRICKS_TOP = 50;
const BRICKS_LEFT = (W - (BRICK_COLS * (BRICK_W + BRICK_GAP) - BRICK_GAP)) / 2;

// Colors per row (gradient from warm to cool)
const ROW_COLORS = [
  '#ff4444', '#ff6644', '#ff8844', '#ffaa44',
  '#44cc88', '#44aaee', '#6688ff', '#9966ff'
];

// ─── Game State ─────────────────────────────────────────────────────────────
let game = {};

function resetGame() {
  game = {
    score: 0,
    lives: 3,
    level: 1,
    running: false,
    ballLaunched: false,
    paddleX: W / 2 - PADDLE_W / 2,
    ballX: W / 2,
    ballY: H - 28 - PADDLE_H - BALL_RADIUS,
    ballDX: BALL_BASE_SPEED * (Math.random() > 0.5 ? 1 : -1),
    ballDY: -BALL_BASE_SPEED,
    bricks: [],
    particles: [],
    combo: 0,
    shakeTimer: 0,
  };
  buildBricks();
  updateUI();
}

function buildBricks() {
  game.bricks = [];
  for (let r = 0; r < BRICK_ROWS; r++) {
    for (let c = 0; c < BRICK_COLS; c++) {
      game.bricks.push({
        x: BRICKS_LEFT + c * (BRICK_W + BRICK_GAP),
        y: BRICKS_TOP + r * (BRICK_H + BRICK_GAP),
        w: BRICK_W,
        h: BRICK_H,
        alive: true,
        color: ROW_COLORS[r % ROW_COLORS.length],
        row: r,
      });
    }
  }
}

// ─── Particles ──────────────────────────────────────────────────────────────
function spawnParticles(x, y, color, count = 20) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * 2 * Math.PI;
    const speed = 1.5 + Math.random() * 4;
    game.particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      decay: 0.015 + Math.random() * 0.025,
      size: 2 + Math.random() * 4,
      color,
    });
  }
}

function updateParticles() {
  for (let i = game.particles.length - 1; i >= 0; i--) {
    const p = game.particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.08; // gravity
    p.life -= p.decay;
    if (p.life <= 0) game.particles.splice(i, 1);
  }
}

// ─── Ball / Collision ───────────────────────────────────────────────────────
function ballPaddleCollision() {
  const px = game.paddleX;
  const bx = game.ballX, by = game.ballY;

  // Check if ball is near paddle vertically
  if (by + BALL_RADIUS > H - 28 - PADDLE_H && by - BALL_RADIUS < H - 28) {
    if (bx + BALL_RADIUS > px && bx - BALL_RADIUS < px + PADDLE_W) {
      // Hit paddle — calculate angle based on where ball hit
      const hitPos = (bx - px) / PADDLE_W; // 0..1
      const angle = (hitPos - 0.5) * Math.PI * 0.65; // -58° to +58°
      const speed = Math.sqrt(game.ballDX ** 2 + game.ballDY ** 2);
      game.ballDX = Math.sin(angle) * speed;
      game.ballDY = -Math.cos(angle) * speed;
      game.ballY = H - 28 - PADDLE_H - BALL_RADIUS;
      spawnParticles(bx, H - 28 - PADDLE_H, '#ffd700', 8);
      return true;
    }
  }
  return false;
}

function ballBrickCollision() {
  let hit = false;
  for (const brick of game.bricks) {
    if (!brick.alive) continue;

    const bx = game.ballX, by = game.ballY;
    const r = BALL_RADIUS;

    // AABB overlap check
    if (bx + r > brick.x && bx - r < brick.x + brick.w &&
        by + r > brick.y && by - r < brick.y + brick.h) {
      brick.alive = false;
      hit = true;
      game.combo++;

      // Score: base + combo bonus
      const points = 10 + Math.min(game.combo - 1, 20) * 2;
      game.score += points;
      updateUI();

      // Particles!
      spawnParticles(brick.x + brick.w / 2, brick.y + brick.h / 2, brick.color, 25);

      // Screen shake
      game.shakeTimer = 6;

      // Determine bounce direction
      const overlapLeft  = (bx + r) - brick.x;
      const overlapRight = (brick.x + brick.w) - (bx - r);
      const overlapTop   = (by + r) - brick.y;
      const overlapBottom= (brick.y + brick.h) - (by - r);

      const minOverlapX = Math.min(overlapLeft, overlapRight);
      const minOverlapY = Math.min(overlapTop, overlapBottom);

      if (minOverlapX < minOverlapY) {
        game.ballDX = -game.ballDX;
      } else {
        game.ballDY = -game.ballDY;
      }
    }
  }
  return hit;
}

// ─── Update ─────────────────────────────────────────────────────────────────
function update() {
  if (!game.running) return;

  // Ball stuck to paddle before launch
  if (!game.ballLaunched) {
    game.ballX = game.paddleX + PADDLE_W / 2;
    game.ballY = H - 28 - PADDLE_H - BALL_RADIUS;
    updateParticles();
    return;
  }

  // Move ball
  game.ballX += game.ballDX;
  game.ballY += game.ballDY;

  // Wall collisions (left / right)
  if (game.ballX - BALL_RADIUS <= 0) { game.ballX = BALL_RADIUS; game.ballDX = -game.ballDX; }
  if (game.ballX + BALL_RADIUS >= W) { game.ballX = W - BALL_RADIUS; game.ballDX = -game.ballDX; }

  // Top wall
  if (game.ballY - BALL_RADIUS <= 0) { game.ballY = BALL_RADIUS; game.ballDY = -game.ballDY; }

  // Paddle collision
  ballPaddleCollision();

  // Brick collisions
  ballBrickCollision();

  // Bottom — lose life
  if (game.ballY + BALL_RADIUS > H) {
    game.lives--;
    game.combo = 0;
    updateUI();
    if (game.lives <= 0) {
      gameOver();
    } else {
      resetBall();
    }
  }

  // Win condition
  if (game.bricks.every(b => !b.alive)) {
    winLevel();
  }

  updateParticles();

  // Shake decay
  if (game.shakeTimer > 0) game.shakeTimer--;
}

function resetBall() {
  game.ballLaunched = false;
  game.ballX = game.paddleX + PADDLE_W / 2;
  game.ballY = H - 28 - PADDLE_H - BALL_RADIUS;
  game.combo = 0;
}

function gameOver() {
  game.running = false;
  overlayTitle.textContent = '💀 Game Over';
  overlayMsg.textContent = `Final score: ${game.score}`;
  overlayBtn.textContent = 'Play Again';
  overlay.classList.remove('hidden');
}

function winLevel() {
  game.running = false;
  game.level++;
  overlayTitle.textContent = '🎉 Level Complete!';
  overlayMsg.textContent = `Score: ${game.score}  ·  Get ready for level ${game.level}`;
  overlayBtn.textContent = 'Next Level';
  overlay.classList.remove('hidden');
}

// ─── Draw ───────────────────────────────────────────────────────────────────
function draw() {
  ctx.save();

  // Screen shake
  if (game.shakeTimer > 0) {
    const intensity = game.shakeTimer * 0.8;
    ctx.translate(
      (Math.random() - 0.5) * intensity,
      (Math.random() - 0.5) * intensity
    );
  }

  // Background
  ctx.fillStyle = '#0a0a16';
  ctx.fillRect(0, 0, W, H);

  // Subtle grid pattern
  ctx.strokeStyle = 'rgba(255,255,255,0.02)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // Draw bricks
  for (const brick of game.bricks) {
    if (!brick.alive) continue;
    const { x, y, w, h, color } = brick;

    // Main brick
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, color);
    grad.addColorStop(1, darkenColor(color, 0.3));
    ctx.fillStyle = grad;
    ctx.beginPath();
    roundRect(ctx, x, y, w, h, 3);
    ctx.fill();

    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    roundRect(ctx, x + 4, y + 3, w - 8, h / 2 - 2, 2);
    ctx.fill();
  }

  // Draw paddle
  const px = game.paddleX;
  const py = H - 28;
  const grad = ctx.createLinearGradient(px, py, px, py + PADDLE_H);
  grad.addColorStop(0, '#ffd700');
  grad.addColorStop(1, '#f7971e');
  ctx.fillStyle = grad;
  ctx.beginPath();
  roundRect(ctx, px, py, PADDLE_W, PADDLE_H, PADDLE_RADIUS);
  ctx.fill();

  // Paddle glow
  ctx.shadowColor = '#ffd700';
  ctx.shadowBlur = 12;
  ctx.fillStyle = 'rgba(255, 215, 0, 0.08)';
  ctx.beginPath();
  roundRect(ctx, px - 8, py - 4, PADDLE_W + 16, PADDLE_H + 8, PADDLE_RADIUS + 4);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Draw ball
  ctx.shadowColor = '#fff';
  ctx.shadowBlur = 16;
  const ballGrad = ctx.createRadialGradient(
    game.ballX - 3, game.ballY - 3, 1,
    game.ballX, game.ballY, BALL_RADIUS
  );
  ballGrad.addColorStop(0, '#ffffff');
  ballGrad.addColorStop(1, '#88ccff');
  ctx.fillStyle = ballGrad;
  ctx.beginPath();
  ctx.arc(game.ballX, game.ballY, BALL_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Ball trail (subtle)
  ctx.fillStyle = 'rgba(136, 204, 255, 0.06)';
  for (let i = 1; i <= 3; i++) {
    ctx.beginPath();
    ctx.arc(
      game.ballX - game.ballDX * i * 1.5,
      game.ballY - game.ballDY * i * 1.5,
      BALL_RADIUS - i, 0, Math.PI * 2
    );
    ctx.fill();
  }

  // Draw particles
  for (const p of game.particles) {
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Combo indicator
  if (game.combo >= 3 && game.running) {
    ctx.fillStyle = 'rgba(255, 215, 0, 0.6)';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`🔥 x${game.combo}`, W / 2, 30);
  }

  // Ready indicator
  if (game.running && !game.ballLaunched) {
    ctx.fillStyle = 'rgba(255, 215, 0, 0.4)';
    ctx.font = '14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    const pulse = Math.sin(Date.now() / 400) * 0.3 + 0.7;
    ctx.globalAlpha = pulse;
    ctx.fillText('🖱️ Click or press Space to launch', W / 2, H - 60);
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function roundRect(ctx, x, y, w, h, r) {
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
}

function darkenColor(hex, amount) {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.max(0, (num >> 16) - Math.round(255 * amount));
  const g = Math.max(0, ((num >> 8) & 0xFF) - Math.round(255 * amount));
  const b = Math.max(0, (num & 0xFF) - Math.round(255 * amount));
  return `rgb(${r},${g},${b})`;
}

function updateUI() {
  scoreEl.textContent = game.score;
  livesEl.textContent = '❤️'.repeat(Math.max(0, game.lives));
  levelEl.textContent = game.level;
}

// ─── Input ──────────────────────────────────────────────────────────────────
let mouseX = W / 2;

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  mouseX = (e.clientX - rect.left) * scaleX;
  game.paddleX = Math.max(0, Math.min(W - PADDLE_W, mouseX - PADDLE_W / 2));
});

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const touch = e.touches[0];
  mouseX = (touch.clientX - rect.left) * scaleX;
  game.paddleX = Math.max(0, Math.min(W - PADDLE_W, mouseX - PADDLE_W / 2));
}, { passive: false });

// Keyboard
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'a') {
    game.paddleX = Math.max(0, game.paddleX - 18);
  } else if (e.key === 'ArrowRight' || e.key === 'd') {
    game.paddleX = Math.min(W - PADDLE_W, game.paddleX + 18);
  } else if ((e.key === ' ' || e.key === 'Space') && game.running && !game.ballLaunched) {
    e.preventDefault();
    launchBall();
  }
});

// Launch ball on click
canvas.addEventListener('mousedown', () => {
  if (game.running && !game.ballLaunched) launchBall();
});
canvas.addEventListener('touchstart', (e) => {
  if (game.running && !game.ballLaunched) launchBall();
});

function launchBall() {
  game.ballLaunched = true;
  const angle = (Math.random() - 0.5) * 0.8;
  const speed = BALL_BASE_SPEED + (game.level - 1) * BALL_SPEED_INC;
  game.ballDX = Math.sin(angle) * speed;
  game.ballDY = -speed;
}

// ─── Game Loop ──────────────────────────────────────────────────────────────
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

// ─── Overlay Controls ───────────────────────────────────────────────────────
overlayBtn.addEventListener('click', () => {
  if (overlayBtn.textContent === 'Next Level') {
    buildBricks();
    resetBall();
    game.running = true;
    overlay.classList.add('hidden');
    updateUI();
  } else {
    resetGame();
    game.running = true;
    overlay.classList.add('hidden');
    updateUI();
  }
});

// ─── Start ──────────────────────────────────────────────────────────────────
resetGame();
loop();
overlay.classList.remove('hidden');
