// Cross-browser IDB storage-limit detector.
// Chrome/Firefox: QuotaExceededError ("The current transaction exceeded its quota limitation").
// Chrome: DataError "Failed to write blobs (IOError)" — surfaces when large values are blob-ised.
// Firefox: UnknownError "The operation failed for reasons unrelated to the database itself..."
export function isStorageLimitError(error: Error): boolean
{
	if (!(error instanceof DOMException))
	{
		return false;
	}

	if (error.name === 'QuotaExceededError')
	{
		return true;
	}

	if (error.name === 'AbortError')
	{
		return true;
	}

	if (error.name === 'DataError' && /ioerror|blobs/i.test(error.message))
	{
		return true;
	}

	return Boolean(error.name === 'UnknownError' && error.message.includes('The operation failed for reasons unrelated'));
}
