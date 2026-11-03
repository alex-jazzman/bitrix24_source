/**
 * Codes the header decides on by itself, before a request is made at all. The codes the controller
 * answers with, and the ones the service adds to them, belong to the service - `HeaderServiceErrorCode`.
 */
export const HeaderErrorCode = Object.freeze({
	NoDocumentSession: 'NO_DOCUMENT_SESSION',
} as const);
