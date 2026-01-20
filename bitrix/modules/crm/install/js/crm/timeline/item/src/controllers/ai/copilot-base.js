import { Router } from 'crm.router';
import { ajax as Ajax, Loc, Runtime, Text, Type } from 'main.core';
import { Button as ButtonUI, ButtonState } from 'ui.buttons';
import { MessageBox, MessageBoxButtons } from 'ui.dialogs.messagebox';
import { FeaturePromotersRegistry } from 'ui.info-helper';
import { UI } from 'ui.notification';

import { Button } from '../../components/layout/button';
import ConfigurableItem from '../../configurable-item';
import { Base } from '../base';

const COPILOT_BUTTON_DISABLE_DELAY = 5000;
const COPILOT_HELPDESK_CODE = 18_799_442;

declare type CoPilotAdditionalInfoData =
{
	sliderCode: ?string,
	isAiMarketplaceAppsExist: ?boolean,
	isCopilotBannerNeedShow: ?boolean,
	code: ?string,
	msgPlainText: ?string,
	msgHtml: ?string,
	msgBBCode: ?string,
}

export type CopilotConfig =
{
	actionEndpoint: string,
	validEntityTypes: Array<number>,
	agreementContext: string,
	onPreLaunch?: (item: ConfigurableItem, actionData: Object) => void,
	onPostLaunch?: (item: ConfigurableItem, actionData: Object, response: Object) => void,
	onError?: (item: ConfigurableItem, actionData: Object, error: Object) => void,
}

export class CopilotBase extends Base
{
	#copilotConfig: CopilotConfig;

	constructor()
	{
		super();

		this.#copilotConfig = this.getCopilotConfig();
	}

	// region Methods to override
	getCopilotConfig(): CopilotConfig
	{
		console.error('Method "getCopilotConfig" must be overridden');
	}

	showCopilotBanner(item: ConfigurableItem, actionData: Object): void
	{}

	getAdditionalRequestData(actionData: Object): Object
	{
		return {};
	}

	useInfoHelper(): boolean
	{
		return false;
	}

	supportsCopilotBanner(): boolean
	{
		return false;
	}
	// endregion

	async handleCopilotLaunch(item: ConfigurableItem, actionData: Object): Promise<void>
	{
		const isCopilotAgreementNeedShow = actionData.isCopilotAgreementNeedShow || false;
		if (isCopilotAgreementNeedShow)
		{
			await this.#showCopilotAgreement(item, actionData);
		}
		else
		{
			this.#launchCopilot(item, actionData);
		}
	}

	showMarketMessageBox(): void
	{
		MessageBox.show({
			title: Loc.getMessage('CRM_TIMELINE_ITEM_AI_PROVIDER_POPUP_TITLE'),
			message: Loc.getMessage('CRM_TIMELINE_ITEM_AI_PROVIDER_POPUP_TEXT', {
				'[helpdesklink]': `<br><br><a href="##" onclick="top.BX.Helper.show('redirect=detail&code=${COPILOT_HELPDESK_CODE}');">`,
				'[/helpdesklink]': '</a>',
			}),
			modal: true,
			buttons: MessageBoxButtons.OK_CANCEL,
			okCaption: Loc.getMessage('CRM_TIMELINE_ITEM_AI_PROVIDER_POPUP_OK_TEXT'),
			onOk: () => Router.openSlider(Loc.getMessage('AI_APP_COLLECTION_MARKET_LINK')),
			onCancel: (messageBox) => messageBox.close(),
		});
	}

	async #showCopilotAgreement(item: ConfigurableItem, actionData: Object): Promise<void>
	{
		try
		{
			const { CopilotAgreement } = await Runtime.loadExtension('ai.copilot-agreement');

			const copilotAgreementPopup = new CopilotAgreement({
				moduleId: 'crm',
				contextId: this.#copilotConfig.agreementContext,
				events: {
					onAccept: () => this.#launchCopilot(item, actionData),
				},
			});

			const isAgreementAccepted = await copilotAgreementPopup.checkAgreement();
			if (isAgreementAccepted)
			{
				this.#launchCopilot(item, actionData);
			}
		}
		catch
		{
			await console.error('Cant load "ai.copilot-agreement" extension');
		}
	}

