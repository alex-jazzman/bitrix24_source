import { sendData } from 'ui.analytics';

const TOOL = 'intranet';
const CATEGORY = 'vibecode_catalog';

type CatalogAnalyticsPayload = {
	event: string,
	c_section?: string,
	c_sub_section?: string,
	c_element?: string,
	type?: string,
	p1?: string,
	p2?: string,
	p3?: string,
	p4?: string,
	p5?: string,
	status?: 'success' | 'error' | 'attempt' | 'cancel',
};

export function sendCatalogAnalytics(payload: CatalogAnalyticsPayload): void
{
	sendData({
		tool: TOOL,
		category: CATEGORY,
		...payload,
	});
}
