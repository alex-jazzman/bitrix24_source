import { NameService } from 'crm.ai.name-service';
import { Router } from 'crm.router';
import { ajax as Ajax, Extension, Loc, Runtime, Text, Type } from 'main.core';
import { Button as ButtonUI, ButtonState } from 'ui.buttons';
import { MessageBox, MessageBoxButtons } from 'ui.dialogs.messagebox';
import { FeaturePromotersRegistry } from 'ui.info-helper';
import { UI } from 'ui.notification';

import { Button } from '../../components/layout/button';
import ConfigurableItem from '../../configurable-item';
import { Base } from '../base';

import 'ui.feedback.form';

const COPILOT_BUTTON_DISABLE_DELAY = 5000;
const COPILOT_HELPDESK_CODE = 18_799_442;

declare type CoPilotAdditionalInfoData =
{
	sliderCode: ?string,
	isAiMarketplaceAppsExist: ?boolean,
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
		throw new Error('Method "getCopilotConfig" must be overridden');
	}

	useInfoHelper(): boolean
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
			await this.#launchCopilot(item, actionData);
		}
	}

	async openCopilotSummaryPopup(actionData: Object, activityProvider: string, jobId: number = null): void
	{
		Runtime.loadExtension('crm.ai.call').then((exports) => {
			const summary = new exports.Call.Summary({
				activityId: actionData.activityId,
				ownerTypeId: actionData.ownerTypeId,
				ownerId: actionData.ownerId,
				languageTitle: actionData.languageTitle,
				activityProvider,
				jobId,
			});
			summary.open();
		}).catch((exception) => {
			console.error('Error loading "crm.ai.call":', exception);
		});
	}

	getFooterCopilotButton(item: ConfigurableItem, scenario: string = null): ?Button
	{
		const buttonId = Type.isStringFilled(scenario) && scenario === 'call_scoring'
			? 'aiSecondaryScenarioButton'
			: 'aiPrimaryScenarioButton'
		;

		let copilotBtn = item.getLayoutFooterButtonById(buttonId);
		if (copilotBtn === null)
		{
			copilotBtn = item.getLayoutFooterButtonById('aiPrimaryScenarioButton');
		}

		return copilotBtn;
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
				await this.#launchCopilot(item, actionData);
			}
		}
		catch
		{
			await console.error('Cant load "ai.copilot-agreement" extension');
		}
	}

	async #launchCopilot(item: ConfigurableItem, actionData: Object): Promise<void>
	{
		if (!this.#validateCopilotParams(actionData))
		{
			throw new Error('Invalid "actionData" parameters');
		}

		const aiCopilotBtn = this.getFooterCopilotButton(item, actionData.scenario);
		const aiCopilotBtnUI = aiCopilotBtn?.getUiButton();
		if (aiCopilotBtnUI?.getState() === ButtonState.AI_WAITING)
		{
			return;
		}

		this.#copilotConfig.onPreLaunch?.(item, actionData);

		const previousButtonState = aiCopilotBtnUI?.getState();
		aiCopilotBtnUI?.setState(ButtonState.AI_WAITING);

		try
		{
			const response = await this.#executeCopilotRequest(actionData);
			this.#copilotConfig.onPostLaunch?.(item, actionData, response);
		}
		catch (response)
		{
			this.#handleCopilotError(item, actionData, response, aiCopilotBtnUI, previousButtonState);
		}
	}

	#validateCopilotParams(actionData: Object): boolean
	{
		return Type.isNumber(actionData.activityId)
			&& Type.isNumber(actionData.ownerId)
			&& Type.isNumber(actionData.ownerTypeId)
			&& this.#copilotConfig.validEntityTypes.includes(parseInt(actionData.ownerTypeId, 10))
		;
	}

	#executeCopilotRequest(actionData: Object): Promise
	{
		const settings: Object<string, any> = Extension.getSettings('crm.timeline.item');
		const scenarioList: Array = settings.aiScenarioList ?? [];
		const isValidScenario = Type.isStringFilled(actionData.scenario)
			&& scenarioList.includes(actionData.scenario)
		;

		return Ajax.runAction(this.#copilotConfig.actionEndpoint, {
			data: {
				activityId: actionData.activityId,
				ownerTypeId: actionData.ownerTypeId,
				ownerId: actionData.ownerId,
				scenario: isValidScenario ? actionData.scenario : null,
			},
		});
	}

	#handleCopilotError(
		item: ConfigurableItem,
		actionData: Object,
		response: Object,
		btnUI: ?ButtonUI,
		previousButtonState: ?string,
	): void
	{
		const customData: ?CoPilotAdditionalInfoData = response?.errors?.[0]?.customData;
		if (customData)
		{
			this.#showAdditionalInfo(customData, item);

			this.#restoreButtonState(btnUI, previousButtonState);
		}
		else
		{
			this.#showGenericError(response, btnUI, previousButtonState);
		}

		this.#copilotConfig.onError?.(item, actionData, response);
	}

	#restoreButtonState(btnUI: ?ButtonUI, previousButtonState: ?string): void
	{
		btnUI?.setState(Type.isStringFilled(previousButtonState) ? previousButtonState : ButtonState.ACTIVE);
	}

	#showGenericError(response: Object, btnUI: ?ButtonUI, previousButtonState: ?string): void
	{
		btnUI?.setState(ButtonState.DISABLED);

		UI.Notification.Center.notify({
			content: Text.encode(response?.errors?.[0]?.message ?? Loc.getMessage('CRM_COMMON_ERROR')),
			autoHideDelay: COPILOT_BUTTON_DISABLE_DELAY,
		});

		setTimeout(() => {
			this.#restoreButtonState(btnUI, previousButtonState);
		}, COPILOT_BUTTON_DISABLE_DELAY);
	}

	#showAdditionalInfo(data: CoPilotAdditionalInfoData, item: ConfigurableItem): void
	{
		if (this.#isSliderCodeExist(data))
		{
			this.#showInfoSlider(data.sliderCode);
		}
		else if (this.#isAiMarketplaceAppsExist(data))
		{
			this.#showMarketMessageBox();
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
			title: Loc.getMessage('CRM_TIMELINE_ITEM_NO_AI_PROVIDER_POPUP_TITLE', NameService.copilotNameReplacement()),
			message: Loc.getMessage('CRM_TIMELINE_ITEM_NO_AI_PROVIDER_POPUP_TEXT', NameService.copilotNameReplacement()),
			modal: true,
			buttons: MessageBoxButtons.OK_CANCEL,
			okCaption: Loc.getMessage('CRM_TIMELINE_ITEM_NO_AI_PROVIDER_POPUP_OK_TEXT', NameService.copilotNameReplacement()),
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

	#showMarketMessageBox(): void
	{
		MessageBox.show({
			title: Loc.getMessage('CRM_TIMELINE_ITEM_AI_PROVIDER_POPUP_TITLE', NameService.copilotNameReplacement()),
			message: Loc.getMessage('CRM_TIMELINE_ITEM_AI_PROVIDER_POPUP_TEXT', {
				'[helpdesklink]': `<br><br><a href="##" onclick="top.BX.Helper.show('redirect=detail&code=${COPILOT_HELPDESK_CODE}');">`,
				'[/helpdesklink]': '</a>',
				'#COPILOT_NAME#': NameService.copilotName(),
			}),
			modal: true,
			buttons: MessageBoxButtons.OK_CANCEL,
			okCaption: Loc.getMessage('CRM_TIMELINE_ITEM_AI_PROVIDER_POPUP_OK_TEXT'),
			onOk: () => Router.openSlider(Loc.getMessage('AI_APP_COLLECTION_MARKET_LINK')),
			onCancel: (messageBox) => messageBox.close(),
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
