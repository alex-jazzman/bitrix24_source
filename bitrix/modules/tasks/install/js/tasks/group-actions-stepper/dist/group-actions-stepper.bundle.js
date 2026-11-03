/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_core_events, ui_stepprocessing) {
	'use strict';

	class GroupActionsStepper extends main_core_events.EventEmitter {
		static ACTION_CONTROLLER = 'tasks.task.action.group';
		static ACTION_CONTROLLER_COUNT_TASKS = 'getTotalCountTasks';

		// eslint-disable-next-line no-unused-private-class-members
		#params;
		#action;
		#data;
		#title = null;
		#forAll = false;
		#step;
		#requestStopFunction;
		#process = null;
		constructor(params) {
			super();
			this.setEventNamespace('BX.Tasks.GroupActionsStepper');
			this.#params = params;
			this.#action = params.action;
			this.#data = params.data;
			this.#step = params.step ?? 20;
			this.#requestStopFunction = params.requestStopFunction;
			this.#forAll = this.#data.forAll === 'Y';
			this.#title = this.#getTitle(this.#action);
			this.#process = this.#getProcess();
		}
		showDialog() {
			this.#process.showDialog();
			return this.#process;
		}
		closeDialog() {
			this.#process.closeDialog();
			return this;
		}
		#getProcess() {
			if (!this.#process) {
				this.#process = new ui_stepprocessing.Process({
					id: 'TaskListGroupActionsStepper',
					controller: GroupActionsStepper.ACTION_CONTROLLER,
					messages: {
						DialogTitle: main_core.Loc.getMessage('TASKS_GRID_GROUP_ACTION_NAME'),
						DialogSummary: main_core.Loc.getMessage('TASKS_GRID_GROUP_ACTION_DESCRIPTION'),
						RequestCanceling: main_core.Loc.getMessage('TASKS_GRID_GROUP_ACTION_CANCELING')
					},
					showButtons: {
						start: true,
						stop: true,
						close: true
					},
					dialogMaxWidth: 600,
					popupOptions: {
						resizable: false,
						draggable: false,
						disableScroll: true
					}
				});
				if (this.#forAll) {
					this.#getTotalElements();
				}
				this.#allSteps();
			}
			return this.#process;
		}
		#getTotalElements() {
			this.#data.nPageSize = this.#step;
			delete this.#data.selectedIds;
			delete this.#data.forAll;

			// add spetial step for determine total sessions
			this.#process.addQueueAction({
				title: main_core.Loc.getMessage('TASKS_GRID_GROUP_ACTION_COUNTING_ELEMENTS_PROGRESS'),
				action: GroupActionsStepper.ACTION_CONTROLLER_COUNT_TASKS,
				handlers: {
					StepCompleted(state, result) {
						if (state === ui_stepprocessing.ProcessResultStatus.completed) {
							const data = this.getParam('data') || [];
							// add total count in request
							if (result.TOTAL_ITEMS) {
								data.totalItems = parseInt(result.TOTAL_ITEMS, 10);
							}
							this.setParam('data', data);
						}
					}
				}
			});
		}
		#allSteps() {
			const requestStopFunction = this.#requestStopFunction;
			// on finish
			this.#process.setHandler(ui_stepprocessing.ProcessCallback.StateChanged, function (state) {
				if (state === ui_stepprocessing.ProcessResultStatus.completed) {
					requestStopFunction();
					// eslint-disable-next-line no-invalid-this
					this.closeDialog();
				}
			})
			// on cancel
			.setHandler(ui_stepprocessing.ProcessCallback.RequestStop, function (actionData) {
				setTimeout(
				// eslint-disable-next-line @bitrix24/bitrix24-rules/no-bx
				BX.delegate(function () {
					requestStopFunction();
					// eslint-disable-next-line no-invalid-this
					this.closeDialog();
				},
				// eslint-disable-next-line no-invalid-this
				this), 2000);
			})
			// payload action step
			.addQueueAction({
				title: this.#title,
				action: this.#action,
				handlers: {
					// keep total and processed in request
					StepCompleted(state, result) {
						if (state === ui_stepprocessing.ProcessResultStatus.progress) {
							const data = this.getParam('data') || [];
							if (result.PROCESSED_ITEMS) {
								data.processedItems = parseInt(result.PROCESSED_ITEMS, 10);
								data.lastProcessedId = parseInt(result.LAST_PROCESSED_ID, 10);
							}
							this.setParam('data', data);
						}
						if (state === ui_stepprocessing.ProcessState.error) {
							requestStopFunction();
							this.setMessage('RequestError', result.ERRORS);
							this.getDialog().setWarning(result.WARNING_TEXT, true);
						}
					}
				}
			})
			// params
			.setParam('data', this.#data);
		}
		#getTitle(action) {
			let title = '';
			switch (action) {
				case 'unmute':
					title = main_core.Loc.getMessage('TASKS_GRID_GROUP_ACTION_NAME_UNMUTE');
					break;
				case 'mute':
					title = main_core.Loc.getMessage('TASKS_GRID_GROUP_ACTION_NAME_MUTE');
					break;
				case 'ping':
					title = main_core.Loc.getMessage('TASKS_GRID_GROUP_ACTION_NAME_PING');
					break;
				case 'complete':
					title = main_core.Loc.getMessage('TASKS_GRID_GROUP_ACTION_NAME_COMPLETE');
					break;
				case 'setdeadline':
					title = main_core.Loc.getMessage('TASKS_GRID_GROUP_ACTION_NAME_SETDEADLINE');
					break;
				case 'adjustdeadline':
				case 'substractdeadline':
					title = main_core.Loc.getMessage('TASKS_GRID_GROUP_ACTION_NAME_ADJUSTDEADLINE');
					break;
				case 'settaskcontrol':
					if (this.#data.taskControlState === 'Y') {
						title = main_core.Loc.getMessage('TASKS_GRID_GROUP_ACTION_NAME_SETTASKCONTROL_YES');
					} else {
						title = main_core.Loc.getMessage('TASKS_GRID_GROUP_ACTION_NAME_SETTASKCONTROL');
					}
					break;
				case 'setresponsible':
					title = main_core.Loc.getMessage('TASKS_GRID_GROUP_ACTION_NAME_SETRESPONSIBLE');
					break;
				case 'setoriginator':
					title = main_core.Loc.getMessage('TASKS_GRID_GROUP_ACTION_NAME_SETORIGINATOR');
					break;
				case 'addauditor':
					title = main_core.Loc.getMessage('TASKS_GRID_GROUP_ACTION_NAME_ADDAUDITOR');
					break;
				case 'addaccomplice':
					title = main_core.Loc.getMessage('TASKS_GRID_GROUP_ACTION_NAME_ADDACCOMPLICE');
					break;
				case 'addtofavorite':
					title = main_core.Loc.getMessage('TASKS_GRID_GROUP_ACTION_NAME_ADDTOFAVORITE');
					break;
				case 'removefromfavorite':
					title = main_core.Loc.getMessage('TASKS_GRID_GROUP_ACTION_NAME_REMOVEFROMFAVORITE');
					break;
				case 'setgroup':
					title = main_core.Loc.getMessage('TASKS_GRID_GROUP_ACTION_NAME_SETGROUP');
					break;
				case 'setcollab':
					title = main_core.Loc.getMessage('TASKS_GRID_GROUP_ACTION_NAME_SETCOLLAB');
					break;
				case 'setflow':
					title = main_core.Loc.getMessage('TASKS_GRID_GROUP_ACTION_NAME_SETFLOW');
					break;
				case 'bindcrm':
					title = main_core.Loc.getMessage('TASKS_GRID_GROUP_ACTION_NAME_BINDCRM');
					break;
				case 'delete':
					title = main_core.Loc.getMessage('TASKS_GRID_GROUP_ACTION_NAME_DELETE');
					break;
				default:
					title = main_core.Loc.getMessage('TASKS_GRID_GROUP_ACTION_NONE');
			}
			return title;
		}
	}

	exports.GroupActionsStepper = GroupActionsStepper;

})(this.BX.Tasks = this.BX.Tasks || {}, BX, BX.Event, BX.UI.StepProcessing);
//# sourceMappingURL=group-actions-stepper.bundle.js.map
