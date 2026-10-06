import { ajax, Loc } from 'main.core';

import { buildUserSignatureSaveRequest, extractUserSignatureId } from '../save-request';
import { type SavePayload, type SignatureTransport, type UserSignatureResponseData } from '../types';

// HTML signature is read raw from POST on the server side,
// so requests must go as form-data (the `data` option), never as json.
export class UserSignatureTransport implements SignatureTransport
{
	save(payload: SavePayload): Promise<number>
	{
		const { action, data } = buildUserSignatureSaveRequest(payload);

		return ajax.runAction(action, { data }).then((response: { data: UserSignatureResponseData }) => (
			payload.signatureId > 0 ? payload.signatureId : extractUserSignatureId(response.data)
		));
	}

	getUpdateSuccessText(): string
	{
		return Loc.getMessage('MAIL_SIGNATURE_EDITOR_UPDATE_SUCCESS') ?? '';
	}
}
