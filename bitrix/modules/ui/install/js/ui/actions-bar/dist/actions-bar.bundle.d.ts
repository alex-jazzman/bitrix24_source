/* eslint-disable */
type RightButtonsOptions = rbo;

type RightButtonsOptions = {
	buttonsContainer: HTMLElement;
	collapsable?: boolean;
};

declare namespace BX.UI {
	const ActionsBar: {
		RightButtons: typeof RightButtons;
		init: typeof init;
	};

	class RightButtons {
		static getInstanceByNode(node: HTMLElement): RightButtons | null;
		constructor(options: RightButtonsOptions);
		getContainer(): HTMLElement;
		getButtonCount(): number;
		getCollapsedCount(): number;
		setCollapsedCount(k: number): void;
		collapse(): void;
		expand(): void;
		isCollapsed(): boolean;
		disableAutoCollapse(): void;
		init(): void;
	}

	function init(target: HTMLElement | string): void;
}
