/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
(function (exports, main_core) {
	'use strict';

	class CallSettings {
		#accidentLogSendIntervalSecs = 0;
		#accidentLogGroupMaxAgeSecs = 0;
		#noiseSuppressionEnabled = false;
		#jwtCallsEnabled = false;
		#plainCallsUseJwt = false;
		#callBalancerUrl = '';
		#plainCallFollowUpEnabled = false;
		#plainCallCloudRecordingEnabled = false;
		constructor() {
			if (main_core.Extension.getSettings('call.core').call) {
				this.setup(main_core.Extension.getSettings('call.core').call);
			}
		}
		setup(settings) {
			if (settings.jwtCallsEnabled !== undefined) {
				this.jwtCallsEnabled = settings.jwtCallsEnabled;
			}
			if (settings.noiseSuppressionEnabled !== undefined) {
				this.noiseSuppressionEnabled = settings.noiseSuppressionEnabled;
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
		get noiseSuppressionEnabled() {
			return this.#noiseSuppressionEnabled;
		}
		set noiseSuppressionEnabled(value) {
			this.#noiseSuppressionEnabled = value;
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

	exports.CallSettingsManager = CallSettingsManager;

})(this.BX.Call.Lib = this.BX.Call.Lib || {}, BX);
//# sourceMappingURL=settings-manager.bundle.js.map
