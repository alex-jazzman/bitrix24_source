import { Loc } from 'main.core';

import type { FormState, ValidationErrors } from '../types';

// Match the legacy wizard's regex: strict local-part charset and a 2-20 char TLD.
const EMAIL_ATOM = "[=a-z0-9_+~'!$&*^`|#%/?{}-]";
const EMAIL_REGEX = new RegExp(
	`^\\s*${EMAIL_ATOM}+(\\.${EMAIL_ATOM}+)*@([a-z0-9-]+\\.)+[a-z0-9-]{2,20}\\s*$`,
	'i',
);
const HOSTNAME_REGEX = /^\s*((?:http|https|ssl|tls|imap|smtp):\/\/)?([\dA-Za-z](-*[\dA-Za-z])*\.?)+\s*$/i;
const LINK_REGEX = /^\s*(https?:\/\/)?([\dA-Za-z](-*[\dA-Za-z])*\.?)+(:\d+)?\/?.*$/i;

export function validateEmail(email: string): boolean
{
	return EMAIL_REGEX.test(email);
}

export function validateHostname(hostname: string): boolean
{
	return HOSTNAME_REGEX.test(hostname);
}

export function validateLink(link: string): boolean
{
	return LINK_REGEX.test(link);
}

export function validatePort(port: string | number): boolean
{
	const portNum = parseInt(String(port), 10);

	return portNum >= 1 && portNum <= 65535;
}

export function validateSmtpPassword(password: string): boolean
{
	if (password.startsWith('^'))
	{
		return false;
	}

	return !password.includes('\0');
}

export function validateForm(state: FormState): ValidationErrors
{
	const errors: ValidationErrors = {};

	if (state.mode === 'create')
	{
		if (!state.connection.email || !validateEmail(state.connection.email))
		{
			errors.email = Loc.getMessage('MAIL_CONFIG_FORM_ERROR_INVALID_EMAIL') ?? '';
		}

		if (!state.connection.isOAuth)
		{
			if (!state.connection.password)
			{
				errors.password = Loc.getMessage('MAIL_CONFIG_FORM_ERROR_EMPTY_PASSWORD') ?? '';
			}

			if (!state.connection.login && !state.connection.email)
			{
				errors.login = Loc.getMessage('MAIL_CONFIG_FORM_ERROR_EMPTY_LOGIN') ?? '';
			}
		}
	}

	if (state.connection.server && !validateHostname(state.connection.server))
	{
		errors.server = Loc.getMessage('MAIL_CONFIG_FORM_ERROR_INVALID_SERVER') ?? '';
	}

	if (state.connection.port && !validatePort(state.connection.port))
	{
		errors.port = Loc.getMessage('MAIL_CONFIG_FORM_ERROR_INVALID_PORT') ?? '';
	}

	if (state.mailbox.link && !validateLink(state.mailbox.link))
	{
		errors.link = Loc.getMessage('MAIL_CONFIG_FORM_ERROR_INVALID_LINK') ?? '';
	}

	if (state.smtp.enabled)
	{
		if (state.smtp.server && !validateHostname(state.smtp.server))
		{
			errors.smtpServer = Loc.getMessage('MAIL_CONFIG_FORM_ERROR_INVALID_SERVER') ?? '';
		}

		if (state.smtp.port && !validatePort(state.smtp.port))
		{
			errors.smtpPort = Loc.getMessage('MAIL_CONFIG_FORM_ERROR_INVALID_PORT') ?? '';
		}

		if (state.smtp.password && !validateSmtpPassword(state.smtp.password))
		{
			errors.smtpPassword = Loc.getMessage('MAIL_CONFIG_FORM_ERROR_INVALID_SMTP_PASSWORD') ?? '';
		}

		if (state.smtp.useLimit)
		{
			const limit = Number(state.smtp.limit);
			if (!Number.isFinite(limit) || limit <= 0)
			{
				errors.smtpLimit = Loc.getMessage('MAIL_CONFIG_FORM_ERROR_INVALID_SMTP_LIMIT') ?? '';
			}
		}
	}

	return errors;
}
