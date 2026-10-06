import {
	LargeAttachment as MailLargeAttachment,
	type LargeAttachmentState,
} from 'mail.client.large-attachment';

import { LegacyEmailAdapter } from './adapter/legacy-email-adapter';
import { LegacySubmitGuard } from './legacy-submit-guard';
import { handleLegacySubmitPreparation } from './legacy-submit-preparation';
import { extractErrorCode } from './notification';

const SEND_CONTRACT_FIELD = '__largeAttachments';

export type LegacyEmailLargeAttachmentParams = {
	formId: string,
	uploaderControlId: string,
	lheJsName: string,
	messageId: number,
	featureAvailable: boolean,
	folderName: string,
	maxSize: number,
	getContainer: () => HTMLElement | null,
};

export class LegacyEmailLargeAttachment
{
	#core: MailLargeAttachment;
	#adapter: LegacyEmailAdapter;
	#submitGuard: LegacySubmitGuard = new LegacySubmitGuard();
	#destroyed: boolean = false;

	constructor(params: LegacyEmailLargeAttachmentParams)
	{
		this.#adapter = new LegacyEmailAdapter(params);
		this.#core = MailLargeAttachment.init(
			{
				formId: params.formId,
				uploaderControlId: params.uploaderControlId,
				messageId: params.messageId,
				featureAvailable: params.featureAvailable,
				folderName: params.folderName,
				maxSize: params.maxSize,
				context: 'crm',
				postSendPrompt: (_links, onDelete): void => {
					this.#adapter.confirmDelete(onDelete);
				},
			},
			this.#adapter,
		);
	}

	beforeSubmit(): boolean
	{
		if (this.#destroyed)
		{
			return false;
		}

		const submitState = this.#core.prepareSubmit();
		if (!handleLegacySubmitPreparation(submitState, this.#adapter))
		{
			return false;
		}

		if (
			!this.#submitGuard.tryStart(
				this.#core.getState(),
				this.#adapter.hasPendingUploads(),
			)
		)
		{
			this.#adapter.showSubmitPending();

			return false;
		}

		this.#adapter.notifySubmit();

		return true;
	}

	applySendContract(data: Record<string, unknown>): Record<string, unknown>
	{
		return {
			...data,
			[SEND_CONTRACT_FIELD]: this.#adapter.getSendContracts(),
		};
	}

	handleSendSuccess(): void
	{
		this.#submitGuard.finish();
		this.#adapter.notifySendSuccess();
	}

	handleSendError(response: unknown): boolean
	{
		this.#submitGuard.finish();
		const isLargeAttachmentError = extractErrorCode(response).startsWith('MAIL_LA_');
		if (!isLargeAttachmentError)
		{
			return false;
		}

		this.#adapter.routeSendError(response);
		this.#adapter.notifySendError();

		return true;
	}

	getState(): LargeAttachmentState
	{
		return this.#core.getState();
	}

	destroy(): void
	{
		if (this.#destroyed)
		{
			return;
		}

		this.#destroyed = true;
		this.#submitGuard.finish();
		this.#core.destroy();
	}
}
