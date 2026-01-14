import './index.css';
import { Game } from './Game';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  const game = new Game();
  game.init();
});
