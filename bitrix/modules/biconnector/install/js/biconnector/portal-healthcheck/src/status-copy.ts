import { Loc } from 'main.core';

import { type HealthcheckStatus, type StatusTone } from './types';

type StatusCopy = {
	title: string;
	detail: string;
	tone: StatusTone;
};

const ERROR_CODES = new Set([
	'HEALTHCHECK_TOKEN_INVALID', 'PORTAL_URL_INVALID', 'PORTAL_HOST_MISMATCH',
	'LICENSE_INVALID', 'HEALTHCHECK_NOT_SUPPORTED', 'HTTPS_REQUIRED',
	'HEALTHCHECK_RATE_LIMITED',
	'HEALTHCHECK_NOT_CONFIGURED', 'HEALTHCHECK_QUEUE_FULL', 'HEALTHCHECK_CONTROLLER_UNAVAILABLE',
	'PROXY_ERROR', 'PROXY_NETWORK_ERROR', 'HEALTHCHECK_PROTOCOL_ERROR',
	'HEALTHCHECK_RESULT_TIMEOUT', 'TARGET_NOT_HTTPS', 'TARGET_NOT_ALLOWED', 'CONTROLLER_REJECTED',
	'ERR_NETWORK', 'ERR_PRIVATE_ADDRESS', 'ERR_REDIRECT', 'ERR_HTTP_STATUS',
	'ERR_INVALID_RESPONSE', 'ERR_SSH_UNAVAILABLE', 'ERR_SCRIPT_UNAVAILABLE',
	'ERR_SCRIPT_TIMEOUT', 'ERR_INVALID_OUTPUT', 'ERR_DNS_RESOLUTION',
	'ERR_CONNECTION_REFUSED', 'ERR_TIMEOUT', 'ERR_TLS', 'ERR_TLS_CERTIFICATE',
	'ERR_CURL_FAILED', 'ERR_UNKNOWN',
]);

function message(key: string): string
{
	return Loc.getMessage(`BICONNECTOR_PORTAL_HEALTHCHECK_${key}`) ?? '';
}

export function getErrorDetail(code?: string | null): string
{
	if (code && ERROR_CODES.has(code))
	{
		return message(`CODE_${code}`);
	}

	return message('ERROR_GENERIC');
}

export function getStatusCopy(
	status: HealthcheckStatus,
	code?: string | null,
	hasFailures = false,
): StatusCopy
{
	if (status === 'COMPLETED')
	{
		if (code === 'HEALTHCHECK_PROTOCOL_ERROR')
		{
			return {
				title: message('STATUS_PROTOCOL'),
				detail: getErrorDetail(code),
				tone: 'warning',
			};
		}

		if (code)
		{
			return {
				title: message('STATUS_START_REJECTED'),
				detail: getErrorDetail(code),
				tone: 'warning',
			};
		}

		return hasFailures
			? { title: message('STATUS_PARTIAL'), detail: message('PARTIAL_DESCRIPTION'), tone: 'warning' }
			: { title: message('STATUS_SUCCESS'), detail: message('SUCCESS_DESCRIPTION'), tone: 'success' };
	}

	const statuses: Record<Exclude<HealthcheckStatus, 'COMPLETED'>, StatusCopy> = {
		IDLE: { title: message('STATUS_IDLE'), detail: message('IDLE_DESCRIPTION'), tone: 'neutral' },
		PENDING: { title: message('STATUS_PENDING'), detail: message('PENDING_DESCRIPTION'), tone: 'progress' },
		RUNNING: { title: message('STATUS_RUNNING'), detail: message('RUNNING_DESCRIPTION'), tone: 'progress' },
		PORTAL_UNAVAILABLE: {
			title: message('STATUS_PORTAL_UNAVAILABLE'),
			detail: message('PORTAL_UNAVAILABLE_DESCRIPTION'),
			tone: 'error',
		},
		NODES_CHECK_REJECTED: {
			title: message('STATUS_NODES_CHECK_REJECTED'),
			detail: message('NODES_CHECK_REJECTED_DESCRIPTION'),
			tone: 'warning',
		},
		RESULT_MISSING: {
			title: message('STATUS_RESULT_MISSING'),
			detail: message('RESULT_MISSING_DESCRIPTION'),
			tone: 'error',
		},
		FAILED: { title: message('STATUS_ERROR'), detail: message('ERROR_DESCRIPTION'), tone: 'error' },
	};
	const copy = statuses[status];
	if (!code)
	{
		return copy;
	}

	return {
		...copy,
		title: status === 'IDLE' ? message('STATUS_START_REJECTED') : copy.title,
		detail: getErrorDetail(code),
		tone: status === 'IDLE' ? 'warning' : copy.tone,
	};
}

const REQUEST_ERROR_KEYS = new Map([
	['NETWORK_ERROR', 'REQUEST_NETWORK_ERROR'],
	['ACCESS_DENIED', 'REQUEST_ACCESS_DENIED'],
	['HEALTHCHECK_MODE_UNAVAILABLE', 'REQUEST_MODE_UNAVAILABLE'],
	['invalid_csrf', 'REQUEST_SESSION_EXPIRED'],
	['invalid_authentication', 'REQUEST_SESSION_EXPIRED'],
]);

export function getRequestErrorDetail(code: string): string
{
	return message(REQUEST_ERROR_KEYS.get(code) ?? 'REQUEST_ERROR_GENERIC');
}
