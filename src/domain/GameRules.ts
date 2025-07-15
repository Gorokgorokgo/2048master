import { GameBoard, Direction, Position } from './types';

export class GameRules {
  static readonly TARGET_TILE = 2048;
  static readonly NEW_TILE_VALUES = [2, 4] as const;
  static readonly NEW_TILE_PROBABILITIES = [0.9, 0.1] as const; // 90% chance for 2, 10% chance for 4
  static readonly BOARD_SIZE = 4;
  static readonly MIN_TILE_VALUE = 2;
  static readonly MAX_TILE_VALUE = 131072; // 2^17

  static validateMove(board: GameBoard, direction: Direction): boolean {
    if (board.isGameOver) {
      return false;
    }
    return board.canMove(direction);
  }

  static calculateScore(mergedTiles: number[]): number {
    return mergedTiles.reduce((total, tileValue) => total + tileValue, 0);
  }

  static isVictoryCondition(board: GameBoard): boolean {
    return board.getMaxTile() >= GameRules.TARGET_TILE;
  }

  static isDefeatCondition(board: GameBoard): boolean {
    return board.isGameOver;
  }

  static canContinueAfterVictory(board: GameBoard): boolean {
    return !board.isGameOver && board.hasWon;
  }

  static getNewTileValue(): number {
    const random = Math.random();
    const probabilities = GameRules.NEW_TILE_PROBABILITIES;

    let cumulativeProbability = 0;
    for (let i = 0; i < probabilities.length; i++) {
      cumulativeProbability += probabilities[i]!;
      if (random <= cumulativeProbability) {
        return GameRules.NEW_TILE_VALUES[i]!;
      }
    }

    return GameRules.NEW_TILE_VALUES[0]!; // fallback to 2
  }

  static getRandomEmptyPosition(board: GameBoard): Position | null {
    const emptyCells = board.getEmptyCells();

    if (emptyCells.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * emptyCells.length);
    return emptyCells[randomIndex]!;
  }

  static isValidTileValue(value: number): boolean {
    if (value === 0) return true; // empty cell
    if (value < GameRules.MIN_TILE_VALUE) return false;
    if (value > GameRules.MAX_TILE_VALUE) return false;

    // Check if value is a power of 2
    return (value & (value - 1)) === 0;
  }

  static isValidBoardSize(size: number): boolean {
    return size >= 3 && size <= 8 && Number.isInteger(size);
  }

  static calculateMaxPossibleScore(
    targetTile: number = GameRules.TARGET_TILE
  ): number {
    let score = 0;
    let currentTile = GameRules.MIN_TILE_VALUE * 2; // Start from 4 (first merge)

    while (currentTile <= targetTile) {
      // Calculate how many tiles of this value we need to create one tile of double value
      const tilesNeeded = (GameRules.BOARD_SIZE * GameRules.BOARD_SIZE) / 2;
      score += currentTile * tilesNeeded;
      currentTile *= 2;
    }

    return score;
  }

  static getMergePairs(
    line: number[]
  ): Array<{ index: number; value: number; score: number }> {
    const pairs: Array<{ index: number; value: number; score: number }> = [];
    const nonZero = line
      .map((cell, index) => ({ value: cell, originalIndex: index }))
      .filter(cell => cell.value !== 0);

    for (let i = 0; i < nonZero.length - 1; i++) {
      const current = nonZero[i]!;
      const next = nonZero[i + 1]!;

      if (current.value === next.value) {
        const mergedValue = current.value * 2;
        pairs.push({
          index: current.originalIndex,
          value: mergedValue,
          score: mergedValue,
        });
        i++; // Skip the next tile as it's been merged
      }
    }

    return pairs;
  }

  static getPossibleMoves(board: GameBoard): Direction[] {
    const possibleMoves: Direction[] = [];

    for (const direction of Object.values(Direction)) {
      if (board.canMove(direction)) {
        possibleMoves.push(direction);
      }
    }

    return possibleMoves;
  }

  static calculateMovesUntilGameOver(board: GameBoard): number {
    if (board.isGameOver) {
      return 0;
    }

    const possibleMoves = GameRules.getPossibleMoves(board);
    return possibleMoves.length;
  }

  static isOptimalBoardState(board: GameBoard): boolean {
    // Check if the largest tile is in a corner
    const maxTile = board.getMaxTile();
    const size = board.size;
    const cells = board.cells;

    const corners = [
      cells[0]![0], // top-left
      cells[0]![size - 1], // top-right
      cells[size - 1]![0], // bottom-left
      cells[size - 1]![size - 1], // bottom-right
    ];

    return corners.includes(maxTile);
  }

  static calculateBoardDensity(board: GameBoard): number {
    const totalCells = board.size * board.size;
    const emptyCells = board.getEmptyCells().length;
    return (totalCells - emptyCells) / totalCells;
  }

  static getBoardSymmetries(board: GameBoard): GameBoard[] {
    // This would return rotated and mirrored versions of the board
    // For now, we'll return just the original board
    // This can be expanded for optimization purposes
    return [board];
  }

  static validateGameState(board: GameBoard): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check board size
    if (!GameRules.isValidBoardSize(board.size)) {
      errors.push(`Invalid board size: ${board.size}`);
    }

    // Check tile values
    const cells = board.cells;
    for (let row = 0; row < board.size; row++) {
      for (let col = 0; col < board.size; col++) {
        const tileValue = cells[row]![col]!;
        if (!GameRules.isValidTileValue(tileValue)) {
          errors.push(`Invalid tile value at (${row}, ${col}): ${tileValue}`);
        }
      }
    }

    // Check score consistency
    if (board.score < 0) {
      errors.push(`Invalid negative score: ${board.score}`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
