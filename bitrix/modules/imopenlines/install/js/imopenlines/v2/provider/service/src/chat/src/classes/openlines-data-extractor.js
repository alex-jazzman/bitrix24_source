import type { ChatLoadRestResult } from 'im.v2.provider.service.chat';
import type {
	RawSession,
	RawOpenLinesMeta,
	RawCurrentSession,
	RawCrm,
	RawConnector,
} from 'imopenlines.v2.provider.service';

type OpenLinesChatLoadRestResult = ChatLoadRestResult & RawOpenLinesMeta;

export class OpenLinesDataExtractor
{
	#restResult: OpenLinesChatLoadRestResult;

	constructor(restResult: OpenLinesChatLoadRestResult)
	{
		this.#restResult = restResult;
	}

	getDialogId(): string
	{
		return this.#restResult.chat.dialogId;
	}

	getSession(): RawSession
	{
		return this.#restResult.session;
	}

	getConnectorData(): RawConnector
	{
		return this.#restResult.openlines.connector;
	}

	getCrmData(): RawCrm
	{
		return this.#restResult.openlines.crm;
	}

	getCurrentSessionData(): RawCurrentSession
	{
		return this.#restResult.openlines.currentSession;
	}
}
