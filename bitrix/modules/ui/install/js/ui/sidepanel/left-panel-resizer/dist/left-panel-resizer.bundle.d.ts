/* eslint-disable */
type LeftPanelResizerOptions = {
	panel: HTMLElement;
	separator: HTMLElement;
	container: HTMLElement;
	INITIAL_WIDTH: number;
	MIN_WIDTH: number;
	MAX_WIDTH: number;
	MIN_CONTENT_WIDTH: number;
	KEYBOARD_STEP: number;
	ACCESSIBLE_NAME?: string;
	STORAGE?: LeftPanelResizerStorageOptions;
};

type LeftPanelResizerStorageOptions = {
	TYPE: 'localStorage';
	KEY: string;
	VERSION: 1;
};

declare namespace BX.UI.SidePanel {
	class LeftPanelResizer {
		constructor(options: LeftPanelResizerOptions);
		destroy(): void;
	}
}
