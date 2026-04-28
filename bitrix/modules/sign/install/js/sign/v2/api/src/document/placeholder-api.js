import { post } from '../request';

export class PlaceholderApi
{
	list(clearCache: boolean = false): Promise
	{
		return post('sign.api_v1.b2e.document.placeholder.list', { clearCache });
	}

	listByHcmLinkCompanyId(hcmLinkCompanyId: number): Promise<Object>
	{
		return post('sign.api_v1.b2e.document.placeholder.listByHcmLinkId', { hcmLinkCompanyId });
	}

	saveLastSelectionBySelectorType(selectorType: string, value: number): Promise<void>
	{
		return post('sign.api_v1.b2e.document.placeholder.saveLastSelectionBySelectorType', { selectorType, value });
	}

	getLastSelectionBySelectorType(selectorType: string): Promise<{ value: number | null }>
	{
		return post('sign.api_v1.b2e.document.placeholder.getLastSelectionBySelectorType', { selectorType });
	}
}
