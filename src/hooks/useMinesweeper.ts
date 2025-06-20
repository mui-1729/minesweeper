import { useEffect, useState } from 'react';
import { BasicSetting, directions } from '../constants';
import type { cellAction, Level, Setting } from '../types';
import { calcBoard, countBoardAround, generateBomb, lose, win } from '../utils/minesweeper';

export const useMinesweeper = () => {
  const [level, setLevel] = useState<Level>('easy');
  const [customSetting, setCustomSetting] = useState<Setting>({
    width: 9,
    height: 9,
    bombCount: 10,
  });

  const [seconds, setSeconds] = useState(0);

  const currentSetting: Setting = level === 'custom' ? customSetting : BasicSetting[level];
  const { width, height, bombCount } = currentSetting;

  const [userInputs, setUserInputs] = useState<cellAction[][]>(
    Array.from({ length: height }, () => Array.from({ length: width }, () => null)),
  );
  const [bombMap, setBombMap] = useState<number[][]>(
    Array.from({ length: height }, () => Array.from({ length: width }, () => 0)),
  );

  const board = calcBoard(userInputs, bombMap);
  const gameStatus: 'firstMap' | 'playing' | 'win' | 'lose' = bombMap.every((row) =>
    row.every((cell) => cell === 0),
  )
    ? 'firstMap'
    : win(board, bombMap)
      ? 'win'
      : lose(userInputs, bombMap)
        ? 'lose'
        : 'playing';

  const RightClickHandler = (event: React.MouseEvent, x: number, y: number) => {
    event.preventDefault();

    if (gameStatus === 'win' || gameStatus === 'lose') return;
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
    if (gameStatus === 'win' || gameStatus === 'lose') return;

    let bombMapForThisClick = bombMap;
    if (gameStatus === 'firstMap') {
      const newGeneratedBombMap = generateBomb(clickX, clickY, width, height, bombCount);
      setBombMap(newGeneratedBombMap);
      bombMapForThisClick = newGeneratedBombMap;
    }
    if (userInputs[clickY][clickX] !== null) {
      return;
    }

    setUserInputs((prevUserInputs) => {
      let newInputs = prevUserInputs.map((row) => [...row]);
      let clickedBomb = false;

      if (bombMapForThisClick[clickY][clickX] === 1 && gameStatus === 'playing') {
        newInputs[clickY][clickX] = 'ClickBomb';
        clickedBomb = true;
      } else {
        const blankChain = (newInputs: cellAction[][], x: number, y: number) => {
          if (x < 0 || x >= width || y < 0 || y >= height) return;
          if (newInputs[y][x] === 'Open') return;
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
    if (gameStatus === 'firstMap') {
      setSeconds(0);
      return;
    }
    if (gameStatus !== 'playing') return;

    const timer = setInterval(() => {
      setSeconds((prevSeconds) => prevSeconds + 1);
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [gameStatus]);

  const flagCount = bombCount - userInputs.flat().filter((cell) => cell === 'Flag').length;

  return {
    level,
    customSetting,
    currentSetting,
    board,
    gameStatus,
    seconds,
    flagCount,
    bombMap,
    userInputs,
    resetGameStates,
    RightClickHandler,
    LeftClickHandler,
    levelChangeHandler,
    setCustomSetting,
  };
};
