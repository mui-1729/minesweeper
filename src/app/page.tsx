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

const generateBomb = (X:number, Y:number) => {
  let bombPlace = 0

  while (bombPlace <= 10)  {
    const x = Math.floor(Math.random() * 9)
    const y = Math.floor(Math.random() * 9)

    if ((x !== X || y !== Y) && )
  }
}

const countBoard = (x:number, y:number, bombMap:number[][]) => {
  return directions.reduce((count, [dx, dy]) => {
    const nx = x + dx, ny = y + dy;
    if (nx >= 0 && nx < 9 && ny >= 0 && ny < 9 && bombMap[ny][nx] === 1) {
      count++;
    }
    return count;
  }, 0);
}


export default function Home() {
  const [userInputs, setUserInputs] = useState([
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

  const board = userInputs.map((row, y) => {
    row.map((cell, x) => {
      if (cell === 0) return;
    });
  });

  const

  // const clickHandler = () => {
  //   setuserInputs();
  //   setbombMap();
  // };
  return (
    <div className={styles.container}>
      <div
      key = {`${y}-${x}`}
      className={`cell ${cellClass(userInputs[y][x])}`}
      onClick={() => clickHandler(x, y)}
      <div className={styles.sampleCell} style={{ backgroundPosition: '-30px' }} />
      {/* <button onClick={() => clickHandler()}> クリック </button> */}
      </div>
    </div>
  );
}
