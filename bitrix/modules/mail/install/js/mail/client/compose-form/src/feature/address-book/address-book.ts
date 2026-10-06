import { Tag, Type, Validation } from 'main.core';
import { type BaseEvent } from 'main.core.events';
import { Loader } from 'main.loader';
import { type SliderEvent } from 'main.sidepanel';
import { DefaultFooter, type Dialog, type DialogOptions, type ItemOptions, type TagItem } from 'ui.entity-selector';

import { AddressBookHelpArticle, AddressBookIcon, Phrase } from '../../const';
import {
	getContactIdByEmail,
	loadContactDialog,
	saveContact,
	type ContactDialogHost,
} from '../../infrastructure/service/address-book/address-book';
import { loc } from '../../lib/loc/loc';
import { type RecipientItemDto } from '../../model/compose/types';

import './address-book.css';

/** Entity of the recipient items whose tags carry a contact of the address book. */
const AddressBookEntityId = 'address_book';

/** The service answers with this identifier when the address is in no contact. */
const NoContact = 0;

/** A contact just saved stands at the head of the list. */
const AddedItemSort = 1;

/**
 * The offset puts the loader over the round add control (`ui-selector-footer-link-add` of
 * `ui.entity-selector`) rather than over the text of the link.
 */
const LoaderSize = 29;
const LoaderOffset = Object.freeze({ left: 'calc(-50% - 19px)', top: '-2px' });

/** Opacity of the icon of the stub, in percent. */
const StubIconOpacity = 85;

/** The identifier `SearchTab` of the selector gives its search tab. */
const SearchTabId = 'search';

const ContactSavedEvent = 'BX.DialogEditContact:onSaveContact';
const SliderClosedEvent = 'SidePanel.Slider:onCloseComplete';

/** Rejection of a request a slider took over: the picker keeps its search line and gives the loader back. */
const SliderTookOver = 'The contact is filled in the slider of the address book.';

type PortalWindow = {
	BX?: {
		Helper?: {
			show(command: string): void,
		},
	},
};

type TagContact = {
	contactId: number,
	email: string,
	name: string,
};

type ContactDraft = {
	email: string,
	name: string,
	showEmailError: boolean,
};

/** Named as `SidePanelWrapper` of the module names it. */
type ContactSlider = {
	contactId: number | string,
	prefixId: number,
};

type ContactSavedData = {
	items?: unknown,
	prefixId?: number,
};

type DialogLifecycle = {
	isAlive(): boolean,
	release(): void,
};

export type AddressBookDialogOptions = Pick<DialogOptions, 'footer' | 'searchTabOptions' | 'searchOptions'>;

/** Tells the contact sliders of one page apart from one another. */
let sliderSequence = 0;

/**
 * The loader stands over the add control while the request runs and is taken away in every outcome, and the
 * control answers no click while it is shown, so one address is not saved twice.
 */
export class AddressBookFooter extends DefaultFooter
{
	#loader: Loader | null = null;

	getContent(): HTMLElement
	{
		return this.cache.remember('content', () => {
			return Tag.render`
				<button
					type="button"
					class="ui-selector-footer-link ui-selector-footer-link-add"
					data-testid="mail-compose-address-book-add"
					onclick="${this.handleClick.bind(this)}"
				>${loc(Phrase.AddressBookAdd)}</button>
			`;
		});
	}

	getLoader(): Loader
	{
		if (this.#loader === null)
		{
			this.#loader = new Loader({
				target: this.getContent(),
				size: LoaderSize,
				offset: LoaderOffset,
			});
		}

		return this.#loader;
	}

	showLoader(): void
	{
		// The loader answers with a promise that never settles, so it is started and left alone.
		void this.getLoader().show();
	}

	hideLoader(): void
	{
		void this.getLoader().hide();
	}

	handleClick(): void
	{
		if (this.getLoader().isShown())
		{
			return;
		}

		const dialog = this.getDialog();

		this.showLoader();
		void createContact(dialog, dialog.getTagSelectorQuery()).then(
			() => {
				this.hideLoader();
			},
			() => {
				this.hideLoader();
			},
		);
	}
}

export function getAddressBookDialogOptions(): AddressBookDialogOptions
{
	return {
		footer: AddressBookFooter,
		searchTabOptions: {
			id: SearchTabId,
			stub: true,
			stubOptions: {
				title: loc(Phrase.AddressBookEmptyTitle),
				subtitle: renderEmptySearchText(),
				icon: AddressBookIcon,
				iconOpacity: StubIconOpacity,
				arrow: true,
			},
		},
		searchOptions: {
			allowCreateItem: true,
			footerOptions: { label: loc(Phrase.AddressBookAddFromSearch) },
		},
	};
}

/**
 * A kept promise means the address became a contact right away, a broken one means a slider took the request
 * over; the search tab footer of `ui.entity-selector` gives its loader back on either outcome.
 */
