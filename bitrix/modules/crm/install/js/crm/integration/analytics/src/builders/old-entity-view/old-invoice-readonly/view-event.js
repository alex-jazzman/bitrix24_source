import { Dictionary } from '../../../dictionary';
import { getCrmMode } from '../../../helpers';
import type { DisableAlertOldInvoiceReadonlyViewEvent } from '../../../types';

/**
 * @memberof BX.Crm.Integration.Analytics.Builder.OldEntityView.OldInvoiceReadonly
 */

export class ViewEvent
{
	static buildData(): DisableAlertOldInvoiceReadonlyViewEvent
	{
		return {
			tool: Dictionary.TOOL_CRM,
			category: Dictionary.CATEGORY_BANNERS,
			event: Dictionary.EVENT_OLD_INVOICE_READONLY_ALERT_VIEW,
			type: Dictionary.TYPE_OLD_INVOICE_READONLY_ALERT,
			c_section: Dictionary.SECTION_INVOICE,
			p1: getCrmMode(),
		};
	}
}
