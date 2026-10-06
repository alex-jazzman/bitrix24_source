import { Loc } from 'main.core';

import { ChatType, type ChatTypeItem } from 'im.v2.const';

import { showNotification } from '../utils/notification';

export const SharedLinkNotifier = {
	onCopyIndividualLinkComplete(chatType: ChatTypeItem)
	{
		const NotificationTextByChatType = {
			[ChatType.collab]: Loc.getMessage('IM_NOTIFIER_SHARED_LINK_COPY_INDIVIDUAL_COMPLETE_COLLAB'),
			default: Loc.getMessage('IM_NOTIFIER_SHARED_LINK_COPY_INDIVIDUAL_COMPLETE'),
		};

		const notificationText = NotificationTextByChatType[chatType] ?? NotificationTextByChatType.default;
		showNotification(notificationText);
	},
	onClickInvalidLinkError(): void
	{
		showNotification(Loc.getMessage('IM_NOTIFIER_SHARED_LINK_CLICK_INVALID_ERROR'));
	},
	onChangeLinkComplete(chatType: ChatTypeItem): void
	{
		const NotificationTextByChatType = {
			[ChatType.collab]: Loc.getMessage('IM_NOTIFIER_SHARED_LINK_CHANGE_COMPLETE_COLLAB'),
			default: Loc.getMessage('IM_NOTIFIER_SHARED_LINK_CHANGE_COMPLETE'),
		};

		const notificationText = NotificationTextByChatType[chatType] ?? NotificationTextByChatType.default;
		showNotification(notificationText);
	},
	onChangeLinkError(): void
	{
		showNotification(Loc.getMessage('IM_NOTIFIER_SHARED_LINK_CHANGE_ERROR'));
	},
};
