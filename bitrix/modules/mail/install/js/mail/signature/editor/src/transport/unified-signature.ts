import { ajax, Loc } from 'main.core';

import { buildUnifiedSignatureUpdateRequest } from '../save-request';
import { type SavePayload, type SignatureTransport } from '../types';

// HTML signature is read raw from POST on the server side,
// so requests must go as form-data (the `data` option), never as json.
export class UnifiedSignatureTransport implements SignatureTransport
{
	save(payload: SavePayload): Promise<number>
	{
		const { action, data } = buildUnifiedSignatureUpdateRequest(payload);

		return ajax.runAction(action, { data }).then(() => payload.signatureId);
	}

	getUpdateSuccessText(): string
	{
		return Loc.getMessage('MAIL_SIGNATURE_EDITOR_UPDATE_SUCCESS') ?? '';
	}
}
