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
      console.log('🚀 Starting Web AI Player for 2048...');
      console.log('🌐 Opening https://play2048.co/');
      
      await this.webController.initialize();
      
      console.log('🔍 Testing initial board reading...');
      
      // 초기 상태 확인
      const initialBoard = await this.webController.getCurrentBoard();
      const initialScore = await this.webController.getScore();
      
      console.log('📊 Initial board matrix:', initialBoard);
      console.log('📊 Initial score:', initialScore);
      
      // 보드가 비어있으면 키 입력 테스트
      const totalTiles = initialBoard.flat().filter(x => x > 0).length;
      console.log(`🎯 Found ${totalTiles} tiles on board`);
      
      if (totalTiles === 0) {
        console.log('⚠️ No tiles found! Testing key input...');
        console.log('🔧 Trying to send arrow key to start game...');
        
        // 화살표 키를 눌러서 게임 시작 시도
        await this.webController.makeMove(Direction.LEFT);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const testBoard = await this.webController.getCurrentBoard();
        const testTiles = testBoard.flat().filter(x => x > 0).length;
        console.log(`🎯 After key press, found ${testTiles} tiles`);
        
        if (testTiles === 0) {
          console.log('❌ Still no tiles found. Game may not be properly loaded.');
          console.log('🔧 Trying to click on page and retry...');
          
          // 페이지 중앙 클릭 시도
          await this.webController.clickCenter();
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          await this.webController.makeMove(Direction.RIGHT);
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const finalTestBoard = await this.webController.getCurrentBoard();
          const finalTestTiles = finalTestBoard.flat().filter(x => x > 0).length;
          console.log(`🎯 After click and key, found ${finalTestTiles} tiles`);
          
          if (finalTestTiles === 0) {
            console.log('❌ Game does not seem to be working. Exiting...');
            return;
          }
        }
      }
      
      await this.webController.printBoard();
      
      let gameOver = false;
      let won = false;
      const maxMoves = 5000; // 충분히 많은 움직임
      let failedMoves = 0;
      
      console.log('🎮 Starting AI gameplay...');
      
      while (!gameOver && !won && this.moveCount < maxMoves && failedMoves < 10) {
        try {
          // 현재 보드 상태 가져오기
          const boardMatrix = await this.webController.getCurrentBoard();
          const score = await this.webController.getScore();
          
          console.log(`Move ${this.moveCount + 1}: Current board has ${boardMatrix.flat().filter(x => x > 0).length} tiles`);
          
          // 도메인 모델로 변환
          const gameBoard = new GameBoardImpl(boardMatrix, score);
          
          // AI가 최적의 움직임 결정
          const bestMove = this.getBestMove(gameBoard);
          
          if (!bestMove) {
            console.log('❌ No valid moves available from AI');
            break;
          }
          
          console.log(`🤖 AI chooses: ${this.getDirectionName(bestMove)}`);
          
          // 이전 보드 상태 저장
          const prevBoard = JSON.stringify(boardMatrix);
          
          // 웹에서 움직임 실행
          const moveSuccessful = await this.webController.makeMove(bestMove);
          
          if (moveSuccessful) {
            // 잠시 대기 후 새 상태 확인
            await new Promise(resolve => setTimeout(resolve, 500));
            
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
                console.log(`🎉 New max tile: ${this.maxTileReached} (Move ${this.moveCount})`);
                
                if (this.maxTileReached >= 2048) {
                  console.log('🏆 SUCCESS! Reached 2048!');
                  won = true;
                  break;
                }
              }
              
              // 진행 상황 출력
              if (this.moveCount % 5 === 0) {
                console.log(`Move ${this.moveCount}: Score: ${newScore}, Max: ${this.maxTileReached}`);
                await this.webController.printBoard();
              } else {
                console.log(`Move ${this.moveCount}: Score: ${newScore}, Tiles: ${newBoardMatrix.flat().filter(x => x > 0).length}`);
              }
              
              // 게임 종료 조건 확인
              gameOver = await this.webController.isGameOver();
              won = await this.webController.hasWon();
              
              // 게임 종료가 아니면 계속 진행
              if (gameOver) {
                console.log('🔚 Game Over detected');
                break;
              }
              
            } else {
              console.log(`⚠️ Board didn't change after move ${this.getDirectionName(bestMove)}`);
              failedMoves++;
              
              // 보드가 바뀌지 않으면 다른 방향 시도
              if (failedMoves < 4) {
                console.log('🔄 Trying different move...');
              }
            }
            
          } else {
            console.log(`❌ Failed to execute move: ${this.getDirectionName(bestMove)}`);
            failedMoves++;
          }
          
          // 잠시 대기
          await new Promise(resolve => setTimeout(resolve, 200));
          
        } catch (error) {
          console.error('Error in game loop:', error);
          failedMoves++;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      if (failedMoves >= 10) {
        console.log('❌ Too many failed moves. Stopping...');
      }
      
      await this.printFinalResults();
      
    } catch (error) {
      console.error('Error during game play:', error);
    } finally {
      console.log('🔄 Waiting 5 seconds before closing browser...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      await this.webController.close();
    }
  }
  
  private getBestMove(board: GameBoardImpl): Direction | null {
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
  
  private evaluateBoard(board: GameBoardImpl): number {
    const cells = board.cells;
    let score = 0;
    
    // 1. 빈 공간 (매우 중요)
    const emptyCells = board.getEmptyCells().length;
    score += emptyCells * 1000;
    
    // 2. 최대 타일이 코너에 있는지
    const maxTile = board.getMaxTile();
    const corners = [
      cells[0]![0], cells[0]![3], 
      cells[3]![0], cells[3]![3]
    ];
    
    if (corners.includes(maxTile)) {
      score += 10000;
      // 좌하 코너 선호
      if (cells[3]![0] === maxTile) {
        score += 5000;
      }
    }
    
    // 3. 단조성 - 큰 타일들이 한쪽으로 몰려있는 정도
    score += this.calculateMonotonicity(board) * 100;
    
    // 4. 부드러움 - 인접한 타일들의 차이가 적을수록 좋음
    score += this.calculateSmoothness(board) * 10;
    
    // 5. 게임 점수
    score += board.score;
    
    return score;
  }
  
  private calculateMonotonicity(board: GameBoardImpl): number {
    const cells = board.cells;
    let mono = 0;
    
    // 행 단조성 (좌->우)
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 3; col++) {
        const current = cells[row]![col] || 0;
        const next = cells[row]![col + 1] || 0;
        if (current !== 0 && next !== 0) {
          if (current >= next) mono += 1;
          else mono -= 1;
        }
      }
    }
    
    // 열 단조성 (위->아래)
    for (let col = 0; col < 4; col++) {
      for (let row = 0; row < 3; row++) {
        const current = cells[row]![col] || 0;
        const next = cells[row + 1]![col] || 0;
        if (current !== 0 && next !== 0) {
          if (current >= next) mono += 1;
          else mono -= 1;
        }
      }
    }
    
    return mono;
  }
  
  private calculateSmoothness(board: GameBoardImpl): number {
    const cells = board.cells;
    let smoothness = 0;
    
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const cellValue = cells[row]![col]!;
        if (cellValue === 0) continue;
        
        // 오른쪽 체크
        if (col < 3) {
          const rightValue = cells[row]![col + 1]!;
          if (rightValue !== 0) {
            smoothness -= Math.abs(Math.log2(cellValue) - Math.log2(rightValue));
          }
        }
        
        // 아래쪽 체크
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
  
  private getDirectionName(direction: Direction): string {
    switch (direction) {
      case Direction.UP: return '↑ UP';
      case Direction.DOWN: return '↓ DOWN';
      case Direction.LEFT: return '← LEFT';
      case Direction.RIGHT: return '→ RIGHT';
      default: return '?';
    }
  }
  
  private async printFinalResults(): Promise<void> {
    const elapsedTime = Math.round((Date.now() - this.startTime) / 1000);
    const finalScore = await this.webController.getScore();
    
    console.log('\n' + '='.repeat(50));
    console.log('🎮 GAME FINISHED');
    console.log('='.repeat(50));
    console.log(`⏱️  Time: ${elapsedTime}s`);
    console.log(`🎯 Moves: ${this.moveCount}`);
    console.log(`📊 Final Score: ${finalScore}`);
    console.log(`🏆 Max Tile: ${this.maxTileReached}`);
    console.log(`✨ Success: ${this.maxTileReached >= 2048 ? 'YES! 🎉' : 'No 😞'}`);
    
    console.log('\n📋 Final Board:');
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