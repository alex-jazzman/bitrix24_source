import { BaseField } from './base-field';
import { Tag, Text } from 'main.core';

export type DiskAmountFieldType = {
	diskAmount: string,
}

export class DiskAmountField extends BaseField
{
	#diskAmount: string;

	render(params: DiskAmountFieldType): void
	{
		this.#diskAmount = params.diskAmount;

		if (this.#diskAmount === '')
		{
			this.#renderEmpty();
		}

		this.#renderMailboxName();
	}

	#renderEmpty(): void
	{
		const emptyContainer = Tag.render`
			<div class="mailbox-grid_disk-amount --empty">
			</div>
		`;

		this.appendToFieldNode(emptyContainer);
	}

	#renderMailboxName(): void
	{
		const diskAmountContainer = Tag.render`
			<div class="mailbox-grid_disk-amount-container mailbox-grid_single-line_field">
				${Text.encode(this.#diskAmount)}
			</div>
		`;

		this.appendToFieldNode(diskAmountContainer);
	}
}
