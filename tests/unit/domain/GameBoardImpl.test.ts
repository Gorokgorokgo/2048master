import { GameBoardImpl } from '../../../src/domain/GameBoardImpl';
import { Direction } from '../../../src/domain/types';

describe('GameBoardImpl', () => {
  describe('initialization', () => {
    test('should create empty board by default', () => {
      const board = new GameBoardImpl();
      
      expect(board.size).toBe(4);
      expect(board.score).toBe(0);
      expect(board.getEmptyCells()).toHaveLength(16);
      expect(board.getMaxTile()).toBe(0);
      expect(board.isGameOver).toBe(false);
      expect(board.hasWon).toBe(false);
    });

    test('should create board with custom cells', () => {
      const cells = [
        [2, 0, 0, 0],
        [0, 4, 0, 0],
        [0, 0, 8, 0],
        [0, 0, 0, 16],
      ];
      const board = new GameBoardImpl(cells, 100);
      
      expect(board.score).toBe(100);
      expect(board.getEmptyCells()).toHaveLength(12);
      expect(board.getMaxTile()).toBe(16);
    });
  });

  describe('tile merging', () => {
    test('should merge tiles correctly when moving left', () => {
      const cells = [
        [2, 2, 0, 0],
        [4, 4, 8, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];
      const board = new GameBoardImpl(cells);
      
      const result = board.move(Direction.LEFT);
      
      expect(result.moved).toBe(true);
      expect(result.score).toBe(12); // 4 + 8 = 12
      expect(result.board.cells[0]).toEqual([4, 0, 0, 0]);
      expect(result.board.cells[1]).toEqual([8, 8, 0, 0]);
    });

    test('should merge tiles correctly when moving right', () => {
      const cells = [
        [0, 0, 2, 2],
        [0, 4, 4, 8],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];
      const board = new GameBoardImpl(cells);
      
      const result = board.move(Direction.RIGHT);
      
      expect(result.moved).toBe(true);
      expect(result.score).toBe(12); // 4 + 8 = 12
      expect(result.board.cells[0]).toEqual([0, 0, 0, 4]);
      expect(result.board.cells[1]).toEqual([0, 0, 8, 8]);
    });

    test('should merge tiles correctly when moving up', () => {
      const cells = [
        [2, 4, 0, 0],
        [2, 4, 0, 0],
        [0, 8, 0, 0],
        [0, 0, 0, 0],
      ];
      const board = new GameBoardImpl(cells);
      
      const result = board.move(Direction.UP);
      
      expect(result.moved).toBe(true);
      expect(result.score).toBe(12); // 4 + 8 = 12
      expect(result.board.cells[0]![0]).toBe(4);
      expect(result.board.cells[0]![1]).toBe(8);
      expect(result.board.cells[1]![0]).toBe(0);
      expect(result.board.cells[1]![1]).toBe(8);
    });

    test('should merge tiles correctly when moving down', () => {
      const cells = [
        [0, 0, 0, 0],
        [0, 8, 0, 0],
        [2, 4, 0, 0],
        [2, 4, 0, 0],
      ];
      const board = new GameBoardImpl(cells);
      
      const result = board.move(Direction.DOWN);
      
      expect(result.moved).toBe(true);
      expect(result.score).toBe(12); // 4 + 8 = 12
      expect(result.board.cells[2]![0]).toBe(0);
      expect(result.board.cells[2]![1]).toBe(8);
      expect(result.board.cells[3]![0]).toBe(4);
      expect(result.board.cells[3]![1]).toBe(8);
    });
  });

  describe('move validation', () => {
    test('should detect when no move is possible', () => {
      const cells = [
        [2, 4, 2, 4],
        [4, 2, 4, 2],
        [2, 4, 2, 4],
        [4, 2, 4, 2],
      ];
      const board = new GameBoardImpl(cells);
      
      expect(board.canMove(Direction.LEFT)).toBe(false);
      expect(board.canMove(Direction.RIGHT)).toBe(false);
      expect(board.canMove(Direction.UP)).toBe(false);
      expect(board.canMove(Direction.DOWN)).toBe(false);
      expect(board.isGameOver).toBe(true);
    });

    test('should detect when move is possible', () => {
      const cells = [
        [2, 2, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];
      const board = new GameBoardImpl(cells);
      
      expect(board.canMove(Direction.LEFT)).toBe(true);
      expect(board.canMove(Direction.RIGHT)).toBe(true);
      expect(board.canMove(Direction.UP)).toBe(false);
      expect(board.canMove(Direction.DOWN)).toBe(true); // Can move down since there are empty spaces
    });

    test('should return false when trying invalid move', () => {
      const cells = [
        [2, 4, 8, 16],
        [32, 64, 128, 256],
        [512, 1024, 2048, 4096],
        [8192, 16384, 32768, 65536],
      ];
      const board = new GameBoardImpl(cells);
      
      const result = board.move(Direction.DOWN);
      
      expect(result.moved).toBe(false);
      expect(result.score).toBe(0);
      expect(result.board.equals(board)).toBe(true);
    });
  });

  describe('game state detection', () => {
    test('should detect victory condition', () => {
      const cells = [
        [2048, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];
      const board = new GameBoardImpl(cells);
      
      expect(board.hasWon).toBe(true);
    });

    test('should detect game over condition', () => {
      const cells = [
        [2, 4, 2, 4],
        [4, 2, 4, 2],
        [2, 4, 2, 4],
        [4, 2, 4, 2],
      ];
      const board = new GameBoardImpl(cells);
      
      expect(board.isGameOver).toBe(true);
    });

    test('should detect game continues when moves available', () => {
      const cells = [
        [2, 4, 2, 4],
        [4, 2, 4, 2],
        [2, 4, 2, 4],
        [4, 2, 4, 0],
      ];
      const board = new GameBoardImpl(cells);
      
      expect(board.isGameOver).toBe(false);
    });
  });

  describe('utility methods', () => {
    test('should correctly identify empty cells', () => {
      const cells = [
        [2, 0, 4, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 8],
      ];
      const board = new GameBoardImpl(cells);
      const emptyCells = board.getEmptyCells();
      
      expect(emptyCells).toHaveLength(13);
      expect(emptyCells).toContainEqual({ row: 0, col: 1 });
      expect(emptyCells).toContainEqual({ row: 0, col: 3 });
      expect(emptyCells).not.toContainEqual({ row: 0, col: 0 });
    });

    test('should find maximum tile value', () => {
      const cells = [
        [2, 4, 8, 16],
        [32, 64, 128, 256],
        [512, 1024, 2048, 4096],
        [0, 0, 0, 0],
      ];
      const board = new GameBoardImpl(cells);
      
      expect(board.getMaxTile()).toBe(4096);
    });

    test('should clone board correctly', () => {
      const cells = [
        [2, 4, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];
      const original = new GameBoardImpl(cells, 50);
      const cloned = original.clone();
      
      expect(cloned.equals(original)).toBe(true);
      expect(cloned).not.toBe(original);
      expect(cloned.cells).not.toBe(original.cells);
    });

    test('should correctly compare boards for equality', () => {
      const cells1 = [
        [2, 4, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];
      const cells2 = [
        [2, 4, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];
      const cells3 = [
        [2, 8, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];
      
      const board1 = new GameBoardImpl(cells1, 10);
      const board2 = new GameBoardImpl(cells2, 10);
      const board3 = new GameBoardImpl(cells3, 10);
      const board4 = new GameBoardImpl(cells1, 20);
      
      expect(board1.equals(board2)).toBe(true);
      expect(board1.equals(board3)).toBe(false);
      expect(board1.equals(board4)).toBe(false);
    });
  });

  describe('edge cases', () => {
    test('should handle single tile moves', () => {
      const cells = [
        [2, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];
      const board = new GameBoardImpl(cells);
      
      const rightResult = board.move(Direction.RIGHT);
      expect(rightResult.board.cells[0]).toEqual([0, 0, 0, 2]);
      
      const downResult = board.move(Direction.DOWN);
      expect(downResult.board.cells[3]![0]).toBe(2);
    });

    test('should handle multiple consecutive merges', () => {
      const cells = [
        [2, 2, 4, 4],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];
      const board = new GameBoardImpl(cells);
      
      const result = board.move(Direction.LEFT);
      expect(result.board.cells[0]).toEqual([4, 8, 0, 0]);
      expect(result.score).toBe(12); // 4 + 8
    });

    test('should not merge already merged tiles in same move', () => {
      const cells = [
        [2, 2, 4, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];
      const board = new GameBoardImpl(cells);
      
      const result = board.move(Direction.LEFT);
      expect(result.board.cells[0]).toEqual([4, 4, 0, 0]);
      expect(result.score).toBe(4);
    });
  });
});