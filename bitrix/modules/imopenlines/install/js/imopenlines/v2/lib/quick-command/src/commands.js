export type QuickCommandItem = {
	id: string,
	command: string,
	descriptionCode?: string,
	keepText?: boolean,
};

export const COMMAND_PREFIX = '/';

export const QuickCommand: { [string]: QuickCommandItem } = {
	getDialogId: {
		id: 'getDialogId',
		command: `${COMMAND_PREFIX}getDialogId`,
	},
	getChatId: {
		id: 'getChatId',
		command: `${COMMAND_PREFIX}getChatId`,
		descriptionCode: 'IMOL_CONTENT_TEXTAREA_QUICK_COMMAND_GET_DIALOG_ID_DESCRIPTION',
	},
	rename: {
		id: 'rename',
		command: `${COMMAND_PREFIX}rename`,
		descriptionCode: 'IMOL_CONTENT_TEXTAREA_QUICK_COMMAND_RENAME_DESCRIPTION',
	},
	quote: {
		id: 'quote',
		command: '>>',
		descriptionCode: 'IMOL_CONTENT_TEXTAREA_QUICK_COMMAND_QUOTE_DESCRIPTION',
		keepText: true,
	},
};
