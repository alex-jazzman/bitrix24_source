import { DesktopApi as ImDesktopApi, DesktopFeature as ImDesktopFeature } from 'im.v2.lib.desktop-api';

// region Type definitions

/**
 * Desktop topmost window reference.
 * Returned by createTopmostWindow() in the desktop environment.
 * Type annotation in im module says `boolean`, but the runtime
 * returns a window proxy object when running inside BXDesktop.
 */
export interface DesktopWindow
{
	BXDesktopWindow: {
		ExecuteCommand: (command: string) => void;
		SetProperty?: (name: string, value: Record<string, unknown>) => void;
	};
}

export interface DesktopApiInterface
{
	// Lifecycle
	isDesktop: () => boolean;

	// Common
	prepareResourcePath: (path: string) => string;
	isBlur: () => boolean;
	getLimitationBackground: () => unknown;
	handleLimitationBackground: () => void;
	openArticle: (articleKey: string) => void;
	isFeatureSupportedInVersion: (version: number, featureCode: string) => boolean;

	// Events
	subscribe: (eventName: string, handler: Function) => void;
	unsubscribe: (eventName: string, handler: Function) => void;
	emit: (eventName: string, params?: unknown[]) => void;
	emitToMainWindow: (eventName: string, params?: unknown[]) => void;

	// Window
	isChatWindow: () => boolean;
	activateWindow: () => void;
	changeTab: (tabId: string) => void;
	closeWindow: () => void;
	findWindow: (name: string) => unknown;
	showBrowserWindow: () => void;
	hideLoader: () => void;
	createWindow: (name: string, callback: Function) => void;
	createTopmostWindow: (htmlContent: string) => DesktopWindow;
	setWindowPosition: (params: { x?: number; y?: number; width?: number; height?: number }) => void;
	prepareHtml: (html: string, js: string) => string;

	// Version & Features
	getApiVersion: () => number;
	isFeatureSupported: (feature: string) => boolean;
	isFeatureEnabled: (feature: string) => boolean;
	handlePortalTabActivation: () => void;
	shouldActivateTabWithChatPage: () => boolean;
	setTabWithChatPageActive: () => void;

	// Call Background & Mask
	getBackgroundImage: () => unknown;
	setCallBackground: (background: unknown) => void;
	getCallMask: () => unknown;
	setCallMask: (mask: unknown) => void;
	setCallMaskLoadHandlers: (handlers: unknown) => void;

	// Settings
	getCameraSmoothingStatus: () => boolean;
	setCameraSmoothingStatus: (status: boolean) => void;

	// Logger
	writeToLogFile: (...args: unknown[]) => void;
}

// endregion Type definitions

const desktopApiMethods = {
	// Lifecycle
	isDesktop: ImDesktopApi.isDesktop,

	// Background mask needed
	prepareResourcePath: ImDesktopApi.prepareResourcePath,
	isBlur: ImDesktopApi.isBlur,
	getLimitationBackground: ImDesktopApi.getLimitationBackground,
	handleLimitationBackground: ImDesktopApi.handleLimitationBackground,
	openArticle: ImDesktopApi.openArticle,
	isFeatureSupportedInVersion: ImDesktopApi.isFeatureSupportedInVersion,

	// Events
	subscribe: ImDesktopApi.subscribe,
	unsubscribe: ImDesktopApi.unsubscribe,
	emit: ImDesktopApi.emit,
	emitToMainWindow: ImDesktopApi.emitToMainWindow,

	// Window
	isChatWindow: ImDesktopApi.isChatWindow,
	activateWindow: ImDesktopApi.activateWindow,
	changeTab: ImDesktopApi.changeTab,
	closeWindow: ImDesktopApi.closeWindow,
	findWindow: ImDesktopApi.findWindow,
	showBrowserWindow: ImDesktopApi.showBrowserWindow,
	hideLoader: ImDesktopApi.hideLoader,
	createWindow: ImDesktopApi.createWindow,
	createTopmostWindow: ImDesktopApi.createTopmostWindow,
	setWindowPosition: ImDesktopApi.setWindowPosition,
	prepareHtml: ImDesktopApi.prepareHtml,

	// Version & Features
	getApiVersion: ImDesktopApi.getApiVersion,
	isFeatureSupported: ImDesktopApi.isFeatureSupported,
	isFeatureEnabled: ImDesktopApi.isFeatureEnabled,
	handlePortalTabActivation: ImDesktopApi.handlePortalTabActivation,
	shouldActivateTabWithChatPage: ImDesktopApi.shouldActivateTabWithChatPage,
	setTabWithChatPageActive: ImDesktopApi.setTabWithChatPageActive,

	// Call Background & Mask
	getBackgroundImage: ImDesktopApi.getBackgroundImage,
	setCallBackground: ImDesktopApi.setCallBackground,
	getCallMask: ImDesktopApi.getCallMask,
	setCallMask: ImDesktopApi.setCallMask,
	setCallMaskLoadHandlers: ImDesktopApi.setCallMaskLoadHandlers,

	// Settings
	getCameraSmoothingStatus: ImDesktopApi.getCameraSmoothingStatus,
	setCameraSmoothingStatus: ImDesktopApi.setCameraSmoothingStatus,

	// Logger
	writeToLogFile: ImDesktopApi.writeToLogFile,
};

export const DesktopApi: DesktopApiInterface = new Proxy(desktopApiMethods as unknown as DesktopApiInterface, {
	get(target: DesktopApiInterface, property: string | symbol): unknown
	{
		if (Reflect.has(target, property))
		{
			return Reflect.get(target, property);
		}

		throw new Error(`DesktopApi: method "${String(property)}" is not defined in the adapter. Register it explicitly.`);
	},
});

export const DesktopFeature = ImDesktopFeature;
