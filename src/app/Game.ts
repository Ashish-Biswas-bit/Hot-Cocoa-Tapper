import { GameState, Patron, Mug } from './types';
import { GameRenderer } from './GameRenderer';

// Ad and monetization hooks - called at key game moments
// Implement these callbacks to integrate your ad network
export interface GameCallbacks {
  onLevelComplete?: (level: number, score: number) => void;
  onGameOver?: (finalScore: number, level: number) => void;
  onComboMilestone?: (comboCount: number) => void;
  onPause?: () => void;
  onResumeAfterAd?: () => void;
}

export class Game {
  private state: GameState;
  private renderer: GameRenderer | null = null;
  private gameLoopId: number | null = null;
  private patronId = 0;
  private mugId = 0;
  private keysHeld = new Set<string>();
  private spawnAcc = 0;
  private prevTime: number | null = null;
  private callbacks: GameCallbacks = {};
  private suppressNextServe = false; // block first space release after starting

  // Responsive Canvas Dimensions
  private CANVAS_WIDTH = 1200;
  private CANVAS_HEIGHT = 900;
  private readonly LANE_HEIGHT = 100;
  private readonly LANE_Y_OFFSET = 50;
  private readonly BARTENDER_X = 100;
  private readonly BASE_PATRON_SPEED = 0.9; // slower patrons for easier catching
  private readonly MUG_SPEED = 3.6; // slightly slower slide to force timing
  private readonly MUG_RETURN_SPEED = 3.4; // quicker returns to test catching
  private readonly BASE_PATRON_WAIT_TIME = 2800; // more patience time
  private readonly DRINKING_TIME = 1000;
  private readonly CATCH_RANGE = 45; // tighter catch window
  private readonly COMBO_TIMEOUT = 5000; // quicker combo drop-off
  private readonly FILL_SPEED = 1.6; // slower fill to require commitment
  private readonly MAX_FILL = 100;
  private readonly MIN_ACCEPTABLE_FILL = 80; // demand better fills for bonus
  private readonly LEVEL_TIME = 60000; // 60 seconds per level

  constructor() {
    this.state = this.getInitialState();
    // Set responsive dimensions
    this.calculateResponsiveDimensions();
    // Update on window resize
    window.addEventListener('resize', () => {
      this.calculateResponsiveDimensions();
    });
  }

  private calculateResponsiveDimensions(): void {
    // Calculate dimensions based on viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Calculate available width accounting for padding (16px on each side)
    const availableWidth = viewportWidth - 32;
    const availableHeight = viewportHeight - 200; // Account for header, footer, controls, scoreboard
    
    const aspectRatio = 4 / 3; // 800x600 aspect ratio
    
    // Calculate max width based on both available space and device type
    let maxWidth: number;
    
    if (viewportWidth < 480) {
      // Small phones: use 90% of available width
      maxWidth = Math.min(availableWidth, viewportWidth * 0.85);
    } else if (viewportWidth < 768) {
      // Phones and small tablets: use 90% of available width, cap at 600px
      maxWidth = Math.min(availableWidth * 0.95, 600);
    } else if (viewportWidth < 1024) {
      // Tablets: use 80% of available width, cap at 700px
      maxWidth = Math.min(availableWidth * 0.8, 700);
    } else {
      // Large screens: use optimal width, cap at 1200px
      maxWidth = Math.min(availableWidth, 1200);
    }
    
    // Also consider height constraints to prevent overflow
    const maxWidthFromHeight = Math.floor(availableHeight * aspectRatio);
    
    // Use the smaller of width-based or height-based constraints
    const constrainedWidth = Math.min(maxWidth, maxWidthFromHeight);
    
    // Set final dimensions with min/max bounds
    this.CANVAS_WIDTH = Math.max(280, Math.min(constrainedWidth, 1200));
    this.CANVAS_HEIGHT = Math.round(this.CANVAS_WIDTH / aspectRatio);
  }

