import { ajax, Extension, Loc, Type, Uri } from 'main.core';
import { sendData } from 'ui.analytics';
import { Button, ButtonColor, CloseButton } from 'ui.buttons';
import { MessageBox } from 'ui.dialogs.messagebox';
import { FeaturePromotersRegistry } from './feature-promoters-registry';
import { SliderProvider } from './providers/slider-provider';

type DemoActivationErrorAction = {
	title?: string,
	code?: string,
};

type DemoActivationError = {
	message: string,
	customData?: {
		title?: string,
		action?: DemoActivationErrorAction,
	},
};

export class Actions
{
	static ClosePage()
	{
		BX.SidePanel.Instance.getTopSlider()?.close();
		BX.UI.InfoHelper.close();
	}

	static openPage()
	{
		window.location.href = BX.UI.InfoHelper.frameUrl;
	}

	static openPageInNewTab()
	{
		window.open(BX.UI.InfoHelper.frameUrl, '_blank');
	}

	static reloadParent()
	{
		BX.UI.InfoHelper.reloadParent();
	}

	static openSlider(data)
	{
		top.BX.SidePanel.Instance.open(data.url);
	}

	static openPriceTable(data): void
	{
		let url = '/settings/license_all.php';

		if (data && data.subscr)
		{
			url = Uri.addParam(url, {
				subscr: data.subscr,
			});
		}

		Actions.openSlider({ url });
	}

	static openChatWithHead(data): void
	{
		const opener = top.BX.Messenger.Public.openChat();
		const analyticData = {
			tool: 'InfoHelper',
			c_section: document.location.href,
			event: 'create_chatforrequest',
		};

		if (data.toolId)
		{
			ajax.runAction('intranet.tools.tool.createHeadChat', {
				data: {
					toolId: data.toolId,
				},
			}).then((response) => {
				opener.then(() => {
					top.BX.Messenger.Public.openChat(`chat${response.data.chatId}`);
				});
				analyticData.type = data.toolId;
				analyticData.category = 'tool_off';
				sendData(analyticData);
			});
		}

		if (data.featureCode)
		{
			ajax.runAction('bitrix24.license.upgraderequest.createHeadChat', {
				data: {
					code: data.featureCode,
				},
			}).then((response) => {
				opener.then(() => {
					top.BX.Messenger.Public.openChat(`chat${response.data.chatId}`);
				});
				analyticData.type = data.featureCode;
				analyticData.category = 'limit';
				sendData(analyticData);
			});
		}
	}

	static openCheckout(data): void
	{
		if (data.tariff)
		{
			const url = Uri.addParam('/settings/order/make.php', {
				product: data.period ? data.tariff + data.period : `${data.tariff}12`,
				subscr: data.subscr ?? null,
			});
			Actions.openSlider({ url });
		}
		else if (Extension.getSettings('ui.info-helper').licenseType)
		{
			const url = Uri.addParam('/settings/order/make.php', {
				product: `${Extension.getSettings('ui.info-helper').licenseType}12`,
				subscr: data.subscr ?? null,
			});
			Actions.openSlider({ url });
		}
		else
		{
			this.openPriceTable(data);
		}
	}

	static openBaasCheckout(data): void
	{
		const url = Uri.addParam('/settings/order/make.php', {
			product: `PACKAGE_${data.package}`,
		});
		Actions.openSlider({ url });
	}

	static openToolsSettings(): void
	{
		Actions.openSlider({ url: Extension.getSettings('ui.info-helper').settingsUrl + '?page=tools' });
	}

	static openInformer(data)
	{
		top.BX.UI.InfoHelper.__showExternal(
			data.code,
			data.option,
		);
	}

	static activateDemoSubscription(data)
	{
		if (data.licenseAgreed === 'Y')
		{
			const ajaxRestPath = '/bitrix/tools/rest.php';
			const callback = (result) => {
				const slider = BX.SidePanel.Instance.getTopSlider();

				if (slider && result.error)
				{
					BX.UI.InfoHelper.sliderProviderForOldFormat?.getFrame().contentWindow.postMessage(
						{
							action: 'onActivateDemoSubscriptionResult',
							result: result,
						},
						'*',
					);
				}

				if (!result.error)
				{
					let url = window.location.href;

					url += url.includes('?') ? '&' : '?';
					url += 'feature_promoter=limit_market_trial_active';

					window.location.href = url;
				}
			};

			BX.ajax(
				{
					dataType: 'json',
					method: 'POST',
					url: ajaxRestPath,
					data: {
						action: 'activate_demo',
						sessid: BX.bitrix_sessid(),
					},
					onsuccess: callback,
					onfailure: function(error_type, error)
					{
						callback({ error: error_type + (error ? `: ${error}` : '') });
					},
				},
			);
		}
	}

