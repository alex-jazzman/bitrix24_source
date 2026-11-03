/**
 * @module mail/device-contacts/src/session
 */
jn.define('mail/device-contacts/src/session', (require, exports, module) => {
	const { Type } = require('type');

	/**
	 * How many contacts reach the native widget at once. Measured on a book of 10 000: the whole book
	 * costs 4,3 s against the 1,5 s the product asks for, 2000 items cost 312 ms at p95. The bigger
	 * window buys a longer list to scroll at the price of a slower opening, so the
	 * number is expected to be revisited on a real device. The rest of the book stays reachable through
	 * search, which walks every contact of the book in under a millisecond. Feeding the widget in
	 * chunks is not an option: it costs more than a single fill.
	 */
	const WINDOW_SIZE = 2000;

	/**
	 * The punctuation splitByWords of utils/string treats as a word boundary. The search key repeats
	 * that split and keeps a leading space before every word, so looking up ` <word>` in the key means
	 * exactly what compareWords means: a word of the value starts with a word of the query. A key
	 * holding the plain text instead would silently lose a two-word query.
	 */
	const WORD_SEPARATORS = /[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}]/g;

	function splitIntoWords(value)
	{
		return value
			.replace(WORD_SEPARATORS, ' ')
			.trim()
			.toLowerCase()
			.split(/\s+/)
			.filter((word) => word !== '');
	}

	function buildSearchKey(contact)
	{
		const source = `${contact.name} ${contact.emails.map(({ value }) => value).join(' ')}`;

		return ` ${splitIntoWords(source).join(' ')} `;
	}

	/**
	 * The address book of an open selection, kept the way the screen needs it: the whole book to
	 * search through, a window of it to show, and the contacts the user has picked. It has no native,
	 * network, or disk dependencies, so search and selection can be checked off the device.
	 */
	class DeviceContactsSession
	{
		#contacts;
		#contactsById;
		#searchKeys;
		#windowSize;
		#selectedIds = [];

		/**
		 * @param {Array<{
		 *   id: string,
		 *   name: string,
		 *   avatar: string|null,
		 *   emails: Array<{ value: string, type: string|null }>,
		 * }>} normalized contacts
		 * @param {number} [windowSize] how many contacts a single answer may hold
		 */
		constructor(contacts, windowSize = WINDOW_SIZE)
		{
			this.#contacts = Type.isArray(contacts) ? contacts : [];
			this.#windowSize = windowSize;
			this.#searchKeys = this.#contacts.map(buildSearchKey);
			this.#contactsById = new Map(this.#contacts.map((contact) => [contact.id, contact]));
		}

		/**
		 * @return {boolean} whether the book has no contact to show at all
		 */
		get isEmpty()
		{
			return this.#contacts.length === 0;
		}

		/**
		 * The widget reports a selection by row identifiers alone, so the book stays the only place
		 * that knows the addresses behind them.
		 *
		 * @param {string} id identifier of a device contact
		 * @return {?object} contact of the book, null when the identifier is not one of its own
		 */
		getContact(id)
		{
			return this.#contactsById.get(id) ?? null;
		}

		/**
		 * The picked contacts belong to the session rather than to the widget: the address menu of a
		 * multi-address contact opens over the list, and a cancelled address must cost the user that
		 * contact alone, not the whole selection.
		 *
		 * @param {string[]} ids identifiers of the rows the widget reports as picked
		 */
		select(ids)
		{
			this.#selectedIds = [...ids];
		}

		/**
		 * @return {number} how many rows are picked right now
		 */
		get selectedCount()
		{
			return this.#selectedIds.length;
		}

		/**
		 * @return {object[]} picked contacts of the book, in the order the widget reported them
		 */
		get selectedContacts()
		{
			return this.#selectedIds
				.map((id) => this.getContact(id))
				.filter((contact) => contact !== null);
		}

		/**
		 * Matches the name and every address of a contact. An empty query or punctuation alone applies
		 * no filtering, matching the reference search.
		 *
		 * @param {string} [query]
		 * @return {object[]} contacts of the book, never more than the window holds
		 */
		search(query)
		{
			const words = Type.isStringFilled(query) ? splitIntoWords(query) : [];
			if (words.length === 0)
			{
				return this.#contacts.slice(0, this.#windowSize);
			}

			const found = [];

			for (let index = 0; index < this.#contacts.length && found.length < this.#windowSize; index++)
			{
				const key = this.#searchKeys[index];
				if (words.every((word) => key.includes(` ${word}`)))
				{
					found.push(this.#contacts[index]);
				}
			}

			return found;
		}
	}

	module.exports = { DeviceContactsSession };
});