  private getInitialState(): GameState {
    const savedHighScore = localStorage.getItem('hotcocoatapper_highscore');
    return {
      score: 0,
      lives: 3,
      level: 1,
      isPlaying: false,
      gameOver: false,
      patrons: [],
      mugs: [],
      bartenderLane: 1,
      bartenderState: 'IDLE',
      bartenderFacing: 'right',
      isFillingMug: false,
      currentFillLevel: 0,
      health: 100,
      timeLeft: this.LEVEL_TIME,
      levelStartTime: 0,
      combo: 0,
      maxCombo: 0,
      lastServeTime: 0,
      screenShake: 0,
      totalServes: 0,
      perfectServes: 0,
      highScore: savedHighScore ? parseInt(savedHighScore) : 0,
    };
  }

  /**
   * Set up monetization callbacks for ad integration
   * Call this to hook into key game moments for ad placements
   */
  public setCallbacks(callbacks: GameCallbacks): void {
    this.callbacks = callbacks;
  }

  public init(): void {
    // Create game container
    const root = document.getElementById('root');
    if (!root) {
      console.error('Root element not found');
      return;
    }

    root.innerHTML = `
      <div class="flex items-center justify-center w-screen h-screen fixed inset-0">
        <div class="flex flex-col items-center justify-center gap-3 sm:gap-4 md:gap-6 w-full max-w-4xl mx-auto px-8 sm:px-12 md:px-16 py-4 sm:py-6 md:py-8">
          <!-- Game Canvas Section -->
          <div class="relative w-full flex justify-center rounded-xl shadow-2xl" style="padding: 10px 191px;">
          <canvas id="game-canvas" width="${this.CANVAS_WIDTH}" height="${this.CANVAS_HEIGHT}"
                  class="border-4 sm:border-6 md:border-8 border-amber-600 rounded-lg shadow-2xl bg-gradient-to-b from-amber-900 to-amber-950"
                  style="display: block; aspect-ratio: 4/3; max-width: 100%;">
          </canvas>
          
          <!-- Retro-style decorative elements (hidden on mobile) -->
          <div class="hidden sm:block absolute -top-3 sm:-top-4 -left-3 sm:-left-4 w-6 sm:w-8 h-6 sm:h-8 bg-amber-400 rounded-full opacity-70 animate-pulse"></div>
          <div class="hidden sm:block absolute -top-3 sm:-top-4 -right-3 sm:-right-4 w-6 sm:w-8 h-6 sm:h-8 bg-orange-400 rounded-full opacity-70 animate-pulse delay-1000"></div>
          <div class="hidden sm:block absolute -bottom-3 sm:-bottom-4 -left-3 sm:-left-4 w-6 sm:w-8 h-6 sm:h-8 bg-red-400 rounded-full opacity-70 animate-pulse delay-2000"></div>
          <div class="hidden sm:block absolute -bottom-3 sm:-bottom-4 -right-3 sm:-right-4 w-6 sm:w-8 h-6 sm:h-8 bg-amber-400 rounded-full opacity-70 animate-pulse delay-3000"></div>
        </div>

        <!-- Game Info Section -->
        <div class="w-full space-y-2 sm:space-y-3 md:space-y-4 px-2 sm:px-0">
          <!-- Controls Info -->
          <div class="bg-black bg-opacity-70 rounded-lg px-3 sm:px-6 py-2 sm:py-3 border border-amber-600 text-center">
            <p class="text-amber-200 font-mono text-xs sm:text-sm">
              <span class="text-amber-400 font-bold">↑↓/W/S</span> move • 
              <span class="text-amber-400 font-bold">SPACE</span> fill & serve
            </p>
          </div>

          <!-- Scoreboard -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 w-full">
            <div class="bg-gradient-to-br from-amber-900 to-amber-950 rounded-lg px-2 sm:px-4 py-2 sm:py-4 border border-amber-600 text-center shadow-lg">
              <div id="score-display" class="text-xl sm:text-3xl font-bold text-amber-200 font-mono">0</div>
              <div class="text-xs sm:text-sm text-amber-400 font-mono font-bold mt-1">SCORE</div>
            </div>
            <div class="bg-gradient-to-br from-amber-900 to-amber-950 rounded-lg px-2 sm:px-4 py-2 sm:py-4 border border-amber-600 text-center shadow-lg">
              <div id="level-display" class="text-xl sm:text-3xl font-bold text-amber-200 font-mono">1</div>
              <div class="text-xs sm:text-sm text-amber-400 font-mono font-bold mt-1">LEVEL</div>
            </div>
            <div class="bg-gradient-to-br from-amber-900 to-amber-950 rounded-lg px-2 sm:px-4 py-2 sm:py-4 border border-amber-600 text-center shadow-lg">
              <div id="time-display" class="text-xl sm:text-3xl font-bold text-amber-200 font-mono">60</div>
              <div class="text-xs sm:text-sm text-amber-400 font-mono font-bold mt-1">TIME</div>
            </div>
            <div class="bg-gradient-to-br from-amber-900 to-amber-950 rounded-lg px-2 sm:px-4 py-2 sm:py-4 border border-amber-600 text-center shadow-lg">
              <div id="health-display" class="text-xl sm:text-3xl font-bold text-amber-200 font-mono">100%</div>
              <div class="text-xs sm:text-sm text-amber-400 font-mono font-bold mt-1">HEALTH</div>
            </div>
          </div>

          <!-- Instructions -->
          <div class="bg-black bg-opacity-60 rounded-lg px-3 sm:px-6 py-3 sm:py-4 border border-amber-500 text-center">
            <p class="text-amber-200 font-mono text-xs sm:text-sm leading-relaxed">
              Hold SPACE to fill mugs! Release to serve. 70%+ fill = bonus points. Complete 60s levels by reaching score goals. Don't let patrons reach the bartender!
            </p>
          </div>
        </div>
      </div>
    `;

    // Initialize renderer
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    if (!canvas) {
      console.error('Canvas element not found');
      return;
    }

    this.renderer = new GameRenderer(canvas, {
      CANVAS_WIDTH: this.CANVAS_WIDTH,
      CANVAS_HEIGHT: this.CANVAS_HEIGHT,
      LANE_HEIGHT: this.LANE_HEIGHT,
      LANE_Y_OFFSET: this.LANE_Y_OFFSET,
      BARTENDER_X: this.BARTENDER_X,
      MIN_ACCEPTABLE_FILL: this.MIN_ACCEPTABLE_FILL,
      MAX_FILL: this.MAX_FILL,
    });

    // Setup event listeners
    this.setupEventListeners();

    // Start render loop
    this.renderLoop();
  }

