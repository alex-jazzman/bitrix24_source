import { Page } from 'main.core';

/** Milliseconds, the delay the old compose form used. */
const AutoHideDelay = 2000;

type NotificationCenter = {
	notify(options: { content: string, autoHideDelay: number }): void,
};

type PortalWindow = Window & {
	BX?: {
		UI?: {
			Notification?: {
				Center?: NotificationCenter,
			},
		},
	},
};

/**
 * The manager of the portal window, not of the panel frame: the panel closes as soon as the message is sent,
 * and a notification shown inside that frame would go down with it. A window carrying no manager shows none.
 */
function getPortalNotificationCenter(): NotificationCenter | null
{
	const portalWindow = Page.getRootWindow() as PortalWindow;

	return portalWindow.BX?.UI?.Notification?.Center ?? null;
}

export function notifyPortal(text: string): void
{
	getPortalNotificationCenter()?.notify({ content: text, autoHideDelay: AutoHideDelay });
}
