/* eslint-disable */
/**
 * Desktop topmost window reference.
 * Returned by createTopmostWindow() in the desktop environment.
 * Type annotation in im module says `boolean`, but the runtime
 * returns a window proxy object when running inside BXDesktop.
 */
interface DesktopWindow {
	BXDesktopWindow: {
		ExecuteCommand: (command: string) => void;
		SetProperty?: (name: string, value: Record<string, unknown>) => void;
	};
}

interface DesktopApiInterface {
	isDesktop: () => boolean;
	prepareResourcePath: (path: string) => string;
	isBlur: () => boolean;
	getLimitationBackground: () => unknown;
	handleLimitationBackground: () => void;
	openArticle: (articleKey: string) => void;
	isFeatureSupportedInVersion: (version: number, featureCode: string) => boolean;
	subscribe: (eventName: string, handler: Function) => void;
	unsubscribe: (eventName: string, handler: Function) => void;
	emit: (eventName: string, params?: unknown[]) => void;
	emitToMainWindow: (eventName: string, params?: unknown[]) => void;
	isChatWindow: () => boolean;
	activateWindow: () => void;
	changeTab: (tabId: string) => void;
	closeWindow: () => void;
	findWindow: (name: string) => unknown;
	showBrowserWindow: () => void;
	hideLoader: () => void;
	createWindow: (name: string, callback: Function) => void;
	createTopmostWindow: (htmlContent: string) => DesktopWindow;
	setWindowPosition: (params: {
		x?: number;
		y?: number;
		width?: number;
		height?: number;
	}) => void;
	prepareHtml: (html: string, js: string) => string;
	getApiVersion: () => number;
	isFeatureSupported: (feature: string) => boolean;
	isFeatureEnabled: (feature: string) => boolean;
	handlePortalTabActivation: () => void;
	shouldActivateTabWithChatPage: () => boolean;
	setTabWithChatPageActive: () => void;
	getBackgroundImage: () => unknown;
	setCallBackground: (background: unknown) => void;
	getCallMask: () => unknown;
	setCallMask: (mask: unknown) => void;
	setCallMaskLoadHandlers: (handlers: unknown) => void;
	getCameraSmoothingStatus: () => boolean;
	setCameraSmoothingStatus: (status: boolean) => void;
	writeToLogFile: (...args: unknown[]) => void;
}

declare namespace BX.Call.Adapter {
	const DesktopApi: DesktopApiInterface;

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
