export interface Patron {
  id: number;
  x: number;
  y: number;
  lane: number;
  speed: number;
  served: boolean;
  waitingTime: number;
  isWaiting: boolean;
  patience: number;
  spriteIndex: number;
  isDrinking: boolean;
  drinkingProgress: number;
  stepTimer: number;
}

export type MugState = 'sliding_forward' | 'at_patron' | 'sliding_back' | 'empty';
export type BartenderState = 'IDLE' | 'FILLING_MUG' | 'SLIDING_MUG';

export interface Mug {
  id: number;
  x: number;
  y: number;
  lane: number;
  speed: number;
  fillLevel: number; // 0-100
  state: MugState;
  isEmpty: boolean;
  targetPatronId?: number;
}

export interface GameState {
  score: number;
  lives: number;
  level: number;
  isPlaying: boolean;
  gameOver: boolean;
  patrons: Patron[];
  mugs: Mug[];
  bartenderLane: number;
  bartenderState: BartenderState;
  bartenderFacing: 'left' | 'right';
  isFillingMug: boolean;
  currentFillLevel: number;
  health: number;
  timeLeft: number;
  levelStartTime: number;
  recentFailure?: {
    type: 'miss' | 'timeout';
    timestamp: number;
  };
  combo: number;
  maxCombo: number;
  lastServeTime: number;
  screenShake: number;
  comboPopup?: { value: number; timestamp: number };
  totalServes: number;
  perfectServes: number;
  highScore: number;
  requiredScoreAtGameOver?: number;
}
