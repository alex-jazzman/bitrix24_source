/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, crm_ai_nameService, crm_integration_ui_bannerDispatcher, crm_router, main_core, main_core_events, main_popup, ui_buttons) {
	'use strict';

	const SHOW_TOUR_EVENT = 'BX.Crm.Timeline.Call:onShowCallScoringV2Tour';
	const ARROW_TIP_OFFSET = 5;
	const POPUP_WIDTH = 480;
	const VIDEO_URL = '/bitrix/js/crm/call-scoring-v2/timeline-promo/video/zefir-waving.webm';
	class TimelinePromo {
		#popup = null;
		#bannerDispatcher = null;
		#eventHandler = null;
		#actionParams = null;
		#closeOptionCategory;
		#closeOptionName;
		constructor(options = {}) {
			this.#closeOptionCategory = main_core.Type.isStringFilled(options.closeOptionCategory) ? options.closeOptionCategory : 'crm.tour';
			this.#closeOptionName = main_core.Type.isStringFilled(options.closeOptionName) ? options.closeOptionName : '';
		}
		show() {
			this.#unsubscribe();
			this.#eventHandler = event => {
				const {
					target,
					actionParams
				} = event.getData();
				if (!main_core.Type.isElementNode(target) || !main_core.Type.isObject(actionParams)) {
					return;
				}
				this.#actionParams = actionParams;
				this.#unsubscribe();
				this.#enqueue(target);
			};
			main_core_events.EventEmitter.subscribe(SHOW_TOUR_EVENT, this.#eventHandler);
		}
		close() {
			this.#unsubscribe();
			this.#popup?.close();
		}
		#unsubscribe() {
			if (this.#eventHandler !== null) {
				main_core_events.EventEmitter.unsubscribe(SHOW_TOUR_EVENT, this.#eventHandler);
				this.#eventHandler = null;
			}
		}
		#enqueue(chart) {
			this.#bannerDispatcher = new crm_integration_ui_bannerDispatcher.BannerDispatcher();
			this.#bannerDispatcher.toQueue(onDone => {
				const popup = this.#getPopup(chart);
				popup.subscribe('onAfterClose', onDone);
				popup.show();
			});
		}
		#getPopup(chart) {
			if (this.#popup === null) {
				this.#popup = new main_popup.Popup(this.#getPopupParams(chart));
			}
			return this.#popup;
		}
		#getPopupParams(chart) {
			const chartRect = chart.getBoundingClientRect();
			const offsetTop = ARROW_TIP_OFFSET;
			const offsetLeft = Math.round((chartRect.width - POPUP_WIDTH) / 2);
			return {
				id: 'crm-tour-call-scoring-v2-timeline',
				className: 'crm-tour-csv2-timeline-popup',
				content: this.#getContent(),
				bindElement: chart,
				bindOptions: {
					position: 'top',
					forceBindPosition: true,
					forceLeft: true
				},
				offsetTop,
				offsetLeft,
				width: POPUP_WIDTH,
				padding: 0,
				closeIcon: true,
				closeByEsc: true,
				cacheable: false,
				autoHide: true,
				borderRadius: '20px',
				contentBorderRadius: '20px',
				animation: 'fading-slide',
				events: {
					onPopupClose: () => {
						this.#saveSeen();
					}
				}
			};
		}
		#getContent() {
			const buttonContainer = main_core.Tag.render`<div class="crm-tour-csv2-timeline__actions"></div>`;
			this.#createPrimaryButton().renderTo(buttonContainer);
			return main_core.Tag.render`
			<div class="crm-tour-csv2-timeline">
				<div class="crm-tour-csv2-timeline__clip">
					<div class="crm-tour-csv2-timeline__media">
						${this.#renderVideo()}
					</div>
					<div class="crm-tour-csv2-timeline__body">
						<div class="crm-tour-csv2-timeline__title">
							${main_core.Loc.getMessage('CRM_CALL_SCORING_V2_TIMELINE_PROMO_TITLE', crm_ai_nameService.NameService.copilotNameReplacement())}
						</div>
						<div class="crm-tour-csv2-timeline__text">
							${main_core.Loc.getMessage('CRM_CALL_SCORING_V2_TIMELINE_PROMO_TEXT')}
						</div>
						${buttonContainer}
					</div>
				</div>
			</div>
		`;
		}
		#renderVideo() {
			const video = main_core.Tag.render`
			<video
				class="crm-tour-csv2-timeline__video"
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
				text: main_core.Loc.getMessage('CRM_CALL_SCORING_V2_TIMELINE_PROMO_BTN'),
				style: ui_buttons.AirButtonStyle.FILLED_SUCCESS,
				size: ui_buttons.Button.Size.MEDIUM,
				round: true,
				onclick: () => {
					this.#openAssessmentSlider().catch(error => {
						console.error('CRM.CallScoringV2.TimelinePromo: failed to open assessment slider', error);
					});
				}
			});
		}
		async #openAssessmentSlider() {
			this.close();
			if (this.#actionParams === null) {
				return;
			}
			if (this.#actionParams.isV2) {
				void crm_router.Router.Instance.openAiReportDrawer('call-assessment', {
					activityId: this.#actionParams.activityId,
					ownerTypeId: this.#actionParams.ownerTypeId,
					ownerId: this.#actionParams.ownerId,
					jobId: this.#actionParams.jobId ?? null,
					assessmentSettingsId: this.#actionParams.assessmentSettingsId ?? null
				});
				return;
			}
			await top.BX.Runtime.loadExtension('crm.ai.call');
			const dialog = new top.BX.Crm.AI.Call.CallQuality(this.#actionParams);
			dialog.open();
		}
		#saveSeen() {
			if (this.#closeOptionName === '') {
				return;
			}
			BX.userOptions.save(this.#closeOptionCategory, this.#closeOptionName, 'closed', 'Y');
		}
	}

	exports.TimelinePromo = TimelinePromo;

})(this.BX.Crm.CallScoringV2 = this.BX.Crm.CallScoringV2 || {}, BX.Crm.AI, BX.Crm.Integration.UI, BX.Crm, BX, BX.Event, BX.Main, BX.UI);
//# sourceMappingURL=timeline-promo.bundle.js.map
