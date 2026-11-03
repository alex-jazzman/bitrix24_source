import { Loc, Text, Type } from 'main.core';

import { ErrorCode } from 'im.v2.const';
import { type RunActionError } from 'im.v2.lib.rest';
import { CollabManager } from 'im.v2.lib.collab';

import { showNotification } from '../utils/notification';

const CollabErrorCode = {
	emptyName: 'name',
	duplicateName: 'ERROR_GROUP_NAME_EXISTS',
	urlInName: 'ERROR_NAME_CONTAINS_URL',
	tasksNotEmpty: 'TASKS_NOT_EMPTY',
	diskNotEmpty: 'DISK_NOT_EMPTY',
	calendarNotEmpty: 'CALENDAR_NOT_EMPTY',
};

const NotEmptyCollabErrorCodes = new Set([
	CollabErrorCode.tasksNotEmpty, CollabErrorCode.diskNotEmpty, CollabErrorCode.calendarNotEmpty,
]);

const InvitationErrorCodes = new Set([
	'COLLAB_INVITE_PORTAL_DISABLED',
	'COLLAB_INVITE_ACCESS_DENIED',
	'COLLAB_INVITE_MODULES_UNAVAILABLE',
	'COLLAB_INVITE_TECHNICAL_DISABLED',
	'COLLAB_INVITE_FEATURE_UNAVAILABLE',
	'COLLAB_INVITE_EXTRANET_NOT_CONFIGURED',
	'COLLAB_INVITE_GROUP_DISABLED',
]);

const getInvitationErrorMessage = (error: ?RunActionError): string => {
	if (InvitationErrorCodes.has(error?.code) && Type.isStringFilled(error?.message) && error.message.trim().length > 0)
	{
		return Text.encode(error.message);
	}

	return Loc.getMessage('IM_NOTIFIER_DEFAULT_ERROR');
};

export const CollabNotifier = {
	onBeforeDelete(): void
	{
		showNotification(CollabManager.getBeforeDeleteText());
	},

	onUpdateLinkComplete(): void
	{
		showNotification(Loc.getMessage('IM_NOTIFIER_LINK_UPDATE_COMPLETE'));
	},

	handleDeleteError(error: RunActionError): void
	{
		if (NotEmptyCollabErrorCodes.has(error.code))
		{
			showNotification(CollabManager.getNotEmptyDeleteErrorText());

			return;
		}

		showNotification(CollabManager.getDeleteErrorText());
	},

	onLeaveError(error: RunActionError): void
	{
		const NotificationTextByErrorCode = {
			[ErrorCode.collab.leaveFromStructure]: CollabManager.getLeaveFromStructureErrorText(),
			default: CollabManager.getLeaveErrorText(),
		};

		const notificationText = NotificationTextByErrorCode[error?.code] ?? NotificationTextByErrorCode.default;
		showNotification(notificationText);
	},

	onKickUserError(error: RunActionError): void
	{
		const NotificationTextByErrorCode = {
			[ErrorCode.collab.excludeFromStructure]: Loc.getMessage('IM_NOTIFIER_KICK_CHAT_STRUCTURE_ERROR'),
			default: CollabManager.getKickErrorText(),
		};

		const notificationText = NotificationTextByErrorCode[error?.code] ?? NotificationTextByErrorCode.default;
		showNotification(notificationText);
	},

	onCollaberNotAcceptInvitation(): void
	{
		showNotification(Loc.getMessage('IM_NOTIFIER_COLLAB_COLLABER_NOT_ACCEPT_INVITATION'));
	},

	onCopyLinkError(error?: RunActionError): void
	{
		if (Type.isNil(error?.code) || error.code === 0)
		{
			showNotification(CollabManager.getCopyLinkError());

			return;
		}

		showNotification(getInvitationErrorMessage(error));
	},

	onUpdateLinkError(error?: RunActionError): void
	{
		showNotification(getInvitationErrorMessage(error));
	},

	handleCreateError(error: RunActionError): void
	{
		const NotificationTextByErrorCode = {
			[CollabErrorCode.emptyName]: Loc.getMessage('IM_NOTIFIER_COLLAB_EMPTY_NAME_ERROR'),
			[CollabErrorCode.duplicateName]: Loc.getMessage('IM_NOTIFIER_COLLAB_DUPLICATE_NAME_ERROR'),
			[CollabErrorCode.urlInName]: Loc.getMessage('IM_NOTIFIER_COLLAB_URL_IN_NAME_ERROR'),
			default: Loc.getMessage('IM_NOTIFIER_CHAT_CREATE_ERROR'),
		};

		const notificationText = NotificationTextByErrorCode[error.code] ?? NotificationTextByErrorCode.default;
		showNotification(notificationText);
	},

	handleUpdateError(error: RunActionError): void
	{
		const NotificationTextByErrorCode = {
			[CollabErrorCode.emptyName]: Loc.getMessage('IM_NOTIFIER_COLLAB_EMPTY_NAME_ERROR'),
			[CollabErrorCode.duplicateName]: Loc.getMessage('IM_NOTIFIER_COLLAB_DUPLICATE_NAME_ERROR'),
			[CollabErrorCode.urlInName]: Loc.getMessage('IM_NOTIFIER_COLLAB_URL_IN_NAME_ERROR'),
			default: Loc.getMessage('IM_NOTIFIER_CHAT_UPDATE_ERROR'),
		};

		const notificationText = NotificationTextByErrorCode[error.code] ?? NotificationTextByErrorCode.default;
		showNotification(notificationText);
	},
};
