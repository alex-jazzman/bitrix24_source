export const MAX_CONCURRENT_RECIPIENTS = 3;

export const ForwardMessageState = {
	success: 'success',
	failure: 'failure',
	unknown: 'unknown',
};

export const ForwardRecipientState = {
	success: 'success',
	failure: 'failure',
	unknown: 'unknown',
};

export const ForwardFailureGroup = {
	transientUnknown: 'transientUnknown',
	storage: 'storage',
	fileUnavailable: 'fileUnavailable',
	chatUnavailable: 'chatUnavailable',
	notWritable: 'notWritable',
};

const FileUnavailableFailureCode = new Set([
	'DISK_NOT_INSTALLED',
	'FILE_NOT_FOUND',
]);

const NonRetryableFailureCode = new Set([
	'ACCESS_DENIED',
	'MESSAGE_ACCESS_DENIED',
	'TEXT_FIELD_DISABLED',
	'CHAT_NOT_FOUND',
	...FileUnavailableFailureCode,
]);

export const isForwardFailureRetryable = (code: ?string): boolean => {
	return !NonRetryableFailureCode.has(code);
};

export const getForwardFailureGroup = (code: ?string): string => {
	if (code === 'STORAGE_QUOTA_EXCEEDED')
	{
		return ForwardFailureGroup.storage;
	}

	if (code === 'CHAT_NOT_FOUND')
	{
		return ForwardFailureGroup.chatUnavailable;
	}

	if (FileUnavailableFailureCode.has(code))
	{
		return ForwardFailureGroup.fileUnavailable;
	}

	if (NonRetryableFailureCode.has(code))
	{
		return ForwardFailureGroup.notWritable;
	}

	return ForwardFailureGroup.transientUnknown;
};
