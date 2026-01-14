# ☕ Hot Cocoa Tapper

A retro arcade-style bar tending game where you serve hot cocoa to impatient patrons! Built with TypeScript and Vite for the Mocha community.

## 🎮 Game Overview

Hot Cocoa Tapper is a fast-paced arcade game that challenges you to fill and serve mugs of hot cocoa to an endless stream of thirsty patrons. Manage your bartender, control the fill level, and keep the customers happy—or face the consequences!

## ✨ Features

- **Responsive Design**: Plays perfectly on phones, tablets, and desktops
- **Progressive Difficulty**: 4 levels with increasingly challenging patrons
- **Scoring System**:
  - Well-filled mugs (70%+): 71-150 points
  - Mediocre mugs: 10 points
  - Missed mugs: -1 point penalty
- **Health System**: Keep your bar operational by serving patrons quickly
- **Patience Mechanics**: Patrons get impatient over time—serve them before they snap!
- **Smooth Animations**: Walk cycles, breathing, and celebration animations

## 🎯 How to Play

### Controls

- **Arrow Keys** or **W/S** - Move bartender up/down between 4 lanes
- **SPACE (Hold)** - Fill mug with cocoa (hold longer for more cocoa)
- **SPACE (Release)** - Serve the filled mug to waiting patrons

### Gameplay Tips

- 🎯 **Aim for 70%+ fill** - Well-filled mugs earn bonus points and keep patrons happy
- ⏱️ **Watch the timer** - Each level lasts 60 seconds
- 😊 **Serve quickly** - Impatient patrons will lose patience if they wait too long
- ❤️ **Protect your health** - Don't let angry patrons reach the bartender
- 📈 **Reach the score goal** - Complete level requirements to advance

### Scoring Rules

- **Excellent Serve**: 70%+ filled mug = High points + health bonus
- **Acceptable Serve**: Any filled mug = Base points
- **Missed Mug**: Mug falls off bar = -1 point
- **Level Complete**: Reach score goal in 60 seconds to advance

## 🚀 Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

```bash
# Clone or download the project
cd Hot\ Cocoa\ Tapper

# Install dependencies
npm install

# Start development server
npm run dev
```

The game will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

## 🏗️ Project Structure

```text
src/
├── app/
│   ├── Game.ts              # Main game logic and state management
│   ├── GameRenderer.ts      # Canvas rendering engine
│   ├── types.ts             # Game type definitions
│   ├── main.ts              # Application entry point
│   └── index.css            # Tailwind CSS styles
├── shared/
│   └── types.ts             # Shared type definitions
└── worker/
    └── index.js             # Cloudflare Worker (optional)
```

## 🛠️ Technical Stack

- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS (responsive)
- **Rendering**: HTML5 Canvas
- **Deployment**: Cloudflare Workers (via Wrangler)
- **Testing**: Mocha
- **Linting**: ESLint

## 🎨 Game Mechanics

### Difficulty Progression

- **Level 1**: Patrons are calm and don't wait impatiently
- **Level 2+**: Patrons get increasingly impatient faster
- Patron spawn rate increases with each level
- Score requirements increase per level (level × 2000)

### Patron Behavior

- Walk from right side toward bartender
- Turn impatient after waiting threshold
- Flash and shake when losing patience
- Exit happy when served with good fill
- Deal health damage if they reach the bartender

### Visual Feedback

- 🟢 **Green bar**: Patron content and healthy
- 🟡 **Yellow bar**: Patron getting impatient
- 🔴 **Red bar**: Patron very upset

## 📱 Responsive Design

The game automatically scales to fit your screen:

- **Mobile phones**: Compact layout with touch-friendly controls
- **Tablets**: Balanced gameplay and UI
- **Desktop**: Full-featured experience with decorative elements

## 🐛 Known Issues

None currently. Report bugs in our [Discord](https://discord.gg/shDEGBSe2d)!

## 🤝 Contributing

This is a Mocha community project! Want to contribute?

- Fork the repository
- Create a feature branch
- Submit a pull request
- Join us on [Discord](https://discord.gg/shDEGBSe2d) to discuss ideas

## 📄 License

Built with ☕ and ❤️ for the Mocha community.

## 🙏 Credits

Created using [Mocha](https://getmocha.com) - a full-stack JavaScript framework.

---

**Need Help?**

- 📖 Check our [Discord community](https://discord.gg/shDEGBSe2d)
- 🎮 Play and enjoy the game!
- 💡 Share your high scores!
