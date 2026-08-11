import { Loc } from 'main.core';
import { NotificationPanel } from 'ui.notification-panel';
import { Icon, Main } from 'ui.icon-set.api.core';
import 'ui.icon-set.main';

const AUTO_HIDE_DELAY = 5000;

let activePanel = null;
let autoHideTimeout = null;

function clearAutoHide()
{
	if (autoHideTimeout)
	{
		clearTimeout(autoHideTimeout);
		autoHideTimeout = null;
	}
}

function hideActivePanel()
{
	clearAutoHide();

	if (activePanel)
	{
		activePanel.hide();
		activePanel = null;
	}
}

export function notify(messageKey)
{
	hideActivePanel();

	const panel = new NotificationPanel({
		content: Loc.getMessage(messageKey),
		backgroundColor: 'var(--ui-color-accent-main-alert)',
		textColor: 'var(--ui-color-base-white-fixed)',
		crossColor: 'var(--ui-color-base-white-fixed)',
		leftIcon: new Icon({
			icon: Main.WARNING_ALARM,
			color: 'var(--ui-color-base-white-fixed)',
		}),
		events: {
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
	}, AUTO_HIDE_DELAY);
}
