/* eslint-disable */
type NoticePopupOptions = {
	mode?: NoticePopupModeValue;
	illustration?: string;
	title?: string;
	text?: string;
	width?: number;
	angle?: boolean;
	autoHide?: boolean;
	closeByEsc?: boolean;
	closeIcon?: boolean;
	bindElement?: NoticePopupBindElement | null;
	buttons?: NoticePopupButtonOptions[] | null;
	cacheable?: boolean;
};

type NoticePopupModeValue = typeof BX.Crm.NoticePopupMode[keyof typeof BX.Crm.NoticePopupMode];

type NoticePopupBindElement = Element | {
	top: number;
	left: number;
};

type NoticePopupButtonOptions = {
	text: string;
	style?: NoticePopupButtonStyle;
	onclick?: (popup: NoticePopupButtonClickContext) => void;
	closesPopup?: boolean;
};

type NoticePopupButtonStyle = 'filled' | 'outline' | 'plain';

type NoticePopupButtonClickContext = {
	close: () => void;
};

declare namespace BX.Crm {
	class NoticePopup {
		constructor(options?: NoticePopupOptions);
		static show(options?: NoticePopupOptions): NoticePopup;
		static showAccessDenied(bindElement: NoticePopupBindElement, overrides?: NoticePopupOptions): NoticePopup;
		show(): void;
		close(): void;
	}

	const NoticePopupMode: Readonly<{
		Popover: "popover";
		Dialog: "dialog";
	}>;
}
