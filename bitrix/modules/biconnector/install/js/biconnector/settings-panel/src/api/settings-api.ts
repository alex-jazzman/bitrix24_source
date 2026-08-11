import { ajax as Ajax } from 'main.core';

export class SettingsApi
{
	static clearCache(): Promise<any>
	{
		return Ajax.runAction('biconnector.superset.clearCache');
	}

	static changeBiToken(componentName: string, signedParameters: string): Promise<any>
	{
		return Ajax.runComponentAction(componentName, 'changeBiToken', {
			mode: 'class',
			signedParameters,
		});
	}

	static getDashboardLanguage(componentName: string, signedParameters: string): Promise<any>
	{
		return Ajax.runComponentAction(componentName, 'getDashboardLanguage', {
			mode: 'class',
			signedParameters,
		});
	}

	static getTimeZone(componentName: string, signedParameters: string): Promise<any>
	{
		return Ajax.runComponentAction(componentName, 'getTimeZone', {
			mode: 'class',
			signedParameters,
		});
	}

	static savePeriodFilter(
		componentName: string,
		signedParameters: string,
		data: Record<string, string>,
	): Promise<any>
	{
		return Ajax.runComponentAction(componentName, 'savePeriodFilter', {
			mode: 'class',
			signedParameters,
			data: { data },
		});
	}

	static saveDatasetTyping(
		componentName: string,
		signedParameters: string,
		enabled: boolean,
	): Promise<any>
	{
		return Ajax.runComponentAction(componentName, 'saveDatasetTyping', {
			mode: 'class',
			signedParameters,
			data: { newTypingValue: enabled ? 'Y' : 'N' },
		});
	}
}
