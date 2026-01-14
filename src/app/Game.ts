import { GameState, Patron, Mug } from './types';
import { GameRenderer } from './GameRenderer';

export class Game {
  private state: GameState;
  private renderer: GameRenderer | null = null;
  private gameLoopId: number | null = null;
  private patronId = 0;
  private mugId = 0;
  private keysHeld = new Set<string>();
  private spawnAcc = 0;
  private prevTime: number | null = null;

  // Responsive Canvas Dimensions
  private CANVAS_WIDTH = 800;
  private CANVAS_HEIGHT = 600;
  private readonly LANE_HEIGHT = 120;
  private readonly LANE_Y_OFFSET = 100;
  private readonly BARTENDER_X = 100;
  private readonly BASE_PATRON_SPEED = 0.8;
  private readonly MUG_SPEED = 4;
  private readonly BASE_PATRON_WAIT_TIME = 3000;
  private readonly FILL_SPEED = 2;
  private readonly MAX_FILL = 100;
  private readonly MIN_ACCEPTABLE_FILL = 70;
  private readonly LEVEL_TIME = 60000;

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
      // Large screens: use optimal width, cap at 850px
      maxWidth = Math.min(availableWidth, 850);
    }
    
    // Also consider height constraints to prevent overflow
    const maxWidthFromHeight = Math.floor(availableHeight * aspectRatio);
    
    // Use the smaller of width-based or height-based constraints
    const constrainedWidth = Math.min(maxWidth, maxWidthFromHeight);
    
    // Set final dimensions with min/max bounds
    this.CANVAS_WIDTH = Math.max(280, Math.min(constrainedWidth, 900));
    this.CANVAS_HEIGHT = Math.round(this.CANVAS_WIDTH / aspectRatio);
  }

  private getInitialState(): GameState {
    return {
      score: 0,
      lives: 3,
      level: 1,
      isPlaying: false,
      gameOver: false,
      patrons: [],
      mugs: [],
      bartenderLane: 1,
      isFillingMug: false,
      currentFillLevel: 0,
      health: 100,
      timeLeft: this.LEVEL_TIME,
      levelStartTime: 0,
    };
  }

  public init(): void {
    // Create game container
    const root = document.getElementById('root');
    if (!root) {
      console.error('Root element not found');
      return;
    }

    root.innerHTML = `
      <div class="flex flex-col items-center justify-center gap-3 sm:gap-4 md:gap-6 w-full">
        <!-- Game Canvas Section -->
        <div class="relative w-full flex justify-center px-2 sm:px-0">
          <canvas id="game-canvas" width="${this.CANVAS_WIDTH}" height="${this.CANVAS_HEIGHT}"
                  class="border-2 sm:border-4 border-amber-600 rounded-lg shadow-2xl bg-gradient-to-b from-amber-900 to-amber-950 w-full max-w-full h-auto"
                  style="display: block; aspect-ratio: 4/3;">
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
      this.startGame();
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

    if ((event.key === ' ' || event.key === 'Space') && this.state.isFillingMug) {
      this.serveMug();
    }
  }

  private moveBartender(direction: 'up' | 'down'): void {
    if (!this.state.isPlaying) return;

    let newLane = this.state.bartenderLane;
    if (direction === 'up' && newLane > 0) {
      newLane--;
    } else if (direction === 'down' && newLane < 3) {
      newLane++;
    }

    this.state.bartenderLane = newLane;
  }

  private getLaneY(lane: number): number {
    return this.LANE_Y_OFFSET + lane * this.LANE_HEIGHT + this.LANE_HEIGHT / 2;
  }

  private serveMug(): void {
    if (!this.state.isFillingMug || this.state.currentFillLevel === 0) {
      return;
    }

    const mug: Mug = {
      id: this.mugId++,
      x: this.BARTENDER_X + 80,
      y: this.getLaneY(this.state.bartenderLane),
      lane: this.state.bartenderLane,
      speed: this.MUG_SPEED,
      fillLevel: this.state.currentFillLevel,
    };

    this.state.mugs.push(mug);
    this.state.isFillingMug = false;
    this.state.currentFillLevel = 0;
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
        this.state.level++;
        this.state.timeLeft = this.LEVEL_TIME;
        this.state.levelStartTime = now;
        this.state.score += 1000;
        this.state.health = Math.min(100, this.state.health + 25);
        this.state.patrons = [];
        this.state.mugs = [];
      } else {
        // Game over
        this.state.gameOver = true;
        this.state.isPlaying = false;
        this.state.timeLeft = 0;
        this.updateUI();
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
    const baseSpawnInterval = Math.max(300, 1000 - (this.state.level - 1) * 150);
    const spawnInterval = Math.max(100, baseSpawnInterval / difficultyMultiplier);

    let spawnsThisFrame = 0;
    while (this.spawnAcc >= spawnInterval && spawnsThisFrame < 3) {
      this.spawnAcc -= spawnInterval;
      spawnsThisFrame++;

      const lane = Math.floor(Math.random() * 4);
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
      };
      this.state.patrons.push(patron);
    }

    // Update patrons
    this.state.patrons = this.state.patrons
      .map(patron => {
        if (patron.served) {
          return { ...patron, x: patron.x + (8 * deltaTime) / 16 };
        } else if (patron.isWaiting) {
          const newWaitingTime = patron.waitingTime + deltaTime;
          if (newWaitingTime >= patron.patience) {
            return { ...patron, isWaiting: false, waitingTime: newWaitingTime };
          }
          return { ...patron, waitingTime: newWaitingTime };
        } else {
          return { ...patron, x: patron.x - patron.speed * (deltaTime / 16) };
        }
      })
      .filter(patron => {
        if (patron.served) {
          return patron.x < this.CANVAS_WIDTH + 50;
        } else {
          return patron.x > this.BARTENDER_X - 30;
        }
      });

    // Update mugs
    this.state.mugs = this.state.mugs
      .map(mug => ({ ...mug, x: mug.x + mug.speed }))
      .filter(mug => mug.x < this.CANVAS_WIDTH);

    // Check collisions
    const { newPatrons, newMugs, scoreIncrease, healthIncrease } = this.checkCollisions();
    this.state.patrons = newPatrons;
    this.state.mugs = newMugs;
    this.state.score += scoreIncrease;

    // Handle patrons reaching bartender
    const patronsAtBartender = this.state.patrons.filter(
      p => !p.served && p.x <= this.BARTENDER_X + 20
    );
    this.state.patrons = this.state.patrons.filter(
      p => p.served || p.x > this.BARTENDER_X + 20
    );

    const HEALTH_LOSS_PER_PATRON = 20;
    const healthLoss = patronsAtBartender.length * HEALTH_LOSS_PER_PATRON;
    this.state.health = Math.min(100, Math.max(0, this.state.health - healthLoss + healthIncrease));

    // Handle mug filling
    if (this.keysHeld.has(' ') || this.keysHeld.has('Space')) {
      this.state.isFillingMug = true;
      this.state.currentFillLevel = Math.min(this.MAX_FILL, this.state.currentFillLevel + this.FILL_SPEED);
    }

    // Update time
    this.state.timeLeft = newTimeLeft;

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

  private checkCollisions(): { newPatrons: Patron[], newMugs: Mug[], scoreIncrease: number, healthIncrease: number } {
    const newPatrons = [...this.state.patrons];
    const newMugs = [...this.state.mugs];
    let scoreIncrease = 0;
    let healthIncrease = 0;

    for (let mugIndex = this.state.mugs.length - 1; mugIndex >= 0; mugIndex--) {
      const mug = this.state.mugs[mugIndex];
      let mugCaught = false;

      for (let patronIndex = 0; patronIndex < this.state.patrons.length; patronIndex++) {
        const patron = this.state.patrons[patronIndex];
        if (
          mug.lane === patron.lane &&
          Math.abs(mug.x - patron.x) < 40 &&
          !patron.served
        ) {
          if (mug.fillLevel >= this.MIN_ACCEPTABLE_FILL) {
            newPatrons[patronIndex] = { ...patron, served: true };
            scoreIncrease += Math.floor(mug.fillLevel) + 50;
            healthIncrease += 2;
          } else {
            scoreIncrease += 10;
            newPatrons[patronIndex] = { ...patron, served: true, isWaiting: false };
          }
          newMugs.splice(mugIndex, 1);
          mugCaught = true;
          break;
        }
      }

      if (!mugCaught && mug.x >= this.CANVAS_WIDTH - 50) {
        scoreIncrease -= 1;
        newMugs.splice(mugIndex, 1);
      }
    }

    return { newPatrons, newMugs, scoreIncrease, healthIncrease };
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
