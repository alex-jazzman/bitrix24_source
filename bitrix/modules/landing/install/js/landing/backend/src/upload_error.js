// Maps a failed Backend.upload() response to an ErrorManager action.
// Validation rejects (FILE_ERROR/BAD_IMAGE — e.g. an unsupported format such as
// a gated SVG) get a friendly "bad format" message without a support link;
// everything else (network, 500, quota, auth, empty/absent result) keeps the
// generic upload error with the support link, so diagnostics are not lost.

/**
 * @param {*} error - rejected upload response (or {type: 'error'} for a string reject)
 * @return {{action: string, hideSupportLink: boolean}}
 */
export function resolveUploadErrorAction(error): {action: string, hideSupportLink: boolean}
{
	const code = error && error.result && error.result[0] && error.result[0].error;

	if (code === 'FILE_ERROR' || code === 'BAD_IMAGE')
	{
		return {action: 'UPLOAD_BAD_FORMAT', hideSupportLink: true};
	}

	return {action: 'Block::uploadFile', hideSupportLink: false};
}
