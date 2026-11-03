import { Event, Loc } from 'main.core';
import { getMigrationState, type MigrationState, type MigrationStatusDto } from 'mail.migration-state';
import { Chip } from 'ui.system.chip';

import { ActionFactory } from './action/action-factory';
import { MigrationProgressPanelLoader } from './migration-progress-panel-loader';

type runActionConfig = {
	actionId: string,
	options: { [key: string]: any },
	params: { [key: string]: any },
}

type panelActionParams = {
	actionId: string,
	gridId: string,
}

type MigrationStateFactory = (mailboxId: number) => MigrationState;

const createdActionPanels = new Map();
const migrationRestrictedActions = new Set(['disconnectMailbox']);
const migrationStatusMessages = {
	waiting: 'MAIL_MIGRATION_PROGRESS_STATUS_WAITING',
	manual_waiting: 'MAIL_MIGRATION_PROGRESS_STATUS_MANUAL_WAITING',
	blocked: 'MAIL_MIGRATION_PROGRESS_STATUS_BLOCKED',
	cancelling: 'MAIL_MIGRATION_PROGRESS_STATUS_CANCELLING',
	switching: 'MAIL_MIGRATION_PROGRESS_STATUS_SWITCHING',
};

export function isMigrationRestrictedAction(actionId: string): boolean
{
	return migrationRestrictedActions.has(actionId);
}

BX.addCustomEvent('BX.UI.ActionPanel:created', (panel) => {
	const gridId = panel?.params?.gridId;
	if (gridId)
	{
		createdActionPanels.set(gridId, panel);
	}
});

export class GridManager
{
	static instances: Array<GridManager> = [];
	#gridId: string;
	#migrationStateFactory: MigrationStateFactory;
	#migrationStateSubscriptions: Map<number, { state: MigrationState, unsubscribe: () => void }> = new Map();
	#actionPanel: ?BX.UI.ActionPanel = null;
	#panelObserver: ?MutationObserver = null;
	#migrationDisconnectState: WeakMap<BX.UI.ActionPanel.Item, { disabled: boolean, title: ?string }> = new WeakMap();
	#handleSelectedRows: Function;
	#handleGridUpdated: Function;
	#handleActionPanelCreated: Function;
	#handlePageHide: Function;

	constructor(gridId: string, migrationStateFactory: MigrationStateFactory = getMigrationState)
	{
		this.#gridId = gridId;
		this.#migrationStateFactory = migrationStateFactory;
		this.#handleSelectedRows = (): void => this.#syncMigrationRestrictions();
		this.#handleGridUpdated = (grid): void => {
			if (grid && grid !== this.getGrid())
			{
				return;
			}

			this.#syncMigrationStateSubscriptions();
			this.#syncMigrationRestrictions();
		};

		this.#handleActionPanelCreated = (panel): void => {
			if (panel?.params?.gridId === this.#gridId)
			{
				this.#setupActionPanel(panel);
			}
		};

		this.#handlePageHide = (): void => this.destroy();

