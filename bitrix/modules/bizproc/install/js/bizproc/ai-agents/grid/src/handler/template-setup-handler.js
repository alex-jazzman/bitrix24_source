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

		rowHelper.markAsLoading(row);

		const updatedTemplateRow: FetchAiAgentRowResponse = await gridApi.fetchRow(templateId);

		if (!updatedTemplateRow)
		{
			rowHelper.markAsLoaded(row);
			this.#grid.reload();

			return;
		}

		rowHelper.update(row, updatedTemplateRow.columns);
		rowHelper.markAsLoaded(row);
		rowHelper.highlight(row);
	}
}
