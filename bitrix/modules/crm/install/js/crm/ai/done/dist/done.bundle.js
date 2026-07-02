/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, main_core) {
	'use strict';

	class Done {
		#showSlider(Slider) {
			const topSlider = BX?.SidePanel?.Instance?.getTopSlider();
			const width = topSlider?.getWidth();
			const sliderWidth = width ? Math.floor(width * 0.86) : Math.floor(window.screen.width * 0.86);
			const opts = {
				content: this.#renderContent,
				url: 'crm:copilot-wrapper-slider-done',
				width: sliderWidth
			};
			const slider = new Slider(opts);
			slider.open();
		}
		#renderContent() {
			const message = main_core.Loc.getMessage('CRM_COPILOT_WRAPPER_ALL_IS_DONE');
			return `
			<div class="crm-copilot-wrapper-slider-done">
				<div class="crm-copilot-wrapper-slider-done__message">
					<div class="crm-copilot-wrapper-slider-done__message-icon"></div>
					<div class="crm-copilot-wrapper-slider-done__message-text">${message}</div>
				</div> 
			</div>
		`;
		}
		start() {
			if (BX.Crm && main_core.Type.isFunction(BX.Crm.AI.Slider)) {
				this.#showSlider(BX.Crm.AI.Slider);
			} else {
				top.BX.Runtime.loadExtension('crm.ai.slider').then(exports$1 => {
					const {
						Slider
					} = exports$1;
					this.#showSlider(Slider);
				}).catch(err => {
					throw new Error('Cant load Crm.AI.Slider extension');
				});
			}
		}
	}

	exports.Done = Done;

})(this.BX.Crm.AI = this.BX.Crm.AI || {}, BX);
//# sourceMappingURL=done.bundle.js.map
