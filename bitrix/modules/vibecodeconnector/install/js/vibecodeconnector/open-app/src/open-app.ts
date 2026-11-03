import { ajax, Dom, Extension, Loc, Page, Type, type AjaxResponse } from 'main.core';
import { Label, type Slider, type SliderEvent, type SliderManager } from 'main.sidepanel';

import { OpenAppView, type LoaderBrand } from './open-app-view';
import './style.css';

const SLIDER_ID_PREFIX = 'vibecodeconnector-open-app-';
const APP_PAGE_PATH_PREFIX = '/vibecode/app/';
const ERROR_EXTERNAL_ID_MISSING = 'EXTERNAL_ID_MISSING';
const LAUNCH_ACTION = 'vibecodeconnector.Catalog.launch';
const LAUNCH_KIND_APP = 'app';
const LOADER_BRAND_ALAIO = 'alaio';

export type OpenAppTarget = {
	id: number,
	title: string,
	viewUrl: string | null,
	externalId: string | null,
	canOpenInIframe: boolean,
	ownerId: number,
	ownerName: string | null,
	isMine: boolean,
	iconUrl?: string | null,
	color?: string | null,
};

export type OpenAppLayout = {
	html: string,
	title: string,
	errorCode: string,
	iconUrl: string | null,
	color: string | null,
};

export type OpenAppPresentation = {
	title?: string,
	ownerId?: number,
	ownerName?: string | null,
	isMine?: boolean,
	iconUrl?: string | null,
	color?: string | null,
};

export type OpenUrl = (url: string | null) => void;

type LaunchResponse = {
	kind?: unknown,
	title?: unknown,
	viewUrl?: unknown,
	externalId?: unknown,
	ownerId?: unknown,
	ownerName?: unknown,
	isMine?: unknown,
};

type LayoutResponse = {
	html?: unknown,
	title?: unknown,
	errorCode?: unknown,
	iconUrl?: unknown,
	color?: unknown,
};

export function openUrl(url: string | null): void
{
	if (!Type.isStringFilled(url))
	{
		return;
	}

	window.open(url, '_blank', 'noopener,noreferrer');
}

export function hasCatalogAppOpenTarget(
	itemId: number,
	viewUrl: string | null,
	canOpenInIframe: boolean = true,
	externalId: string | null = null,
): boolean
{
	if (!isCatalogItemIdValid(itemId))
	{
		return false;
	}

	if (canOpenAppInIframe(itemId, canOpenInIframe, externalId))
	{
		return true;
	}

	return Type.isStringFilled(viewUrl);
}

export function openCatalogApp(target: OpenAppTarget, openFallback: OpenUrl = openUrl): boolean
{
	const appPageUrl = buildAppPageUrl(target.id);
	if (appPageUrl === null)
	{
		return false;
	}

	if (!canOpenAppInIframe(target.id, target.canOpenInIframe, target.externalId))
	{
		if (Type.isStringFilled(target.viewUrl))
		{
			openFallback(appPageUrl);
		}

		return false;
	}

	return openAppSlider(target.id, {
		title: target.title,
		ownerId: target.ownerId,
		ownerName: target.ownerName,
		isMine: target.isMine,
		iconUrl: target.iconUrl,
		color: target.color,
	});
}

/**
 * Opens the app slider by catalog item id, taking the presentation of the card
 * from the caller. The layout carries the authoritative title and, when the app
 * has no external id yet, sends the viewer to the app page instead.
 */
