import 'ui.notification';

type NotificationParams = {
	autoHideDelay: number,
};

export const showNotification = (text: string, params: NotificationParams): void => {
	BX.UI.Notification.Center.notify({ content: text, ...params });
};
