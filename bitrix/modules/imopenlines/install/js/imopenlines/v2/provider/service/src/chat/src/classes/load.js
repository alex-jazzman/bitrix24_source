import { Core } from 'im.v2.application.core';
import { LoadService } from 'im.v2.provider.service.chat';

import { RestMethod } from 'imopenlines.v2.const';

import { OpenLinesDataExtractor } from './openlines-data-extractor';

import type { ChatLoadRestResult } from 'im.v2.provider.service.chat';

export class LoadServiceOl extends LoadService
{
	getLoadRestMethodName(): string
	{
		return RestMethod.linesV2ChatLoad;
	}

	updateChatCustomModels(restResult: ChatLoadRestResult): Promise<void>[]
	{
		const extractor = new OpenLinesDataExtractor(restResult);
		const store = Core.getStore();
		const dialogId = extractor.getDialogId();

		const actions = [
			{ path: 'openLines/sessions/set', payload: extractor.getSession() || null },
			{ path: 'openLines/connector/set', payload: { dialogId, data: extractor.getConnectorData() } },
			{ path: 'openLines/crm/set', payload: { dialogId, data: extractor.getCrmData() } },
			{ path: 'openLines/currentSession/set', payload: { dialogId, data: extractor.getCurrentSessionData() } },
		];

		return actions.map(({ path, payload }) => store.dispatch(path, payload));
	}
}
