import './index.css';
import { Game, GameCallbacks } from './Game';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  const game = new Game();
  
  // MONETIZATION SETUP: Configure ad/reward callbacks here
  // Example implementation (replace with your ad network):
  const gameCallbacks: GameCallbacks = {
    onLevelComplete: (level: number, score: number) => {
      console.log(`🎉 Level ${level} completed! Score: ${score}`);
      // TODO: Show ad or achievement notification
      // Example: showInterstitialAd()
    },
    onGameOver: (finalScore: number, level: number) => {
      console.log(`😢 Game Over! Final Score: ${finalScore}, Level: ${level}`);
      // TODO: Show end-game ad or game over screen
      // Example: showRewardedVideo() or showGameOverAd()
    },
    onComboMilestone: (comboCount: number) => {
      console.log(`⚡ Combo Milestone: ${comboCount}x!`);
      // TODO: Trigger special rewards or milestone ads
      // Example: awardRewardedPoints(comboCount * 10)
    },
    onPause: () => {
      console.log('Game paused');
      // TODO: Show pause menu with ad option
    },
    onResumeAfterAd: () => {
      console.log('Resumed after ad');
      // TODO: Give player bonus or continue game
    },
  };
  
  game.setCallbacks(gameCallbacks);
  game.init();
});
