'use client';

import { useEffect, useState } from 'react';
import styles from './page.module.css';

type cellAction = 'None' | 'Open' | 'Flag' | null;
type Setting = {
  width: number;
  height: number;
  bombCount: number;
};
type basicLevel = 'easy' | 'normal' | 'hard';
type Level = basicLevel | 'custom';

const BasicSetting: Record<basicLevel, Setting> = {
  easy: { width: 9, height: 9, bombCount: 10 },
  normal: { width: 16, height: 16, bombCount: 40 },
  hard: { width: 30, height: 16, bombCount: 99 },
};
//方向
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

// ゲームオーバー判定
let isGameFinish = false;

// 初手マップ生成
const generateBomb = (
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

const calcBoard = (userInputs: cellAction[][], bombMap: number[][]): number[][] => {
  const height = userInputs.length;
  const width = userInputs[0].length;
  if (bombMap === null)
    return Array.from({ length: height }, () => Array.from({ length: width }, () => -1));

  const currentBoard = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => -1),
  );

  // 再起関数
  const blankChain = (x: number, y: number) => {
    if (x < 0 || x >= width || y < 0 || y >= height || currentBoard[y][x] !== -1) return;

    if (bombMap[y][x] === 1) return;

    const count = countBoardAround(x, y, bombMap);
    currentBoard[y][x] = count;

    if (count === 0) {
      for (const [dx, dy] of directions) {
        blankChain(x + dx, y + dy);
      }
    }
  };

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (userInputs[y][x] === 'Open') {
        currentBoard[y][x] = bombMap[y][x] === 1 ? -2 : currentBoard[y][x];
        if (bombMap[y][x] !== 1) {
          blankChain(x, y);
        }
      }
    }
  }
  return currentBoard;
};

