/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
(function (exports, main_core, main_core_events, im_v2_const, call_adapter_logger) {
	'use strict';

	const BANNER_EXTENSION = 'call.component.sync-tab-banner';
	const NEED_TO_SHOW_SETTING = 'syncTabBannerNeedToShow';
	let banner = null;
	let cancelled = false;
	const needToShow = () => {
		return main_core.Extension.getSettings('call.core').get(NEED_TO_SHOW_SETTING, false) === true;
	};
	const start = surface => {
		cancelled = false;
		if (!needToShow()) {
			return;
		}
		void main_core.Runtime.loadExtension(BANNER_EXTENSION).then(exports => {
			if (cancelled) {
				return;
			}
			const {
				SyncTabBanner
			} = exports;
			banner = SyncTabBanner;
			SyncTabBanner.launch(surface);
		}).catch(error => call_adapter_logger.Logger.warn('SyncTabBannerLauncher: failed to load the banner extension', error));
	};
	const handleMessengerClose = () => {
		if (cancelled) {
			return;
		}
		cancelled = true;
		banner?.cancel();
		banner = null;
	};
	const SyncTabBannerLauncher = {
		startOnSyncPage: () => start('sync-page'),
		cancel: handleMessengerClose
	};
	const messengerEvents = im_v2_const.EventType?.messenger;
	if (messengerEvents) {
		main_core_events.EventEmitter.subscribe(messengerEvents.onReady, () => start('messenger'));
		main_core_events.EventEmitter.subscribe(messengerEvents.onClose, handleMessengerClose);
	}

	exports.SyncTabBannerLauncher = SyncTabBannerLauncher;

})(this.BX.Call.Lib = this.BX.Call.Lib || {}, BX, BX.Event, BX.Messenger.v2.Const, BX.Call.Adapter);
//# sourceMappingURL=sync-tab-banner-launcher.bundle.js.map
