import { GameState } from './types';

interface GameConstants {
  CANVAS_WIDTH: number;
  CANVAS_HEIGHT: number;
  LANE_HEIGHT: number;
  LANE_Y_OFFSET: number;
  BARTENDER_X: number;
  MIN_ACCEPTABLE_FILL: number;
  MAX_FILL: number;
}

export class GameRenderer {
  private ctx: CanvasRenderingContext2D;
  private constants: GameConstants;
  private bartenderImg: HTMLImageElement | null = null;
  private backgroundImg: HTMLImageElement | null = null;
  private mugImg: HTMLImageElement | null = null;
  private patronImgs: HTMLImageElement[] = [];
  private animationFrame = 0;

  constructor(canvas: HTMLCanvasElement, constants: GameConstants) {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get 2D context');
    }
    this.ctx = ctx;
    this.constants = constants;
    this.loadImages();
  }

  private loadImages(): void {
    // Load bartender
    this.bartenderImg = new Image();
    this.bartenderImg.src = 'https://0199d9cb-ffe1-73b1-8e8d-3be2409e6e3b.mochausercontent.com/Character_HCT_Tapper_WithMug.png';

    // Load background
    this.backgroundImg = new Image();
    this.backgroundImg.src = 'https://mocha-cdn.com/0199d9cb-ffe1-73b1-8e8d-3be2409e6e3b/HCT_Background.png';

    // Load mug
    this.mugImg = new Image();
    this.mugImg.src = 'https://mocha-cdn.com/0199d9cb-ffe1-73b1-8e8d-3be2409e6e3b/HCT_Mug.png';

    // Load patron images
    const patronUrls = [
      'https://0199d9cb-ffe1-73b1-8e8d-3be2409e6e3b.mochausercontent.com/character_patron_walk_1.png',
      'https://0199d9cb-ffe1-73b1-8e8d-3be2409e6e3b.mochausercontent.com/character_patron_walk_2.png',
      'https://0199d9cb-ffe1-73b1-8e8d-3be2409e6e3b.mochausercontent.com/character_patron_walk_3.png',
      'https://0199d9cb-ffe1-73b1-8e8d-3be2409e6e3b.mochausercontent.com/character_patron_walk_4.png',
    ];

    patronUrls.forEach((url, index) => {
      const img = new Image();
      img.onload = () => {
        this.patronImgs[index] = img;
      };
      img.src = url;
    });
  }

  private getLaneY(lane: number): number {
    return this.constants.LANE_Y_OFFSET + lane * this.constants.LANE_HEIGHT + this.constants.LANE_HEIGHT / 2;
  }

  public render(state: GameState): void {
    this.animationFrame += 1;
    const ctx = this.ctx;
    const { CANVAS_WIDTH, CANVAS_HEIGHT, LANE_Y_OFFSET, LANE_HEIGHT, BARTENDER_X, MIN_ACCEPTABLE_FILL, MAX_FILL } = this.constants;

    // Clear canvas
    ctx.fillStyle = '#2d1810';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw background
    if (this.backgroundImg && this.backgroundImg.complete) {
      ctx.drawImage(this.backgroundImg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else {
      // Fallback background
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(0, LANE_Y_OFFSET - 20, CANVAS_WIDTH, 4 * LANE_HEIGHT + 40);

      for (let i = 0; i < 4; i++) {
        const y = this.getLaneY(i);
        ctx.fillStyle = '#654321';
        ctx.fillRect(BARTENDER_X + 60, y - 15, CANVAS_WIDTH - BARTENDER_X - 60, 30);

        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${i + 1}`, 30, y + 7);
      }
    }

    // Draw bartender
    const bartenderY = this.getLaneY(state.bartenderLane);
    if (this.bartenderImg && this.bartenderImg.complete) {
      const spriteSize = 64;
      ctx.drawImage(
        this.bartenderImg,
        BARTENDER_X - spriteSize / 2,
        bartenderY - spriteSize / 2,
        spriteSize,
        spriteSize
      );
    } else {
      ctx.fillStyle = '#4A90E2';
      ctx.fillRect(BARTENDER_X - 20, bartenderY - 25, 40, 50);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('BARTENDER', BARTENDER_X, bartenderY + 5);
    }

    // Draw patrons
    state.patrons.forEach((patron, index) => {
      const patronImg = this.patronImgs[patron.spriteIndex];

      // Animation calculations
      const time = this.animationFrame;
      const phaseOffset = index * 0.7;

      const walkSpeed = 0.2;
      const walkBobAmount = !patron.isWaiting && !patron.served ? 6 : 0;
      const walkBob = Math.sin(time * walkSpeed + phaseOffset) * walkBobAmount;

      const walkSwayAmount = !patron.isWaiting && !patron.served ? 3 : 0;
      const walkSway = Math.sin(time * walkSpeed * 1.5 + phaseOffset) * walkSwayAmount;

      const idleBobSpeed = 0.12;
      const idleBobAmount = patron.isWaiting ? 3 : 0;
      const idleBob = Math.sin(time * idleBobSpeed + phaseOffset) * idleBobAmount;

      const breathSpeed = 0.06;
      const breathAmount = patron.isWaiting ? 0.08 : 0;
      const breathScale = 1 + Math.sin(time * breathSpeed + phaseOffset) * breathAmount;

      const bobOffset = walkBob + idleBob;

      const pulseSpeed = 0.12;
      const pulseAmount = patron.isWaiting ? 0.08 : 0;
      const pulseScale = 1 + Math.sin(time * pulseSpeed + phaseOffset) * pulseAmount;
      const scaleFactor = breathScale * pulseScale;

      const angerLevel = patron.isWaiting ? patron.waitingTime / patron.patience : 0;
      const shakeIntensity = angerLevel > 0.7 ? (angerLevel - 0.7) / 0.3 : 0;
      const shakeAmount = shakeIntensity * 4;
      const shakeX = Math.sin(time * 0.4 + phaseOffset) * shakeAmount;
      const shakeY = Math.cos(time * 0.35 + phaseOffset) * shakeAmount * 0.5;

      const headBobSpeed = 0.25;
      const headBobAmount = shakeIntensity * 0.15;
      const headBob = Math.sin(time * headBobSpeed + phaseOffset) * headBobAmount;

      const celebrationTime = time * 0.2 + phaseOffset;
      const celebrationBounce = patron.served ? Math.abs(Math.sin(celebrationTime)) * 12 : 0;
      const celebrationSpin = patron.served ? Math.sin(celebrationTime * 2) * 0.2 : 0;

      const squashAmount = 0;
      const squash = 1 + Math.sin(time * walkSpeed * 2 + phaseOffset) * squashAmount;
      const stretch = 1 / squash;

      const walkTilt = !patron.isWaiting && !patron.served ? Math.sin(time * walkSpeed + phaseOffset) * 0.12 : 0;

      if (patronImg && patronImg.complete && this.patronImgs.length > 0) {
        const imgWidth = patronImg.width;
        const imgHeight = patronImg.height;
        const aspectRatio = imgWidth / imgHeight;

        const baseHeight = 48;
        const baseWidth = baseHeight * aspectRatio;

        const animatedSizeW = baseWidth * scaleFactor * squash;
        const animatedSizeH = baseHeight * scaleFactor * stretch;
        const animatedY = patron.y + bobOffset - celebrationBounce + shakeY;
        const animatedX = patron.x + shakeX + walkSway;

        ctx.save();
        ctx.translate(animatedX, animatedY);

        if (!patron.isWaiting && !patron.served) {
          ctx.rotate(walkTilt);
        }

        if (patron.isWaiting && angerLevel > 0.7) {
          ctx.rotate(headBob);
        }

        if (patron.served) {
          ctx.rotate(celebrationSpin);
        }

        const edgeCrop = 2;
        const srcX = edgeCrop;
        const srcY = edgeCrop;
        const srcWidth = imgWidth - edgeCrop * 2;
        const srcHeight = imgHeight - edgeCrop * 2;

        ctx.drawImage(
          patronImg,
          srcX,
          srcY,
          srcWidth,
          srcHeight,
          -animatedSizeW / 2,
          -animatedSizeH / 2,
          animatedSizeW,
          animatedSizeH
        );

        ctx.restore();

        // Draw patience indicator
        if (patron.isWaiting) {
          const patienceRatio = patron.waitingTime / patron.patience;
          const barWidth = 40;
          const barHeight = 6;
          const animatedY = patron.y + bobOffset - celebrationBounce;

          ctx.fillStyle = '#333';
          ctx.fillRect(patron.x - barWidth / 2, animatedY - 35, barWidth, barHeight);

          const barColor = patienceRatio > 0.7 ? '#FF4444' : patienceRatio > 0.4 ? '#FFAA00' : '#44FF44';
          ctx.fillStyle = barColor;

          if (patienceRatio > 0.7) {
            const pulse = Math.sin(time * 0.2) * 0.1 + 0.9;
            ctx.globalAlpha = pulse;
          }

          ctx.fillRect(patron.x - barWidth / 2, animatedY - 35, barWidth * patienceRatio, barHeight);
          ctx.globalAlpha = 1.0;
        }
      } else {
        // Fallback patron rendering
        const animatedY = patron.y + bobOffset - celebrationBounce + shakeY;
        const animatedX = patron.x + shakeX + walkSway;
        const sizeW = 30 * scaleFactor * squash;
        const sizeH = 40 * scaleFactor * stretch;

        if (patron.served) {
          ctx.save();
          ctx.translate(animatedX, animatedY);
          ctx.rotate(celebrationSpin);

          ctx.fillStyle = '#32CD32';
          ctx.fillRect(-sizeW / 2, -sizeH / 2, sizeW, sizeH);

          ctx.fillStyle = '#FFFFFF';
          ctx.font = '14px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('😊', 0, 5);

          ctx.restore();
        } else {
          ctx.save();
          ctx.translate(animatedX, animatedY);

          if (!patron.isWaiting && !patron.served) {
            ctx.rotate(walkTilt);
          }

          if (patron.isWaiting && angerLevel > 0.7) {
            ctx.rotate(headBob);
          }

          ctx.fillStyle = patron.isWaiting ? '#4A90E2' : '#FF6B6B';
          ctx.fillRect(-sizeW / 2, -sizeH / 2, sizeW, sizeH);

          ctx.fillStyle = '#FFFFFF';
          ctx.font = '14px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(patron.isWaiting ? '😐' : '😡', 0, 5);

          ctx.restore();

          if (patron.isWaiting) {
            const patienceRatio = patron.waitingTime / patron.patience;
            const barWidth = 40;
            const barHeight = 6;

            ctx.fillStyle = '#333';
            ctx.fillRect(patron.x - barWidth / 2, animatedY - 35, barWidth, barHeight);

            const barColor = patienceRatio > 0.7 ? '#FF4444' : patienceRatio > 0.4 ? '#FFAA00' : '#44FF44';
            ctx.fillStyle = barColor;

            if (patienceRatio > 0.7) {
              const pulse = Math.sin(time * 0.2) * 0.1 + 0.9;
              ctx.globalAlpha = pulse;
            }

            ctx.fillRect(patron.x - barWidth / 2, animatedY - 35, barWidth * patienceRatio, barHeight);
            ctx.globalAlpha = 1.0;
          }
        }
      }
    });

    // Draw mugs
    state.mugs.forEach(mug => {
      if (this.mugImg && this.mugImg.complete) {
        const mugSize = 32;
        ctx.drawImage(this.mugImg, mug.x - mugSize / 2, mug.y - mugSize / 2, mugSize, mugSize);

        const fillRatio = mug.fillLevel / 100;
        ctx.fillStyle = fillRatio >= 0.7 ? '#44FF44' : fillRatio >= 0.4 ? '#FFAA00' : '#FF4444';
        ctx.fillRect(mug.x - 12, mug.y + 10, 24 * fillRatio, 4);
      } else {
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(mug.x - 10, mug.y - 15, 20, 25);

        const fillRatio = mug.fillLevel / 100;
        ctx.fillStyle = '#F5DEB3';
        ctx.fillRect(mug.x - 8, mug.y - 13 + (1 - fillRatio) * 15, 16, 8 * fillRatio);

        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(mug.x + 12, mug.y - 5, 6, 0, Math.PI);
        ctx.stroke();
      }
    });

    // Draw mug fill bar
    if (state.isFillingMug) {
      const barX = BARTENDER_X - 50;
      const barY = this.getLaneY(state.bartenderLane) - 50;
      const barWidth = 100;
      const barHeight = 20;

      ctx.fillStyle = '#333';
      ctx.fillRect(barX, barY, barWidth, barHeight);

      const fillRatio = state.currentFillLevel / MAX_FILL;
      ctx.fillStyle = fillRatio >= MIN_ACCEPTABLE_FILL / MAX_FILL ? '#44FF44' : '#FF4444';
      ctx.fillRect(barX, barY, barWidth * fillRatio, barHeight);

      ctx.strokeStyle = '#FFF';
      ctx.lineWidth = 2;
      ctx.strokeRect(barX, barY, barWidth, barHeight);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('FILLING...', barX + barWidth / 2, barY - 5);
    }

    // Draw UI
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${state.score}`, 20, 40);

    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`LEVEL: ${state.level}`, CANVAS_WIDTH - 20, 40);

    const timeInSeconds = Math.ceil(state.timeLeft / 1000);
    ctx.fillStyle = timeInSeconds <= 10 ? '#FF4444' : '#FFFFFF';
    ctx.fillText(`TIME: ${timeInSeconds}s`, CANVAS_WIDTH - 20, 65);

    const requiredScore = state.level * 1000;
    const scoreProgress = state.score >= requiredScore ? '✓' : `${requiredScore - state.score} needed`;
    ctx.fillStyle = state.score >= requiredScore ? '#44FF44' : '#FF4444';
    ctx.font = 'bold 16px monospace';
    ctx.fillText(`TO ADVANCE: ${scoreProgress}`, CANVAS_WIDTH - 20, 90);

    // Health bar
    const healthBarWidth = 200;
    const healthBarHeight = 20;
    const healthRatio = state.health / 100;

    ctx.fillStyle = '#333';
    ctx.fillRect(20, 50, healthBarWidth, healthBarHeight);

    ctx.fillStyle = healthRatio > 0.6 ? '#44FF44' : healthRatio > 0.3 ? '#FFAA00' : '#FF4444';
    ctx.fillRect(20, 50, healthBarWidth * healthRatio, healthBarHeight);

    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 50, healthBarWidth, healthBarHeight);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`HEALTH: ${Math.floor(state.health)}%`, 20, 90);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`PATRONS: ${state.patrons.length}`, 20, 110);

    // Game over overlay
    if (state.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.fillStyle = '#FF4444';
      ctx.font = 'bold 48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 24px monospace';
      ctx.fillText(`Final Score: ${state.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);

      const requiredScore = state.level * 1000;
      if (state.health <= 0) {
        ctx.fillStyle = '#FF6666';
        ctx.font = 'bold 20px monospace';
        ctx.fillText('Health depleted!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
      } else if (state.score < requiredScore) {
        ctx.fillStyle = '#FF6666';
        ctx.font = 'bold 20px monospace';
        ctx.fillText(`Score too low! Needed ${requiredScore}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 18px monospace';
      ctx.fillText('Press SPACE to play again', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
    } else if (!state.isPlaying && state.health > 0) {
      // Start screen
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('HOT COCOA TAPPER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 100);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 18px monospace';
      ctx.fillText('Hold SPACE to fill mugs, release to serve', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 70);
      ctx.fillText('Well-filled mugs earn more points!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 45);
      ctx.fillText('Mugs break if they fall off the bar', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
      ctx.fillText('Use ↑↓ or W/S to move bartender', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 5);
      ctx.fillText('Meet score requirements to advance levels!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
      ctx.fillText('Press SPACE to start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 65);
    }
  }
}
