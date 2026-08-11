/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
(function (exports, main_core_events, im_v2_lib_confirm) {
	'use strict';

	class CallSliderManager {
		#sliderIdWithCall;
		#callbacks;
		constructor(callbacks) {
			this.#sliderIdWithCall = '';
			this.#callbacks = callbacks;
			this.#subscribeToEvents();
		}
		#subscribeToEvents() {
			main_core_events.EventEmitter.subscribe('SidePanel.Slider:onClose', this.#onCloseSliderWithCall.bind(this));
		}
		setTopSliderId() {
			if (!BX.SidePanel.Instance.isOpen()) {
				return;
			}
			this.#sliderIdWithCall = BX.SidePanel.Instance.getTopSlider().getUrl().toString();
		}
		clearSliderId() {
			this.#sliderIdWithCall = '';
		}
		async #onCloseSliderWithCall({
			data: events
		}) {
			const [event] = events;
			const sliderId = event.getSlider().getUrl().toString();
			if (sliderId !== this.#sliderIdWithCall || sliderId.startsWith('im:slider')) {
				return;
			}
			const hasCall = this.#callbacks.hasCurrentCall();
			if (hasCall) {
				event.denyAction();
				const result = await im_v2_lib_confirm.showCloseWithActiveCallConfirm();
				if (result) {
					this.#callbacks.leaveCurrentCall();
					event.slider.close();
				}
			}
		}
	}

	exports.CallSliderManager = CallSliderManager;

})(this.BX.Call.Lib = this.BX.Call.Lib || {}, BX.Event, BX.Messenger.v2.Lib);
//# sourceMappingURL=call-slider-manager.bundle.js.map
