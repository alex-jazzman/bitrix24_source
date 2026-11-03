import { Dom, Event, Extension, Loc, Runtime, Tag, Text, Type } from 'main.core';
import { AirButtonStyle, Button, ButtonIcon, ButtonSize } from 'ui.buttons';
import { Icon, Outline } from 'ui.icon-set.api.core';
import 'ui.icon-set.outline';
import 'ui.tooltip';
import 'intranet.user.mini-profile';

const LOADER_VIDEO_SRC = '/bitrix/js/vibecodeconnector/open-app/images/bg-blackhole-B-video-min.mp4';
const LOADER_VIDEO_POSTER = '/bitrix/js/vibecodeconnector/open-app/dist/images/bg-blackhole-B-poster.webp';
const FULLSCREEN_LEFT_BOUNDARY = 65;
const ICON_EXPAND = 'ui-icon-set --expand-l';
const ICON_COLLAPSE = 'ui-icon-set --collapse-l';
const LOC_EXPAND = 'VIBECODECONNECTOR_CATALOG_OPEN_APP_EXPAND';
const LOC_COLLAPSE = 'VIBECODECONNECTOR_CATALOG_OPEN_APP_COLLAPSE';
const RESTART_COOLDOWN_MS = 500;
const LOADER_SAFETY_TIMEOUT_MS = 30000;
const LOADER_LOGO_PATH = '/bitrix/js/vibecodeconnector/open-app-loader/images/';

export type LoaderBrand = 'bitrix24' | 'alaio';

export type OpenAppViewOptions = {
	title: string,
	ownerId: number,
	ownerName: string | null,
	isMine: boolean,
	onRestart: () => void,
	loaderBrand?: LoaderBrand,
	iconColor?: string | null,
};

export type FullscreenLabel = {
	setIconClass: (iconClass: string) => void,
	setIconTitle: (iconTitle: string) => void,
};

export type FullscreenSlider = {
	getCustomLeftBoundary: () => number | null,
	setCustomLeftBoundary: (boundary: number | null) => void,
	adjustLayout: () => void,
};

export class OpenAppView
{
	#options: OpenAppViewOptions;
	#container: HTMLElement | null = null;
	#contentArea: HTMLElement | null = null;
	#identityNode: HTMLElement | null = null;
	#iconSlot: HTMLElement | null = null;
	#titleNode: HTMLElement | null = null;
	#iconNode: HTMLImageElement | null = null;
	#loader: HTMLElement | null = null;
	#currentIframe: HTMLIFrameElement | null = null;
	#safetyTimer: number | null = null;
	#layoutGeneration: number = 0;
	#mountQueue: Promise<void> = Promise.resolve();
	#lastRestartAt: number | null = null;
	#fullscreenSlider: FullscreenSlider | null = null;
	#fullscreenLabel: FullscreenLabel | null = null;
	#savedLeftBoundary: number | null = null;
	#isFullscreen: boolean = false;

	constructor(options: OpenAppViewOptions)
	{
		this.#options = options;
	}

	getContainer(): HTMLElement
	{
		this.#container ??= this.#render();

		return this.#container;
	}

	setTitle(title: string): void
	{
		if (!Type.isStringFilled(title))
		{
			return;
		}

		this.#options.title = title;
		this.#applyTitle();
	}

