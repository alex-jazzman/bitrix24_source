import { Extension } from 'main.core';
import { InfoHelper } from 'ui.info-helper';
import { Form } from 'ui.feedback.form';
import { Factory } from 'disk.promo-boost';

export class OnlyOfficePromoActions
{
	action: ?any = null;

	constructor()
	{
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

		switch (actionType)
		{
			case 'slider':
				this.#showSlider();
				break;
			case 'form':
				this.#showForm();
				break;
			case 'boost':
				this.#showBoostPromo(target, needOverlay);
				break;
			default:
				console.error(`Unknown promo action type: ${actionType}`);
		}
	}

	#isActionDefined(): boolean
	{
		return this.action !== null;
	}

	#showSlider(): void
	{
		const sliderCode = this.action?.code || '';
		if (sliderCode === '')
		{
			return;
		}

		InfoHelper.show(sliderCode);
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
