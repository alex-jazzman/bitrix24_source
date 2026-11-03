import { ajax as Ajax, Dom, Event, Loc, Reflection, Tag, Type } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { AutoLauncher, LaunchPriority } from 'ui.auto-launch';
import { AirButtonStyle, Button, ButtonSize, type ButtonOptions } from 'ui.buttons';
import 'ui.design-tokens.air';
import { Icon, IconHoverMode, Outline } from 'ui.icon-set.api.core';
import 'ui.icon-set.outline';
import { Dialog } from 'ui.system.dialog';
import { Label, LabelSize, LabelStyle } from 'ui.system.label';
import { Headline, Text as TypographyText } from 'ui.system.typography';

import { ApacheSupersetAnalytics } from 'biconnector.apache-superset-analytics';

import { WaterBackdrop } from './water-backdrop';

import './bitrixgpt-bi-announce.css';

export const AnnounceSurface = Object.freeze({
	Detail: 'detail',
	List: 'list',
});

export type BitrixGptBiAnnounceOptions = {
	surface: string;
	canShow: boolean;
	// Detail runtime state (EVENT-01): lets the announcement read readiness that happened before it loaded.
	isEmbedReady?: () => boolean;
	// Detail runtime state: the one-time hint of the surface, which the announcement gives way to.
	isHintShown?: () => boolean;
};

const CLAIM_ACTION = 'biconnector.dashboard.claimBitrixGptBiAnnouncement';
const LAUNCH_ITEM_ID = 'biconnector-bitrixgpt-bi-announce';
const LAUNCHER_CLASS_NAME = 'BX.BIConnector.BitrixGptLauncher';
const BLOCK_CLASS = 'biconnector-bitrixgpt-bi-announce';
const TITLE_ID = 'biconnector-bitrixgpt-bi-announce-title';

// Painting order of the illustration, bottom-up. The designer ships the art cut into layers
// along one common frame, so the composition needs no per-layer coordinates.
const ART_LAYERS = ['back', 'icon-0', 'icon-1', 'icon-2', 'icon-3', 'logo', 'mascot'];

// The headline paints this word with the product gradient; the rest stays plain.
const BRAND_WORD = 'BitrixGPT';

