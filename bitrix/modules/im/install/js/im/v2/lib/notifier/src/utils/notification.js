import 'ui.notification';
import { type Balloon } from 'ui.notification';

export type NotificationAction = {
	title: string,
	events: { [eventName: string]: () => void },
}

type NotificationParams = {
	autoHideDelay?: number,
	actions?: NotificationAction[],
	id?: string,
};

export const showNotification = (
	content: string | HTMLElement,
	params: NotificationParams = {},
): Balloon => {
	const balloon = BX.UI.Notification.Center.notify({ content, blinkOnUpdate: false, ...params });

	return balloon ?? BX.UI.Notification.Center.getBalloonById(params.id);
};
