import { post } from '../request';

/**
 * Personal state of the placeholder panel as the server keeps it: the codes of the recently copied
 * fields, the most recent one first.
 */
export type PlaceholderPersonalSettings = {
	recentFieldCodes: string[],
};

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

	/**
	 * Personal state is a convenience, so a refusal must stay silent: `notifyError = false` keeps the
	 * common toast away and makes `request()` resolve with the error object instead of rejecting.
	 */
	getPersonalSettings(): Promise<PlaceholderPersonalSettings>
	{
		return post('sign.api_v1.b2e.document.placeholder.getPersonalSettings', {}, false);
	}

	/**
	 * A refusal stays silent here as well, for the same reason as in `getPersonalSettings()`.
	 *
	 * @param hcmLinkCompanyId the tab of the external human resources system sends the chosen company:
	 *   the server validates the field code against the collection the user really sees
	 */
	saveFieldUsage(code: string, hcmLinkCompanyId: number | null = null): Promise<PlaceholderPersonalSettings>
	{
		return post(
			'sign.api_v1.b2e.document.placeholder.saveFieldUsage',
			{ code, hcmLinkCompanyId },
			false,
		);
	}

	/**
	 * The server checks the permission again, and its refusal must reach the user: unlike the personal
	 * state, this request keeps the common error toast.
	 *
	 * @param category the field category the panel got with the item: `PROFILE` or `DYNAMIC_MEMBER`
	 */
	deleteField(fieldId: number, category: string): Promise<{ deleted: boolean }>
	{
		return post('sign.api_v1.b2e.document.placeholder.deleteField', { fieldId, category });
	}
}