  private setupEventListeners(): void {
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    window.addEventListener('keyup', (e) => this.handleKeyUp(e));
  }

  private handleKeyDown(event: KeyboardEvent): void {
    event.preventDefault();
    this.keysHeld.add(event.key);

    if (event.code === 'Space' && !this.state.isPlaying) {
      // Start game but prevent immediate serve from this space press
      this.keysHeld.delete(' ');
      this.keysHeld.delete('Space');
      this.suppressNextServe = true;
      this.startGame();
      return;
    } else if (this.state.isPlaying) {
      if (event.key === 'ArrowUp' || event.key === 'w' || event.key === 'W') {
        this.moveBartender('up');
      } else if (event.key === 'ArrowDown' || event.key === 's' || event.key === 'S') {
        this.moveBartender('down');
      }
    }
  }

  private handleKeyUp(event: KeyboardEvent): void {
    event.preventDefault();
    this.keysHeld.delete(event.key);

    if (event.key === ' ' || event.key === 'Space') {
      if (this.suppressNextServe) {
        this.suppressNextServe = false;
        return;
      }
      if (this.state.isFillingMug) {
        this.serveMug();
      }
    }
  }

  private moveBartender(direction: 'up' | 'down'): void {
    if (!this.state.isPlaying || this.state.bartenderState !== 'IDLE') return;

    let newLane = this.state.bartenderLane;
    if (direction === 'up' && newLane > 0) {
      newLane--;
    } else if (direction === 'down' && newLane < 2) {
      newLane++;
    }

    this.state.bartenderLane = newLane;
    
    // Update bartender facing based on lane activity
    const hasPatronInLane = this.state.patrons.some(p => p.lane === newLane && !p.served);
    this.state.bartenderFacing = hasPatronInLane ? 'right' : 'left';
  }

  private getLaneY(lane: number): number {
    return this.LANE_Y_OFFSET + lane * this.LANE_HEIGHT + this.LANE_HEIGHT / 2;
  }

