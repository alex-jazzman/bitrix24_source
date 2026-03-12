import { Loc, Type } from 'main.core';
import { MessageBox, MessageBoxButtons } from 'ui.dialogs.messagebox';

import 'ui.design-tokens';
import '../style.css';

export class TemplateProcesses
{
	#signedParameters: string;
	#componentName: string;
	#gridId: string;

	constructor(
		options = {
			signedParameters: string,
			componentName: string,
			gridId: string,
		},
	)
	{
		this.#signedParameters = options.signedParameters;
		this.#componentName = options.componentName;
		this.#gridId = options.gridId;
	}

	#getSelectedTemplateIds(): string[]
	{
		const grid = this.#getGrid();

		if (Type.isNull(grid))
		{
			return [];
		}

		const $templateIds = grid.getRows().getSelectedIds();

		if ($templateIds.length === 0)
		{
			return [];
		}

		return $templateIds;
	}

	deleteBulkTemplateAction(): void
	{
		const templateIds = this.#getSelectedTemplateIds();

		if (templateIds.length === 0)
		{
			return;
		}

		BX.ajax.runComponentAction(this.#componentName, 'deleteBulkTemplate', {
			mode: 'class',
			data: {
				ids: templateIds,
			},
		}).then(() => {
			this.#reloadGrid();
		}).catch((response) => {
			MessageBox.alert(response.errors[0].message);
		});
	}

	editTemplateAction(id: number): void
	{
		const url = `/bizprocdesigner/editor/?ID=${encodeURIComponent(id)}`;

		window.open(url, '_blank');
	}

	deleteTemplateAction(id: number): void
	{
		const me = this;

		new MessageBox({
			message: Loc.getMessage('BIZPROC_TEMPLATE_PROCESSES_DELETE_CONFIRMATION'),
			okCaption: Loc.getMessage('BIZPROC_TEMPLATE_PROCESSES_DELETE_OK_CAPTION_TEXT'),
			onOk: (messageBox) => {
				BX.ajax.runComponentAction(this.#componentName, 'deleteTemplate', {
					mode: 'class',
					data: {
						id: id,
					},
				}).then(() => {
					me.#reloadGrid();
					messageBox.close();
				}).catch((response) => {
					MessageBox.alert(response.errors[0].message);

					messageBox.close();
				});
			},
			buttons: MessageBoxButtons.OK_CANCEL,
			popupOptions: {
				events: {
					onAfterShow: (event) => {
						const okBtn = event.getTarget().getButton('ok');

						if (okBtn)
						{
							okBtn.getContainer().focus();
						}
					},
				},
			},
			useAirDesign: true,
		}).show();
	}

	#reloadGrid()
	{
		const grid = this.#getGrid();

		if (grid)
		{
			grid.reload();
		}
	}

	#getGrid(): BX.Main.grid | null
	{
		if (this.#gridId)
		{
			return BX.Main.gridManager && BX.Main.gridManager.getInstanceById(this.#gridId);
		}

		return null;
	}

	applyActionPanelValues(): void
	{
		const grid = this.#getGrid();
		const actionsPanel = grid?.getActionsPanel();

		if (!Type.isObject(grid) || !Type.isObject(actionsPanel))
		{
			return;
		}

		const action: object = actionsPanel.getValues();

		if (!action.hasOwnProperty('groupAction'))
		{
			return;
		}

		if (action['groupAction'] === 'delete')
		{
			this.deleteBulkTemplateAction();
		}
	}
}