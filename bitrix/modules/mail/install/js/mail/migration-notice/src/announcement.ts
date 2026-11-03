import { Runtime, Tag, Text, Type } from 'main.core';
import { type Popup, type PopupManager } from 'main.popup';
import { type LaunchItemOptions } from 'ui.auto-launch';
import { type BannerDispatcher } from 'ui.banner-dispatcher';
import { type AirButtonStyle, type Button, type ButtonSize } from 'ui.buttons';
import { type Illustration } from 'ui.system.illustration';

import { leadsToControlPanel, openControlPanel } from './control-panel';
import { markCloseIcon } from './close-icon';
import { type NoticeAction } from './types';

export type MigrationAnnouncementOptions = {
	illustration: string,
	title: string,
	text: string,
	actions: NoticeAction[],
	onShown: () => void,
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

const ILLUSTRATION_SIZE = 128;
const POPUP_ID = 'mail-migration-notice-announcement';
const POPUP_CLOSE_TESTID = 'mail-migration-notice-announcement-close';

/**
 * What the announcement is drawn with. The extension is mounted on every page of the portal, so the
 * code of a message comes when that message is due and not with the extension itself.
 */
type AnnouncementUi = {
	PopupManager: typeof PopupManager,
	BannerDispatcher: typeof BannerDispatcher,
	Button: typeof Button,
	ButtonSize: typeof ButtonSize,
	AirButtonStyle: typeof AirButtonStyle,
	Illustration: typeof Illustration,
};

let uiPromise: Promise<AnnouncementUi> | null = null;

function loadUi(): Promise<AnnouncementUi>
{
	uiPromise ??= Runtime
		.loadExtension('main.popup', 'ui.banner-dispatcher', 'ui.buttons', 'ui.system.illustration')
		.then((exports: unknown): AnnouncementUi => exports as AnnouncementUi)
	;

	return uiPromise;
}

/**
 * The section a person is standing in registers itself as an open slider of the portal, and the queue
 * holds every message back while a slider it knows nothing about is open (`ui.auto-launch`,
 * `Launcher#hasOpenSlider`). Naming that slider says the announcement belongs to this very page, so
 * the queue lets it through - while a slider opened over the page still holds it back, as it should.
 *
 * The address is the one a section registers its slider with: the path of the page and its query.
 */
function currentSliderId(): string
{
	return `${window.location.pathname}${window.location.search}`;
}

/**
 * The announcement of the mail of Bitrix24 (ANN-1): the one message of the feature that speaks
 * outside the Mail section and the CRM card (AC-003).
 *
 * It covers the portal, so it goes through the queue of the portal banners at the priority of the
 * other full-screen messages: the queue of the lower priorities is dropped altogether on a portal
 * that forbids advertising (AC-001, AC-002).
 *
 * That is why the showing is what is reported and not the asking: the announcement is due once for a
 * lifetime, and a decision that never reached the screen - dropped by the queue, or lost with the
 * extensions it draws with - leaves it owed until it does (ERR-001).
 */
export class MigrationAnnouncement
{
	#options: MigrationAnnouncementOptions;
	#ui: AnnouncementUi;
	#popup: Popup | null = null;
	#release: (() => void) | null = null;

	/** The extensions the announcement draws with are asked for when it is due, and not before. */
	static async create(options: MigrationAnnouncementOptions): Promise<MigrationAnnouncement>
	{
		return new MigrationAnnouncement(options, await loadUi());
	}

	constructor(options: MigrationAnnouncementOptions, ui: AnnouncementUi)
	{
		this.#options = options;
		this.#ui = ui;
	}

	show(): void
	{
		// `ui.auto-launch` types the options of a queued item as if they carried the callback and the
		// whole launch context; the dispatcher takes the callback apart, and the queue is asked to
		// compare one thing only - the address of the page
		const queueOptions = { context: { sliderId: currentSliderId() } } as LaunchItemOptions;

		// `ui.auto-launch` hands the way out of the queue over as a bare `Function`.
		this.#ui.BannerDispatcher.high.toQueue((onDone: Function): Record<string, never> => {
			this.#release = onDone as () => void;
			this.#popup = this.#createPopup();
			this.#popup.show();
			// The announcement is counted by the server the moment a person has it in front of them
			this.#options.onShown();

			// ui.auto-launch expects a value back from a queued callback and ignores it
			return {};
		}, queueOptions);
	}

	destroy(): void
	{
		this.#popup?.destroy();
		this.#popup = null;
		this.#releaseQueue();
	}

	/**
	 * The rest of the portal banners wait behind the announcement, and a popup taken down without
	 * being closed reports nothing on its own - so the queue is let go here as well, once.
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
			// the width of the announcement and its limit on a narrow screen are both in the stylesheet
			className: 'mail-migration-notice-announcement',
			overlay: true,
			// The announcement belongs to the portal, not to the place of the page it was born in
			fixed: true,
			closeIcon: true,
			closeByEsc: true,
			autoHide: false,
			// A closed announcement leaves nothing behind: it is shown once and for all (AC-002)
			cacheable: false,
			role: 'dialog',
			ariaLabelledBy: titleId,
			focusTrap: true,
			content: this.#renderContent(titleId),
			buttons: this.#renderButtons(),
			events: {
				onClose: (): void => {
					this.#popup = null;
					this.#releaseQueue();
				},
			},
		});

		markCloseIcon(popup, POPUP_CLOSE_TESTID);

		return popup;
	}

	/**
	 * The canon of composition tops a dialog that carries a title and a description with a 3D
	 * illustration of the library. The picture is decorative and carries no label: the title beside it
	 * says the same in words, and a screen reader that read both would say it twice.
	 */
	#renderContent(titleId: string): HTMLElement
	{
		return Tag.render`
			<div class="mail-migration-notice-announcement__content" data-testid="mail-migration-notice-announcement">
				${this.#renderIllustration()}
				<div id="${titleId}" class="mail-migration-notice-announcement__title">
					${Text.encode(this.#options.title)}
				</div>
				<div class="mail-migration-notice-announcement__text">${Text.encode(this.#options.text)}</div>
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

	/** The first button of the decision is the way the announcement offers, the rest go beside it. */
	#renderButtons(): Button[]
	{
		return this.#options.actions.map((action: NoticeAction, index: number): Button => new this.#ui.Button({
			text: action.label,
			link: leadsToControlPanel(action.id) ? '' : action.url,
			props: leadsToControlPanel(action.id) ? {} : linkProps(action.url),
			dataset: { testid: 'mail-migration-notice-announcement-btn' },
			className: 'mail-migration-notice-announcement__action',
			size: this.#ui.ButtonSize.LARGE,
			useAirDesign: true,
			style: index === 0 ? this.#ui.AirButtonStyle.FILLED : this.#ui.AirButtonStyle.PLAIN,
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

	/** A button that leads somewhere leaves the announcement alone; the rest of them close it. */
	#answer(action: NoticeAction): void
	{
		if (action.answer === null)
		{
			return;
		}

		action.answer();
		this.#popup?.close();
	}
}
