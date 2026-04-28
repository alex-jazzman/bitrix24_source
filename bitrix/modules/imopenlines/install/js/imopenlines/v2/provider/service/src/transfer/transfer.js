import { Messenger } from 'im.public';
import { Layout } from 'im.v2.const';
import { LayoutManager } from 'im.v2.lib.layout';
import { Notifier } from 'im.v2.lib.notifier';
import { runAction } from 'im.v2.lib.rest';
import { Logger } from 'im.v2.lib.logger';

import { RestMethod } from 'imopenlines.v2.const';

export class TransferService
{
	chatTransfer(dialogId: string, transferId: string): Promise
	{
		void Messenger.openLines();

		LayoutManager.getInstance().setLastOpenedElement(Layout.openlinesV2, '');

		const queryParams = {
			data: {
				dialogId,
				transferId,
			},
		};

		return runAction(RestMethod.linesV2SessionTransfer, queryParams)
			.catch((error) => {
				Notifier.onDefaultError();
				Logger.error('Imol.transfer: request error', error);
			});
	}
}
