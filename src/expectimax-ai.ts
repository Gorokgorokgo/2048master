import { GameBoardImpl, Direction, GameRules } from './domain';

class ExpectimaxAI {
  private static readonly MAX_DEPTH = 4;
  private static readonly PROBABILITY_2 = 0.9;
  private static readonly PROBABILITY_4 = 0.1;
  
  static getBestMove(board: GameBoardImpl): Direction | null {
    const possibleMoves = GameRules.getPossibleMoves(board);
    
    if (possibleMoves.length === 0) {
      return null;
    }
    
    let bestMove = possibleMoves[0]!;
    let bestScore = -Infinity;
    
    for (const direction of possibleMoves) {
      const result = board.move(direction);
      const score = this.expectimaxSearch(result.board as GameBoardImpl, this.MAX_DEPTH - 1, false);
      
      if (score > bestScore) {
        bestScore = score;
        bestMove = direction;
      }
    }
    
    return bestMove;
  }
  
  private static expectimaxSearch(board: GameBoardImpl, depth: number, maximizing: boolean): number {
    if (depth === 0 || board.isGameOver) {
      return this.evaluateBoard(board);
    }
    
    if (maximizing) {
      // 플레이어 턴 - 최대값 선택
      let maxScore = -Infinity;
      const possibleMoves = GameRules.getPossibleMoves(board);
      
      for (const direction of possibleMoves) {
        const result = board.move(direction);
        const score = this.expectimaxSearch(result.board as GameBoardImpl, depth - 1, false);
        maxScore = Math.max(maxScore, score);
      }
      
      return maxScore === -Infinity ? this.evaluateBoard(board) : maxScore;
    } else {
      // 컴퓨터 턴 - 기댓값 계산
      const emptyCells = board.getEmptyCells();
      
      if (emptyCells.length === 0) {
        return this.evaluateBoard(board);
      }
      
      let expectedScore = 0;
      
      for (const position of emptyCells) {
        // 2가 나올 확률
        const boardWith2 = this.addTileToBoard(board, position, 2);
        const scoreWith2 = this.expectimaxSearch(boardWith2, depth - 1, true);
        expectedScore += this.PROBABILITY_2 * scoreWith2;
        
        // 4가 나올 확률
        const boardWith4 = this.addTileToBoard(board, position, 4);
        const scoreWith4 = this.expectimaxSearch(boardWith4, depth - 1, true);
        expectedScore += this.PROBABILITY_4 * scoreWith4;
      }
      
      return expectedScore / emptyCells.length;
    }
  }
  
  private static addTileToBoard(board: GameBoardImpl, position: { row: number; col: number }, value: number): GameBoardImpl {
    const cells = board.cells.map(row => [...row]);
    cells[position.row]![position.col] = value;
    return new GameBoardImpl(cells, board.score);
  }
  
  private static evaluateBoard(board: GameBoardImpl): number {
    const cells = board.cells;
    let score = 0;
    
    // 1. 빈 공간 (매우 중요)
    const emptyCells = board.getEmptyCells().length;
    score += emptyCells * emptyCells * 1000;
    
    // 2. 최대 타일의 위치
    const maxTile = board.getMaxTile();
    if (cells[0]![0] === maxTile || cells[0]![3] === maxTile || 
        cells[3]![0] === maxTile || cells[3]![3] === maxTile) {
      score += maxTile * 10;
    }
    
    // 3. 단조성 (가장 중요한 요소)
    score += this.calculateMonotonicity(board) * 100;
    
    // 4. 부드러움
    score += this.calculateSmoothness(board) * 10;
    
    // 5. 최대 타일 값 자체
    score += maxTile * 10;
    
    // 6. 가중치 배치 점수
    score += this.calculateWeightedScore(board);
    
    return score;
  }
  
  private static calculateMonotonicity(board: GameBoardImpl): number {
    const cells = board.cells;
    
    // 4방향 단조성 계산
    const directions = [
      this.calculateDirectionalMonotonicity(cells, 1, 0),   // 우
      this.calculateDirectionalMonotonicity(cells, -1, 0),  // 좌
      this.calculateDirectionalMonotonicity(cells, 0, 1),   // 하
      this.calculateDirectionalMonotonicity(cells, 0, -1),  // 상
    ];
    
    return Math.max(directions[0]! + directions[1]!, directions[2]! + directions[3]!);
  }
  
  private static calculateDirectionalMonotonicity(
    cells: ReadonlyArray<ReadonlyArray<number>>, 
    dx: number, 
    dy: number
  ): number {
    let monotonicity = 0;
    
    for (let i = 0; i < 4; i++) {
      let current = 0;
      let next = 1;
      
      while (next < 4) {
        const currentRow = dy === 0 ? i : current;
        const currentCol = dx === 0 ? i : current;
        const nextRow = dy === 0 ? i : next;
        const nextCol = dx === 0 ? i : next;
        
        const currentVal = cells[currentRow]![currentCol]!;
        const nextVal = cells[nextRow]![nextCol]!;
        
        if (currentVal > nextVal && nextVal !== 0) {
          monotonicity += Math.log2(currentVal) - Math.log2(nextVal);
        } else if (nextVal > currentVal && currentVal !== 0) {
          monotonicity -= Math.log2(nextVal) - Math.log2(currentVal);
        }
        
        next++;
        if (nextVal !== 0) current = next - 1;
      }
    }
    
    return monotonicity;
  }
  
