# 🧱 Brick Breaker

A classic Breakout/Arkanoid clone built with vanilla HTML, CSS, and JavaScript — no frameworks, no dependencies. Just open and play!

![Screenshot](https://img.shields.io/badge/status-finished-brightgreen)

## 🎮 Gameplay

Control the paddle at the bottom of the screen to bounce the ball into the brick grid above. Break all the bricks to advance to the next level. Each brick destroyed adds to your score — chain consecutive hits for combo bonuses!

- **Score** increases with each brick destroyed (combo multiplier up to 20x)
- **Lives** (hearts) — lose all 3 and it's game over
- **Levels** — clear all bricks to advance
- **Particles** & **screen shake** add satisfying feedback

## ✨ Features

- Smooth paddle control (mouse or keyboard)
- Physics-based ball bouncing with angle reflection
- 8 rows × 10 columns of colorful gradient bricks
- Particle explosions on brick destruction
- Combo system for consecutive hits
- Screen shake on impact
- Responsive layout (works on mobile)
- Touch support for mobile devices
- Keyboard arrow keys or A/D as fallback

## 🚀 How to Play

### Option 1: Open in browser (recommended)

Simply open `index.html` in any modern web browser.

### Option 2: Serve locally

```bash
python3 -m http.server 8080
# Then open http://localhost:8080
```

### Controls

| Input | Action |
|-------|--------|
| 🖱️ Mouse | Move paddle |
| 🖱️ Click / Space | Launch ball |
| 👆 Touch (mobile) | Drag paddle + tap to launch |
| ⬅️ ➡️ / A D | Keyboard left/right |

## 🛠️ Technologies

- **HTML5 Canvas** — rendering
- **CSS3** — styling, responsive layout, dark theme
- **Vanilla JavaScript** — all game logic, no libraries

## 📁 Structure

```
brick-breaker/
├── index.html    # Entry point
├── style.css     # Visual styling
├── game.js       # Full game engine
├── LICENSE       # MIT license
└── README.md     # This file
```

## 📄 License

MIT
