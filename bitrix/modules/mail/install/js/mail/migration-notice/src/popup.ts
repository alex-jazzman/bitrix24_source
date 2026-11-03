import { Runtime, Tag, Text, Type } from 'main.core';
import { type Popup, type PopupManager } from 'main.popup';
import { type AirButtonStyle, type Button, type ButtonSize } from 'ui.buttons';
import { type BannerDispatcher } from 'ui.banner-dispatcher';
import { type Illustration } from 'ui.system.illustration';

import { leadsToControlPanel, openControlPanel } from './control-panel';
import { markCloseIcon } from './close-icon';
import { type NoticeAction } from './types';

export type MigrationPopupOptions = {
	illustration: string,
	title: string,
	text: string,
	actions: NoticeAction[],
	onShown: () => void,
	onDismiss: () => void,
};

/**
 * A page of the portal is opened in place, and only an address that leaves the portal gets a tab of
 * its own: the helpdesk article is read beside the work, while the control panel of the company mail
 * is the work itself, and a second tab of the same portal reads as "nothing happened".
 */
function linkProps(url: string): Record<string, string>
{
	if (!Type.isStringFilled(url))
	{
		return {};
	}

	return url.startsWith('/') ? {} : { target: '_blank' };
}

const ILLUSTRATION_SIZE = 96;
/** DTO-02. The button the wording of the message draws as a link. */
const DETAILS = 'details';

const POPUP_ID = 'mail-migration-notice-popup';
const POPUP_CLOSE_TESTID = 'mail-migration-notice-popup-close';

/** What the popup is drawn with: brought in when the decision names the popup and not before. */
type PopupUi = {
	PopupManager: typeof PopupManager,
	BannerDispatcher: typeof BannerDispatcher,
	Button: typeof Button,
	ButtonSize: typeof ButtonSize,
	AirButtonStyle: typeof AirButtonStyle,
	Illustration: typeof Illustration,
};

let uiPromise: Promise<PopupUi> | null = null;

function loadUi(): Promise<PopupUi>
{
	uiPromise ??= Runtime
		.loadExtension('main.popup', 'ui.banner-dispatcher', 'ui.buttons', 'ui.system.illustration')
		.then((exports: unknown): PopupUi => exports as PopupUi)
	;

	return uiPromise;
}

/**
 * The migration popup (MIG-A, MIG-B). One popup for both texts: which of them a person reads the
 * server decided, and the popup draws the title, the text and the buttons it was given.
 *
 * It goes through the queue of the portal banners instead of showing itself, so that it does not land
 * on top of another announcement.
 */
export class MigrationPopup
{
	#options: MigrationPopupOptions;
	#ui: PopupUi;
	#popup: Popup | null = null;
	#release: (() => void) | null = null;
	#answered: boolean = false;

	/** The extensions the popup draws with are asked for when it is due, and not before. */
	static async create(options: MigrationPopupOptions): Promise<MigrationPopup>
	{
		return new MigrationPopup(options, await loadUi());
	}

	constructor(options: MigrationPopupOptions, ui: PopupUi)
	{
		this.#options = options;
		this.#ui = ui;
	}

