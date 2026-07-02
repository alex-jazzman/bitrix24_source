import { Tag, Text } from 'main.core';
import { DateTimeFormat } from 'main.date';

import { BaseField } from './base-field';

export class DateSentField extends BaseField
{
	render(params: { timestamp: number | null | undefined }): void
	{
		if (!params.timestamp)
		{
			return;
		}

		const formattedDate = DateTimeFormat.formatLastActivityDate(params.timestamp);

		const container = Tag.render`
			<div class="passwordless-grid_date-sent-container">${Text.encode(formattedDate)}</div>
		`;

		this.appendToFieldNode(container);
	}
}
