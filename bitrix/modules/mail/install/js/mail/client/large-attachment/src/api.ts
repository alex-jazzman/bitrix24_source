import { ajax } from 'main.core';

// Server-side error codes routed by the caller (see LargeAttachment controller, API-01).
export const ConvertErrorCode = Object.freeze({
	TariffUnavailable: 'MAIL_LA_TARIFF_UNAVAILABLE',
	AccessDenied: 'MAIL_LA_ACCESS_DENIED',
	InvalidContext: 'MAIL_LA_INVALID_CONTEXT',
	DiskUnavailable: 'MAIL_LA_DISK_UNAVAILABLE',
	// Disk refuses the service link by tariff feature: routed to the same tariff screen as TariffUnavailable.
	DiskFeatureUnavailable: 'MAIL_LA_DISK_FEATURE_UNAVAILABLE',
	NoSpace: 'MAIL_LA_NO_SPACE',
	UploadFailed: 'MAIL_LA_UPLOAD_FAILED',
});

export type LargeAttachmentContext = 'mail' | 'crm';

export type ConvertRequest = {
	mailboxId: number | null,
	fileIds: number[],
	replacementToken?: string,
};

// DTO-01
export type ConvertResult = {
	publicUrl: string,
	token: string,
	fileIds: number[],
	sourceFileIds?: number[],
	folderName: string,
};

export type ConvertError = {
	code: string,
	message: string,
};

export type DeleteUploadedRequest = {
	token: string,
};

// DTO-02
export type DeleteUploadedResult = {
	deleted: boolean,
};

type AjaxErrorResponse = {
	errors?: Array<{ code?: string, message?: string }>,
};

const ACTION_CONVERT = 'mail.largeAttachment.convert';
const ACTION_DELETE = 'mail.largeAttachment.deleteUploaded';
const ACTION_FINALIZE_REPLACEMENT = 'mail.largeAttachment.finalizeReplacement';
const CONTEXT_MAIL: LargeAttachmentContext = 'mail';

class LargeAttachmentApi
{
	convert(
		request: ConvertRequest,
		context: LargeAttachmentContext = CONTEXT_MAIL,
	): Promise<ConvertResult>
	{
		return ajax
			.runAction(ACTION_CONVERT, {
				data: {
					mailboxId: request.mailboxId,
					fileIds: request.fileIds,
					replacementToken: request.replacementToken ?? null,
					context,
				},
			})
			.then((response: { data?: Partial<ConvertResult> }): ConvertResult => this.#mapResult(response?.data))
			.catch((response: AjaxErrorResponse): never => {
				throw this.#mapError(response);
			});
	}

	// API-02: removes a previously uploaded set addressed by its opaque token. Ownership is enforced
	// server-side against the current user; errors arrive as typed codes just like convert().
	deleteUploaded(request: DeleteUploadedRequest): Promise<DeleteUploadedResult>
	{
		return ajax
			.runAction(ACTION_DELETE, {
				data: {
					token: request.token,
				},
			})
			.then((response: { data?: { deleted?: unknown } }): DeleteUploadedResult => ({
				deleted: Boolean(response?.data?.deleted),
			}))
			.catch((response: AjaxErrorResponse): never => {
				throw this.#mapError(response);
			});
	}

	finalizeReplacement(previousToken: string, currentToken: string): Promise<void>
	{
		return ajax
			.runAction(ACTION_FINALIZE_REPLACEMENT, {
				data: { previousToken, currentToken },
			})
			.then((): void => {})
			.catch((response: AjaxErrorResponse): never => {
				throw this.#mapError(response);
			});
	}

	#mapResult(data?: Partial<ConvertResult>): ConvertResult
	{
		return {
			publicUrl: String(data?.publicUrl ?? ''),
			token: String(data?.token ?? ''),
			fileIds: Array.isArray(data?.fileIds) ? data.fileIds.map(Number) : [],
			folderName: String(data?.folderName ?? ''),
		};
	}

	#mapError(response?: AjaxErrorResponse): ConvertError
	{
		const error = response?.errors?.[0];

		return {
			code: error?.code ?? '',
			message: error?.message ?? '',
		};
	}
}

export const largeAttachmentApi = new LargeAttachmentApi();
