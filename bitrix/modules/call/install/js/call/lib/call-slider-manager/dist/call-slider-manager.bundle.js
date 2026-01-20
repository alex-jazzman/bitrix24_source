/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
(function (exports,main_core_events,im_v2_lib_confirm,call_lib_callManager) {
	'use strict';

	var _sliderIdWithCall = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("sliderIdWithCall");
	var _subscribeToEvents = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("subscribeToEvents");
	var _onCloseSliderWithCall = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onCloseSliderWithCall");
	class CallSliderManager {
	  static getInstance() {
	    if (!this.instance) {
	      this.instance = new this();
	    }
	    return this.instance;
	  }
	  constructor() {
	    Object.defineProperty(this, _onCloseSliderWithCall, {
	      value: _onCloseSliderWithCall2
	    });
	    Object.defineProperty(this, _subscribeToEvents, {
	      value: _subscribeToEvents2
	    });
	    Object.defineProperty(this, _sliderIdWithCall, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _sliderIdWithCall)[_sliderIdWithCall] = '';
	    babelHelpers.classPrivateFieldLooseBase(this, _subscribeToEvents)[_subscribeToEvents]();
	  }
	  setTopSliderId() {
	    if (!BX.SidePanel.Instance.isOpen()) {
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _sliderIdWithCall)[_sliderIdWithCall] = BX.SidePanel.Instance.getTopSlider().getUrl().toString();
	  }
	  clearSliderId() {
	    babelHelpers.classPrivateFieldLooseBase(this, _sliderIdWithCall)[_sliderIdWithCall] = '';
	  }
	}
	function _subscribeToEvents2() {
	  main_core_events.EventEmitter.subscribe('SidePanel.Slider:onClose', babelHelpers.classPrivateFieldLooseBase(this, _onCloseSliderWithCall)[_onCloseSliderWithCall].bind(this));
	}
	async function _onCloseSliderWithCall2({
	  data: event
	}) {
	  [event] = event;
	  const sliderId = event.getSlider().getUrl().toString();
	  if (sliderId !== babelHelpers.classPrivateFieldLooseBase(this, _sliderIdWithCall)[_sliderIdWithCall] || sliderId.startsWith('im:slider')) {
	    return;
	  }
	  const hasCall = call_lib_callManager.CallManager.getInstance().hasCurrentCall();
	  if (hasCall) {
	    event.denyAction();
	    const result = await im_v2_lib_confirm.showCloseWithActiveCallConfirm();
	    if (result) {
	      call_lib_callManager.CallManager.getInstance().leaveCurrentCall();
	      event.slider.close();
	    }
	  }
	}

	exports.CallSliderManager = CallSliderManager;

}((this.BX.Call.Lib = this.BX.Call.Lib || {}),BX.Event,BX.Messenger.v2.Lib,BX.Call.Lib));
//# sourceMappingURL=call-slider-manager.bundle.js.map
