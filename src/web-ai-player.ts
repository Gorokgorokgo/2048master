import { WebGameController } from './infrastructure/WebGameController';
import { GameBoardImpl, Direction, GameRules } from './domain';

class WebAIPlayer {
  private webController: WebGameController;
  private moveCount = 0;
  private maxTileReached = 2;
  private startTime = Date.now();

  constructor() {
    this.webController = new WebGameController();
  }


  async playGame(): Promise<void> {
    try {
      await this.webController.initialize();

      // 초기 상태 확인
      const initialBoard = await this.webController.getCurrentBoard();
      const totalTiles = initialBoard.flat().filter(x => x > 0).length;

      if (totalTiles === 0) {
        await this.webController.makeMove(Direction.LEFT);
        await new Promise(resolve => setTimeout(resolve, 50));

        const testBoard = await this.webController.getCurrentBoard();
        const testTiles = testBoard.flat().filter(x => x > 0).length;

        if (testTiles === 0) {
          await this.webController.clickCenter();
          await new Promise(resolve => setTimeout(resolve, 50));
          await this.webController.makeMove(Direction.RIGHT);
          await new Promise(resolve => setTimeout(resolve, 50));

          const finalTestBoard = await this.webController.getCurrentBoard();
          const finalTestTiles = finalTestBoard
            .flat()
            .filter(x => x > 0).length;

          if (finalTestTiles === 0) {
            return;
          }
        }
      }

      let gameOver = false;
      let won = false;
      const maxMoves = 5000; // 충분히 많은 움직임
      let failedMoves = 0;

      while (
        !gameOver &&
        !won &&
        this.moveCount < maxMoves &&
        failedMoves < 10
      ) {
        try {
          // 현재 보드 상태 가져오기
          const boardMatrix = await this.webController.getCurrentBoard();
          const score = await this.webController.getScore();

          const gameBoard = new GameBoardImpl(boardMatrix, score);
          const bestMove = this.getBestMove(gameBoard);

          if (!bestMove) break;


          // 이전 보드 상태 저장
          const prevBoard = JSON.stringify(boardMatrix);

          // 웹에서 움직임 실행
          const moveSuccessful = await this.webController.makeMove(bestMove);

          if (moveSuccessful) {

            const newBoardMatrix = await this.webController.getCurrentBoard();
            const newBoard = JSON.stringify(newBoardMatrix);

            // 보드가 실제로 바뀌었는지 확인
            if (prevBoard !== newBoard) {
              this.moveCount++;
              failedMoves = 0; // 성공하면 실패 카운트 리셋

              const newScore = await this.webController.getScore();
              const currentMaxTile = Math.max(...newBoardMatrix.flat());

              if (currentMaxTile > this.maxTileReached) {
                this.maxTileReached = currentMaxTile;
                if (this.maxTileReached >= 2048) {
                  won = true;
                  break;
                }
              }

              if (this.moveCount % 1000 === 0) {
                console.log(`Move ${this.moveCount}: Score ${newScore}, Max ${this.maxTileReached}`);
              }

              // 게임 종료 조건 확인
              gameOver = await this.webController.isGameOver();
              won = await this.webController.hasWon();

              if (gameOver) {
                break;
              }
            } else {
              failedMoves++;
            }
          } else {
            failedMoves++;
          }

          // 최고 속도 연산
        } catch (error) {
          console.error('Error in game loop:', error);
          failedMoves++;
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      
      await this.printFinalResults();
      
      // 게임 결과 표시 후 대기 (웹사이트 닫지 않음)
      console.log('\n게임 완료! 결과를 확인하세요. 브라우저 창은 열린 상태로 유지됩니다.');
      console.log('프로그램을 종료하려면 Ctrl+C를 누르세요.');
      
      // 무한 대기
      while (true) {
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    } catch (error) {
      console.error('Error during game play:', error);
    } finally {
      // Ctrl+C로 종료시에만 정리
      await new Promise(resolve => setTimeout(resolve, 1000));
      await this.webController.close();
    }
  }

  private getBestMove(board: GameBoardImpl): Direction | null {
    const possibleMoves = GameRules.getPossibleMoves(board);
    if (possibleMoves.length === 0) return null;
    
    // 각 방향을 시뮬레이션하고 실제 결과를 평가
    let bestMove = possibleMoves[0]!;
    let bestScore = -Infinity;
    
    for (const move of possibleMoves) {
      const score = this.evaluateMove(board, move);
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    
    return bestMove;
  }

  private evaluateMove(board: GameBoardImpl, direction: Direction): number {
    // 해당 방향으로 실제 이동했을 때의 결과를 시뮬레이션
    const result = board.move(direction);
    if (!result.moved) return -1000; // 움직일 수 없으면 최악
    
    const newBoard = result.board;
    const matrix = newBoard.cells.map(row => [...row]);
    let score = 0;
    
    // 1. 빈 칸 수 (가장 중요)
    const emptyCells = matrix.flat().filter(x => x === 0).length;
    score += emptyCells * 200;
    
    // 2. 병합으로 얻은 점수 (높은 가중치)
    score += result.score * 5;
    
    // 3. 4번째 줄 (1-2-3-4) 최우선 평가 - 매우 높은 가중치
    const row4 = [matrix[3]?.[0] || 0, matrix[3]?.[1] || 0, matrix[3]?.[2] || 0, matrix[3]?.[3] || 0];
    
    // 4번째 줄의 총합 (큰 타일들이 모여있을수록 좋음)
    const row4Sum = row4.reduce((sum, val) => sum + val, 0);
    score += row4Sum * 3; // 4번째 줄 집중도 보너스
    
    // 4번째 줄 내에서 왼쪽이 클수록 좋음 (강한 가중치)
    for (let i = 0; i < 3; i++) {
      if (row4[i]! > 0 && row4[i + 1]! > 0) {
        if (row4[i]! >= row4[i + 1]!) {
          score += row4[i]! * 5; // 강한 보너스
        } else {
          score -= (row4[i + 1]! - row4[i]!) * 10; // 강한 페널티
        }
      }
    }
    
    // 1번 자리가 전체 최대값이면 매우 큰 보너스
    const maxTile = Math.max(...matrix.flat());
    if (matrix[3]?.[0] === maxTile && maxTile > 0) {
      score += maxTile * 15; // 매우 큰 보너스
    } else if (matrix[3]?.[0] !== maxTile && maxTile > 0) {
      score -= maxTile * 8; // 강한 페널티
    }
    
    // 3번째 줄 (5-6-7-8) 평가 - 중간 우선순위
    const row3 = [matrix[2]?.[0] || 0, matrix[2]?.[1] || 0, matrix[2]?.[2] || 0, matrix[2]?.[3] || 0];
    const row3Sum = row3.reduce((sum, val) => sum + val, 0);
    score += row3Sum * 1.5; // 3번째 줄 집중도 보너스 (4번째 줄보다 낮음)
    
    for (let i = 0; i < 3; i++) {
      if (row3[i]! > 0 && row3[i + 1]! > 0) {
        if (row3[i]! >= row3[i + 1]!) {
          score += row3[i]! * 2; // 중간 보너스
        } else {
          score -= (row3[i + 1]! - row3[i]!) * 3; // 중간 페널티
        }
      }
    }
    
    // 4. 병합 기회 보너스 - 4번째 줄을 최우선으로
    // 4번째 줄 내에서 인접한 같은 값들 (매우 높은 보너스)
    for (let i = 0; i < 3; i++) {
      if (row4[i]! > 0 && row4[i]! === row4[i + 1]!) {
        score += row4[i]! * 8; // 4번째 줄 병합은 매우 큰 보너스
      }
    }
    
    // 3번째 줄에서 4번째 줄로의 수직 병합 (아래로 이동)
    for (let i = 0; i < 4; i++) {
      const upper = matrix[2]?.[i] || 0; // 3번째 줄
      const lower = matrix[3]?.[i] || 0; // 4번째 줄
      
      if (upper > 0 && lower > 0 && upper === lower) {
        score += upper * 6; // 4번째 줄로의 수직 병합은 높은 보너스
      }
    }
    
    // 3번째 줄 내에서 인접한 같은 값들 (중간 보너스)
    for (let i = 0; i < 3; i++) {
      if (row3[i]! > 0 && row3[i]! === row3[i + 1]!) {
        score += row3[i]! * 3; // 3번째 줄 병합은 중간 보너스
      }
    }
    
    // 기타 수직 병합들 (낮은 보너스)
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 4; col++) {
        const current = matrix[row]?.[col] || 0;
        const below = matrix[row + 1]?.[col] || 0;
        
        if (current > 0 && below > 0 && current === below) {
          score += current * 1; // 일반적인 수직 병합
        }
      }
    }
    
    // 일반적인 병합 기회
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        const current = matrix[i]?.[j] || 0;
        if (current > 0) {
          // 오른쪽 타일과 같으면 보너스
          if (j < 3 && matrix[i]?.[j + 1] === current) {
            score += current * 0.3;
          }
          // 아래쪽 타일과 같으면 보너스
          if (i < 3 && matrix[i + 1]?.[j] === current) {
            score += current * 0.3;
          }
        }
      }
    }
    
    // 5. 방향별 가중치 - 4번째 줄을 채우는 것이 최우선
    // 하지만 실제 결과에 따라 조정
    if (direction === Direction.DOWN) {
      // 아래로 이동이 4번째 줄을 강화시키면 높은 보너스
      score += 10;
    } else if (direction === Direction.LEFT) {
      // 왼쪽으로 이동이 4번째 줄을 정리하면 높은 보너스
      score += 8;
    } else if (direction === Direction.RIGHT) {
      // 오른쪽은 패턴을 망칠 수 있으므로 낮은 보너스
      score += 3;
    } else if (direction === Direction.UP) {
      // 위로 이동은 4번째 줄을 비우므로 최소 보너스
      score += 1;
    }
    
    return score;
  }

