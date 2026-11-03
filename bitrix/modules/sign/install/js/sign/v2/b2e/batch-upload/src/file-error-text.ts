import { Loc } from 'main.core';

import { type BatchFileItem } from './types';

/**
 * The batch endpoint failed as a whole, so no document exists for an already uploaded file.
 * Client-side code, never returned by the server.
 */
export const COMMIT_FAILED_ERROR_CODE = 'CLIENT_COMMIT_FAILED';

/**
 * The document of the file exists on the server, but the wizard could not take it in: the load
 * failed twice, or the answer belonged to another group. Client-side code.
 */
export const DOCUMENT_ADD_FAILED_ERROR_CODE = 'CLIENT_DOCUMENT_ADD_FAILED';

/** The signing service rejected the uploaded file after the document draft had been created. */
export const DOCUMENT_REJECTED_ERROR_CODE = 'CLIENT_DOCUMENT_REJECTED';

/** Outcome code of the server, raised on the client as well: no place is left in the process. */
export const LIMIT_EXCEEDED_ERROR_CODE = 'MAX_DOCUMENT_COUNT_EXCEEDED';

/**
 * Outcome codes of sign.api_v1.b2e.document.group.addDocuments, see AddGroupDocumentsResult.
 * A code this map does not know (a newer backend) falls back to the generic phrase.
 */
const PHRASE_BY_ERROR_CODE: Map<string, string> = new Map([
	[LIMIT_EXCEEDED_ERROR_CODE, 'SIGN_B2E_BATCH_UPLOAD_FILE_ERROR_LIMIT'],
	['TARIFF_RESTRICTED', 'SIGN_B2E_BATCH_UPLOAD_FILE_ERROR_TARIFF'],
	['BLANK_CREATE_FAILED', 'SIGN_B2E_BATCH_UPLOAD_FILE_ERROR_BLANK'],
	['DOCUMENT_REGISTER_FAILED', 'SIGN_B2E_BATCH_UPLOAD_FILE_ERROR_REGISTER'],
	['GROUP_CREATE_FAILED', 'SIGN_B2E_BATCH_UPLOAD_FILE_ERROR_GROUP'],
	['ATTACH_FAILED', 'SIGN_B2E_BATCH_UPLOAD_FILE_ERROR_ATTACH'],
	['B2E_NOT_AVAILABLE', 'SIGN_B2E_BATCH_UPLOAD_FILE_ERROR_B2E_UNAVAILABLE'],
	[COMMIT_FAILED_ERROR_CODE, 'SIGN_B2E_BATCH_UPLOAD_FILE_ERROR_COMMIT'],
	[DOCUMENT_ADD_FAILED_ERROR_CODE, 'SIGN_B2E_BATCH_UPLOAD_FILE_ERROR_ADD'],
	[DOCUMENT_REJECTED_ERROR_CODE, 'SIGN_B2E_BATCH_UPLOAD_FILE_ERROR'],
]);

/**
 * Failure text of a row: a server outcome is shown by its code, an upload failure keeps the
 * localized message of ui.uploader.core. A raw server message never reaches the user.
 */
export function getFileErrorText(item: BatchFileItem): string
{
	const phraseCode = item.errorCode === null ? undefined : PHRASE_BY_ERROR_CODE.get(item.errorCode);
	const text = phraseCode === undefined ? item.errorMessage : Loc.getMessage(phraseCode);

	return text ?? Loc.getMessage('SIGN_B2E_BATCH_UPLOAD_FILE_ERROR') ?? '';
}
