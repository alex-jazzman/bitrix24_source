import type { ProgressBarRepository } from 'crm.autorun';
import { BatchRestartAutomationManager, ProcessRegistry } from 'crm.autorun';
import { Text } from 'main.core';
import type { SettingsCollection } from 'main.core.collections';
import { showAnotherProcessRunningNotification } from '../../../utils';
import { BaseHandler } from '../base-handler';

export class ExecuteRestartAutomation extends BaseHandler
{
	#entityTypeId: number;

	#progressBarRepo: ProgressBarRepository;

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
		return 'BatchManager:restartAutomation';
	}

	injectDependencies(progressBarRepo: ProgressBarRepository, extensionSettings: SettingsCollection): void
	{
		this.#progressBarRepo = progressBarRepo;
	}

	execute(grid: BX.Main.grid, selectedIds: number[], forAll: boolean): void
	{
		const restartAutomationManager = this.#getRestartAutomationManager(grid.getId());
		if (restartAutomationManager === null)
		{
			return;
		}

		if (forAll)
		{
			restartAutomationManager.resetEntityIds();
		}
		else
		{
			restartAutomationManager.setEntityIds(selectedIds);
		}

		restartAutomationManager.execute();
	}

	executeForKanban(grid: BX.CRM.Kanban.Grid, selectedIds: number[]): void
	{
		const restartAutomationManager = this.#getRestartAutomationManager(grid.getData().gridId);
		if (restartAutomationManager === null)
		{
			return;
		}

		restartAutomationManager.setEntityIds(selectedIds);

		restartAutomationManager.execute();
	}

	#getRestartAutomationManager(gridId: string): ?BatchRestartAutomationManager
	{
		let restartAutomationManager = BatchRestartAutomationManager.getItem(gridId);
		if (restartAutomationManager?.isRunning())
		{
			return null;
		}

		if (ProcessRegistry.isProcessRunning(gridId))
		{
			showAnotherProcessRunningNotification();

			return null;
		}

		if (!restartAutomationManager)
		{
			restartAutomationManager = BatchRestartAutomationManager.create(
				gridId,
				{
					gridId,
					entityTypeId: this.#entityTypeId,
					container: this.#progressBarRepo.getOrCreateProgressBarContainer('restartAutomation').id,
				},
			);
		}

		return restartAutomationManager;
	}
}
