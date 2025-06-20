'use client';
import { useMinesweeper } from '../hooks/useMinesweeper';
import type { Setting } from '../types';
import { lose, win } from '../utils/minesweeper';
import styles from './page.module.css';

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
  const {
    level,
    customSetting,
    currentSetting,
    board,
    gameStatus,
    seconds,
    flagCount,
    bombMap,
    userInputs,
    setCustomSetting,
    resetGameStates,
    levelChangeHandler,
    RightClickHandler,
    LeftClickHandler,
  } = useMinesweeper();

  const boardClassStates = (x: number, y: number, cell: number): keyof typeof styles => {
    if (userInputs[y][x] === 'Open') {
      if (cell >= 0) {
        return 'cellOpen';
      } else if (cell === -2) {
        return 'cellBomb';
      } else {
        return 'cellHide';
      }
    } else if (userInputs[y][x] === null) {
      if (gameStatus === 'firstMap' || gameStatus === 'lose') {
        return 'cellHide';
      } else if (cell >= 1) {
        return 'cellOpen';
      } else {
        return 'cellHide';
      }
    } else
      return (
        {
          Flag: 'cellFlag',
          Question: 'cellQuestion',
          ClickBomb: 'cellClickBomb',
        } as const
      )[userInputs[y][x]];
  };

  const newBoardState = (
    event: React.ChangeEvent<HTMLInputElement>,
    field: 'height' | 'width' | 'bombCount',
  ) => {
    const userValue = Number(event.target.value);
    let newSettings: Setting;

    if (field === 'height' || field === 'width') {
      const newValue = Math.max(5, Math.min(40, userValue));
      const newHeight = field === 'height' ? newValue : currentSetting.height;
      const newWidth = field === 'width' ? newValue : currentSetting.width;
      const totalCells = newWidth * newHeight;
      const maxBombs = Math.max(1, totalCells - 9);
      const newBombCount = Math.min(currentSetting.bombCount, maxBombs);

      newSettings = {
        height: newHeight,
        width: newWidth,
        bombCount: newBombCount,
      };
    } else {
      const totalCells = currentSetting.width * currentSetting.height;
      const maxBombs = Math.max(1, totalCells - 9);
      const minBombs = 1;

      const newBombCount = Math.max(minBombs, Math.min(userValue, maxBombs));

      newSettings = {
        ...currentSetting,
        bombCount: newBombCount,
      };
    }
    setCustomSetting(newSettings);
    resetGameStates(newSettings);
  };

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
              onChange={(event) => newBoardState(event, 'width')}
            />
          </label>
          <label>
            縦 :{' '}
            <input
              type="number"
              min={5}
              max={40}
              value={customSetting.height}
              onChange={(event) => newBoardState(event, 'height')}
            />
          </label>
          <label>
            爆弾数 :{' '}
            <input
              type="number"
              min={1}
              max={customSetting.width * customSetting.height - 9}
              value={customSetting.bombCount}
              onChange={(event) => newBoardState(event, 'bombCount')}
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
            board ??
            Array.from({ length: currentSetting.height }, () =>
              Array.from({ length: currentSetting.width }, () => -1),
            )
          ).map((row, y) => (
            <div key={y} className={styles.row}>
              {row.map((cell, x) => {
                return (
                  <div
                    key={`${y}-${x}`}
                    style={
                      cell < 0
                        ? undefined
                        : { backgroundPosition: `${cell === 0 ? 30 : (cell - 1) * -30}px` }
                    }
                    className={`${styles.cell} ${styles[boardClassStates(x, y, cell)]}`}
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