  private expectimax(board: GameBoardImpl, move: Direction | null, depth: number, isPlayerTurn: boolean): number {
    if (depth === 0) {
      return this.evaluateBoard(board);
    }
    
    if (isPlayerTurn) {
      // 플레이어 턴: 최대값 선택
      if (!move) return -Infinity;
      
      const newBoard = this.simulatePlayerMove(board, move);
      if (!newBoard) return -Infinity;
      
      return this.expectimax(newBoard, null, depth - 1, false);
    } else {
      // 컴퓨터 턴: 기댓값 계산 (2가 90%, 4가 10% 확률로 나타남)
      const emptyCells = this.getEmptyCells(board);
      if (emptyCells.length === 0) return this.evaluateBoard(board);
      
      let totalScore = 0;
      let totalWeight = 0;
      
      // 빈 칸이 너무 많으면 일부만 계산 (속도 최적화)
      const cellsToCheck = emptyCells.length > 6 ? emptyCells.slice(0, 6) : emptyCells;
      
      for (const cell of cellsToCheck) {
        // 2가 나타날 확률 90%
        const board2 = this.addTileToBoard(board, cell, 2);
        const score2 = this.getBestMoveScore(board2, depth - 1);
        totalScore += score2 * 0.9;
        totalWeight += 0.9;
        
        // 4가 나타날 확률 10%
        const board4 = this.addTileToBoard(board, cell, 4);
        const score4 = this.getBestMoveScore(board4, depth - 1);
        totalScore += score4 * 0.1;
        totalWeight += 0.1;
      }
      
      return totalWeight > 0 ? totalScore / totalWeight : 0;
    }
  }

