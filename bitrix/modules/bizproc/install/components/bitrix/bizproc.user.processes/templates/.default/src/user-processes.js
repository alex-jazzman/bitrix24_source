import { ajax, Type, Dom, Tag, Text, Loc, Event, Runtime, addCustomEvent, removeCustomEvent } from 'main.core';
import { Alert, AlertColor } from 'ui.alerts';
import { TagSelector } from 'ui.entity-selector';
import { Menu } from 'main.popup';
import { announce, enhanceGrid, subscribeGridUpdated } from 'bizproc.a11y';
import { Router } from 'bizproc.router';
import {
	type PerformerResult,
	type PerformerTask,
} from 'bizproc.task.performer';
import type { WorkflowData } from './workflow-loader';
import { WorkflowLoader, LoadWorkflowsResponseData } from './workflow-loader';
import { WorkflowRenderer } from './workflow-renderer';
import { CounterPanel } from './counter-panel.js';
import { DecisionControl, isSingleDecisionSelection } from './decision-control';
import { loadPerformer, TaskPassSession } from './task-pass-session';
import { notifyPass } from './notify-pass';
import { UI } from 'ui.notification';

import './style.css';

import 'ui.design-tokens';

type WorkflowId = string;
type TaskId = number;

/** The value of the panel item that starts a pass over the selected tasks. */
const ACTION_PERFORM_GROUP = 'perform_group';

/** The attribute a row of the grid carries the fields of its task nothing but a pass reads in. */
const ROW_TASK_ATTRIBUTE = 'data-bp-task';

/** The cells of the list the client draws itself (`$wrapJsRender` of the template). */
const RENDER_CELL_SELECTOR = '[data-role="bp-render-cell"]';

// Which rows are checked is not part of the value of the panel, so the offer of decisions follows the
// selection events of the grid.
const GRID_SELECTION_EVENTS = [
	'Grid::selectRow',
	'Grid::unselectRow',
	'Grid::selectRows',
	'Grid::unselectRows',
	'Grid::allRowsSelected',
	'Grid::allRowsUnselected',
];

/**
 * The grid a selection event is about. Every grid of the page shares these events and each of them
 * names its own grid last (`[row, this]`, `[rows, this]`, `[this]`); the confirmation of "select all"
 * names none at all, and an event naming no grid says nothing to sort it by.
 */
function readEventGrid(args: Array<mixed>): ?Object
{
	const grid = [...args].reverse().find((argument) => Type.isFunction(argument?.getRows));

	return Type.isNil(grid) ? null : grid;
}

/**
 * The fields of the task each drawn cell of the list gets, by the cell. The row carries one copy of
 * them for all its cells (`$rowTaskFields` of the template), so the attribute is read once per row and
 * not once per cell - five columns of the list go through this, and a page of a hundred rows would
 * otherwise read the same hundred attributes five times over.
 */
function readRowTaskFields(): Map<HTMLElement, Object>
{
	const fieldsByCell = new Map();

	document.querySelectorAll(`[${ROW_TASK_ATTRIBUTE}]`).forEach((rowNode) => {
		const fields = readTaskFields(rowNode);

		if (fields === null)
		{
			return;
		}

		rowNode.querySelectorAll(RENDER_CELL_SELECTOR).forEach((cell) => fieldsByCell.set(cell, fields));
	});

	return fieldsByCell;
}

/**
 * The fields of the task out of the attribute of the row. The server encodes the attribute once and
 * the browser gives its value back decoded, so the value is parsed as it stands: `Dom.attr` would
 * decode it a second time, and then a decision whose label carries an HTML entity as text (`&quot;`)
 * would stop parsing - the row would silently lose its hash, its activity and its decisions.
 */
function readTaskFields(rowNode: HTMLElement): ?Object
{
	try
	{
		const fields = JSON.parse(rowNode.getAttribute(ROW_TASK_ATTRIBUTE) ?? '');

		return Type.isPlainObject(fields) ? fields : null;
	}
	catch
	{
		return null;
	}
}

/**
 * Puts back the fields of the task the row carries once: the description of a cell comes without them.
 * A row drawn by the list itself - one added on a push - has the whole description of its task to
 * begin with and no attribute, and nothing is taken away from it here.
 */
function withRowTaskFields(workflow: ?Object, cell: HTMLElement, fieldsByCell: Map<HTMLElement, Object>): ?Object
{
	if (!Type.isPlainObject(workflow) || !Type.isPlainObject(workflow.task))
	{
		return workflow;
	}

	const fields = fieldsByCell.get(cell) ?? null;

	return Type.isPlainObject(fields)
		? { ...workflow, task: { ...workflow.task, ...fields } }
		: workflow
	;
}