  private static calculateSmoothness(board: GameBoardImpl): number {
    const cells = board.cells;
    let smoothness = 0;
    
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const cellValue = cells[row]![col]!;
        if (cellValue === 0) continue;
        
        const cellLog = Math.log2(cellValue);
        
        // 오른쪽
        if (col < 3 && cells[row]![col + 1]! !== 0) {
          smoothness -= Math.abs(cellLog - Math.log2(cells[row]![col + 1]!));
        }
        
        // 아래
        if (row < 3 && cells[row + 1]![col]! !== 0) {
          smoothness -= Math.abs(cellLog - Math.log2(cells[row + 1]![col]!));
        }
      }
    }
    
    return smoothness;
  }
  
  private static calculateWeightedScore(board: GameBoardImpl): number {
    const cells = board.cells;
    
    // 코너 전략을 위한 가중치 매트릭스
    const weights = [
      [15, 14, 13, 12],
      [8,  9,  10, 11],
      [7,  6,  5,  4],
      [0,  1,  2,  3]
    ];
    
    let weightedScore = 0;
    
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const cellValue = cells[row]![col]!;
        if (cellValue > 0) {
          weightedScore += cellValue * Math.log2(cellValue) * weights[row]![col]!;
        }
      }
    }
    
    return weightedScore;
  }
}

async function runExpectimaxSimulation(): Promise<void> {
  console.log('🎯 Expectimax AI Simulation Starting...');
  console.log('Algorithm: Expectimax with depth 4');
  console.log('Strategy: Corner + Monotonicity + Smoothness\n');
  
  let board = new GameBoardImpl();
  
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
  const maxMoves = 10000;
  let maxTileReached = 2;
  const milestones = [4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096];
  
  const startTime = Date.now();
  
  while (!board.isGameOver && moveCount < maxMoves) {
    console.log(`\nMove ${moveCount + 1}: Thinking...`);
    
    const moveStartTime = Date.now();
    const move = ExpectimaxAI.getBestMove(board);
    const moveTime = Date.now() - moveStartTime;
    
    if (!move) {
      console.log('No valid moves available');
      break;
    }
    
    const result = board.move(move);
    if (result.moved) {
      board = result.board as GameBoardImpl;
      addRandomTile();
      moveCount++;
      
      const currentMaxTile = board.getMaxTile();
      if (currentMaxTile > maxTileReached && milestones.includes(currentMaxTile)) {
        maxTileReached = currentMaxTile;
        console.log(`🎉 MILESTONE: ${maxTileReached} reached! (Move ${moveCount}, ${moveTime}ms)`);
        
        if (maxTileReached >= 2048) {
          console.log('🏆 SUCCESS! Reached 2048! 🎉🎉🎉');
          break;
        }
      }
      
      console.log(`Moved ${move}, Score: ${board.score}, Max: ${board.getMaxTile()}, Empty: ${board.getEmptyCells().length}, Time: ${moveTime}ms`);
      
      if (moveCount % 50 === 0) {
        const elapsed = (Date.now() - startTime) / 1000;
        console.log(`\n⏱️ Progress: ${moveCount} moves in ${elapsed.toFixed(1)}s`);
      }
    }
  }
  
  const totalTime = (Date.now() - startTime) / 1000;
  
  console.log('\n🎮 Expectimax AI Final Results:');
  console.log('═'.repeat(40));
  console.log(`Moves: ${moveCount}`);
  console.log(`Time: ${totalTime.toFixed(1)} seconds`);
  console.log(`Avg time per move: ${(totalTime / moveCount * 1000).toFixed(0)}ms`);
  console.log(`Final Score: ${board.score}`);
  console.log(`Max Tile: ${board.getMaxTile()}`);
  console.log(`Success Rate: ${board.getMaxTile() >= 2048 ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`Game Over: ${board.isGameOver}`);
  
  // 최종 보드 출력
  console.log('\n🎯 Final Board:');
  console.log('┌────┬────┬────┬────┐');
  for (let row = 0; row < board.size; row++) {
    const rowString = board.cells[row]!
      .map(cell => cell === 0 ? '    ' : cell.toString().padStart(4))
      .join('│');
    console.log('│' + rowString + '│');
    if (row < board.size - 1) {
      console.log('├────┼────┼────┼────┤');
    }
  }
  console.log('└────┴────┴────┴────┘');
  
  // 성과 분석
  if (board.getMaxTile() >= 2048) {
    console.log('\n🎊 CONGRATULATIONS! This AI successfully reached 2048!');
    console.log('This proves the game logic and AI algorithm are working correctly.');
  } else {
    console.log(`\n📊 Analysis: Reached ${board.getMaxTile()} in ${moveCount} moves.`);
    console.log('The AI strategy could be further improved with more sophisticated evaluation.');
  }
}

// Expectimax AI 시뮬레이션 실행
runExpectimaxSimulation().catch(console.error);