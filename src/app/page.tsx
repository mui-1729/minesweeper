'use client';

import React, { useEffect, useState } from 'react';
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

    if (newMap[y][x] === 0) {
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

  const isFirstMap = bombMap.every((row) => row.every((cell) => cell === 0));

  // 計算値
  const board = calcBoard(userInputs, bombMap);
  const isGameFinished = win(board, bombMap) || lose(userInputs, bombMap);

  const RightClickHandler = (event: React.MouseEvent, x: number, y: number) => {
    event.preventDefault();

    if (isGameFinished) return;
    if (board[y][x] !== -1) return;

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
    if (isGameFinished) return;
    if (userInputs[clickY][clickX] !== null) {
      return;
    }

    let bombMapForThisClick = bombMap;

    if (isFirstMap) {
      const newGeneratedBombMap = generateBomb(clickX, clickY, width, height, bombCount);
      setBombMap(newGeneratedBombMap);
      bombMapForThisClick = newGeneratedBombMap;
    }

    setUserInputs((prevUserInputs) => {
      let newInputs = prevUserInputs.map((row) => [...row]);
      let clickedBomb = false;

      if (bombMapForThisClick[clickY][clickX] === 1 && !isFirstMap) {
        newInputs[clickY][clickX] = 'ClickBomb';
        clickedBomb = true;
      } else {
        const blankChain = (newInputs: cellAction[][], x: number, y: number) => {
          if (x < 0 || x >= width || y < 0 || y >= height) return;
          if (newInputs[y][x] === 'Open' || newInputs[y][x] === 'Flag') return;
          if (bombMapForThisClick[y][x] === 1) return;

          newInputs[y][x] = 'Open';
          const bombsAround = countBoardAround(x, y, bombMapForThisClick);

          if (bombsAround === 0) {
            for (const [dx, dy] of directions) {
              blankChain(newInputs, x + dx, y + dy);
            }
          }
        };
        blankChain(newInputs, clickX, clickY);
      }

      const currentBoardState = calcBoard(newInputs, bombMapForThisClick);

      if (win(currentBoardState, bombMapForThisClick)) {
        newInputs = newInputs.map((row, y) =>
          row.map((cell, x) => {
            if (bombMapForThisClick[y][x] === 1 && cell !== 'Flag') {
              return 'Flag';
            }
            return cell;
          }),
        );
      } else if (clickedBomb || lose(newInputs, bombMapForThisClick)) {
        newInputs = newInputs.map((row, y) =>
          row.map((cell, x) => {
            if (bombMapForThisClick[y][x] === 1) {
              if (clickedBomb && y === clickY && x === clickX) {
                return 'ClickBomb';
              } else if (cell !== 'Flag') {
                return 'Open';
              }
            }
            return cell;
          }),
        );
      }

      return newInputs;
    });
  };

  const resetGameStates = (Setting: Setting) => {
    const { width, height } = Setting;
    setUserInputs(Array.from({ length: height }, () => Array.from({ length: width }, () => null)));
    setBombMap(Array.from({ length: height }, () => Array.from({ length: width }, () => 0)));
    setSeconds(0);
  };

  const levelChangeHandler = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newLevel = event.target.value as Level;
    const newSetting = newLevel === 'custom' ? customSetting : BasicSetting[newLevel];
    resetGameStates(newSetting);
    setLevel(newLevel);
  };

  // 時間関係
  useEffect(() => {
    if (isGameFinished) return;

    if (isFirstMap) {
      setSeconds(0);
      return;
    }

    const timer = setInterval(() => {
      setSeconds((prevSeconds) => prevSeconds + 1);
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [isGameFinished, isFirstMap]);

  const flagCount = bombCount - userInputs.flat().filter((cell) => cell === 'Flag').length;

  return (
    <div className={styles.container}>
      <select value={level} onChange={levelChangeHandler}>
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
                const totalCells = newWidth * customSetting.height;
                const newBombCount = Math.min(
                  currentSetting.bombCount,
                  Math.max(1, totalCells - 9),
                );

                setCustomSetting((prev) => {
                  return { ...prev, width: newWidth, bombCount: newBombCount };
                });
                return {
                  width: newWidth,
                  height: customSetting.height,
                  bombCount: newBombCount,
                };
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
                const totalCells = newHeight * customSetting.width;
                const newBombCount = Math.min(
                  currentSetting.bombCount,
                  Math.max(1, totalCells - 9),
                );
                setCustomSetting((prev) => {
                  return { ...prev, height: newHeight, bombCount: newBombCount };
                });
                return {
                  width: customSetting.width,
                  height: newHeight,
                  bombCount: newBombCount,
                };
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

                return {
                  width: customSetting.width,
                  height: customSetting.height,
                  bombCount: newBombCount,
                };
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
            onClick={() => resetGameStates(currentSetting)}
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
                if (userInputs[y][x] === 'Open') {
                  if (cell >= 1) {
                    cellContentClass = styles.cellOpen;
                    cellPositionX = (cell - 1) * 30;
                  } else if (cell === 0) {
                    cellContentClass = styles.cellOpen;
                    cellPositionX = -30;
                  } else if (cell === -2) {
                    cellContentClass = styles.cellBomb;
                  } else {
                    cellContentClass = styles.cellHide;
                  }
                } else if (userInputs[y][x] === 'Flag') {
                  cellContentClass = styles.cellFlag;
                } else if (userInputs[y][x] === 'Question') {
                  cellContentClass = styles.cellQuestion;
                } else if (userInputs[y][x] === 'ClickBomb') {
                  cellContentClass = styles.cellClickBomb;
                } else {
                  if (!isGameFinished) {
                    cellContentClass = styles.cellHide;
                  } else if (cell === 0) {
                    cellContentClass = styles.cellOpen;
                    cellPositionX = -30;
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
