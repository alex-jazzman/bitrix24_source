/* eslint-disable */
declare namespace BX.Call.Adapter {
	const Utils: {
		text: {
			getFirstLetters: (text: any) => string;
			purify: (text: any, params: any, files?: {}, localize?: null) => any;
		};
		browser: {
			isIe: () => boolean;
			isSafariBased: () => boolean;
			openLink: (link: any, target?: string) => void;
		};
		device: {
			isMobile: () => boolean;
		};
		platform: {
			isBitrixDesktop: () => boolean;
			getDesktopVersion: () => number;
			isWindows: () => boolean;
			isDesktopFeatureEnabled: (code: string) => boolean;
		};
		key: {
			isAltOrOption: (event: PointerEvent | KeyboardEvent) => boolean;
		};
	};
}
