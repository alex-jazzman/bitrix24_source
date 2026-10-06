import { ErrorCode } from '../../const/picker';

// Localized human text for each backend request-level code the picker surfaces.
// `invalid_context` is intentionally absent: it is a terminal session outcome
// handled by the facade, never a retryable content error. Unknown codes,
// transport failures and internal contract violations all collapse to the generic
// message, which never leaks server technical text or object existence.
const MESSAGE_BY_CODE: { readonly [key: string]: string } = Object.freeze({
	[ErrorCode.InvalidFilter]: 'DISK_PICKER_ERROR_INVALID_FILTER',
	[ErrorCode.InvalidOrder]: 'DISK_PICKER_ERROR_INVALID_ORDER',
	[ErrorCode.InvalidQuery]: 'DISK_PICKER_ERROR_INVALID_QUERY',
	[ErrorCode.NotFound]: 'DISK_PICKER_ERROR_NOT_FOUND',
	[ErrorCode.TotalUnavailable]: 'DISK_PICKER_ERROR_TOTAL_UNAVAILABLE',
	[ErrorCode.TooManyItems]: 'DISK_PICKER_ERROR_TOO_MANY_ITEMS',
});

const GENERIC_MESSAGE = 'DISK_PICKER_ERROR_GENERIC';

// Returns the lang message code for a backend error code. Any unmapped or unknown
// code falls back to the safe generic message.
export function errorMessageCode(code: string | null): string
{
	if (code !== null && Object.prototype.hasOwnProperty.call(MESSAGE_BY_CODE, code))
	{
		return MESSAGE_BY_CODE[code];
	}

	return GENERIC_MESSAGE;
}
