'use client';

import { useState } from 'react';
import styles from './page.module.css';

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

// 再起関数
const connect = (x: number, y: number, bombMap: number[][], newInputs: number[][]) => {
  if (x < 0 || x >= 9 || y < 0 || y >= 9 || newInputs[y][x] !== -1) return;

  const count = countBoardAround(x, y, bombMap);
  newInputs[y][x] = count;

  if (count === 0) {
    for (const [dx, dy] of directions) {
      connect(x + dx, y + dy, bombMap, newInputs);
    }
  }
};

export default function Home() {
  const [isFirstClick, setIsFirstClick] = useState(true);
  const [userInputs, setUserInputs] = useState([
    [-1, -1, -1, -1, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1, -1, -1, -1],
  ]);
  const [bombMap, setBombMap] = useState([
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
  ]);

  const clickHandler = (x: number, y: number) => {
    if (userInputs[y][x] !== -1) return;

    if (isFirstClick === true) {
      const nextMap = generateBomb(x, y);
      setBombMap(nextMap);
      setIsFirstClick(false);
      const count = countBoardAround(x, y, nextMap);
      const newInputs = userInputs.map((row) => [...row]);
      connect(x, y, nextMap, newInputs);
      newInputs[y][x] = count;
      setUserInputs(newInputs);
      return;
    }
    if (bombMap[y][x] === 1) {
      alert('ゲームオーバー');
      return;
    }

    const count = countBoardAround(x, y, bombMap);
    const newInputs = userInputs.map((row) => [...row]);
    newInputs[y][x] = count;
    connect(x, y, bombMap, newInputs);
    setUserInputs(newInputs);
  };

  return (
    <div className={styles.container}>
      {userInputs.map((row, y) => (
        <div key={y} className={styles.row}>
          {row.map((cell, x) => {
            const suffix = cell === -1 ? 'hide' : `${cell}`;
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
