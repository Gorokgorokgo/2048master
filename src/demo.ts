import { GameBoardImpl, Direction, GameRules } from './domain';

function printBoard(board: GameBoardImpl): void {
  console.log('\n=== 2048 Game Board ===');
  console.log(`Score: ${board.score}`);
  console.log('Board:');
  
  for (let row = 0; row < board.size; row++) {
    const rowString = board.cells[row]!
      .map(cell => cell === 0 ? '   .' : cell.toString().padStart(4))
      .join(' ');
    console.log(rowString);
  }
  
  console.log(`Max Tile: ${board.getMaxTile()}`);
  console.log(`Empty Cells: ${board.getEmptyCells().length}`);
  console.log(`Has Won: ${board.hasWon}`);
  console.log(`Game Over: ${board.isGameOver}`);
  console.log('Possible Moves:', GameRules.getPossibleMoves(board));
}

function demoGame(): void {
  console.log('🎮 2048 Game Demo - Domain Layer Testing');
  
  // Create initial board with some tiles
  const initialCells = [
    [2, 4, 0, 0],
    [0, 2, 8, 0],
    [0, 0, 4, 16],
    [0, 0, 0, 2],
  ];
  
  let board = new GameBoardImpl(initialCells, 50);
  printBoard(board);
  
  // Test some moves
  const moves = [Direction.LEFT, Direction.UP, Direction.RIGHT, Direction.DOWN];
  
  for (const direction of moves) {
    if (board.canMove(direction)) {
      console.log(`\n🎯 Moving ${direction}...`);
      const result = board.move(direction);
      
      if (result.moved) {
        board = result.board as GameBoardImpl;
        console.log(`Score gained: ${result.score}`);
        printBoard(board);
        
        if (board.hasWon) {
          console.log('🎉 Victory! Reached 2048!');
          break;
        }
        
        if (board.isGameOver) {
          console.log('💀 Game Over!');
          break;
        }
      }
    } else {
      console.log(`\n❌ Cannot move ${direction}`);
    }
  }
  
  // Test game rules
  console.log('\n🔍 Testing Game Rules:');
  console.log('- New tile value:', GameRules.getNewTileValue());
  console.log('- Random empty position:', GameRules.getRandomEmptyPosition(board));
  console.log('- Board density:', GameRules.calculateBoardDensity(board));
  console.log('- Is optimal state:', GameRules.isOptimalBoardState(board));
  
  const validation = GameRules.validateGameState(board);
  console.log('- Game state valid:', validation.valid);
  if (!validation.valid) {
    console.log('- Validation errors:', validation.errors);
  }
}

// Run demo
demoGame();