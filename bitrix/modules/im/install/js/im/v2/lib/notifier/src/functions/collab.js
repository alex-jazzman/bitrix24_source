import { Loc } from 'main.core';

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

	onLeaveError(): void
	{
		showNotification(CollabManager.getLeaveErrorText());
	},

	onKickUserError(): void
	{
		showNotification(CollabManager.getKickErrorText());
	},

	onCollaberNotAcceptInvitation(): void
	{
		showNotification(Loc.getMessage('IM_NOTIFIER_COLLAB_COLLABER_NOT_ACCEPT_INVITATION'));
	},

	onCopyLinkError(): void
	{
		showNotification(CollabManager.getCopyLinkError());
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
