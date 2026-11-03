import { Loc } from 'main.core';
import { LiveAnnouncer } from 'ui.a11y';

import { ChatType, ErrorCode, type ChatTypeItem } from 'im.v2.const';
import { type RunActionError } from 'im.v2.lib.rest';

import { extractRestErrorCode, type RestError } from '../utils/error';
import { showNotification } from '../utils/notification';

const CHAT_ACCESS_ERROR_NOTIFICATION_ID = 'im-chat-access-error';

export const ChatNotifier = {
	handleLoadError(error: RunActionError): void
	{
		// eslint-disable-next-line unicorn/prefer-switch
		if (error.code === ErrorCode.chat.notFound)
		{
			this.onNotFoundError();
		}
		else if (error.code === ErrorCode.chat.accessDenied)
		{
			this.onAccessDeniedError();
		}
		else if (error.code === ErrorCode.message.notFound)
		{
			this.onContextMessageNotFoundError();
		}
	},

	handleLeaveError(error: RestError): void
	{
		const errorCode = extractRestErrorCode(error);
		const NotificationTextByErrorCode = {
			[ErrorCode.user.invitedFromStructure]: Loc.getMessage('IM_NOTIFIER_LEAVE_CHAT_STRUCTURE_ERROR'),
			default: Loc.getMessage('IM_NOTIFIER_LEAVE_CHAT_ERROR'),
		};

		const notificationText = NotificationTextByErrorCode[errorCode] ?? NotificationTextByErrorCode.default;
		showNotification(notificationText);
	},

	handleJoinError(isChannel: boolean = false): void
	{
		const notificationText = isChannel
			? Loc.getMessage('IM_NOTIFIER_CHANNEL_SUBSCRIBE_ERROR')
			: Loc.getMessage('IM_NOTIFIER_CHAT_JOIN_ERROR')
		;
		showNotification(notificationText);
	},

	onChannelSubscribeComplete(): void
	{
		showNotification(Loc.getMessage('IM_NOTIFIER_CHANNEL_SUBSCRIBE_COMPLETE'));
	},

	handleUserKickError(error: RestError): void
	{
		const errorCode = extractRestErrorCode(error);
		const NotificationTextByErrorCode = {
			[ErrorCode.user.invitedFromStructure]: Loc.getMessage('IM_NOTIFIER_KICK_CHAT_STRUCTURE_ERROR'),
			default: Loc.getMessage('IM_NOTIFIER_KICK_CHAT_ERROR'),
		};

		const notificationText = NotificationTextByErrorCode[errorCode] ?? NotificationTextByErrorCode.default;
		showNotification(notificationText);
	},

	onNotFoundError(): void
	{
		showNotification(Loc.getMessage('IM_NOTIFIER_CHAT_ACCESS_ERROR'));
	},

	onAccessDeniedError(): void
	{
		showNotification(Loc.getMessage('IM_NOTIFIER_CHAT_ACCESS_ERROR'), { id: CHAT_ACCESS_ERROR_NOTIFICATION_ID });
	},

	onContextMessageNotFoundError(): void
	{
		showNotification(Loc.getMessage('IM_NOTIFIER_CONTEXT_MESSAGE_NOT_FOUND_ERROR'));
	},

	handleCreateError(error: RestError): void
	{
		const errorCode = extractRestErrorCode(error);
		const NotificationTextByErrorCode = {
			CALL_MODULE_NOT_INSTALLED: Loc.getMessage('IM_NOTIFIER_CONFERENCE_MODULE_NOT_INSTALLED_ERROR'),
			default: Loc.getMessage('IM_NOTIFIER_CHAT_CREATE_ERROR'),
		};

		const notificationText = NotificationTextByErrorCode[errorCode] ?? NotificationTextByErrorCode.default;
		showNotification(notificationText);
	},

	onUpdateError(): void
	{
		showNotification(Loc.getMessage('IM_NOTIFIER_CHAT_UPDATE_ERROR'));
	},

	onDeleteError(): void
	{
		showNotification(Loc.getMessage('IM_NOTIFIER_CHAT_DELETE_ERROR'));
	},

	// The editor is already closed by the time the server answers, so the failure has to reach both
	// channels: the balloon and the screen reader, which the balloon never reaches - it is no live
	// region. Nothing here touches the focus: the user has moved on, and the announcement follows them.
	onRenameError(): void
	{
		const text = Loc.getMessage('IM_NOTIFIER_CHAT_RENAME_ERROR');

		showNotification(text);
		LiveAnnouncer.announce(text, 'assertive');
	},

	onMessagesPinLimitError(pinLimit: number): void
	{
		showNotification(Loc.getMessage('IM_NOTIFIER_MESSAGES_PIN_LIMIT_ERROR', {
			'#MAX_PINS#': pinLimit,
		}));
	},

	handleUserAddComplete(chatType: ChatTypeItem)
	{
		const NotificationTextByChatType = {
			[ChatType.taskComments]: Loc.getMessage('IM_NOTIFIER_TASK_COMMENTS_USER_ADD_COMPLETE'),
			default: Loc.getMessage('IM_NOTIFIER_CHAT_USER_ADD_COMPLETE'),
		};

		const notificationText = NotificationTextByChatType[chatType] ?? NotificationTextByChatType.default;
		showNotification(notificationText);
	},

	handleUserAddError(chatType: ChatTypeItem)
	{
		const NotificationTextByChatType = {
			[ChatType.taskComments]: Loc.getMessage('IM_NOTIFIER_TASK_COMMENTS_USER_ADD_ERROR'),
			default: Loc.getMessage('IM_NOTIFIER_CHAT_USER_ADD_ERROR'),
		};

		const notificationText = NotificationTextByChatType[chatType] ?? NotificationTextByChatType.default;
		showNotification(notificationText);
	},

	handleSelectionAddError(usersError: RunActionError | null, nodesError: RunActionError | null): void
	{
		if (usersError && nodesError)
		{
			showNotification(Loc.getMessage('IM_NOTIFIER_ADD_TO_CHAT_USERS_AND_NODES_ERROR'));

			return;
		}

		if (usersError)
		{
			showNotification(Loc.getMessage('IM_NOTIFIER_ADD_TO_CHAT_USERS_ERROR'));

			return;
		}

		const NotificationTextByErrorCode = {
			[ErrorCode.chat.accessDenied]: Loc.getMessage('IM_NOTIFIER_ADD_TO_CHAT_NODES_ACCESS_ERROR'),
			[ErrorCode.structureLink.chatTypeNotSupported]: Loc.getMessage('IM_NOTIFIER_ADD_TO_CHAT_NODES_CHAT_TYPE_ERROR'),
			[ErrorCode.structureLink.tooManyNodes]: Loc.getMessage('IM_NOTIFIER_ADD_TO_CHAT_NODES_LIMIT_ERROR'),
			[ErrorCode.structureLink.nodeNotAvailable]: Loc.getMessage('IM_NOTIFIER_ADD_TO_CHAT_NODES_UNAVAILABLE_ERROR'),
			[ErrorCode.structureLink.structureNotAvailable]: Loc.getMessage('IM_NOTIFIER_ADD_TO_CHAT_STRUCTURE_UNAVAILABLE_ERROR'),
			default: Loc.getMessage('IM_NOTIFIER_ADD_TO_CHAT_NODES_ERROR'),
		};

		const notificationText = NotificationTextByErrorCode[nodesError.code] ?? NotificationTextByErrorCode.default;
		showNotification(notificationText);
	},

	onCopyIdComplete()
	{
		showNotification(Loc.getMessage('IM_NOTIFIER_CHAT_COPY_ID_COMPLETE'));
	},
};