export function createContact(dialog: Dialog, typedLine: string): Promise<void>
{
	const line = typedLine.trim();

	if (!Validation.isEmail(line))
	{
		openContactForm(dialog, toContactDraft(line));

		return Promise.reject(new Error(SliderTookOver));
	}

	return saveContact(line, line).then(
		(items) => {
			addItemsToField(dialog, items);
		},
		(error: unknown) => {
			// The address is already in a contact of the user: the answer names that record, and the slider
			// opens on it instead of a new one.
			openContactForm(dialog, { email: line, name: '', showEmailError: false }, error);

			throw new Error(SliderTookOver);
		},
	);
}

/**
 * Only an address book tag carries a contact: an employee of the portal and a record of CRM are not edited
 * from the form. The picker stays locked until the slider closes and is unlocked in every outcome, an error
 * and a cancelled slider included.
 */
export function openContactOfTag(dialog: Dialog, tagItem: TagItem): void
{
	const selector = dialog.getTagSelector();
	if (!selector || selector.isLocked() || tagItem.getEntityId() !== AddressBookEntityId)
	{
		return;
	}

	const contact = getTagContact(dialog, tagItem);
	if (!contact)
	{
		return;
	}

	const unlock = (): void => {
		selector.unlock();
	};

	selector.lock();

	resolveContactId(contact)
		.then((contactId) => {
			if (contactId <= NoContact)
			{
				// The address is in no contact of the user: there is nothing to open, so the picker is
				// given back at once.
				unlock();

				return;
			}

			openContact(dialog, { ...contact, contactId }, unlock);
		})
		.catch(unlock);
}

/** The item of the picker is the source and not the tag: `Item.createTag()` leaves the custom data behind. */
function getTagContact(dialog: Dialog, tagItem: TagItem): TagContact | null
{
	const item = dialog.getItem([tagItem.getEntityId(), tagItem.getId()]);
	if (!item)
	{
		return null;
	}

	const customData = item.getCustomData();

	return {
		// `AddressBookProvider::buildItem()` writes the id of the contact under `id`; `entityId` of the custom
		// data is the convention of the CRM recipients, and a read of it here sent every tag through a lookup
		// by address instead.
		contactId: Number(customData.get('id')) || NoContact,
		email: String(customData.get('email') ?? ''),
		name: String(customData.get('name') ?? ''),
	};
}

/**
 * A recipient taken from the headers of the answered message carries no contact of its own, so the address is
 * asked about.
 */
function resolveContactId(contact: TagContact): Promise<number>
{
	if (contact.contactId > NoContact)
	{
		return Promise.resolve(contact.contactId);
	}

	return getContactIdByEmail(contact.email);
}

/** A line with `@` in it is an address, a line without one is a name, and a name shows no address error. */
function toContactDraft(line: string): ContactDraft
{
	return line.includes('@')
		? { email: line, name: '', showEmailError: true }
		: { email: '', name: line, showEmailError: false };
}

function openContactForm(dialog: Dialog, draft: ContactDraft, error?: unknown): void
{
	const pendingLifecycle = bindDialogLifecycle(dialog);
	if (!pendingLifecycle)
	{
		return;
	}

	void loadContactDialog()
		.then((host: ContactDialogHost): void => {
			if (!pendingLifecycle.isAlive())
			{
				return;
			}

			const prefixId = nextSliderPrefix();
			const contactId = host.dialog.openCreateDialog({
				prefixId,
				showEmailError: draft.showEmailError,
				responseError: toResponseError(error),
				contactData: { email: draft.email, name: draft.name },
			});

			if (!pendingLifecycle.isAlive())
			{
				return;
			}

			pendingLifecycle.release();
			bindContactSlider(dialog, { contactId, prefixId }, host.eventEmitter);
		})
		.catch((): void => {
			pendingLifecycle.release();
		});
}

function openContact(dialog: Dialog, contact: TagContact, onClose: () => void): void
{
	const pendingLifecycle = bindDialogLifecycle(dialog, onClose);
	if (!pendingLifecycle)
	{
		onClose();

		return;
	}

	void loadContactDialog()
		.then((host: ContactDialogHost): void => {
			if (!pendingLifecycle.isAlive())
			{
				return;
			}

			const prefixId = nextSliderPrefix();
			const contactId = host.dialog.openEditDialog({
				contactID: contact.contactId,
				prefixId,
				contactData: { email: contact.email, name: contact.name },
			});

			if (!pendingLifecycle.isAlive())
			{
				return;
			}

			pendingLifecycle.release();
			bindContactSlider(dialog, { contactId, prefixId }, host.eventEmitter, onClose);
		})
		// A picker locked for a slider that never opened would stay locked.
		.catch((): void => {
			if (pendingLifecycle.isAlive())
			{
				onClose();
			}

			pendingLifecycle.release();
		});
}

/**
 * Only an answer that carries `errors` is handed over: the slider looks up the record of an address already
 * taken in them, and an answer of another shape would leave the user with no slider at all.
 */
