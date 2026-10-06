import { ajax, Loc } from 'main.core';

import { buildSharedSignatureSaveRequest, extractSharedSignatureId } from '../save-request';
import { type SavePayload, type SharedSignatureResponseData, type SignatureTransport } from '../types';

// HTML signature is read raw from POST on the server side,
// so requests must go as form-data (the `data` option), never as json.
export class SharedSignatureTransport implements SignatureTransport
{
	save(payload: SavePayload): Promise<number>
	{
		const { action, data } = buildSharedSignatureSaveRequest(payload);

		return ajax.runAction(action, { data }).then((response: { data: SharedSignatureResponseData }) => (
			payload.signatureId > 0 ? payload.signatureId : extractSharedSignatureId(response.data)
		));
	}

	getUpdateSuccessText(): string
	{
		return Loc.getMessage('MAIL_SIGNATURE_EDITOR_SHARED_UPDATE_SUCCESS') ?? '';
	}
}