	setIconUrl(iconUrl: string | null): void
	{
		this.getContainer();
		if (this.#iconNode?.getAttribute('src') === iconUrl)
		{
			return;
		}

		Dom.remove(this.#iconNode);
		this.#iconNode = null;

		if (!Type.isStringFilled(iconUrl) || this.#iconSlot === null)
		{
			return;
		}

		const icon: HTMLImageElement = Tag.render`
			<img
				class="vibecode-catalog-open-app__icon"
				alt=""
				aria-hidden="true"
				data-testid="vibecode-open-app-icon"
			>
		`;
		Event.bindOnce(icon, 'load', () => {
			Dom.addClass(icon, '--loaded');
		});
		Event.bindOnce(icon, 'error', () => {
			Dom.remove(icon);
			if (this.#iconNode === icon)
			{
				this.#iconNode = null;
			}
		});
		this.#iconNode = icon;
		Dom.append(icon, this.#iconSlot);
		Dom.attr(icon, 'src', iconUrl);
	}

	setIconColor(color: string | null): void
	{
		this.#options.iconColor = color;
		this.getContainer();
		this.#applyIconColor();
	}

	setFullscreenControls(slider: FullscreenSlider, fullscreenLabel: FullscreenLabel): void
	{
		this.#fullscreenSlider = slider;
		this.#fullscreenLabel = fullscreenLabel;

		fullscreenLabel.setIconClass(ICON_EXPAND);
		fullscreenLabel.setIconTitle(Loc.getMessage(LOC_EXPAND) ?? '');
	}

	toggleFullscreen(): void
	{
		const slider = this.#fullscreenSlider;
		const fullscreenLabel = this.#fullscreenLabel;
		if (slider === null || fullscreenLabel === null)
		{
			return;
		}

		const wrapper = this.getContainer();
		if (this.#isFullscreen)
		{
			slider.setCustomLeftBoundary(this.#savedLeftBoundary);
			Dom.removeClass(wrapper, '--fullscreen');
			fullscreenLabel.setIconClass(ICON_EXPAND);
			fullscreenLabel.setIconTitle(Loc.getMessage(LOC_EXPAND) ?? '');
			this.#isFullscreen = false;
		}
		else
		{
			this.#savedLeftBoundary = slider.getCustomLeftBoundary();
			slider.setCustomLeftBoundary(FULLSCREEN_LEFT_BOUNDARY);
			Dom.addClass(wrapper, '--fullscreen');
			fullscreenLabel.setIconClass(ICON_COLLAPSE);
			fullscreenLabel.setIconTitle(Loc.getMessage(LOC_COLLAPSE) ?? '');
			this.#isFullscreen = true;
		}

		slider.adjustLayout();
	}

	mountLayout(html: string): Promise<void>
	{
		this.getContainer();
		const generation = this.#layoutGeneration;
		const mountPromise = this.#mountQueue.then(() => this.#mountLayout(html, generation));
		this.#mountQueue = mountPromise.catch(() => {});

		return mountPromise;
	}

	async #mountLayout(html: string, generation: number): Promise<void>
	{
		if (generation !== this.#layoutGeneration)
		{
			return;
		}

		this.#currentIframe = null;
		const contentArea = this.#contentArea;
		if (contentArea === null)
		{
			return;
		}

		await Runtime.html(contentArea, html);
		if (generation !== this.#layoutGeneration)
		{
			Dom.clean(contentArea);

			return;
		}

		const iframe: HTMLIFrameElement | null = contentArea.querySelector('iframe');
		if (iframe === null)
		{
			this.#hideLoader();

			return;
		}

		this.#showLoader();
		this.#currentIframe = iframe;
		Event.bind(iframe, 'load', () => this.#onIframeLoad(iframe));
	}

	showLoading(): void
	{
		this.getContainer();
		this.#layoutGeneration += 1;
		this.#currentIframe = null;
		Dom.clean(this.#contentArea);
		this.#showLoader();
	}

	showLoadError(): void
	{
		this.getContainer();
		const generation = ++this.#layoutGeneration;
		this.#currentIframe = null;
		this.#renderLoadError();
		this.#mountQueue = this.#mountQueue.then(
			() => {
				if (generation === this.#layoutGeneration)
				{
					this.#renderLoadError();
				}
			},
		);
	}

	#renderLoadError(): void
	{
		Dom.clean(this.#contentArea);
		Dom.append(
			Tag.render`
				<div class="vibecode-catalog-open-app__error" role="alert" data-testid="vibecode-open-app-error">
					${Loc.getMessage('VIBECODECONNECTOR_CATALOG_OPEN_APP_LOAD_ERROR')}
				</div>
			`,
			this.#contentArea,
		);
		this.#hideLoader();
	}

	#onIframeLoad(iframe: HTMLIFrameElement): void
	{
		if (iframe !== this.#currentIframe || this.#isBlankFrame(iframe))
		{
			return;
		}

		this.#hideLoader();
	}

	#isBlankFrame(iframe: HTMLIFrameElement): boolean
	{
		try
		{
			return iframe.contentDocument !== null
				&& iframe.contentWindow?.location.href === 'about:blank';
		}
		catch
		{
			return false;
		}
	}

	#showLoader(): void
	{
		if (this.#contentArea === null || this.#loader === null)
		{
			return;
		}

		this.#contentArea.inert = true;
		Dom.removeClass(this.#loader, '--hidden');
		this.#clearSafetyTimer();
		this.#safetyTimer = window.setTimeout(() => this.#hideLoader(), LOADER_SAFETY_TIMEOUT_MS);
	}

	#hideLoader(): void
	{
		this.#clearSafetyTimer();

		if (this.#contentArea !== null)
		{
			this.#contentArea.inert = false;
		}

		if (this.#loader !== null)
		{
			Dom.addClass(this.#loader, '--hidden');
		}
	}

	#clearSafetyTimer(): void
	{
		if (this.#safetyTimer !== null)
		{
			window.clearTimeout(this.#safetyTimer);
			this.#safetyTimer = null;
		}
	}

	#render(): HTMLElement
	{
		this.#contentArea = Tag.render`<div class="vibecode-catalog-open-app__content" data-testid="vibecode-open-app-content"></div>`;
		this.#loader = Tag.render`
			<div class="vibecode-catalog-open-app__loader" role="status" data-testid="vibecode-open-app-loader">
				<video
					class="vibecode-catalog-open-app__loader-video"
					poster="${LOADER_VIDEO_POSTER}"
					autoplay
					muted
					loop
					playsinline
					aria-hidden="true"
				>
					<source
						src="${LOADER_VIDEO_SRC}"
						type="video/mp4"
						media="(prefers-reduced-motion: no-preference)"
					>
				</video>
				<div class="vibecode-catalog-open-app__loader-softener" aria-hidden="true"></div>
				${this.#renderLoaderBrand()}
				<span class="vibecode-catalog-open-app__visually-hidden">${Loc.getMessage('VIBECODECONNECTOR_CATALOG_OPEN_APP_LOADER')}</span>
			</div>
		`;
		this.#showLoader();

		return Tag.render`
			<div class="vibecode-catalog-open-app" data-testid="vibecode-open-app-wrapper">
				${this.#renderHeader()}
				<div class="vibecode-catalog-open-app__body">
					${this.#contentArea}
					${this.#loader}
				</div>
			</div>
		`;
	}

	#renderLoaderBrand(): HTMLElement
	{
		const isAlaio = this.#options.loaderBrand === 'alaio';
		const modifier = isAlaio ? ' --alaio' : '';
		const logoFile = isAlaio ? 'logo-alaio.svg' : 'logo.svg';

		return Tag.render`
			<div class="vibecode-catalog-open-app__loader-brand${modifier}" aria-hidden="true">
				<img
					class="vibecode-catalog-open-app__loader-brand-logo"
					src="${LOADER_LOGO_PATH}${logoFile}"
					alt=""
					data-testid="vibecode-open-app-brand-logo"
				>
				<span
					class="vibecode-catalog-open-app__loader-brand-shine"
					data-testid="vibecode-open-app-brand-shine"
				></span>
			</div>
		`;
	}

	#renderHeader(): HTMLElement
	{
		this.#titleNode = Tag.render`
			<h3 class="vibecode-catalog-open-app__title ui-headline --lg" data-testid="vibecode-open-app-title"></h3>
		`;
		this.#applyTitle();

		this.#iconSlot = Tag.render`
			<span class="vibecode-catalog-open-app__icon-slot" aria-hidden="true">
				${new Icon({ icon: Outline.APPS, size: 24, color: 'var(--ui-color-base-white-fixed)' }).render()}
			</span>
		`;
		this.#applyIconColor();
		this.#identityNode = Tag.render`
			<div class="vibecode-catalog-open-app__identity">
				${this.#iconSlot}
				<div class="vibecode-catalog-open-app__identity-text">
					${this.#titleNode}
					${this.#renderAuthor()}
				</div>
			</div>
		`;

		return Tag.render`
			<div class="vibecode-catalog-open-app__header">
				${this.#identityNode}
				${this.#renderRestartButton()}
			</div>
		`;
	}

	#renderRestartButton(): HTMLElement
	{
		return new Button({
			className: 'vibecode-catalog-open-app__restart-button',
			text: Loc.getMessage('VIBECODECONNECTOR_CATALOG_OPEN_APP_RESTART') ?? '',
			size: ButtonSize.MEDIUM,
			style: AirButtonStyle.TINTED,
			collapsedIcon: '' as ButtonIcon,
			useAirDesign: true,
			props: { type: 'button' },
			dataset: { testid: 'vibecode-open-app-restart' },
			onclick: () => {
				this.#restart();

				return {};
			},
		}).render();
	}

	#applyIconColor(): void
	{
		if (this.#iconSlot === null)
		{
			return;
		}

		const color = this.#options.iconColor;
		Dom.style(
			this.#iconSlot,
			'--vibecode-catalog-open-app-icon-background',
			Type.isString(color) && /^#[\dA-Fa-f]{6}$/.test(color) ? color : '',
		);
	}

	#restart(): void
	{
		const now = Date.now();
		if (this.#lastRestartAt !== null && now - this.#lastRestartAt < RESTART_COOLDOWN_MS)
		{
			return;
		}

		this.#lastRestartAt = now;
		this.showLoading();
		this.#options.onRestart();
	}

	#applyTitle(): void
	{
		if (this.#titleNode === null)
		{
			return;
		}

		const title = Type.isStringFilled(this.#options.title) ? this.#options.title : null;

		this.#titleNode.textContent = title ?? '';
		this.#titleNode.hidden = title === null;
		Dom.attr(this.#titleNode, 'title', title);
	}

	#getProfilePathTemplate(): string
	{
		const template = Extension.getSettings('vibecodeconnector.open-app').get('userProfilePathTemplate');

		return Type.isStringFilled(template) ? template : '/company/personal/user/#user_id#/';
	}

	#renderAuthor(): HTMLElement | string
	{
		if (this.#options.isMine === true || !Type.isStringFilled(this.#options.ownerName))
		{
			return '';
		}

		const ownerId = Text.toInteger(this.#options.ownerId);
		const profileUrl = this.#getProfilePathTemplate().replace('#user_id#', String(ownerId));
		const authorLabel = Loc.getMessage(
			'VIBECODECONNECTOR_CATALOG_OPEN_APP_AUTHOR',
			{ '#NAME#': this.#options.ownerName },
		) ?? '';

		return Tag.render`
			<a
				class="vibecode-catalog-open-app__author ui-text --lg"
				href="${profileUrl}"
				aria-label="${Text.encode(authorLabel)}"
				bx-tooltip-user-id="${ownerId}"
				bx-tooltip-context="b24"
				bx-tooltip-mini-profile-direction="viewport"
				data-testid="vibecode-open-app-author"
			>${Text.encode(this.#options.ownerName)}</a>
		`;
	}
}
