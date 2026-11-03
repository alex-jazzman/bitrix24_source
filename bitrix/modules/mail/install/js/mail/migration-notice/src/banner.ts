import { Dom, Event, Loc, Runtime, Tag, Text, Type } from 'main.core';
import { type Alert } from 'ui.alerts';
import { type AirButtonStyle, type Button, type ButtonSize } from 'ui.buttons';

import { leadsToControlPanel, openControlPanel } from './control-panel';
import { type NoticeAction } from './types';

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

export type MigrationBannerOptions = {
	container: HTMLElement,
	title: string,
	text: string,
	actions: NoticeAction[],
	onDismiss: () => void,
};

/** What the banner is drawn with: brought in when the decision names the banner and not before. */
type BannerUi = {
	Alert: typeof Alert,
	Button: typeof Button,
	ButtonSize: typeof ButtonSize,
	AirButtonStyle: typeof AirButtonStyle,
};

let uiPromise: Promise<BannerUi> | null = null;

function loadUi(): Promise<BannerUi>
{
	uiPromise ??= Runtime
		.loadExtension('ui.alerts', 'ui.buttons')
		.then((exports: unknown): BannerUi => exports as BannerUi)
	;

	return uiPromise;
}

/**
 * The banner of the migration (BAN-1). It speaks about the move alone: the trouble of a mailbox is
 * told by the red alert, which lives in the same node above it (AC-027).
 */
export class MigrationBanner
{
	#options: MigrationBannerOptions;
	#ui: BannerUi;
	#alert: Alert | null = null;
	#container: HTMLElement | null = null;

	/** The extensions the banner draws with are asked for when it is due, and not before. */
	static async create(options: MigrationBannerOptions): Promise<MigrationBanner>
	{
		return new MigrationBanner(options, await loadUi());
	}

	constructor(options: MigrationBannerOptions, ui: BannerUi)
	{
		this.#options = options;
		this.#ui = ui;
	}

	show(): void
	{
		if (this.#alert !== null)
		{
			return;
		}

		this.#alert = new this.#ui.Alert({
			text: Text.encode(this.#options.text),
			color: this.#ui.Alert.Color.PRIMARY,
			icon: this.#ui.Alert.Icon.INFO,
			size: this.#ui.Alert.Size.MD,
			closeBtn: true,
			// Air colours are read from the context of the surface, and this card is a light one: without
			// the class its buttons take their colours from the branded background of the portal behind.
			customClass: 'mail-migration-notice-banner --ui-context-content-light',
			beforeMessageHtml: this.#renderTitle(),
			afterMessageHtml: this.#renderActions(),
			// `ui.alerts` types every option as required, the defaults notwithstanding.
		} as ConstructorParameters<typeof Alert>[0]);

		const container = this.#alert.render();
		this.#container = container;
		Dom.attr(container, {
			'data-testid': 'mail-migration-notice-banner',
			// The banner comes after the page has been read, and every reaction brings a new one in its
			// place: its coming has to reach a screen reader (WCAG 4.1.3). It invites and does not warn,
			// so the announcement is a polite one.
			role: 'status',
		});
		this.#adjustCloseBtn(container);

		// The alert of a broken mailbox is prepended to the same node and has to stay above (AC-027)
		Dom.append(container, this.#options.container);
	}

	destroy(): void
	{
		this.#releaseFocus();
		this.#alert?.destroy();
		this.#alert = null;
		this.#container = null;
	}

	/**
	 * The close button of the alert is a decoration: it needs a name and a way in from the keyboard to
	 * become the cross a person can actually press.
	 */
	#adjustCloseBtn(container: HTMLElement): void
	{
		const closeBtn = this.#alert?.getCloseBtn();
		if (!Type.isDomNode(closeBtn))
		{
			return;
		}

		Dom.attr(closeBtn, {
			role: 'button',
			tabindex: '0',
			'aria-label': Loc.getMessage('MAIL_MIGRATION_NOTICE_BANNER_CLOSE') ?? '',
			'data-testid': 'mail-migration-notice-banner-close',
		});

		Event.bind(closeBtn, 'keydown', (event: KeyboardEvent): void => {
			if (event.key === 'Enter' || event.key === ' ')
			{
				event.preventDefault();
				closeBtn.click();
			}
		});

		/*
			`ui.alerts` takes the whole node of the alert down in its own handler of the cross, and that
			handler was bound before ours - so by the time ours runs the cross is gone together with the
			focus on it. The catch on the way down, on the node above the cross, is what still sees the
			alert in place.
		*/
		Event.bind(container, 'click', (event: MouseEvent): void => {
			if (closeBtn.contains(event.target as Node))
			{
				this.#releaseFocus();
			}
		}, { capture: true });

		Event.bind(closeBtn, 'click', (): void => this.#options.onDismiss());
	}

	/**
	 * The banner goes away both by its cross and by the decision that replaces it, and a focus standing
	 * inside would fall to `<body>`: the person loses the place, the screen reader the context. The
	 * focus is moved onto the node the banner lived in - the same spot on the page, from which Tab goes
	 * on in the order of the document.
	 */
	#releaseFocus(): void
	{
		if (this.#container?.contains(document.activeElement) !== true)
		{
			return;
		}

		const host = this.#options.container;
		if (!host.hasAttribute('tabindex'))
		{
			Dom.attr(host, 'tabindex', '-1');
		}

		host.focus();
	}

	#renderTitle(): HTMLElement
	{
		return Tag.render`
			<span class="mail-migration-notice-banner__title">${Text.encode(this.#options.title)}</span>
		`;
	}

	#renderActions(): HTMLElement
	{
		const actions = Tag.render`<div class="mail-migration-notice-banner__actions"></div>`;

		this.#options.actions.forEach((action: NoticeAction): void => {
			new this.#ui.Button({
				text: action.label,
				link: leadsToControlPanel(action.id) ? '' : action.url,
				props: leadsToControlPanel(action.id) ? {} : linkProps(action.url),
				dataset: { testid: 'mail-migration-notice-banner-btn' },
				className: 'mail-migration-notice-banner__action',
				size: this.#ui.ButtonSize.SMALL,
				useAirDesign: true,
				style: this.#ui.AirButtonStyle.FILLED,
				// `ui.buttons` types a click handler as returning an object.
				onclick: (): {} => {
					action.answer?.();

					// The way into the panel is asked for at the click and not baked into the markup: the
					// address it leads to is one-off and expires in a minute
					if (leadsToControlPanel(action.id))
					{
						void openControlPanel();
					}

					return {};
				},
				// `ui.buttons` types `collapsedIcon` as required, the icon-less button notwithstanding.
			} as ConstructorParameters<typeof Button>[0]).renderTo(actions);
		});

		return actions;
	}
}
