/* eslint-disable */
type LockPopupOptions = {
	title?: string;
	content?: string;
	buttons?: LockPopupButton[];
	width?: number;
	hasCloseButton?: boolean;
	closeByEsc?: boolean;
	closeByClickOutside?: boolean;
	hasOverlay?: boolean;
	showIcon?: boolean;
	useQueue?: boolean;
	closeSidePanelOnClose?: boolean;
	emitOnClose?: string;
};

type LockPopupButton = {
	text: string;
	url?: string;
	style?: string;
	closesPopup?: boolean;
	onclick?: () => void;
};

declare namespace BX.BIConnector {
	class LockPopup {
		constructor(options?: LockPopupOptions);
		static show(options?: LockPopupOptions): LockPopup;
		show(): void;
		hide(): void;
	}

	class LimitLockPopup extends LockPopup {
	}
}
