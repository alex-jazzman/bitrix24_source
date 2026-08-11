import 'ui.notification';

export const showNotify = (content: string): void => {
	BX.UI.Notification.Center.notify({ content });
};
