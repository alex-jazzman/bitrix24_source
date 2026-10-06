import { type LargeAttachmentState } from 'mail.client.large-attachment';

export class LegacySubmitGuard
{
	#submitting: boolean = false;

	tryStart(state: LargeAttachmentState, hasPendingUploads: boolean): boolean
	{
		if (this.#submitting || hasPendingUploads || state === 'converting')
		{
			return false;
		}

		this.#submitting = true;

		return true;
	}

	finish(): void
	{
		this.#submitting = false;
	}
}