  private serveMug(): void {
    if (!this.state.isFillingMug || this.state.currentFillLevel === 0) {
      return;
    }

    // Find waiting patron in current lane
    const targetPatron = this.state.patrons.find(
      p => p.lane === this.state.bartenderLane && p.isWaiting && !p.served
    );

    const mug: Mug = {
      id: this.mugId++,
      x: this.BARTENDER_X + 80,
      y: this.getLaneY(this.state.bartenderLane),
      lane: this.state.bartenderLane,
      speed: this.MUG_SPEED + (this.state.level - 1) * 0.2,
      fillLevel: this.state.currentFillLevel,
      state: 'sliding_forward',
      isEmpty: false,
      targetPatronId: targetPatron?.id,
    };

    this.state.mugs.push(mug);
    this.state.isFillingMug = false;
    this.state.currentFillLevel = 0;
    this.state.bartenderState = 'SLIDING_MUG';
    this.state.bartenderFacing = 'right';
    
    // Return to idle after a short delay
    setTimeout(() => {
      if (this.state.bartenderState === 'SLIDING_MUG') {
        this.state.bartenderState = 'IDLE';
      }
    }, 300);
  }

  public startGame(): void {
    const now = Date.now();
    this.state = {
      ...this.getInitialState(),
      isPlaying: true,
      levelStartTime: now,
    };

    this.patronId = 0;
    this.mugId = 0;
    this.prevTime = null;
    this.spawnAcc = 0;

    // Start game loop
    if (this.gameLoopId !== null) {
      cancelAnimationFrame(this.gameLoopId);
    }
    this.gameLoop();
  }

