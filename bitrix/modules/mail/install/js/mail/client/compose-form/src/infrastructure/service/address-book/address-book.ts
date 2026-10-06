import { ajax, Runtime, Type } from 'main.core';
import { EventEmitter } from 'main.core.events';

import { type RecipientItemDto } from '../../../model/compose/types';

/** `ajax` of `main.core` carries no types, so the one used call is declared here. */
type Transport = {
	runAction(action: string, config: { data: Record<string, unknown> }): Promise<{ data?: unknown }>,
};

/** Items of the selector, as `Message::getSelectedRecipientsForDialog()` builds them. */
type SaveContactResponse = {
	data?: RecipientItemDto[],
};

export type ContactDialogApi = {
	saveContact(name: string, email: string, id: string): Promise<SaveContactResponse>,
	openCreateDialog(config: {
		prefixId: number,
		showEmailError: boolean,
		responseError?: unknown,
		contactData: { email: string, name: string },
	}): number | string,
	openEditDialog(config: {
		contactID: number,
		prefixId: number,
		contactData: { email: string, name: string },
	}): number | string,
};

type ContactDialogExtension = {
	DialogEditContact: ContactDialogApi,
};

export type ContactDialogHost = {
	dialog: ContactDialogApi,
	eventEmitter: typeof EventEmitter,
};

type PortalWindow = {
	BX?: {
		Runtime?: typeof Runtime,
		Event?: {
			EventEmitter?: typeof EventEmitter,
		},
	},
};

const transport = ajax as Transport;

/**
 * The upper window owns both the slider and its styles. Loading the saver there too keeps every contact flow
 * in one Runtime and event cache; a page without a complete upper host uses its own one.
 */
export function loadContactDialog(): Promise<ContactDialogHost>
{
	const host = getContactDialogHost();

	return (host.runtime.loadExtension('mail.dialogeditcontact') as unknown as Promise<ContactDialogExtension>)
		.then((extension: ContactDialogExtension): ContactDialogHost => ({
			dialog: extension.DialogEditContact,
			eventEmitter: host.eventEmitter,
		}));
}

function getContactDialogHost(): { runtime: typeof Runtime, eventEmitter: typeof EventEmitter }
{
	const localHost = { runtime: Runtime, eventEmitter: EventEmitter };

	try
	{
		const topBx = (window.top as unknown as PortalWindow | null)?.BX;
		if (Type.isFunction(topBx?.Runtime?.loadExtension) && topBx.Event?.EventEmitter)
		{
			return { runtime: topBx.Runtime, eventEmitter: topBx.Event.EventEmitter };
		}
	}
	catch
	{
		return localHost;
	}

	return localHost;
}

/** The action answers with this value when the address is in no contact. */
const NoContact = 0;

/** Identifier a contact that does not exist yet is saved under. */
const NewContact = 'new';

/** `0` when the user has no contact under the address. */
export function getContactIdByEmail(email: string): Promise<number>
{
	return transport
		.runAction('mail.addressbook.getContactIdByEmail', { data: { email } })
		.then((response) => Number(response.data) || NoContact);
}

/**
 * The call goes through the contact dialog of the module: it builds the avatar of the record out of the name
 * and the address. The items of the answer travel on as they came.
 */
export function saveContact(name: string, email: string): Promise<RecipientItemDto[]>
{
	return loadContactDialog()
		.then((host: ContactDialogHost) => host.dialog.saveContact(name, email, NewContact))
		.then((response) => response.data ?? []);
}
