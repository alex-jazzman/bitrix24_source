import { Dom, Extension, Loc, Type } from 'main.core';
import { type BaseEvent, EventEmitter } from 'main.core.events';
import { LiveAnnouncer } from 'ui.a11y';

import { ActionFactory } from './action/action-factory';
import { ACTION_TYPE, FILTER_SEARCH_CONTAINER_ID_SUFFIX, TEMPLATE_SETUP_EVENT_NAME } from './constants';
import { TariffLimit } from './handler/error/tariff-limit';
import { TemplateSetupHandler } from './handler/template-setup-handler';
import { FilterHint } from './onboarding/filter-hint';
import type { ExtensionSettings, runActionConfig, SetFilterType, SetSortType } from './types';

const SCENARIO_CREATE_SOURCE = 'SCENARIO';
const GRID_UPDATED_EVENT = 'Grid::updated';
const FILTER_APPLY_TIMEOUT = 10000;

export class GridManager
{
	static instances: Array<GridManager> = [];
	#settings: ExtensionSettings | null = null;
	#grid: BX.Main.grid;
	#gridId: string;
	#isExistingRunsWarningSpent: boolean = false;
	#filterHint: FilterHint | null = null;

	constructor(gridId: string)
	{
		this.#gridId = gridId;
		this.#grid = BX.Main.gridManager.getById(gridId)?.instance;
		this.#settings = Extension.getSettings('bizproc.ai-agents.grid');

		this.#subscribeToEvents();
		this.retryFilterHintOnLoad();
	}

	static getInstance(gridId: string): GridManager
	{
		if (!this.instances[gridId])
		{
			this.instances[gridId] = new GridManager(gridId);
		}

		return this.instances[gridId];
	}

	static setSort(options: SetSortType): void
	{
		const grid = BX.Main.gridManager.getById(options.gridId)?.instance;

		if (Type.isObject(grid))
		{
			grid.tableFade();
			grid.getUserOptions().setSort(options.sortBy, options.order, () => {
				grid.reload();
			});
		}
	}

	static setFilter(options: SetFilterType): void
	{
		const grid = BX.Main.gridManager.getById(options.gridId)?.instance;
		const filter = BX.Main.filterManager.getById(options.gridId);

		if (Type.isObject(grid) && Type.isObject(filter))
		{
			filter.getApi().extendFilter(options.filter);
		}
	}

	getGrid(): BX.Main.grid
	{
		return this.#grid;
	}

