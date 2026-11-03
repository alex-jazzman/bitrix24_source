function sanitizeMessage(message)
{
	if (typeof message !== 'string')
	{
		return '';
	}

	return message
		.replace(/<br\s*\/?>/gi, '\n')
		.replace(/<[^>]*>/g, '')
		.split('\n')
		.map((line) => line.trim())
		.filter((line) => line !== '' && !/^at\s+\S+/i.test(line))
		.join('\n')
	;
}

function getErrorItemMessage(error)
{
	if (typeof error === 'string')
	{
		return sanitizeMessage(error);
	}

	return sanitizeMessage(error?.message);
}

export function getStageOperationErrorMessage(error, fallbackMessage)
{
	const errors = Array.isArray(error?.errors)
		? error.errors
		: error?.data?.errors
	;
	if (Array.isArray(errors))
	{
		const message = errors
			.map((item) => getErrorItemMessage(item))
			.filter(Boolean)
			.join('\n')
		;
		if (message !== '')
		{
			return message;
		}
	}

	const message = getErrorItemMessage(error);

	return message || fallbackMessage;
}
