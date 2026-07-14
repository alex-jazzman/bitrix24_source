import { Loc } from 'main.core';
import 'ui.notification';

export function notify(messageKey)
{
	BX.UI.Notification.Center.notify({
		content: Loc.getMessage(messageKey),
		autoHideDelay: 5000,
	});
}
