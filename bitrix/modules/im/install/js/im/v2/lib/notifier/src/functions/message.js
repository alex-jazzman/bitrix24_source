import { Loc } from 'main.core';

import { Messenger } from 'im.public';
import { Core } from 'im.v2.application.core';
import { ErrorCode } from 'im.v2.const';
import { type CallBatchError } from 'im.v2.lib.rest';

import { showNotification, type NotificationAction } from '../utils/notification';

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

	onForwardSelfChatComplete(messagesIds: number[]): void
	{
		const text = messagesIds.length > 1
			? Loc.getMessage('IM_NOTIFIER_MESSAGE_FORWARD_NOTES_SEVERAL_MESSAGES_COMPLETE')
			: Loc.getMessage('IM_NOTIFIER_MESSAGE_FORWARD_NOTES_COMPLETE');

		const dialogId = Core.getUserId().toString();

		const selfChatOpeningAction: NotificationAction = {
			title: Loc.getMessage('IM_NOTIFIER_MESSAGE_FORWARD_NOTES_OPEN_COMPLETE'),
			events: {
				click: () => Messenger.openChat(dialogId),
			},
		};

		showNotification(text, {
			actions: [selfChatOpeningAction],
		});
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
