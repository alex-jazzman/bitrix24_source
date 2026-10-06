import { Dictionary } from '../../dictionary';
import { filterOutNilValues, getCrmMode } from '../../helpers';
import type {
	EInvoicePromoEventSection,
	EInvoicePromoEventSubSection,
	EInvoicePromoClickEvent,
} from '../../types';

/**
 * @memberof BX.Crm.Integration.Analytics.Builder.EInvoicePromo
 */
export class ClickEvent
{
	#section: EInvoicePromoEventSection;
	#subSection: EInvoicePromoEventSubSection;

	static createDefault(
		section: EInvoicePromoEventSection,
		subSection: EInvoicePromoEventSubSection,
	): ClickEvent
	{
		const self: ClickEvent = new ClickEvent();

		self.#section = section;
		self.#subSection = subSection;

		return self;
	}

	buildData(): ?EInvoicePromoClickEvent
	{
		return filterOutNilValues({
			tool: Dictionary.TOOL_CRM,
			category: Dictionary.CATEGORY_BANNERS,
			event: Dictionary.EVENT_EINVOICE_PROMO_CLICK,
			type: Dictionary.TYPE_EINVOICE_PROMO,
			c_section: this.#section,
			c_sub_section: this.#subSection,
			p1: getCrmMode(),
		});
	}
}
