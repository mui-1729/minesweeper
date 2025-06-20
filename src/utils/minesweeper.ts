import { directions } from '../constants';
import type { cellAction } from '../types';

export const generateBomb = (
  firstX: number,
  firstY: number,
  width: number,
  height: number,
  bombCount: number,
) => {
  const newMap: number[][] = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => 0),
  );
  let bombPlace = 0;

  while (bombPlace < bombCount) {
    const x = Math.floor(Math.random() * width);
    const y = Math.floor(Math.random() * height);

    if (x === firstX && y === firstY) continue;

    if (newMap[y][x] === 0) {
      newMap[y][x] = 1;
      bombPlace++;
    }
  }
  return newMap;
};

export const countBoardAround = (x: number, y: number, bombMap: number[][]) => {
  const height = bombMap.length;
  const width = bombMap[0].length;

  return directions.reduce((bombCount, [dx, dy]) => {
    const nx = x + dx,
      ny = y + dy;
    if (nx >= 0 && nx < width && ny >= 0 && ny < height && bombMap[ny][nx] === 1) {
      return bombCount + 1;
    }
    return bombCount;
  }, 0);
};

export const calcBoard = (userInputs: cellAction[][], bombMap: number[][]): number[][] => {
  const height = userInputs.length;
  const width = userInputs[0].length;
  const currentBoard = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => -1),
  );

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const userInput = userInputs[y][x];
      const isBomb = bombMap[y][x] === 1;

      if (userInput === 'ClickBomb') {
        currentBoard[y][x] = -2;
      } else if (userInput === 'Open') {
        if (isBomb) {
          currentBoard[y][x] = -2;
        } else {
          currentBoard[y][x] = countBoardAround(x, y, bombMap);
        }
      }
    }
  }
  return currentBoard;
};

export const win = (board: number[][], bombMap: number[][]) => {
  for (let y = 0; y < bombMap.length; y++) {
    for (let x = 0; x < bombMap[0].length; x++) {
      if (bombMap[y][x] === 0 && board[y][x] === -1) {
        return false;
      }
    }
  }
  return true;
};

export const lose = (userInputs: cellAction[][], bombMap: number[][]) => {
  for (let y = 0; y < bombMap.length; y++) {
    for (let x = 0; x < bombMap[0].length; x++) {
      if (userInputs[y][x] === 'Open' && bombMap[y][x] === 1) {
        return true;
      }
    }
  }
  return false;
};
