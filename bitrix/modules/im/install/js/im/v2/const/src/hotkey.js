export const HotkeyCombination = Object.freeze({
	textDecoration: {
		bold: 'Ctrl+B',
		italic: 'Ctrl+I',
		underline: 'Ctrl+U',
		strikethrough: 'Ctrl+S',
	},
	sendMessage: {
		byEnter: ['Enter', 'NumpadEnter'],
		byCtrlEnter: ['Ctrl+Enter', 'Ctrl+NumpadEnter'],
	},
	newLine: {
		byShiftEnter: 'Shift+Enter',
		byEnter: 'Enter',
		byCtrlEnter: 'Ctrl+Enter',
	},
	editMessage: {
		lastOwn: 'ArrowUp',
	},
	messageMenu: {
		quote: 'Alt+Ctrl',
	},
	list: {
		contextMenu: ['Shift+F10', 'ContextMenu'],
		skipContextMenu: 'Alt+Shift',
	},
	desktop: {
		logFolder: 'Ctrl+Shift+L',
		devTools: 'Ctrl+Shift+D',
	},
});
