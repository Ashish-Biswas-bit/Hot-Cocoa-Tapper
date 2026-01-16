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

    // Apply screen shake for excitement!
    if (state.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * state.screenShake;
      const shakeY = (Math.random() - 0.5) * state.screenShake;
      ctx.save();
      ctx.translate(shakeX, shakeY);
    }

    // Clear canvas
    ctx.fillStyle = '#2d1810';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw background
    if (this.backgroundImg && this.backgroundImg.complete) {
      ctx.drawImage(this.backgroundImg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else {
      // Fallback background with enhanced countertop lanes
      // Dark background
      ctx.fillStyle = '#2d1810';
      ctx.fillRect(0, 0, CANVAS_WIDTH, LANE_Y_OFFSET - 20);
      ctx.fillStyle = '#1a0f0a';
      ctx.fillRect(0, LANE_Y_OFFSET + 4 * LANE_HEIGHT + 20, CANVAS_WIDTH, CANVAS_HEIGHT - (LANE_Y_OFFSET + 4 * LANE_HEIGHT + 20));

      // Draw countertop with enhanced depth
      for (let i = 0; i < 4; i++) {
        const y = this.getLaneY(i);
        const laneWidth = CANVAS_WIDTH - BARTENDER_X - 60;
        
        // Shadow/depth layer at bottom
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(BARTENDER_X + 60, y + 16, laneWidth, 4);
        
        // Main countertop surface with gradient
        const gradient = ctx.createLinearGradient(BARTENDER_X + 60, y - 15, BARTENDER_X + 60, y + 15);
        gradient.addColorStop(0, '#7a5230');
        gradient.addColorStop(0.5, '#654321');
        gradient.addColorStop(1, '#5a3a20');
        ctx.fillStyle = gradient;
        ctx.fillRect(BARTENDER_X + 60, y - 15, laneWidth, 30);
        
        // Front edge highlight
        ctx.fillStyle = '#9a7f5a';
        ctx.fillRect(BARTENDER_X + 60, y - 16, laneWidth, 2);
        
        // Back edge darker
        ctx.fillStyle = '#4a2f1a';
        ctx.fillRect(BARTENDER_X + 60, y + 13, laneWidth, 3);
        
        // Wood grain texture (subtle)
        ctx.strokeStyle = 'rgba(90, 60, 40, 0.4)';
        ctx.lineWidth = 1;
        for (let x = BARTENDER_X + 100; x < CANVAS_WIDTH - 20; x += 50) {
          ctx.beginPath();
          ctx.moveTo(x, y - 12);
          ctx.quadraticCurveTo(x + 15, y, x + 30, y + 12);
          ctx.stroke();
        }

        // Lane divider line (subtle shadow between lanes)
        if (i < 3) {
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(BARTENDER_X + 60, y + 20);
          ctx.lineTo(CANVAS_WIDTH, y + 20);
          ctx.stroke();
        }

        // Lane number with background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(15, y - 18, 30, 30);
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 18px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${i + 1}`, 30, y + 5);
      }
    }

    // Draw bartender with rotation animation
    const bartenderY = this.getLaneY(state.bartenderLane);
    if (this.bartenderImg && this.bartenderImg.complete) {
      const spriteSize = 64;
      
      ctx.save();
      ctx.translate(BARTENDER_X, bartenderY);
      
      // Rotation based on bartender state and facing
      let rotation = 0;
      if (state.bartenderState === 'FILLING_MUG') {
        // Lean forward slightly when filling
        rotation = 0.08;
      } else if (state.bartenderState === 'SLIDING_MUG') {
        // Serve throwing motion
        rotation = Math.sin(this.animationFrame * 0.5) * 0.15;
      }
      
      // Apply rotation
      ctx.rotate(rotation);
      
      // Flip sprite based on facing direction
      if (state.bartenderFacing === 'right') {
        ctx.scale(-1, 1);
      }
      
      // Add state-based vertical animation
      let offsetY = 0;
      let offsetX = 0;
      if (state.bartenderState === 'FILLING_MUG') {
        // Bobbing while filling
        offsetY = Math.sin(this.animationFrame * 0.3) * 3;
      } else if (state.bartenderState === 'SLIDING_MUG') {
        // Lean into throw
        offsetX = Math.sin(this.animationFrame * 0.5) * 4;
      }
      
      ctx.drawImage(
        this.bartenderImg,
        -spriteSize / 2 + offsetX,
        -spriteSize / 2 + offsetY,
        spriteSize,
        spriteSize
      );
      
      ctx.restore();
      
      // Draw action indicator with movement
      if (state.bartenderState !== 'IDLE') {
        const indicatorOffset = Math.sin(this.animationFrame * 0.2) * 3;
        ctx.fillStyle = state.bartenderState === 'FILLING_MUG' ? '#FFD700' : '#44FF44';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        const stateText = state.bartenderState === 'FILLING_MUG' ? '⤵ FILL' : '⤴ SERVE';
        ctx.fillText(stateText, BARTENDER_X, bartenderY - 45 + indicatorOffset);
      }
    } else {
      // Fallback bartender
      ctx.fillStyle = '#4A90E2';
      ctx.fillRect(BARTENDER_X - 20, bartenderY - 25, 40, 50);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('BARTENDER', BARTENDER_X, bartenderY + 5);
      
      // Direction arrow
      ctx.fillStyle = '#FFD700';
      const arrowX = state.bartenderFacing === 'right' ? BARTENDER_X + 25 : BARTENDER_X - 25;
      ctx.fillText(state.bartenderFacing === 'right' ? '→' : '←', arrowX, bartenderY);
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
      const shakeAmount = shakeIntensity * 6;
      const shakeX = Math.sin(time * 0.6 + phaseOffset) * shakeAmount;
      const shakeY = Math.cos(time * 0.55 + phaseOffset) * shakeAmount * 0.5;

      const headBobSpeed = 0.25;
      const headBobAmount = shakeIntensity * 0.15;
      const headBob = Math.sin(time * headBobSpeed + phaseOffset) * headBobAmount;

      // Drinking animation
      const drinkingTilt = patron.isDrinking ? Math.sin(patron.drinkingProgress / 100) * 0.3 : 0;
      const drinkingBob = patron.isDrinking ? Math.sin(patron.drinkingProgress / 80) * 5 : 0;

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

        if (!patron.isWaiting && !patron.served && !patron.isDrinking) {
          ctx.rotate(walkTilt);
        }

        if (patron.isWaiting && angerLevel > 0.7) {
          ctx.rotate(headBob);
        }
        
        if (patron.isDrinking) {
          ctx.rotate(drinkingTilt);
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

          const barColor = patienceRatio > 0.7 ? '#FF2222' : patienceRatio > 0.4 ? '#FFAA00' : '#44FF44';
          ctx.fillStyle = barColor;

          if (patienceRatio > 0.7) {
            const pulse = Math.sin(time * 0.3) * 0.2 + 0.8;
            ctx.globalAlpha = pulse;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#FF0000';
          }

          ctx.fillRect(patron.x - barWidth / 2, animatedY - 35, barWidth * patienceRatio, barHeight);
          ctx.globalAlpha = 1.0;
          ctx.shadowBlur = 0;
        }
      } else {
        // Fallback patron rendering
        const animatedY = patron.y + bobOffset - celebrationBounce + shakeY + drinkingBob;
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

          if (!patron.isWaiting && !patron.served && !patron.isDrinking) {
            ctx.rotate(walkTilt);
          }

          if (patron.isWaiting && angerLevel > 0.7) {
            ctx.rotate(headBob);
          }
          
          if (patron.isDrinking) {
            ctx.rotate(drinkingTilt);
          }

          ctx.fillStyle = patron.isDrinking ? '#32CD32' : (patron.isWaiting ? '#4A90E2' : '#FF6B6B');
          ctx.fillRect(-sizeW / 2, -sizeH / 2, sizeW, sizeH);

          ctx.fillStyle = '#FFFFFF';
          ctx.font = '14px monospace';
          ctx.textAlign = 'center';
          const emoji = patron.isDrinking ? '🍺' : (patron.isWaiting ? '😐' : '😡');
          ctx.fillText(emoji, 0, 5);

          ctx.restore();

          if (patron.isWaiting) {
            const patienceRatio = patron.waitingTime / patron.patience;
            const barWidth = 40;
            const barHeight = 6;

            ctx.fillStyle = '#333';
            ctx.fillRect(patron.x - barWidth / 2, animatedY - 35, barWidth, barHeight);

            const barColor = patienceRatio > 0.7 ? '#FF2222' : patienceRatio > 0.4 ? '#FFAA00' : '#44FF44';
            ctx.fillStyle = barColor;

            if (patienceRatio > 0.7) {
              const pulse = Math.sin(time * 0.3) * 0.2 + 0.8;
              ctx.globalAlpha = pulse;
              ctx.shadowBlur = 10;
              ctx.shadowColor = '#FF0000';
            }

            ctx.fillRect(patron.x - barWidth / 2, animatedY - 35, barWidth * patienceRatio, barHeight);
            ctx.globalAlpha = 1.0;
            ctx.shadowBlur = 0;
          }
        }
      }
    });

    // Draw mugs with state visualization
    state.mugs.forEach(mug => {
      // Shadow effect
      const shadowOffsetY = 18;
      const shadowAlpha = mug.state === 'at_patron' ? 0.1 : (mug.state === 'sliding_forward' || mug.state === 'sliding_back' ? 0.3 : 0.2);
      
      // Draw shadow
      ctx.save();
      ctx.globalAlpha = shadowAlpha;
      ctx.fillStyle = '#000000';
      const shadowWidth = mug.state === 'sliding_forward' || mug.state === 'sliding_back' ? 20 : 18;
      const shadowHeight = 4;
      // Perspective shadow (slightly stretched when sliding)
      const shadowX = mug.x + (mug.state === 'sliding_forward' ? 2 : (mug.state === 'sliding_back' ? -2 : 0));
      ctx.beginPath();
      ctx.ellipse(shadowX, mug.y + shadowOffsetY, shadowWidth / 2, shadowHeight, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      
      // Add glow effect for sliding mugs
      if (mug.state === 'sliding_forward' || mug.state === 'sliding_back') {
        ctx.save();
        ctx.shadowBlur = 8;
        ctx.shadowColor = mug.state === 'sliding_forward' ? 'rgba(255, 215, 0, 0.4)' : 'rgba(255, 107, 107, 0.4)';
      }
      
      if (this.mugImg && this.mugImg.complete) {
        const mugSize = 32;
        
        // Add bobbing/sliding motion effect
        let wobble = 0;
        let tilt = 0;
        if (mug.state === 'sliding_forward') {
          wobble = Math.sin(this.animationFrame * 0.3 + mug.id * 0.5) * 2;
          tilt = Math.sin(this.animationFrame * 0.25 + mug.id * 0.3) * 0.05;
        } else if (mug.state === 'sliding_back') {
          wobble = Math.sin(this.animationFrame * 0.35 + mug.id * 0.5) * 2.5;
          tilt = Math.sin(this.animationFrame * 0.3 + mug.id * 0.3) * -0.08;
        }
        
        // Gray out empty mugs
        if (mug.isEmpty) {
          ctx.globalAlpha = 0.6;
          ctx.filter = 'grayscale(100%)';
        }
        
        ctx.save();
        ctx.translate(mug.x, mug.y + wobble);
        ctx.rotate(tilt);
        ctx.drawImage(this.mugImg, -mugSize / 2, -mugSize / 2, mugSize, mugSize);
        ctx.restore();
        
        ctx.globalAlpha = 1.0;
        ctx.filter = 'none';

        // Fill level indicator (only for non-empty mugs)
        if (!mug.isEmpty && mug.fillLevel > 0) {
          const fillRatio = mug.fillLevel / 100;
          ctx.fillStyle = fillRatio >= 0.7 ? '#44FF44' : fillRatio >= 0.4 ? '#FFAA00' : '#FF4444';
          ctx.fillRect(mug.x - 12, mug.y + 10, 24 * fillRatio, 4);
        }
        
        // State indicator
        if (mug.state === 'sliding_back') {
          ctx.fillStyle = '#FF6B6B';
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('CATCH!', mug.x, mug.y - 22);
        }
      } else {
        // Fallback mug rendering with tilt
        let wobble = 0;
        let tilt = 0;
        if (mug.state === 'sliding_forward') {
          wobble = Math.sin(this.animationFrame * 0.3 + mug.id * 0.5) * 2;
          tilt = Math.sin(this.animationFrame * 0.25 + mug.id * 0.3) * 0.05;
        } else if (mug.state === 'sliding_back') {
          wobble = Math.sin(this.animationFrame * 0.35 + mug.id * 0.5) * 2.5;
          tilt = Math.sin(this.animationFrame * 0.3 + mug.id * 0.3) * -0.08;
        }
        
        ctx.fillStyle = mug.isEmpty ? '#666666' : '#8B4513';
        ctx.save();
        ctx.translate(mug.x, mug.y + wobble);
        ctx.rotate(tilt);
        ctx.fillRect(-10, -15, 20, 25);
        ctx.restore();

        if (!mug.isEmpty && mug.fillLevel > 0) {
          const fillRatio = mug.fillLevel / 100;
          ctx.fillStyle = '#F5DEB3';
          ctx.fillRect(mug.x - 8, mug.y - 13 + (1 - fillRatio) * 15, 16, 8 * fillRatio);
        }

        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(mug.x + 12, mug.y - 5, 6, 0, Math.PI);
        ctx.stroke();
      }
      
      if (mug.state === 'sliding_forward' || mug.state === 'sliding_back') {
        ctx.restore();
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

    // Draw recent failure notifications
    if (state.recentFailure) {
      const timeSinceFailure = Date.now() - state.recentFailure.timestamp;
      if (timeSinceFailure < 2000) {
        const opacity = 1 - (timeSinceFailure / 2000);
        ctx.save();
        ctx.globalAlpha = opacity;

        const failureY = CANVAS_HEIGHT / 2;
        const failureColor = state.recentFailure.type === 'miss' ? '#FF4444' : '#FF6666';
        const failureText = state.recentFailure.type === 'miss' ? '✗ MISSED CATCH!' : '✗ PATRON TIMEOUT!';

        // Draw failure message with outline
        ctx.fillStyle = failureColor;
        ctx.font = 'bold 36px monospace';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.fillText(failureText, CANVAS_WIDTH / 2, failureY);

        ctx.restore();
      }
    }

    // Draw UI

    // Serial vertical left-side UI block only
    // TIME at top right, aligned with HIGH SCORE
    const timeInSeconds = Math.ceil(state.timeLeft / 1000);
    ctx.textAlign = 'center';
    ctx.font = 'bold 20px monospace';
    ctx.fillStyle = '#FFD700';
    ctx.fillText('TIME', CANVAS_WIDTH / 2, 22);
    ctx.font = 'bold 22px monospace';
    ctx.fillStyle = timeInSeconds <= 10 ? '#FF4444' : '#44FF44';
    ctx.fillText(`${timeInSeconds}s`, CANVAS_WIDTH / 2, 42);
    ctx.textAlign = 'left';
    // SCORE at top left
    // HIGH SCORE at top left, above SCORE
    ctx.textAlign = 'left';
    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = '#FFD700';
    ctx.fillText('HIGH SCORE', 20, 22);
    ctx.font = 'bold 22px monospace';
    ctx.fillStyle = '#FFF8DC';
    ctx.fillText(`${state.highScore}`, 20, 42);
    // SCORE below high score
    ctx.font = 'bold 20px monospace';
    ctx.fillStyle = '#FFD700';
    ctx.fillText('SCORE', 20, 68);
    ctx.font = 'bold 26px monospace';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`${state.score}`, 20, 100);
    // HEALTH
    // Health bar at bottom center
    const healthBarWidth = 220;
    const healthBarHeight = 20;
    const healthRatio = state.health / 100;
    const healthBarX = (CANVAS_WIDTH - healthBarWidth) / 2;
    // Lower the health bar by moving it closer to the bottom
    const loweredHealthBarY = CANVAS_HEIGHT - 28;
    ctx.fillStyle = '#333';
    ctx.fillRect(healthBarX, loweredHealthBarY, healthBarWidth, healthBarHeight);
    ctx.fillStyle = healthRatio > 0.6 ? '#44FF44' : healthRatio > 0.3 ? '#FFAA00' : '#FF4444';
    ctx.fillRect(healthBarX, loweredHealthBarY, healthBarWidth * healthRatio, healthBarHeight);
    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(healthBarX, loweredHealthBarY, healthBarWidth, healthBarHeight);
    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.floor(state.health)}%`, CANVAS_WIDTH / 2, loweredHealthBarY + healthBarHeight - 4);
    ctx.textAlign = 'left';

    // Big combo popup!
    if (state.comboPopup && Date.now() - state.comboPopup.timestamp < 2000) {
      const age = Date.now() - state.comboPopup.timestamp;
      const scale = Math.min(1, age / 200);
      const alpha = Math.max(0, 1 - (age / 2000));
      const yOffset = -age / 20;
      
      ctx.save();
      ctx.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3 + yOffset);
      ctx.scale(scale, scale);
      ctx.globalAlpha = alpha;
      
      // Glow effect
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 30;
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 64px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${state.comboPopup.value}X COMBO!`, 0, 0);
      
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    // Critical health warning flash
    if (state.health > 0 && state.health < 30) {
      const flashAlpha = Math.sin(this.animationFrame * 0.15) * 0.3 + 0.2;
      ctx.fillStyle = `rgba(255, 0, 0, ${flashAlpha})`;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    // Restore from screen shake
    if (state.screenShake > 0) {
      ctx.restore();
    }

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
