import { GameBoardImpl, Direction, GameRules } from './domain';
import * as readline from 'readline';

class InteractiveGame {
  private board: GameBoardImpl;
  private rl: readline.Interface;

  constructor() {
    this.board = new GameBoardImpl();
    this.addRandomTile();
    this.addRandomTile();
    
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  private addRandomTile(): void {
    const position = GameRules.getRandomEmptyPosition(this.board);
    if (position) {
      const value = GameRules.getNewTileValue();
      const cells = this.board.cells.map(row => [...row]);
      cells[position.row]![position.col] = value;
      this.board = new GameBoardImpl(cells, this.board.score);
    }
  }

  private printBoard(): void {
    console.clear();
    console.log('🎮 2048 Interactive Game');
    console.log(`Score: ${this.board.score}`);
    console.log('─'.repeat(25));
    
    for (let row = 0; row < this.board.size; row++) {
      const rowString = this.board.cells[row]!
        .map(cell => cell === 0 ? '    ' : cell.toString().padStart(4))
        .join('│');
      console.log('│' + rowString + '│');
      if (row < this.board.size - 1) {
        console.log('├────┼────┼────┼────┤');
      }
    }
    console.log('─'.repeat(25));
    
    if (this.board.hasWon) {
      console.log('🎉 YOU WON! Reached 2048!');
    }
    
    if (this.board.isGameOver) {
      console.log('💀 GAME OVER!');
    } else {
      console.log('Controls: W(up) A(left) S(down) D(right) Q(quit)');
    }
  }

  private async getUserInput(): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question('Your move: ', (answer) => {
        resolve(answer.toLowerCase().trim());
      });
    });
  }

  private parseInput(input: string): Direction | null {
    switch (input) {
      case 'w': return Direction.UP;
      case 'a': return Direction.LEFT;
      case 's': return Direction.DOWN;
      case 'd': return Direction.RIGHT;
      default: return null;
    }
  }

  async play(): Promise<void> {
    while (!this.board.isGameOver) {
      this.printBoard();
      
      const input = await this.getUserInput();
      
      if (input === 'q') {
        console.log('Thanks for playing!');
        break;
      }
      
      const direction = this.parseInput(input);
      if (!direction) {
        console.log('Invalid input! Use W/A/S/D or Q to quit.');
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
      
      if (!this.board.canMove(direction)) {
        console.log('Cannot move in that direction!');
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
      
      const result = this.board.move(direction);
      if (result.moved) {
        this.board = result.board as GameBoardImpl;
        console.log(`Score gained: +${result.score}`);
        this.addRandomTile();
      }
      
      if (this.board.hasWon) {
        this.printBoard();
        console.log('🎉 Congratulations! You reached 2048!');
        const continueInput = await this.getUserInput();
        if (continueInput !== 'y') break;
      }
    }
    
    if (this.board.isGameOver) {
      this.printBoard();
      console.log('Game Over! Final Score:', this.board.score);
    }
    
    this.rl.close();
  }
}

// Start the game
const game = new InteractiveGame();
game.play().catch(console.error);