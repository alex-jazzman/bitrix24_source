import { Tag, Dom, Event, Loc, Runtime, Type } from 'main.core';
import { type Popup as PopupInstance, type PopupOptions } from 'main.popup';
import { type FocusZone as FocusZoneInstance, type LiveAnnouncer as LiveAnnouncerInstance } from 'ui.a11y';

import { getBackUrl } from './helpers';

import '../css/language-switcher.css';

const LANGUAGE_ITEM_SELECTOR = '.intranet__language-popup_language-item';
const CHECKED_LANGUAGE_ITEM_SELECTOR = `${LANGUAGE_ITEM_SELECTOR}[aria-checked="true"]`;

/**
 * The window the announcer holds a message in its live region. It is given to the announcer and
 * used to time the switch, so that both sides count the same window instead of guessing each other.
 */
const ANNOUNCEMENT_TIMING = {
	baseDelay: 500,
	charDelay: 30,
	maxDelay: 4000,
};

// The announcer cuts a message down to this length, and the delay is counted on the same text.
const ANNOUNCEMENT_MAX_MESSAGE_LENGTH = 160;

type LanguageList = {
	[languageCode: string]: LanguageListItem;
}

type LanguageListItem = {
	NAME: string;
	IS_BETA: boolean;
	LANG_TAG: ?string;
};

type LanguageSwitcherOptions = {
	messages?: { [messageId: string]: string };
	currentLanguageCode?: string;
};

/**
 * The switch waits the window of the announcer out before it leaves the page, so the document is
 * not destroyed while the message is still being read.
 */
function getAnnouncementDelay(message: string): number
{
	const { baseDelay, charDelay, maxDelay } = ANNOUNCEMENT_TIMING;
	const length = Math.min(message.trim().length, ANNOUNCEMENT_MAX_MESSAGE_LENGTH);

	return Math.min(baseDelay + length * charDelay, maxDelay);
}

/**
 * The grid is presentational so that it does not break the menu-to-menuitem relation of the popup.
 * A language missing from the BCP 47 table comes without a tag, and then no lang attribute is written:
 * an invalid one is an accessibility violation of its own.
 */
function renderLanguageList(
	languages: LanguageList,
	currentLanguageCode: ?string,
	onSelect: (languageCode: string) => void,
): HTMLElement
{
	const container = Tag.render`<div class="intranet__language-popup_list" role="presentation"></div>`;

	Object.entries(languages).forEach(([languageCode: string, languageItem: LanguageListItem]) => {
		const languageNameElement = Tag.render`
			<span class="intranet__language-popup_language-item-name">${languageItem.NAME}</span>
		`;

		if (Type.isStringFilled(languageItem.LANG_TAG))
		{
			Dom.attr(languageNameElement, 'lang', languageItem.LANG_TAG);
		}

		const languageItemElement = Tag.render`
			<button
				type="button"
				class="intranet__language-popup_language-item"
				role="menuitemradio"
				aria-checked="${languageCode === currentLanguageCode}"
			>
				${languageNameElement}
				<span class="intranet__language-popup_language-beta">${languageItem.IS_BETA ? ', beta' : ''}</span>
			</button>
		`;

		Event.bind(languageItemElement, 'click', () => {
			onSelect(languageCode);
		});

		Dom.append(languageItemElement, container);
	});

	return container;
}

/**
 * The number of tracks the list is laid out in. The stylesheet owns the layout and the list is
 * cut by the hidden-languages setting, so neither the columns nor the items are a constant here.
 */
function getColumnCount(listContainer: HTMLElement): number
{
	return Dom.style(listContainer, 'gridTemplateColumns')
		.split(/\s+/)
		.filter((track: string) => track !== '' && track !== 'none')
		.length
	;
}

/**
 * The horizontal arrows step by one item, the vertical ones by a whole row of the grid, Home and
 * End go to its ends. The zone gives a direction, which tells the two axes apart no better than
 * "previous" and "next" - hence the original key event. Returning null leaves the key to the
 * linear navigation of the zone.
 */