export function openAppSlider(itemId: number, presentation: OpenAppPresentation = {}): boolean
{
	const appPageUrl = buildAppPageUrl(itemId);
	if (appPageUrl === null)
	{
		return false;
	}

	const title = resolveInitialTitle(presentation.title);

	const sliderId = `${SLIDER_ID_PREFIX}${itemId}`;
	const sidePanel = getSidePanel();
	if (sidePanel.Instance.getSlider(sliderId) !== null)
	{
		// the slider is already open (for example, a double click on the item):
		// a second layout request would be orphaned, the core keeps the open instance
		return true;
	}

	let slider: Slider | null = null;
	let layoutPromise: Promise<OpenAppLayout> | null = null;
	let latestRequestId = 0;
	let layoutRequestId = 0;
	let sliderClosed = false;
	let view: OpenAppView | null = null;

	const isRequestCurrent = (requestId: number): boolean => {
		return requestId === latestRequestId && !sliderClosed;
	};

	const applyLayout = (promise: Promise<OpenAppLayout>, requestId: number): void => {
		promise
			.then(async (layout: OpenAppLayout) => {
				if (!isRequestCurrent(requestId) || view === null)
				{
					return;
				}

				if (layout.errorCode === ERROR_EXTERNAL_ID_MISSING)
				{
					openAppPage(slider, appPageUrl);

					return;
				}

				applyAppTitle(slider, view, layout.title);
				view.setIconColor(layout.color);
				view.setIconUrl(layout.iconUrl);

				await view.mountLayout(layout.html);
			})
			.catch(() => {
				if (isRequestCurrent(requestId) && view !== null)
				{
					view.showLoadError();
				}
			});
	};

	const requestAndMountLayout = (): void => {
		layoutRequestId = ++latestRequestId;
		layoutPromise = loadOpenAppLayout(itemId);
		layoutPromise.catch(() => {});
		if (slider !== null)
		{
			applyLayout(layoutPromise, layoutRequestId);
		}
	};

	view = new OpenAppView({
		title,
		ownerId: presentation.ownerId ?? 0,
		ownerName: presentation.ownerName ?? null,
		isMine: presentation.isMine === true,
		onRestart: requestAndMountLayout,
		loaderBrand: getLoaderBrand(),
		iconColor: presentation.color,
	});
	view.setIconUrl(presentation.iconUrl ?? null);
	requestAndMountLayout();
	let fullscreenLabel: Label | null = null;

	sidePanel.Instance.open(sliderId, {
		// the slider container is a role="dialog": the title becomes its accessible name
		title: title || undefined,
		cacheable: false,
		allowChangeHistory: false,
		copyLinkLabel: true,
		newWindowUrl: appPageUrl,
		contentCallback: () => view.getContainer(),
		events: {
			onCloseStart: () => {
				sliderClosed = true;
				latestRequestId += 1;
			},
			// the layout is mounted after the slider appends the container to the document:
			// the inline script submits the POST form into the iframe, and a detached iframe
			// has no browsing context to receive it
			onLoad: (event: SliderEvent) => {
				slider = event.getSlider();
				if (layoutPromise !== null)
				{
					applyLayout(layoutPromise, layoutRequestId);
				}
			},
			onOpenComplete: (event: SliderEvent) => {
				const openedSlider = event.getSlider();
				if (openedSlider !== null && view !== null)
				{
					fullscreenLabel ??= addFullscreenLabel(openedSlider, view);
				}
			},
		},
	});

	return true;
}

/**
 * Opens a catalog item known only by its id: the launch action resolves what the
 * card actually is, and anything that is not an app falls back to the app page.
 */
export function openCatalogAppById(catalogItemId: number, openFallback: OpenUrl = openUrl): Promise<boolean>
{
	const appPageUrl = buildAppPageUrl(catalogItemId);
	if (appPageUrl === null)
	{
		return Promise.resolve(false);
	}

	return ajax.runAction(LAUNCH_ACTION, { data: { catalogItemId } })
		.then((response: AjaxResponse<LaunchResponse>) => {
			const data = response?.data ?? {};
			if (data.kind !== LAUNCH_KIND_APP)
			{
				openFallback(appPageUrl);

				return false;
			}

			const target: OpenAppTarget = {
				id: catalogItemId,
				title: Type.isString(data.title) ? data.title : '',
				viewUrl: Type.isString(data.viewUrl) ? data.viewUrl : null,
				externalId: Type.isString(data.externalId) ? data.externalId : null,
				canOpenInIframe: true,
				ownerId: Type.isNumber(data.ownerId) ? data.ownerId : 0,
				ownerName: Type.isString(data.ownerName) ? data.ownerName : null,
				isMine: data.isMine === true,
			};

			const opened = openCatalogApp(target, openFallback);
			if (!opened && !Type.isStringFilled(target.viewUrl))
			{
				openFallback(appPageUrl);
			}

			return opened;
		})
		.catch(() => {
			openFallback(appPageUrl);

			return false;
		});
}

