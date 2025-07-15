export interface Position {
  readonly row: number;
  readonly col: number;
}

export enum Direction {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

export interface MoveResult {
  readonly board: GameBoard;
  readonly score: number;
  readonly moved: boolean;
}

export interface GameBoard {
  readonly cells: ReadonlyArray<ReadonlyArray<number>>;
  readonly score: number;
  readonly isGameOver: boolean;
  readonly hasWon: boolean;
  readonly size: number;

  move(direction: Direction): MoveResult;
  canMove(direction: Direction): boolean;
  getEmptyCells(): Position[];
  getMaxTile(): number;
  equals(other: GameBoard): boolean;
  clone(): GameBoard;
}