function getNextLanguageItem(listContainer: HTMLElement, from: ?Element, event: KeyboardEvent): ?HTMLElement
{
	const items = [...listContainer.querySelectorAll(LANGUAGE_ITEM_SELECTOR)];
	const columns = getColumnCount(listContainer);
	const i = items.indexOf(from);
	if (columns < 1 || i < 0)
	{
		return null;
	}

	let j = -1;

	switch (event.key)
	{
		case 'ArrowRight':
		{
			j = i + 1;

			break;
		}

		case 'ArrowLeft':
		{
			j = i - 1;

			break;
		}

		case 'ArrowDown':
		{
			j = i + columns;

			break;
		}

		case 'ArrowUp':
		{
			j = i - columns;

			break;
		}

		case 'Home':
		{
			j = 0;

			break;
		}

		case 'End':
		{
			j = items.length - 1;

			break;
		}

		default:
		{
			return null;
		}
	}

	// A step out of the grid moves nothing: the focus stays on the item it came from.
	return j < 0 || j >= items.length ? items[i] : items[j];
}

export class LanguageSwitcher
{
	#popup: ?PopupInstance;
	#popupInitPromise: ?Promise<void>;
	#focusZone: ?FocusZoneInstance;
	#announcer: ?LiveAnnouncerInstance;
	#bindElement: ?HTMLElement;
	#languages: ?LanguageList;
	#isSwitching: boolean = false;

