/**
 * @module mail/device-contacts
 */
jn.define('mail/device-contacts', (require, exports, module) => {
	const { Alert, ButtonType } = require('alert');
	const { Loc } = require('loc');
	const { Notify } = require('notify');
	const { Type } = require('type');
	const { contacts } = require('native/contacts');
	const { debounce } = require('utils/function');
	const { AvatarClass, AvatarShape, AvatarEntityType } = require('ui-system/blocks/avatar');
	const { ContextMenu, ContextMenuItemType } = require('layout/ui/context-menu');
	const { normalizeDeviceContacts } = require('mail/device-contacts/src/normalize');
	const { DeviceContactsSession } = require('mail/device-contacts/src/session');

	const DeviceContactsAccessStatus = Object.freeze({
		GRANTED: 'granted',
		DENIED: 'denied',
		UNSUPPORTED: 'unsupported',
	});

	const DEVICE_CONTACT_FIELDS = ['id', 'displayName', 'emails', 'avatar'];

	const TEST_ID = 'mail-device-contacts';
	const SECTION_CODE = 'main';
	const SECTIONS = [{ id: SECTION_CODE }];

	/**
	 * Measured on a book of 10 000: the reference 500 ms leaves no room for the 300 ms the product
	 * asks for at p95, while the search itself answers in single milliseconds on precomputed keys.
	 */
	const SEARCH_INPUT_DELAY = 150;

	/**
	 * iOS reports a closed widget as onViewHidden, Android as onViewRemoved; whichever arrives first
	 * ends the session. The address menu opening over the widget is not one of these: the widget keeps
	 * quiet while it is covered (checked on a device).
	 */
	const WIDGET_CLOSE_EVENTS = ['onViewHidden', 'onViewRemoved'];

	/**
	 * The address type comes from the operating system in its own words (`work`, `home` and the like).
	 * Known system labels are localized, while a label entered by the user is shown unchanged.
	 */
	const EMAIL_TYPE_PHRASES = Object.freeze({
		work: 'MAIL_DEVICE_CONTACTS_EMAIL_TYPE_WORK',
		home: 'MAIL_DEVICE_CONTACTS_EMAIL_TYPE_HOME',
		mobile: 'MAIL_DEVICE_CONTACTS_EMAIL_TYPE_MOBILE',
		other: 'MAIL_DEVICE_CONTACTS_EMAIL_TYPE_OTHER',
	});

	function confirmSettingsNavigation(title, description)
	{
		return new Promise((resolve) => {
			Alert.confirm(
				title,
				description,
				[
					{
						text: Loc.getMessage('MAIL_DEVICE_CONTACTS_ACCESS_ALERT_SETTINGS_BUTTON'),
						type: ButtonType.DEFAULT,
						onPress: () => resolve(true),
					},
					{
						type: ButtonType.CANCEL,
						onPress: () => resolve(false),
					},
				],
			);
		});
	}

	function showAccessExplanation()
	{
		return confirmSettingsNavigation(
			Loc.getMessage('MAIL_DEVICE_CONTACTS_ACCESS_ALERT_TITLE'),
			Loc.getMessage('MAIL_DEVICE_CONTACTS_ACCESS_ALERT_DESCRIPTION'),
		);
	}

	function showReadFailureExplanation()
	{
		return confirmSettingsNavigation(
			Loc.getMessage('MAIL_DEVICE_CONTACTS_READ_FAILURE_ALERT_TITLE'),
			Loc.getMessage('MAIL_DEVICE_CONTACTS_READ_FAILURE_ALERT_DESCRIPTION'),
		);
	}

	/**
	 * The confirmation of the widget is enabled by any non-empty selection. An absent limit means no
	 * client-side check at all. The field accepts, deduplicates and limits the selected addresses.
	 *
	 * @param {number} selectedCount how many contacts are checked right now
	 * @param {number} [remainingLimit] how many recipients the message still accepts
	 * @return {{ isConfirmEnabled: boolean, remainingCount: ?number, exceedingCount: number }}
	 */
	function getSelectionState(selectedCount, remainingLimit)
	{
		if (!Type.isInteger(remainingLimit))
		{
			return {
				isConfirmEnabled: selectedCount > 0,
				remainingCount: null,
				exceedingCount: 0,
			};
		}

		const exceedingCount = Math.max(selectedCount - remainingLimit, 0);

		return {
			isConfirmEnabled: selectedCount > 0,
			remainingCount: Math.max(remainingLimit - selectedCount, 0),
			exceedingCount,
		};
	}

	/**
	 * @param {{ remainingCount: ?number, exceedingCount: number }} state
	 * @return {string} what the limit allows right now; empty when no limit is in force
	 */
	function getSelectionHint({ remainingCount, exceedingCount })
	{
		if (exceedingCount > 0)
		{
			return Loc.getMessagePlural(
				'MAIL_DEVICE_CONTACTS_SELECTOR_EXCEEDING',
				exceedingCount,
				{ '#COUNT#': exceedingCount },
			);
		}

		if (remainingCount === null)
		{
			return '';
		}

		if (remainingCount === 0)
		{
			return Loc.getMessage('MAIL_DEVICE_CONTACTS_SELECTOR_LIMIT_REACHED');
		}

		return Loc.getMessagePlural(
			'MAIL_DEVICE_CONTACTS_SELECTOR_REMAINING',
			remainingCount,
			{ '#COUNT#': remainingCount },
		);
	}

	/**
	 * Platform edge of the access cascade: every native call is guarded by a presence check,
	 * so a build without device contacts support reports itself instead of failing.
	 */
	function createNativeAccessProvider()
	{
		return {
			isSupported: () => (
				Type.isFunction(contacts?.hasContactListAccess)
				&& Type.isFunction(contacts?.requestContactsAccess)
			),
			hasAccess: () => (
				Type.isFunction(contacts?.hasContactListAccess) && contacts.hasContactListAccess() === true
			),
			// Determined status is reported by iOS only; elsewhere the request itself answers.
			hasDeterminedStatus: () => (
				Type.isFunction(contacts?.hasDeterminedStatus) && contacts.hasDeterminedStatus() === true
			),
			requestAccess: () => contacts.requestContactsAccess(),
			showAccessExplanation,
			showReadFailureExplanation,
			openSettings: () => Application.openSettings(),
			waitForAppActive: () => new Promise((resolve) => {
				const handler = () => {
					BX.removeCustomEvent('onAppActive', handler);
					resolve();
				};

				BX.addCustomEvent('onAppActive', handler);
			}),
		};
	}

	class DeviceContactsAccess
	{
		#provider;

		/**
		 * @param {{
		 *   isSupported: () => boolean,
		 *   hasAccess: () => boolean,
		 *   hasDeterminedStatus: () => boolean,
		 *   requestAccess: () => Promise<boolean>,
		 *   showAccessExplanation: () => Promise<boolean>,
		 *   showReadFailureExplanation: () => Promise<boolean>,
		 *   openSettings: () => void,
		 *   waitForAppActive: () => Promise<void>,
		 * }} [provider] access provider; the native contacts module by default
		 */
		constructor(provider = createNativeAccessProvider())
		{
			this.#provider = provider;
		}

		/**
		 * Runs the access cascade by explicit user action. Never throws and never remembers the
		 * outcome: each call reflects the current decision of the operating system.
		 *
		 * @return {Promise<string>} one of DeviceContactsAccessStatus values
		 */
		async ensureAccess()
		{
			if (!this.#provider.isSupported())
			{
				return DeviceContactsAccessStatus.UNSUPPORTED;
			}

			if (this.#provider.hasAccess())
			{
				return DeviceContactsAccessStatus.GRANTED;
			}

			if (this.#provider.hasDeterminedStatus())
			{
				await this.#suggestSystemSettings();

				return DeviceContactsAccessStatus.DENIED;
			}

			const granted = await this.#requestAccess();
			if (!granted)
			{
				await this.#suggestSystemSettings();
			}

			return granted ? DeviceContactsAccessStatus.GRANTED : DeviceContactsAccessStatus.DENIED;
		}

		/**
		 * Tells the user the address book could not be read and offers the system settings,
		 * where the access has most likely been revoked. Waits for the return to the application, so
		 * the caller repeats the read against the permission the user has just given.
		 *
		 * @return {Promise<boolean>} whether the read is worth repeating
		 */
		async recoverFromReadFailure()
		{
			const toOpenSettings = await this.#provider.showReadFailureExplanation();
			if (!toOpenSettings)
			{
				return false;
			}

			this.#provider.openSettings();
			await this.#provider.waitForAppActive();

			return true;
		}

		async #requestAccess()
		{
			try
			{
				return await this.#provider.requestAccess() === true;
			}
			catch (error)
			{
				// eslint-disable-next-line no-console
				console.error('mail/device-contacts: contacts access request failed', error);

				return false;
			}
		}

		async #suggestSystemSettings()
		{
			const toOpenSettings = await this.#provider.showAccessExplanation();
			if (toOpenSettings)
			{
				this.#provider.openSettings();
			}
		}
	}

	/**
	 * Reads the whole address book in a single call with an explicit field list: the native module
	 * does return addresses in a bulk read (checked on a device). A read failure is left to the
	 * caller because it owns the open selection session and the message shown on the screen.
	 *
	 * @return {Promise<Array<{
	 *   id: string,
	 *   name: string,
	 *   avatar: string|null,
	 *   emails: Array<{ value: string, type: string|null }>,
	 * }>>} contacts with at least one valid address
	 */
	async function readDeviceContacts()
	{
		if (!Type.isFunction(contacts?.getContacts))
		{
			return [];
		}

		return normalizeDeviceContacts(await contacts.getContacts(DEVICE_CONTACT_FIELDS));
	}

	/**
	 * An empty state is a row of a button kind on purpose: the widget honours the unselectable flag only
	 * on such a row, on an ordinary one a tap still arrives as a selection (checked on a device). A
	 * button row carries a title alone and wraps it, so the whole message lives in one phrase.
	 */
	function getEmptyItem(id, message)
	{
		return {
			id,
			title: message,
			type: 'button',
			unselectable: true,
			sectionCode: SECTION_CODE,
		};
	}

	function getEmptyBookItem()
	{
		return getEmptyItem(
			`${TEST_ID}-empty-book`,
			Loc.getMessage('MAIL_DEVICE_CONTACTS_SELECTOR_EMPTY_BOOK'),
		);
	}

	function getEmptySearchItem()
	{
		return getEmptyItem(
			`${TEST_ID}-empty-search`,
			Loc.getMessage('MAIL_DEVICE_CONTACTS_SELECTOR_EMPTY_SEARCH'),
		);
	}

	/**
	 * @param {?string} type address type as the operating system named it
	 * @return {string} name of the type to show next to the address; empty when there is no type
	 */
	function getEmailTypeName(type)
	{
		if (!Type.isStringFilled(type))
		{
			return '';
		}

		const phrase = EMAIL_TYPE_PHRASES[type.toLowerCase()];

		return phrase ? Loc.getMessage(phrase) : type;
	}

	/**
	 * @param {object} contact contact of the session
	 * @return {string} how the contact is named on the screen: by its name, or by its first address
	 *   when the address book has no name for it
	 */
	function getContactTitle(contact)
	{
		const [{ value: email }] = contact.emails;

		return contact.name === '' ? email : contact.name;
	}

	/**
	 * Asks the user which address of a contact goes to the message. The menu opens over the selection
	 * widget, so a cancelled contact leaves the list and the marks of the other contacts as they were
	 * because the widget reports no closing of its own while the menu covers it.
	 *
	 * @param {{
	 *   title: string,
	 *   items: Array<{ email: string, typeName: string }>,
	 *   parentWidget: object,
	 * }} params
	 * @return {Promise<?string>} the picked address, null once the user has left the menu with nothing
	 */
	function openAddressMenu({ title, items, parentWidget })
	{
		return new Promise((resolve) => {
			// A menu item closes the menu on its own and calls back once it is gone, so the next contact
			// is asked about on an empty screen. A dismissed menu answers twice, once per widget event;
			// resolving the same promise again changes nothing.
			const answer = (email) => Promise.resolve({ closeCallback: () => resolve(email) });
			const menu = new ContextMenu({
				testId: `${TEST_ID}-address-menu`,
				params: { title },
				actions: [
					...items.map(({ email, typeName }) => ({
						id: email,
						title: email,
						subtitle: typeName,
						onClickCallback: () => answer(email),
					})),
					{
						id: ContextMenuItemType.CANCEL.getTypeName(),
						type: ContextMenuItemType.CANCEL,
						title: Loc.getMessage('MAIL_DEVICE_CONTACTS_ADDRESS_MENU_CANCEL'),
						onClickCallback: () => answer(null),
					},
				],
				onCancel: () => resolve(null),
			});

			void menu.show(parentWidget);
		});
	}

	/**
	 * Whether a selection is open right now. The address book belongs to the device, not to a field of
	 * the message, so two fields asking for it at once would race for the same widget and the same
	 * read, so the later request is dropped.
	 */
	let hasActiveSession = false;

	/**
	 * The selection screen: reads the address book behind a loading indicator and shows it in the
	 * native selection widget of the parent layout.
	 */
	class DeviceContactsSelector
	{
		#props;
		#access;
		#readContacts;
		#openAddressMenu;
		#session = null;
		#selector = null;
		#subscriptions = [];
		#result = [];
		#endSession = null;
		#isConfirming = false;
		#onListFill;

		/**
		 * @param {{
		 *   parentLayout?: object,
		 *   remainingLimit?: number,
		 *   access?: DeviceContactsAccess,
		 *   readContacts?: () => Promise<object[]>,
		 *   openAddressMenu?: (params: object) => Promise<?string>,
		 * }} [props] remainingLimit is how many recipients the message still accepts; the screen never
		 *   works it out on its own and never opens once nothing is left. access,
		 *   readContacts and openAddressMenu are the platform edges of the screen, replaced in checks
		 */
		constructor(props = {})
		{
			this.#props = props;
			this.#access = props.access ?? new DeviceContactsAccess();
			this.#readContacts = props.readContacts ?? readDeviceContacts;
			this.#openAddressMenu = props.openAddressMenu ?? openAddressMenu;
			this.#onListFill = debounce(this.#fillList, SEARCH_INPUT_DELAY, this);
		}

		/**
		 * Runs a whole selection: asks the operating system for the access, shows the address book and
		 * resolves once the user has left the widget. The result goes only to the field that opened the
		 * selection, and an empty result leaves the message unchanged.
		 *
		 * @return {Promise<Array<{ email: string, name: string }>>} one address per contact the user
		 *   confirmed
		 */
		async open()
		{
			if (hasActiveSession)
			{
				return [];
			}

			hasActiveSession = true;

			try
			{
				return await this.#runSession();
			}
			finally
			{
				hasActiveSession = false;
				this.#release();
			}
		}

		async #runSession()
		{
			if (await this.#access.ensureAccess() !== DeviceContactsAccessStatus.GRANTED)
			{
				return [];
			}

			const book = await this.#readBook();
			if (book === null)
			{
				return [];
			}

			this.#session = new DeviceContactsSession(book);
			this.#selector = await this.#openWidget();
			this.#applySelection();
			this.#fillList({ text: '' });

			return new Promise((resolve) => {
				this.#endSession = resolve;
			});
		}

		/**
		 * A failed read is not an empty book, so the two never look alike to the user. The
		 * usual reason is access revoked while the session was alive, hence the message, the way
		 * to the system settings and one more attempt once the user is back.
		 *
		 * @return {Promise<?object[]>} the address book, null when it could not be read
		 */
		async #readBook()
		{
			const book = await this.#tryReadBook();
			if (book !== null)
			{
				return book;
			}

			if (!await this.#access.recoverFromReadFailure())
			{
				return null;
			}

			return this.#tryReadBook();
		}

		async #tryReadBook()
		{
			await Notify.showIndicatorLoading();

			try
			{
				return await this.#readContacts();
			}
			catch (error)
			{
				// eslint-disable-next-line no-console
				console.error('mail/device-contacts: reading the address book failed', error);

				return null;
			}
			finally
			{
				Notify.hideCurrentIndicator();
			}
		}

		async #openWidget()
		{
			const parentLayout = this.#props.parentLayout ?? PageManager;
			const selector = await parentLayout.openWidget('selector', {
				titleParams: {
					text: Loc.getMessage('MAIL_DEVICE_CONTACTS_SELECTOR_TITLE'),
					type: 'dialog',
				},
				backdrop: {
					mediumPositionPercent: 90,
					horizontalSwipeAllowed: false,
				},
				sendButtonName: Loc.getMessage('MAIL_DEVICE_CONTACTS_SELECTOR_SEND_BUTTON'),
			});

			selector.setPlaceholder(Loc.getMessage('MAIL_DEVICE_CONTACTS_SELECTOR_SEARCH_PLACEHOLDER'));
			selector.setSearchEnabled(true);
			selector.allowMultipleSelection(true);
			selector.setSendButtonText(Loc.getMessage('MAIL_DEVICE_CONTACTS_SELECTOR_SEND_BUTTON'));
			selector.setSendButtonVisible(true);
			selector.enableNavigationBarBorder(false);

			this.#subscribe(selector, 'onListFill', this.#onListFill);
			this.#subscribe(selector, 'onSelectedChanged', this.#onSelectedChanged);
			this.#subscribe(selector, 'send', this.#onSend);
			WIDGET_CLOSE_EVENTS.forEach((event) => this.#subscribe(selector, event, this.#onWidgetClosed));

			return selector;
		}

		#subscribe(selector, event, handler)
		{
			selector.on(event, handler);
			this.#subscriptions.push([event, handler]);
		}

		#onSelectedChanged = ({ items }) => {
			this.#session.select(items.map(({ id }) => id));
			this.#applySelection();
		};

		/**
		 * The widget does not honour the unselectable flag on an ordinary row; a tap on it arrives as a
		 * selection anyway (checked on a device). Reaching the limit therefore blocks the confirmation
		 * instead of the check, and the subtitle keeps telling how much room is left.
		 */
		#applySelection()
		{
			const selectedCount = this.#session.selectedCount;
			const state = getSelectionState(selectedCount, this.#props.remainingLimit);

			this.#selector.setSendButtonCounter(selectedCount);
			this.#selector.setSendButtonEnabled(state.isConfirmEnabled);
			this.#selector.setTitle({
				text: Loc.getMessage('MAIL_DEVICE_CONTACTS_SELECTOR_TITLE'),
				detailText: getSelectionHint(state),
				type: 'dialog',
			});
		}

		#onSend = () => {
			void this.#confirmSelection();
		};

		/**
		 * A confirmed selection turns into addresses before it leaves the screen. A walk that has
		 * produced no recipient because every contact was cancelled leaves the session open. The marks
		 * stay, and the message remains unchanged.
		 */
		async #confirmSelection()
		{
			if (this.#isConfirming || this.#session === null)
			{
				return;
			}

			this.#isConfirming = true;

			try
			{
				const recipients = await this.#collectRecipients();
				if (recipients.length > 0 && this.#selector !== null)
				{
					this.#result = recipients;
					this.#selector.close(this.#onWidgetClosed);
				}
			}
			finally
			{
				this.#isConfirming = false;
			}
		}

		/**
		 * Exactly one address of a contact reaches the message, so the picked contacts are
		 * walked in order and asked about one at a time. A cancelled menu drops that contact alone and
		 * the walk carries on.
		 *
		 * @return {Promise<Array<{ email: string, name: string }>>}
		 */
		async #collectRecipients()
		{
			const recipients = [];

			for (const contact of this.#session.selectedContacts)
			{
				// The session can end under an open menu, so stop when there is no selector left.
				if (this.#selector === null)
				{
					break;
				}

				// eslint-disable-next-line no-await-in-loop
				const email = await this.#chooseEmail(contact);
				if (email !== null)
				{
					recipients.push({ email, name: contact.name });
				}
			}

			return recipients;
		}

		/**
		 * A contact with one address is ready to add. A contact with several addresses always asks the
		 * user to choose one.
		 *
		 * @param {object} contact contact of the session
		 * @return {Promise<?string>} the address to add, null once the user has cancelled the menu
		 */
		#chooseEmail(contact)
		{
			if (contact.emails.length === 1)
			{
				const [{ value: email }] = contact.emails;

				return Promise.resolve(email);
			}

			return this.#openAddressMenu({
				title: getContactTitle(contact),
				items: contact.emails.map(({ value, type }) => ({
					email: value,
					typeName: getEmailTypeName(type),
				})),
				parentWidget: this.#selector,
			});
		}

		#onWidgetClosed = () => {
			const endSession = this.#endSession;
			this.#endSession = null;
			endSession?.(this.#result);
		};

		/**
		 * Session hygiene: the address book must not outlive the widget that showed it, and a native
		 * callback arriving after the close must find nothing left to work with.
		 */
		#release()
		{
			this.#subscriptions.forEach(([event, handler]) => {
				this.#selector?.removeEventListener(event, handler);
			});

			this.#subscriptions = [];
			this.#result = [];
			this.#session = null;
			this.#selector = null;
			this.#endSession = null;
		}

		#fillList({ text })
		{
			if (this.#session === null)
			{
				return;
			}

			const found = this.#session.search(text);
			if (found.length === 0)
			{
				this.#selector.setItems(
					[this.#session.isEmpty ? getEmptyBookItem() : getEmptySearchItem()],
					SECTIONS,
				);

				return;
			}

			this.#selector.setItems(this.#prepareItems(found), SECTIONS);
		}

		/**
		 * A contact takes exactly one row and shows its first address: splitting it into a row per
		 * address would let a single session pick two addresses of the same contact. The
		 * remaining addresses stay on the contact of the session, which asks for one of them once the
		 * selection is confirmed.
		 */
		#prepareItems(deviceContacts)
		{
			return deviceContacts.map((contact) => {
				const [{ value: email }] = contact.emails;

				return {
					id: contact.id,
					title: getContactTitle(contact),
					subtitle: contact.name === '' ? '' : email,
					useLetterImage: false,
					sectionCode: SECTION_CODE,
					avatar: this.#getAvatarProps(contact),
				};
			});
		}

		#getAvatarProps(contact)
		{
			return AvatarClass
				.getAvatar({
					name: contact.name,
					testId: `${TEST_ID}-item-avatar`,
					shape: AvatarShape.CIRCLE,
					uri: contact.avatar,
					entityType: AvatarEntityType.USER,
				})
				.getAvatarNativeProps();
		}
	}

	module.exports = {
		DeviceContactsAccess,
		DeviceContactsAccessStatus,
		DeviceContactsSelector,
		DeviceContactsSession,
		getSelectionState,
		readDeviceContacts,
		normalizeDeviceContacts,
	};
});
