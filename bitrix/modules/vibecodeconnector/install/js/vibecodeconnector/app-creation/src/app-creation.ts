import { Event, Extension, Loc, Type } from 'main.core';
import { sendData } from 'ui.analytics';
import { Center as NotificationCenter } from 'ui.notification';
import { openUrl } from 'vibecodeconnector.open-app';
import { openVibecodeCreate } from 'vibecodeconnector.embed-create';

export type AppCreationMode = 'create' | 'fallback';

export type AppCreationAnalytics = {
	tool: string,
	category: string,
	[key: string]: string,
};

export type AppCreationOptions = {
	analytics?: AppCreationAnalytics,
	onOpen?: (mode: AppCreationMode) => void,
	onClose?: () => void,
};

type Settings = {
	available: boolean,
	createInIframe: boolean,
	vibecodeUrl: string,
	fallbackUrl: string,
};

const CREATE_HUB_VIEW = 'create';

const ANALYTICS_EVENT: { [key in AppCreationMode]: string } = {
	create: 'click_create',
	fallback: 'click_vibecode',
};

const boundNodes: WeakMap<Element, () => void> = new WeakMap();

function getSettings(): Settings
{
	const settings = Extension.getSettings('vibecodeconnector.app-creation');

	return {
		available: settings.get('available', false) === true,
		createInIframe: settings.get('createInIframe', false) === true,
		vibecodeUrl: settings.get('vibecodeUrl', ''),
		fallbackUrl: settings.get('fallbackUrl', ''),
	};
}

function sendAnalytics(mode: AppCreationMode, options: AppCreationOptions): void
{
	const analytics = options.analytics;
	if (!Type.isPlainObject(analytics))
	{
		return;
	}

	sendData({ ...analytics, event: analytics.event ?? ANALYTICS_EVENT[mode] });

}

export function isAppCreationAvailable(): boolean
{
	return getSettings().available;
}

export function openAppCreation(options: AppCreationOptions = {}): void
{
	const settings = getSettings();
	if (!settings.available)
	{
		return;
	}

	if (!settings.createInIframe)
	{
		sendAnalytics('fallback', options);
		options.onOpen?.('fallback');
		openUrl(settings.fallbackUrl);

		return;
	}

	sendAnalytics('create', options);
	options.onOpen?.('create');

	const opened = openVibecodeCreate(CREATE_HUB_VIEW, {
		vibecodeUrl: settings.vibecodeUrl,
		onClose: () => options.onClose?.(),
	});

	if (!opened)
	{
		fallBack(settings.fallbackUrl);
	}
}

function fallBack(fallbackUrl: string): void
{
	NotificationCenter.notify({
		content: Loc.getMessage('VIBECODECONNECTOR_APP_CREATION_UNAVAILABLE') ?? '',
	});

	openUrl(fallbackUrl);
}

export function bindAppCreation(node: Element, options: AppCreationOptions = {}): (() => void) | null
{
	if (!Type.isElementNode(node) || !isAppCreationAvailable())
	{
		return null;
	}

	const bound = boundNodes.get(node);
	if (bound)
	{
		return bound;
	}

	let pending = false;

	const handler = (event: MouseEvent) => {
		event.preventDefault();

		if (pending)
		{
			return;
		}

		pending = true;
		try
		{
			openAppCreation(options);
		}
		finally
		{
			pending = false;
		}
	};

	Event.bind(node, 'click', handler);

	const unbind = () => {
		Event.unbind(node, 'click', handler);
		boundNodes.delete(node);
	};

	boundNodes.set(node, unbind);

	return unbind;
}
