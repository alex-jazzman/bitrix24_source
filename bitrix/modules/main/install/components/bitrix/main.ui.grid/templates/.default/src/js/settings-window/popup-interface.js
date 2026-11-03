export interface PopupInterface {
	sortItems(columns?: string[]): void;
	reset(): void;
	show(): void;
	close(): void;
	destroy(): void;
	createPopup(): void;
	// The main.popup window the settings live in, whatever shell wraps it.
	getMainPopup(): Object;
	getSelectedColumns(): void;
	getStickedColumns(): string[];
	isForAll(): boolean;
	getPopupItems(): HTMLCollection;
	getItems(): [];
	select(id: string, value: boolean): void;
	saveColumns(columns: [], callback: Function): void;
}
