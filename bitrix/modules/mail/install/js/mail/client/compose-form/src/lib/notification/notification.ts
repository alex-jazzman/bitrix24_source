import { Page } from 'main.core';

/** Milliseconds, the delay the old compose form used. */
const AutoHideDelay = 2000;

type NotificationCenter = {
	notify(options: { content: string | Element, autoHideDelay: number, closeButton?: boolean }): void,
};

type NotifyPortalOptions = {
	role?: 'alert' | 'status',
	closeButton?: boolean,
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

export function notifyPortal(text: string, options: NotifyPortalOptions = {}): void
{
	const center = getPortalNotificationCenter();
	if (!center)
	{
		return;
	}

	const notification: { content: string | Element, autoHideDelay: number, closeButton?: boolean } = {
		content: createContent(text, options.role),
		autoHideDelay: AutoHideDelay,
	};
	if (options.closeButton !== undefined)
	{
		notification.closeButton = options.closeButton;
	}

	center.notify(notification);
}

function createContent(text: string, role?: NotifyPortalOptions['role']): string | Element
{
	if (!role)
	{
		return text;
	}

	const content = Page.getRootWindow().document.createElement('span');
	content.setAttribute('role', role);
	content.setAttribute('aria-atomic', 'true');
	content.textContent = text;

	return content;
}
