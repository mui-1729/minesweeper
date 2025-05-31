'use client';

import React, { useEffect, useState } from 'react';
import styles from './page.module.css';

type cellAction = 'None' | 'Open' | 'Flag' | 'ClearFlag' | null;

interface Cell {
  flag: boolean | null; // flagがtrue, false, nullのいずれかである
  element: HTMLElement; // 実際のHTML要素
}

interface Game {
  cells: Cell[];
}

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

// 方向定義
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

const generateInitialBoard = (): number[][] => {
  // ボード生成ロジック（例: ランダムに爆弾を配置）
  return Array.from({ length: 10 }, () => Array(10).fill(0) as number[]);
};

const generateEmptyUserInputs = (): cellAction[][] => {
  // ユーザーが開けていないセルの状態を初期化S
  return Array.from({ length: 10 }, () => Array<cellAction>(10).fill(null));
};

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

  const currentBoard = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => -1),
  );

  const internalBlankChain = (x: number, y: number) => {
    if (x < 0 || x >= width || y < 0 || y >= height || currentBoard[y][x] !== -1) return;

    if (bombMap[y][x] === 1) return;

    const count = countBoardAround(x, y, bombMap);
    currentBoard[y][x] = count;

    if (count === 0) {
      for (const [dx, dy] of directions) {
        internalBlankChain(x + dx, y + dy);
      }
    }
  };

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (userInputs[y][x] === 'Open') {
        currentBoard[y][x] = bombMap[y][x] === 1 ? -2 : currentBoard[y][x];
        if (bombMap[y][x] !== 1) {
          internalBlankChain(x, y);
        }
      }
    }
  }
  return currentBoard;
};

function toggleFlag(cell: Cell): void {
  const flagElement = cell.element.querySelector('.cellFlag');

  if (flagElement) {
    if (cell.flag === true) {
      flagElement.classList.add('cellFlagVisible'); // フラグが立っている場合に表示
    } else if (cell.flag === false || cell.flag === null) {
      flagElement.classList.remove('cellFlagVisible'); // フラグが立っていない場合非表示
    }
  }
}
const FlagDisplay = ({ flags }: { flags: number }) => {
  const digits = Math.max(0, flags).toString().padStart(3, '0').split('');
  return (
    <div className={styles.flagCount}>
      {digits.map((digit, i) => (
        <div
          key={i}
          className={`${styles.timerDigit} ${styles[`timerDigit${digit}`]}`}
          aria-label={digit}
        />
      ))}
    </div>
  );
};

const TimerDisplay = ({ seconds }: { seconds: number }) => {
  const digits = seconds.toString().padStart(3, '0').split('');
  return (
    <div className={styles.timer}>
      {digits.map((digit, i) => (
        <div
          key={i}
          className={`${styles.timerDigit} ${styles[`timerDigit${digit}`]}`}
          aria-label={digit}
        />
      ))}
    </div>
  );
};

const win = (board: number[][], bombMap: number[][]): boolean => {
  const height = bombMap.length;
  const width = bombMap[0].length;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // 爆弾マスではない かつ まだ開かれていない（-1）マスがあれば、まだクリアではない
      if (bombMap[y][x] === 0 && board[y][x] === -1) {
        return false;
      }
    }
  }
  // すべての非爆弾マスが開かれていればクリア
  return true;
};