	static activateDemoLicense(): Promise<void>
	{
		return ajax.runAction('ui.infoHelper.activateDemoLicense').then(
			(response) => Actions.#processDemoActivationResponse(response),
			() => Actions.#processDemoActivationResponse({
				data: {
					success: 'N',
					error: {
						message: Loc.getMessage('UI_INFO_HELPER_DEMO_LICENSE_ACTIVATION_FAILED'),
					},
				},
			}),
		);
	}

	static #processDemoActivationResponse(response): void
	{
		Actions.#notifyDemoActivationResult(response);

		if (response.data.success === 'N' && response.data.error)
		{
			Actions.showDemoActivationError(response.data.error);
		}

		if (response.data.success === 'Y')
		{
			BX.onCustomEvent('BX.UI.InfoHelper:onActivateDemoLicenseSuccess', {
				result: response,
			});

			window.location.reload();
		}
	}

	static #notifyDemoActivationResult(response): void
	{
		if (!BX.SidePanel.Instance.getTopSlider())
		{
			return;
		}

		const promoter = FeaturePromotersRegistry.getLastPromoter();
		const provider = promoter?.getProvider();
		const frame = (
			provider instanceof SliderProvider
			&& promoter?.getCode() === 'limit_demo'
		)
			? provider.getFrame()
			: BX.UI.InfoHelper.sliderProviderForOldFormat?.getFrame()
		;

		frame?.contentWindow?.postMessage(
			{
				action: 'onActivateDemoLicenseResult',
				result: response,
			},
			'*',
		);
	}

	static showDemoActivationError(error: DemoActivationError): void
	{
		const action = error.customData?.action;
		const hasAction = (
			Type.isStringFilled(action?.title)
			&& Type.isStringFilled(action?.code)
		);
		const buttons = hasAction
			? [this.#getHelperButton(action.title, action.code), this.#getCloseButton()]
			: [this.#getCloseButton(true)]
		;

		(new MessageBox({
			useAirDesign: true,
			message: error.message,
			title: error.customData?.title,
			buttons,
			popupOptions: {
				closeByEsc: true,
				closeIcon: true,
			},
		})).show();
	}

	static #getCloseButton(primary: boolean = false): CloseButton
	{
		return new CloseButton({
			color: primary ? ButtonColor.PRIMARY : ButtonColor.LINK,
			useAirDesign: true,
			wide: true,
			events: {
				click: (button) => {
					button.getContext().close();
				},
			},
		});
	}

	static #getHelperButton(title: string, code: string): Button
	{
		return new Button({
			color: ButtonColor.PRIMARY,
			text: title,
			useAirDesign: true,
			wide: true,
			onclick: (button) => {
				button.getContext().close();
				top.BX.Helper.show(`redirect=detail&code=${code}`);
			},
		});
	}

	static openBuySubscriptionPage(): void
	{
		ajax.runAction('ui.infoHelper.getBuySubscriptionUrl').then((response) => {
			if (!!response.data && !!response.data.url)
			{
				if (response.data.action === 'blank')
				{
					window.open(response.data.url, '_blank');
				}
				else if (response.data.action === 'redirect')
				{
					window.location.href = response.data.url;
				}
			}
		});
	}

	static activateTrialFeature(data): void
	{
		ajax.runAction(
			'ui.infoHelper.activateTrialFeature',
			{
				data: {
					featureId: data.featureId,
				},
			},
		).then((response) => {
			const slider = BX.SidePanel.Instance.getTopSlider();
			if (slider)
			{
				BX.UI.InfoHelper.sliderProviderForOldFormat?.getFrame().contentWindow.postMessage(
					{
						action: 'onActivateTrialFeature',
						result: response,
					},
					'*',
				);
			}

			if (response.data.success === 'Y')
			{
				BX.onCustomEvent('BX.UI.InfoHelper:onActivateTrialFeatureSuccess', {
					result: response,
					featureId: data.featureId,
					// featureId: this.featureId
				});
			}
		});
	}
}
