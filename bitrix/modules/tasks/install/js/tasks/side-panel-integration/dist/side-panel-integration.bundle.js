/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core) {
	'use strict';

	class SidePanelIntegration {
		#popup;
		#sliders = new Set();
		#frozen = false;
		#frozenProps;
		constructor(popup) {
			this.#popup = popup;
			this.#popup.subscribe('onShow', this.handlePopupShow.bind(this));
			this.#popup.subscribe('onClose', this.handlePopupClose.bind(this));
			this.#popup.subscribe('onDestroy', this.handlePopupClose.bind(this));
			this.handleSliderOpen = this.handleSliderOpen.bind(this);
			this.handleSliderClose = this.handleSliderClose.bind(this);
			this.handleSliderDestroy = this.handleSliderDestroy.bind(this);
		}
		handlePopupShow() {
			this.bindEvents();
		}
		handlePopupClose() {
			this.#sliders.clear();
			this.unbindEvents();
			this.unfreeze();
		}
		bindEvents() {
			this.unbindEvents();
			if (top.BX) {
				top.BX.Event.EventEmitter.subscribe('SidePanel.Slider:onOpen', this.handleSliderOpen);
				top.BX.Event.EventEmitter.subscribe('SidePanel.Slider:onCloseComplete', this.handleSliderClose);
				top.BX.Event.EventEmitter.subscribe('SidePanel.Slider:onDestroy', this.handleSliderDestroy);
			}
		}
		unbindEvents() {
			if (top.BX) {
				top.BX.Event.EventEmitter.unsubscribe('SidePanel.Slider:onOpen', this.handleSliderOpen);
				top.BX.Event.EventEmitter.unsubscribe('SidePanel.Slider:onCloseComplete', this.handleSliderClose);
				top.BX.Event.EventEmitter.unsubscribe('SidePanel.Slider:onDestroy', this.handleSliderDestroy);
			}
		}
		handleSliderOpen(event) {
			const [sliderEvent] = event.getData();
			const slider = sliderEvent.getSlider();
			if (!this.isPopupInSlider(slider)) {
				this.#sliders.add(slider);
				this.freeze();
			}
		}
		handleSliderClose(event) {
			const [sliderEvent] = event.getData();
			const slider = sliderEvent.getSlider();
			this.#sliders.delete(slider);
			if (this.#sliders.size === 0) {
				this.unfreeze();
			}
		}
		handleSliderDestroy(event) {
			const [sliderEvent] = event.getData();
			const slider = sliderEvent.getSlider();
			if (this.isPopupInSlider(slider)) {
				this.unbindEvents();
				this.#popup.destroy();
			} else {
				this.#sliders.delete(slider);
				if (this.#sliders.size === 0) {
					this.unfreeze();
				}
			}
		}
		isPopupInSlider(slider) {
			if (slider.getFrameWindow()) {
				return slider.getFrameWindow().document.contains(this.#popup.getPopupContainer());
			} else {
				return slider.getContainer().contains(this.#popup.getPopupContainer());
			}
		}
		freeze() {
			if (this.#frozen) {
				return;
			}
			this.#frozenProps = {
				autoHide: this.#popup.autoHide,
				closeByEsc: this.#popup.closeByEsc
			};
			this.#popup.setAutoHide(false);
			this.#popup.setClosingByEsc(false);
			main_core.Dom.style(this.#popup.getPopupContainer(), 'pointer-events', 'none');
			this.#frozen = true;
		}
		unfreeze() {
			if (!this.#frozen) {
				return;
			}
			this.#popup.setAutoHide(this.#frozenProps.autoHide !== false);
			this.#popup.setClosingByEsc(this.#frozenProps.closeByEsc !== false);
			main_core.Dom.style(this.#popup.getPopupContainer(), 'pointer-events', '');
			this.#frozen = false;
		}
	}

	exports.SidePanelIntegration = SidePanelIntegration;

})(this.BX.Tasks = this.BX.Tasks || {}, BX);
//# sourceMappingURL=side-panel-integration.bundle.js.map
