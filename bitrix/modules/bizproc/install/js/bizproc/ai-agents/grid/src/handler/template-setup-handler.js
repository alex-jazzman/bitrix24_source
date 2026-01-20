import { Loc } from 'main.core';
import type { BaseEvent } from 'main.core.events';
import { gridApi } from '../api';
import { RowHelper } from '../row-helper';
import type { FetchAiAgentRowResponse } from '../types';

export class TemplateSetupHandler
{
	#grid: BX.Main.grid;

	constructor(grid: BX.Main.grid)
	{
		this.#grid = grid;
	}

	async handle(event: BaseEvent): Promise<void>
	{
		const eventData = event.getData();
		const templateId = eventData?.templateId;

		if (!templateId)
		{
			return;
		}

		const rowHelper = new RowHelper(this.#grid);
		const row = rowHelper.getByTemplateId(templateId);

		if (!row)
		{
			return;
		}

		try
		{
			rowHelper.markAsLoading(row);

			const updatedTemplateRow: FetchAiAgentRowResponse = await gridApi.fetchRow(templateId);

			if (!updatedTemplateRow)
			{
				throw new Error(Loc.getMessage('BIZPROC_AI_AGENTS_GRID_DEFAULT_ACTION_ERROR'));
			}

			rowHelper.update(row, updatedTemplateRow.columns);
			rowHelper.markAsLoaded(row);
			rowHelper.highlight(row);
		}
		catch (error)
		{
			rowHelper.markAsLoaded(row);
			this.#notifyUser(error.message || Loc.getMessage('BIZPROC_AI_AGENTS_GRID_DEFAULT_ACTION_ERROR'));

			this.#grid.reload();
		}
	}

	#notifyUser(text: string): void
	{
		BX.UI.Notification.Center.notify({
			content: text,
		});
	}
}
