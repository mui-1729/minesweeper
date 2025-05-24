'use client';

import { useEffect, useState } from 'react';
import styles from './page.module.css';

type cellAction = 'none' | 'open' | 'flag' | null;

const directions = [
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 0],
  [-1, -1],
  [0, -1],
  [1, -1],
  [-1, 1],
];

// 初手マップ生成
const generateBomb = (firstX: number, firstY: number) => {
  const newMap: number[][] = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => 0));
  let bombPlace = 0;

  while (bombPlace < 10) {
    const x = Math.floor(Math.random() * 9);
    const y = Math.floor(Math.random() * 9);

    if (Math.abs(x - firstX) <= 1 && Math.abs(y - firstY) <= 1) continue;

    if ((x !== firstX || y !== firstY) && newMap[y][x] === 0) {
      newMap[y][x] = 1;
      bombPlace++;
    }
  }
  return newMap;
};

// 周囲のボム確認
const countBoardAround = (x: number, y: number, bombMap: number[][]) => {
  return directions.reduce((bombCount, [dx, dy]) => {
    const nx = x + dx,
      ny = y + dy;
    if (nx >= 0 && nx < 9 && ny >= 0 && ny < 9 && bombMap[ny][nx] === 1) {
      return bombCount + 1;
    }
    return bombCount;
  }, 0);
};

const calcBoard = (userInputs: cellAction[][], bombMap: number[][]): number[][] => {
  const currentBoard = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => -1));
  const alreadyVisited = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => false));

  // 再起関数
  const blankChain = (x: number, y: number) => {
    if (x < 0 || x >= 9 || y < 0 || y >= 9 || alreadyVisited[y][x] === true) return;

    alreadyVisited[y][x] = true;

    if (bombMap[y][x] === 1) return;

    const count = countBoardAround(x, y, bombMap);
    currentBoard[y][x] = count;

    if (count === 0) {
      for (const [dx, dy] of directions) {
        blankChain(x + dx, y + dy);
      }
    }
  };

  for (let y = 0; y < 9; y++) {
    for (let x = 0; x < 9; x++) {
      if (userInputs[y][x] === 'open') {
        if (bombMap[y][x] === 1) {
          currentBoard[y][x] = -2;
        } else {
          blankChain(x, y);
        }
      }
    }
  }
  return currentBoard;
};

export default function Home() {
  const [seconds, setSeconds] = useState(0);
  const [userInputs, setUserInputs] = useState<cellAction[][]>(
    Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => null)),
  );
  const [bombMap, setBombMap] = useState<number[][] | null>(null);

  const LeftClickHandler = (x: number, y: number) => {
    if (bombMap === null) {
      setBombMap(generateBomb(x, y));
    }

    setUserInputs((prev) => {
      const newInputs = prev.map((row) => [...row]);
      newInputs[y][x] = 'open';
      return newInputs;
    });
  };

  const RightClickHandler = (event: React.MouseEvent, x: number, y: number) => {
    event.preventDefault();

    setUserInputs((prev) => {
      const newInputs = prev.map((row) => [...row]);
      const states: cellAction[] = [null, 'flag', 'none'];
      const currentIndex = states.indexOf(newInputs[y][x]);
      const nextIndex = (currentIndex + 1) % states.length;
      newInputs[y][x] = states[nextIndex];
      return newInputs;
    });
  };

  const handleReset = () => {
    setUserInputs(Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => null)));
    setBombMap(null);
    setSeconds(0);
  };

  useEffect(() => {
    if (bombMap === null) {
      setSeconds(0);
    }
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [bombMap]);

  const board = bombMap ? calcBoard(userInputs, bombMap) : null;

  return (
    <div className={styles.container}>
      <div className={styles.timer}>
        Time: {seconds}秒<button onClick={handleReset}>リセット</button>
      </div>
      {userInputs.map((row, y) => (
        <div key={y} className={styles.row}>
          {row.map((cell, x) => {
            const suffix = cell === -1 ? 'Hide' : `${cell}`;
            const className = [styles.cell, styles[`cell${suffix}` as keyof typeof styles]].join(
              ' ',
            );

            return (
              <div key={`${y}-${x}`} className={className} onClick={() => clickHandler(x, y)} />
            );
          })}
        </div>
      ))}
    </div>
  );
}
