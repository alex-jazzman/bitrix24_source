import type { ProgressBarRepository } from 'crm.autorun';
import { MessageBox } from 'ui.dialogs.messagebox';
import { Loc, Reflection, Text } from 'main.core';
import type { SettingsCollection } from 'main.core.collections';
import { BaseHandler } from './base-handler';

export class OpenTaskCreationForm extends BaseHandler
{
	#entityTypeId: number;

	#extensionSettings: SettingsCollection;

	constructor({ entityTypeId })
	{
		super();

		this.#entityTypeId = Text.toInteger(entityTypeId);
		if (!BX.CrmEntityType.isDefined(this.#entityTypeId))
		{
			throw new Error('entityTypeId is required');
		}
	}

	static getEventName(): string
	{
		return 'openTaskCreationForm';
	}

	injectDependencies(progressBarRepo: ProgressBarRepository, extensionSettings: SettingsCollection)
	{
		this.#extensionSettings = extensionSettings;
	}

	execute(grid: BX.Main.grid, selectedIds: number[], forAll: boolean)
	{
		const urlTemplate = String(this.#extensionSettings.get('taskCreateUrl'));
		if (urlTemplate === '')
		{
			return;
		}

		const maxBindingsCount = Number(this.#extensionSettings.get('maxBindingsCount'));
		if (maxBindingsCount !== 0 && selectedIds.length > maxBindingsCount)
		{
			const alertText = Loc.getMessage(
				'CRM_ENTITY_LIST_PANEL_CREATE_TASK_MAX_BINDINGS_ERROR',
				{
					'#MAX_BINDINGS_COUNT#': maxBindingsCount,
				},
			);
			MessageBox.alert(alertText);

			return;
		}

		const entityTypeName = BX.CrmEntityType.resolveName(this.#entityTypeId);
		const entityKeys = selectedIds.map((id) => BX.CrmEntityType.prepareEntityKey(entityTypeName, id));

		const url = urlTemplate
			.replace(encodeURIComponent('#USER_ID#'), Loc.getMessage('USER_ID'))
			.replace(encodeURIComponent('#ENTITY_KEYS#'), entityKeys.join(';'))
		;

		if (Reflection.getClass('BX.SidePanel.Instance.open'))
		{
			BX.SidePanel.Instance.open(url);
		}
		else
		{
			window.open(url);
		}
	}
}