export default function Home() {
  const [level, setLevel] = useState<Level>('easy');
  const [customSetting, setCustomSetting] = useState<Setting>({
    width: 9,
    height: 9,
    bombCount: 10,
  });

  const currentSetting: Setting = level === 'custom' ? customSetting : BasicSetting[level];
  const { width, height, bombCount } = currentSetting;

  const [seconds, setSeconds] = useState(0);
  const [userInputs, setUserInputs] = useState<cellAction[][]>(
    Array.from({ length: height }, () => Array.from({ length: width }, () => null)),
  );
  const [bombMap, setBombMap] = useState<number[][]>(
    Array.from({ length: height }, () => Array.from({ length: width }, () => 0)),
  );

  // 計算値
  const board = calcBoard(userInputs, bombMap);

  useEffect(() => {
    const newInputs = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => null),
    );
    const newBombMap = Array.from({ length: height }, () => Array.from({ length: width }, () => 0));
    setUserInputs(newInputs);
    setBombMap(newBombMap);
  }, [level, customSetting, height, width]);

  const isFirstMap = bombMap.every((row) => row.every((cell) => cell === 0));

  const RightClickHandler = (event: React.MouseEvent, x: number, y: number) => {
    event.preventDefault();

    if (isGameFinish === true) return;

    setUserInputs((prev) => {
      const newInputs = prev.map((row) => [...row]);
      const states: cellAction[] = [null, 'Flag', 'None'];
      const currentIndex = states.indexOf(newInputs[y][x]);
      const nextIndex = (currentIndex + 1) % states.length;
      newInputs[y][x] = states[nextIndex];
      return newInputs;
    });
  };

  const LeftClickHandler = (x: number, y: number) => {
    if (isGameFinish === true) return;
    if (userInputs[y][x] !== null) return;

    if (isFirstMap === true) {
      setBombMap(generateBomb(x, y, width, height, bombCount));

      setUserInputs((prev) => {
        const newInputs = prev.map((row) => [...row]);
        newInputs[y][x] = 'Open';
        return newInputs;
      });
      return;
    }

    if (bombMap[y][x] === 1) {
      isGameFinish = true;

      setUserInputs((prev) => {
        const newInputs = prev.map((row) => [...row]);
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            if (bombMap[y][x] === 1) {
              newInputs[y][x] = 'Open';
            }
          }
        }
        return newInputs;
      });
      return;
    }
    setUserInputs((prev) => {
      const newInputs = prev.map((row) => [...row]);
      newInputs[y][x] = 'Open';
      return newInputs;
    });
  };

  useEffect(() => {
    if (isGameFinish === true) return;
    if (win(board, bombMap) === true) {
      alert('clear');
      isGameFinish = true;
    }
  }, [board, bombMap]);

  const resetClickHandler = () => {
    isGameFinish = false;
    setUserInputs(Array.from({ length: height }, () => Array.from({ length: width }, () => null)));
    setBombMap(Array.from({ length: height }, () => Array.from({ length: width }, () => 0)));
    setSeconds(0);
  };

  useEffect(() => {
    const isFirstMap = bombMap.every((row) => row.every((cell) => cell === 0));
    if (isFirstMap === true) {
      setSeconds(0);
      isGameFinish = false;
    }
    if (isGameFinish === false) {
      if (win(board, bombMap) === true) {
        isGameFinish = true;
      }
    }
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [board, bombMap]);

  const win = (board: number[][], bombMap: number[][]) => {
    for (let y = 0; y < bombMap.length; y++) {
      for (let x = 0; x < bombMap[0].length; x++) {
        if (bombMap[y][x] === 0 && board[y][x] === -1) {
          return false;
        }
      }
    }
    return true;
  };

  const flagCount = bombCount - userInputs.flat().filter((cell) => cell === 'Flag').length;

  return (
    <div className={styles.container}>
      <select value={level} onChange={(event) => setLevel(event.target.value as Level)}>
        <option value={'easy'}>初級</option>
        <option value={'normal'}>中級</option>
        <option value={'hard'}>上級</option>
        <option value={'custom'}>カスタム</option>
      </select>
      {level === 'custom' && (
        <div className={styles.custom}>
          <label>
            横 :{' '}
            <input
              type="number"
              min={5}
              max={40}
              value={customSetting.width}
              onChange={(event) =>
                setCustomSetting((prev) => ({ ...prev, width: Number(event.target.value) }))
              }
            />
          </label>
          <label>
            縦 :{' '}
            <input
              type="number"
              min={5}
              max={40}
              value={customSetting.height}
              onChange={(event) =>
                setCustomSetting((prev) => ({ ...prev, height: Number(event.target.value) }))
              }
            />
          </label>
          <label>
            爆弾数 :{' '}
            <input
              type="number"
              min={1}
              max={customSetting.width * customSetting.height - 9}
              value={customSetting.bombCount}
              onChange={(event) =>
                setCustomSetting((prev) => ({ ...prev, bombCount: Number(event.target.value) }))
              }
            />
          </label>
        </div>
      )}
      <div className={styles.bigBoard}>
        <div className={styles.header}>
          <div className={styles.flagCount}>{flagCount}</div>
          <button className={styles.resetButton} onClick={resetClickHandler}>
            ☺
          </button>
          <div className={styles.timer} />
          <div>{seconds}</div>
        </div>
        <div className={styles.board}>
          {(
            board ?? Array.from({ length: height }, () => Array.from({ length: width }, () => -1))
          ).map((row, y) => (
            <div key={y} className={styles.row}>
              {row.map((cell, x) => {
                type classKeys =
                  | 'cellHide'
                  | 'cellFlag'
                  | 'cellNone'
                  | 'cellBomb'
                  | 'cell0'
                  | 'cell1'
                  | 'cell2'
                  | 'cell3'
                  | 'cell4'
                  | 'cell5'
                  | 'cell6'
                  | 'cell7'
                  | 'cell8';
                let classKey: classKeys;
                if (userInputs[y][x] === 'Flag') {
                  classKey = 'cellFlag';
                } else if (userInputs[y][x] === 'None') {
                  classKey = 'cellNone';
                } else if (cell === -1) {
                  classKey = 'cellHide';
                } else if (cell === -2) {
                  classKey = 'cellBomb';
                } else {
                  classKey = `cell${cell}` as typeof classKey;
                }
                return (
                  <div
                    key={`${y}-${x}`}
                    className={`${styles.cell} ${styles[classKey]}`}
                    onClick={() => LeftClickHandler(x, y)}
                    onContextMenu={(event) => RightClickHandler(event, x, y)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