	show(): void
	{
		// `ui.auto-launch` hands the way out of the queue over as a bare `Function`.
		this.#ui.BannerDispatcher.normal.toQueue((onDone: Function): Record<string, never> => {
			this.#release = onDone as () => void;
			this.#popup = this.#createPopup();
			this.#popup.show();
			this.#options.onShown();

			// ui.auto-launch expects a value back from a queued callback and ignores it
			return {};
		});
	}

	destroy(): void
	{
		this.#popup?.destroy();
		this.#popup = null;
		this.#releaseQueue();
	}

	/**
	 * The rest of the portal banners wait behind the popup, and a popup taken down without being
	 * closed reports nothing on its own - so the queue is let go here as well, once.
	 */
	#releaseQueue(): void
	{
		const release = this.#release;
		this.#release = null;
		release?.();
	}

	#createPopup(): Popup
	{
		const titleId = `${POPUP_ID}-title`;

		const popup = this.#ui.PopupManager.create({
			id: POPUP_ID,
			// the width of the popup and its limit on a narrow screen are both in the stylesheet
			className: 'mail-migration-notice-popup',
			overlay: true,
			closeIcon: true,
			closeByEsc: true,
			autoHide: false,
			// A closed popup leaves nothing behind: the next message is a new popup, not a cached one
			cacheable: false,
			role: 'dialog',
			ariaLabelledBy: titleId,
			focusTrap: true,
			content: this.#renderContent(titleId),
			buttons: this.#renderButtons(),
			events: {
				onClose: (): void => {
					this.#handleClose();
					this.#releaseQueue();
				},
			},
		});

		markCloseIcon(popup, POPUP_CLOSE_TESTID);

		return popup;
	}

	/**
	 * A popup nobody answered is a popup that was closed, and the closing is reported: the hint of it
	 * and the message that follows it are both the extension's to bring (AC-012).
	 */
	#handleClose(): void
	{
		this.#popup = null;
		if (this.#answered)
		{
			return;
		}

		this.#answered = true;
		this.#options.onDismiss();
	}

	/**
	 * The canon of composition tops a dialog that carries a title and a description with a 3D
	 * illustration of the library, and the name of the subject arrives with the message: the tone of
	 * the picture belongs to what the message says, and that is not this file's to decide.
	 *
	 * The picture is decorative and carries no label: the title beside it says the same in words, and
	 * a screen reader that read both would say it twice.
	 */
	#renderContent(titleId: string): HTMLElement
	{
		return Tag.render`
			<div class="mail-migration-notice-popup__content" data-testid="mail-migration-notice-popup">
				${this.#renderIllustration()}
				<div id="${titleId}" class="mail-migration-notice-popup__title">
					${Text.encode(this.#options.title)}
				</div>
				<div class="mail-migration-notice-popup__text">${Text.encode(this.#options.text)}</div>
			</div>
		`;
	}

	#renderIllustration(): HTMLElement | string
	{
		if (!Type.isStringFilled(this.#options.illustration))
		{
			return '';
		}

		return new this.#ui.Illustration({
			name: this.#options.illustration,
			size: ILLUSTRATION_SIZE,
		}).render();
	}

	/**
	 * The first button of the decision is the way out of the trouble, the rest go beside it.
	 *
	 * "Learn more" is drawn as a link and not as a third button: the wording of the message calls it
	 * one, and a dialog carries two buttons at most - three of them do not fit across and the last was
	 * wrapping onto a line of its own.
	 */
	#renderButtons(): Button[]
	{
		return this.#options.actions.map((action: NoticeAction, index: number): Button => new this.#ui.Button({
			text: action.label,
			link: leadsToControlPanel(action.id) ? '' : action.url,
			props: leadsToControlPanel(action.id) ? {} : linkProps(action.url),
			dataset: { testid: 'mail-migration-notice-popup-btn' },
			className: 'mail-migration-notice-popup__action',
			size: this.#ui.ButtonSize.MEDIUM,
			useAirDesign: true,
			style: this.#styleOf(action, index),
			// `ui.buttons` types a click handler as returning an object.
			onclick: (): {} => {
				this.#answer(action);

				// The way into the panel is asked for at the click and not baked into the markup: the address
				// it leads to is one-off and expires in a minute
				if (leadsToControlPanel(action.id))
				{
					void openControlPanel();
				}

				return {};
			},
			// `ui.buttons` types `collapsedIcon` as required, the icon-less button notwithstanding.
		} as ConstructorParameters<typeof Button>[0]));
	}

	/** An answer closes the popup and speaks for the person, so the closing says nothing on its own. */
	#styleOf(action: NoticeAction, index: number): string
	{
		if (action.id === DETAILS)
		{
			return this.#ui.AirButtonStyle.PLAIN_ACCENT;
		}

		return index === 0 ? this.#ui.AirButtonStyle.FILLED : this.#ui.AirButtonStyle.PLAIN;
	}

	#answer(action: NoticeAction): void
	{
		if (action.answer === null)
		{
			return;
		}

		this.#answered = true;
		action.answer();
		this.#popup?.close();
	}
}
