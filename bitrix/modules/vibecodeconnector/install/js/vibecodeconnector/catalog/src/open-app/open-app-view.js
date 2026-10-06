import { Dom, Event, Extension, Loc, Runtime, Tag, Text, Type } from 'main.core';
import 'ui.icon-set.outline';
import 'ui.tooltip';
import 'intranet.user.mini-profile';

const SAFETY_TIMEOUT_MS = 30000;
const LOADER_VIDEO_SRC = '/bitrix/js/vibecodeconnector/catalog/images/bg-blackhole-B-video-min.mp4';
// the same runtime url as the loader background in style.css: chef copies
// the poster referenced from css into dist/images, so the browser loads it once
const LOADER_VIDEO_POSTER = '/bitrix/js/vibecodeconnector/catalog/dist/images/bg-blackhole-B-poster.webp';
const FULLSCREEN_LEFT_BOUNDARY = 65; // the core slider zone reserved for the labels
const ICON_EXPAND = 'ui-icon-set --expand-l';
const ICON_COLLAPSE = 'ui-icon-set --collapse-l';
const LOC_EXPAND = 'VIBECODECONNECTOR_CATALOG_OPEN_APP_EXPAND';
const LOC_COLLAPSE = 'VIBECODECONNECTOR_CATALOG_OPEN_APP_COLLAPSE';

export type OpenAppViewOptions = {
	title: string,
	ownerId: number,
	ownerName: string | null,
	isMine: boolean,
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
	#loader: HTMLElement | null = null;
	#safetyTimer: number | null = null;
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

	setFullscreenControls(slider: FullscreenSlider, fullscreenLabel: FullscreenLabel): void
	{
		this.#fullscreenSlider = slider;
		this.#fullscreenLabel = fullscreenLabel;

		fullscreenLabel.setIconClass(ICON_EXPAND);
		fullscreenLabel.setIconTitle(Loc.getMessage(LOC_EXPAND));
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
			fullscreenLabel.setIconTitle(Loc.getMessage(LOC_EXPAND));
			this.#isFullscreen = false;
		}
		else
		{
			this.#savedLeftBoundary = slider.getCustomLeftBoundary();
			slider.setCustomLeftBoundary(FULLSCREEN_LEFT_BOUNDARY);
			Dom.addClass(wrapper, '--fullscreen');
			fullscreenLabel.setIconClass(ICON_COLLAPSE);
			fullscreenLabel.setIconTitle(Loc.getMessage(LOC_COLLAPSE));
			this.#isFullscreen = true;
		}

		slider.adjustLayout();
	}

	async mountLayout(html: string): Promise<void>
	{
		this.getContainer();

		await Runtime.html(this.#contentArea, html);

		const iframe: HTMLIFrameElement | null = this.#contentArea.querySelector('iframe');
		if (iframe === null)
		{
			this.#hideLoader();

			return;
		}

		this.#showLoader();
		Event.bind(iframe, 'load', () => this.#onIframeLoad(iframe));
		this.#restartSafetyTimer();
	}

	showLoadError(): void
	{
		this.getContainer();

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
		if (this.#isBlankFrame(iframe))
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
				&& iframe.contentWindow.location.href === 'about:blank';
		}
		catch
		{
			return false;
		}
	}

	#showLoader(): void
	{
		// the loader overlay covers the content visually; inert also removes
		// the covered iframe from the tab order and the accessibility tree
		this.#contentArea.inert = true;
		Dom.removeClass(this.#loader, '--hidden');
	}

	#hideLoader(): void
	{
		if (this.#safetyTimer !== null)
		{
			window.clearTimeout(this.#safetyTimer);
			this.#safetyTimer = null;
		}

		this.#contentArea.inert = false;
		Dom.addClass(this.#loader, '--hidden');
	}

	#restartSafetyTimer(): void
	{
		if (this.#safetyTimer !== null)
		{
			window.clearTimeout(this.#safetyTimer);
		}

		this.#safetyTimer = window.setTimeout(() => this.#hideLoader(), SAFETY_TIMEOUT_MS);
	}

	#render(): HTMLElement
	{
		this.#contentArea = Tag.render`<div class="vibecode-catalog-open-app__content" data-testid="vibecode-open-app-content"></div>`;
		// the loader is visible from the first paint: it covers both the layout request
		// and the app loading inside the iframe; the visually hidden text makes
		// the live region actually announce the loading state
		this.#loader = Tag.render`
			<div class="vibecode-catalog-open-app__loader" role="status" data-testid="vibecode-open-app-loader">
				<video
					class="vibecode-catalog-open-app__loader-video"
					src="${LOADER_VIDEO_SRC}"
					poster="${LOADER_VIDEO_POSTER}"
					autoplay
					muted
					loop
					playsinline
					aria-hidden="true"
				></video>
				<span class="vibecode-catalog-open-app__visually-hidden">${Loc.getMessage('VIBECODECONNECTOR_CATALOG_OPEN_APP_LOADER')}</span>
			</div>
		`;
		this.#showLoader();
		this.#restartSafetyTimer();

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

	#renderHeader(): HTMLElement
	{
		const encodedTitle = Text.encode(this.#options.title);

		return Tag.render`
			<div class="vibecode-catalog-open-app__header">
				<h3 class="vibecode-catalog-open-app__title ui-headline --lg" title="${encodedTitle}" data-testid="vibecode-open-app-title">${encodedTitle}</h3>
				${this.#renderAuthor()}
			</div>
		`;
	}

	#getProfilePathTemplate(): string
	{
		const template = Extension.getSettings('vibecodeconnector.catalog').get('userProfilePathTemplate');

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
		);

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