function toResponseError(error: unknown): unknown
{
	return Type.isPlainObject(error) && Type.isArray(error.errors) ? error : undefined;
}

/**
 * A contact saved in the slider becomes a recipient of the field the slider was opened from. The lock is
 * released on every way out: the record saved, the slider cancelled, and the picker taken down while the
 * slider is still open.
 */
function bindContactSlider(
	dialog: Dialog,
	slider: ContactSlider,
	eventEmitter: ContactDialogHost['eventEmitter'],
	onClose?: () => void,
): void
{
	const sliderUrl = `dialogEditContact_${slider.contactId}_${slider.prefixId}`;
	let isReleased = false;
	// Initialized before the call below: release() reads it, and the call subscribes release() as a handler.
	let lifecycle: DialogLifecycle | null = null;

	lifecycle = bindDialogLifecycle(dialog, release);
	if (!lifecycle)
	{
		onClose?.();

		return;
	}

	function handleContactSaved(event: BaseEvent): void
	{
		const saved = event.getData() as ContactSavedData;
		if (saved.prefixId === slider.prefixId && Type.isArray<RecipientItemDto>(saved.items))
		{
			addItemsToField(dialog, saved.items);
		}
	}

	function handleSliderClosed(event: SliderEvent): void
	{
		if (event.getSlider()?.getUrl() === sliderUrl)
		{
			release();
		}
	}

	function release(): void
	{
		if (isReleased)
		{
			return;
		}

		isReleased = true;

		eventEmitter.unsubscribe(ContactSavedEvent, handleContactSaved);
		eventEmitter.unsubscribe(SliderClosedEvent, handleSliderClosed);
		lifecycle?.release();
		onClose?.();
	}

	eventEmitter.subscribe(ContactSavedEvent, handleContactSaved);
	eventEmitter.subscribe(SliderClosedEvent, handleSliderClosed, { compatMode: true });
}

function bindDialogLifecycle(dialog: Dialog, onDestroy?: () => void): DialogLifecycle | null
{
	if (!isDialogAlive(dialog))
	{
		return null;
	}

	let isReleased = false;
	let isDestroyed = false;

	function handleDestroy(): void
	{
		isDestroyed = true;
		release();
		onDestroy?.();
	}

	function release(): void
	{
		if (isReleased)
		{
			return;
		}

		isReleased = true;

		if (isDialogSubscribable(dialog))
		{
			dialog.unsubscribe('onDestroy', handleDestroy);
		}
	}

	dialog.subscribe('onDestroy', handleDestroy);

	return {
		isAlive(): boolean
		{
			return !isDestroyed && isDialogAlive(dialog);
		},
		release,
	};
}

function isDialogAlive(dialog: Dialog): boolean
{
	return (dialog as Dialog & { destroyed?: boolean }).destroyed !== true && isDialogSubscribable(dialog);
}

function isDialogSubscribable(dialog: Dialog): boolean
{
	return Type.isFunction(dialog.subscribe) && Type.isFunction(dialog.unsubscribe);
}

/**
 * The item is left as it came, and only what the picker keeps its own books by is filled in: the tab it is
 * shown in and its place in the list. Its custom data is what leaves for the server, so nothing touches it.
 */
function addItemsToField(dialog: Dialog, items: RecipientItemDto[]): void
{
	let isAdded = false;

	items.forEach((savedItem) => {
		if (Object.keys(savedItem).length === 0)
		{
			return;
		}

		const tabs = Type.isArray<string>(savedItem.tabs) ? savedItem.tabs : [];
		const options = {
			...savedItem,
			sort: AddedItemSort,
			tabs: [...tabs, dialog.getRecentTab().getId()],
		} as ItemOptions;

		// An address already on the list is replaced rather than doubled: the answer carries the contact as
		// it is now.
		dialog.removeItem(options);
		const item = dialog.addItem(options);
		if (item)
		{
			item.select();
			isAdded = true;
		}
	});

	if (isAdded)
	{
		dialog.clearSearch();
	}
}

/** The stub takes ready markup, so the help link is a node with its own listener, not a string with a call. */
function renderEmptySearchText(): HTMLElement
{
	const help = Tag.render`
		<button
			type="button"
			class="mail-compose-address-book-help"
			data-testid="mail-compose-address-book-help"
			aria-label="${loc(Phrase.AddressBookEmptyHelpLabel)}"
			onclick="${showHelpArticle}"
		>${loc(Phrase.AddressBookEmptyHelp)}</button>
	`;

	return Tag.render`<span>${loc(Phrase.AddressBookEmptyText)}<br>${help}</span>`;
}

/** The help desk lives on the page above the slider, which is too narrow for the article anyway. */
function showHelpArticle(): void
{
	const helper = (window.top as unknown as PortalWindow | null)?.BX?.Helper;

	helper?.show(`redirect=detail&code=${AddressBookHelpArticle}`);
}

function nextSliderPrefix(): number
{
	sliderSequence += 1;

	return sliderSequence;
}