	runAction(actionConfig: runActionConfig): void
	{
		if (
			!this.#isDeleteAction(actionConfig)
			&& !this.#isRestartOnScenarioWithBasicTariff(actionConfig)
			&& !this.validateAiAgentsAvailableByTariff()
		)
		{
			return;
		}

		const action = actionConfig.isGroupAction ?? false
			? ActionFactory.createGroupAction(actionConfig.actionId)
			: ActionFactory.create(actionConfig.actionId)
		;

		if (action)
		{
			action.setGrid(this.#grid);
			action.setActionParams(actionConfig.params);
			action.execute();
		}
	}

	#isDeleteAction(actionConfig: runActionConfig): boolean
	{
		return (
			actionConfig.actionId === ACTION_TYPE.DELETE
			|| actionConfig.actionId === ACTION_TYPE.GROUP_DELETE
		);
	}

	#isRestartOnScenarioWithBasicTariff(actionConfig: runActionConfig): boolean
	{
		return (
			actionConfig.actionId === ACTION_TYPE.RESTART
			&& actionConfig.params?.createSource === SCENARIO_CREATE_SOURCE
			&& this.#settings?.tariffInfo?.isBasicOrHigher === true
		);
	}

	reload()
	{
		this.#grid?.reload();
	}

	#subscribeToEvents()
	{
		EventEmitter.subscribe(
			TEMPLATE_SETUP_EVENT_NAME.SUCCESS,
			(event: BaseEvent) => new TemplateSetupHandler(this.#grid).handle(event),
		);
	}

	/**
	 * Whether the personal right to see the existing-runs warning is already spent. The flag comes
	 * from the page render and is only an optimization that saves the pre-flight request - the
	 * server stays the source of truth.
	 */
	isExistingRunsWarningSpent(): boolean
	{
		return this.#isExistingRunsWarningSpent;
	}

	markExistingRunsWarningSpent(): void
	{
		this.#isExistingRunsWarningSpent = true;
	}

	/**
	 * Schedules the one-off filter hint. Called from the confirmed "view launched" transition - the
	 * only condition that starts the onboarding (AC-023).
	 */
	requestFilterHint(): void
	{
		void this.#getFilterHint().request();
	}

	/**
	 * Finishes a hint that was scheduled on an earlier visit but never appeared. Nothing is loaded
	 * unless the state says the intent is still pending.
	 */
	retryFilterHintOnLoad(): void
	{
		void this.#getFilterHint().retryOnLoad();
	}

	#getFilterHint(): FilterHint
	{
		this.#filterHint ??= new FilterHint(this.#gridId, this.#settings?.filterHintState);

		return this.#filterHint;
	}

	/**
	 * Narrows the grid to the launched agents of one system template (AC-009) and resolves only
	 * once the rows have been re-requested.
	 *
	 * setFields() is used instead of extendFilter(): it deactivates every preset, so the default
	 * "Started by me" preset stops adding both the current user's filter and the unlaunched
	 * templates it keeps in the list. The promise returned by the filter itself cannot report
	 * success (Api.apply() drops it and it never rejects), so the confirmation is the grid's own
	 * Grid::updated event with a timeout fallback - an expired timeout means "not confirmed",
	 * while the filter stays applied.
	 *
	 * The narrowing also moves the focus and announces itself: the rows are replaced silently, and the
	 * row the transition started from is among the ones that leave.
	 */
	async applyLaunchedAgentsFilter(systemCode: string): Promise<boolean>
	{
		const filter = BX.Main.filterManager.getById(this.#gridId);

		if (!Type.isObject(filter))
		{
			return false;
		}

		const updated = this.#waitForGridUpdate();

		filter.getApi().setFields({
			// A multi-select value has to be an index-keyed map: main.ui.filter drops anything that
			// is not a plain object (prepareMultiSelectValue), so a plain array applies as empty.
			AGENT_TEMPLATE: { 0: systemCode },
			IS_ACTIVE: 'Y',
		});
		filter.getApi().apply();

		const isConfirmed = await updated;

		// Tied to the apply and not to its confirmation: an expired wait only means the grid did not
		// report back, while the filter stays applied and the initiator row leaves the list either way.
		// Only the onboarding hint keeps waiting for a confirmed apply.
		this.#focusFilterSearchContainer();
		LiveAnnouncer.announce(Loc.getMessage('BIZPROC_AI_AGENTS_GRID_LAUNCHED_AGENTS_FILTER_ANNOUNCEMENT'));

		return isConfirmed;
	}

	/**
	 * The dialog gives the focus back to the launch button, and the narrowing then drops that row from
	 * the grid, leaving the focus on the body. It is moved to the applied filter instead: that is both
	 * the reason the list changed and the control that widens it back, and it is the node the
	 * onboarding hint binds to - so the hint takes the focus from there and returns it on close.
	 *
	 * Resolved after the wait for the update settles and not before the apply: the filter repaints its
	 * search container while applying, and a node focused earlier would already be replaced.
	 */
	#focusFilterSearchContainer(): void
	{
		const container = document.getElementById(`${this.#gridId}${FILTER_SEARCH_CONTAINER_ID_SUFFIX}`);

		if (!container || !Dom.isShownRecursive(container))
		{
			return;
		}

		// Programmatically focusable only, so the Tab order of the toolbar stays as it was.
		Dom.attr(container, 'tabindex', '-1');
		container.focus();
	}

	#waitForGridUpdate(): Promise<boolean>
	{
		return new Promise((resolve) => {
			const finish = (isUpdated: boolean): void => {
				clearTimeout(timeoutId);
				EventEmitter.unsubscribe(GRID_UPDATED_EVENT, handler);
				resolve(isUpdated);
			};

			// Grid::updated is a global event: without the id check another grid on the page would
			// resolve this promise before our rows are reloaded. The grid fires it the legacy way,
			// but other modules re-emit it through EventEmitter, so both payload shapes are read.
			const handler = (event: BaseEvent): void => {
				const payload = event.getCompatData() ?? event.getData();
				const grid = Type.isArray(payload) ? payload[0] : payload;

				if (grid?.getId?.() === this.#gridId)
				{
					finish(true);
				}
			};

			const timeoutId = setTimeout(() => finish(false), FILTER_APPLY_TIMEOUT);

			EventEmitter.subscribe(GRID_UPDATED_EVENT, handler);
		});
	}

	validateAiAgentsAvailableByTariff(): boolean
	{
		const tariffInfo = this.#settings?.tariffInfo;
		if (!tariffInfo?.isAiAgentsAvailable)
		{
			TariffLimit.showFeatureSlider(tariffInfo?.aiAgentsTariffSliderCode);

			return false;
		}

		return true;
	}
}
