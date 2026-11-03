import { Loc, Reflection, Type } from 'main.core';
import { LiveAnnouncer } from 'ui.a11y';
import { Button, ButtonColor, ButtonSize } from 'ui.buttons';
import { Icon, Main } from 'ui.icon-set.api.core';
import 'ui.icon-set.main';
import { Center as Notifier } from 'ui.notification';
import { NotificationPanel } from 'ui.notification-panel';

/** The legacy clipboard of the kernel: the only way to copy over plain http. */
type LegacyClipboard = {
	copy: (text: string) => boolean,
};

/** The confirmation of the copying is a fleeting one: it starts fading away two seconds after it appeared. */
const ConfirmationLifetime = 2000;

let refusalPanel: NotificationPanel | null = null;

/**
 * Copying of the object address. The address does not depend on the state of the public access and
 * copying never turns that access on - the header hands over exactly the link it was given.
 */
export async function copyLink(url: string): Promise<boolean>
{
	if (!Type.isStringFilled(url))
	{
		return false;
	}

	const copied = await writeToClipboard(url);
	if (copied)
	{
		hideRefusalPanel();

		const confirmation = Loc.getMessage('DISK_DOCUMENT_HEADER_LINK_COPIED') ?? '';

		// the balloon of the design system is a sight and nothing more: the outcome is spoken separately
		LiveAnnouncer.announce(confirmation);
		Notifier.notify({
			content: confirmation,
			autoHideDelay: ConfirmationLifetime,
			useAirDesign: true,
		});

		return true;
	}

	showRefusalPanel(url);

	return false;
}

async function writeToClipboard(url: string): Promise<boolean>
{
	// the clipboard API is unavailable over plain http, where the portal is still served
	if (window.isSecureContext && Type.isFunction(navigator.clipboard?.writeText))
	{
		try
		{
			await navigator.clipboard.writeText(url);

			return true;
		}
		catch
		{
			// the browser refuses the write on an unfocused document as well - fall back below
		}
	}

	const legacyClipboard = Reflection.getClass('BX.clipboard') as unknown as LegacyClipboard | null;

	return Type.isFunction(legacyClipboard?.copy) && legacyClipboard.copy(url) === true;
}

function showRefusalPanel(url: string): void
{
	hideRefusalPanel();

	const message = Loc.getMessage('DISK_DOCUMENT_HEADER_COPY_LINK_ERROR') ?? '';

	// the panel of the design system carries no live region of its own
	LiveAnnouncer.announce(message, 'assertive');

	const panel: NotificationPanel = new NotificationPanel({
		id: null,
		styleClass: '',
		content: message,
		backgroundColor: 'var(--ui-color-accent-main-alert)',
		textColor: 'var(--ui-color-base-white-fixed)',
		crossColor: 'var(--ui-color-base-white-fixed)',
		leftIcon: new Icon({
			icon: Main.WARNING_ALARM,
			color: 'var(--ui-color-base-white-fixed)',
		}),
		rightButtons: [
			new Button({
				text: Loc.getMessage('DISK_DOCUMENT_HEADER_RETRY_BUTTON') ?? '',
				size: ButtonSize.EXTRA_SMALL,
				color: ButtonColor.LIGHT_BORDER,
				collapsedIcon: '',
				noCaps: true,
				round: true,
				onclick: () => copyLink(url),
			}),
		],
		showCloseIcon: true,
		zIndex: null,
		events: null,
	});

	panel.subscribe('onHide', () => {
		if (refusalPanel === panel)
		{
			refusalPanel = null;
		}
	});

	refusalPanel = panel;
	panel.show();
}

function hideRefusalPanel(): void
{
	if (refusalPanel !== null)
	{
		refusalPanel.hide();
		refusalPanel = null;
	}
}
