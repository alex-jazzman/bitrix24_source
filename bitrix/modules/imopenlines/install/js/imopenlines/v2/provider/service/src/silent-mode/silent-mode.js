import { Core } from 'im.v2.application.core';
import { runAction } from 'im.v2.lib.rest';
import { Notifier } from 'im.v2.lib.notifier';
import { Logger } from 'im.v2.lib.logger';

import { RestMethod } from 'imopenlines.v2.const';

export class SilentModeService
{
	set(dialogId: string, silentMode: boolean): Promise<void>
	{
		const data = {
			dialogId,
			silentMode,
		};

		return runAction(RestMethod.linesV2SessionSetSilentMode, { data })
			.then(() => {
				void Core.getStore().dispatch('openLines/currentSession/set', {
					dialogId,
					data: { silentMode },
				});
			})
			.catch((error) => {
				Notifier.onDefaultError();
				Logger.error('Imol.SilentMode.set: request error', error);
			});
	}
}
