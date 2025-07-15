import { GameBoard, Direction, Position, MoveResult } from './types';

export class GameBoardImpl implements GameBoard {
  private readonly _cells: number[][];
  private readonly _score: number;
  private readonly _size: number;

  constructor(
    cells?: number[][],
    score: number = 0,
    size: number = 4
  ) {
    this._size = size;
    this._score = score;
    this._cells = cells ? this.deepCloneCells(cells) : this.createEmptyBoard();
  }

  get cells(): ReadonlyArray<ReadonlyArray<number>> {
    return this._cells.map(row => [...row]);
  }

  get score(): number {
    return this._score;
  }

  get size(): number {
    return this._size;
  }

  get isGameOver(): boolean {
    if (this.getEmptyCells().length > 0) {
      return false;
    }

    for (const direction of Object.values(Direction)) {
      if (this.canMove(direction)) {
        return false;
      }
    }

    return true;
  }

  get hasWon(): boolean {
    return this.getMaxTile() >= 2048;
  }

  move(direction: Direction): MoveResult {
    if (!this.canMove(direction)) {
      return {
        board: this.clone(),
        score: 0,
        moved: false,
      };
    }

    const newCells = this.deepCloneCells(this._cells);
    let scoreGained = 0;

    switch (direction) {
      case Direction.LEFT:
        scoreGained = this.moveLeft(newCells);
        break;
      case Direction.RIGHT:
        scoreGained = this.moveRight(newCells);
        break;
      case Direction.UP:
        scoreGained = this.moveUp(newCells);
        break;
      case Direction.DOWN:
        scoreGained = this.moveDown(newCells);
        break;
    }

    return {
      board: new GameBoardImpl(newCells, this._score + scoreGained, this._size),
      score: scoreGained,
      moved: true,
    };
  }

  canMove(direction: Direction): boolean {
    const testCells = this.deepCloneCells(this._cells);

    switch (direction) {
      case Direction.LEFT:
        return this.canMoveLeft(testCells);
      case Direction.RIGHT:
        return this.canMoveRight(testCells);
      case Direction.UP:
        return this.canMoveUp(testCells);
      case Direction.DOWN:
        return this.canMoveDown(testCells);
    }
  }

  getEmptyCells(): Position[] {
    const emptyCells: Position[] = [];
    for (let row = 0; row < this._size; row++) {
      for (let col = 0; col < this._size; col++) {
        if (this._cells[row]![col] === 0) {
          emptyCells.push({ row, col });
        }
      }
    }
    return emptyCells;
  }

  getMaxTile(): number {
    let maxTile = 0;
    for (let row = 0; row < this._size; row++) {
      for (let col = 0; col < this._size; col++) {
        maxTile = Math.max(maxTile, this._cells[row]![col]!);
      }
    }
    return maxTile;
  }

  equals(other: GameBoard): boolean {
    if (this._size !== other.size || this._score !== other.score) {
      return false;
    }

    const otherCells = other.cells;
    for (let row = 0; row < this._size; row++) {
      for (let col = 0; col < this._size; col++) {
        if (this._cells[row]![col] !== otherCells[row]![col]) {
          return false;
        }
      }
    }
    return true;
  }

  clone(): GameBoard {
    return new GameBoardImpl(this._cells, this._score, this._size);
  }

  private createEmptyBoard(): number[][] {
    return Array(this._size)
      .fill(null)
      .map(() => Array(this._size).fill(0));
  }

  private deepCloneCells(cells: number[][]): number[][] {
    return cells.map(row => [...row]);
  }

  private moveLeft(cells: number[][]): number {
    let scoreGained = 0;
    for (let row = 0; row < this._size; row++) {
      const { line, score } = this.mergeLine(cells[row]!);
      cells[row] = line;
      scoreGained += score;
    }
    return scoreGained;
  }

  private moveRight(cells: number[][]): number {
    let scoreGained = 0;
    for (let row = 0; row < this._size; row++) {
      const reversed = cells[row]!.slice().reverse();
      const { line, score } = this.mergeLine(reversed);
      cells[row] = line.reverse();
      scoreGained += score;
    }
    return scoreGained;
  }

  private moveUp(cells: number[][]): number {
    let scoreGained = 0;
    for (let col = 0; col < this._size; col++) {
      const column = cells.map(row => row[col]!);
      const { line, score } = this.mergeLine(column);
      for (let row = 0; row < this._size; row++) {
        cells[row]![col] = line[row]!;
      }
      scoreGained += score;
    }
    return scoreGained;
  }

  private moveDown(cells: number[][]): number {
    let scoreGained = 0;
    for (let col = 0; col < this._size; col++) {
      const column = cells.map(row => row[col]!).reverse();
      const { line, score } = this.mergeLine(column);
      const reversedLine = line.reverse();
      for (let row = 0; row < this._size; row++) {
        cells[row]![col] = reversedLine[row]!;
      }
      scoreGained += score;
    }
    return scoreGained;
  }

  private mergeLine(line: number[]): { line: number[]; score: number } {
    const nonZero = line.filter(cell => cell !== 0);
    const merged: number[] = [];
    let score = 0;
    let i = 0;

    while (i < nonZero.length) {
      if (i < nonZero.length - 1 && nonZero[i] === nonZero[i + 1]) {
        const mergedValue = nonZero[i]! * 2;
        merged.push(mergedValue);
        score += mergedValue;
        i += 2;
      } else {
        merged.push(nonZero[i]!);
        i += 1;
      }
    }

    while (merged.length < this._size) {
      merged.push(0);
    }

    return { line: merged, score };
  }

  private canMoveLeft(cells: number[][]): boolean {
    for (let row = 0; row < this._size; row++) {
      if (this.canMergeLine(cells[row]!)) {
        return true;
      }
    }
    return false;
  }

  private canMoveRight(cells: number[][]): boolean {
    for (let row = 0; row < this._size; row++) {
      const reversed = cells[row]!.slice().reverse();
      if (this.canMergeLine(reversed)) {
        return true;
      }
    }
    return false;
  }

  private canMoveUp(cells: number[][]): boolean {
    for (let col = 0; col < this._size; col++) {
      const column = cells.map(row => row[col]!);
      if (this.canMergeLine(column)) {
        return true;
      }
    }
    return false;
  }

  private canMoveDown(cells: number[][]): boolean {
    for (let col = 0; col < this._size; col++) {
      const column = cells.map(row => row[col]!).reverse();
      if (this.canMergeLine(column)) {
        return true;
      }
    }
    return false;
  }

  private canMergeLine(line: number[]): boolean {
    const original = [...line];
    const { line: merged } = this.mergeLine(line);
    
    for (let i = 0; i < original.length; i++) {
      if (original[i] !== merged[i]) {
        return true;
      }
    }
    return false;
  }
}