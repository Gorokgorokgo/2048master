import { GameRules } from '../../../src/domain/GameRules';
import { GameBoardImpl } from '../../../src/domain/GameBoardImpl';
import { Direction } from '../../../src/domain/types';

describe('GameRules', () => {
  describe('constants', () => {
    test('should have correct game constants', () => {
      expect(GameRules.TARGET_TILE).toBe(2048);
      expect(GameRules.NEW_TILE_VALUES).toEqual([2, 4]);
      expect(GameRules.BOARD_SIZE).toBe(4);
      expect(GameRules.MIN_TILE_VALUE).toBe(2);
    });
  });

  describe('move validation', () => {
    test('should validate valid moves', () => {
      const cells = [
        [2, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];
      const board = new GameBoardImpl(cells);
      
      expect(GameRules.validateMove(board, Direction.RIGHT)).toBe(true);
      expect(GameRules.validateMove(board, Direction.DOWN)).toBe(true);
      expect(GameRules.validateMove(board, Direction.LEFT)).toBe(false);
      expect(GameRules.validateMove(board, Direction.UP)).toBe(false);
    });

    test('should reject moves on game over board', () => {
      const cells = [
        [2, 4, 2, 4],
        [4, 2, 4, 2],
        [2, 4, 2, 4],
        [4, 2, 4, 2],
      ];
      const board = new GameBoardImpl(cells);
      
      expect(GameRules.validateMove(board, Direction.LEFT)).toBe(false);
      expect(GameRules.validateMove(board, Direction.RIGHT)).toBe(false);
      expect(GameRules.validateMove(board, Direction.UP)).toBe(false);
      expect(GameRules.validateMove(board, Direction.DOWN)).toBe(false);
    });
  });

  describe('score calculation', () => {
    test('should calculate score correctly', () => {
      const mergedTiles = [4, 8, 16];
      const score = GameRules.calculateScore(mergedTiles);
      
      expect(score).toBe(28);
    });

    test('should handle empty merged tiles', () => {
      const score = GameRules.calculateScore([]);
      
      expect(score).toBe(0);
    });
  });

  describe('victory and defeat conditions', () => {
    test('should detect victory condition', () => {
      const cells = [
        [2048, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];
      const board = new GameBoardImpl(cells);
      
      expect(GameRules.isVictoryCondition(board)).toBe(true);
    });

    test('should detect defeat condition', () => {
      const cells = [
        [2, 4, 2, 4],
        [4, 2, 4, 2],
        [2, 4, 2, 4],
        [4, 2, 4, 2],
      ];
      const board = new GameBoardImpl(cells);
      
      expect(GameRules.isDefeatCondition(board)).toBe(true);
    });

    test('should allow continuation after victory', () => {
      const cells = [
        [2048, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];
      const board = new GameBoardImpl(cells);
      
      expect(GameRules.canContinueAfterVictory(board)).toBe(true);
    });
  });

  describe('new tile generation', () => {
    test('should generate valid tile values', () => {
      const validValues = [2, 4];
      
      for (let i = 0; i < 100; i++) {
        const value = GameRules.getNewTileValue();
        expect(validValues).toContain(value);
      }
    });

    test('should return random empty position', () => {
      const cells = [
        [2, 0, 4, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 8],
      ];
      const board = new GameBoardImpl(cells);
      
      for (let i = 0; i < 10; i++) {
        const position = GameRules.getRandomEmptyPosition(board);
        expect(position).toBeTruthy();
        
        if (position) {
          expect(board.cells[position.row]![position.col]).toBe(0);
        }
      }
    });

    test('should return null when no empty positions', () => {
      const cells = [
        [2, 4, 2, 4],
        [4, 2, 4, 2],
        [2, 4, 2, 4],
        [4, 2, 4, 2],
      ];
      const board = new GameBoardImpl(cells);
      
      const position = GameRules.getRandomEmptyPosition(board);
      expect(position).toBeNull();
    });
  });

  describe('tile value validation', () => {
    test('should validate correct tile values', () => {
      expect(GameRules.isValidTileValue(0)).toBe(true); // empty
      expect(GameRules.isValidTileValue(2)).toBe(true);
      expect(GameRules.isValidTileValue(4)).toBe(true);
      expect(GameRules.isValidTileValue(8)).toBe(true);
      expect(GameRules.isValidTileValue(2048)).toBe(true);
    });

    test('should reject invalid tile values', () => {
      expect(GameRules.isValidTileValue(1)).toBe(false);
      expect(GameRules.isValidTileValue(3)).toBe(false);
      expect(GameRules.isValidTileValue(5)).toBe(false);
      expect(GameRules.isValidTileValue(200000)).toBe(false);
    });
  });

  describe('board size validation', () => {
    test('should validate correct board sizes', () => {
      expect(GameRules.isValidBoardSize(3)).toBe(true);
      expect(GameRules.isValidBoardSize(4)).toBe(true);
      expect(GameRules.isValidBoardSize(5)).toBe(true);
      expect(GameRules.isValidBoardSize(8)).toBe(true);
    });

    test('should reject invalid board sizes', () => {
      expect(GameRules.isValidBoardSize(2)).toBe(false);
      expect(GameRules.isValidBoardSize(9)).toBe(false);
      expect(GameRules.isValidBoardSize(3.5)).toBe(false);
      expect(GameRules.isValidBoardSize(-1)).toBe(false);
    });
  });

  describe('merge pairs calculation', () => {
    test('should identify merge pairs correctly', () => {
      const line = [2, 2, 4, 4];
      const pairs = GameRules.getMergePairs(line);
      
      expect(pairs).toHaveLength(2);
      expect(pairs[0]).toEqual({ index: 0, value: 4, score: 4 });
      expect(pairs[1]).toEqual({ index: 2, value: 8, score: 8 });
    });

    test('should handle line with no merges', () => {
      const line = [2, 4, 8, 16];
      const pairs = GameRules.getMergePairs(line);
      
      expect(pairs).toHaveLength(0);
    });

    test('should handle line with zeros', () => {
      const line = [2, 0, 2, 0];
      const pairs = GameRules.getMergePairs(line);
      
      expect(pairs).toHaveLength(1);
      expect(pairs[0]).toEqual({ index: 0, value: 4, score: 4 });
    });
  });

  describe('possible moves', () => {
    test('should find all possible moves', () => {
      const cells = [
        [2, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];
      const board = new GameBoardImpl(cells);
      
      const moves = GameRules.getPossibleMoves(board);
      expect(moves).toContain(Direction.RIGHT);
      expect(moves).toContain(Direction.DOWN);
      expect(moves).not.toContain(Direction.LEFT);
      expect(moves).not.toContain(Direction.UP);
    });

    test('should return empty array for game over board', () => {
      const cells = [
        [2, 4, 2, 4],
        [4, 2, 4, 2],
        [2, 4, 2, 4],
        [4, 2, 4, 2],
      ];
      const board = new GameBoardImpl(cells);
      
      const moves = GameRules.getPossibleMoves(board);
      expect(moves).toHaveLength(0);
    });
  });

  describe('optimal board state', () => {
    test('should detect optimal board state with max tile in corner', () => {
      const cells = [
        [1024, 512, 256, 128],
        [2, 4, 8, 16],
        [0, 0, 0, 32],
        [0, 0, 0, 64],
      ];
      const board = new GameBoardImpl(cells);
      
      expect(GameRules.isOptimalBoardState(board)).toBe(true);
    });

    test('should detect non-optimal board state', () => {
      const cells = [
        [2, 4, 8, 16],
        [0, 0, 1024, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];
      const board = new GameBoardImpl(cells);
      
      expect(GameRules.isOptimalBoardState(board)).toBe(false);
    });
  });

  describe('board density', () => {
    test('should calculate board density correctly', () => {
      const cells = [
        [2, 4, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 8, 0],
        [0, 0, 0, 16],
      ];
      const board = new GameBoardImpl(cells);
      
      const density = GameRules.calculateBoardDensity(board);
      expect(density).toBe(4 / 16); // 4 non-empty cells out of 16
    });

    test('should handle empty board', () => {
      const board = new GameBoardImpl();
      const density = GameRules.calculateBoardDensity(board);
      
      expect(density).toBe(0);
    });

    test('should handle full board', () => {
      const cells = [
        [2, 4, 2, 4],
        [4, 2, 4, 2],
        [2, 4, 2, 4],
        [4, 2, 4, 2],
      ];
      const board = new GameBoardImpl(cells);
      const density = GameRules.calculateBoardDensity(board);
      
      expect(density).toBe(1);
    });
  });

  describe('game state validation', () => {
    test('should validate correct game state', () => {
      const cells = [
        [2, 4, 8, 16],
        [32, 64, 128, 256],
        [512, 1024, 0, 0],
        [0, 0, 0, 0],
      ];
      const board = new GameBoardImpl(cells, 100);
      
      const validation = GameRules.validateGameState(board);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should detect invalid tile values', () => {
      const cells = [
        [2, 3, 0, 0], // 3 is invalid
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];
      const board = new GameBoardImpl(cells);
      
      const validation = GameRules.validateGameState(board);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Invalid tile value at (0, 1): 3');
    });

    test('should detect negative score', () => {
      const cells = [
        [2, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];
      const board = new GameBoardImpl(cells, -10);
      
      const validation = GameRules.validateGameState(board);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Invalid negative score: -10');
    });
  });

  describe('max possible score calculation', () => {
    test('should calculate reasonable max score', () => {
      const maxScore = GameRules.calculateMaxPossibleScore(2048);
      
      expect(maxScore).toBeGreaterThan(0);
      expect(Number.isFinite(maxScore)).toBe(true);
    });
  });
});