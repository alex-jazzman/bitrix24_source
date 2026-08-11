/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
(function (exports, im_v2_lib_desktopApi) {
	'use strict';

	const desktopApiMethods = {
		isDesktop: im_v2_lib_desktopApi.DesktopApi.isDesktop,
		prepareResourcePath: im_v2_lib_desktopApi.DesktopApi.prepareResourcePath,
		isBlur: im_v2_lib_desktopApi.DesktopApi.isBlur,
		getLimitationBackground: im_v2_lib_desktopApi.DesktopApi.getLimitationBackground,
		handleLimitationBackground: im_v2_lib_desktopApi.DesktopApi.handleLimitationBackground,
		openArticle: im_v2_lib_desktopApi.DesktopApi.openArticle,
		isFeatureSupportedInVersion: im_v2_lib_desktopApi.DesktopApi.isFeatureSupportedInVersion,
		subscribe: im_v2_lib_desktopApi.DesktopApi.subscribe,
		unsubscribe: im_v2_lib_desktopApi.DesktopApi.unsubscribe,
		emit: im_v2_lib_desktopApi.DesktopApi.emit,
		emitToMainWindow: im_v2_lib_desktopApi.DesktopApi.emitToMainWindow,
		isChatWindow: im_v2_lib_desktopApi.DesktopApi.isChatWindow,
		activateWindow: im_v2_lib_desktopApi.DesktopApi.activateWindow,
		changeTab: im_v2_lib_desktopApi.DesktopApi.changeTab,
		closeWindow: im_v2_lib_desktopApi.DesktopApi.closeWindow,
		findWindow: im_v2_lib_desktopApi.DesktopApi.findWindow,
		showBrowserWindow: im_v2_lib_desktopApi.DesktopApi.showBrowserWindow,
		hideLoader: im_v2_lib_desktopApi.DesktopApi.hideLoader,
		createWindow: im_v2_lib_desktopApi.DesktopApi.createWindow,
		createTopmostWindow: im_v2_lib_desktopApi.DesktopApi.createTopmostWindow,
		setWindowPosition: im_v2_lib_desktopApi.DesktopApi.setWindowPosition,
		prepareHtml: im_v2_lib_desktopApi.DesktopApi.prepareHtml,
		getApiVersion: im_v2_lib_desktopApi.DesktopApi.getApiVersion,
		isFeatureSupported: im_v2_lib_desktopApi.DesktopApi.isFeatureSupported,
		isFeatureEnabled: im_v2_lib_desktopApi.DesktopApi.isFeatureEnabled,
		handlePortalTabActivation: im_v2_lib_desktopApi.DesktopApi.handlePortalTabActivation,
		shouldActivateTabWithChatPage: im_v2_lib_desktopApi.DesktopApi.shouldActivateTabWithChatPage,
		setTabWithChatPageActive: im_v2_lib_desktopApi.DesktopApi.setTabWithChatPageActive,
		getBackgroundImage: im_v2_lib_desktopApi.DesktopApi.getBackgroundImage,
		setCallBackground: im_v2_lib_desktopApi.DesktopApi.setCallBackground,
		getCallMask: im_v2_lib_desktopApi.DesktopApi.getCallMask,
		setCallMask: im_v2_lib_desktopApi.DesktopApi.setCallMask,
		setCallMaskLoadHandlers: im_v2_lib_desktopApi.DesktopApi.setCallMaskLoadHandlers,
		getCameraSmoothingStatus: im_v2_lib_desktopApi.DesktopApi.getCameraSmoothingStatus,
		setCameraSmoothingStatus: im_v2_lib_desktopApi.DesktopApi.setCameraSmoothingStatus,
		writeToLogFile: im_v2_lib_desktopApi.DesktopApi.writeToLogFile
	};
	const DesktopApi = new Proxy(desktopApiMethods, {
		get(target, property) {
			if (Reflect.has(target, property)) {
				return Reflect.get(target, property);
			}
			throw new Error(`DesktopApi: method "${String(property)}" is not defined in the adapter. Register it explicitly.`);
		}
	});
	const DesktopFeature = im_v2_lib_desktopApi.DesktopFeature;

	exports.DesktopApi = DesktopApi;
	exports.DesktopFeature = DesktopFeature;

})(this.BX.Call.Adapter = this.BX.Call.Adapter || {}, BX.Messenger.v2.Lib);
//# sourceMappingURL=desktop-api.bundle.js.map
