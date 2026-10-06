/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, crm_ai_nameService, crm_integration_ui_bannerDispatcher, main_core, main_popup, ui_buttons) {
	'use strict';

	const VIDEO_URL = '/bitrix/js/crm/call-scoring-v2/script-created-popup/video/zefir.webm';
	const HELP_ARTICLE_CODE = '23240682';
	class PromoPopup {
		#popup = null;
		#bannerDispatcher = null;
		#closeOptionCategory;
		#closeOptionName;
		constructor(options = {}) {
			this.#closeOptionCategory = main_core.Type.isStringFilled(options.closeOptionCategory) ? options.closeOptionCategory : 'crm.tour';
			this.#closeOptionName = main_core.Type.isStringFilled(options.closeOptionName) ? options.closeOptionName : '';
		}
		show() {
			if (this.#getPopup().isShown()) {
				return;
			}
			this.#bannerDispatcher = new crm_integration_ui_bannerDispatcher.BannerDispatcher();
			this.#bannerDispatcher.toQueue(onDone => {
				this.#getPopup().subscribe('onAfterClose', onDone);
				this.#getPopup().show();
			});
		}
		close() {
			this.#popup?.close();
		}
		#getPopup() {
			if (this.#popup === null) {
				this.#popup = new main_popup.Popup(this.#getPopupParams());
			}
			return this.#popup;
		}
		#getPopupParams() {
			return {
				id: 'crm-tour-call-scoring-v2-promo',
				className: 'crm-tour-csv2-promo',
				content: this.#getContent(),
				width: 820,
				padding: 0,
				closeIcon: true,
				closeByEsc: true,
				cacheable: false,
				contentBackground: 'transparent',
				borderRadius: '20px',
				contentBorderRadius: '20px',
				overlay: {
					opacity: 40
				},
				animation: 'fading-slide',
				events: {
					onPopupClose: () => {
						this.#saveSeen();
					}
				}
			};
		}
		#getContent() {
			const buttons = main_core.Tag.render`<div class="crm-tour-csv2-promo__buttons"></div>`;
			this.#createPrimaryButton().renderTo(buttons);
			this.#createSecondaryButton().renderTo(buttons);
			const copilotName = crm_ai_nameService.NameService.copilotNameReplacement();
			return main_core.Tag.render`
			<div class="crm-tour-csv2-promo__layout">
				<div class="crm-tour-csv2-promo__content">
					<h2 class="crm-tour-csv2-promo__title">
						${main_core.Loc.getMessage('CRM_CALL_SCORING_V2_PROMO_TITLE', {
			'#ACCENT_START#': '<span class="crm-tour-csv2-promo__title-accent">',
			'#ACCENT_END#': '</span>'
		})}
					</h2>
					<div class="crm-tour-csv2-promo__banner">
						<span class="crm-tour-csv2-promo__banner-icon"></span>
						<div class="crm-tour-csv2-promo__banner-body">
							<div class="crm-tour-csv2-promo__banner-title">
								${main_core.Loc.getMessage('CRM_CALL_SCORING_V2_PROMO_BANNER_TITLE', copilotName)}
							</div>
							<div class="crm-tour-csv2-promo__banner-text">
								${main_core.Loc.getMessage('CRM_CALL_SCORING_V2_PROMO_BANNER_TEXT')}
							</div>
						</div>
						<span class="crm-tour-csv2-promo__banner-arrow"></span>
					</div>
					<div class="crm-tour-csv2-promo__feature">
						<span class="crm-tour-csv2-promo__feature-icon"></span>
						<div class="crm-tour-csv2-promo__feature-body">
							<div class="crm-tour-csv2-promo__feature-title">
								${main_core.Loc.getMessage('CRM_CALL_SCORING_V2_PROMO_FEATURE_TITLE')}
							</div>
							<div class="crm-tour-csv2-promo__feature-text">
								${main_core.Loc.getMessage('CRM_CALL_SCORING_V2_PROMO_FEATURE_TEXT')}
							</div>
						</div>
					</div>
					${buttons}
				</div>
				<div class="crm-tour-csv2-promo__media">
					${this.#renderVideo()}
				</div>
			</div>
		`;
		}
		#renderVideo() {
			const video = main_core.Tag.render`
			<video
				class="crm-tour-csv2-promo__video"
				autoplay
				loop
				muted
				playsinline
				preload="auto"
			>
				<source src="${VIDEO_URL}" type="video/webm">
			</video>
		`;
			main_core.Event.bind(video, 'canplay', () => {
				video.muted = true;
				video.play().catch(() => {});
			});
			return video;
		}
		#createPrimaryButton() {
			return new ui_buttons.Button({
				useAirDesign: true,
				text: main_core.Loc.getMessage('CRM_CALL_SCORING_V2_PROMO_BTN_PRIMARY'),
				style: ui_buttons.AirButtonStyle.FILLED_BITRIX_GPT,
				size: ui_buttons.Button.Size.LARGE,
				round: true,
				onclick: () => {
					this.close();
				}
			});
		}
		#createSecondaryButton() {
			return new ui_buttons.Button({
				useAirDesign: true,
				text: main_core.Loc.getMessage('CRM_CALL_SCORING_V2_PROMO_BTN_SECONDARY'),
				style: ui_buttons.AirButtonStyle.PLAIN_NO_ACCENT,
				size: ui_buttons.Button.Size.LARGE,
				round: true,
				onclick: () => {
					this.#openHelpArticle();
				}
			});
		}
		#openHelpArticle() {
			window.top.BX?.Helper?.show(`redirect=detail&code=${HELP_ARTICLE_CODE}`);
		}
		#saveSeen() {
			if (this.#closeOptionName === '') {
				return;
			}
			BX.userOptions.save(this.#closeOptionCategory, this.#closeOptionName, 'closed', 'Y');
		}
	}

	exports.PromoPopup = PromoPopup;

})(this.BX.Crm.CallScoringV2 = this.BX.Crm.CallScoringV2 || {}, BX.Crm.AI, BX.Crm.Integration.UI, BX, BX.Main, BX.UI);
//# sourceMappingURL=promo-popup.bundle.js.map
