import { Dom, Loc, Type } from 'main.core';
import { DateTimeFormat } from 'main.date';
import { Button, ButtonSize } from 'ui.buttons';
import { Text as TypographyText } from 'ui.system.typography';
import { gridApi as Api } from '../api';
import { RowHelper } from '../row-helper';

import type { LaunchControlFieldType } from '../types';
import { BaseField } from './base-field';

export class LaunchControlField extends BaseField
{
	render(params: LaunchControlFieldType): void
	{
		if (Type.isNumber(params.launchedAt) && params.launchedAt > 0)
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
				const grid = this.getGrid();

				event.stopPropagation();
				buttonInstance.setWaiting(true);

				grid?.tableFade();

				try
				{
					const result = await Api.copyAndStartTemplate(params.agentId);
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
			},
		});

		Dom.attr(button.getContainer(), 'data-test-id', 'bizproc-ai-agents-grid-action-start-button');

		this.appendToFieldNode(button.render());
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
}