	async showLanguageListPopup(
		bindElement: HTMLElement,
		languages: LanguageList,
		options: LanguageSwitcherOptions = {},
	): void
	{
		// The page is already on its way out: a second choice would only override the first one.
		if (this.#isSwitching)
		{
			return;
		}

		if (Type.isPlainObject(options.messages))
		{
			Loc.setMessage(options.messages);
		}

		this.#bindElement = bindElement;
		this.#languages = languages;

		if (!this.#popup)
		{
			// Clicks that land while the extension is still loading share one initialisation,
			// so the second one does not build a popup of its own.
			if (!this.#popupInitPromise)
			{
				this.#popupInitPromise = this.#initPopup(bindElement, languages, options.currentLanguageCode)
					.finally(() => {
						this.#popupInitPromise = null;
					})
				;
			}

			await this.#popupInitPromise;
		}

		if (this.#popup.isShown())
		{
			return;
		}

		this.#popup.show();
	}

	async #initPopup(
		bindElement: HTMLElement,
		languages: LanguageList,
		currentLanguageCode: ?string,
	): PopupInstance
	{
		// The handlers below close and dispose of the popup they were created with, not of whichever
		// one the class holds at the moment.
		let popup: ?PopupInstance = null;
		let focusZone: ?FocusZoneInstance = null;

		const windowScrollHandler = () => {
			popup?.close();
		};

		// A menu closes on Tab instead of letting the focus walk through its items, the way the
		// platform menu does (main.popup MenuNavigation): the native move is cancelled, the trap
		// brings the focus back to the trigger, and the next Tab leaves it for the page.
		const keyDownHandler = (event: KeyboardEvent) => {
			if (event.key === 'Tab')
			{
				event.preventDefault();
				popup?.close();
			}
		};

		// The extension of the focus zone is not among the ones the page loads on its own.
		const { Popup, FocusZone, FocusKeys, LiveAnnouncer } = await Runtime.loadExtension('main.popup', 'ui.a11y');

		// The announcer is raised on opening and not at the choice of a language: a live region has
		// to sit in the accessibility tree for a while before its first message, or a screen reader
		// drops it - one frame, the one the constructor of the announcer waits out, is not enough.
		// The popup is destroyed on close, the announcer is not: one region serves the whole page.
		if (!this.#announcer)
		{
			// Assertive from the start, so that the politeness of the region does not change at the
			// very moment the message arrives.
			this.#announcer = new LiveAnnouncer({
				politeness: 'assertive',
				...ANNOUNCEMENT_TIMING,
				maxMessageLength: ANNOUNCEMENT_MAX_MESSAGE_LENGTH,
			});
		}

		const listContainer = renderLanguageList(languages, currentLanguageCode, (languageCode: string) => {
			this.switchPortalLanguage(languageCode);
		});

		const popupOptions: PopupOptions = {
			bindElement,
			autoHide: true,
			closeByEsc: true,
			cachable: false,
			role: 'menu',
			ariaLabel: Loc.getMessage('BITRIX24_AIR_LANGUAGE_MENU_ARIA'),
			focusTrap: {
				// A click outside moves the focus before the menu hides: the element the user went to
				// keeps it, and only a focus dying with the menu is handed back to the trigger.
				restoreFocus: () => {
					const { activeElement } = document;
					const popupContainer = popup?.getPopupContainer();
					const hasFocusLeftTheMenu = (
						Type.isElementNode(popupContainer)
						&& Type.isElementNode(activeElement)
						&& activeElement !== document.body
						&& !popupContainer.contains(activeElement)
					);

					return hasFocusLeftTheMenu ? activeElement : bindElement;
				},
				preventScroll: true,
				// The provider puts the current language first, so the checked item is the first
				// one as well; the fallback keeps the menu rule when the setting hides it.
				initialFocus: [CHECKED_LANGUAGE_ITEM_SELECTOR, LANGUAGE_ITEM_SELECTOR],
			},
			content: listContainer,
			events: {
				onPopupShow: () => {
					Dom.attr(bindElement, 'aria-expanded', 'true');
					focusZone.activate();
				},
				onPopupClose: () => {
					Dom.attr(bindElement, 'aria-expanded', 'false');
					Event.unbind(window, 'scroll', windowScrollHandler);
					Event.unbind(popup.getPopupContainer(), 'keydown', keyDownHandler);
					// Before the popup goes: the zone keeps a mutation observer and tabindex
					// writes on the very nodes that are about to be thrown away.
					focusZone.deactivate();
					popup.destroy();

					if (this.#focusZone === focusZone)
					{
						this.#focusZone = null;
					}

					if (this.#popup === popup)
					{
						this.#popup = null;
					}
				},
			},
		};

		popup = new Popup(popupOptions);

		focusZone = new FocusZone(listContainer, {
			bindKeys: FocusKeys.ArrowAll | FocusKeys.HomeAndEnd,
			focusOutBehavior: 'stop',
			// Without it every arrow scrolls the page, and a window scroll closes the popup.
			preventScroll: true,
			focusableElementFilter: (element: HTMLElement) => element.matches(LANGUAGE_ITEM_SELECTOR),
			getNextFocusable: (direction: string, from: ?Element, event: KeyboardEvent) => {
				return getNextLanguageItem(listContainer, from, event);
			},
		});

		this.#popup = popup;
		this.#focusZone = focusZone;

		Event.bind(window, 'scroll', windowScrollHandler);
		Event.bind(popup.getPopupContainer(), 'keydown', keyDownHandler);
	}

	hideLanguageListPopup(): void
	{
		this.#popup?.close();
	}

	switchPortalLanguage(languageCode: string): void
	{
		if (this.#isSwitching)
		{
			return;
		}

		this.#isSwitching = true;
		this.hideLanguageListPopup();

		// The popup has handed the focus back to the trigger, and the trigger is where the state
		// of the switch belongs: busy, and not to be used again before the page is replaced.
		Dom.attr(this.#bindElement, { 'aria-busy': 'true', 'aria-disabled': 'true' });

		const message = Loc.getMessage('BITRIX24_AIR_LANGUAGE_SWITCHING_ANNOUNCEMENT', {
			'#LANGUAGE#': this.#languages?.[languageCode]?.NAME ?? '',
		}) ?? '';

		// Assertive rather than polite: the document is about to be replaced, and a polite message
		// may never get its turn.
		this.#announcer?.announce(message, 'assertive');

		setTimeout(() => {
			window.location.href = `/auth/?user_lang=${languageCode}&backurl=${getBackUrl()}`;
		}, getAnnouncementDelay(message));
	}
}

export const languageSwitcher = new LanguageSwitcher();