export class UserProcesses
{
	gridId: string;
	delegateToSelector: TagSelector;
	delegateToUserId: number = 0;
	actionPanel: {
		wrapperElementId: string,
		decisionWrapperElementId: string,
		actionButtonName: string,
		userWrapperElement: ?HTMLElement,
	};

	// A row of the list is a process, and the task of the row is what a group action is done to, so
	// the row keeps the whole description of its task (DTO-02) and not just its identifier.
	#workflowTasks: Map<WorkflowId, PerformerTask> = new Map();
	#decisionControl: ?DecisionControl = null;
	#passSession: ?TaskPassSession = null;

	// A pass asked for, while the mechanics of it are on their way: there is no session to look at yet.
	#isPassStarting: boolean = false;

	// How long a step of a pass waits for the form of its task. How long an honest open of it takes is
	// a property of the portal and not of this code, so the list is told (`TASK_FORM_OPEN_TIMEOUT` of
	// the component); nothing named leaves the pass with a default of its own.
	#taskFormOpenTimeout: number = 0;
	#workflowRenderer: Object<WorkflowId, WorkflowRenderer> = {};
	currentUserId: number;
	#targetUserId: number;
	#shownMobilePopup: boolean;
	#appLink: string;

	loader: WorkflowLoader;

	#gridSubscription = null;

	constructor(options: {
		gridId: string,
		actionPanelUserWrapperId: string,
		actionPanelDecisionWrapperId: string,
		errors: Array<{ message: string }>,
		currentUserId: number,
		targetUserId: number;
		mustSubscribeToPushes: boolean,
		shownMobilePopup: boolean,
		appLink: string,
		taskFormOpenTimeout: number,
	})
	{
		let mustSubscribeToPushes = false;

		if (Type.isPlainObject(options))
		{
			this.gridId = options.gridId;

			if (Type.isArray(options.errors))
			{
				this.showErrors(options.errors);
			}
			this.actionPanel = {
				wrapperElementId: options.actionPanelUserWrapperId,
				decisionWrapperElementId: options.actionPanelDecisionWrapperId,
				actionButtonName: `${this.gridId}_action_button`,
			};

			this.currentUserId = options.currentUserId;
			this.#targetUserId = options.targetUserId;
			this.#shownMobilePopup = options.shownMobilePopup;
			this.#appLink = options.appLink;
			this.#taskFormOpenTimeout = Text.toInteger(options.taskFormOpenTimeout);

			mustSubscribeToPushes = options.mustSubscribeToPushes === true;
		}

		this.loader = new WorkflowLoader();

		if (mustSubscribeToPushes)
		{
			this.#subscribeToPushes();
		}
		this.#subscribeToTaskDo();
		this.#subscribeToSelectionChanged();
		this.subscribeGridEvents();

		this.init();
		this.initCounterPanel(options.counters, options.filterId);
	}

