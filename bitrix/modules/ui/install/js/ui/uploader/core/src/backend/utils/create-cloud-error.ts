import { Loc } from 'main.core';

import { UploaderError } from '../../uploader-error';

/**
 * Builds an UploaderError for a cloud (presigned / parallel) upload failure.
 * Keeps the specific code (so retry/abort logic that reads getCode() keeps
 * working) but renders the single shared "UPLOADER_CLOUD_ERROR" phrase with the
 * code interpolated, instead of needing a per-code localization string.
 */
export function createCloudError(code: string, customData: { [key: string]: any } = {}): UploaderError
{
	const message: string = Loc.getMessage('UPLOADER_CLOUD_ERROR', { '#CODE#': code })!;

	return new UploaderError(code, message, customData);
}
