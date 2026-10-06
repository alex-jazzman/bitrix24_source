export const NoticePopupMode = Object.freeze({
	Popover: 'popover',
	Dialog: 'dialog',
});

export type NoticePopupModeValue = typeof NoticePopupMode[keyof typeof NoticePopupMode];
