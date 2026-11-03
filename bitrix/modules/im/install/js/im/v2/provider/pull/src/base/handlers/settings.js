import { Core } from 'im.v2.application.core';
import { Logger } from 'im.v2.lib.logger';

import { type SettingsUpdateParams } from '../../types/settings';

export class SettingsPullHandler
{
	handleSettingsUpdate(params: SettingsUpdateParams)
	{
		Logger.warn('SettingsPullHandler: handleSettingsUpdate', params);

		const settingsToUpdate: SettingsUpdateParams = {
			...params,
		};

		void Core.getStore().dispatch('application/settings/set',
			settingsToUpdate,
		);
	}
}
