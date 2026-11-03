import { Extension, Type } from 'main.core';
import { Messenger } from 'im.public';
import { openUrl, openAppSlider, type OpenAppPresentation } from 'vibecodeconnector.open-app';

export {
	buildAppPageUrl,
	hasCatalogAppOpenTarget,
	openCatalogApp,
} from 'vibecodeconnector.open-app';
export type { OpenAppTarget, OpenAppPresentation, OpenUrl } from 'vibecodeconnector.open-app';
export { openUrl };

/**
 * The catalog contract of "open the app of this card": synchronous, so that a
 * caller which has to decide between the slider and a plain navigation (the
 * side panel binder of the app page) can branch on the answer.
 */
export function openCatalogAppById(itemId: number, presentation: OpenAppPresentation = {}): boolean
{
	return openAppSlider(itemId, presentation);
}

export const VIBECODE_URL = Extension.getSettings('vibecodeconnector.catalog')
	.get('vibecodeUrl', 'https://vibecode.bitrix24.tech');
const dashboardUrl = Extension.getSettings('vibecodeconnector.catalog').get('dashboardUrl', null);
export const VIBECODE_DASHBOARD_URL = Type.isStringFilled(dashboardUrl)
	? dashboardUrl
	: `${VIBECODE_URL}/dashboard`;

export function openVibecodeDashboard(): void
{
	openUrl(VIBECODE_DASHBOARD_URL);
}

export function openVibecodeUrl(): void
{
	openUrl(VIBECODE_URL);
}

export function openCatalogChat(appChatId: ?number): Promise<boolean>
{
	if (!Type.isNumber(appChatId) || appChatId <= 0)
	{
		return Promise.resolve(false);
	}

	return Messenger.openChat(`chat${appChatId}`).then(() => true, () => false);
}

export function isEmbedCreateEnabled(): boolean
{
	return Extension.getSettings('vibecodeconnector.catalog').get('createInIframe', false) === true;
}
