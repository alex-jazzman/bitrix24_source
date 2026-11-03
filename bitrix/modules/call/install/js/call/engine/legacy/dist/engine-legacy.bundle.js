/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
this.BX.Call.EngineProviders = this.BX.Call.EngineProviders || {};
(function (exports, call_engine_registry, call_core) {
	'use strict';

	class LegacyCallEngine {
		#controller;
		constructor(context, controllerFactory) {
			this.#controller = controllerFactory({
				init: true,
				language: context.language,
				messengerFacade: context.messengerFacade,
				events: context.events
			});
		}
		prepareCall(data) {
			this.#controller.prepareCall(data);
		}
		startCall(dialogId, options) {
			this.#controller.startCall(dialogId, options.withVideo, options.chatInfo, options.callOptions);
		}
		joinCall(callId, callUuid, options) {
			this.#controller.joinCall(callId, callUuid, options.withVideo, {
				chatInfo: options.chatInfo
			});
		}
		leaveCurrentCall() {
			this.#controller.leaveCurrentCall();
		}
		onAnswerButtonClick(mediaParams, callParams) {
			this.#controller.onAnswerButtonClick(mediaParams, callParams);
		}
		closeCallNotification() {
			this.#controller.closeCallNotification();
		}
		releaseRingingCallSlot() {
			this.#controller.releaseRingingCallSlot();
		}
		hasActiveCall() {
			return this.#controller.hasActiveCall();
		}
		hasVisibleCall() {
			return this.#controller.hasVisibleCall();
		}
		fold() {
			this.#controller.fold();
		}
		unfold(options = {}) {
			this.#controller.unfold(options);
		}
		getActiveCall() {
			if (!this.#controller.hasActiveCall()) {
				return null;
			}
			const call = this.#controller.currentCall;
			if (!call) {
				return null;
			}
			return {
				uuid: call.uuid,
				dialogId: call.associatedEntity.id,
				isScreenSharingStarted: () => call.isScreenSharingStarted(),
				raw: call
			};
		}
		sendBroadcastRequest(callUuid, options = {}) {
			return this.#controller.sendBroadcastRequest(callUuid, {
				silent: options.silent ?? false,
				timeout: 100
			});
		}
		setDebug(debug) {
			this.#controller.debug = debug;
		}
		get events() {
			return this.#controller;
		}
	}

	function createLegacyCapabilities(util) {
		return {
			getUserLimit: () => util.getUserLimit(),
			isWebRTCSupported: () => util.isWebRTCSupported()
		};
	}

	function createLegacyRecentCallsSource(deps) {
		const instantiator = {
			isLegacyCall: (provider, scheme) => deps.util.isLegacyCall(provider, scheme),
			isFinished: call => {
				if (deps.util.isLegacyCall(call.PROVIDER, call.SCHEME)) {
					return deps.engineLegacy.finishedCalls.has(Number.parseInt(String(call.ID), 10));
				}
				return call.UUID !== undefined && deps.engine.finishedCalls.has(call.UUID);
			},
			instantiate: (call, callToken, logToken, userData) => deps.engine.instantiateCall(call, callToken, logToken, userData),
			instantiateLegacy: (call, users, logToken, connectionData, userData) => deps.engineLegacy.instantiateCall(call, users, logToken, connectionData, userData)
		};
		const callEvent = {
			onJoin: deps.event.onJoin,
			onLeave: deps.event.onLeave,
			onDestroy: deps.event.onDestroy
		};
		return {
			callEvent,
			instantiator,
			addCallListener: (call, event, handler) => {
				call.addEventListener(event, handler);
			},
			removeCallListener: (call, event, handler) => {
				call.removeEventListener(event, handler);
			}
		};
	}

	call_engine_registry.engineRegistry.register({
		engine: context => new LegacyCallEngine(context, config => new call_core.Controller(config)),
		capabilities: () => createLegacyCapabilities(call_core.Util),
		recentSource: () => createLegacyRecentCallsSource({
			util: call_core.Util,
			engine: call_core.Engine,
			engineLegacy: call_core.EngineLegacy,
			event: call_core.Event
		})
	});

	exports.LegacyCallEngine = LegacyCallEngine;

})(this.BX.Call.EngineProviders.Legacy = this.BX.Call.EngineProviders.Legacy || {}, BX.Call.EngineProviders.Registry, BX.Call);
//# sourceMappingURL=engine-legacy.bundle.js.map