		BX.addCustomEvent('Grid::thereSelectedRows', this.#handleSelectedRows);
		BX.addCustomEvent('Grid::allRowsSelected', this.#handleSelectedRows);
		BX.addCustomEvent('Grid::allRowsUnselected', this.#handleSelectedRows);
		BX.addCustomEvent('Grid::updated', this.#handleGridUpdated);
		BX.addCustomEvent('BX.UI.ActionPanel:created', this.#handleActionPanelCreated);
		Event.bind(window, 'pagehide', this.#handlePageHide, { once: true });
		this.#syncMigrationStateSubscriptions();

		const existingPanel = createdActionPanels.get(gridId);
		if (existingPanel)
		{
			this.#setupActionPanel(existingPanel);
		}
	}

	destroy(): void
	{
		MigrationProgressPanelLoader.destroyInstance(this.#gridId);
		this.#migrationStateSubscriptions.forEach(({ unsubscribe }) => unsubscribe());
		this.#migrationStateSubscriptions.clear();
		this.#panelObserver?.disconnect();
		this.#panelObserver = null;
		if (createdActionPanels.get(this.#gridId) === this.#actionPanel)
		{
			createdActionPanels.delete(this.#gridId);
		}
		this.#actionPanel = null;
		BX.removeCustomEvent('Grid::thereSelectedRows', this.#handleSelectedRows);
		BX.removeCustomEvent('Grid::allRowsSelected', this.#handleSelectedRows);
		BX.removeCustomEvent('Grid::allRowsUnselected', this.#handleSelectedRows);
		BX.removeCustomEvent('Grid::updated', this.#handleGridUpdated);
		BX.removeCustomEvent('BX.UI.ActionPanel:created', this.#handleActionPanelCreated);
		Event.unbind(window, 'pagehide', this.#handlePageHide);
		delete GridManager.instances[this.#gridId];
	}

	#syncMigrationStateSubscriptions(): void
	{
		const mailboxIds = new Set(
			(this.getGrid()?.getRows().getBodyChild() ?? [])
				.map((row) => Number(row.getId()))
				.filter((mailboxId) => Number.isInteger(mailboxId) && mailboxId > 0),
		);

		this.#migrationStateSubscriptions.forEach(({ unsubscribe }, mailboxId): void => {
			if (!mailboxIds.has(mailboxId))
			{
				unsubscribe();
				this.#migrationStateSubscriptions.delete(mailboxId);
			}
		});

		mailboxIds.forEach((mailboxId): void => {
			const subscription = this.#migrationStateSubscriptions.get(mailboxId);
			if (subscription)
			{
				if (subscription.state.isInitialized())
				{
					this.#applyMailboxMigrationState(
						mailboxId,
						subscription.state.isActive(),
						subscription.state.getStatus(),
					);
				}

				return;
			}

			const state = this.#migrationStateFactory(mailboxId);
			const unsubscribe = state.subscribe(({ active, status }): void => {
				if (this.#migrationStateSubscriptions.get(mailboxId)?.state === state)
				{
					this.#applyMailboxMigrationState(mailboxId, active, status);
				}
			});
			this.#migrationStateSubscriptions.set(mailboxId, { state, unsubscribe });
			void state.initialize().then((): void => {
				if (
					this.#migrationStateSubscriptions.get(mailboxId)?.state === state
					&& state.isInitialized()
				)
				{
					this.#applyMailboxMigrationState(mailboxId, state.isActive(), state.getStatus());
				}
			});
		});
	}

	#applyMailboxMigrationState(mailboxId: number, active: boolean, status: MigrationStatusDto): void
	{
		const rowNode = this.getGrid()?.getRows().getById(mailboxId)?.getNode?.();
		if (rowNode)
		{
			rowNode.dataset.mailboxMigrationActive = active ? 'Y' : 'N';
			const migrationStatus = rowNode.querySelector('[data-role="mailbox-grid-migration-status"]');
			const regularStatus = rowNode.querySelector('[data-role="mailbox-grid-regular-sync-status"]');
			if (migrationStatus && regularStatus)
			{
				const showMigration = this.#updateMigrationStatus(
					migrationStatus,
					mailboxId,
					active,
					status,
				);
				migrationStatus.hidden = !showMigration;
				regularStatus.hidden = showMigration;
			}
		}

		this.#syncMigrationRestrictions();
	}

	#updateMigrationStatus(
		migrationStatus: HTMLElement,
		mailboxId: number,
		active: boolean,
		status: MigrationStatusDto,
	): boolean
	{
		if (status.visibility === 'terminal')
		{
			migrationStatus.dataset.mailboxAdminProgress = 'N';
		}

		const hasAdminProgress = migrationStatus.dataset.mailboxAdminProgress === 'Y';
		const canOpenAdminProgress = migrationStatus.dataset.mailboxAdminProgressAllowed === 'Y';
		const canShowHiddenAdminProgress = migrationStatus.dataset.mailboxAdminProgressEarlyVisible === 'Y';
		const chip = migrationStatus.querySelector('.ui-chip');
		if (chip && active)
		{
			const messageKey = Object.hasOwn(migrationStatusMessages, status.status)
				? migrationStatusMessages[status.status]
				: 'MAIL_MIGRATION_STATUS';
			Chip.getByNode(chip)?.setText(Loc.getMessage(messageKey) ?? '');
			if (canOpenAdminProgress)
			{
				MigrationProgressPanelLoader.getInstance(this.#gridId).bindAnchor(chip, mailboxId);
			}
			else
			{
				MigrationProgressPanelLoader.getInstance(this.#gridId).unbindAnchor(chip);
			}
		}
		else if (chip && status.visibility === 'hidden')
		{
			if (hasAdminProgress && canShowHiddenAdminProgress && canOpenAdminProgress)
			{
				Chip.getByNode(chip)?.setText(migrationStatus.dataset.mailboxAdminProgressText ?? '');
				MigrationProgressPanelLoader.getInstance(this.#gridId).bindAnchor(chip, mailboxId);
			}
			else
			{
				migrationStatus.dataset.mailboxAdminProgress = 'N';
				MigrationProgressPanelLoader.getInstance(this.#gridId).unbindAnchor(chip);
			}
		}

		const hasOpenProgress = migrationStatus.querySelector('[aria-expanded="true"]') !== null;

		return active || (hasAdminProgress && canShowHiddenAdminProgress) || hasOpenProgress;
	}

	#setupActionPanel(panel: BX.UI.ActionPanel): void
	{
		if (this.#actionPanel === panel)
		{
			return;
		}

		this.#panelObserver?.disconnect();
		this.#actionPanel = panel;

		// On single-row selection ActionPanel rebuilds from that row's actions,
		// which are UPPERCASE (not understood by ActionPanel.Item) and carry no
		// mass actions; this grid must always show the group (mass) actions.
		panel.buildPanelByItem = () => panel.buildPanelByGroup();

		// A click outside the panel and grid must not reset the selection,
		// same as the message list panel.
		panel.handleOuterClick = () => {};

		const container = panel.getPanelContainer();
		container.dataset.testid = 'mail-mailbox-grid-bulk-panel';

		this.#panelObserver = new MutationObserver(() => {
			this.#applyPanelTestIds();
			this.#syncMigrationRestrictions();
		});
		this.#panelObserver.observe(container, { childList: true, subtree: true });

		this.#applyPanelTestIds();
		this.#syncMigrationRestrictions();
	}

	#syncMigrationRestrictions(): void
	{
		const item = this.#actionPanel?.getItemById?.('disconnectMailbox');
		if (!item)
		{
			return;
		}

		if (this.#hasSelectedActiveMigration())
		{
			if (!this.#migrationDisconnectState.has(item))
			{
				this.#migrationDisconnectState.set(item, {
					disabled: item.isDisabled(),
					title: item.layout?.container?.getAttribute('title') ?? null,
				});
			}
			item.disable();
			item.layout?.container?.setAttribute(
				'title',
				Loc.getMessage('MAIL_MIGRATION_ACTION_UNAVAILABLE') ?? '',
			);

			return;
		}

		const previousState = this.#migrationDisconnectState.get(item);
		if (previousState)
		{
			if (previousState.disabled)
			{
				item.disable();
			}
			else
			{
				item.enable();
			}
			this.#migrationDisconnectState.delete(item);
			if (previousState.title === null)
			{
				item.layout?.container?.removeAttribute('title');
			}
			else
			{
				item.layout?.container?.setAttribute('title', previousState.title);
			}
		}
	}

	#hasSelectedActiveMigration(): boolean
	{
		const grid = this.getGrid();
		const selectedIds = grid?.getRows().getSelectedIds() ?? [];

		return selectedIds.some((id) => this.#isMailboxMigrationActive(id));
	}

	#isMailboxMigrationActive(mailboxId: number | string): boolean
	{
		const row = this.getGrid()?.getRows().getById(mailboxId);

		return row?.getNode?.()?.dataset?.mailboxMigrationActive === 'Y';
	}

	#applyPanelTestIds(): void
	{
		if (!this.#actionPanel)
		{
			return;
		}

		const items = this.#actionPanel.getPanelContainer().querySelectorAll('[data-role="action-panel-item"]');
		items.forEach((item) => {
			if (item.id)
			{
				item.dataset.testid = `mail-mailbox-grid-bulk-action-${item.id}`;
			}
		});
	}

	static getInstance(gridId: string): GridManager
	{
		if (!this.instances[gridId])
		{
			this.instances[gridId] = new GridManager(gridId);
		}

		return this.instances[gridId];
	}

	static executePanelAction(params: panelActionParams): void
	{
		const { actionId, gridId } = params;
		const manager = GridManager.getInstance(gridId);
		const grid = manager.getGrid();
		if (!grid)
		{
			return;
		}

		const selectedIds = grid.getRows().getSelectedIds();
		if (!selectedIds || selectedIds.length === 0)
		{
			return;
		}

		const mailboxIds = selectedIds.map(Number);
		if (
			isMigrationRestrictedAction(actionId)
			&& mailboxIds.some((mailboxId) => manager.#isMailboxMigrationActive(mailboxId))
		)
		{
			return;
		}

		const action = ActionFactory.create(actionId, { grid });
		if (action)
		{
			action.setActionParams({ mailboxIds });
			action.execute();
		}
	}

	getGrid(): BX.Main.grid
	{
		return BX.Main.gridManager.getById(this.#gridId)?.instance;
	}

	runAction(config: runActionConfig): void
	{
		const actionId = config.actionId;
		if (
			actionId === 'syncAction'
			&& this.#isMailboxMigrationActive(config.params.mailboxId)
		)
		{
			return;
		}
		const options = config.options;
		options.grid = this.getGrid();

		const action = ActionFactory.create(actionId, options);
		if (action)
		{
			const params = config.params;
			action.setActionParams(params);
			action.execute();
		}
	}
}
