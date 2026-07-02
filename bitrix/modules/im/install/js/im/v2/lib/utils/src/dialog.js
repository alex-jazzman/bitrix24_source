import { DialogIdChatPrefix } from 'im.v2.const';

export const DialogUtil = {
	isDialogId(dialogId: string): boolean
	{
		const pattern = new RegExp(`^(?:${DialogIdChatPrefix})?\\d+$`);

		return pattern.test(dialogId);
	},

	isChatDialogId(dialogId: string): boolean
	{
		return dialogId.startsWith(DialogIdChatPrefix);
	},

	getChatIdFromDialogId(dialogId: string): number
	{
		if (!this.isChatDialogId(dialogId))
		{
			throw new Error('Provided dialogId is not correct');
		}

		return Number(dialogId.slice(DialogIdChatPrefix.length));
	},

	buildChatDialogId(chatId: number): string
	{
		return `${DialogIdChatPrefix}${chatId}`;
	},

	isExternalId(dialogId: string): boolean
	{
		return this.isGroupExternalId(dialogId) || this.isCrmExternalId(dialogId);
	},

	isGroupExternalId(dialogId: string): boolean
	{
		const GROUP_PREFIX = 'sg';

		return dialogId.startsWith(GROUP_PREFIX);
	},

	isCrmExternalId(dialogId: string): boolean
	{
		const CRM_PREFIX = 'crm|';

		return dialogId.startsWith(CRM_PREFIX);
	},

	isLinesExternalId(dialogId): boolean
	{
		const LINES_PREFIX = 'imol|';

		return dialogId.toString().startsWith(LINES_PREFIX) && !this.isLinesHistoryId(dialogId);
	},

	isLinesHistoryId(dialogId): boolean
	{
		return /^imol\|\d+$/.test(dialogId);
	},
};
