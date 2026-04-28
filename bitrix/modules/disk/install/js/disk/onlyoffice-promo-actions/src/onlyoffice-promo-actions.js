import { Extension, ajax } from 'main.core';
import { InfoHelper } from 'ui.info-helper';
import { Form } from 'ui.feedback.form';
import { Factory } from 'disk.promo-boost';
import { PopupLimits } from 'disk.popup-limits';

export class OnlyOfficePromoActions
{
	action: ?any = null;
	isCreate: boolean = false;
	analytics: ?Object = null;

	constructor(isCreate: boolean = false, analytics: ?Object = null)
	{
		this.isCreate = isCreate;
		this.analytics = analytics;
		this.action = this.#getExtensionParam('action');
		this.documentEditSessionLimit = BX.Disk.OnlyOfficeSessionRestrictions.DocumentEditSessionLimit.getInstance();
	}

	shouldShow(): boolean
	{
		return this.#isActionDefined()
			&& (this.#canEditBeRestrictedByTariff() || this.documentEditSessionLimit.isExceeded());
	}

	#canEditBeRestrictedByTariff(): boolean
	{
		return !this.#getExtensionParam('canUseEditByTariff');
	}

	show(target, needOverlay: boolean): void
	{
		if (!this.#isActionDefined())
		{
			return;
		}

		const actionType = this.action?.type;

		let limitReached = true;

		switch (actionType)
		{
			case 'slider':
				this.#showSlider();
				break;
			case 'sliderWithPopup':
				this.#showPopupWithSlider(target);
				break;
			case 'form':
				this.#showForm();
				break;
			case 'boost':
				this.#showBoostPromo(target, needOverlay);
				break;
			default:
				limitReached = false;
				console.error(`Unknown promo action type: ${actionType}`);
		}

		if (limitReached)
		{
			this.#notifyLimitReached();
		}
	}

	#notifyLimitReached(): void
	{
		ajax.runAction('disk.api.limitEncounter.documentEditSession', {});
	}

	#isActionDefined(): boolean
	{
		return this.action !== null;
	}

	#showPopupWithSlider(target): void
	{
		if (!target)
		{
			console.error('OnlyofficePromoActions: target is not defined for slider with popup action');
		}

		const popupLimits = new PopupLimits({
			bindElement: target,
			isLimitEdit: !this.isCreate,
			submitButtonCallback: () => {
				const sliderCode = this.#showSlider();
				if (sliderCode !== '')
				{
					popupLimits.hide();
					BX.UI.Analytics.sendData({
						tool: 'docs',
						category: 'docs',
						event: 'limit_popup_click',
						type: `sliderId_${sliderCode}`,
						...this.analytics,
					});
				}
			},
		});

		popupLimits.show();
		BX.UI.Analytics.sendData({
			tool: 'docs',
			category: 'docs',
			event: 'limit_popup_show',
			...this.analytics,
		});
	}

	#showSlider(): string
	{
		const sliderCode = this.action?.code || '';
		if (sliderCode === '')
		{
			return '';
		}

		InfoHelper.show(sliderCode);

		return sliderCode;
	}

	#showForm(): void
	{
		Form.open(this.action.params);
	}

	#showBoostPromo(target, needOverlay): void
	{
		if (target)
		{
			const widget = Factory.getSessionBoostWidget()
				.bindTo(target);

			if (needOverlay)
			{
				widget.setOverlay();
			}

			widget.show();
		}
		else
		{
			console.error('OnlyofficePromoActions: target is not defined for boost promo action');
		}
	}

	#getExtensionParam(paramName: string): any
	{
		return Extension.getSettings('disk.onlyoffice-promo-actions').get(paramName);
	}
}