	#subscribeToPushes()
	{
		BX.PULL.subscribe({
			moduleId: 'bizproc',
			command: 'workflow',
			callback: (params) => {
				if (params.eventName === 'DELETED' || params.eventName === 'UPDATED')
				{
					params.items.forEach((workflow) => this.removeWorkflow(workflow.id));
				}

				if (params.eventName === 'ADDED' || params.eventName === 'UPDATED')
				{
					const rowsCollectionWrapper: BX.Grid.Rows = this.getGrid().getRows();
					let ids = params.items.map((workflow) => workflow.id);
					if (params.eventName === 'ADDED')
					{
						ids = ids.filter((id) => !rowsCollectionWrapper.getById(id));
					}

					if (ids.length > 0)
					{
						this.loader
							.loadWorkflows(ids)
							.then(this.#updateWorkflows.bind(this))
							.catch((response) => this.showErrors(response))
						;
					}
				}
			},
		});
	}

	#subscribeToTaskDo()
	{
		BX.addCustomEvent(
			'SidePanel.Slider:onMessage',
			(event) => {
				if (event.getEventId() === 'try-do-bp-task-event')
				{
					this.#hideRow(event.data.workflowId);
				}
				else if (event.getEventId() === 'error-do-bp-task-event')
				{
					this.#showRow(event.data.workflowId);
				}
				else if (event.getEventId() === 'success-do-bp-task-event')
				{
					UI.Notification.Center.notify({
						content: Loc.getMessage(
							'BIZPROC_USER_PROCESSES_TEMPLATE_TASK_TOUCHED',
							{ '#TASK_NAME#': Text.encode(event.data.taskName) },
						),
					});
				}
			},
		);
	}

	/**
	 * The panel reports its own value only, and which decisions it offers follows the checked rows -
	 * so the offer is rebuilt whenever the selection of the grid changes.
	 */
	#subscribeToSelectionChanged()
	{
		GRID_SELECTION_EVENTS.forEach(
			(eventName) => addCustomEvent(eventName, this.#handleSelectionChanged),
		);
	}

	#unsubscribeFromSelectionChanged()
	{
		GRID_SELECTION_EVENTS.forEach(
			(eventName) => removeCustomEvent(eventName, this.#handleSelectionChanged),
		);
	}

	/**
	 * The selection of another grid of the page says nothing about the rows this list offers. An event
	 * that named no grid is still answered: the offer of decisions must not stop following the checked
	 * rows just because a payload came empty.
	 */
	#handleSelectionChanged = (...args): void => {
		const grid = readEventGrid(args);
		if (grid !== null && grid !== this.getGrid())
		{
			return;
		}

		this.onActionPanelChanged();
	};

	subscribeGridEvents()
	{
		this.unsubscribeGridEvents();
		this.#gridSubscription = subscribeGridUpdated(
			this.gridId,
			() => announce(Loc.getMessage('BIZPROC_USER_PROCESSES_TEMPLATE_GRID_UPDATED')),
		);
	}

	unsubscribeGridEvents()
	{
		this.#gridSubscription?.destroy();
		this.#gridSubscription = null;
	}

	destroy()
	{
		this.unsubscribeGridEvents();
		this.#unsubscribeFromSelectionChanged();
	}

	#updateWorkflows(response: LoadWorkflowsResponseData): void
	{
		const { workflows } = response.data;
		if (!Type.isArray(workflows))
		{
			// eslint-disable-next-line no-console
			console.warn('Unexpected response from server. Expected workflow.data to be an array');

			return;
		}

		const gridRealtime = this.getGrid()?.getRealtime();

		if (gridRealtime)
		{
			let lastWorkflowId = null;
			workflows.forEach((workflow) => {
				const isActual = Boolean(
					workflow.taskCnt > 0
					|| workflow.commentCnt > 0
					|| (
						workflow.startedById === this.currentUserId
						&& workflow.isCompleted === false
					),
				);

				if (isActual)
				{
					this.#appendWorkflow({
						workflow,
						renderer: this.#createWorkflowRenderer(workflow.workflowId, workflow),
						insertAfter: lastWorkflowId,
					});
					lastWorkflowId = workflow.workflowId;
				}
			});
		}
	}

	#appendWorkflow({ workflow, renderer, insertAfter }): void
	{
		this.#rememberWorkflowTask(workflow);

		const gridRealtime = this.getGrid()?.getRealtime();
		if (!gridRealtime)
		{
			return;
		}

		const addRowOptions = this.getDefaultAddRowOptions(workflow, renderer);

		if (Type.isStringFilled(insertAfter))
		{
			addRowOptions.insertAfter = insertAfter;
		}
		else
		{
			addRowOptions.prepend = true;
		}

		gridRealtime.addRow(addRowOptions);

		// temporary crutches for the GRID :-)
		const row: BX.Grid.Row = this.getGrid()?.getRows().getById(workflow.workflowId);
		if (row)
		{
			if (addRowOptions.columnClasses)
			{
				for (const [columnId, columnClass] of Object.entries(addRowOptions.columnClasses))
				{
					if (columnClass)
					{
						Dom.addClass(row.getCellById(columnId), columnClass);
					}
				}
			}
			Dom.addClass(row.getNode(), 'main-ui-grid-show-new-row');
			Event.bind(row.getNode(), 'animationend', (event: AnimationEvent) => {
				if (event.animationName === 'showNewRow')
				{
					Dom.removeClass(row.getNode(), 'main-ui-grid-show-new-row');
				}
			});
		}
	}

	getDefaultAddRowOptions(workflow: WorkflowData, renderer: WorkflowRenderer): Object
	{
		const actions = [
			{
				text: Loc.getMessage('BIZPROC_USER_PROCESSES_TEMPLATE_ROW_ACTION_DOCUMENT'),
				href: workflow.document.url || '#',
			},
		];

		if (workflow.task)
		{
			actions.push({
				text: Loc.getMessage('BIZPROC_USER_PROCESSES_TEMPLATE_ROW_ACTION_TASK'),
				href: workflow.task.url,
			});
		}

		return {
			id: workflow.workflowId,
			animation: false,
			columns: {
				ID: workflow.workflowId,
				PROCESS: renderer.renderProcess(),
				TASK_PROGRESS: renderer.renderWorkflowFaces(),
				TASK: renderer.renderTask(),
				WORKFLOW_STATE: Text.encode(workflow.statusText),
				DOCUMENT_NAME: renderer.renderDocumentName(),
				WORKFLOW_TEMPLATE_NAME: Text.encode(workflow.templateName),
				TASK_DESCRIPTION: Dom.create('span', { html: workflow.description || '' }),
				MODIFIED: Text.encode(workflow.modified),
				WORKFLOW_STARTED: Text.encode(workflow.workflowStarted),
				WORKFLOW_STARTED_BY: Text.encode(workflow.startedBy),
				OVERDUE_DATE: Text.encode(workflow.overdueDate),
				SUMMARY: renderer.renderSummary(),
			},
			actions,
			columnClasses: {
				TASK_PROGRESS: 'bp-task-progress-cell',
				SUMMARY: 'bp-summary-cell',
				TASK: workflow.isCompleted ? 'bp-status-completed-cell' : '',
				TASK_DESCRIPTION: 'bp-description-cell',
			},
			counters: this.#getCountersOption(workflow),
			editable: Boolean(workflow.task),
		};
	}

	#getCountersOption(workflow: WorkflowData): Object
	{
		const counters = {};
		if (this.#targetUserId === this.currentUserId && (workflow.taskCnt > 0 || workflow.commentCnt > 0))
		{
			const primaryColor = workflow.taskCnt === 0 && workflow.commentCnt > 0
				? BX.Grid.Counters.Color.SUCCESS
				: BX.Grid.Counters.Color.DANGER
			;

			counters.MODIFIED = {
				type: BX.Grid.Counters.Type.LEFT,
				color: primaryColor,
				secondaryColor: BX.Grid.Counters.Color.SUCCESS,
				value: (workflow.taskCnt || 0) + (workflow.commentCnt || 0),
				isDouble: workflow.taskCnt > 0 && workflow.commentCnt > 0,
			};
		}

		return counters;
	}

	init(): void
	{
		this.actionPanel.userWrapperElement = document.getElementById(this.actionPanel.wrapperElementId);
		this.initUserSelector();
		this.initDecisionControl();
		this.renderCells();
		this.#applyGridA11y();

		this.onActionPanelChanged();
	}

	#applyGridA11y(): void
	{
		const container = this.getGrid()?.getContainer();
		if (!Type.isDomNode(container))
		{
			return;
		}

		enhanceGrid(container, {
			gridId: this.gridId,
			rowActionsLabel: Loc.getMessage('BIZPROC_USER_PROCESSES_TEMPLATE_ROW_ACTIONS_LABEL'),
			checkboxesFromTitle: true,
		});
	}

	initCounterPanel(counters, filterId): void
	{
		const panelWrapperNode = document.querySelector('[data-role="bizproc-counterpanel"]');
		if (!panelWrapperNode)
		{
			return;
		}

		(new CounterPanel({ counters, filterId })).renderTo(panelWrapperNode);
	}

	renderCells()
	{
		const updated = new Map();
		const fieldsByCell = readRowTaskFields();

		document.querySelectorAll(RENDER_CELL_SELECTOR).forEach(
			(target) => {
				const workflow = withRowTaskFields(Dom.attr(target, 'data-workflow'), target, fieldsByCell);
				const columnId = Dom.attr(target, 'data-column');

				if (workflow)
				{
					if (!updated.has(workflow.workflowId))
					{
						this.#deleteWorkflowRendererById(workflow.workflowId);
						updated.set(workflow.workflowId);
					}

					// set workflow task map
					this.#rememberWorkflowTask(workflow);

					this.renderColumnCell(target, columnId, workflow);
				}
			},
		);
	}

	renderColumnCell(target, columnId, workflow)
	{
		const renderer = (
			this.#getWorkflowRendererById(String(workflow.workflowId))
			?? this.#createWorkflowRenderer(String(workflow.workflowId), workflow)
		);

		let childNode = null;
		switch (columnId)
		{
			case 'DOCUMENT_NAME':
				childNode = renderer.renderDocumentName();
				break;

			case 'PROCESS':
				childNode = renderer.renderProcess();
				break;

			case 'TASK_PROGRESS':
				childNode = renderer.renderWorkflowFaces();
				break;

			case 'TASK':
				childNode = renderer.renderTask();
				break;

			case 'SUMMARY':
				childNode = renderer.renderSummary();
				break;

			case 'MODIFIED':
				childNode = renderer.renderModified();
				break;

			default:
				// do nothing
		}

		if (childNode)
		{
			Dom.replace(
				target,
				childNode,
			);
		}
	}

	clickStartWorkflowButton(): void
	{
		Router.openUserProcessesStart();

		Runtime
			.loadExtension('ui.analytics')
			.then(({ sendData }) => {
				sendData({
					tool: 'automation',
					category: 'bizproc_operations',
					event: 'drawer_open',
					c_section: 'bizproc',
					c_element: 'button',
				});
			})
			.catch(() => {})
		;
	}

	creationGuideOpen(params: Object): void
	{
		Runtime.loadExtension('lists.element.creation-guide')
			.then(({ CreationGuide }) => {
				CreationGuide?.open(params);
			})
			.catch(() => {})
		;
	}

	initUserSelector(): void
	{
		if (!this.delegateToSelector)
		{
			this.delegateToSelector = new TagSelector({
				multiple: false,
				tagMaxWidth: 180,
				events: {
					onTagAdd: (event) => {
						this.delegateToUserId = parseInt(event.getData().tag.getId(), 10);

						if (!Type.isInteger(this.delegateToUserId))
						{
							this.delegateToUserId = 0;
						}
					},
					onTagRemove: () => {
						this.delegateToUserId = 0;
					},
				},
				dialogOptions: {
					entities: [
						{
							id: 'user',
							options: {
								intranetUsersOnly: true,
								inviteEmployeeLink: false,
							},
						},
					],
				},
			});
		}

		if (Type.isDomNode(this.actionPanel.userWrapperElement))
		{
			Dom.clean(this.actionPanel.userWrapperElement);
			this.delegateToSelector.renderTo(this.actionPanel.userWrapperElement);
			Dom.attr(this.actionPanel.userWrapperElement, {
				role: 'group',
				'aria-label': Loc.getMessage('BIZPROC_USER_PROCESSES_TEMPLATE_DELEGATE_TO_LABEL'),
			});
		}
	}

	/**
	 * The panel item of a group pass comes with an empty container: which decisions the checked rows
	 * offer is known in the browser only. No container means the pass is not offered here at all - the
	 * list shows the tasks of another person.
	 */
	initDecisionControl(): void
	{
		if (!Type.isStringFilled(this.actionPanel.decisionWrapperElementId))
		{
			return;
		}

		this.#decisionControl ??= new DecisionControl();
		this.#decisionControl.renderTo(document.getElementById(this.actionPanel.decisionWrapperElementId));
	}

	showErrors(errors: Array<{ message: string }>): void
	{
		if (!Type.isArrayFilled(errors))
		{
			if (!Type.isArray(errors))
			{
				console.error(errors);
			}

			return;
		}

		const errorsContainer = document.getElementById('bp-user-processes-errors-container');

		if (errorsContainer)
		{
			let errorCounter = 0;
			const fixStyles = () => {
				if (errorCounter > 0)
				{
					Dom.style(errorsContainer, { margin: '10px' });
				}
				else
				{
					Dom.style(errorsContainer, { margin: '0px' });
				}
			};

			for (const error of errors)
			{
				errorCounter += 1;

				const alert = new Alert({
					text: Text.encode(error.message),
					color: AlertColor.DANGER,
					closeBtn: true,
					animated: true,
				});

				alert.renderTo(errorsContainer);

				if (alert.getCloseBtn())
				{
					// eslint-disable-next-line no-loop-func
					alert.getCloseBtn().onclick = () => {
						errorCounter -= 1;
						fixStyles();
					};
				}
			}

			fixStyles();
		}
	}

	/**
	 * Each action of the panel asks for its own thing: setting a status asks for nothing, delegating
	 * asks for a person, a group pass asks for a decision. Only one container is shown at a time - two
	 * of them at once would ask for something the chosen action never sends.
	 */
	onActionPanelChanged(): void
	{
		const grid = this.getGrid();
		const actionPanel = grid?.getActionsPanel();

		if (actionPanel)
		{
			const action = actionPanel.getValues()[this.actionPanel.actionButtonName];
			if (Type.isString(action) && action.startsWith('delegate_to'))
			{
				Dom.show(this.actionPanel.userWrapperElement);
			}
			else
			{
				Dom.hide(this.actionPanel.userWrapperElement);
			}

			this.#decisionControl?.update(
				action === ACTION_PERFORM_GROUP ? this.#getSelectedPassTasks() : [],
			);
		}
	}

	applyActionPanelValues(): void
	{
		const grid = this.getGrid();
		const actionsPanel = grid?.getActionsPanel();

		if (grid && actionsPanel)
		{
			const isApplyingForAll = actionsPanel.getForAllCheckbox()?.checked === true;
			// TODO - implement doing all tasks
			if (isApplyingForAll)
			{
				// the stub answers for the whole panel: an action asked about every task of the filter must
				// not quietly happen for the marked rows instead
				this.showErrors([{ message: 'Not implemented currently' }]);

				return;
			}

			const action: string = actionsPanel.getValues()[this.actionPanel.actionButtonName];

			if (Type.isString(action))
			{
				if (action === ACTION_PERFORM_GROUP)
				{
					this.#performSelectedTasks();

					return;
				}

				const selectedTasks = this.getSelectedTaskIds(grid.getRows().getSelectedIds());

				if (selectedTasks.length === 0)
				{
					// todo: show error?

					return;
				}

				if (action.includes('set_status_'))
				{
					const status = parseInt(action.split('_').pop(), 10);

					if (Type.isNumber(status))
					{
						this.setTasksStatuses(selectedTasks, status);
					}
				}
				else if (action.startsWith('delegate_to'))
				{
					this.delegateTasks(selectedTasks, this.delegateToUserId);
				}
			}
		}
	}

	/**
	 * The task of the row as a group action reads it (DTO-02). The process is not part of the server
	 * description of a task - a row of the list is a process - so the row puts its own in.
	 */
	#rememberWorkflowTask(workflow: WorkflowData): void
	{
		if (!workflow.task)
		{
			return;
		}

		this.#workflowTasks.set(workflow.workflowId, {
			...workflow.task,
			workflowId: workflow.workflowId,
		});
	}

	getSelectedTaskIds(selectedWorkflowIds: Array<WorkflowId>): Array<TaskId>
	{
		return (
			selectedWorkflowIds
				.map((workflowId) => this.#workflowTasks.get(workflowId)?.id)
				.filter((taskId) => Type.isNumber(taskId))
		);
	}

	/**
	 * The tasks of the checked rows a pass can be walked by. A row whose task is not awaiting a
	 * decision of this person carries nothing to perform and stays out of the queue; the order of the
	 * rest repeats the order of the rows.
	 */
	#getSelectedPassTasks(): Array<PerformerTask>
	{
		const selectedWorkflowIds = this.getGrid()?.getRows().getSelectedIds() ?? [];

		return (
			selectedWorkflowIds
				.map((workflowId) => this.#workflowTasks.get(workflowId))
				.filter((task) => Type.isPlainObject(task) && task.isRunning === true)
		);
	}

	/**
	 * Starts a pass over the checked rows. A selection one decision is enough for is performed by the
	 * decision chosen in the panel, and a mixed one leaves the decision to the pass itself, task by
	 * task. The list neither walks the queue nor reports how the operation ended - that is the pass.
	 */
	#performSelectedTasks(): void
	{
		// a pass keeps the form of a task on the screen, so the person already sees the one that goes on;
		// while the mechanics are still being loaded there is nothing on the screen yet, hence the flag
		if (this.#passSession !== null || this.#isPassStarting)
		{
			return;
		}

		const tasks = this.#getSelectedPassTasks();
		if (tasks.length === 0)
		{
			notifyPass('BIZPROC_USER_PROCESSES_TEMPLATE_PERFORM_GROUP_NO_TASKS');

			return;
		}

		if (!isSingleDecisionSelection(tasks))
		{
			this.#startPass(tasks, null);

			return;
		}

		const decision = this.#decisionControl?.decision ?? null;
		if (decision === null)
		{
			notifyPass('BIZPROC_USER_PROCESSES_TEMPLATE_DECISION_REQUIRED');

			return;
		}

		this.#startPass(tasks, decision);
	}

	/**
	 * Brings in the mechanics of a pass and starts one. The extension is not part of the page, so the
	 * first group action of the person waits for it; a load that failed is said out loud - a group
	 * action must never answer with silence.
	 */
	#startPass(tasks: Array<PerformerTask>, decision: ?Object): void
	{
		this.#isPassStarting = true;

		loadPerformer()
			.then((mechanics: Object) => this.#runPass(tasks, decision, mechanics))
			.catch((error) => {
				console.error(error);
				notifyPass('BIZPROC_USER_PROCESSES_TEMPLATE_PERFORM_GROUP_LOAD_FAILED');
			})
			.finally(() => {
				this.#isPassStarting = false;
			})
		;
	}

	#runPass(tasks: Array<PerformerTask>, decision: ?Object, mechanics: Object): void
	{
		this.#passSession = new TaskPassSession(tasks, { formOpenTimeout: this.#taskFormOpenTimeout });

		this.#passSession
			.run(decision)
			.then((result: PerformerResult) => this.#finishPass(tasks, result, mechanics))
			.catch((response) => {
				this.#reportPassFailure(response);
				this.reloadGrid();
			})
			.finally(() => {
				this.#passSession = null;
			})
		;
	}

	/**
	 * The pass reports its own result, so the list only brings the rows in line with it: the rows of
	 * the performed tasks leave at once and the grid is read anew - a task performed in the pass moves
	 * its process on, and the row has to be read again to show where it stands.
	 *
	 * A pass that performed nothing - left on the first task, or every task of it skipped - changed
	 * nothing to read: the list stays as it is.
	 *
	 * @param mechanics The exports of `bizproc.task.performer` the pass was run with - the outcome of a
	 *   task is named by them, and they are only ever on the page once a pass has asked for them.
	 */
	#finishPass(tasks: Array<PerformerTask>, result: PerformerResult, mechanics: Object): void
	{
		const performedTaskIds = new Set(
			result.results
				.filter((record) => record.status === mechanics.TaskOutcomeStatus.Done)
				.map((record) => record.taskId),
		);

		if (performedTaskIds.size === 0)
		{
			return;
		}

		this.#hideRows(
			tasks
				.filter((task) => performedTaskIds.has(task.id))
				.map((task) => task.workflowId),
		);

		this.reloadGrid();
	}

	/**
	 * A pass that broke off says why. A refusal of the server for a task is answered by the pass itself
	 * with an outcome record, so what reaches here is the pass breaking down: an answer of the client
	 * layer brings the messages of the server, and anything else is a failure only the console can name
	 * - the person still has to be told that the operation ended and nothing is going on any more.
	 */
	#reportPassFailure(response: mixed): void
	{
		if (Type.isArrayFilled(response?.errors))
		{
			this.showErrors(response.errors);

			return;
		}

		console.error(response);
		notifyPass('BIZPROC_USER_PROCESSES_TEMPLATE_PERFORM_GROUP_FAILED');
	}

	setTasksStatuses(taskIds: Array<TaskId>, newStatus: number): void
	{
		// eslint-disable-next-line promise/catch-or-return
		ajax
			.runAction('bizproc.task.doInlineTasks', {
				data: {
					taskIds,
					newStatus,
				},
			})
			.catch((response) => {
				this.showErrors(response.errors);
				this.reloadGrid();
			})
			// .then(() => this.reloadGrid())
		;
	}

	delegateTasks(taskIds: Array<TaskId>, toUserId: number): void
	{
		// eslint-disable-next-line promise/catch-or-return
		ajax
			.runComponentAction('bitrix:bizproc.user.processes', 'delegateTasks', {
				mode: 'class',
				data: {
					taskIds,
					toUserId,
				},
			})
			.then(() => announce(Loc.getMessage('BIZPROC_USER_PROCESSES_TEMPLATE_TASKS_DELEGATED')))
			.catch((response) => {
				this.showErrors(response.errors);
				this.reloadGrid();
			})
			// .then(() => this.reloadGrid())
		;
	}

	reloadGrid(): void
	{
		this.getGrid()?.reload();
	}

	doTask(props: {
		taskId: TaskId,
		workflowId: WorkflowId,
		taskName: string,
		taskRequest: Object,
	}): void
	{
		this.#hideRow(props.workflowId);

		ajax.runAction('bizproc.task.do', {
			data: props,
		}).then(() => {
			if (props.taskName)
			{
				UI.Notification.Center.notify({
					content: Loc.getMessage(
						'BIZPROC_USER_PROCESSES_TEMPLATE_TASK_TOUCHED',
						{ '#TASK_NAME#': Text.encode(props.taskName) },
					),
				});
			}
		}).catch((response) => {
			this.showErrors(response.errors);
			this.#showRow(props.workflowId);
		});
	}

	removeWorkflow(workflowId: string): void
	{
		if (!this.#shownMobilePopup && this.#workflowTasks.has(workflowId))
		{
			const mobile = new BX.UI.MobilePromoter({
				title: Loc.getMessage('BIZPROC_USER_PROCESSES_POPUP_PUSH_TITLE'),
				content: this.getPopupContent(),
				position: {
					right: 30,
					bottom: 30,
				},
				qrContent: this.#appLink,
				analytics: { c_section: 'bizproc' },
			});
			mobile.show();
			BX.userOptions.save('bizproc.user.processes', 'mobile_promotion_popup', 'shown_popup', 'Y', false);
			this.#shownMobilePopup = true;
		}

		this.#hideRow(workflowId, true);
		this.#deleteWorkflowRendererById(workflowId);
		this.#workflowTasks.delete(workflowId);
	}

	getPopupContent(): HTMLElement
	{
		return Tag.render`
			<div class="ui-mobile-promoter__content-wrapper">
				<ul class="ui-mobile-promoter__popup-list">
					<li class="ui-mobile-promoter__popup-list-item">
						${Loc.getMessage('BIZPROC_USER_PROCESSES_POPUP_PUSH_DO_PROCESS')}
					</li>
					<li class="ui-mobile-promoter__popup-list-item">
						${Loc.getMessage('BIZPROC_USER_PROCESSES_POPUP_PUSH_REACT')}
					</li>
					<li class="ui-mobile-promoter__popup-list-item">
						${Loc.getMessage('BIZPROC_USER_PROCESSES_POPUP_PUSH_CONTROL')}
					</li>
				</ul>
				<div class="ui-mobile-promoter__popup-desc">${Loc.getMessage('UI_MOBILE_PROMOTER_DESC')}</div>
				<div class="ui-mobile-promoter__popup-info">${Loc.getMessage('UI_MOBILE_PROMOTER_INFO')}</div>
			</div>
		`;
	}

	getGrid(): ?BX.Main.grid
	{
		if (this.gridId)
		{
			return BX.Main.gridManager?.getInstanceById(this.gridId);
		}

		// eslint-disable-next-line no-console
		console.warn('Grid not found');

		return null;
	}

	#createWorkflowRenderer(workflowId: WorkflowId, workflow): WorkflowRenderer
	{
		this.#workflowRenderer[workflowId] = new WorkflowRenderer({
			userProcesses: this,
			currentUserId: this.currentUserId,
			workflow,
		});

		return this.#workflowRenderer[workflowId];
	}

	#getWorkflowRendererById(workflowId: WorkflowId): ?WorkflowRenderer
	{
		return Type.isNil(this.#workflowRenderer[workflowId]) ? null : this.#workflowRenderer[workflowId];
	}

	#deleteWorkflowRendererById(workflowId: WorkflowId)
	{
		const renderer = this.#getWorkflowRendererById(workflowId);
		if (renderer)
		{
			renderer.destroy();
			delete this.#workflowRenderer[workflowId];
		}
	}

	#hideRow(id: string, remove: boolean = false): void
	{
		const grid = this.getGrid();
		const row = grid?.getRows().getById(id);

		if (row)
		{
			row.hide();
			if (remove)
			{
				Dom.remove(row.getNode());
			}

			this.#showStubOnEmptyGrid(grid);
		}
	}

	/**
	 * Hides several rows at once. Whether anything is left on the screen is a question about the grid
	 * and not about a row, so it is asked once after the last row and not on every one of them: the
	 * count of shown rows walks all the rows of the grid.
	 */
	#hideRows(ids: Array<WorkflowId>): void
	{
		const grid = this.getGrid();
		if (!grid)
		{
			return;
		}

		ids.forEach((id) => grid.getRows().getById(id)?.hide());

		this.#showStubOnEmptyGrid(grid);
	}

	#showStubOnEmptyGrid(grid: BX.Main.grid): void
	{
		if (grid.getRows().getCountDisplayed() === 0)
		{
			grid.getRealtime().showStub();
		}
	}

	#showRow(id: string): void
	{
		const row = this.getGrid()?.getRows().getById(id);
		if (row)
		{
			row.show();
			Dom.addClass(row.getNode(), 'main-ui-grid-show-new-row');

			Event.bind(row.getNode(), 'animationend', (event: AnimationEvent) => {
				if (event.animationName === 'showNewRow')
				{
					Dom.removeClass(row.getNode(), 'main-ui-grid-show-new-row');
				}
			});
		}
	}
}