	#launchCopilot(item: ConfigurableItem, actionData: Object): void
	{
		if (!this.#validateCopilotParams(actionData))
		{
			throw new Error('Invalid "actionData" parameters');
		}

		const aiCopilotBtn = this.#getCopilotButton(item);
		const aiCopilotBtnUI = aiCopilotBtn.getUiButton();
		const prevState = aiCopilotBtnUI.getState();

		if (aiCopilotBtnUI.getState() === ButtonState.AI_WAITING)
		{
			return;
		}

		this.#copilotConfig.onPreLaunch?.(item, actionData);

		aiCopilotBtnUI.setState(ButtonState.AI_WAITING);

		this.#executeCopilotRequest(actionData)
			.then((response) => {
				this.#copilotConfig.onPostLaunch?.(item, actionData, response);
			})
			.catch((response) => {
				this.#handleCopilotError(item, actionData, response, aiCopilotBtnUI, prevState);
			});
	}

	#validateCopilotParams(actionData: Object): boolean
	{
		return Type.isNumber(actionData.activityId)
			&& Type.isNumber(actionData.ownerId)
			&& Type.isNumber(actionData.ownerTypeId)
			&& this.#copilotConfig.validEntityTypes.includes(parseInt(actionData.ownerTypeId, 10))
		;
	}

	#getCopilotButton(item: ConfigurableItem): Button
	{
		const aiCopilotBtn = item.getLayoutFooterButtonById('aiButton');
		if (!aiCopilotBtn)
		{
			throw new Error('"CoPilot" button is not found in layout');
		}

		return aiCopilotBtn;
	}

	#executeCopilotRequest(actionData: Object): Promise
	{
		return Ajax.runAction(this.#copilotConfig.actionEndpoint, {
			data: {
				activityId: actionData.activityId,
				ownerTypeId: actionData.ownerTypeId,
				ownerId: actionData.ownerId,
				...this.getAdditionalRequestData(actionData),
			},
		});
	}