const lose = (userInputs: cellAction[][], bombMap: number[][]): boolean => {
  // 敗北判定ロジック（例: 爆弾を踏んだ場合）
  return userInputs.some((row, y) => row.some((cell, x) => cell === 'Open' && bombMap[y][x] === 1));
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
  const [isGameFinish, setIsGameFinish] = useState(false);

  const board = calcBoard(userInputs, bombMap);

  useEffect(() => {
    const newInputs = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => null),
    );
    const newBombMap = Array.from({ length: height }, () => Array.from({ length: width }, () => 0));
    setUserInputs(newInputs);
    setBombMap(newBombMap);
    setIsGameFinish(false);
    setSeconds(0);
  }, [level, customSetting, width, height]);

  useEffect(() => {
    // 初手マップがまだ生成されていない場合は何もしない
    const isFirstMap = bombMap.every((row) => row.every((cell) => cell === 0));
    if (isFirstMap) {
      setSeconds(0); // 初手マップ時は秒数を0にリセット
      setIsGameFinish(false); // 念のためゲーム終了フラグもリセット
      return;
    }

    // ゲーム終了判定（勝利または敗北）
    if (!isGameFinish) {
      // ゲームがまだ終了していない場合のみ判定
      if (win(board, bombMap)) {
        setIsGameFinish(true); // 勝利
        // 勝利時の処理として、爆弾位置に旗を立てる
        setUserInputs((prevInputs) => {
          const updatedInputs = prevInputs.map((row) => [...row]);
          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              if (bombMap[y][x] === 1) {
                updatedInputs[y][x] = 'Flag'; // 爆弾位置に旗をセット
              }
            }
          }
          return updatedInputs;
        });
      } else if (lose(userInputs, bombMap)) {
        setIsGameFinish(true); // 敗北
        // 爆弾を踏んだ場合は、LeftClickHandlerで既に全ての爆弾が表示されるはず
        // ここでさらにuserInputsを更新する必要はないが、明示的に記述する場合は考慮する
      }
    }

    // タイマーの開始/停止
    let timer: NodeJS.Timeout;
    if (!isGameFinish) {
      // ゲームが終了していない場合のみタイマーを開始
      timer = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }

    // クリーンアップ関数
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [board, bombMap, userInputs, isGameFinish, width, height]);

  const RightClickHandler = (event: React.MouseEvent, x: number, y: number) => {
    event.preventDefault();

    if (isGameFinish) return;

    if (userInputs[y][x] === 'Open') return;

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
    if (isGameFinish) return;
    if (userInputs[y][x] === 'Open' || userInputs[y][x] === 'Flag' || userInputs[y][x] === 'None') {
      return;
    }

    let currentBombMap = bombMap;
    const isFirstMap = bombMap.every((row) => row.every((cell) => cell === 0));
    if (isFirstMap) {
      currentBombMap = generateBomb(x, y, width, height, bombCount);
      setBombMap(currentBombMap);
    }

    const newInputs = userInputs.map((row) => [...row]);
    let gameEnded = false;

    const openCellAndChain = (currentX: number, currentY: number) => {
      if (
        currentX < 0 ||
        currentX >= width ||
        currentY < 0 ||
        currentY >= height ||
        newInputs[currentY][currentX] === 'Open' ||
        newInputs[currentY][currentX] === 'Flag' ||
        newInputs[currentY][currentX] === 'None'
      ) {
        return;
      }

      if (currentBombMap[currentY][currentX] === 1) {
        newInputs[currentY][currentX] = 'Open';
        gameEnded = true;
        return;
      }

      const count = countBoardAround(currentX, currentY, currentBombMap);
      newInputs[currentY][currentX] = 'Open';

      if (count === 0) {
        for (const [dx, dy] of directions) {
          openCellAndChain(currentX + dx, currentY + dy);
        }
      }
    };

    openCellAndChain(x, y);
    setUserInputs(newInputs);
    setIsGameFinish(gameEnded);
  };

  const resetClickHandler = () => {
    // ゲームの状態を初期化
    setUserInputs(generateEmptyUserInputs());
    setSeconds(0);
    setIsGameFinish(false);
    setLevel('easy');
    setCustomSetting({ width: 10, height: 10, bombCount: 10 });
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
          <FlagDisplay flags={flagCount} />
          <button
            className={`${styles.face} ${
              isGameFinish && win(board, bombMap)
                ? styles.cool
                : isGameFinish && lose(userInputs, bombMap) // lose() 判定は LeftClickHandler からは遅れる可能性があるが、表示には影響しない
                  ? styles.sad
                  : styles.smile
            }`}
            onClick={resetClickHandler}
          />
          <TimerDisplay seconds={seconds} />
        </div>
        <div className={styles.board}>
          {board.map((row, y) => (
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
                  | 'cell8'
                  | 'cellBombHit'
                  | 'cellBombMissed';
                let classKey: classKeys = 'cellHide';
                const isOpen = userInputs[y][x] === 'Open';

                // ゲーム終了時の表示ロジック
                if (isGameFinish) {
                  if (bombMap[y][x] === 1) {
                    if (userInputs[y][x] === 'Open') {
                      // 爆弾を踏んで開いた場合（ゲームオーバーのトリガーになったセル）
                      classKey = 'cellBombHit';
                    } else if (userInputs[y][x] === 'Flag') {
                      // 正しくフラグが立っていた爆弾
                      classKey = 'cellFlag';
                    } else {
                      // 開かれていない爆弾（ゲームオーバーで全て表示される）
                      classKey = 'cellBomb';
                    }
                  } else {
                    if (userInputs[y][x] === 'Flag') {
                      // 安全な場所に誤ってフラグを立てた場合
                      classKey = 'cellBombMissed';
                    } else if (isOpen) {
                      // 開かれていた安全なセル
                      classKey = `cell${board[y][x]}` as typeof classKey;
                    } else {
                      // 隠れたままの安全なセル (ゲーム終了時にも開かれない)
                      classKey = 'cellHide';
                    }
                  }
                } else {
                  // ゲーム進行中の表示ロジック
                  if (isOpen) {
                    // bombMap[y][x] === 1 の場合は、LeftClickHandler内で isGameFinish が true になり、
                    // このブロックではなく上の isGameFinish === true のブロックが処理されるため、
                    // ここでは bombMap[y][x] === 0 の安全なセルのみが処理される
                    classKey = `cell${board[y][x]}` as typeof classKey;
                  } else if (userInputs[y][x] === 'Flag') {
                    classKey = 'cellFlag';
                  } else if (userInputs[y][x] === 'None') {
                    classKey = 'cellNone';
                  } else {
                    classKey = 'cellHide';
                  }
                }

                return (
                  <div
                    key={`${y}-${x}`}
                    className={styles.cell}
                    onClick={() => LeftClickHandler(x, y)}
                    onContextMenu={(event) => RightClickHandler(event, x, y)}
                  >
                    <div className={styles[classKey]} />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
