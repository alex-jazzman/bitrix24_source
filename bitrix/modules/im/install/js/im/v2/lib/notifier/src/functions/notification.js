import { SettingsService } from 'im.v2.provider.service.settings';
import { Loc } from 'main.core';

import { showNotification } from '../utils/notification';

export const NotificationNotifier = {
	onSubscribeComplete(type: string): void
	{
		const phrase = Loc.getMessage('IM_NOTIFIER_SUBSCRIBE_COMPLETE', {
			'#TYPE#': type,
		});

		showNotification(phrase);
	},
	onUnsubscribeComplete(type: string, callback: Function): void
	{
		const params = {
			autoHideDelay: 5000,
			actions: [{
				title: Loc.getMessage('IM_NOTIFICATIONS_ITEM_MENU_UNSUBSCRIBE_CANCEL'),
				events: {
					click: callback,
				},
			}],
		};

		const phrase = Loc.getMessage('IM_NOTIFIER_UNSUBSCRIBE_COMPLETE', {
			'#TYPE#': type,
		});

		showNotification(phrase, params);
	},
};
