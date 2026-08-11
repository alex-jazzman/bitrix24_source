import { Utils as ImV1Utils } from 'im.lib.utils';
import { Utils as ImV2Utils } from 'im.v2.lib.utils';

const createAdapterProxy = <T extends object>(name: string, methods: T): T => {
	return new Proxy(methods, {
		get(target, property)
		{
			if (Reflect.has(target, property))
			{
				return Reflect.get(target, property);
			}

			throw new Error(`${name}: property "${String(property)}" is not defined in the adapter. Register it explicitly.`);
		},
	});
};

const textMethods = {
	getFirstLetters: ImV2Utils.text.getFirstLetters,
	purify: ImV1Utils.text.purify,
};

const browserMethods = {
	isIe: ImV2Utils.browser.isIe,
	isSafariBased: ImV2Utils.browser.isSafariBased,
	openLink: ImV2Utils.browser.openLink,
};

const deviceMethods = {
	isMobile: ImV2Utils.device.isMobile,
};

const platformMethods = {
	isBitrixDesktop: ImV2Utils.platform.isBitrixDesktop,
	getDesktopVersion: ImV2Utils.platform.getDesktopVersion,
	isWindows: ImV2Utils.platform.isWindows,
	isDesktopFeatureEnabled: ImV2Utils.platform.isDesktopFeatureEnabled,
};

const keyMethods = {
	isAltOrOption: ImV2Utils.key.isAltOrOption,
};

const utilsMethods = {
	text: createAdapterProxy('Utils.text', textMethods),
	browser: createAdapterProxy('Utils.browser', browserMethods),
	device: createAdapterProxy('Utils.device', deviceMethods),
	platform: createAdapterProxy('Utils.platform', platformMethods),
	key: createAdapterProxy('Utils.key', keyMethods),
};

export const Utils = createAdapterProxy('Utils', utilsMethods);
