import {
  Builder,
  By,
  Key,
  WebDriver,
  until,
  WebElement,
} from 'selenium-webdriver';
import { Direction } from '../domain/types';

export class WebGameController {
  private driver: WebDriver | null = null;
  private gameUrl = 'https://2048game.com/';

  async initialize(): Promise<void> {
    this.driver = await new Builder().forBrowser('chrome').build();
    await this.driver.get(this.gameUrl);


    await this.driver.sleep(10);
    
    // 페이지가 완전히 로드될 때까지 대기
    await this.driver.wait(until.elementLocated(By.css('body')), 10000);

    // 페이지 소스 일부 확인
    await this.driver.getTitle();

    // "New Game" 버튼 찾아서 클릭
    try {
      const newGameSelectors = [
        '.restart-button',
        '.new-game-button', 
        'button.restart-button',
        '.restart',
        'button[class*="restart"]',
        'button[class*="new-game"]',
        '.game-intro button',
        '.above-game button',
      ];

      let newGameFound = false;
      for (const selector of newGameSelectors) {
        try {
          const elements = await this.driver.findElements(By.css(selector));
          if (elements.length > 0) {
            await elements[0]!.click();
            newGameFound = true;
            break;
          }
        } catch (e) {
          // CSS selector 문법 오류 등 무시
        }
      }

      // CSS contains는 Selenium에서 지원하지 않으므로 xpath 사용
      if (!newGameFound) {
        try {
          const newGameButton = await this.driver.findElement(
            By.xpath(
              "//button[contains(text(), 'New Game')] | //*[contains(text(), 'New Game')]"
            )
          );
          await newGameButton.click();
          newGameFound = true;
        } catch (e) {
        }
      }

      if (newGameFound) {
      }
    } catch (error) {
    }

    // 튜토리얼 건너뛰기 시도
    try {
      const skipButtons = await this.driver.findElements(
        By.xpath(
          "//*[contains(text(), 'Skip')] | //*[contains(text(), 'Close')] | //*[contains(text(), 'Play')]"
        )
      );
      if (skipButtons.length > 0) {
        await skipButtons[0]!.click();
        await this.driver.sleep(5);
      }
    } catch (e) {
    }

    // 게임 시작을 위한 적극적인 접근
    try {
      
      // 페이지의 여러 위치를 클릭해서 게임을 활성화
      const clickTargets = [
        'body',
        '.game-container', 
        '.grid-container',
        '.tile-container',
        '#game-container',
        'main',
        '.above-game'
      ];
      
      for (const target of clickTargets) {
        try {
          const element = await this.driver.findElement(By.css(target));
          await element.click();
          } catch (e) {
          // 요소가 없으면 무시
        }
      }
      
      // 키 입력으로 게임 시작 시도
      const body = await this.driver.findElement(By.css('body'));
      await body.sendKeys(Key.ARROW_RIGHT, Key.ARROW_LEFT, Key.ARROW_UP, Key.ARROW_DOWN);
      
    } catch (error) {
    }

    // DOM 구조 더 자세히 분석
    try {

      // 숫자가 포함된 요소들 찾기 (타일일 가능성)

      // canvas 요소 확인 (게임이 canvas로 그려질 수 있음)

      // iframe 확인 (게임이 iframe 안에 있을 수 있음)
      const iframes = await this.driver.findElements(By.css('iframe'));

      if (iframes.length > 0) {
        await this.driver.switchTo().frame(iframes[0]!);

        // iframe 내에서 다시 검색


        // iframe에서 나오기
        await this.driver.switchTo().defaultContent();
      }

      // div 요소들을 모두 확인해서 4x4 그리드 패턴 찾기
      const divs = await this.driver.findElements(By.css('div'));

      // 특정 패턴의 class 찾기
      let foundGameBoard = false;
      for (let i = 0; i < Math.min(divs.length, 50); i++) {
        const div = divs[i]!;
        const className = (await div.getAttribute('class')) || '';
        const id = (await div.getAttribute('id')) || '';
        const style = (await div.getAttribute('style')) || '';

        // 게임 보드일 가능성이 있는 요소들
        if (
          className.includes('board') ||
          className.includes('container') ||
          className.includes('2048') ||
          id.includes('game') ||
          style.includes('grid') ||
          className.includes('svelte')
        ) {
          console.log(
            `🎯 Potential game element: <div> class="${className}" id="${id}" style="${style.substring(0, 100)}"`
          );
          foundGameBoard = true;
        }
      }

      if (!foundGameBoard) {
      }
    } catch (e) {
    }

  }

