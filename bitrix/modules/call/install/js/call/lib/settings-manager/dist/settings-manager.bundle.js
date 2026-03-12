/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
(function (exports,main_core) {
	'use strict';

	const defaultNoiseSuppressionEnabled = false;
	var _accidentLogSendIntervalSecs = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("accidentLogSendIntervalSecs");
	var _accidentLogGroupMaxAgeSecs = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("accidentLogGroupMaxAgeSecs");
	var _noiseSuppressionEnabled = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("noiseSuppressionEnabled");
	class CallSettings {
	  constructor() {
	    Object.defineProperty(this, _accidentLogSendIntervalSecs, {
	      writable: true,
	      value: 0
	    });
	    Object.defineProperty(this, _accidentLogGroupMaxAgeSecs, {
	      writable: true,
	      value: 0
	    });
	    Object.defineProperty(this, _noiseSuppressionEnabled, {
	      writable: true,
	      value: defaultNoiseSuppressionEnabled
	    });
	    this.jwtCallsEnabled = false;
	    this.plainCallsUseJwt = false;
	    this.plainCallFollowUpEnabled = false;
	    this.plainCallCloudRecordingEnabled = false;
	    this.callBalancerUrl = '';
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
	    return this._jwtCallsEnabled;
	  }
	  set jwtCallsEnabled(value) {
	    this._jwtCallsEnabled = value;
	  }
	  get plainCallsUseJwt() {
	    return this._plainCallsUseJwt;
	  }
	  set plainCallsUseJwt(value) {
	    this._plainCallsUseJwt = value;
	  }
	  get callBalancerUrl() {
	    return this._callBalancerUrl;
	  }
	  set callBalancerUrl(value) {
	    this._callBalancerUrl = value;
	  }
	  get plainCallFollowUpEnabled() {
	    return this.isJwtInPlainCallsEnabled && this._plainCallFollowUpEnabled;
	  }
	  set plainCallFollowUpEnabled(value) {
	    this._plainCallFollowUpEnabled = value;
	  }
	  get plainCallCloudRecordingEnabled() {
	    return this.isJwtInPlainCallsEnabled && this._plainCallCloudRecordingEnabled;
	  }
	  set plainCallCloudRecordingEnabled(value) {
	    this._plainCallCloudRecordingEnabled = value;
	  }
	  isJwtInPlainCallsEnabled() {
	    return this.jwtCallsEnabled && this.plainCallsUseJwt;
	  }
	  get noiseSuppressionEnabled() {
	    var _babelHelpers$classPr;
	    return (_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(this, _noiseSuppressionEnabled)[_noiseSuppressionEnabled]) != null ? _babelHelpers$classPr : defaultNoiseSuppressionEnabled;
	  }
	  set noiseSuppressionEnabled(value) {
	    babelHelpers.classPrivateFieldLooseBase(this, _noiseSuppressionEnabled)[_noiseSuppressionEnabled] = value;
	  }
	  get accidentLogSendIntervalSecs() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _accidentLogSendIntervalSecs)[_accidentLogSendIntervalSecs] || 0;
	  }
	  set accidentLogSendIntervalSecs(value) {
	    babelHelpers.classPrivateFieldLooseBase(this, _accidentLogSendIntervalSecs)[_accidentLogSendIntervalSecs] = value || 0;
	  }
	  get accidentLogGroupMaxAgeSecs() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _accidentLogGroupMaxAgeSecs)[_accidentLogGroupMaxAgeSecs] || 0;
	  }
	  set accidentLogGroupMaxAgeSecs(value) {
	    babelHelpers.classPrivateFieldLooseBase(this, _accidentLogGroupMaxAgeSecs)[_accidentLogGroupMaxAgeSecs] = value || 0;
	  }
	}
	const CallSettingsManager = new CallSettings();

	exports.CallSettingsManager = CallSettingsManager;

}((this.BX.Call.Lib = this.BX.Call.Lib || {}),BX));
//# sourceMappingURL=settings-manager.bundle.js.map
