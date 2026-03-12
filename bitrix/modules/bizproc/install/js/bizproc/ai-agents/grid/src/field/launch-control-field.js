import { Dom, Loc, Type, Text, Tag } from 'main.core';
import { DateTimeFormat } from 'main.date';
import { Button, ButtonSize } from 'ui.buttons';
import { Text as TypographyText } from 'ui.system.typography';
import { gridApi as Api } from '../api';
import { RowHelper } from '../row-helper';

import type { LaunchControlFieldType, RagFilesStatusesDataType } from '../types';
import { BaseField } from './base-field';

export class LaunchControlField extends BaseField
{
	render(params: LaunchControlFieldType): void
	{
		if (params.ragFilesStatuses && params.ragFilesStatuses.status) {
			this.#renderLaunchedRagFilesStatuses(params.ragFilesStatuses);
		}
		else if (Type.isNumber(params.launchedAt) && params.launchedAt > 0)
		{
			this.#renderLaunchedDate(params.launchedAt);
		}
		else if (Type.isNumber(params.agentId))
		{
			this.#renderLaunchButton(params);
		}
	}

	#renderLaunchButton(params: { agentId: number }): void
	{
		const button = new Button({
			text: Loc.getMessage('BIZPROC_AI_AGENTS_BUTTON_LAUNCH'),
			size: ButtonSize.SMALL,
			tag: Button.Tag.DIV,
			useAirDesign: true,
			onclick: async (buttonInstance: Button, event): Promise<void> => {
				await this.#handleLaunchButtonClick(params.agentId, buttonInstance, event);
			},
		});

		Dom.attr(button.getContainer(), 'data-test-id', 'bizproc-ai-agents-grid-action-start-button');

		this.appendToFieldNode(button.render());
	}

	async #handleLaunchButtonClick(agentId: number, buttonInstance: Button, event): Promise<void>
	{
		event.stopPropagation();
		buttonInstance.setWaiting(true);

		const gridManager = this.getGridManager();
		if (!gridManager?.validateAiAgentsAvailableByTariff())
		{
			buttonInstance.setWaiting(false);

			return;
		}

		const grid = gridManager.getGrid();
		grid?.tableFade();

		try
		{
			const result = await Api.copyAndStartTemplate(agentId);

			if (!result)
			{
				buttonInstance.setWaiting(false);
				grid?.tableUnfade();

				return;
			}

			buttonInstance.setWaiting(false);

			const columns = result?.columns;
			const actions = result?.actions;

			const newRowFields = RowHelper.prepareNewRowParams(
				columns,
				actions,
			);

			grid?.tableUnfade();

			new RowHelper(grid).addToGrid(newRowFields);
		}
		catch (error)
		{
			buttonInstance.setWaiting(false);
			let message = error?.errors?.[0]?.message;
			if (!message)
			{
				message = Loc.getMessage('BIZPROC_AI_AGENTS_BUTTON_LAUNCH_ERROR');
			}

			grid?.tableUnfade();
			BX.UI.Notification.Center.notify({ content: message });
		}
	}

	#renderLaunchedDate(timestamp: number): void
	{
		const formattedDate = DateTimeFormat.format('j F, G:i', timestamp);

		const dateNode = TypographyText.render(
			formattedDate,
			{
				size: 'xs',
				tag: 'div',
				className: 'launch-control-field-date',
			},
		);

		Dom.attr(dateNode, 'data-test-id', 'bizproc-ai-agents-grid-started-at');

		this.appendToFieldNode(dateNode);
	}

	#renderLaunchedRagFilesStatuses(ragFilesStatuses: ?RagFilesStatusesDataType): void
	{
		if (!ragFilesStatuses || !ragFilesStatuses.status) {
			return;
		}

		const statusNode = TypographyText.render(
			Text.encode(ragFilesStatuses.statusMessage),
			{
				size: 'xs',
				tag: 'span',
				className: 'launch-control-field-rag-files-status',
			},
		);

		const container = Tag.render`<div class="ui-icon-set__scope launch-control-field-rag-files-statuses ${Text.encode(ragFilesStatuses.iconClass)}"></div>`;
		Dom.append(Tag.render`<span class="main-grid-rag-status-icon"></span>`, container);
		Dom.append(statusNode, container);
		if (ragFilesStatuses.descriptionMessage) {
			const fileDesc = ragFilesStatuses.files.map(
				function(file) {
					return `<div style="display: flex; align-items: center; justify-content: space-between;">`
						+ `<div style="text-overflow: ellipsis;overflow: hidden;white-space: nowrap;" title="${Text.encode(file.fileName)}">`
						+ Text.encode(file.fileName)
						+ `</div>`
						+ `<i class="ui-icon-set ${Text.encode(file.iconClass)}" title="${Text.encode(file.statusMessage)}" style="fill:white; background-color:white"></i>`
						+ `</div>`;
				},
			).join('');

			const statusHintNode = document.createElement('span');
			Dom.attr(statusHintNode, 'class', 'launch-control-field-rag-files-hint');
			statusHintNode.dataset.hintHtml = true;
			statusHintNode.dataset.hintInteractivity = true;
			statusHintNode.dataset.hint = `<div class=" --ui-context-content-light">`
				+ `<h4>${Text.encode(ragFilesStatuses.statusMessage)}</h4>`
				+ `<div>${fileDesc}</div>`
				+ `<br><hr><br>`
				+ `<div>${Text.encode(ragFilesStatuses.descriptionMessage)}</div>`
				+ `</div>`;

			Dom.append(statusHintNode, container);
		}

		this.appendToFieldNode(container);
		BX.UI.Hint.init(this.getFieldNode());
	}
}
