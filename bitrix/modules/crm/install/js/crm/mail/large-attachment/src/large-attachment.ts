import {
	LargeAttachment as MailLargeAttachment,
	type LargeAttachmentParams as MailLargeAttachmentParams,
	type LargeAttachmentSubmitState,
} from 'mail.client.large-attachment';

import { MainMailFormAdapter } from './adapter/main-mail-form-adapter';
import {
	LegacyEmailLargeAttachment,
	type LegacyEmailLargeAttachmentParams,
} from './legacy-email-large-attachment';

export type MainMailLargeAttachmentParams = Omit<
	MailLargeAttachmentParams,
	'context' | 'postSendPrompt'
>;

export class LargeAttachment
{
	static init(params: MainMailLargeAttachmentParams): MailLargeAttachment
	{
		const adapter = new MainMailFormAdapter(params);
		adapter.startErrorRouting();

		const largeAttachment = MailLargeAttachment.init(
			{
				...params,
				context: 'crm',
				postSendPrompt: (_links, onDelete): void => {
					adapter.confirmDelete(onDelete);
				},
			},
			adapter,
		);
		adapter.startSubmitGuard((): LargeAttachmentSubmitState => largeAttachment.prepareSubmit());

		return largeAttachment;
	}

	static initLegacy(params: LegacyEmailLargeAttachmentParams): LegacyEmailLargeAttachment
	{
		return new LegacyEmailLargeAttachment(params);
	}
}
