/* eslint-disable */
declare namespace BX.Call.Adapter {
	const DesktopApi: {
		isDesktop: () => boolean;
		prepareResourcePath: (source: string) => string;
		isBlur: (source: any) => any;
		getLimitationBackground: (source: any) => {
			enable: boolean;
		} | {
			enable: any;
			articleCode: any;
		};
		handleLimitationBackground: (limitationObj: any, handle: any) => void;
		openArticle: (articleCode: any) => void;
		isFeatureSupportedInVersion: (version: number, code: $Keys<{
			mask: {
				id: string;
				version: number;
			};
			restart: {
				id: string;
				version: number;
			};
			accountManagement: {
				id: string;
				version: number;
			};
			openNewTab: {
				id: string;
				version: number;
			};
			openPage: {
				id: string;
				version: number;
			};
			portalTabActivation: {
				id: string;
				version: number;
			};
		}>) => boolean;
		subscribe: (eventName: string, handler: Function) => void;
		unsubscribe: (eventName: string, handler: Function) => void;
		emit: (eventName: string, params?: any[]) => void;
		emitToMainWindow: (eventName: string, params?: any[]) => void;
		isChatWindow: () => boolean;
		activateWindow: (target?: Window & typeof globalThis) => void;
		changeTab: (tabId: string) => void;
		closeWindow: (target?: Window & typeof globalThis) => void;
		findWindow: (name?: string) => Window | null;
		showBrowserWindow: () => Promise<void>;
		hideLoader: () => void;
		createWindow: (name: string, callback: Function) => void;
		createTopmostWindow: (htmlContent: string) => boolean;
		setWindowPosition: (rawParams: {
			x?: number;
			y?: number;
			width?: number;
			height?: number;
		}) => void;
		prepareHtml: (html: string | HTMLElement, js: string | HTMLElement) => string;
		getApiVersion: () => number;
		isFeatureSupported: (code: $Keys<{
			mask: {
				id: string;
				version: number;
			};
			restart: {
				id: string;
				version: number;
			};
			accountManagement: {
				id: string;
				version: number;
			};
			openNewTab: {
				id: string;
				version: number;
			};
			openPage: {
				id: string;
				version: number;
			};
			portalTabActivation: {
				id: string;
				version: number;
			};
		}>) => boolean;
		isFeatureEnabled: (code: string) => boolean;
		handlePortalTabActivation: () => Promise<any>;
		shouldActivateTabWithChatPage: () => boolean;
		setTabWithChatPageActive: () => Promise<void>;
		getBackgroundImage: () => Object;
		setCallBackground: (id: any, source: any) => any;
		getCallMask: () => {
			id: any;
		};
		setCallMask: (id: any, maskUrl: any, backgroundUrl: any) => boolean;
		setCallMaskLoadHandlers: (callback: function) => void;
		getCameraSmoothingStatus: () => boolean;
		setCameraSmoothingStatus: (status: boolean) => void;
		writeToLogFile: (filename: string, text: any) => void;
	};

	const DesktopFeature: {
		mask: {
			id: string;
			version: number;
		};
		restart: {
			id: string;
			version: number;
		};
		accountManagement: {
			id: string;
			version: number;
		};
		openNewTab: {
			id: string;
			version: number;
		};
		openPage: {
			id: string;
			version: number;
		};
		portalTabActivation: {
			id: string;
			version: number;
		};
	};
}
