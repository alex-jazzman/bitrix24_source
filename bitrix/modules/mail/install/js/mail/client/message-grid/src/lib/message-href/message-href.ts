/**
 * Where a message opens, out of the template the screen gave once and the identifier of a row.
 *
 * No page of the list carries an address of its own: the address is built out of the settings of the
 * mail section, which are known to the page of the screen alone. So the screen ships the template
 * (`MessageHrefTemplate` on the server) and every page ships identifiers. The template is never sent
 * back - an address named by the client would come back drawn into the rows.
 */

/** The same word `MessageHrefTemplate::ID_PLACEHOLDER` writes. */
const IdPlaceholder = '__MESSAGE_ID__';

export function buildMessageHref(template: string, messageId: number): string
{
	return template.replaceAll(IdPlaceholder, String(messageId));
}
