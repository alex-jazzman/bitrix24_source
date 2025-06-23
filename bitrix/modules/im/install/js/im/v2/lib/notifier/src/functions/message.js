import { Loc } from 'main.core';

import { ErrorCode } from 'im.v2.const';

import { showNotification } from '../utils/notification';

import type { CallBatchError } from 'im.v2.lib.rest';

export const MessageNotifier = {
	onCopyComplete(): void
	{
		showNotification(Loc.getMessage('IM_NOTIFIER_MESSAGE_COPY_COMPLETE'));
	},

	onCopyLinkComplete(): void
	{
		showNotification(Loc.getMessage('IM_NOTIFIER_MESSAGE_LINK_COPY_COMPLETE'));
	},

	onAddToFavoriteComplete(): void
	{
		showNotification(Loc.getMessage('IM_NOTIFIER_MESSAGE_FAVORITE_ADD_COMPLETE'));
	},

	handleLoadContextError(error: CallBatchError): void
	{
		if (error.code === ErrorCode.message.notFound)
		{
			this.onNotFoundError();
		}
	},

	onNotFoundError(): void
	{
		showNotification(Loc.getMessage('IM_NOTIFIER_CONTEXT_MESSAGE_NOT_FOUND_ERROR'));
	},

	onSelectLimitError(): void
	{
		showNotification(Loc.getMessage('IM_NOTIFIER_MESSAGE_SELECT_LIMIT_ERROR'));
	},
};