  private gameLoop = (): void => {
    if (!this.state.isPlaying || this.state.gameOver) {
      this.gameLoopId = null;
      return;
    }

    const now = Date.now();
    const timeElapsed = now - this.state.levelStartTime;
    const newTimeLeft = Math.max(0, this.LEVEL_TIME - timeElapsed);

    // Check if level is complete
    if (newTimeLeft <= 0) {
      const requiredScore = this.state.level * 2000;
      if (this.state.score >= requiredScore) {
        // Level completed!
        const completedLevel = this.state.level;
        const scoreBeforeLevelUp = this.state.score;
        
        this.state.level++;
        this.state.timeLeft = this.LEVEL_TIME;
        this.state.levelStartTime = now;
        this.state.score += 1000;
        this.state.health = Math.min(100, this.state.health + 25);
        this.state.patrons = [];
        this.state.mugs = [];
        
        // MONETIZATION HOOK: Level complete - good place for ads or achievements
        if (this.callbacks.onLevelComplete) {
          this.callbacks.onLevelComplete(completedLevel, scoreBeforeLevelUp);
        }
      } else {
        // Game over
        this.state.gameOver = true;
        this.state.isPlaying = false;
        this.state.timeLeft = 0;
        this.updateUI();
        
        // MONETIZATION HOOK: Game over - interstitial ad opportunity
        if (this.callbacks.onGameOver) {
          this.callbacks.onGameOver(this.state.score, this.state.level);
        }
        
        return;
      }
    }

    // Delta time calculation
    const currentTime = performance.now();
    let deltaTime = 0;
    if (this.prevTime === null) {
      this.prevTime = currentTime;
    } else {
      deltaTime = currentTime - this.prevTime;
      this.prevTime = currentTime;
    }

    // Calculate difficulty
    const difficultyMultiplier = 1 + (this.state.level - 1) * 0.5;
    const patronSpeed = this.BASE_PATRON_SPEED * difficultyMultiplier;
    const patronWaitTime = Math.max(300, this.BASE_PATRON_WAIT_TIME / difficultyMultiplier);

    // Spawn patrons
    this.spawnAcc += deltaTime;
    const baseSpawnInterval = Math.max(700, 1600 - (this.state.level - 1) * 150); // slower spawn rate
    const spawnInterval = Math.max(200, baseSpawnInterval / difficultyMultiplier);

    if (this.spawnAcc >= spawnInterval) {
      this.spawnAcc -= spawnInterval;
      // Spawn patrons in all 3 lanes at once, but only if lane is empty
      for (let lane = 0; lane < 3; lane++) {
        // Check if there's already a patron in this lane
        const hasPatronInLane = this.state.patrons.some(p => p.lane === lane && !p.served);
        // Check if a mug is still out (forward, at patron, or sliding back) in this lane
        const mugOutInLane = this.state.mugs.some(m => m.lane === lane && m.state !== 'empty');
        // Only spawn if lane is clear of patron AND mug
        if (!hasPatronInLane && !mugOutInLane) {
          const patron: Patron = {
            id: this.patronId++,
            x: this.CANVAS_WIDTH - 60,
            y: this.getLaneY(lane),
            lane,
            speed: patronSpeed + Math.random() * 0.5,
            served: false,
            waitingTime: 0,
            isWaiting: this.state.level === 1 ? false : true,
            patience: patronWaitTime + Math.random() * 500,
            spriteIndex: Math.floor(Math.random() * 4),
            isDrinking: false,
            drinkingProgress: 0,
            stepTimer: 0,
          };
          this.state.patrons.push(patron);
        }
      }
    }

    // Update patrons
    this.state.patrons = this.state.patrons
      .map(patron => {
        if (patron.isDrinking) {
          // Patron is drinking, update drinking progress
          const newDrinkingProgress = patron.drinkingProgress + deltaTime;
          if (newDrinkingProgress >= this.DRINKING_TIME) {
            return { ...patron, isDrinking: false, drinkingProgress: this.DRINKING_TIME, served: true };
          }
          return { ...patron, drinkingProgress: newDrinkingProgress };
        } else if (patron.served) {
          // Patron leaves more slowly after being served
          return { ...patron, x: patron.x + (3 * deltaTime) / 16 };
        } else if (patron.isWaiting) {
          const newWaitingTime = patron.waitingTime + deltaTime;
          if (newWaitingTime >= patron.patience) {
            // FAILURE: Patron timeout - they lost patience!
            this.state.health = Math.max(0, this.state.health - 30);
            this.state.recentFailure = { type: 'timeout', timestamp: Date.now() };
            this.state.combo = 0; // TIMEOUT - reset combo
            return { ...patron, isWaiting: false, waitingTime: newWaitingTime, served: true };
          }
          return { ...patron, waitingTime: newWaitingTime };
        } else {
          // Step-based movement for walking animation
          const newStepTimer = patron.stepTimer + deltaTime;
          const stepInterval = 200; // take a step every 200ms
          
          if (newStepTimer >= stepInterval) {
            // Take a step forward
            const stepSize = 8; // pixels per step
            return { ...patron, x: patron.x - stepSize, stepTimer: newStepTimer - stepInterval };
          }
          return { ...patron, stepTimer: newStepTimer };
        }
      })
      .filter(patron => {
        if (patron.served) {
          return patron.x < this.CANVAS_WIDTH + 50;
        } else {
          return patron.x > this.BARTENDER_X - 30;
        }
      });

    // Update mugs with new physics
    this.state.mugs = this.state.mugs.map(mug => {
      if (mug.state === 'sliding_forward') {
        return { ...mug, x: mug.x + mug.speed };
      } else if (mug.state === 'at_patron') {
        // Mug is with patron, waiting for drinking to finish
        return mug;
      } else if (mug.state === 'sliding_back') {
        const returnSpeed = this.MUG_RETURN_SPEED * (1 + (this.state.level - 1) * 0.35);
        return { ...mug, x: mug.x - returnSpeed };
      }
      return mug;
    });

    // Check mug-patron collisions and mug catching
    const { newPatrons, newMugs, scoreIncrease, healthIncrease, healthLoss } = this.checkMugCollisions();
    this.state.patrons = newPatrons;
    this.state.mugs = newMugs;
    this.state.score += scoreIncrease;
    this.state.health = Math.min(100, Math.max(0, this.state.health + healthIncrease - healthLoss));
    
    // MONETIZATION HOOK: Combo milestones (5x, 10x, 20x combos)
    // Can trigger special rewards, ads, or celebrations
    const comboMilestones = [5, 10, 20];
    const prevCombo = Math.max(0, this.state.combo - 1);
    for (const milestone of comboMilestones) {
      if (prevCombo < milestone && this.state.combo >= milestone && this.callbacks.onComboMilestone) {
        this.callbacks.onComboMilestone(milestone);
      }
    }

    // Handle patrons reaching bartender
    const patronsAtBartender = this.state.patrons.filter(
      p => !p.served && !p.isDrinking && p.x <= this.BARTENDER_X + 20
    );
    this.state.patrons = this.state.patrons.filter(
      p => p.served || p.isDrinking || p.x > this.BARTENDER_X + 20
    );

    const HEALTH_LOSS_PER_PATRON = 20;
    const patronHealthLoss = patronsAtBartender.length * HEALTH_LOSS_PER_PATRON;
    this.state.health = Math.max(0, this.state.health - patronHealthLoss);

    // Handle mug filling
    if (this.keysHeld.has(' ') || this.keysHeld.has('Space')) {
      this.state.isFillingMug = true;
      this.state.bartenderState = 'FILLING_MUG';
      this.state.bartenderFacing = 'left';
      this.state.currentFillLevel = Math.min(this.MAX_FILL, this.state.currentFillLevel + this.FILL_SPEED);
    } else if (this.state.bartenderState === 'FILLING_MUG' && !this.state.isFillingMug) {
      this.state.bartenderState = 'IDLE';
    }

    // Update time
    this.state.timeLeft = newTimeLeft;

    // Decay screen shake
    if (this.state.screenShake > 0) {
      this.state.screenShake = Math.max(0, this.state.screenShake - 0.5);
    }

    // Update high score
    if (this.state.score > this.state.highScore) {
      this.state.highScore = this.state.score;
      localStorage.setItem('hotcocoatapper_highscore', String(this.state.highScore));
    }

    // Check game over
    if (this.state.health <= 0) {
      this.state.gameOver = true;
      this.state.isPlaying = false;
    }

    // Update UI
    this.updateUI();

    // Continue loop
    if (this.state.isPlaying) {
      this.gameLoopId = requestAnimationFrame(this.gameLoop);
    }
  };

