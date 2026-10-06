export const ERROR_TYPE_IMAP_CONNECTION = 'imap_connection';
export const ERROR_TYPE_AUTH = 'auth';
export const ERROR_TYPE_SMTP_CONNECTION = 'smtp_connection';

export const ALLOWED_CONNECTION_ERROR_TYPES = [
	ERROR_TYPE_IMAP_CONNECTION,
	ERROR_TYPE_AUTH,
	ERROR_TYPE_SMTP_CONNECTION,
];

// Server error code for an address already connected on the portal by someone else:
// see MailboxConnector::EXISTS_ON_PORTAL_ERROR_KEY.
export const PORTAL_EMAIL_CONFLICT_ERROR_CODE = 'EXISTS_ON_PORTAL_ERROR';
