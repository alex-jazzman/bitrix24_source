import { DesktopApi as ImDesktopApi, DesktopFeature as ImDesktopFeature } from 'im.v2.lib.desktop-api';

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

export const DesktopApi = new Proxy(desktopApiMethods, {
	get(target, property)
	{
		if (Reflect.has(target, property))
		{
			return Reflect.get(target, property);
		}

		throw new Error(`DesktopApi: method "${String(property)}" is not defined in the adapter. Register it explicitly.`);
	},
});

export const DesktopFeature = ImDesktopFeature;
