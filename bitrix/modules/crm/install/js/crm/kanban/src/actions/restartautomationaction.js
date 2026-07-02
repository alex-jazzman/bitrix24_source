import { BatchRestartAutomationManager, ProcessState, ProgressBarRepository } from 'crm.autorun';
import { Dom, Event, Reflection, Runtime, Tag, Type } from 'main.core';

const NAMESPACE = Reflection.namespace('BX.CRM.Kanban.Actions');

type Params = {
	ids: number[],
}

const CONTAINER_ID = 'crm-kanban-progress-bar-container';

export default class RestartAutomationAction
{
	#ids: number[];
	#grid: BX.CRM.Kanban.Grid;
	#progressBarContainer: ?HTMLElement;
	#clearLayoutHandler: Function;
	#resizeHandler: Function;
	#stateChangeHandler: Function;
	#processor: ?Object = null;

	constructor(grid: BX.CRM.Kanban.Grid, params: Params)
	{
		this.#grid = grid;
		this.#ids = params.ids;

		if (!Type.isArrayFilled(params.ids))
		{
			throw new Error('Param ids must be filled array');
		}

		this.#clearLayoutHandler = this.#onClearLayout.bind(this);
		this.#resizeHandler = this.#onResize.bind(this);
		this.#stateChangeHandler = this.#onProcessStateChange.bind(this);
	}

	execute(): void
	{
		this.#progressBarContainer = document.getElementById(CONTAINER_ID);
		const container = this.#grid.actionPanel.layout.container;

		if (this.#progressBarContainer === null)
		{
			this.#progressBarContainer = Tag.render`<div id="${CONTAINER_ID}"></div>`;
			Dom.insertAfter(this.#progressBarContainer, this.#grid.actionPanel.layout.container);

			Event.EventEmitter.subscribe(
				'BX.Crm.ProcessSummaryPanel:onClearLayout',
				this.#clearLayoutHandler,
				{ compatMode: true },
			);

			Event.bind(window, 'resize', this.#resizeHandler);
		}

		Dom.addClass(container, '--crm-kanban-with-stepper');
		Dom.addClass(this.#progressBarContainer, '--active');

		this.#adjustStepperContainer();

		Runtime.loadExtension('crm.entity-list.panel')
			.then(({ ExecuteRestartAutomation }) => {
				const progressBarRepo = new ProgressBarRepository(this.#progressBarContainer);
				const operation = new ExecuteRestartAutomation({ entityTypeId: this.#getEntityTypeId() });
				operation.injectDependencies(progressBarRepo);
				operation.executeForKanban(this.#grid, this.#ids);

				this.#subscribeToProcessStateChange();
			})
			.catch(() => {
				throw new Error('Cant load crm.entity-list.panel extension');
			})
		;
	}

	#subscribeToProcessStateChange(): void
	{
		const manager = BatchRestartAutomationManager.getItem(this.#grid.getData().gridId);
		const processor = manager?.getProgress();
		if (!processor || processor === this.#processor)
		{
			return;
		}

		this.#processor = processor;
		Event.EventEmitter.subscribe(
			processor,
			'ON_AUTORUN_PROCESS_STATE_CHANGE',
			this.#stateChangeHandler,
			{ compatMode: true },
		);
	}

	#onProcessStateChange(processor): void
	{
		if (!processor || processor.getState() !== ProcessState.stopped)
		{
			return;
		}

		this.#onClearLayout();
	}

	#getEntityTypeId(): number
	{
		const entityTypeId = this.#grid.data.entityTypeInt ?? 0;

		return BX.CrmEntityType.isDefined(entityTypeId) ? entityTypeId : 0;
	}

	#adjustStepperContainer(): void
	{
		const container = this.#grid.actionPanel.layout.container;

		const offsetTop = container.offsetTop + container.offsetHeight;
		Dom.style(this.#progressBarContainer, {
			top: `${offsetTop}px`,
			left: `${container.offsetLeft}px`,
			width: `${container.offsetWidth}px`,
		});
	}

	destroy(): void
	{
		Event.EventEmitter.unsubscribe('BX.Crm.ProcessSummaryPanel:onClearLayout', this.#clearLayoutHandler);

		if (this.#processor)
		{
			Event.EventEmitter.unsubscribe(this.#processor, 'ON_AUTORUN_PROCESS_STATE_CHANGE', this.#stateChangeHandler);
			this.#processor = null;
		}

		Event.unbind(window, 'resize', this.#resizeHandler);
	}

	#onClearLayout(): void
	{
		const container = this.#grid.actionPanel.layout.container;

		Dom.removeClass(container, '--crm-kanban-with-stepper');
		Dom.removeClass(this.#progressBarContainer, '--active');

		this.#grid.resetMultiSelectMode();
		this.#grid.actionPanel.hidePanel();
	}

	#onResize(): void
	{
		Runtime.throttle(
			this.#adjustStepperContainer.bind(this),
			20,
		);
	}
}

NAMESPACE.RestartAutomationAction = RestartAutomationAction;
