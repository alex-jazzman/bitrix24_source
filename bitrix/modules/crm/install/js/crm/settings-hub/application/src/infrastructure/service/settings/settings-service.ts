import { ajax } from 'main.core';

import { parseSettingsPresentation } from './mappers';
import {
	type SettingsPresentation,
	type SettingValue,
} from './types';

const UPDATE_ACTION = 'crm.v2.Settings.Update.update';

type SettingsAjaxClient = Readonly<{
	runAction: (
		action: string,
		options: Readonly<{ json: Readonly<{ code: string, value: SettingValue }> }>,
	) => Promise<Readonly<{ data: Readonly<{ presentation: unknown }> }>>,
}>;

export class SettingsService
{
	#ajaxClient: SettingsAjaxClient;

	constructor(ajaxClient: SettingsAjaxClient = ajax)
	{
		this.#ajaxClient = ajaxClient;
	}

	async update(code: string, value: SettingValue): Promise<SettingsPresentation>
	{
		const response = await this.#ajaxClient.runAction(UPDATE_ACTION, {
			json: { code, value },
		});

		return parseSettingsPresentation(response.data.presentation);
	}
}