  private checkMugCollisions(): { 
    newPatrons: Patron[], 
    newMugs: Mug[], 
    scoreIncrease: number, 
    healthIncrease: number,
    healthLoss: number 
  } {
    const newPatrons = [...this.state.patrons];
    const newMugs = [...this.state.mugs];
    let scoreIncrease = 0;
    let healthIncrease = 0;
    let healthLoss = 0;

    // Check forward-sliding mugs hitting patrons
    for (let mugIndex = this.state.mugs.length - 1; mugIndex >= 0; mugIndex--) {
      const mug = this.state.mugs[mugIndex];

      if (mug.state === 'sliding_forward') {
        // Check collision with patron
        for (let patronIndex = 0; patronIndex < this.state.patrons.length; patronIndex++) {
          const patron = this.state.patrons[patronIndex];
          if (
            mug.lane === patron.lane &&
            mug.x >= patron.x - 20 &&
            mug.x <= patron.x + 40 &&
            !patron.served &&
            !patron.isDrinking
          ) {
            // Mug hit patron - SUCCESSFUL SERVE
            const now = Date.now();
            const timeSinceLastServe = now - this.state.lastServeTime;
            const isCombo = timeSinceLastServe < this.COMBO_TIMEOUT;
            
            if (isCombo) {
              this.state.combo++;
            } else {
              this.state.combo = 1;
            }
            this.state.lastServeTime = now;
            this.state.maxCombo = Math.max(this.state.maxCombo, this.state.combo);
            
            // Track serves
            this.state.totalServes++;
            if (mug.fillLevel >= this.MIN_ACCEPTABLE_FILL) {
              this.state.perfectServes++;
            }
            
            // Screen shake and combo popup for big combos!
            if (this.state.combo >= 3) {
              this.state.screenShake = Math.min(15, this.state.combo * 2);
              this.state.comboPopup = { value: this.state.combo, timestamp: now };
            }
            
            // Screen shake and combo popup for big combos!
            if (this.state.combo >= 3) {
              this.state.screenShake = Math.min(15, this.state.combo * 2);
              this.state.comboPopup = { value: this.state.combo, timestamp: now };
            }
            
            // Calculate score with combo multiplier
            const comboMultiplier = 1 + (this.state.combo - 1) * 0.15; // softer scaling
            const baseScore = mug.fillLevel >= this.MIN_ACCEPTABLE_FILL 
              ? Math.floor(mug.fillLevel) + 30 
              : 5; // weaker low-fill reward
            const comboBonus = this.state.combo > 1 ? Math.floor(baseScore * (this.state.combo - 1) * 0.3) : 0;
            const totalScore = Math.floor((baseScore + comboBonus) * comboMultiplier);
            scoreIncrease += totalScore;

            // Apply knockback scaled by fill level
            const knockbackDist = 60 + Math.floor(Math.min(40, mug.fillLevel));
            newPatrons[patronIndex] = { 
              ...patron, 
              isDrinking: true, 
              drinkingProgress: 0, 
              x: patron.x + knockbackDist,
              isWaiting: true // Patron now waits in place while drinking
            };
            // Do NOT return mug yet; wait until patron leaves screen
            newMugs[mugIndex] = { ...mug, state: 'at_patron', isEmpty: false, fillLevel: mug.fillLevel, x: patron.x, y: patron.y, targetPatronId: patron.id };
            healthIncrease += 2;

            // Chain push patrons behind in the same lane
            const minSpacing = 48;
            const behind = newPatrons
              .map((p, idx) => ({ p, idx }))
              .filter(({ p, idx }) => idx !== patronIndex && p.lane === patron.lane && !p.served && p.x >= patron.x)
              .sort((a, b) => a.p.x - b.p.x);
            let lastX = newPatrons[patronIndex].x;
            for (const { p, idx } of behind) {
              if (p.x - lastX < minSpacing) {
                const newX = lastX + minSpacing;
                newPatrons[idx] = { ...p, x: newX };
                lastX = newX;
              } else {
                lastX = p.x;
              }
            }
            break;
          }
        }

        // Check if mug fell off the bar
        if (mug.x >= this.CANVAS_WIDTH - 30) {
          newMugs.splice(mugIndex, 1);
          healthLoss += 5;
          this.state.combo = 0; // MISS - reset combo
        }
      } else if (mug.state === 'at_patron') {
        // Make mug follow patron until patron leaves screen
        const patron = newPatrons.find(p => p.id === mug.targetPatronId);
        if (patron && patron.x < this.CANVAS_WIDTH) {
          // Mug follows patron's position
          newMugs[mugIndex] = { ...mug, x: patron.x, y: patron.y };
        } else {
          // Patron has left, send empty mug back
          newMugs[mugIndex] = { 
            ...mug, 
            state: 'sliding_back', 
            isEmpty: true,
            fillLevel: 0 
          };
        }
      } else if (mug.state === 'sliding_back') {
        // Check if player catches the returning mug
        const bartenderY = this.getLaneY(this.state.bartenderLane);
        const mugY = mug.y;
        const inCatchRange = mug.x <= this.BARTENDER_X + this.CATCH_RANGE && 
                            mug.x >= this.BARTENDER_X - 20;
        
        if (inCatchRange && Math.abs(mugY - bartenderY) < 30) {
          // Successfully caught!
          newMugs.splice(mugIndex, 1);
          scoreIncrease += 20;
        } else if (mug.x <= this.BARTENDER_X - 40) {
          // FAILURE: Missed the catch!
          newMugs.splice(mugIndex, 1);
          healthLoss += 15;
          scoreIncrease -= Math.floor(20 * this.state.combo); // Penalty scales with combo
          this.state.recentFailure = { type: 'miss', timestamp: Date.now() };
          this.state.combo = 0; // MISS - reset combo
        }
      }
    }

    return { newPatrons, newMugs, scoreIncrease, healthIncrease, healthLoss };
  }

  private updateUI(): void {
    const scoreDisplay = document.getElementById('score-display');
    const healthDisplay = document.getElementById('health-display');
    const levelDisplay = document.getElementById('level-display');
    const timeDisplay = document.getElementById('time-display');

    if (scoreDisplay) scoreDisplay.textContent = String(this.state.score);
    if (healthDisplay) healthDisplay.textContent = `${Math.floor(this.state.health)}%`;
    if (levelDisplay) levelDisplay.textContent = String(this.state.level);
    if (timeDisplay) timeDisplay.textContent = String(Math.ceil(this.state.timeLeft / 1000));
  }

  private renderLoop = (): void => {
    if (this.renderer) {
      this.renderer.render(this.state);
    }
    requestAnimationFrame(this.renderLoop);
  };
}
