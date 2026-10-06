import { Dictionary } from '../../dictionary';
import { filterOutNilValues, getCrmMode } from '../../helpers';
import type {
	EInvoicePromoEventSection,
	EInvoicePromoEventSubSection,
	EInvoicePromoViewEvent,
} from '../../types';

/**
 * @memberof BX.Crm.Integration.Analytics.Builder.EInvoicePromo
 */
export class ViewEvent
{
	#section: EInvoicePromoEventSection;
	#subSection: EInvoicePromoEventSubSection;

	static createDefault(
		section: EInvoicePromoEventSection,
		subSection: EInvoicePromoEventSubSection,
	): ViewEvent
	{
		const self: ViewEvent = new ViewEvent();

		self.#section = section;
		self.#subSection = subSection;

		return self;
	}

	buildData(): ?EInvoicePromoViewEvent
	{
		return filterOutNilValues({
			tool: Dictionary.TOOL_CRM,
			category: Dictionary.CATEGORY_BANNERS,
			event: Dictionary.EVENT_EINVOICE_PROMO_VIEW,
			type: Dictionary.TYPE_EINVOICE_PROMO,
			c_section: this.#section,
			c_sub_section: this.#subSection,
			p1: getCrmMode(),
		});
	}
}
