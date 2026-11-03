import { Dom, Event, Runtime, Type } from 'main.core';
import { type Popup } from 'main.popup';
import { type BannerDispatcher } from 'ui.banner-dispatcher';

import { markCloseIcon, markPopupNode } from './close-icon';
import { openControlPanel } from './control-panel';
import { type MigrationPanelHintOptions } from './types';

/**
 * Must match Bitrix\Mail\Helper\Config\Guide::USER_OPTION_CATEGORY - the store the rest of the
 * states of the feature live in. The names of the two marks come from the page, so that the one
 * who reads them and the one who writes them cannot drift apart.
 */
const USER_OPTION_CATEGORY = 'mail.guide';
const GUIDE_ID = 'mail-migration-notice-panel-hint';
/** The block of the hint: the class its stylesheet reaches by, and the name the tests find it by. */
const HINT_BLOCK = 'mail-migration-notice-panel-hint';
/** `ui.tour` draws the anchor of a step only when the step names a link; the click of it is handled here. */
const LINK_PLACEHOLDER = '#';
const HINT_LINK_TESTID = 'mail-migration-notice-panel-hint-link';
const HINT_CLOSE_TESTID = 'mail-migration-notice-panel-hint-close';
const HINT_BTN_TESTID = 'mail-migration-notice-panel-hint-btn';

/** The button of the agreement of `ui.tour`: in the simple mode it is the one that closes the hint. */
const HINT_BTN_SELECTOR = '.ui-tour-popup-btn-next';

type UserOptionsGlobal = {
	userOptions: {
		save(category: string, name: string, valueName: string | null, value: string): void,
	},
};

/** `ui.tour` is written in JavaScript: the guide arrives untyped, and this is all we ask of it. */
type GuideInstance = {
	start(): void,
	close(): void,
	getPopup(): Popup,
	getLink(): HTMLElement,
};

/** What the hint is drawn with: the page of the mailboxes brings it in when the hint is due. */
type PanelHintUi = {
	BannerDispatcher: typeof BannerDispatcher,
	Guide: new (options: Record<string, unknown>) => GuideInstance,
};

let uiPromise: Promise<PanelHintUi> | null = null;

function loadUi(): Promise<PanelHintUi>
{
	uiPromise ??= Runtime
		.loadExtension('ui.banner-dispatcher', 'ui.tour')
		.then((exports: unknown): PanelHintUi => exports as PanelHintUi)
	;

	return uiPromise;
}

/**
 * HINT-3. The aha-moment of the button that leads into the control panel of the company mail
 * (SC-007): where the domain, the records and the addresses of the employees are settled.
 *
 * The hint belongs to that button and to no place of its own (AC-043), and a person meets it once
 * (AC-044). Both halves of that are marks on the server, in the store the states of the feature
 * already use: leaving for the panel writes the first one, and the hint itself writes the second.
 * Which of them is due the page decides - there is no rule of the display here.
 *
 * ```js
 * new BX.Mail.MigrationPanelHint({ buttonSelector, ... }).run();
 * ```
 */
export class MigrationPanelHint
{
	#options: MigrationPanelHintOptions;
	#guide: GuideInstance | null = null;
	#started: boolean = false;
	#destroyed: boolean = false;
	#visitRemembered: boolean = false;
	#release: (() => void) | null = null;

	constructor(options: MigrationPanelHintOptions)
	{
		this.#options = options;
	}

