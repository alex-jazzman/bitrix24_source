import { Dictionary } from '../../../dictionary';
import { getCrmMode } from '../../../helpers';
import type { DisableAlertOldInvoiceReadonlyClickEvent } from '../../../types';

/**
 * @memberof BX.Crm.Integration.Analytics.Builder.OldEntityView.OldInvoiceReadonly
 */

export class ClickEvent
{
	static buildData(): DisableAlertOldInvoiceReadonlyClickEvent
	{
		return {
			tool: Dictionary.TOOL_CRM,
			category: Dictionary.CATEGORY_BANNERS,
			event: Dictionary.EVENT_OLD_INVOICE_READONLY_ALERT_CLICK,
			type: Dictionary.TYPE_OLD_INVOICE_READONLY_ALERT,
			c_section: Dictionary.SECTION_INVOICE,
			c_element: Dictionary.ELEMENT_INFO_BUTTON,
			p1: getCrmMode(),
		};
	}
}
