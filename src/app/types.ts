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
}

export interface Mug {
  id: number;
  x: number;
  y: number;
  lane: number;
  speed: number;
  fillLevel: number; // 0-100
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
  isFillingMug: boolean;
  currentFillLevel: number;
  health: number;
  timeLeft: number;
  levelStartTime: number;
}