  private getBestMoveScore(board: GameBoardImpl, depth: number): number {
    const possibleMoves = GameRules.getPossibleMoves(board);
    if (possibleMoves.length === 0) return this.evaluateBoard(board);
    
    let bestScore = -Infinity;
    for (const move of possibleMoves) {
      const score = this.expectimax(board, move, depth, true);
      bestScore = Math.max(bestScore, score);
    }
    
    return bestScore;
  }

  private evaluateBoard(board: GameBoardImpl): number {
    const matrix = board.cells.map(row => [...row]);
    let score = 0;
    
    // 1. 빈 칸 개수 (최우선 - 생존성)
    const emptyCells = matrix.flat().filter(x => x === 0).length;
    score += emptyCells * 15000; // 가중치 증가
    
    // 2. 현재 게임 점수 반영
    const currentScore = board.score;
    score += currentScore * 0.5;
    
    // 3. 최대 타일 크기와 위치 (로그 스케일로 평가)
    const maxTile = Math.max(...matrix.flat());
    const maxTileLogValue = maxTile > 0 ? Math.log2(maxTile) : 0;
    score += maxTileLogValue * 2000;
    
    // 왼쪽 위 모서리에 최대 타일이 있으면 대폭 보너스
    if (matrix[0]?.[0] === maxTile) {
      score += maxTile * 200;
    } else if (matrix[0]?.[3] === maxTile || matrix[3]?.[0] === maxTile) {
      score += maxTile * 100;
    } else if (matrix[3]?.[3] === maxTile) {
      score += maxTile * 50;
    }
    
    // 4. 강화된 모노토닉 정렬 (←, ↓ 패턴 중시)
    score += this.calculateEnhancedMonotonicity(matrix) * 1000;
    
    // 5. 부드러움 (인접 타일 차이 최소화)
    score += this.calculateSmoothness(matrix) * 200;
    
    // 6. 가장자리 정렬 보너스
    score += this.calculateEdgeBonus(matrix) * 300;
    
    // 7. 병합 가능성 (같은 값 인접)
    score += this.calculateMergePotential(matrix) * 500;
    
    // 8. 큰 타일들의 클러스터링 보너스
    score += this.calculateClusterBonus(matrix) * 400;
    
    return score;
  }

