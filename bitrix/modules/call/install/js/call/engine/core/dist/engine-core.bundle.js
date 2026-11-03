/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
this.BX.Call.EngineProviders = this.BX.Call.EngineProviders || {};
(function (exports, call_engine_registry, main_core_events) {
	'use strict';

	const notImplemented = method => {
		return new Error(`CoreCallEngine.${method}: new call core not implemented yet`);
	};
	class CoreCallEngine {
		#events = new main_core_events.EventEmitter();
		constructor() {
			this.#events.setEventNamespace('BX.Call.CoreCallEngine');
		}
		prepareCall(_data) {
			throw notImplemented('prepareCall');
		}
		startCall(_dialogId, _options) {
			throw notImplemented('startCall');
		}
		joinCall(_callId, _callUuid, _options) {
			throw notImplemented('joinCall');
		}
		leaveCurrentCall() {
			throw notImplemented('leaveCurrentCall');
		}
		onAnswerButtonClick(_mediaParams, _callParams) {
			throw notImplemented('onAnswerButtonClick');
		}
		closeCallNotification() {
			throw notImplemented('closeCallNotification');
		}
		releaseRingingCallSlot() {
			throw notImplemented('releaseRingingCallSlot');
		}
		hasActiveCall() {
			return false;
		}
		hasVisibleCall() {
			return false;
		}
		fold() {
			throw notImplemented('fold');
		}
		unfold(_options) {
			throw notImplemented('unfold');
		}
		getActiveCall() {
			return null;
		}
		sendBroadcastRequest(_callUuid, _options) {
			return Promise.resolve([]);
		}
		setDebug(_debug) {
		}
		get events() {
			return this.#events;
		}
	}

	const coreCapabilities = {
		getUserLimit: () => 0,
		isWebRTCSupported: () => false
	};

	const coreRecentCallsSource = {
		callEvent: {
			onJoin: 'onJoin',
			onLeave: 'onLeave',
			onDestroy: 'onDestroy'
		},
		instantiator: {
			isLegacyCall: () => false,
			isFinished: () => false,
			instantiate: () => ({}),
			instantiateLegacy: () => ({})
		},
		addCallListener: () => {},
		removeCallListener: () => {}
	};

	call_engine_registry.engineRegistry.register({
		engine: () => new CoreCallEngine(),
		capabilities: () => coreCapabilities,
		recentSource: () => coreRecentCallsSource
	});

	exports.CoreCallEngine = CoreCallEngine;

})(this.BX.Call.EngineProviders.Core = this.BX.Call.EngineProviders.Core || {}, BX.Call.EngineProviders.Registry, BX.Event);
//# sourceMappingURL=engine-core.bundle.js.map
