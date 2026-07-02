/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, crm_integration_analytics, crm_integration_ui_bannerDispatcher, main_core, main_popup, ui_analytics, ui_buttons, ui_iconSet_api_core) {
	'use strict';

	const MAX_STEP_NUMBER = 3;
	class OnboardingPopup {
		#bannerDispatcher = null;
		#popup = null;
		#originalOverflowValue = null;
		#targetContainer = null;
		#step = 0;
		#closeOptionName = null;
		#closeOptionCategory = null;
		#analytics = null;
		constructor(params) {
			this.#closeOptionName = params?.closeOptionName ?? null;
			this.#closeOptionCategory = params?.closeOptionCategory ?? null;
			this.#analytics = params?.analytics ?? {};
		}
		show() {
			if (this.#getPopup().isShown()) {
				return;
			}
			this.#bannerDispatcher = new crm_integration_ui_bannerDispatcher.BannerDispatcher();
			this.#bannerDispatcher.toQueue(onDone => {
				this.#setTargetOverflow('hidden');
				this.#getPopup().subscribe('onAfterClose', onDone);
				this.#getPopup().show();
			}, crm_integration_ui_bannerDispatcher.Priority.CRITICAL);
		}
		#getPopup() {
			if (this.#popup === null) {
				this.#popup = this.#createPopup();
			}
			return this.#popup;
		}
		#createPopup() {
			return new main_popup.Popup(this.#getPopupParams());
		}
		#getPopupParams() {
			return {
				id: 'crm_repeat_sale_onboarding_popup',
				targetContainer: this.#getTarget(),
				content: this.#getPopupContent(),
				cacheable: true,
				isScrollBlock: false,
				className: 'crm-repeat-sale-onboarding-popup',
				closeByEsc: true,
				closeIcon: true,
				padding: 16,
				width: 733,
				overlay: {
					opacity: 40,
					backgroundColor: '#000000'
				},
				animation: 'fading-slide',
				autoHide: false,
				events: {
					onFirstShow: () => {
						this.#sendViewAnalytics();
					},
					onclose: () => {
						this.#resetTargetOverflow();
						BX.userOptions.save(this.#closeOptionCategory, this.#closeOptionName, 'closed', 'Y');
						this.#sendCloseAnalytics();
					}
				}
			};
		}
		#getPopupContent() {
			const icon = new ui_iconSet_api_core.Icon({
				size: 29,
				color: '#853AF5',
				icon: ui_iconSet_api_core.Outline.COPILOT
			});
			return main_core.Tag.render`
			<div class="crm-repeat-sale__onboarding-popup-container">
				<div class="crm-repeat-sale__onboarding-popup-title">
					${main_core.Loc.getMessage('CRM_REPEAT_SALE_ONBOARDING_TITLE')}
					${icon.render()}
				</div>
				<div class="crm-repeat-sale__onboarding-popup-video">
					<div>
						${this.#renderVideo()}
					</div>
				</div>
				<div class="crm-repeat-sale__onboarding-popup-content">
					${this.#getStepContent()}
				</div>
			</div>
		`;
		}
		#renderVideo() {
			const videoElement = main_core.Tag.render`
			<video
				src="${this.#getVideoPath()}"
				autoplay
				preload
				loop
			></video>
		`;

			// eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-events-binding
			videoElement.addEventListener('canplay', () => {
				videoElement.muted = true;
				videoElement.play();
			});
			return videoElement;
		}
		#getVideoPath() {
			const region = main_core.Extension.getSettings('crm.repeat-sale.onboarding-popup').get('region');
			let name = 'how-it-work-en';
			if (['kz', 'ru', 'by', 'uz'].includes(region)) {
				name = 'how-it-work-ru';
			}
			return `/bitrix/js/crm/repeat-sale/onboarding-popup/video/${name}.webm`;
		}
		#getStepContent() {
			return main_core.Tag.render`
			<div class="crm-repeat-sale__onboarding-popup-step-container">
				<div class="crm-repeat-sale__onboarding-popup-step-text">
					${main_core.Loc.getMessage(`CRM_REPEAT_SALE_ONBOARDING_TEXT_STEP_${this.#step}`)}
				</div>
				<div class="crm-repeat-sale__onboarding-popup-button">
					${this.#getButton().render()}
				</div>
			</div>
		`;
		}
		#getButton() {
			const style = this.#isLastStep() ? ui_buttons.AirButtonStyle.TINTED : ui_buttons.AirButtonStyle.FILLED_COPILOT;
			const icon = this.#isLastStep() ? ui_iconSet_api_core.Outline.CHECK_M : ui_iconSet_api_core.Outline.NEXT;
			return new ui_buttons.Button({
				useAirDesign: true,
				text: this.#getButtonText(),
				round: true,
				size: BX.UI.Button.Size.LARGE,
				icon,
				style,
				onclick: () => {
					if (this.#isLastStep()) {
						this.#getPopup().close();
						this.#getPopup().destroy();
					} else {
						this.#goToNextStep();
					}
				}
			});
		}
		#getButtonText() {
			const code = this.#isLastStep() ? 'CRM_REPEAT_SALE_ONBOARDING_BUTTON_CLOSE' : 'CRM_REPEAT_SALE_ONBOARDING_BUTTON_NEXT';
			return main_core.Loc.getMessage(code);
		}
		#isLastStep() {
			return this.#step === MAX_STEP_NUMBER;
		}
		#goToNextStep() {
			this.#step++;
			main_core.Dom.replace(document.querySelector('.crm-repeat-sale__onboarding-popup-step-container'), this.#getStepContent());
			this.#sendClickAnalytics();
		}
		#setTargetOverflow(value) {
			this.#originalOverflowValue = main_core.Dom.style(this.#getTarget(), 'overflow');
			main_core.Dom.style(this.#getTarget(), 'overflow', value);
		}
		#resetTargetOverflow() {
			if (this.#originalOverflowValue === null) {
				return;
			}
			main_core.Dom.style(this.#getTarget(), 'overflow', this.#originalOverflowValue);
			this.#originalOverflowValue = null;
		}
		#getTarget() {
			if (this.#targetContainer === null) {
				this.#targetContainer = document.body;
			}
			return this.#targetContainer;
		}
		#sendViewAnalytics() {
			this.#sendAnalytics('view');
		}
		#sendCloseAnalytics() {
			this.#sendAnalytics('close');
		}
		#sendClickAnalytics() {
			this.#sendAnalytics('click');
		}
		#sendAnalytics(eventName) {
			const type = crm_integration_analytics.Dictionary.TYPE_REPEAT_SALE_BANNER_NULL;
			const subSection = this.#analytics.c_sub_section ?? crm_integration_analytics.Dictionary.SUB_SECTION_KANBAN;
			let instance = null;
			if (eventName === 'view') {
				instance = crm_integration_analytics.Builder.RepeatSale.Banner.ViewEvent.createDefault(type, subSection);
			} else if (eventName === 'close') {
				instance = crm_integration_analytics.Builder.RepeatSale.Banner.CloseEvent.createDefault(type, subSection);
			} else if (eventName === 'click') {
				instance = crm_integration_analytics.Builder.RepeatSale.Banner.ClickEvent.createDefault(type, subSection);
			}
			if (instance) {
				const section = this.#analytics.c_section ?? '';
				ui_analytics.sendData(instance.setSection(section).buildData());
			}
		}
	}

	exports.OnboardingPopup = OnboardingPopup;

})(this.BX.Crm.RepeatSale = this.BX.Crm.RepeatSale || {}, BX.Crm.Integration.Analytics, BX.Crm.Integration.UI, BX, BX.Main, BX.UI.Analytics, BX.UI, BX.UI.IconSet);
//# sourceMappingURL=onboarding-popup.bundle.js.map
