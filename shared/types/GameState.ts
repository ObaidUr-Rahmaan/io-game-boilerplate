export interface Player {
  id: string;
  // Add player-specific state here
}

export interface GameState {
  players: Map<string, Player>;
  // Add game-specific state here
}

export type GameEvent =
  | { type: "join"; userId: string }
  | { type: "leave"; userId: string }
  // Add game-specific events here
; 