	#handleCopilotError(
		item: ConfigurableItem,
		actionData: Object,
		response: Object,
		btnUI: ButtonUI,
		prevState: string,
	): void
	{
		const customData: ?CoPilotAdditionalInfoData = response.errors[0].customData;
		if (customData)
		{
			this.#showAdditionalInfo(customData, item, actionData);

			btnUI.setState(prevState || ButtonState.ACTIVE);
		}
		else
		{
			this.#showGenericError(response, btnUI);
		}

		this.#copilotConfig.onError?.(item, actionData, response);

		throw response;
	}

	#showGenericError(response: Object, btnUI: ButtonUI): void
	{
		btnUI.setState(ButtonState.DISABLED);

		UI.Notification.Center.notify({
			content: Text.encode(response.errors[0].message),
			autoHideDelay: COPILOT_BUTTON_DISABLE_DELAY,
		});

		setTimeout(() => {
			btnUI.setState(ButtonState.ACTIVE);
		}, COPILOT_BUTTON_DISABLE_DELAY);
	}

	#showAdditionalInfo(data: CoPilotAdditionalInfoData, item: ConfigurableItem, actionData: Object): void
	{
		if (this.#isSliderCodeExist(data))
		{
			this.#handleSliderCode(data, item);
		}
		else if (this.#isAiMarketplaceAppsExist(data))
		{
			if (this.#shouldShowCopilotBanner(data))
			{
				this.showCopilotBanner(item, actionData);
			}
			else
			{
				this.showMarketMessageBox();
			}
		}
		else if (data.code === 'blocked_provider')
		{
			if (Type.isStringFilled(data.sliderCode))
			{
				this.#showInfoSlider(data.sliderCode);
				return;
			}

			let msg = '';
			if (Type.isStringFilled(data.msgPlainText))
			{
				msg = data.msgPlainText;
			}

			if (Type.isStringFilled(data.msgHtml))
			{
				msg = data.msgHtml;
			}

			UI.Notification.Center.notify({
				content: msg,
				autoHideDelay: COPILOT_BUTTON_DISABLE_DELAY,
			});
		}
		else
		{
			this.#showFeedbackMessageBox();
		}
	}

	#shouldShowCopilotBanner(data: CoPilotAdditionalInfoData): boolean
	{
		return data.isCopilotBannerNeedShow && this.supportsCopilotBanner();
	}

	#handleSliderCode(data: CoPilotAdditionalInfoData, item: ConfigurableItem): void
	{
		if (data.sliderCode === 'limit_boost_copilot')
		{
			void this.#showBoostLimitSlider(item);
		}
		else
		{
			this.#showInfoSlider(data.sliderCode);
		}
	}

	async #showBoostLimitSlider(item: ConfigurableItem): Promise<void>
	{
		try
		{
			const { ServiceWidget, Analytics } = await Runtime.loadExtension('baas.store');
			if (!ServiceWidget)
			{
				this.#showFallbackBoostLimit();

				return;
			}

			const serviceWidget = ServiceWidget?.getInstanceByCode('ai_copilot_token');
			const bindElement = item.getLayoutFooterButtonById('aiButton')?.getUiButton()?.getContainer();

			serviceWidget.bind(bindElement, Analytics.CONTEXT_CRM);
			serviceWidget.show(bindElement);
			serviceWidget.getPopup().adjustPosition({ forceTop: true });
		}
		catch
		{
			this.#showFallbackBoostLimit();

			await console.error('Cant load "baas.store" extension');
		}
	}

	#showFallbackBoostLimit(): void
	{
		if (this.useInfoHelper())
		{
			BX?.UI?.InfoHelper.show('limit_boost_copilot');
		}
		else
		{
			void FeaturePromotersRegistry.getPromoter({ code: 'limit_boost_copilot' }).show();
		}
	}

	#showInfoSlider(sliderCode: string): void
	{
		if (sliderCode?.includes('redirect=detail&code'))
		{
			top.BX.Helper.show(sliderCode);
		}
		else if (this.useInfoHelper())
		{
			BX?.UI?.InfoHelper.show(sliderCode);
		}
		else
		{
			FeaturePromotersRegistry.getPromoter({ code: sliderCode }).show();
		}
	}

	#showFeedbackMessageBox(): void
	{
		MessageBox.show({
			title: Loc.getMessage('CRM_TIMELINE_ITEM_NO_AI_PROVIDER_POPUP_TITLE'),
			message: Loc.getMessage('CRM_TIMELINE_ITEM_NO_AI_PROVIDER_POPUP_TEXT'),
			modal: true,
			buttons: MessageBoxButtons.OK_CANCEL,
			okCaption: Loc.getMessage('CRM_TIMELINE_ITEM_NO_AI_PROVIDER_POPUP_OK_TEXT'),
			onOk: (messageBox) => {
				messageBox.close();
				this.#openFeedbackForm();
			},
			onCancel: (messageBox) => messageBox.close(),
		});
	}

	#openFeedbackForm(): void
	{
		BX.UI.Feedback.Form.open({
			id: 'b24_ai_provider_partner_crm_feedback',
			forms: [{
				zones: ['cn'],
				id: 678,
				lang: 'cn',
				sec: 'wyufoe',
			}, {
				zones: ['vn'],
				id: 680,
				lang: 'vn',
				sec: '2v97xr',
			}, {
				zones: ['en'],
				id: 682,
				lang: 'en',
				sec: '3sd3le',
			}],
		});
	}

	#isSliderCodeExist(data: CoPilotAdditionalInfoData): boolean
	{
		return Object.hasOwn(data, 'sliderCode') && Type.isStringFilled(data.sliderCode);
	}

	#isAiMarketplaceAppsExist(data: CoPilotAdditionalInfoData): boolean
	{
		return Object.hasOwn(data, 'isAiMarketplaceAppsExist')
			&& Type.isBoolean(data.isAiMarketplaceAppsExist)
			&& data.isAiMarketplaceAppsExist
		;
	}
}
