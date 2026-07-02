export interface BitrixGrid {
	tableFade(): void;
	tableUnfade(): void;
	reload(callback?: () => void): void;
}
