'use client';

import React, { useEffect, useRef, useState } from 'react';
import styles from './page.module.css';

type cellAction = 'Question' | 'Open' | 'Flag' | 'ClickBomb' | null;

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

    if (x === firstX && y === firstY) continue;

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
      userInputs[y][x] === 'ClickBomb'
        ? (currentBoard[y][x] = -2)
        : userInputs[y][x] === 'Open'
          ? bombMap[y][x] === 1
            ? (currentBoard[y][x] = -2)
            : currentBoard[y][x] === -1 && blankChain(x, y)
          : null;
    }
  }
  return currentBoard;
};

//タイマーデジタル表記
const TimerDisplay = ({ seconds }: { seconds: number }) => {
  const digits = seconds.toString().padStart(3, '0').split('');
  return (
    <div className={styles.timer}>
      {digits.map((digitString, i) => {
        const digitValue = parseInt(digitString, 10);
        const backgroundPositionY = digitValue * -50;
        const digitInlineStyle = { backgroundPosition: `0 ${backgroundPositionY}px` };
        return <div key={i} className={styles.timerDigit} style={digitInlineStyle} />;
      })}
    </div>
  );
};

// 旗デジタル表記
const FlagDisplay = ({ flags }: { flags: number }) => {
  const digits = Math.max(0, flags).toString().padStart(3, '0').split('');
  return (
    <div className={styles.flagCount}>
      {digits.map((digitString, i) => {
        const digitValue = parseInt(digitString, 10);
        const backgroundPositionY = digitValue * -50;
        const digitInlineStyle = { backgroundPosition: `0 ${backgroundPositionY}px` };
        return <div key={i} className={styles.timerDigit} style={digitInlineStyle} />;
      })}
    </div>
  );
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
  const secondsRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isGameFinishRef = useRef(false);

  const [userInputs, setUserInputs] = useState<cellAction[][]>(
    Array.from({ length: height }, () => Array.from({ length: width }, () => null)),
  );
  const [bombMap, setBombMap] = useState<number[][]>(
    Array.from({ length: height }, () => Array.from({ length: width }, () => 0)),
  );

  // 計算値
  const board = calcBoard(userInputs, bombMap);

  // マップ更新
  useEffect(() => {
    const newInputs = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => null),
    );
    const newBombMap = Array.from({ length: height }, () => Array.from({ length: width }, () => 0));
    setUserInputs(newInputs);
    setBombMap(newBombMap);
    isGameFinishRef.current = false;
    secondsRef.current = 0;
    setSeconds(0);
    if (timerRef.current) clearInterval(timerRef.current);
  }, [level, customSetting, height, width]);

  const isFirstMap = bombMap.every((row) => row.every((cell) => cell === 0));

  const RightClickHandler = (event: React.MouseEvent, x: number, y: number) => {
    event.preventDefault();

    if (isGameFinishRef.current === true) return;

    setUserInputs((prev) => {
      const newInputs = prev.map((row) => [...row]);
      const states: cellAction[] = [null, 'Flag', 'Question'];
      const currentIndex = states.indexOf(newInputs[y][x]);
      const nextIndex = (currentIndex + 1) % states.length;
      newInputs[y][x] = states[nextIndex];
      return newInputs;
    });
  };

  const LeftClickHandler = (clickX: number, clickY: number) => {
    if (isGameFinishRef.current === true) return;
    if (userInputs[clickY][clickX] !== null) return;

    if (isFirstMap === true) {
      setBombMap(generateBomb(clickX, clickY, width, height, bombCount));

      setUserInputs((prev) => {
        const newInputs = prev.map((row) => [...row]);
        newInputs[clickY][clickX] = 'Open';
        return newInputs;
      });
      return;
    }

    if (bombMap[clickY][clickX] === 1) {
      isGameFinishRef.current = true;
      if (timerRef.current) clearInterval(timerRef.current);

      setUserInputs((prev) => {
        const newInputs = prev.map((row) => [...row]);
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            if (bombMap[y][x] === 1) {
              if (y === clickY && x === clickX) {
                newInputs[clickY][clickX] = 'ClickBomb';
              } else {
                if (newInputs[y][x] !== 'Flag') {
                  newInputs[y][x] = 'Open';
                }
              }
            }
          }
        }

        return newInputs;
      });
      return;
    }

    setUserInputs((prev) => {
      const newInputs = prev.map((row) => [...row]);
      newInputs[clickY][clickX] = 'Open';
      return newInputs;
    });
  };

  // クリア時の旗立て
  useEffect(() => {
    if (isGameFinishRef.current === true) return;
    if (win(board, bombMap) === true) {
      setUserInputs((prevUserInputs) => {
        const newInputs = prevUserInputs.map((row) => [...row]);
        for (let r = 0; r < height; r++) {
          for (let c = 0; c < width; c++) {
            if (bombMap[r][c] === 1) {
              newInputs[r][c] = 'Flag';
            }
          }
        }
        return newInputs;
      });
      isGameFinishRef.current = true;
    }
  }, [board, bombMap, height, width]);

  const resetClickHandler = () => {
    isGameFinishRef.current = false;
    setUserInputs(Array.from({ length: height }, () => Array.from({ length: width }, () => null)));
    setBombMap(Array.from({ length: height }, () => Array.from({ length: width }, () => 0)));
    secondsRef.current = 0;
    setSeconds(0);
    if (timerRef.current) clearInterval(timerRef.current);
  };

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

  const lose = (userInputs: cellAction[][], bombMap: number[][]) => {
    for (let y = 0; y < bombMap.length; y++) {
      for (let x = 0; x < bombMap[0].length; x++) {
        if (userInputs[y][x] === 'Open' && bombMap[y][x] === 1) {
          return true;
        }
      }
    }
    return false;
  };

  // 時間関係
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (isGameFinishRef.current) {
      return;
    }

    const isFirstMap = bombMap.every((row) => row.every((cell) => cell === 0));

    if (isFirstMap) {
      secondsRef.current = 0;
      setSeconds(0);
      return;
    }

    timerRef.current = setInterval(() => {
      secondsRef.current += 1;
      setSeconds(secondsRef.current);
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [bombMap, userInputs, board]);

  // ゲーム終了判定
  useEffect(() => {
    if (isGameFinishRef.current) return;

    if (win(board, bombMap) || lose(userInputs, bombMap)) {
      isGameFinishRef.current = true;
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [board, bombMap, userInputs]);

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
              onChange={(event) => {
                const newWidth = Math.max(5, Math.min(40, Number(event.target.value)));
                setCustomSetting((prev) => {
                  const totalCells = newWidth * prev.height;
                  const newBombCount = Math.min(prev.bombCount, Math.max(1, totalCells - 9));
                  return { ...prev, width: newWidth, bombCount: newBombCount };
                });
              }}
            />
          </label>
          <label>
            縦 :{' '}
            <input
              type="number"
              min={5}
              max={40}
              value={customSetting.height}
              onChange={(event) => {
                const newHeight = Math.max(5, Math.min(40, Number(event.target.value)));
                setCustomSetting((prev) => {
                  const totalCells = newHeight * prev.width;
                  const newBombCount = Math.min(prev.bombCount, Math.max(1, totalCells - 9));
                  return { ...prev, height: newHeight, bombCount: newBombCount };
                });
              }}
            />
          </label>
          <label>
            爆弾数 :{' '}
            <input
              type="number"
              min={1}
              max={customSetting.width * customSetting.height - 9}
              value={customSetting.bombCount}
              onChange={(event) => {
                const totalCells = customSetting.width * customSetting.height;
                const maxBombs = Math.max(1, totalCells - 9);
                const newBombCount = Math.max(1, Math.min(maxBombs, Number(event.target.value)));
                setCustomSetting((prev) => ({ ...prev, bombCount: newBombCount }));
              }}
            />
          </label>
        </div>
      )}
      <div className={styles.bigBoard}>
        <div className={styles.header}>
          <FlagDisplay flags={flagCount} />
          <button
            className={`${styles.face} ${win(board, bombMap) ? styles.cool : lose(userInputs, bombMap) ? styles.sad : styles.smile}`}
            onClick={resetClickHandler}
          />
          <TimerDisplay seconds={seconds} />
        </div>
        <div className={styles.board}>
          {(
            board ?? Array.from({ length: height }, () => Array.from({ length: width }, () => -1))
          ).map((row, y) => (
            <div key={y} className={styles.row}>
              {row.map((cell, x) => {
                let cellContentClass: string = '';
                let cellPositionX: number | null = null;
                console.log(0);
                if (userInputs[y][x] === 'Flag') {
                  console.log(1);
                  cellContentClass = styles.cellFlag;
                } else if (userInputs[y][x] === 'Question') {
                  console.log(2);
                  cellContentClass = styles.cellQuestion;
                } else if (userInputs[y][x] === 'ClickBomb') {
                  console.log(3);
                  cellContentClass = styles.cellClickBomb;
                } else if (userInputs[y][x] === 'Open') {
                  console.log(4);
                  if (cell >= 1) {
                    console.log(5);
                    cellContentClass = styles.cellOpen;
                    cellPositionX = (cell - 1) * 30;
                  } else if (cell === 0) {
                    console.log(6);
                    cellContentClass = styles.cellOpen;
                    cellPositionX = -30;
                  } else if (cell === -2) {
                    console.log(7);
                    cellContentClass = styles.cellBomb;
                  } else {
                    cellContentClass = styles.cellHide;
                  }
                } else {
                  if (!isGameFinishRef) {
                    cellContentClass = styles.cellHide;
                  } else if (cell === 0) {
                    console.log(9);
                    cellContentClass = styles.cellOpen;
                    cellPositionX = -30;
                  } else if (cell === -2 && isGameFinishRef) {
                    console.log(10);
                    cellContentClass = styles.cellBomb;
                  } else if (cell >= 1 && cell <= 8) {
                    cellContentClass = styles.cellOpen;
                    cellPositionX = (cell - 1) * 30;
                  } else {
                    cellContentClass = styles.cellHide;
                  }
                }

                const inlineStyle =
                  cellPositionX !== null ? { backgroundPosition: `${-1 * cellPositionX}px 0` } : {};

                return (
                  <div
                    key={`${y}-${x}`}
                    style={inlineStyle}
                    className={`${styles.cell} ${cellContentClass}`}
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
