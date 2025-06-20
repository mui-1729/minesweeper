export type Setting = {
  width: number;
  height: number;
  bombCount: number;
};

export type basicLevel = 'easy' | 'normal' | 'hard';

export type cellAction = 'Question' | 'Open' | 'Flag' | 'ClickBomb' | null;

export type Level = basicLevel | 'custom';