	/**
	 * Watches the way out into the panel, and meets the person on the way back when the hint is due.
	 * A page without the button has neither to offer.
	 */
	run(): void
	{
		const button = this.#findButton();
		if (button === null)
		{
			return;
		}

		this.#rememberVisitOnClick(button);

		if (this.#options.hintDue)
		{
			void this.#showHint(button);
		}
	}

	destroy(): void
	{
		this.#destroyed = true;
		this.#guide?.close();
		this.#guide = null;
		this.#releaseQueue();
	}

	#findButton(): HTMLElement | null
	{
		if (!Type.isStringFilled(this.#options.buttonSelector))
		{
			return null;
		}

		return document.querySelector<HTMLElement>(this.#options.buttonSelector);
	}

	/**
	 * The moment of the transition is what the portal has instead of a signal from the panel (Q-2).
	 *
	 * Leaving the page takes the request of the mark with it, and that is why nothing is sent here by
	 * hand: `BX.userOptions.save` puts the value into the cookie of the pending settings at once, and
	 * the core writes it down on the next request of this person.
	 */
	#rememberVisitOnClick(button: HTMLElement): void
	{
		Event.bind(button, 'click', (): void => {
			if (this.#visitRemembered)
			{
				return;
			}

			this.#visitRemembered = true;
			this.#save(this.#options.visitOptionName);
		});
	}

	/**
	 * The queue of the portal banners is what keeps the hint from landing on top of the announcement,
	 * which speaks on every page of the portal. A hint asked for twice is still built once.
	 */
	async #showHint(button: HTMLElement): Promise<void>
	{
		if (this.#started)
		{
			return;
		}

		this.#started = true;

		const ui = await loadUi();
		if (this.#destroyed)
		{
			return;
		}

		// `ui.auto-launch` hands the way out of the queue over as a bare `Function`.
		ui.BannerDispatcher.normal.toQueue((onDone: Function): Record<string, never> => {
			this.#release = onDone as () => void;
			this.#guide = this.#createGuide(button, ui);
			this.#guide.start();
			this.#adjustPopup(this.#guide.getPopup());
			const link = this.#guide.getLink();
			Dom.attr(link, 'data-testid', HINT_LINK_TESTID);
			this.#leadIntoThePanelOnClick(link);
			this.#save(this.#options.hintOptionName);

			// ui.auto-launch expects a value back from a queued callback and ignores it
			return {};
		});
	}

	#createGuide(button: HTMLElement, ui: PanelHintUi): GuideInstance
	{
		return new ui.Guide({
			id: GUIDE_ID,
			simpleMode: true,
			steps: [
				{
					target: button,
					title: this.#options.title,
					text: this.#options.text,
					// The address of the panel is not spelled here and cannot be: it is issued one-off and
					// expires in a minute, so the link asks for one at the click like the button it stands on
					link: LINK_PLACEHOLDER,
					linkTitle: this.#options.linkTitle,
					position: 'bottom',
				},
			],
			events: {
				onFinish: (): void => this.#releaseQueue(),
			},
		});
	}

	/**
	 * `ui.tour` gives its popup the role of a dialog and asks `main.popup` for neither a name nor the
	 * closing by Escape, so the hint arrives as a nameless dialog a keyboard cannot dismiss. The guide
	 * hands that popup over, and both are put in place here instead of in a module of somebody else.
	 */
	#adjustPopup(popup: Popup): void
	{
		const container = popup.getPopupContainer();

		popup.setClosingByEsc(true);
		Dom.attr(container, 'data-testid', HINT_BLOCK);
		/*
			`ui.tour` gives the hint 420 pixels wherever it stands, and a narrow screen has fewer: the
			cross goes outside it and the words have to be scrolled sideways to be read (WCAG 1.4.10).
			The stylesheet caps it by the class, and the popup is then placed anew by the width it took.
		*/
		Dom.addClass(container, HINT_BLOCK);
		popup.adjustPosition();
		markCloseIcon(popup, HINT_CLOSE_TESTID);
		markPopupNode(popup, HINT_BTN_SELECTOR, HINT_BTN_TESTID);

		const name = Type.isStringFilled(this.#options.title) ? this.#options.title : this.#options.text;
		if (Type.isStringFilled(name))
		{
			Dom.attr(container, 'aria-label', name);
		}
	}

	/**
	 * The link of the hint goes where the button under it goes, and by the same road: an address asked for
	 * at the click, because the one the service issues dies in a minute. The anchor carries a placeholder
	 * instead of an address, so the click of it is stopped before the browser follows anything.
	 */
	#leadIntoThePanelOnClick(link: HTMLElement): void
	{
		Event.bind(link, 'click', (event: MouseEvent): void => {
			event.preventDefault();

			if (!this.#visitRemembered)
			{
				this.#visitRemembered = true;
				this.#save(this.#options.visitOptionName);
			}

			void openControlPanel();
		});
	}

	/** The rest of the portal banners wait behind the hint, so the queue is let go exactly once. */
	#releaseQueue(): void
	{
		const release = this.#release;
		this.#release = null;
		release?.();
	}

	#save(optionName: string): void
	{
		if (!Type.isStringFilled(optionName))
		{
			return;
		}

		(BX as unknown as UserOptionsGlobal).userOptions.save(
			USER_OPTION_CATEGORY,
			optionName,
			null,
			'Y',
		);
	}
}
