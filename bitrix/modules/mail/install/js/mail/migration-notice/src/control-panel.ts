import { Loc, Runtime, Type, ajax } from 'main.core';
import { type Center } from 'ui.notification';

/**
 * DTO-02. The buttons of the feature that lead into the control panel of the company mail. The address of
 * the panel is not one of them to spell: it is issued for one person, once, and expires in a minute.
 */
const CONTROL_PANEL_BUTTONS: Set<string> = new Set(['transfer_mail', 'create_company_mail']);

const ENTRY_ACTION = 'mail.controlpanel.getEntryUrl';

/** Whether this button of a decision is a way into the control panel rather than an ordinary address. */
export function leadsToControlPanel(buttonId: string): boolean
{
	return CONTROL_PANEL_BUTTONS.has(buttonId);
}

/**
 * Opens the control panel of the company mail.
 *
 * The address is asked for here and now, at the moment a person pressed the button, because that is the only
 * moment it is good for: the service issues a one-off ticket that lives 60 seconds and dies on the first
 * use. An address put into the markup of a page, into a decision of the server or into an option would be
 * dead by the time anybody followed it - which is why this is a request and not a link.
 *
 * The address carries a secret in its fragment. It is therefore followed whole and never taken apart, logged
 * or rebuilt: a fragment never leaves the browser, and that is what keeps the ticket out of the journals of
 * the receiving side and out of `Referer`.
 *
 * A refusal is said out loud rather than swallowed. A person who pressed a button and saw nothing happen has
 * no way of telling a portal that is busy from a portal that is broken.
 */
export async function openControlPanel(): Promise<void>
{
	try
	{
		const { data } = await ajax.runAction(ENTRY_ACTION, { data: {} });
		const url = Type.isStringFilled(data?.url) ? String(data.url) : '';

		if (url === '')
		{
			await announceRefusal();

			return;
		}

		window.location.href = url;
	}
	catch (error: unknown)
	{
		await announceRefusal(refusalOf(error));
	}
}

/**
 * What the person is told. The words come from the server when it sent any: the reasons differ - a right
 * this person does not have, a service that is busy - and only the server knows which of them it was. It
 * speaks to a person and not to a client, so what it says is shown as it came.
 */
function refusalOf(error: unknown): string
{
	const errors = (error as { errors?: unknown })?.errors;
	if (!Array.isArray(errors))
	{
		return '';
	}

	const spoken = errors.find(
		(item: unknown): boolean => Type.isStringFilled((item as { message?: unknown })?.message),
	);

	return spoken === undefined ? '' : String((spoken as { message: string }).message);
}

async function announceRefusal(said: string = ''): Promise<void>
{
	try
	{
		const ui = await Runtime
			.loadExtension('ui.notification')
			.then((exports: unknown): { Center: typeof Center } => exports as { Center: typeof Center })
		;

		const content = said === ''
			? (Loc.getMessage('MAIL_MIGRATION_NOTICE_CONTROL_PANEL_REFUSED') ?? '')
			: said
		;

		ui.Center.notify({ content });
	}
	catch
	{
		// Telling a person the panel is closed must not cost them the page they stand on
	}
}

/**
 * The way into the control panel as a page of the portal calls it: a name in the namespace of the module,
 * so a template names the entry instead of spelling an address it must not spell.
 */
export class MigrationControlPanel
{
	static open(): void
	{
		void openControlPanel();
	}
}
