import { OpenLinesMessageManager } from 'imopenlines.v2.lib.message-manager';

import type { ImModelMessage } from 'im.v2.model';
import type { MessageComponentValues } from 'imopenlines.v2.lib.message-manager';

export const OpenLinesManager = {
	getMessageName(message: ImModelMessage): ?MessageComponentValues
	{
		const openLinesManager = new OpenLinesMessageManager(message);

		if (openLinesManager.checkComponentInOpenLinesList())
		{
			return openLinesManager.getMessageComponent();
		}

		return null;
	},
};