  async close(): Promise<void> {
    if (this.driver) {
      await this.driver.quit();
      this.driver = null;
    }
  }

  async makeMove(direction: Direction): Promise<boolean> {
    if (!this.driver) {
      throw new Error('Driver not initialized');
    }

    let key: string;
    switch (direction) {
      case Direction.UP:
        key = Key.ARROW_UP;
        break;
      case Direction.DOWN:
        key = Key.ARROW_DOWN;
        break;
      case Direction.LEFT:
        key = Key.ARROW_LEFT;
        break;
      case Direction.RIGHT:
        key = Key.ARROW_RIGHT;
        break;
      default:
        return false;
    }

    try {
      // body에 포커스를 맞추고 키 입력 (더 안정적)
      await this.driver.findElement(By.css('body')).click();
      await this.driver.actions().sendKeys(key).perform();


      return true;
    } catch (error) {
      console.warn(`Failed to make move ${direction}:`, error);
      return false;
    }
  }

  async getCurrentBoard(): Promise<number[][]> {
    if (!this.driver) {
      throw new Error('Driver not initialized');
    }

    const board: number[][] = Array(4)
      .fill(null)
      .map(() => Array(4).fill(0));

    try {
      // play2048.co에 특화된 타일 선택자들
      const tileSelectors = [
        '.tile.tile-position-1-1, .tile.tile-position-1-2, .tile.tile-position-1-3, .tile.tile-position-1-4,' +
        '.tile.tile-position-2-1, .tile.tile-position-2-2, .tile.tile-position-2-3, .tile.tile-position-2-4,' +
        '.tile.tile-position-3-1, .tile.tile-position-3-2, .tile.tile-position-3-3, .tile.tile-position-3-4,' +
        '.tile.tile-position-4-1, .tile.tile-position-4-2, .tile.tile-position-4-3, .tile.tile-position-4-4',
        '.tile',
        '.tile-inner',
        '[class*="tile-position"]',
        '.game-container .tile',
      ];

      let tiles: WebElement[] = [];
      for (const selector of tileSelectors) {
        try {
          tiles = await this.driver.findElements(By.css(selector));
          if (tiles.length > 0) break;
        } catch (e) {
          continue;
        }
      }

      for (const tile of tiles) {
        const classes = await tile.getAttribute('class');
        const text = await tile.getText();

        if (!text || text.trim() === '') continue;

        // 다양한 위치 패턴 시도
        const patterns = [
          /tile-position-(\d+)-(\d+)/,
          /pos-(\d+)-(\d+)/,
          /r(\d+)c(\d+)/,
          /row-(\d+)-col-(\d+)/,
        ];

        let positionFound = false;
        for (const pattern of patterns) {
          const match = classes.match(pattern);
          if (match) {
            const col = parseInt(match[1]!) - 1;
            const row = parseInt(match[2]!) - 1;
            const value = parseInt(text);

            if (row >= 0 && row < 4 && col >= 0 && col < 4 && !isNaN(value)) {
              board[row]![col] = value;
              positionFound = true;
              break;
            }
          }
        }

        if (!positionFound) {
          // 위치 정보를 찾을 수 없으면 스타일에서 추출 시도
          const style = await tile.getAttribute('style');
          if (style) {
            const transformMatch = style.match(/translate(?:3d)?\(([^)]+)\)/);
            if (transformMatch) {
              const coords = transformMatch[1]!.split(',');
              if (coords.length >= 2) {
                const x = parseInt(coords[0]!.replace('px', '')) / 107; // 추정 셀 크기
                const y = parseInt(coords[1]!.replace('px', '')) / 107;
                const col = Math.round(x);
                const row = Math.round(y);
                const value = parseInt(text);

                if (
                  row >= 0 &&
                  row < 4 &&
                  col >= 0 &&
                  col < 4 &&
                  !isNaN(value)
                ) {
                  board[row]![col] = value;
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.warn('Error reading board state:', error);
    }

    return board;
  }

  async getScore(): Promise<number> {
    if (!this.driver) {
      throw new Error('Driver not initialized');
    }

    try {
      const scoreSelectors = [
        '.score-container',
        '.score',
        '#score',
        '[class*="score"]',
        '.current-score',
      ];

      for (const selector of scoreSelectors) {
        try {
          const scoreElement = await this.driver.findElement(By.css(selector));
          const scoreText = await scoreElement.getText();
          const score = parseInt(scoreText.replace(/\D/g, '')) || 0;
          if (score > 0) {
            return score;
          }
        } catch (e) {
          continue;
        }
      }

      return 0;
    } catch (error) {
      console.warn('Error reading score:', error);
      return 0;
    }
  }

  async isGameOver(): Promise<boolean> {
    if (!this.driver) {
      throw new Error('Driver not initialized');
    }

    try {
      // play2048.co의 게임오버 상태 확인
      const gameOverSelectors = [
        '.game-over',
        '.game-message',
        '.game-won',
        '.retry-button',
        '[class*="game-over"]',
        '[class*="game-message"]'
      ];
      
      for (const selector of gameOverSelectors) {
        try {
          const elements = await this.driver.findElements(By.css(selector));
          if (elements.length > 0) {
            const text = await elements[0]!.getText();
            if (text.includes('Game Over') || text.includes('Try Again') || text.includes('game over')) {
              return true;
            }
          }
        } catch (e) {
          continue;
        }
      }
      
      return false;
    } catch (error) {
      return false;
    }
  }

  async hasWon(): Promise<boolean> {
    if (!this.driver) {
      throw new Error('Driver not initialized');
    }

    try {
      // "You Win!" 메시지 확인
      const winElements = await this.driver.findElements(
        By.className('game-won')
      );
      return winElements.length > 0;
    } catch (error) {
      return false;
    }
  }

  async restartGame(): Promise<void> {
    if (!this.driver) {
      throw new Error('Driver not initialized');
    }

    try {
      // "Try Again" 버튼 찾기
      const retryButton = await this.driver.findElement(
        By.className('retry-button')
      );
      await retryButton.click();

      // 게임이 재시작될 때까지 대기 (2배 빠르게)
    } catch (error) {
      // 버튼이 없으면 페이지 새로고침
      await this.driver.navigate().refresh();
      await this.driver.wait(
        until.elementLocated(By.className('grid-container')),
        5000
      );
    }
  }

  async takeScreenshot(filename: string): Promise<void> {
    if (!this.driver) {
      throw new Error('Driver not initialized');
    }

    const screenshot = await this.driver.takeScreenshot();
    const fs = require('fs');
    fs.writeFileSync(filename, screenshot, 'base64');
  }

  async clickCenter(): Promise<void> {
    if (!this.driver) {
      throw new Error('Driver not initialized');
    }

    try {
      // 페이지 중앙 클릭
      const body = await this.driver.findElement(By.css('body'));
      await body.click();
    } catch (error) {
      console.warn('Failed to click center:', error);
    }
  }

  async printBoard(): Promise<void> {
    const board = await this.getCurrentBoard();
    const score = await this.getScore();

    console.log(`\n📊 Current Score: ${score}`);
    console.log('┌────┬────┬────┬────┐');
    for (let row = 0; row < 4; row++) {
      const rowString = board[row]!.map(cell =>
        cell === 0 ? '    ' : cell.toString().padStart(4)
      ).join('│');
      console.log('│' + rowString + '│');
      if (row < 3) {
        console.log('├────┼────┼────┼────┤');
      }
    }
    console.log('└────┴────┴────┴────┘');
  }
}
