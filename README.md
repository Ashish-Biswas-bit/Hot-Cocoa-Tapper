# ☕ Hot Cocoa Tapper

## 📦 Dependencies & Configuration
This project uses several tools, libraries, and configuration files. Here is a summary of what is used and where to configure or modify them:

### Main Dependencies

- **TypeScript**: Main language for all source files. Configured via `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, and `tsconfig.worker.json`.
- **Vite**: Build tool and dev server. Configured in `vite.config.ts`.
- **Tailwind CSS**: Utility-first CSS framework for styling. Configured in `tailwind.config.js` and used in `src/app/index.css` and `index.html`.
- **ESLint**: Linting for code quality. Configured in `eslint.config.js`.
- **PostCSS**: CSS processing pipeline. Configured in `postcss.config.js`.
- **Cloudflare Wrangler**: Deployment to Cloudflare Workers. Configured in `wrangler.json`.
- **Mocha**: Testing framework (for unit tests).
- **Hono**: Web framework for serverless functions (used in worker).
- **Zod**: Validation library (used in worker).

### Key Configuration Files

- `vite.config.ts`: Vite build and dev server settings, plugin configuration, and path aliases.
- `tailwind.config.js`: Tailwind CSS settings, content paths, and theme extensions.
- `eslint.config.js`: ESLint rules, plugins, and file ignores for linting TypeScript and React code.
- `postcss.config.js`: PostCSS plugins (Tailwind CSS, Autoprefixer).
- `wrangler.json`: Cloudflare Worker deployment settings, database and bucket bindings.
- `tsconfig*.json`: TypeScript compiler options for app, node, and worker environments.

### Where to Do Things

- **Add/Change Game Logic**: Edit files in `src/app/` (e.g., `Game.ts`, `GameRenderer.ts`).
- **Change UI/Styling**: Edit `src/app/index.css` (for Tailwind), or update classes in `index.html` and React components.
- **Add/Change Worker Logic**: Edit `src/worker/index.ts` (for serverless backend).
- **Update Shared Types**: Edit `src/shared/types.ts`.
- **Configure Build/Dev Server**: Edit `vite.config.ts`.
- **Configure CSS**: Edit `tailwind.config.js` and `postcss.config.js`.
- **Configure Linting**: Edit `eslint.config.js`.
- **Configure Deployment**: Edit `wrangler.json`.
- **Install/Update Packages**: Use `npm install <package>` and update `package.json`.

### Scripts

- `npm run dev`: Start development server (Vite)
- `npm run build`: Build for production
- `npm run lint`: Run ESLint
- `npm run check`: Type-check, build, and dry-run deploy

### How Everything Connects

- The game runs in the browser, rendering to a canvas in `index.html` via logic in `src/app/Game.ts` and `src/app/GameRenderer.ts`.
- Styling is handled by Tailwind CSS classes in HTML and CSS files.
- Cloudflare Worker logic (optional) is in `src/worker/index.ts` and deployed/configured via Wrangler.
- All configuration files are at the project root and control build, lint, style, and deployment behavior.

For any change, locate the relevant file above and edit as needed. For new dependencies, add them to `package.json` and run `npm install`.
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
