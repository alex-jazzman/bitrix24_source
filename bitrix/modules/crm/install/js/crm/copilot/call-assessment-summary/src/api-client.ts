import { ajax } from 'main.core';
import { SAVE_AJAX_ACTION } from './const';
import type { Settings } from './types';

class ApiClient
{
	async saveSettings(settings: Settings): Promise<Settings>
	{
		return ajax.runAction(SAVE_AJAX_ACTION, {
			data: { settings },
		});
	}
}

export const apiClient = new ApiClient();
