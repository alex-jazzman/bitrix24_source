/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
(function (exports, main_core) {
	'use strict';

	class ContextProviderRegistry {
		#providers = [];
		registerProvider(provider) {
			if (this.#providers.includes(provider)) {
				return;
			}
			this.#providers.push(provider);
		}
		unregisterProvider(provider) {
			this.#providers = this.#providers.filter(registered => registered !== provider);
		}
		getContext() {
			for (const provider of this.#providers) {
				const context = this.#safeCall(() => this.#pickAllowedFields(provider())) ?? {};
				if (this.#hasFilledField(context)) {
					return context;
				}
			}
			return {};
		}
		#safeCall(read) {
			try {
				return read();
			} catch {
				return null;
			}
		}
		#pickAllowedFields(context) {
			const allowed = {};
			if (!context) {
				return allowed;
			}
			if (main_core.Type.isString(context.roomId)) {
				allowed.roomId = context.roomId;
			}
			if (main_core.Type.isNumber(context.callId)) {
				allowed.callId = context.callId;
			}
			if (main_core.Type.isNumber(context.chatId)) {
				allowed.chatId = context.chatId;
			}
			return allowed;
		}
		#hasFilledField(context) {
			return Object.values(context).some(value => value !== undefined && value !== null && value !== '');
		}
	}
	const CallLogContextRegistry = new ContextProviderRegistry();

	class CallSettings {
		#accidentLogSendIntervalSecs = 0;
		#accidentLogGroupMaxAgeSecs = 0;
		#jwtCallsEnabled = false;
		#plainCallsUseJwt = false;
		#callBalancerUrl = '';
		#plainCallFollowUpEnabled = false;
		#plainCallCloudRecordingEnabled = false;
		constructor() {
			const callSettings = main_core.Extension.getSettings('call.core').get('call');
			if (callSettings) {
				this.setup(callSettings);
			}
		}
		setup(settings) {
			if (settings.jwtCallsEnabled !== undefined) {
				this.jwtCallsEnabled = settings.jwtCallsEnabled;
			}
			if (settings.plainCallsUseJwt !== undefined) {
				this.plainCallsUseJwt = settings.plainCallsUseJwt;
			}
			if (settings.plainCallFollowUpEnabled !== undefined) {
				this.plainCallFollowUpEnabled = settings.plainCallFollowUpEnabled;
			}
			if (settings.plainCallCloudRecordingEnabled !== undefined) {
				this.plainCallCloudRecordingEnabled = settings.plainCallCloudRecordingEnabled;
			}
			if (settings.callBalancerUrl !== undefined) {
				this.callBalancerUrl = settings.callBalancerUrl;
			}
			if (main_core.Type.isNumber(settings.accidentLogSendIntervalSecs) && settings.accidentLogSendIntervalSecs > 0) {
				this.accidentLogSendIntervalSecs = settings.accidentLogSendIntervalSecs;
			}
			if (main_core.Type.isNumber(settings.accidentLogGroupMaxAgeSecs) && settings.accidentLogGroupMaxAgeSecs > 0) {
				this.accidentLogGroupMaxAgeSecs = settings.accidentLogGroupMaxAgeSecs;
			}
		}
		get jwtCallsEnabled() {
			return this.#jwtCallsEnabled;
		}
		set jwtCallsEnabled(value) {
			this.#jwtCallsEnabled = value;
		}
		get plainCallsUseJwt() {
			return this.#plainCallsUseJwt;
		}
		set plainCallsUseJwt(value) {
			this.#plainCallsUseJwt = value;
		}
		get callBalancerUrl() {
			return this.#callBalancerUrl;
		}
		set callBalancerUrl(value) {
			this.#callBalancerUrl = value;
		}
		get plainCallFollowUpEnabled() {
			return this.isJwtInPlainCallsEnabled && this.#plainCallFollowUpEnabled;
		}
		set plainCallFollowUpEnabled(value) {
			this.#plainCallFollowUpEnabled = value;
		}
		get plainCallCloudRecordingEnabled() {
			return this.isJwtInPlainCallsEnabled && this.#plainCallCloudRecordingEnabled;
		}
		set plainCallCloudRecordingEnabled(value) {
			this.#plainCallCloudRecordingEnabled = value;
		}
		isJwtInPlainCallsEnabled() {
			return this.jwtCallsEnabled && this.plainCallsUseJwt;
		}
		get accidentLogSendIntervalSecs() {
			return this.#accidentLogSendIntervalSecs || 0;
		}
		set accidentLogSendIntervalSecs(value) {
			this.#accidentLogSendIntervalSecs = value || 0;
		}
		get accidentLogGroupMaxAgeSecs() {
			return this.#accidentLogGroupMaxAgeSecs || 0;
		}
		set accidentLogGroupMaxAgeSecs(value) {
			this.#accidentLogGroupMaxAgeSecs = value || 0;
		}
	}
	const CallSettingsManager = new CallSettings();
	const AccidentLogStorageKeys = Object.freeze({
		dbName: 'bx_call_accidentLogDB',
		storeName: 'bx_call_accidentLogs'
	});

	exports.AccidentLogStorageKeys = AccidentLogStorageKeys;
	exports.CallLogContextRegistry = CallLogContextRegistry;
	exports.CallSettingsManager = CallSettingsManager;

})(this.BX.Call.Lib = this.BX.Call.Lib || {}, BX);
//# sourceMappingURL=settings-manager.bundle.js.map
