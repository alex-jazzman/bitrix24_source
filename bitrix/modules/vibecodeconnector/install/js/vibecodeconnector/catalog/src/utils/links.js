import { ajax, Dom, Extension, Type } from 'main.core';
import { Label, type Slider } from 'main.sidepanel';

import { OpenAppView } from '../open-app/open-app-view';

export const VIBECODE_URL = Extension.getSettings('vibecodeconnector.catalog')
	.get('vibecodeUrl', 'https://vibecode.bitrix24.tech');
export const VIBECODE_DASHBOARD_URL = `${VIBECODE_URL}/dashboard`;
const SLIDER_ID_PREFIX = 'vibecodeconnector-open-app-';
const OPEN_APP_PAGE_URL = '/bitrix/services/main/ajax.php?action=vibecodeconnector.Catalog.openAppPage';

export type OpenAppTarget = {
	id: number,
	title: string,
	viewUrl: string | null,
	externalId: string | null,
	canOpenInIframe: boolean,
	ownerId: number,
	ownerName: string | null,
	isMine: boolean,
};

export function openUrl(url: ?string): void
{
	if (!Type.isStringFilled(url))
	{
		return;
	}

	window.open(url, '_blank', 'noopener,noreferrer');
}

export function openVibecodeDashboard(): void
{
	openUrl(VIBECODE_DASHBOARD_URL);
}

export function openVibecodeUrl(): void
{
	openUrl(VIBECODE_URL);
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

export function openCatalogApp(target: OpenAppTarget): boolean
{
	const openAppPageUrl = buildOpenAppPageUrl(target.id);
	if (openAppPageUrl === null)
	{
		return false;
	}

	if (!canOpenAppInIframe(target.id, target.canOpenInIframe, target.externalId))
	{
		if (Type.isStringFilled(target.viewUrl))
		{
			openUrl(openAppPageUrl);
		}

		return false;
	}

	const sliderId = `${SLIDER_ID_PREFIX}${target.id}`;
	if (BX.SidePanel.Instance.getSlider(sliderId) !== null)
	{
		// the slider is already open (for example, a double click on the item):
		// a second layout request would be orphaned, the core keeps the open instance
		return true;
	}

	const view = new OpenAppView({
		title: target.title,
		ownerId: target.ownerId,
		ownerName: target.ownerName,
		isMine: target.isMine,
	});

	const layoutPromise = loadOpenAppLayout(target.id);
	// the real handlers are attached in onLoad; the no-op catch keeps a fast
	// ajax failure before onLoad from surfacing as an unhandled rejection
	layoutPromise.catch(() => {});
	let fullscreenLabel = null;

	BX.SidePanel.Instance.open(sliderId, {
		// the slider container is a role="dialog": the title becomes its accessible name
		title: target.title,
		cacheable: false,
		allowChangeHistory: false,
		copyLinkLabel: true,
		newWindowUrl: openAppPageUrl,
		contentCallback: () => view.getContainer(),
		events: {
			// the layout is mounted after the slider appends the container to the document:
			// the inline script submits the POST form into the iframe, and a detached iframe
			// has no browsing context to receive it
			onLoad: () => {
				layoutPromise
					.then(({ html }) => view.mountLayout(html))
					.catch(() => view.showLoadError());
			},
			onOpenComplete: (event) => {
				fullscreenLabel ??= addFullscreenLabel(event.getSlider(), view);
			},
		},
	});

	return true;
}

function addFullscreenLabel(slider: Slider, view: OpenAppView): Label
{
	const fullscreenLabel = new Label(slider, {
		className: '--ui-hoverable',
		onclick: () => view.toggleFullscreen(),
	});

	view.setFullscreenControls(slider, fullscreenLabel);
	Dom.append(fullscreenLabel.getContainer(), slider.getExtraLabelsContainer());

	return fullscreenLabel;
}

function canOpenAppInIframe(
	itemId: number,
	canOpenInIframe: boolean,
	externalId: string | null,
): boolean
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

function buildOpenAppPageUrl(itemId: number): ?string
{
	if (!isCatalogItemIdValid(itemId))
	{
		return null;
	}

	return `${OPEN_APP_PAGE_URL}&catalogItemId=${encodeURIComponent(itemId)}`;
}

function isOpenAppInIframeEnabled(): boolean
{
	return Extension.getSettings('vibecodeconnector.catalog').get('openAppInIframe', false) === true;
}

function loadOpenAppLayout(catalogItemId: number): Promise<{ html: string }>
{
	return ajax.runAction('vibecodeconnector.Catalog.openAppLayout', { data: { catalogItemId } })
		.then((response) => {
			const html = response?.data?.html;

			return { html: Type.isString(html) ? html : '' };
		});
}