// The water backdrop reads its raster from the card itself, so the asset stays declared in one
// place - the css background - instead of being repeated as a path in the script.
const BACKGROUND_URL_PATTERN = /url\(["']?(.+?)["']?\)/;

// Maximum pointer shift of the illustration, in pixels at depth 1. The vertical one is smaller:
// the scene is wider than tall, and an equal shift reads as the art sliding off the card.
const PARALLAX_SHIFT_X = 12;
const PARALLAX_SHIFT_Y = 8;

// Embed resolves within a second on a warm instance; the wait is bounded so a stuck
// embed never holds the launch slot for the rest of the visit.
const EMBED_READY_TIMEOUT = 10000;

const EmbedEvent = Object.freeze({
	Ready: 'biconnector:dashboard-embed-ready',
	Error: 'biconnector:dashboard-embed-error',
});

const EmbedOutcome = Object.freeze({
	Ready: 'ready',
	Error: 'error',
});

const ANALYTICS_CATEGORY = 'bitrixgpt_bi_announce';

const AnalyticsEvent = Object.freeze({
	Shown: 'popup_shown',
	Try: 'popup_cta_try',
	Later: 'popup_later',
	Close: 'popup_close',
});

type BitrixGptLauncher = Function & {
	getInstance: () => { isOpen: () => boolean, open: () => void } | null;
};

type AnalyticsData = Parameters<typeof ApacheSupersetAnalytics.sendAnalytics>[2];
type LaunchOptions = Parameters<typeof AutoLauncher.register>[1];

/**
 * Phrase lookup with a version fallback. A reworded text ships as CODE_MSGVER_1 next to the
 * original CODE: the versioned phrase wins wherever it exists, so a locale that has not been
 * given the new wording yet keeps serving the translation ordered for the original. Same shape
 * Loc.getMessagePlural uses for its plural suffixes.
 */
const getMessage = (key: string): string =>
{
	const versioned = `${key}_MSGVER_1`;

	return Loc.getMessage(Loc.hasMessage(versioned) ? versioned : key) ?? '';
};

export class BitrixGptBiAnnounce
{
	static #instance: BitrixGptBiAnnounce | null = null;

	#surface: string;
	#isEmbedReady: (() => boolean) | null;
	#isHintShown: (() => boolean) | null;

	#dialog: Dialog | null = null;
	#contentNode: HTMLElement | null = null;
	#done: Function | null = null;
	#closeEvent: string | null = null;
	#isCloseEventSent: boolean = false;

	#water: WaterBackdrop | null = null;
	#artNode: HTMLElement | null = null;
	#pointer: { x: number, y: number } | null = null;
	#parallaxFrameId: number | null = null;

	#embedOutcome: string | null = null;
	#embedWaiter: ((isReady: boolean) => void) | null = null;
	#embedTimeoutId: number | null = null;
	#isSubscribedToEmbed: boolean = false;

	constructor(options: BitrixGptBiAnnounceOptions)
	{
		this.#surface = options.surface;
		this.#isEmbedReady = Type.isFunction(options.isEmbedReady) ? options.isEmbedReady : null;
		this.#isHintShown = Type.isFunction(options.isHintShown) ? options.isHintShown : null;
	}

	static init(options: BitrixGptBiAnnounceOptions): BitrixGptBiAnnounce | null
	{
		if (BitrixGptBiAnnounce.#instance !== null)
		{
			return BitrixGptBiAnnounce.#instance;
		}

		const knownSurfaces: string[] = Object.values(AnnounceSurface);
		const isKnownSurface = knownSurfaces.includes(options?.surface);
		if (!isKnownSurface || options.canShow !== true)
		{
			return null;
		}

		const announce = new BitrixGptBiAnnounce(options);
		BitrixGptBiAnnounce.#instance = announce;
		announce.#register();

		return announce;
	}

	// Counterpart of the registration done by init(): drops the queue item, the embed
	// listeners and a held slot, so the surface can mount the announcement again.
	destroy(): void
	{
		AutoLauncher.unregister(LAUNCH_ITEM_ID);
		this.#unbindParallax();
		this.#unmountWater();
		this.#release();
		this.#dialog = null;

		if (BitrixGptBiAnnounce.#instance === this)
		{
			BitrixGptBiAnnounce.#instance = null;
		}
	}

	#register(): void
	{
		// Subscription goes before registration: the slot arrives seconds later, so a listener
		// added on the slot would miss the embed event that already happened.
		if (this.#surface === AnnounceSurface.Detail)
		{
			this.#subscribeToEmbed();
		}

		// register() supplies the callback itself, its option type still lists it as required.
		const launchOptions = {
			id: LAUNCH_ITEM_ID,
			priority: LaunchPriority.NORMAL,
			allowLaunchAfterOthers: false,
		} as LaunchOptions;

		AutoLauncher.register(
			(done: Function): {} => {
				void this.#handleSlot(done);

				return {};
			},
			launchOptions,
		);
	}

	async #handleSlot(done: Function): Promise<void>
	{
		this.#done = done;

		if (this.#surface === AnnounceSurface.Detail)
		{
			const isEmbedReady = await this.#waitForEmbedReady();
			if (!isEmbedReady)
			{
				this.#release();

				return;
			}
		}

		// The one-time hint of the surface came first and holds the attention: the announcement
		// gives way to it and keeps its single show for the next visit.
		if (this.#isLauncherOpen() || this.#isHintShown?.() === true)
		{
			this.#release();

			return;
		}

		if (!await this.#claim())
		{
			this.#release();

			return;
		}

		this.#showDialog();
	}

	#subscribeToEmbed(): void
	{
		if (this.#isSubscribedToEmbed)
		{
			return;
		}

		this.#isSubscribedToEmbed = true;
		EventEmitter.subscribe(EmbedEvent.Ready, this.#handleEmbedReady);
		EventEmitter.subscribe(EmbedEvent.Error, this.#handleEmbedError);
	}

	#unsubscribeFromEmbed(): void
	{
		if (!this.#isSubscribedToEmbed)
		{
			return;
		}

		this.#isSubscribedToEmbed = false;
		EventEmitter.unsubscribe(EmbedEvent.Ready, this.#handleEmbedReady);
		EventEmitter.unsubscribe(EmbedEvent.Error, this.#handleEmbedError);
	}

	#handleEmbedReady = (): void => {
		this.#latchEmbedOutcome(EmbedOutcome.Ready);
	};

	#handleEmbedError = (): void => {
		this.#latchEmbedOutcome(EmbedOutcome.Error);
	};

	// First outcome wins: switching the report re-runs the embed and fires ready again.
	#latchEmbedOutcome(outcome: string): void
	{
		if (this.#embedOutcome !== null)
		{
			return;
		}

		this.#embedOutcome = outcome;
		this.#finishEmbedWait(outcome === EmbedOutcome.Ready);
	}

	#waitForEmbedReady(): Promise<boolean> | boolean
	{
		if (this.#embedOutcome !== null)
		{
			return this.#embedOutcome === EmbedOutcome.Ready;
		}

		if (this.#isEmbedReady?.() === true)
		{
			return true;
		}

		return new Promise((resolve: (isReady: boolean) => void) => {
			this.#embedWaiter = resolve;
			this.#embedTimeoutId = setTimeout(() => {
				this.#finishEmbedWait(false);
			}, EMBED_READY_TIMEOUT);
		});
	}

	#finishEmbedWait(isReady: boolean): void
	{
		if (this.#embedTimeoutId !== null)
		{
			clearTimeout(this.#embedTimeoutId);
			this.#embedTimeoutId = null;
		}

		this.#unsubscribeFromEmbed();

		const waiter = this.#embedWaiter;
		this.#embedWaiter = null;
		waiter?.(isReady);
	}

	#getLauncher(): BitrixGptLauncher | null
	{
		return Reflection.getClass(LAUNCHER_CLASS_NAME) as BitrixGptLauncher | null;
	}

	#isLauncherOpen(): boolean
	{
		return this.#getLauncher()?.getInstance()?.isOpen() === true;
	}

	async #claim(): Promise<boolean>
	{
		try
		{
			const response = await Ajax.runAction(CLAIM_ACTION, { data: {} });

			return response?.data?.claimed === true;
		}
		catch
		{
			return false;
		}
	}

	#release(): void
	{
		this.#finishEmbedWait(false);

		const done = this.#done;
		this.#done = null;
		done?.();
	}

	#showDialog(): void
	{
		// Every slot is left empty on purpose: the card is painted by the content itself, and the
		// header and footer of the dialog lie outside it, on the portal background. An empty
		// header and footer remove themselves, so the content is the whole visible surface.
		this.#dialog = new Dialog({
			content: this.#renderContent(),
			hasOverlay: true,
			hasVerticalPadding: false,
			hasHorizontalPadding: false,
			hasCloseButton: false,
		});

		this.#dialog.subscribe('onShow', this.#handleDialogShow);
		this.#dialog.subscribe('onHide', this.#handleDialogHide);

		this.#dialog.show();
		this.#sendAnalytics(AnalyticsEvent.Shown);
	}

	// The dialog carries role="dialog" from main.popup but names neither ariaLabel nor
	// ariaLabelledBy, so the accessible name is set on the rendered container.
	#handleDialogShow = (): void => {
		const dialogContainer = this.#contentNode?.closest<HTMLElement>('[role="dialog"]');
		if (dialogContainer !== null && dialogContainer !== undefined)
		{
			Dom.attr(dialogContainer, 'aria-labelledby', TITLE_ID);
		}

		this.#bindParallax();
		this.#mountWater();
	};

	#handleDialogHide = (): void => {
		if (!this.#isCloseEventSent)
		{
			this.#isCloseEventSent = true;
			this.#sendAnalytics(this.#closeEvent ?? AnalyticsEvent.Close);
		}

		if (this.#closeEvent === AnalyticsEvent.Try)
		{
			this.#openLauncher();
		}

		this.#unbindParallax();
		this.#unmountWater();
		this.#dialog = null;
		this.#release();
	};

	/**
	 * Water surface under the card. Both the raster and the flat colour under it are taken from the
	 * computed style of the card, so the css background stays the single declaration of the asset -
	 * and the still fallback for everyone the canvas does not run for.
	 */
	#mountWater(): void
	{
		const content = this.#contentNode;
		const host = content?.querySelector(`.${BLOCK_CLASS}__backdrop`);
		if (content === null || content === undefined || !(host instanceof HTMLElement))
		{
			return;
		}

		const style = getComputedStyle(content);

		this.#water = WaterBackdrop.mount({
			host,
			base: style.backgroundColor,
			imageUrl: BACKGROUND_URL_PATTERN.exec(style.backgroundImage)?.[1],
		});
	}

	#unmountWater(): void
	{
		this.#water?.destroy();
		this.#water = null;
	}

	/**
	 * Pointer parallax of the illustration, as in the mockup: the layers follow the cursor, each
	 * by its own depth. The shift is written once per frame as two custom properties on the art
	 * group, and every layer scales it by its own --announce-depth in css - so eight layers cost
	 * one style write, not eight.
	 */
	#bindParallax(): void
	{
		const content = this.#contentNode;
		const art = content?.querySelector(`.${BLOCK_CLASS}__art`);
		if (content === null || !(art instanceof HTMLElement) || BitrixGptBiAnnounce.#isMotionReduced())
		{
			return;
		}

		this.#artNode = art;
		Event.bind(content, 'mousemove', this.#handlePointerMove);
		Event.bind(content, 'mouseleave', this.#handlePointerLeave);
	}

	#unbindParallax(): void
	{
		if (this.#parallaxFrameId !== null)
		{
			cancelAnimationFrame(this.#parallaxFrameId);
			this.#parallaxFrameId = null;
		}

		if (this.#contentNode !== null)
		{
			Event.unbind(this.#contentNode, 'mousemove', this.#handlePointerMove);
			Event.unbind(this.#contentNode, 'mouseleave', this.#handlePointerLeave);
		}

		this.#artNode = null;
		this.#pointer = null;
	}

	// The card, not the layers, is the tracked surface: the art bleeds above the top edge of the
	// card and its layers are aria-hidden decoration that must not react on their own.
	#handlePointerMove = (event: MouseEvent): void => {
		this.#pointer = { x: event.clientX, y: event.clientY };

		// One frame at a time: mousemove fires far more often than the screen repaints.
		if (this.#parallaxFrameId === null)
		{
			this.#parallaxFrameId = requestAnimationFrame(this.#applyParallax);
		}
	};

	#handlePointerLeave = (): void => {
		this.#pointer = null;
		this.#writeParallax(0, 0);
	};

	#applyParallax = (): void => {
		this.#parallaxFrameId = null;

		const art = this.#artNode;
		const pointer = this.#pointer;
		if (art === null || pointer === null)
		{
			return;
		}

		const box = art.getBoundingClientRect();
		if (box.width <= 0 || box.height <= 0)
		{
			return;
		}

		const ratioX = (pointer.x - (box.left + (box.width / 2))) / (box.width / 2);
		const ratioY = (pointer.y - (box.top + (box.height / 2))) / (box.height / 2);

		this.#writeParallax(
			BitrixGptBiAnnounce.#clampRatio(ratioX) * PARALLAX_SHIFT_X,
			BitrixGptBiAnnounce.#clampRatio(ratioY) * PARALLAX_SHIFT_Y,
		);
	};

	#writeParallax(x: number, y: number): void
	{
		Dom.style(this.#artNode, {
			'--announce-pointer-x': `${x.toFixed(2)}px`,
			'--announce-pointer-y': `${y.toFixed(2)}px`,
		});
	}

	// The cursor may leave the card diagonally, past the art group - the shift stays bounded.
	static #clampRatio(value: number): number
	{
		return Math.min(1, Math.max(-1, value));
	}

	static #isMotionReduced(): boolean
	{
		return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	}

	#openLauncher(): void
	{
		this.#getLauncher()?.getInstance()?.open();
	}

	#createButtons(): Button[]
	{
		if (this.#surface === AnnounceSurface.List)
		{
			return [
				this.#createButton(
					getMessage('BICONNECTOR_BITRIXGPT_BI_ANNOUNCE_BUTTON_GOT_IT'),
					AirButtonStyle.FILLED_SUCCESS,
					AnalyticsEvent.Later,
				),
			];
		}

		// Target action first, as in the mockup of the report page: the footer of the announcement
		// reads left to right, unlike the right-aligned button set of the dialog.
		return [
			this.#createButton(
				getMessage('BICONNECTOR_BITRIXGPT_BI_ANNOUNCE_BUTTON_TRY'),
				AirButtonStyle.FILLED_SUCCESS,
				AnalyticsEvent.Try,
			),
			this.#createButton(
				getMessage('BICONNECTOR_BITRIXGPT_BI_ANNOUNCE_BUTTON_LATER'),
				AirButtonStyle.PLAIN,
				AnalyticsEvent.Later,
			),
		];
	}

	#createButton(text: string, style: string, closeEvent: string): Button
	{
		const options: Partial<ButtonOptions> = {
			text,
			style,
			size: ButtonSize.LARGE,
			useAirDesign: true,
			onclick: (): {} => {
				this.#closeEvent = closeEvent;
				this.#dialog?.hide();

				return {};
			},
		};

		return new Button(options as ButtonOptions);
	}

	#renderContent(): HTMLElement
	{
		const title = this.#renderTitle();
		Dom.attr(title, 'id', TITLE_ID);

		const content: HTMLElement = Tag.render`
			<div class="${BLOCK_CLASS}">
				<div class="${BLOCK_CLASS}__backdrop" aria-hidden="true"></div>
				<div class="${BLOCK_CLASS}__media" aria-hidden="true">
					<div class="${BLOCK_CLASS}__art">
						${ART_LAYERS.map((layer: string): HTMLElement => Tag.render`
							<div class="${BLOCK_CLASS}__art-layer --${layer}"></div>
						`)}
					</div>
				</div>
				${this.#renderCloseButton()}
				<div class="${BLOCK_CLASS}__header">
					<div class="${BLOCK_CLASS}__title-row">
						${title}
						${this.#renderBadge()}
					</div>
					${TypographyText.render(getMessage('BICONNECTOR_BITRIXGPT_BI_ANNOUNCE_SUBTITLE'), {
						size: 'lg',
						className: `${BLOCK_CLASS}__subtitle`,
					})}
				</div>
				<div class="${BLOCK_CLASS}__features">
					${this.#renderFeature(
						Outline.AI_STARS_QUESTION,
						'BICONNECTOR_BITRIXGPT_BI_ANNOUNCE_FEATURE_ASK_TITLE',
						'BICONNECTOR_BITRIXGPT_BI_ANNOUNCE_FEATURE_ASK_TEXT',
					)}
					${this.#renderFeature(
						Outline.IDEA_LAMP,
						'BICONNECTOR_BITRIXGPT_BI_ANNOUNCE_FEATURE_INSIGHT_TITLE',
						'BICONNECTOR_BITRIXGPT_BI_ANNOUNCE_FEATURE_INSIGHT_TEXT',
					)}
				</div>
				<div class="${BLOCK_CLASS}__footer">
					${this.#createButtons().map((button: Button): HTMLElement => button.render())}
				</div>
			</div>
		`;

		this.#contentNode = content;

		return content;
	}

	/**
	 * Splits the headline around the brand word so only it carries the gradient. The phrase stays
	 * the single source of the text: the word is looked up in it, not substituted into markup, so
	 * editing or translating the phrase cannot break the headline. No brand word - plain headline.
	 */
	#renderTitle(): HTMLElement
	{
		const text = getMessage('BICONNECTOR_BITRIXGPT_BI_ANNOUNCE_TITLE');
		const title = Headline.render(text, {
			size: 'lg',
			accent: true,
			tag: 'h3',
			className: `${BLOCK_CLASS}__title`,
		});

		const brandAt = text.indexOf(BRAND_WORD);
		if (brandAt < 0)
		{
			return title;
		}

		const brand: HTMLElement = Tag.render`<span class="${BLOCK_CLASS}__brand">${BRAND_WORD}</span>`;
		Dom.clean(title);
		title.append(
			text.slice(0, brandAt),
			brand,
			text.slice(brandAt + BRAND_WORD.length),
		);

		return title;
	}

	// Light close button of its own: it lies on top of the hero, outside the aria-hidden
	// illustration, and keeps contrast that the dark button of the dialog header loses there.
	#renderCloseButton(): HTMLElement
	{
		const icon = new Icon({
			icon: Outline.CROSS_L,
			size: 24,
			color: 'var(--ui-color-base-white-fixed)',
			hoverMode: IconHoverMode.DEFAULT,
		}).render();

		const button: HTMLElement = Tag.render`
			<button
				class="${BLOCK_CLASS}__close"
				type="button"
				aria-label="${getMessage('BICONNECTOR_BITRIXGPT_BI_ANNOUNCE_CLOSE')}"
			>${icon}</button>
		`;

		Event.bind(button, 'click', () => {
			this.#dialog?.hide();
		});

		return button;
	}

	// Own wrapper: it carries the optical alignment with the headline, so the DS label keeps
	// its component API and none of its internal classes are restyled.
	#renderBadge(): HTMLElement
	{
		// Inverted fill: on the blue card the badge is a solid light pill with dark text, while
		// the tinted style would give translucent white on white and lose the text.
		const badge = new Label({
			value: getMessage('BICONNECTOR_BITRIXGPT_BI_ANNOUNCE_BADGE'),
			size: LabelSize.MD,
			style: LabelStyle.FILLED_SUCCESS,
			border: false,
		});

		return Tag.render`
			<div class="${BLOCK_CLASS}__badge">${badge.render()}</div>
		`;
	}

	#renderFeature(icon: string, titleKey: string, textKey: string): HTMLElement
	{
		const iconNode = new Icon({
			icon,
			size: 24,
			color: 'var(--ui-color-design-filled-content-icon)',
		}).render();

		return Tag.render`
			<div class="${BLOCK_CLASS}__feature">
				<div class="${BLOCK_CLASS}__feature-icon">${iconNode}</div>
				<div class="${BLOCK_CLASS}__feature-body">
					${/* Headline, not Text: only .ui-headline.--accent gives the semi-bold of the mockup, .ui-text.--accent stops at medium. */
					Headline.render(getMessage(titleKey), {
						size: 'sm',
						accent: true,
						tag: 'div',
						className: `${BLOCK_CLASS}__feature-title`,
					})}
					${TypographyText.render(getMessage(textKey), {
						size: 'sm',
						className: `${BLOCK_CLASS}__feature-text`,
					})}
				</div>
			</div>
		`;
	}

	#sendAnalytics(event: string): void
	{
		// Surface is the only payload: report id, title and data never leave the page.
		// It goes to c_sub_section, where the module keeps the source of an event, while pN
		// carries name_value pairs (see PermissionsAnalytics).
		const data = { c_sub_section: this.#surface } as AnalyticsData;

		ApacheSupersetAnalytics.sendAnalytics(ANALYTICS_CATEGORY, event, data);
	}
}
