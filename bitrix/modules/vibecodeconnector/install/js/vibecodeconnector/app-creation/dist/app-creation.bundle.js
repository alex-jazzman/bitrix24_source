/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, ui_analytics, ui_notification, vibecodeconnector_openApp, vibecodeconnector_embedCreate) {
	'use strict';

	const CREATE_HUB_VIEW = 'create';
	const ANALYTICS_EVENT = {
		create: 'click_create',
		fallback: 'click_vibecode'
	};
	const boundNodes = new WeakMap();
	function getSettings() {
		const settings = main_core.Extension.getSettings('vibecodeconnector.app-creation');
		return {
			available: settings.get('available', false) === true,
			createInIframe: settings.get('createInIframe', false) === true,
			vibecodeUrl: settings.get('vibecodeUrl', ''),
			fallbackUrl: settings.get('fallbackUrl', '')
		};
	}
	function sendAnalytics(mode, options) {
		const analytics = options.analytics;
		if (!main_core.Type.isPlainObject(analytics)) {
			return;
		}
		ui_analytics.sendData({
			...analytics,
			event: analytics.event ?? ANALYTICS_EVENT[mode]
		});
	}
	function isAppCreationAvailable() {
		return getSettings().available;
	}
	function openAppCreation(options = {}) {
		const settings = getSettings();
		if (!settings.available) {
			return;
		}
		if (!settings.createInIframe) {
			sendAnalytics('fallback', options);
			options.onOpen?.('fallback');
			vibecodeconnector_openApp.openUrl(settings.fallbackUrl);
			return;
		}
		sendAnalytics('create', options);
		options.onOpen?.('create');
		const opened = vibecodeconnector_embedCreate.openVibecodeCreate(CREATE_HUB_VIEW, {
			vibecodeUrl: settings.vibecodeUrl,
			onClose: () => options.onClose?.()
		});
		if (!opened) {
			fallBack(settings.fallbackUrl);
		}
	}
	function fallBack(fallbackUrl) {
		ui_notification.Center.notify({
			content: main_core.Loc.getMessage('VIBECODECONNECTOR_APP_CREATION_UNAVAILABLE') ?? ''
		});
		vibecodeconnector_openApp.openUrl(fallbackUrl);
	}
	function bindAppCreation(node, options = {}) {
		if (!main_core.Type.isElementNode(node) || !isAppCreationAvailable()) {
			return null;
		}
		const bound = boundNodes.get(node);
		if (bound) {
			return bound;
		}
		let pending = false;
		const handler = event => {
			event.preventDefault();
			if (pending) {
				return;
			}
			pending = true;
			try {
				openAppCreation(options);
			} finally {
				pending = false;
			}
		};
		main_core.Event.bind(node, 'click', handler);
		const unbind = () => {
			main_core.Event.unbind(node, 'click', handler);
			boundNodes.delete(node);
		};
		boundNodes.set(node, unbind);
		return unbind;
	}

	exports.bindAppCreation = bindAppCreation;
	exports.isAppCreationAvailable = isAppCreationAvailable;
	exports.openAppCreation = openAppCreation;

})(this.BX.Vibecodeconnector = this.BX.Vibecodeconnector || {}, BX, BX.UI.Analytics, BX.UI.Notification, BX.Vibecodeconnector.OpenApp, BX.Vibecodeconnector.EmbedCreate);
//# sourceMappingURL=app-creation.bundle.js.map
