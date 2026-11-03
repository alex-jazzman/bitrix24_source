/**
 * @module mail/testing/fixtures/device-contacts
 */
jn.define('mail/testing/fixtures/device-contacts', (require, exports, module) => {
	const { Type } = require('type');

	const DeviceContactFixtureId = Object.freeze({
		WITHOUT_EMAILS: 'fixture-without-emails',
		SINGLE_EMAIL: 'fixture-single-email',
		TWO_TYPED_EMAILS: 'fixture-two-typed-emails',
		UNTYPED_EMAILS: 'fixture-untyped-emails',
		MANY_EMAILS: 'fixture-many-emails',
		DUPLICATE_EMAILS: 'fixture-duplicate-emails',
		WRAPPED_EMAILS: 'fixture-wrapped-emails',
		MIXED_VALIDITY: 'fixture-mixed-validity',
		INVALID_EMAILS_ONLY: 'fixture-invalid-emails-only',
		WITHOUT_NAME: 'fixture-without-name',
		LONG_NAME: 'fixture-long-name',
		UNICODE: 'fixture-unicode',
	});

	const LONG_NAME = 'Максимилиан Иннокентьевич Александров-Оболенский '.repeat(6).trim();

	/**
	 * The address book as the operating system hands it over: the emails key is present even when
	 * empty, the avatar key is missing when the contact has no photo, and values keep the spacing
	 * and the case the user typed.
	 */
	const bookFactories = Object.freeze({
		[DeviceContactFixtureId.WITHOUT_EMAILS]: () => ({
			id: DeviceContactFixtureId.WITHOUT_EMAILS,
			displayName: 'David Taylor',
			firstName: 'David',
			secondName: 'Taylor',
			emails: [],
		}),
		// The padding is deliberate: it keeps the name trimming of ALG-01 load-bearing.
		[DeviceContactFixtureId.SINGLE_EMAIL]: () => ({
			id: DeviceContactFixtureId.SINGLE_EMAIL,
			displayName: ' Kate Bell ',
			firstName: 'Kate',
			secondName: 'Bell',
			avatar: 'file:///contacts/kate-bell.jpg',
			emails: [
				{ type: 'work', value: 'kate-bell@mac.com' },
			],
		}),
		[DeviceContactFixtureId.TWO_TYPED_EMAILS]: () => ({
			id: DeviceContactFixtureId.TWO_TYPED_EMAILS,
			displayName: 'Daniel Higgins Jr.',
			firstName: 'Daniel',
			secondName: 'Higgins',
			emails: [
				{ type: 'home', value: 'd-higgins@mac.com' },
				{ type: 'work', value: 'daniel.higgins@example.org' },
			],
		}),
		[DeviceContactFixtureId.UNTYPED_EMAILS]: () => ({
			id: DeviceContactFixtureId.UNTYPED_EMAILS,
			displayName: 'Anna Haro',
			firstName: 'Anna',
			secondName: 'Haro',
			emails: [
				{ value: 'anna-haro@mac.com' },
				{ type: '', value: 'anna.haro@example.org' },
			],
		}),
		[DeviceContactFixtureId.MANY_EMAILS]: () => ({
			id: DeviceContactFixtureId.MANY_EMAILS,
			displayName: 'Hank M. Zakroff',
			firstName: 'Hank',
			secondName: 'Zakroff',
			// The last label is one the user typed on the device: such a type comes from the operating
			// system in the words of the user, and the menu of addresses shows it in those words.
			emails: Array.from({ length: 11 }, (unused, index) => ({
				type: index === 10 ? 'Дача' : 'other',
				value: `hank.zakroff+${index + 1}@example.org`,
			})),
		}),
		[DeviceContactFixtureId.DUPLICATE_EMAILS]: () => ({
			id: DeviceContactFixtureId.DUPLICATE_EMAILS,
			displayName: 'John Appleseed',
			firstName: 'John',
			secondName: 'Appleseed',
			emails: [
				{ type: 'work', value: ' John-Appleseed@mac.com ' },
				{ type: 'home', value: 'john-appleseed@mac.com' },
				{ type: 'other', value: 'JOHN-APPLESEED@MAC.COM' },
				{ type: 'home', value: 'john.appleseed@example.org' },
			],
		}),
		[DeviceContactFixtureId.WRAPPED_EMAILS]: () => ({
			id: DeviceContactFixtureId.WRAPPED_EMAILS,
			displayName: 'Ирина Ковалёва',
			firstName: 'Ирина',
			secondName: 'Ковалёва',
			emails: [
				{ type: 'work', value: 'Ирина Ковалёва <i.kovaleva@example.org>' },
				{ type: 'home', value: 'mailto:irina@example.org' },
			],
		}),
		[DeviceContactFixtureId.MIXED_VALIDITY]: () => ({
			id: DeviceContactFixtureId.MIXED_VALIDITY,
			displayName: 'Sergey Orlov',
			firstName: 'Sergey',
			secondName: 'Orlov',
			emails: [
				{ type: 'work', value: 'not-an-email' },
				{ type: 'home', value: 'пишите на s.orlov@example.org в любое время' },
				{ type: 'work', value: 's.orlov@example.org' },
			],
		}),
		[DeviceContactFixtureId.INVALID_EMAILS_ONLY]: () => ({
			id: DeviceContactFixtureId.INVALID_EMAILS_ONLY,
			displayName: 'Pavel Sokolov',
			firstName: 'Pavel',
			secondName: 'Sokolov',
			emails: [
				{ type: 'work', value: 'sokolov@localhost' },
				{ type: 'home', value: '@example.org' },
				{ type: 'other', value: '   ' },
			],
		}),
		// Two addresses on purpose: a contact the address book has no name for still has to be named in
		// the menu of its addresses, and the first address is the only name left for it.
		[DeviceContactFixtureId.WITHOUT_NAME]: () => ({
			id: DeviceContactFixtureId.WITHOUT_NAME,
			emails: [
				{ type: 'home', value: 'no.name@example.org' },
				{ type: 'work', value: 'no.name.work@example.org' },
			],
		}),
		[DeviceContactFixtureId.LONG_NAME]: () => ({
			id: DeviceContactFixtureId.LONG_NAME,
			displayName: LONG_NAME,
			firstName: 'Максимилиан',
			secondName: 'Александров-Оболенский',
			emails: [
				{ type: 'work', value: 'maksimilian@example.org' },
			],
		}),
		[DeviceContactFixtureId.UNICODE]: () => ({
			id: DeviceContactFixtureId.UNICODE,
			displayName: 'Иван Петров-Водкин 🙂',
			firstName: 'Иван',
			secondName: 'Петров-Водкин',
			emails: [
				{ type: 'home', value: 'иван@почта.рф' },
				{ type: 'work', value: 'i.petrov@example.org' },
			],
		}),
	});

	/**
	 * @param {string[]} [ids] identifiers to take, in the requested order; the whole book by default
	 * @return {object[]} freshly built raw contacts, safe to mutate in a check
	 */
	function createDeviceContactsBook(ids)
	{
		const requested = ids ?? Object.keys(bookFactories);

		return requested.map((id) => {
			const factory = bookFactories[id];
			if (!factory)
			{
				throw new Error(`Unknown device contact fixture: ${id}`);
			}

			return factory();
		});
	}

	/**
	 * @param {object} [answers] replies of the provider methods; a function is called on every read
	 * @return {object} provider of the access cascade with a call counter
	 */
	function createAccessProvider(answers = {})
	{
		const calls = {
			isSupported: 0,
			hasAccess: 0,
			hasDeterminedStatus: 0,
			requestAccess: 0,
			showAccessExplanation: 0,
			showReadFailureExplanation: 0,
			openSettings: 0,
			waitForAppActive: 0,
		};

		const replies = {
			isSupported: true,
			hasAccess: false,
			hasDeterminedStatus: false,
			requestAccess: false,
			showAccessExplanation: false,
			showReadFailureExplanation: false,
			waitForAppActive: null,
			...answers,
		};

		const reply = (name) => {
			calls[name] += 1;
			const value = replies[name];

			return Type.isFunction(value) ? value() : value;
		};

		return {
			calls,
			isSupported: () => reply('isSupported'),
			hasAccess: () => reply('hasAccess'),
			hasDeterminedStatus: () => reply('hasDeterminedStatus'),
			requestAccess: async () => reply('requestAccess'),
			showAccessExplanation: async () => reply('showAccessExplanation'),
			showReadFailureExplanation: async () => reply('showReadFailureExplanation'),
			waitForAppActive: async () => reply('waitForAppActive'),
			openSettings: () => {
				calls.openSettings += 1;
			},
		};
	}

	/**
	 * Holds an asynchronous step open until the check is ready to let it through.
	 *
	 * @return {{ promise: Promise<void>, open: () => void }}
	 */
	function createGate()
	{
		let open = null;
		const promise = new Promise((resolve) => {
			open = resolve;
		});

		return { promise, open };
	}

	/**
	 * Stands in for reading the address book. Deliberately unaware of the list shape, so the same
	 * factory serves raw and normalized contacts.
	 *
	 * @param {{
	 *   contacts?: object[],
	 *   error?: Error|function(number): ?Error,
	 *   gate?: Promise<void>,
	 * }} [options] a function error is asked on every read and gets the number of that read, so a
	 *   check can fail the first attempt and let the second one through
	 * @return {{ read: () => Promise<object[]>, calls: { read: number } }}
	 */
	function createContactsSource(options = {})
	{
		const { contacts = createDeviceContactsBook(), error = null, gate = null } = options;
		const calls = { read: 0 };

		return {
			calls,
			read: async () => {
				calls.read += 1;

				if (gate)
				{
					await gate;
				}

				const failure = Type.isFunction(error) ? error(calls.read) : error;
				if (failure)
				{
					throw failure;
				}

				return contacts;
			},
		};
	}

	/**
	 * Stands in for the native selection widget: remembers what the screen told it and hands the
	 * widget events back to the screen, so the session can be driven without a device.
	 *
	 * @return {object} widget with a call counter, the last applied state and an emit of its events
	 */
	function createSelectorWidget()
	{
		const listeners = new Map();
		const firstFill = createGate();
		const calls = { setItems: 0, close: 0 };
		const state = {
			items: [],
			title: null,
			sendButtonText: null,
			sendButtonVisible: false,
			sendButtonEnabled: null,
			sendButtonCounter: null,
			multipleSelection: false,
		};

		const on = (event, handler) => {
			listeners.set(event, [...(listeners.get(event) ?? []), handler]);
		};

		return {
			calls,
			state,
			on,
			removeEventListener: (event, handler) => {
				const rest = (listeners.get(event) ?? []).filter((item) => item !== handler);
				if (rest.length === 0)
				{
					listeners.delete(event);
				}
				else
				{
					listeners.set(event, rest);
				}
			},
			emit: (event, data = {}) => {
				(listeners.get(event) ?? []).forEach((handler) => handler(data));
			},
			get listenedEvents()
			{
				return [...listeners.keys()];
			},
			/**
			 * Handlers the screen has put on an event, kept reachable so a check can call one after the
			 * session is over, matching a late native callback.
			 *
			 * @param {string} event
			 * @return {Function[]}
			 */
			handlersOf: (event) => [...(listeners.get(event) ?? [])],
			/**
			 * The moment the screen has finished setting up the session: the last thing it does before
			 * waiting for the user is filling the list. Awaiting this instead of a timer keeps a check
			 * free of guessing how long a native call takes.
			 */
			get filled()
			{
				return firstFill.promise;
			},
			setItems: (items) => {
				calls.setItems += 1;
				state.items = items;
				firstFill.open();
			},
			setTitle: (title) => {
				state.title = title;
			},
			setSendButtonEnabled: (enabled) => {
				state.sendButtonEnabled = enabled;
			},
			setSendButtonText: (text) => {
				state.sendButtonText = text;
			},
			setSendButtonVisible: (visible) => {
				state.sendButtonVisible = visible;
			},
			setSendButtonCounter: (counter) => {
				state.sendButtonCounter = counter;
			},
			allowMultipleSelection: (allow) => {
				state.multipleSelection = allow;
			},
			setPlaceholder: () => {},
			setSearchEnabled: () => {},
			enableNavigationBarBorder: () => {},
			close: (callback) => {
				calls.close += 1;
				callback?.();
			},
		};
	}

	/**
	 * Stands in for the address menu of a contact: remembers what the screen asked it to show and
	 * answers the way the check tells it to, so the walk over the picked contacts and the cancels are
	 * driven without a device.
	 *
	 * @param {function({ title: string, items: object[] }, number): (?string|Promise<?string>)} [answer]
	 *   asked on every menu and given the number of that menu; cancels every menu by default
	 * @return {{ open: (params: object) => Promise<?string>, calls: object[] }}
	 */
	function createAddressMenu(answer = () => null)
	{
		const calls = [];

		return {
			calls,
			open: async (params) => {
				calls.push(params);

				return answer(params, calls.length);
			},
		};
	}

	/**
	 * @param {object} [widget] widget the layout opens; a fresh selection widget by default
	 * @return {object} parent layout of the selection with a call counter
	 */
	function createParentLayout(widget = createSelectorWidget())
	{
		const calls = { openWidget: 0 };

		return {
			calls,
			widget,
			openWidget()
			{
				calls.openWidget += 1;

				return Promise.resolve(widget);
			},
		};
	}

	module.exports = {
		DeviceContactFixtureId,
		createDeviceContactsBook,
		createAccessProvider,
		createAddressMenu,
		createContactsSource,
		createGate,
		createParentLayout,
	};
});
