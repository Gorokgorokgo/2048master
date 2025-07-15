import { GameBoardImpl, Direction, GameRules } from './domain';

class SimpleAI {
  // 간단한 전략: 단조성 선호
  static getBestMove(board: GameBoardImpl): Direction | null {
    const possibleMoves = GameRules.getPossibleMoves(board);
    
    if (possibleMoves.length === 0) {
      return null;
    }
    
    // 우선순위: LEFT > DOWN > RIGHT > UP
    const priority = [Direction.LEFT, Direction.DOWN, Direction.RIGHT, Direction.UP];
    
    for (const direction of priority) {
      if (possibleMoves.includes(direction)) {
        return direction;
      }
    }
    
    return possibleMoves[0] || null;
  }
  
  // 좀 더 똑똑한 전략: 보드 평가 함수 사용
  static getBestMoveWithEvaluation(board: GameBoardImpl): Direction | null {
    const possibleMoves = GameRules.getPossibleMoves(board);
    
    if (possibleMoves.length === 0) {
      return null;
    }
    
    let bestMove = possibleMoves[0]!;
    let bestScore = -Infinity;
    
    for (const direction of possibleMoves) {
      const result = board.move(direction);
      const score = this.evaluateBoard(result.board as GameBoardImpl);
      
      if (score > bestScore) {
        bestScore = score;
        bestMove = direction;
      }
    }
    
    return bestMove;
  }
  
  private static evaluateBoard(board: GameBoardImpl): number {
    let score = 0;
    
    // 빈 공간 보너스
    score += board.getEmptyCells().length * 100;
    
    // 최대 타일이 코너에 있으면 보너스
    if (GameRules.isOptimalBoardState(board)) {
      score += 1000;
    }
    
    // 단조성 평가 (간단한 버전)
    score += this.calculateMonotonicity(board) * 50;
    
    return score;
  }
  
  private static calculateMonotonicity(board: GameBoardImpl): number {
    let monotonicity = 0;
    const cells = board.cells;
    
    // 행 단조성 체크
    for (let row = 0; row < board.size; row++) {
      let increasing = 0;
      let decreasing = 0;
      
      for (let col = 0; col < board.size - 1; col++) {
        const current = cells[row]![col]!;
        const next = cells[row]![col + 1]!;
        
        if (current <= next) increasing++;
        if (current >= next) decreasing++;
      }
      
      monotonicity += Math.max(increasing, decreasing);
    }
    
    return monotonicity;
  }
}

async function runAISimulation(): Promise<void> {
  console.log('🤖 AI Simulation Starting...\n');
  
  let board = new GameBoardImpl();
  
  // 초기 타일 2개 추가
  const addRandomTile = () => {
    const position = GameRules.getRandomEmptyPosition(board);
    if (position) {
      const value = GameRules.getNewTileValue();
      const cells = board.cells.map(row => [...row]);
      cells[position.row]![position.col] = value;
      board = new GameBoardImpl(cells, board.score);
    }
  };
  
  addRandomTile();
  addRandomTile();
  
  let moveCount = 0;
  const maxMoves = 1000;
  
  while (!board.isGameOver && moveCount < maxMoves) {
    const move = SimpleAI.getBestMoveWithEvaluation(board);
    
    if (!move) {
      console.log('No valid moves available');
      break;
    }
    
    const result = board.move(move);
    if (result.moved) {
      board = result.board as GameBoardImpl;
      addRandomTile();
      moveCount++;
      
      if (moveCount % 50 === 0) {
        console.log(`Move ${moveCount}: Score ${board.score}, Max tile: ${board.getMaxTile()}, Empty: ${board.getEmptyCells().length}`);
      }
      
      if (board.hasWon) {
        console.log(`🎉 AI WON in ${moveCount} moves! Reached ${board.getMaxTile()}!`);
        break;
      }
    }
  }
  
  console.log('\n📊 Final Results:');
  console.log(`Moves: ${moveCount}`);
  console.log(`Final Score: ${board.score}`);
  console.log(`Max Tile: ${board.getMaxTile()}`);
  console.log(`Game Over: ${board.isGameOver}`);
  console.log(`Won: ${board.hasWon}`);
  
  // 최종 보드 출력
  console.log('\nFinal Board:');
  for (let row = 0; row < board.size; row++) {
    const rowString = board.cells[row]!
      .map(cell => cell === 0 ? '    ' : cell.toString().padStart(4))
      .join('│');
    console.log('│' + rowString + '│');
  }
}

// AI 시뮬레이션 실행
runAISimulation().catch(console.error);