import { BaseField } from './base-field';
import { Tag, Text } from 'main.core';

export type MailboxNameFieldType = {
	mailboxName: string,
}

export class MailboxNameField extends BaseField
{
	#mailboxName: string;

	render(params: MailboxNameFieldType): void
	{
		this.#mailboxName = params.mailboxName;

		if (this.#mailboxName === '')
		{
			this.#renderEmpty();
		}

		this.#renderMailboxName();
	}

	#renderEmpty(): void
	{
		const emptyContainer = Tag.render`
			<div class="mailbox-grid_mailbox-name --empty">
			</div>
		`;

		this.appendToFieldNode(emptyContainer);
	}

	#renderMailboxName(): void
	{
		const mailboxNameContainer = Tag.render`
			<div class="mailbox-grid_mailbox-name-container mailbox-grid_single-line_field">
				${Text.encode(this.#mailboxName)}
			</div>
		`;

		this.appendToFieldNode(mailboxNameContainer);
	}
}
