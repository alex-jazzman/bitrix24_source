import { ajax, Loc, Tag } from 'main.core';
import { Popup, PopupOptions } from 'main.popup';
import { Button, ButtonSize, AirButtonStyle, ButtonState } from 'ui.buttons';
// @ts-ignore
import 'ui.design-tokens';
import { Icon, Outline } from 'ui.icon-set.api.core';
import { SetupTemplate } from 'bizproc.setup-template';

import { BannerDispatcher, Priority } from 'crm.integration.ui.banner-dispatcher';

import './style.css';

declare type OnboardingPopupOptions = {
	closeOptionCategory: string,
	closeOptionName: string,
	templateId: number,
};

const HELPDESK = 28_426_770;

declare type PopupOptionsExtended = {
	isScrollBlock: boolean,
} & PopupOptions;

export class OnboardingPopup
{
	private readonly closeOptionCategory: string;
	private readonly closeOptionName: string;
	private readonly templateId: number;

	private bannerDispatcher: BannerDispatcher;
	private popup: Popup | null = null;

	constructor(options: OnboardingPopupOptions)
	{
		this.closeOptionCategory = options.closeOptionCategory;
		this.closeOptionName = options.closeOptionName;
		this.templateId = options.templateId;

		this.bannerDispatcher = new BannerDispatcher();
	}

	show(): void
	{
		if (this.getPopup().isShown())
		{
			return;
		}

		this.bannerDispatcher.toQueue(
			(onDone: Function): Object => {
				this.getPopup().subscribe('onAfterClose', () => {
					onDone();
				});
				this.getPopup().show();

				return {};
			},
			Priority.CRITICAL,
		);
	}

	private getPopup(): Popup
	{
		if (this.popup === null)
		{
			this.popup = this.createPopup();
		}

		return this.popup;
	}

	private createPopup(): Popup
	{
		return new Popup(this.getPopupOptions());
	}

	private getPopupOptions(): PopupOptionsExtended
	{
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
				blur: 'blur(12px)',
			},
			animation: 'fading-slide',
			autoHide: false,
			borderRadius: '42px',
			events: {
				onclose: () => {
					// @ts-ignore
					BX.userOptions.save(this.closeOptionCategory, this.closeOptionName, 'closed', 'Y');
				},
			},
		};
	}

	private getPopupContent(): HTMLElement
	{
		const imopenlinesIcon = this.getIcon(Outline.OPEN_CHANNELS);
		const personIcon = this.getIcon(Outline.PERSON);
		const unc1Icon = this.getIcon(Outline.UNC_1);

		const configureButton = this.getConfigureButton();
		const helpdeskButton = this.getHelpDeskButton();

		const previewVideo = this.getPreviewVideo();

		return Tag.render`
			<div class="crm-imopenlines-ai-agent-onboarding-popup --ui-context-content-dark">
				<div class="crm-imopenlines-ai-agent-onboarding-popup__wrapper">
					<div class="crm-imopenlines-ai-agent-onboarding-popup__content">
						<div class="crm-imopenlines-ai-agent-onboarding-popup__title">${Loc.getMessage('CRM_IMOPENLINES_AI_AGENT_ONBOARDING_POPUP_TITLE')}</div>
						<div class="crm-imopenlines-ai-agent-onboarding-popup__description">${Loc.getMessage('CRM_IMOPENLINES_AI_AGENT_ONBOARDING_POPUP_DESCRIPTION')}</div>
						<div class="crm-imopenlines-ai-agent-onboarding-popup__benefit-list">
							<div class="crm-imopenlines-ai-agent-onboarding-popup__benefit-item">
								<div class="crm-imopenlines-ai-agent-onboarding-popup__benefit-item-icon">${imopenlinesIcon.render()}</div>
								<div class="crm-imopenlines-ai-agent-onboarding-popup__benefit-item-text">${Loc.getMessage('CRM_IMOPENLINES_AI_AGENT_ONBOARDING_POPUP_BENEFIT_1')}</div>
							</div>
							<div class="crm-imopenlines-ai-agent-onboarding-popup__benefit-item">
								<div class="crm-imopenlines-ai-agent-onboarding-popup__benefit-item-icon">${personIcon.render()}</div>
								<div class="crm-imopenlines-ai-agent-onboarding-popup__benefit-item-text">${Loc.getMessage('CRM_IMOPENLINES_AI_AGENT_ONBOARDING_POPUP_BENEFIT_2')}</div>
							</div>
							<div class="crm-imopenlines-ai-agent-onboarding-popup__benefit-item">
								<div class="crm-imopenlines-ai-agent-onboarding-popup__benefit-item-icon">${unc1Icon.render()}</div>
								<div class="crm-imopenlines-ai-agent-onboarding-popup__benefit-item-text">${Loc.getMessage('CRM_IMOPENLINES_AI_AGENT_ONBOARDING_POPUP_BENEFIT_3')}</div>
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

	private getIcon(icon: string): Icon
	{
		return new Icon({
			icon,
			size: 26,
			color: '#fff',
		});
	}

	private getConfigureButton(): Button
	{
		// @ts-ignore
		const configureButton = new Button({
			useAirDesign: true,
			style: AirButtonStyle.FILLED_SUCCESS,
			size: ButtonSize.EXTRA_LARGE,
			// @ts-ignore
			text: Loc.getMessage('CRM_IMOPENLINES_AI_AGENT_ONBOARDING_POPUP_BUTTON_CONFIGURE_TITLE'),
			// @ts-ignore
			onclick: async () => {
				configureButton.setState(ButtonState.WAITING);

				try
				{
					SetupTemplate.subscribeOnPull();

					await ajax.runAction('bizproc.v2.Integration.AiAgent.Template.copyAndStart', {
						method: 'POST',
						json: {
							templateId: this.templateId,
						},
					});

					this.getPopup().close();
				}
				catch (error)
				{
					console.error(error);
				}
				finally
				{
					configureButton.setState(ButtonState.ACTIVE);
				}
			},
		});

		return configureButton;
	}

	private getHelpDeskButton(): Button
	{
		// @ts-ignore
		return new Button({
			useAirDesign: true,
			style: AirButtonStyle.PLAIN,
			size: ButtonSize.EXTRA_LARGE,
			// @ts-ignore
			text: Loc.getMessage('CRM_IMOPENLINES_AI_AGENT_ONBOARDING_POPUP_BUTTON_HELPDESK_TITLE'),
			// @ts-ignore
			onclick: () => {
				// @ts-ignore
				if (top.BX.Helper)
				{
					// @ts-ignore
					top.BX.Helper.show(`redirect=detail&code=${HELPDESK}`);
				}
			},
		});
	}

	private getPreviewVideo(): HTMLElement
	{
		const previewVideoPath = '/bitrix/js/crm/integration/imopenlines/ai-agent/onboarding-popup/src/video/preview.webm';
		const previewVideo = Tag.render`
			<video
				src="${previewVideoPath}"
				autoplay
				preload
				loop
			></video>
		`;

		// eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-events-binding
		previewVideo.addEventListener('canplay', () => {
			previewVideo.muted = true;
			previewVideo.play();
		});

		return previewVideo;
	}
}