  private calculateEdgeBonus(matrix: number[][]): number {
    let bonus = 0;
    
    // 첫 번째 행과 첫 번째 열에 큰 값들이 몰려있으면 보너스
    for (let i = 0; i < 4; i++) {
      bonus += (matrix[0]?.[i] || 0) / 4; // 첫 번째 행
      bonus += (matrix[i]?.[0] || 0) / 4; // 첫 번째 열
    }
    
    return bonus;
  }

  private calculateMergePotential(matrix: number[][]): number {
    let potential = 0;
    
    // 인접한 같은 값들이 있으면 보너스
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        const current = matrix[i]?.[j] || 0;
        if (current > 0) {
          // 오른쪽 체크
          if (j < 3 && matrix[i]?.[j + 1] === current) {
            potential += current;
          }
          // 아래쪽 체크
          if (i < 3 && matrix[i + 1]?.[j] === current) {
            potential += current;
          }
        }
      }
    }
    
    return potential;
  }

  private simulatePlayerMove(board: GameBoardImpl, direction: Direction): GameBoardImpl | null {
    try {
      const result = board.move(direction);
      return result.moved ? new GameBoardImpl(result.board.cells.map(row => [...row]), result.board.score) : null;
    } catch {
      return null;
    }
  }

  private getEmptyCells(board: GameBoardImpl): Array<{row: number, col: number}> {
    const emptyCells: Array<{row: number, col: number}> = [];
    const matrix = board.cells;
    
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (matrix[i]?.[j] === 0) {
          emptyCells.push({row: i, col: j});
        }
      }
    }
    
    return emptyCells;
  }

  private addTileToBoard(board: GameBoardImpl, cell: {row: number, col: number}, value: number): GameBoardImpl {
    const newMatrix = board.cells.map(row => [...row]);
    newMatrix[cell.row]![cell.col] = value;
    return new GameBoardImpl(newMatrix, board.score);
  }

  private calculateEnhancedMonotonicity(matrix: number[][]): number {
    let score = 0;
    
    // 왼쪽→오른쪽 모노토닉 (감소 패턴 선호)
    for (let i = 0; i < 4; i++) {
      let leftToRight = 0;
      let rightToLeft = 0;
      for (let j = 0; j < 3; j++) {
        const curr = matrix[i]?.[j] || 0;
        const next = matrix[i]?.[j + 1] || 0;
        
        if (curr > 0 && next > 0) {
          if (curr >= next) leftToRight += curr; // 왼쪽이 클수록 보너스
          if (curr <= next) rightToLeft += next;
        }
      }
      score += Math.max(leftToRight, rightToLeft);
      // 왼쪽→오른쪽 감소 패턴에 추가 보너스
      if (leftToRight > rightToLeft) score += leftToRight * 0.5;
    }
    
    // 위→아래 모노토닉 (감소 패턴 선호)
    for (let j = 0; j < 4; j++) {
      let topToBottom = 0;
      let bottomToTop = 0;
      for (let i = 0; i < 3; i++) {
        const curr = matrix[i]?.[j] || 0;
        const next = matrix[i + 1]?.[j] || 0;
        
        if (curr > 0 && next > 0) {
          if (curr >= next) topToBottom += curr; // 위쪽이 클수록 보너스
          if (curr <= next) bottomToTop += next;
        }
      }
      score += Math.max(topToBottom, bottomToTop);
      // 위→아래 감소 패턴에 추가 보너스
      if (topToBottom > bottomToTop) score += topToBottom * 0.5;
    }
    
    return score;
  }

  private calculateClusterBonus(matrix: number[][]): number {
    let bonus = 0;
    
    // 큰 타일들이 모여있으면 보너스
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        const current = matrix[i]?.[j] || 0;
        if (current >= 64) { // 64 이상의 타일들만 고려
          let neighbors = 0;
          let neighborSum = 0;
          
          // 상하좌우 이웃 체크
          const directions = [[-1,0], [1,0], [0,-1], [0,1]];
          for (const direction of directions) {
            const [di, dj] = direction;
            const ni = i + di!;
            const nj = j + dj!;
            if (ni >= 0 && ni < 4 && nj >= 0 && nj < 4) {
              const neighbor = matrix[ni]?.[nj] || 0;
              if (neighbor >= 64) {
                neighbors++;
                neighborSum += neighbor;
              }
            }
          }
          
          // 큰 타일 주변에 큰 타일들이 많을수록 보너스
          bonus += current * neighbors * 0.1;
          
          // 특히 왼쪽 위 영역에서 클러스터링이 있으면 추가 보너스
          if (i <= 1 && j <= 1) {
            bonus += current * neighbors * 0.2;
          }
        }
      }
    }
    
    return bonus;
  }

  private calculateSmoothness(matrix: number[][]): number {
    let smooth = 0;
    
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        const curr = matrix[i]?.[j] || 0;
        if (curr !== 0) {
          // 오른쪽
          if (j < 3) {
            const right = matrix[i]?.[j + 1] || 0;
            if (right !== 0) {
              smooth -= Math.abs(Math.log2(curr) - Math.log2(right));
            }
          }
          // 아래
          if (i < 3) {
            const down = matrix[i + 1]?.[j] || 0;
            if (down !== 0) {
              smooth -= Math.abs(Math.log2(curr) - Math.log2(down));
            }
          }
        }
      }
    }
    
    return smooth;
  }




  private async printFinalResults(): Promise<void> {
    const elapsedTime = Math.round((Date.now() - this.startTime) / 1000);
    const finalScore = await this.webController.getScore();

    console.log('\n' + '='.repeat(50));
    console.log('GAME FINISHED');
    console.log('='.repeat(50));
    console.log(`Time: ${elapsedTime}s`);
    console.log(`Moves: ${this.moveCount}`);
    console.log(`Final Score: ${finalScore}`);
    console.log(`Max Tile: ${this.maxTileReached}`);
    console.log(
      `Success: ${this.maxTileReached >= 2048 ? 'YES!' : 'No'}`
    );

    console.log('\nFinal Board:');
    await this.webController.printBoard();

    // 최종 스크린샷
    await this.webController.takeScreenshot(`final_result_${Date.now()}.png`);
  }
}

// 실행
async function main() {
  const player = new WebAIPlayer();
  await player.playGame();
}

main().catch(console.error);
