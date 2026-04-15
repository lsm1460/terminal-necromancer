export type AppScreen = 'GAME' | 'CONFIG' | 'CREDIT'

export interface ScreenConfig {
  id: AppScreen;
  children?: ScreenConfig[];
}

export interface ScreenInfo {
  depth: number;
  parentId: AppScreen | null;
}

export type ScreenComponent<P = {}> = React.FC<P> & {
  screenId: AppScreen;
};