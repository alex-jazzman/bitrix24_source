import { ajax as Ajax } from 'main.core';

import type { ImportSettings } from '../model/import-settings';
import { ConfigureImportSettingsResponse } from '../response/configure-import-settings-response';
import { ImportResponse } from '../response/import-response';

declare type ImportOptions = {
	importSettings: ImportSettings,
	currentLine: number,
};

export class Controller
{
	async configureImportSettings(importSettings: ImportSettings): Promise<ConfigureImportSettingsResponse>
	{
		return new Promise((resolve, reject) => {
			Ajax
				.runAction('crm.item.import.configureImportSettings', {
					json: {
						importSettings: importSettings.json(),
					},
				})
				.then((response) => {
					resolve(new ConfigureImportSettingsResponse(response.data));
				})
				.catch((response) => {
					reject(response);
				})
			;
		});
	}

	async import(importOptions: ImportOptions): Promise<ImportResponse>
	{
		return new Promise((resolve, reject) => {
			Ajax
				.runAction('crm.item.import.import', {
					json: {
						importSettings: importOptions.importSettings.json(),
						currentLine: importOptions.currentLine,
					},
				})
				.then((response) => {
					resolve(new ImportResponse(response.data));
				})
				.catch((response) => {
					reject(response);
				})
			;
		});
	}

	getDownloadExampleUrl(importSettings: ImportSettings): string
	{
		const getParameters = {
			action: 'crm.item.import.downloadExample',
			entityTypeId: Number(importSettings.get('entityTypeId')),
			importSettingsJson: JSON.stringify(importSettings.json()),
		};

		return `/bitrix/services/main/ajax.php?${BX.ajax.prepareData(getParameters, null, false)}`;
	}
}
