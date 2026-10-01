# Space Hunter 🚀

A retro-futuristic, browser-based spacecraft shooter built with vanilla HTML5 Canvas and JavaScript. Navigate through asteroid fields, collect weapons, and survive progressively challenging waves—all with zero dependencies and neon-soaked arcade aesthetics.

## 🎮 Game Features

- **Fast-Paced Arcade Action:** Classic Asteroids-style gameplay with modern polish
- **Sleek Spacecraft:** Star Wars-inspired racer design with engine glow effects
- **Procedural Graphics:** All visuals generated via Canvas API (no image assets)
- **Cross-Platform:** Seamless desktop (keyboard + mouse) and mobile (virtual joystick) controls
- **Cursor-Based Aiming:** Ship rotates smoothly toward your aim point (separate from movement)
- **Visual "Juice":** Particle explosions, screen shake, motion blur, 3-layer parallax starfield
- **Synthesized Audio:** Web Audio API sound effects + enthusiastic voice encouragement
- **Progressive Difficulty:** Level-based scaling with increasing speed and asteroid count
- **Bonus Wave System:** Clear levels quickly to trigger bonus waves for extra points
- **Weapon Variety:** Single shot, triple spread, and rapid-fire pickups
- **Persistent High Scores:** Top 5 scores saved via localStorage

## 🕹️ Controls

### Desktop
- **Movement:** WASD or Arrow Keys (independent from aiming)
- **Aim:** Mouse cursor (ship rotates smoothly to face cursor)
- **Fire:** Left mouse click (hold for auto-fire) - bullets fire from ship's nose
- **Mute:** Click speaker icon (top-right)
- **Strafing:** You can move in one direction while shooting in another!

### Mobile
- **Movement:** Virtual joystick (bottom-left)
- **Aim:** Ship rotates to face joystick direction
- **Fire:** Fire button (bottom-right)
- **Mute:** Tap speaker icon (top-right)

## 🎨 Visual Style

**Theme:** Retro-Futuristic Neon Arcade

- **Player:** Sleek cyan racer spacecraft with engine glow and cockpit detail
- **Asteroids:** Procedurally generated rocky polygons in orange/brown
- **Explosions:** Orange-yellow particle bursts with fade-out
- **Background:** Deep space (dark blue-black) with parallax starfield
- **UI:** Monospace typography with neon cyan glow effects

All colors use HSL values for dynamic theming. See `gemini.md` for the complete palette.

## 🚀 Deployment (GitHub Pages)

### Quick Deploy:
1. Fork or clone this repository
2. Push to GitHub
3. Go to **Settings** → **Pages**
4. Set source to **main** branch, **/ (root)**
5. Save and wait ~1 minute
6. Access your game at `https://<username>.github.io/spacehunter-static/`

### Local Development:
```bash
# Serve static files (any HTTP server works)
python -m http.server 8000

# Or using Node.js
npx http-server

# Or using PHP
php -S localhost:8000
```

Open `http://localhost:8000` in your browser.

**Note:** Some browsers require user interaction before enabling Web Audio. Click anywhere on the page if audio doesn't play initially.

## 🛠️ Tech Stack

- **HTML5** - Canvas element for rendering
- **CSS3** - Flexbox/Grid for UI layout, neon glow effects
- **Vanilla JavaScript** - ES6 modules, zero dependencies
- **Web Audio API** - Synthesized sound effects
- **Web Speech Synthesis API** - Voice encouragement lines
- **localStorage API** - High score persistence

### Browser Compatibility
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 📁 Project Structure

```
spacehunter-static/
├── index.html              # Entry point
├── gemini.md              # Game state schema and formulas
├── README.md              # This file
├── css/
│   └── style.css          # Vibe-compliant styling
├── js/
│   ├── main.js            # Game loop orchestration
│   └── modules/
│       ├── renderer.js    # Canvas drawing functions
│       ├── physics.js     # Collision detection, movement
│       ├── audio.js       # Sound effects and voice
│       └── input.js       # Keyboard, mouse, touch handling
└── architecture/
    ├── game_loop.md       # Game loop SOP
    ├── input_handling.md  # Input system SOP
    ├── entity_manager.md  # Entity spawn/destroy SOP
    └── physics_sop.md     # Physics formulas SOP
```

## 🎯 Gameplay Tips

1. **Inertia is Real:** Your spacecraft drifts. Plan your movements ahead!
2. **Strafe Like a Pro:** Move in one direction while aiming in another—cursor controls rotation!
3. **Small = Deadly:** Small asteroids are worth more points but harder to hit
4. **Combo Kills:** Destroy asteroids within 2 seconds of each other for a 1.5x score multiplier
5. **Weapon Timing:** Weapons expire after 20 seconds—use them wisely!
6. **Invulnerability:** After taking damage, you have 1 second of invulnerability (red flash)
7. **Speed Kills:** Clear levels in under 90 seconds to trigger bonus waves for extra points!
8. **Health Management:** You only have 50 HP—every hit counts!

## 🏗️ Development Methodology

This game was built using **RSDC v3.1 (Recursive Spec-Driven Coding)**, a 5-stage AI-assisted development pipeline:

1. **Architect** - Defined tech stack and skills
2. **Product Manager** - Created PRD with "Vibe Specification"
3. **Tech Lead** - Converted requirements to Gherkin acceptance tests
4. **Engineering Manager** - Broke down into 88 atomic tasks
5. **Developer** - Implemented with <15 lines per step

All decisions are logged in `artifacts/00_decision_journal.md` for full traceability.

## 📊 Performance Targets

- **Frame Rate:** 60fps sustained (16.67ms per frame)
- **Input Latency:** <50ms from action to visual response
- **Memory Usage:** <100MB heap
- **Load Time:** <2 seconds on 3G connection

## 🐛 Troubleshooting

### No Audio Playing
- **Solution:** Click anywhere on the page first (browsers require user gesture to initialize AudioContext)
- Check mute button isn't active (should be cyan, not red)

### Low Frame Rate
- **Solution:** Close other browser tabs, disable browser extensions
- Verify you're using a supported browser version

### Mobile Controls Not Showing
- **Solution:** Open browser DevTools → Toggle device emulation
- Verify User Agent contains "Android", "iPhone", or "iPad"

### Canvas Not Displaying
- **Solution:** Check browser console for errors
- Verify you're accessing via HTTP/HTTPS (not `file://`)

## 📝 License

MIT License - See LICENSE file for details

## 🙏 Credits

- **Concept:** Inspired by Atari's *Asteroids* (1979)
- **Methodology:** RSDC v3.1 framework
- **Audio:** Web Audio API synthesized sounds
- **Voice:** Browser's native Web Speech Synthesis


---

**Built with 💙 using the RSDC v3.1 Pipeline**  
*\"Let's go!\" - Space Hunter Ship AI*
