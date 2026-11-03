/**
 * @module mail/device-contacts/src/normalize
 */
jn.define('mail/device-contacts/src/normalize', (require, exports, module) => {
	const { Type } = require('type');
	const { emailRegExp } = require('utils/email');

	/**
	 * The shared pattern has no anchors, so it matches an address inside any text. The device
	 * address book legitimately keeps an address wrapped, and only these two wrappings are
	 * accepted. Any other surrounding text means the value is not an address.
	 */
	const wrappedEmailForms = [
		new RegExp(`^mailto:${emailRegExp.source}$`, 'i'),
		new RegExp(`^[^<>]*<${emailRegExp.source}>$`),
	];

	function extractEmail(rawValue)
	{
		const candidate = Type.isStringFilled(rawValue) ? rawValue.trim() : '';
		if (candidate === '')
		{
			return null;
		}

		const [, email] = candidate.match(emailRegExp) ?? [];
		if (!email)
		{
			return null;
		}

		if (email === candidate)
		{
			return email;
		}

		const isWrapped = wrappedEmailForms.some((form) => candidate.match(form)?.[1] === email);

		return isWrapped ? email : null;
	}

	function normalizeEmails(rawEmails)
	{
		const emails = [];
		const seen = new Set();

		for (const entry of Type.isArray(rawEmails) ? rawEmails : [])
		{
			const value = extractEmail(entry?.value);
			const key = value?.toLowerCase();
			if (value === null || seen.has(key))
			{
				continue;
			}

			seen.add(key);
			emails.push({
				value,
				type: Type.isStringFilled(entry?.type) ? entry.type : null,
			});
		}

		return emails;
	}

	/**
	 * Selects the contacts usable as recipients and brings them to the shape the selection screen
	 * and the recipient field expect. Pure by contract: no native modules, no network, no disk.
	 *
	 * @param {Array<{
	 *   id?: string,
	 *   displayName?: string,
	 *   avatar?: string,
	 *   emails?: Array<{ value?: string, type?: string }>,
	 * }>} rawContacts as the operating system returned them
	 * @return {Array<{
	 *   id: string,
	 *   name: string,
	 *   avatar: string|null,
	 *   emails: Array<{ value: string, type: string|null }>,
	 * }>} contacts with at least one valid address
	 */
	function normalizeDeviceContacts(rawContacts)
	{
		const result = [];

		for (const contact of Type.isArray(rawContacts) ? rawContacts : [])
		{
			const emails = normalizeEmails(contact?.emails);
			if (emails.length === 0)
			{
				continue;
			}

			result.push({
				id: contact.id,
				name: Type.isStringFilled(contact.displayName) ? contact.displayName.trim() : '',
				avatar: contact.avatar ?? null,
				emails,
			});
		}

		return result;
	}

	module.exports = { normalizeDeviceContacts };
});
