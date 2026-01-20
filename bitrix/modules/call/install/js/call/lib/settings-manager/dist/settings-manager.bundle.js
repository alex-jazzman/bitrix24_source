/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
(function (exports,main_core) {
	'use strict';

	class CallSettings {
	  constructor() {
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
	}
	const CallSettingsManager = new CallSettings();

	exports.CallSettingsManager = CallSettingsManager;

}((this.BX.Call.Lib = this.BX.Call.Lib || {}),BX));
//# sourceMappingURL=settings-manager.bundle.js.map
