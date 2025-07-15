import { GameBoardImpl, Direction, GameRules } from './domain';

class AdvancedAI {
  // 코너 전략을 사용하는 고급 AI
  static getBestMove(board: GameBoardImpl): Direction | null {
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
    const cells = board.cells;
    let score = 0;
    
    // 1. 빈 공간 점수 (매우 중요)
    const emptyCells = board.getEmptyCells().length;
    score += emptyCells * 1000;
    
    // 2. 최대 타일이 코너에 있는지 확인
    const maxTile = board.getMaxTile();
    const corners = [
      cells[0]![0], // 좌상
      cells[0]![3], // 우상  
      cells[3]![0], // 좌하
      cells[3]![3], // 우하
    ];
    
    if (corners.includes(maxTile)) {
      score += 10000;
      
      // 최대 타일이 좌하 코너에 있으면 추가 보너스
      if (cells[3]![0] === maxTile) {
        score += 5000;
      }
    }
    
    // 3. 단조성 (monotonicity) - 한 방향으로 정렬되어 있는 정도
    score += this.calculateMonotonicity(board) * 100;
    
    // 4. 부드러움 (smoothness) - 인접한 타일들의 값 차이
    score += this.calculateSmoothness(board) * 10;
    
    // 5. 큰 타일들이 가장자리에 모여있는지
    score += this.calculateEdgeScore(board) * 50;
    
    // 6. 게임 점수도 포함
    score += board.score;
    
    return score;
  }
  
  private static calculateMonotonicity(board: GameBoardImpl): number {
    const cells = board.cells;
    let mono = 0;
    
    // 행 단조성 (좌->우 내림차순 선호)
    for (let row = 0; row < 4; row++) {
      let current = 0;
      let next = 1;
      
      while (next < 4) {
        while (next < 4 && cells[row]![next] === 0) next++;
        if (next >= 4) break;
        
        const currentVal = cells[row]![current] || 0;
        const nextVal = cells[row]![next] || 0;
        
        if (currentVal > nextVal) {
          mono += currentVal - nextVal;
        } else {
          mono -= nextVal - currentVal;
        }
        
        current = next;
        next++;
      }
    }
    
    // 열 단조성 (위->아래 내림차순 선호)
    for (let col = 0; col < 4; col++) {
      let current = 0;
      let next = 1;
      
      while (next < 4) {
        while (next < 4 && cells[next]![col] === 0) next++;
        if (next >= 4) break;
        
        const currentVal = cells[current]![col] || 0;
        const nextVal = cells[next]![col] || 0;
        
        if (currentVal > nextVal) {
          mono += currentVal - nextVal;
        } else {
          mono -= nextVal - currentVal;
        }
        
        current = next;
        next++;
      }
    }
    
    return mono;
  }
  
  private static calculateSmoothness(board: GameBoardImpl): number {
    const cells = board.cells;
    let smoothness = 0;
    
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const cellValue = cells[row]![col]!;
        if (cellValue === 0) continue;
        
        // 오른쪽 인접 셀 체크
        if (col < 3) {
          const rightValue = cells[row]![col + 1]!;
          if (rightValue !== 0) {
            smoothness -= Math.abs(Math.log2(cellValue) - Math.log2(rightValue));
          }
        }
        
        // 아래쪽 인접 셀 체크
        if (row < 3) {
          const downValue = cells[row + 1]![col]!;
          if (downValue !== 0) {
            smoothness -= Math.abs(Math.log2(cellValue) - Math.log2(downValue));
          }
        }
      }
    }
    
    return smoothness;
  }
  
  private static calculateEdgeScore(board: GameBoardImpl): number {
    const cells = board.cells;
    let edgeScore = 0;
    
    // 가장자리 보너스
    for (let i = 0; i < 4; i++) {
      edgeScore += cells[0]![i]!; // 상단
      edgeScore += cells[3]![i]!; // 하단
      edgeScore += cells[i]![0]!; // 좌측
      edgeScore += cells[i]![3]!; // 우측
    }
    
    return edgeScore;
  }
  
  // 휴리스틱: 특정 위험한 상황 피하기
  static isRiskyMove(board: GameBoardImpl, direction: Direction): boolean {
    const result = board.move(direction);
    const newBoard = result.board as GameBoardImpl;
    
    // 빈 공간이 너무 적어지면 위험
    if (newBoard.getEmptyCells().length <= 1) {
      return true;
    }
    
    // 최대 타일이 코너에서 벗어나면 위험
    const maxTile = board.getMaxTile();
    const newMaxTile = newBoard.getMaxTile();
    
    if (maxTile === newMaxTile && !GameRules.isOptimalBoardState(newBoard)) {
      return true;
    }
    
    return false;
  }
}

async function runAdvancedAISimulation(): Promise<void> {
  console.log('🧠 Advanced AI Simulation Starting...\n');
  
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
  const maxMoves = 5000; // 더 많은 시도
  let maxTileReached = 2;
  
  console.log('Target: Reach 2048 tile 🎯');
  console.log('Strategy: Corner strategy with monotonicity\n');
  
  while (!board.isGameOver && moveCount < maxMoves) {
    const move = AdvancedAI.getBestMove(board);
    
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
      if (currentMaxTile > maxTileReached) {
        maxTileReached = currentMaxTile;
        console.log(`🎉 New max tile: ${maxTileReached} (Move ${moveCount})`);
        
        if (maxTileReached >= 2048) {
          console.log('🏆 SUCCESS! Reached 2048!');
          break;
        }
      }
      
      if (moveCount % 100 === 0) {
        console.log(`Move ${moveCount}: Score ${board.score}, Max: ${board.getMaxTile()}, Empty: ${board.getEmptyCells().length}`);
      }
    }
  }
  
  console.log('\n📊 Advanced AI Results:');
  console.log(`Moves: ${moveCount}`);
  console.log(`Final Score: ${board.score}`);
  console.log(`Max Tile Reached: ${board.getMaxTile()}`);
  console.log(`Success: ${board.getMaxTile() >= 2048 ? 'YES 🎉' : 'NO 😞'}`);
  console.log(`Game Over: ${board.isGameOver}`);
  
  // 최종 보드 출력
  console.log('\nFinal Board:');
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
}

// 고급 AI 시뮬레이션 실행
runAdvancedAISimulation().catch(console.error);