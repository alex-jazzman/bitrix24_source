/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
this.BX.Crm.Integration = this.BX.Crm.Integration || {};
this.BX.Crm.Integration.Imopenlines = this.BX.Crm.Integration.Imopenlines || {};
(function (exports, main_core, main_popup, ui_buttons, ui_designTokens, ui_iconSet_api_core, bizproc_setupTemplate, crm_integration_ui_bannerDispatcher) {
	'use strict';

	const HELPDESK = 28_426_770;
	class OnboardingPopup {
		closeOptionCategory;
		closeOptionName;
		templateId;
		bannerDispatcher;
		popup = null;
		constructor(options) {
			this.closeOptionCategory = options.closeOptionCategory;
			this.closeOptionName = options.closeOptionName;
			this.templateId = options.templateId;
			this.bannerDispatcher = new crm_integration_ui_bannerDispatcher.BannerDispatcher();
		}
		show() {
			if (this.getPopup().isShown()) {
				return;
			}
			this.bannerDispatcher.toQueue(onDone => {
				this.getPopup().subscribe('onAfterClose', () => {
					onDone();
				});
				this.getPopup().show();
				return {};
			}, crm_integration_ui_bannerDispatcher.Priority.CRITICAL);
		}
		getPopup() {
			if (this.popup === null) {
				this.popup = this.createPopup();
			}
			return this.popup;
		}
		createPopup() {
			return new main_popup.Popup(this.getPopupOptions());
		}
		getPopupOptions() {
			return {
				id: 'crm_imopenlines_ai_agent_onboarding_popup',
				targetContainer: document.body,
				content: this.getPopupContent(),
				cacheable: true,
				isScrollBlock: false,
				className: 'crm-imopenlines-ai-agent-onboarding-popup',
				closeByEsc: true,
				closeIcon: true,
				padding: 0,
				overlay: {
					opacity: 50,
					backgroundColor: 'rgb(0, 32, 78)',
					blur: 'blur(12px)'
				},
				animation: 'fading-slide',
				autoHide: false,
				borderRadius: '42px',
				events: {
					onclose: () => {
						BX.userOptions.save(this.closeOptionCategory, this.closeOptionName, 'closed', 'Y');
					}
				}
			};
		}
		getPopupContent() {
			const imopenlinesIcon = this.getIcon(ui_iconSet_api_core.Outline.OPEN_CHANNELS);
			const personIcon = this.getIcon(ui_iconSet_api_core.Outline.PERSON);
			const unc1Icon = this.getIcon(ui_iconSet_api_core.Outline.UNC_1);
			const configureButton = this.getConfigureButton();
			const helpdeskButton = this.getHelpDeskButton();
			const previewVideo = this.getPreviewVideo();
			return main_core.Tag.render`
			<div class="crm-imopenlines-ai-agent-onboarding-popup --ui-context-content-dark">
				<div class="crm-imopenlines-ai-agent-onboarding-popup__wrapper">
					<div class="crm-imopenlines-ai-agent-onboarding-popup__content">
						<div class="crm-imopenlines-ai-agent-onboarding-popup__title">${main_core.Loc.getMessage('CRM_IMOPENLINES_AI_AGENT_ONBOARDING_POPUP_TITLE')}</div>
						<div class="crm-imopenlines-ai-agent-onboarding-popup__description">${main_core.Loc.getMessage('CRM_IMOPENLINES_AI_AGENT_ONBOARDING_POPUP_DESCRIPTION')}</div>
						<div class="crm-imopenlines-ai-agent-onboarding-popup__benefit-list">
							<div class="crm-imopenlines-ai-agent-onboarding-popup__benefit-item">
								<div class="crm-imopenlines-ai-agent-onboarding-popup__benefit-item-icon">${imopenlinesIcon.render()}</div>
								<div class="crm-imopenlines-ai-agent-onboarding-popup__benefit-item-text">${main_core.Loc.getMessage('CRM_IMOPENLINES_AI_AGENT_ONBOARDING_POPUP_BENEFIT_1')}</div>
							</div>
							<div class="crm-imopenlines-ai-agent-onboarding-popup__benefit-item">
								<div class="crm-imopenlines-ai-agent-onboarding-popup__benefit-item-icon">${personIcon.render()}</div>
								<div class="crm-imopenlines-ai-agent-onboarding-popup__benefit-item-text">${main_core.Loc.getMessage('CRM_IMOPENLINES_AI_AGENT_ONBOARDING_POPUP_BENEFIT_2')}</div>
							</div>
							<div class="crm-imopenlines-ai-agent-onboarding-popup__benefit-item">
								<div class="crm-imopenlines-ai-agent-onboarding-popup__benefit-item-icon">${unc1Icon.render()}</div>
								<div class="crm-imopenlines-ai-agent-onboarding-popup__benefit-item-text">${main_core.Loc.getMessage('CRM_IMOPENLINES_AI_AGENT_ONBOARDING_POPUP_BENEFIT_3')}</div>
							</div>
						</div>
						<div class="crm-imopenlines-ai-agent-onboarding-popup__controls">
							${configureButton.render()}
							${helpdeskButton.render()}
						</div>
					</div>
					<div class="crm-imopenlines-ai-agent-onboarding-popup__preview">
						<div class="crm-imopenlines-ai-agent-onboarding-popup__preview-wrapper">
							<div class="crm-imopenlines-ai-agent-onboarding-popup__video">
								${previewVideo}
							</div>
						</div>
					</div>
				</div>
			</div>
		`;
		}
		getIcon(icon) {
			return new ui_iconSet_api_core.Icon({
				icon,
				size: 26,
				color: '#fff'
			});
		}
		getConfigureButton() {
			const configureButton = new ui_buttons.Button({
				useAirDesign: true,
				style: ui_buttons.AirButtonStyle.FILLED_SUCCESS,
				size: ui_buttons.ButtonSize.EXTRA_LARGE,
				text: main_core.Loc.getMessage('CRM_IMOPENLINES_AI_AGENT_ONBOARDING_POPUP_BUTTON_CONFIGURE_TITLE'),
				onclick: async () => {
					configureButton.setState(ui_buttons.ButtonState.WAITING);
					try {
						bizproc_setupTemplate.SetupTemplate.subscribeOnPull();
						await main_core.ajax.runAction('bizproc.v2.Integration.AiAgent.Template.copyAndStart', {
							method: 'POST',
							json: {
								templateId: this.templateId
							}
						});
						this.getPopup().close();
					} catch (error) {
						console.error(error);
					} finally {
						configureButton.setState(ui_buttons.ButtonState.ACTIVE);
					}
				}
			});
			return configureButton;
		}
		getHelpDeskButton() {
			return new ui_buttons.Button({
				useAirDesign: true,
				style: ui_buttons.AirButtonStyle.PLAIN,
				size: ui_buttons.ButtonSize.EXTRA_LARGE,
				text: main_core.Loc.getMessage('CRM_IMOPENLINES_AI_AGENT_ONBOARDING_POPUP_BUTTON_HELPDESK_TITLE'),
				onclick: () => {
					if (top.BX.Helper) {
						top.BX.Helper.show(`redirect=detail&code=${HELPDESK}`);
					}
				}
			});
		}
		getPreviewVideo() {
			const previewVideoPath = '/bitrix/js/crm/integration/imopenlines/ai-agent/onboarding-popup/src/video/preview.webm';
			const previewVideo = main_core.Tag.render`
			<video
				src="${previewVideoPath}"
				autoplay
				preload
				loop
			></video>
		`;
			previewVideo.addEventListener('canplay', () => {
				previewVideo.muted = true;
				previewVideo.play();
			});
			return previewVideo;
		}
	}

	exports.OnboardingPopup = OnboardingPopup;

})(this.BX.Crm.Integration.Imopenlines.AiAgent = this.BX.Crm.Integration.Imopenlines.AiAgent || {}, BX, BX.Main, BX.UI, BX, BX.UI.IconSet, BX.Bizproc, BX.Crm.Integration.UI);
//# sourceMappingURL=onboarding-popup.bundle.js.map