function resolveInitialTitle(title: string | null | void): string
{
	if (Type.isStringFilled(title))
	{
		return title;
	}

	const defaultTitle = Loc.getMessage('VIBECODECONNECTOR_CATALOG_OPEN_APP_DEFAULT_TITLE');

	return Type.isStringFilled(defaultTitle) ? defaultTitle : '';
}

function applyAppTitle(slider: Slider | null, view: OpenAppView, title: string | null): void
{
	if (!Type.isStringFilled(title))
	{
		return;
	}

	view.setTitle(title);

	if (slider)
	{
		slider.setTitle(title);
		Dom.attr(slider.getContainer(), 'aria-label', title);
	}
}

function openAppPage(slider: Slider | null, appPageUrl: string): void
{
	slider?.close();
	Page.redirect(appPageUrl);
}

function addFullscreenLabel(slider: Slider, view: OpenAppView): Label
{
	const fullscreenLabel = new Label(slider, {
		className: '--ui-hoverable',
		onclick: () => view.toggleFullscreen(),
	});
	Dom.attr(fullscreenLabel.getContainer(), 'data-testid', 'vibecode-open-app-fullscreen-toggle');

	view.setFullscreenControls(slider, fullscreenLabel);
	Dom.append(fullscreenLabel.getContainer(), slider.getExtraLabelsContainer());

	return fullscreenLabel;
}

function getSidePanel(): { Instance: SliderManager }
{
	return (BX as typeof BX & { SidePanel: { Instance: SliderManager } }).SidePanel;
}

function canOpenAppInIframe(itemId: number, canOpenInIframe: boolean, externalId: string | null): boolean
{
	return isOpenAppInIframeEnabled()
		&& canOpenInIframe
		&& isCatalogItemIdValid(itemId)
		&& Type.isStringFilled(externalId);
}

function isCatalogItemIdValid(itemId: number): boolean
{
	return Type.isNumber(itemId) && itemId > 0;
}

export function buildAppPageUrl(itemId: number): string | null
{
	if (!isCatalogItemIdValid(itemId))
	{
		return null;
	}

	return `${APP_PAGE_PATH_PREFIX}${encodeURIComponent(itemId)}/`;
}

function isOpenAppInIframeEnabled(): boolean
{
	return Extension.getSettings('vibecodeconnector.open-app').get('openAppInIframe', false) === true;
}

function getLoaderBrand(): LoaderBrand
{
	return Extension.getSettings('vibecodeconnector.open-app').get('loaderBrand') === LOADER_BRAND_ALAIO
		? LOADER_BRAND_ALAIO
		: 'bitrix24';
}

function loadOpenAppLayout(catalogItemId: number): Promise<OpenAppLayout>
{
	return ajax.runAction('vibecodeconnector.Catalog.openAppLayout', { data: { catalogItemId } })
		.then((response: AjaxResponse<LayoutResponse>) => {
			const html = response?.data?.html;
			const title = response?.data?.title;
			const errorCode = response?.data?.errorCode;
			const iconUrl = response?.data?.iconUrl;
			const color = response?.data?.color;

			return {
				html: Type.isString(html) ? html : '',
				title: Type.isString(title) ? title : '',
				errorCode: Type.isString(errorCode) ? errorCode : '',
				iconUrl: Type.isStringFilled(iconUrl) ? iconUrl : null,
				color: Type.isStringFilled(color) ? color : null,
			};
		});
}
