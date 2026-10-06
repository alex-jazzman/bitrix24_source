import type { NoticePopupModeValue } from './mode';

export type NoticePopupBindElement = Element | {
	top: number,
	left: number,
};

export type NoticePopupButtonStyle = 'filled' | 'outline' | 'plain';

export type NoticePopupButtonClickContext = {
	close: () => void,
};

export type NoticePopupButtonOptions = {
	text: string,
	style?: NoticePopupButtonStyle,
	onclick?: (popup: NoticePopupButtonClickContext) => void,
	closesPopup?: boolean,
};

export type NoticePopupOptions = {
	mode?: NoticePopupModeValue,
	illustration?: string,
	title?: string,
	text?: string,
	width?: number,
	angle?: boolean,
	autoHide?: boolean,
	closeByEsc?: boolean,
	closeIcon?: boolean,
	bindElement?: NoticePopupBindElement | null,
	buttons?: NoticePopupButtonOptions[] | null,
	cacheable?: boolean,
};

export type PreparedNoticePopupOptions = {
	mode: NoticePopupModeValue,
	illustration: string,
	title: string,
	text: string,
	width: number,
	angle: boolean,
	autoHide: boolean,
	closeByEsc: boolean,
	closeIcon: boolean,
	bindElement: NoticePopupBindElement | null,
	buttons: NoticePopupButtonOptions[] | null,
	cacheable: boolean,
};

export const DEFAULT_OPTIONS: PreparedNoticePopupOptions = Object.freeze({
	mode: 'popover',
	illustration: 'access-denied',
	title: '',
	text: '',
	width: 500,
	angle: false,
	autoHide: true,
	closeByEsc: true,
	closeIcon: true,
	bindElement: null,
	buttons: null,
	cacheable: false,
});
