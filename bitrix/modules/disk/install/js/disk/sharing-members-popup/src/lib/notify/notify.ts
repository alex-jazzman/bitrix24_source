import { Text } from 'main.core';
import { type AriaLivePoliteness, LiveAnnouncer } from 'ui.a11y';
import { Icon, Main } from 'ui.icon-set.api.core';
import { NotificationPanel } from 'ui.notification-panel';
import 'ui.icon-set.main';

const AutoHideDelay = 5000;

let activePanel: NotificationPanel | null = null;
let autoHideTimeout: ReturnType<typeof setTimeout> | null = null;

function clearAutoHide(): void
{
	if (autoHideTimeout !== null)
	{
		clearTimeout(autoHideTimeout);
		autoHideTimeout = null;
	}
}

function hideActivePanel(): void
{
	clearAutoHide();

	if (activePanel !== null)
	{
		activePanel.hide();
		activePanel = null;
	}
}

function show(message: string, backgroundColor: string, icon: string, politeness: AriaLivePoliteness): void
{
	hideActivePanel();

	// the panel of the design system carries no live region of its own, so the text is announced here
	LiveAnnouncer.announce(message, politeness);

	// every option of the panel is declared as required, so the defaults are repeated here
	const panel = new NotificationPanel({
		id: null,
		styleClass: '',
		// the panel renders a string content as markup, so server-born text has to be encoded
		content: Text.encode(message),
		backgroundColor,
		textColor: 'var(--ui-color-base-white-fixed)',
		crossColor: 'var(--ui-color-base-white-fixed)',
		leftIcon: new Icon({
			icon,
			color: 'var(--ui-color-base-white-fixed)',
		}),
		rightButtons: [],
		showCloseIcon: true,
		zIndex: null,
		events: {
			onShow: () => {},
			onHideByButton: () => {},
			onHide: () => {
				if (activePanel === panel)
				{
					activePanel = null;
					clearAutoHide();
				}
			},
		},
	});

	activePanel = panel;
	panel.show();

	autoHideTimeout = setTimeout(() => {
		if (activePanel === panel)
		{
			panel.hide();
		}
	}, AutoHideDelay);
}

/**
 * Shows an error message. Only one panel stays on screen: a new message replaces the previous one.
 */
export function notifyError(message: string): void
{
	show(message, 'var(--ui-color-accent-main-alert)', Main.WARNING_ALARM, 'assertive');
}

export function notifySuccess(message: string): void
{
	show(message, 'var(--ui-color-accent-main-success)', Main.CIRCLE_CHECK, 'polite');
}
