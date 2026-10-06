/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, crm_integration_ui_bannerDispatcher, crm_ai_nameService, crm_router, main_core, main_popup, ui_buttons) {
	'use strict';

	const VIDEO_URL = '/bitrix/js/crm/call-scoring-v2/script-created-popup/video/zefir.webm';
	const HELP_ARTICLE_CODE = '18114500'; // @todo replace with the real article code
	const KIND_ENRICHED = 'enriched';
	class ScriptCreatedPopup {
		#popup = null;
		#bannerDispatcher = null;
		#closeOptionCategory;
		#closeOptionName;
		#scriptId;
		#kind;
		constructor(options = {}) {
			this.#closeOptionCategory = main_core.Type.isStringFilled(options.closeOptionCategory) ? options.closeOptionCategory : 'crm.tour';
			this.#closeOptionName = main_core.Type.isStringFilled(options.closeOptionName) ? options.closeOptionName : '';
			this.#scriptId = main_core.Type.isNumber(options.scriptId) && options.scriptId > 0 ? options.scriptId : 0;
			this.#kind = main_core.Type.isStringFilled(options.kind) ? options.kind : '';
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
				id: 'crm-tour-call-scoring-v2',
				className: 'crm-tour-csv2-popup',
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
			const buttons = main_core.Tag.render`<div class="crm-tour-csv2__buttons"></div>`;
			this.#createPrimaryButton().renderTo(buttons);
			this.#createSecondaryButton().renderTo(buttons);
			return main_core.Tag.render`
			<div class="crm-tour-csv2">
				<div class="crm-tour-csv2__content">
					<h2 class="crm-tour-csv2__title">
						${main_core.Loc.getMessage('CRM_CALL_SCORING_V2_SCRIPT_CREATED_TITLE', {
			'#GPT_START#': '<span class="crm-tour-csv2__gpt">',
			'#GPT_END#': '</span>',
			...crm_ai_nameService.NameService.copilotNameReplacement()
		})}
					</h2>
					<div class="crm-tour-csv2__subtitle">
						${main_core.Loc.getMessage(this.#getSubtitleMessageCode(), {
			'#GPT_START#': '<span class="crm-tour-csv2__gpt">',
			'#GPT_END#': '</span>'
		})}
					</div>
					${buttons}
				</div>
				<div class="crm-tour-csv2__media">
					${this.#renderVideo()}
				</div>
			</div>
		`;
		}
		#createPrimaryButton() {
			return new ui_buttons.Button({
				useAirDesign: true,
				text: main_core.Loc.getMessage('CRM_CALL_SCORING_V2_SCRIPT_CREATED_BTN_PRIMARY'),
				style: ui_buttons.AirButtonStyle.FILLED,
				size: ui_buttons.Button.Size.LARGE,
				round: true,
				onclick: () => {
					this.#openScriptSlider();
				}
			});
		}
		#openScriptSlider() {
			if (this.#scriptId <= 0) {
				return;
			}
			crm_router.Router.Instance.openCallAssessmentSlider(this.#scriptId, {
				allowChangeHistory: false
			});
		}
		#createSecondaryButton() {
			return new ui_buttons.Button({
				useAirDesign: true,
				text: main_core.Loc.getMessage('CRM_CALL_SCORING_V2_SCRIPT_CREATED_BTN_SECONDARY'),
				style: ui_buttons.AirButtonStyle.PLAIN_NO_ACCENT,
				size: ui_buttons.Button.Size.LARGE,
				round: true,
				onclick: () => {
					this.#openHelpArticle();
				}
			});
		}
		#openHelpArticle() {
			const Helper = main_core.Reflection.getClass('top.BX.Helper');
			Helper?.show(`redirect=detail&code=${HELP_ARTICLE_CODE}`);
		}
		#getSubtitleMessageCode() {
			return this.#kind === KIND_ENRICHED ? 'CRM_CALL_SCORING_V2_SCRIPT_CREATED_SUBTITLE_ENRICHED' : 'CRM_CALL_SCORING_V2_SCRIPT_CREATED_SUBTITLE';
		}
		#renderVideo() {
			const video = main_core.Tag.render`
			<video
				class="crm-tour-csv2__video"
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
		#saveSeen() {
			if (this.#closeOptionName === '') {
				return;
			}
			BX.userOptions.save(this.#closeOptionCategory, this.#closeOptionName, 'closed', 'Y');
		}
	}

	exports.ScriptCreatedPopup = ScriptCreatedPopup;

})(this.BX.Crm.CallScoringV2 = this.BX.Crm.CallScoringV2 || {}, BX.Crm.Integration.UI, BX.Crm.AI, BX.Crm, BX, BX.Main, BX.UI);
//# sourceMappingURL=script-created-popup.bundle.js.map
