/* eslint-disable */
this.BX = this.BX || {};
this.BX.Bizproc = this.BX.Bizproc || {};
(function (exports, main_core, ui_alerts, ui_entitySelector, main_popup, bizproc_a11y, bizproc_router, bizproc_task, bizproc_types, ui_hint, bizproc_workflow_faces, bizproc_workflow_faces_summary, bizproc_workflow_result, ui_buttons, ui_notification) {
	'use strict';

	class WorkflowLoader {
		loadWorkflows(ids) {
			return this.#runComponentAction('loadWorkflows', {
				ids
			});
		}
		#runComponentAction(action, data = {}) {
			return new Promise((resolve, reject) => {
				main_core.ajax.runComponentAction('bitrix:bizproc.user.processes', action, {
					mode: 'class',
					data
				}).catch(response => {
					reject(response);
				}).then(response => {
					resolve(response);
				});
			});
		}
	}

	class WorkflowRenderer {
		#currentUserId;
		#targetUserId;
		#data;
		#task;
		#inlineTaskView;
		#faces = null;
		constructor(data) {
			this.#data = data.workflow;
			this.#currentUserId = main_core.Type.isNumber(data.currentUserId) ? data.currentUserId : 0;
			this.#targetUserId = this.#data.userId;
			if (this.#data.task) {
				this.#task = new bizproc_task.Task(this.#data.task);
				if (main_core.Type.isArrayFilled(this.#task.controls.buttons)) {
					this.#task.setButtons(this.#task.buttons.map(button => ({
						onclick: () => data.userProcesses.doTask({
							taskId: this.#task.id,
							workflowId: this.#data.workflowId,
							taskName: this.#task.name,
							taskRequest: {
								[button.NAME]: button.VALUE
							}
						}),
						...button
					})));
				}
				this.#inlineTaskView = new bizproc_task.InlineTaskView({
					task: this.#task,
					responsibleUser: this.#targetUserId
				});
			}
		}
		renderProcess() {
			const itemName = main_core.Type.isString(this.#data?.name) ? this.#data.name : '';
			const typeName = main_core.Type.isString(this.#data?.typeName) ? this.#data.typeName : '';
			const documentUrl = this.#data.task?.url || this.#data.workflowUrl || this.#getWorkflowInfoUrl();
			const description = main_core.Type.isString(this.#data?.description) ? this.#data.description : '';
			const lengthLimit = 80;
			const collapsedDescription = main_core.Dom.create('span', {
				html: description?.replace(/(<br \/>)+/gm, ' ')
			}).textContent.replace(/\n+/, ' ').slice(0, lengthLimit);
			const collapsed = description?.length > lengthLimit;
			const descriptionNode = main_core.Tag.render`
			<span class="bp-user-processes__description">
				${description}
			</span>
		`;
			BX.UI.Hint.init(descriptionNode);
			const descriptionBox = main_core.Tag.render`
			<div class="bp-user-processes__description-box ${collapsed ? '' : '--expanded'}">
				<span class="bp-user-processes__short_description">
					${main_core.Text.encode(collapsedDescription)}
					...<a href="#" aria-expanded="false" class="bp-user-processes__description-link" data-testid="user-processes-description-more">${main_core.Loc.getMessage('BIZPROC_USER_PROCESSES_TEMPLATE_DESCRIPTION_MORE')}</a>
				</span>
				${descriptionNode}
			</div>
		`;
			const moreLink = descriptionBox.querySelector('.bp-user-processes__description-link');
			if (moreLink) {
				main_core.Event.bind(moreLink, 'click', event => {
					event.preventDefault();
					main_core.Dom.attr(moreLink, 'aria-expanded', 'true');
					main_core.Dom.addClass(descriptionBox, '--expanded');
					// the link gets hidden by CSS, move focus to the expanded text
					main_core.Dom.attr(descriptionNode, 'tabindex', '-1');
					descriptionNode.focus();
				});
			}
			return main_core.Tag.render`
				<div class="bp-user-processes">
					<a class="bp-user-processes__title-link ui-typography-text-lg"
						data-testid="bizproc-user-processes-row-title"
						href="${main_core.Text.encode(documentUrl)}">${main_core.Text.encode(itemName)}
					</a>
					<div class="bp-user-processes__appointment">${main_core.Text.encode(typeName.toUpperCase())}</div>
					${descriptionBox}
			</div>
		`;
		}
		#getWorkflowInfoUrl() {
			const idParam = main_core.Type.isNil(this.#data.task?.id) ? this.#data.workflowId : this.#data.task.id;
			const uri = new main_core.Uri(`/company/personal/bizproc/${idParam}/`);
			return uri.toString();
		}
		renderTaskName() {
			return this.#inlineTaskView?.render();
		}
		renderTask() {
			if (!this.#data.task || this.#data.userId !== this.#currentUserId) {
				const completedClassName = this.#data.isCompleted ? '--success' : '';
				let resultNode = '';
				if (this.#data.isCompleted && this.#data.workflowResult !== null) {
					resultNode = new bizproc_workflow_result.WorkflowResult(this.#data.workflowResult).render();
				}
				return main_core.Tag.render`
				<div class="bp-status-panel ${completedClassName}">
					<div class="bp-status-item">
						<div class="bp-status-name">${main_core.Text.encode(this.#data.statusText.toUpperCase())}</div>
						${resultNode}
					</div>
				</div>
			`;
			}
			return this.renderTaskName();
		}
		renderDocumentName() {
			const documentName = main_core.Type.isString(this.#data?.document?.name) ? this.#data.document.name : '';
			if (main_core.Type.isString(this.#data?.document?.url)) {
				const url = new main_core.Uri(this.#data.document.url);
				return main_core.Tag.render`
				<a href="${main_core.Text.encode(url.toString())}">
					${main_core.Text.encode(documentName)}
				</a>
			`;
			}
			return main_core.Text.encode(documentName);
		}
		renderWorkflowFaces() {
			const target = main_core.Tag.render`<div></div>`;
			if (this.#data.workflowId && this.#data.taskProgress) {
				try {
					this.#faces = new bizproc_workflow_faces.WorkflowFaces({
						workflowId: this.#data.workflowId,
						targetUserId: this.#targetUserId,
						target,
						data: {
							steps: this.#data.taskProgress.steps,
							progressBox: this.#data.taskProgress.progressBox
						},
						showArrow: true
					});
					this.#faces.render();
				} catch (e) {
					console.error(e);
				}
			}
			return target;
		}
		renderSummary() {
			if (!this.#data.workflowId || !this.#data.taskProgress?.timeStep) {
				return null;
			}
			return new bizproc_workflow_faces_summary.Summary({
				workflowId: this.#data.workflowId,
				data: this.#data.taskProgress.timeStep
			}).render();
		}
		destroy() {
			this.#data = null;
			this.#task = null;
			this.#inlineTaskView = null;
			if (!main_core.Type.isNil(this.#faces)) {
				this.#faces.destroy();
				this.#faces = null;
			}
		}
	}

	class CounterPanel {
		constructor(options) {
			this.filterId = options.filterId;
			this.counters = options.counters;
		}
		renderTo(target) {
			this.uiPanel = new BX.UI.CounterPanel({
				target,
				multiselect: false,
				title: main_core.Loc.getMessage('BIZPROC_USER_PROCESSES_TEMPLATE_COUNTERS_LABEL'),
				items: [{
					id: 'task',
					value: {
						value: this.counters?.task || 0,
						order: 1
					},
					title: {
						value: main_core.Loc.getMessage('BIZPROC_USER_PROCESSES_TEMPLATE_COUNTERS_TASK'),
						order: 2
					},
					color: this.#getTaskColor(this.counters?.task),
					separator: false,
					eventsForActive: {
						click: this.#setFilterPreset.bind(this)
					},
					eventsForUnActive: {
						click: this.#setFilterPreset.bind(this, 'active_task')
					}
				}, {
					id: 'comment',
					value: this.counters?.comment || 0,
					title: main_core.Loc.getMessage('BIZPROC_USER_PROCESSES_TEMPLATE_COUNTERS_COMMENT'),
					color: this.#getCommentColor(this.counters?.comment),
					eventsForActive: {
						click: this.#setFilterPreset.bind(this)
					},
					eventsForUnActive: {
						click: this.#setFilterPreset.bind(this, 'comment')
					}
				}]
			});
			this.uiPanel.init();

			// counter items are clickable divs; panel binds its own click handlers,
			// so only role, tabindex and keyboard activation are added here
			target.querySelectorAll('.ui-counter-panel__item').forEach(item => {
				bizproc_a11y.makeActivatable(item, () => {});
			});
			this.#subscribeToPulls();
		}
		#subscribeToPulls() {
			BX.PULL.subscribe({
				moduleId: 'main',
				command: 'user_counter',
				callback: params => {
					const taskCounterValue = params[BX.message('SITE_ID')]?.bp_tasks ?? null;
					if (taskCounterValue !== null) {
						this.uiPanel.getItemById('task').updateValue(taskCounterValue);
						this.uiPanel.getItemById('task').updateColor(this.#getTaskColor(taskCounterValue));
					}
				}
			});
			BX.PULL.subscribe({
				moduleId: 'bizproc',
				command: 'comment',
				callback: params => {
					const allUnreadValue = params.counter?.allUnread ?? null;
					if (allUnreadValue !== null) {
						this.uiPanel.getItemById('comment').updateValue(allUnreadValue);
						this.uiPanel.getItemById('comment').updateColor(this.#getCommentColor(allUnreadValue));
					}
				}
			});
		}
		#getTaskColor(value) {
			return value > 0 ? 'DANGER' : 'THEME';
		}
		#getCommentColor(value) {
			return value > 0 ? 'SUCCESS' : 'THEME';
		}
		#setFilterPreset(presetId) {
			const filterManager = this.#getFilterManager();
			if (!filterManager) {
				return;
			}
			const api = filterManager.getApi();
			const fields = {
				SYSTEM_PRESET: presetId ?? 'in_work'
			};
			api.setFields(fields);
			api.apply();
		}
		#getFilterManager() {
			if (this.filterId) {
				return BX.Main.filterManager?.getById(this.filterId);
			}

			// eslint-disable-next-line no-console
			console.warn('Filter not found');
			return null;
		}
	}

	/**
	 * The decision a homogeneous selection is performed by. The server leaves the item of the panel
	 * empty: which decisions the selection offers is known from the checked rows only, so the list fills
	 * the container itself. Nothing chosen is not a decision by default - approving and rejecting look
	 * alike in a menu, and neither may happen just because a menu had a first item.
	 */
	class DecisionControl {
		#container = null;
		#button = null;
		#buttons = [];
		#selected = null;

		/** Takes over the container of the panel item. The panel is rebuilt with the grid, and so is this. */
		renderTo(container) {
			this.#dropButton();
			// the offer belongs to the container it was drawn in, and this is another one
			this.#buttons = [];
			this.#selected = null;
			this.#container = main_core.Type.isDomNode(container) ? container : null;
			if (this.#container === null) {
				return;
			}
			main_core.Dom.clean(this.#container);
			main_core.Dom.attr(this.#container, {
				role: 'group',
				'aria-label': main_core.Loc.getMessage('BIZPROC_USER_PROCESSES_TEMPLATE_DECISION_LABEL')
			});
			main_core.Dom.hide(this.#container);
		}

		/**
		 * @param tasks The tasks of the selection the pass would start with. A selection that offers no
		 *   single decision leaves the container empty: the decision is then made inside the pass.
		 */
		update(tasks) {
			const buttons = readDecisionButtons(tasks);

			// the same offer is the same control: a selection grown by a row of the same kind of task must
			// not take away the decision the person has already chosen
			if (isSameOffer(buttons, this.#buttons)) {
				return;
			}

			// another offer is another kind of task, and the previous choice says nothing about it
			this.#buttons = buttons;
			this.#selected = null;
			this.#render();
		}

		/** The task request the pass starts with, or nothing while no decision is chosen. */
		get decision() {
			return this.#selected === null ? null : {
				[this.#selected.NAME]: this.#selected.VALUE
			};
		}
		#render() {
			if (this.#container === null) {
				return;
			}
			this.#dropButton();
			main_core.Dom.clean(this.#container);
			if (this.#buttons.length === 0) {
				main_core.Dom.hide(this.#container);
				return;
			}
			this.#button = new ui_buttons.Button({
				text: this.#getText(),
				useAirDesign: true,
				size: ui_buttons.ButtonSize.SMALL,
				style: ui_buttons.AirButtonStyle.OUTLINE,
				dropdown: true,
				dataset: {
					testid: 'bizproc-user-processes-decision-selector'
				},
				systemMenu: {
					items: this.#getMenuItems()
				}
			});
			this.#button.renderTo(this.#container);
			// the panel of the grid lives inside the form of the grid, and a button element with no type of
			// its own submits it: the answer of the form rebuilds the grid, which drops the checked rows and
			// the menu of decisions along with them
			main_core.Dom.attr(this.#button.getContainer(), 'type', 'button');
			// the menu of the button writes aria-haspopup on it the moment it first opens, so until then
			// nothing tells that the button offers a choice of decisions at all
			main_core.Dom.attr(this.#button.getContainer(), 'aria-haspopup', 'menu');
			main_core.Dom.show(this.#container);
		}
		#getMenuItems() {
			return this.#buttons.map(button => ({
				title: button.TEXT,
				dataset: {
					testid: `bizproc-user-processes-decision-${button.NAME}`
				},
				onClick: () => this.#choose(button)
			}));
		}
		#choose(button) {
			this.#selected = button;
			this.#button?.setText(this.#getText());
		}
		#getText() {
			return this.#selected === null ? main_core.Loc.getMessage('BIZPROC_USER_PROCESSES_TEMPLATE_DECISION_PLACEHOLDER') : this.#selected.TEXT;
		}

		/** The menu of the previous offer owns a popup: dropping the button alone would leave it behind. */
		#dropButton() {
			this.#button?.setSystemMenu(false);
			this.#button = null;
		}
	}

	/**
	 * A selection one decision is enough for: every task of it goes without a form and they all carry one
	 * and the same hash. This is the very condition the batch rule of the mechanics applies, and the panel
	 * has to know it up front - to offer the decisions of the task at all.
	 */
	function isSingleDecisionSelection(tasks) {
		const hash = tasks[0]?.hash;
		return main_core.Type.isStringFilled(hash) && tasks.every(task => task.isInline === true && task.hash === hash);
	}

	/** The decisions the selection offers: the buttons of its task, since every task of it is the same. */
	function readDecisionButtons(tasks) {
		if (!isSingleDecisionSelection(tasks)) {
			return [];
		}
		const buttons = tasks[0].controls?.buttons;
		return main_core.Type.isArrayFilled(buttons) ? buttons.filter(button => isDecisionButton(button)) : [];
	}

	/** A button with nothing to send or nothing to read is not a decision the person can be offered. */
	function isDecisionButton(button) {
		return main_core.Type.isStringFilled(button?.NAME) && main_core.Type.isStringFilled(button?.TEXT);
	}

	/**
	 * The label is part of the decision, not a look of it: two templates naming the same decisions with
	 * different words are different offers, and the menu must not keep the words of the previous one.
	 */
	function isSameDecision(button, other) {
		return button.NAME === other?.NAME && button.VALUE === other?.VALUE && button.TEXT === other?.TEXT;
	}

	/** Whether the selection offers the very same decisions in the very same order. */
	function isSameOffer(buttons, other) {
		return buttons.length === other.length && buttons.every((button, index) => isSameDecision(button, other[index]));
	}

	/** Says a word of the pass to the person: the balloon carries no live region of its own. */
	function notifyPass(messageCode) {
		const content = main_core.Loc.getMessage(messageCode);

		// the balloon renders a string as HTML, and a phrase of the pass may come with a substitution
		ui_notification.UI.Notification.Center.notify({
			content: main_core.Text.encode(content)
		});
		bizproc_a11y.announce(content);
	}

	// EVENT-02: the decision the form of a task publishes once the server has accepted it. The identifier
	// belongs to the form of a task, and the public surface of the mechanics does not carry it.
	const TASK_DECISION_EVENT = 'bp-performer-task-decision';

	// The two messages the form of a task frames a decision with: one when it goes to the server, one when
	// the server refused it. Together with EVENT-02 they say how a decision ended, whatever became of the
	// form in the meantime.
	const TASK_DECISION_SENT_EVENT = 'try-do-bp-task-event';
	const TASK_DECISION_FAILED_EVENT = 'error-do-bp-task-event';

	/** The task the address of the form of a task names - `/company/personal/bizproc/<taskId>/`. */
	const TASK_URL_PATTERN = /\/bizproc\/(\d+)\//;
	const SIDE_PANEL_MESSAGE_EVENT = 'SidePanel.Slider:onMessage';
	const SIDE_PANEL_OPEN_EVENT = 'SidePanel.Slider:onOpenComplete';
	const SIDE_PANEL_CLOSE_EVENT = 'SidePanel.Slider:onCloseComplete';

	/**
	 * How long a step of the pass waits for the form it asked for to appear. The panel reports an open of
	 * its own (`onOpenComplete`), and an open that did not happen reports nothing at all: the request is
	 * refused where the panel already shows that very address, and the panel itself is brought in by a
	 * loader of its own, which answers a failure to the console. Without a limit the step would wait for a
	 * form nobody is going to show, and the group action would stay dead until the page is reloaded.
	 *
	 * How long an honest open takes belongs to the portal and not to this code, so the limit is only a
	 * default here: the list passes its own (`formOpenTimeout`).
	 */
	const DEFAULT_FORM_OPEN_TIMEOUT = 20000;

	/**
	 * The mechanics of a pass, once loaded. The list needs them only after a group action is chosen and
	 * applied, so the extension is not part of the page: a list a person just reads never asks for it.
	 * Everything reaching for it goes through a pass, and a pass is only ever started by `loadPerformer`.
	 */
	let performer = null;
	function loadPerformer() {
		if (performer !== null) {
			return Promise.resolve(performer);
		}
		return main_core.Runtime.loadExtension('bizproc.task.performer').then(exports => {
			performer = exports;
			return exports;
		});
	}

	/**
	 * One pass over the selected tasks. It owns the snapshot of the queue, tells the form of a task which
	 * task goes next (EVENT-01) and takes the person through a task in the side panel (P3). How the queue
	 * is walked is decided by `bizproc.task.performer` - nothing of that lives here.
	 *
	 * Everything the pass subscribed to is dropped the moment it ends, however it ended: a listener that
	 * outlived its pass would answer for a queue that is gone.
	 */
	class TaskPassSession {
		#tasks;
		#handlers;
		#formOpenTimeout;

		// Where the pass stands: the task last handed to the opener. It outlives one step of the pass,
		// unlike #resolveStep, so a message about another task is not taken for a message about this one.
		#currentTaskId = 0;
		#currentTask = null;
		#resolveStep = null;

		// Whether a decision on the task the pass stands on is on its way to the server. While it is, the
		// step is settled by the answer of the server and not by whatever happens to the form meanwhile.
		#isDecisionSent = false;

		// The side panel the pass opened. The panels opened from inside it are not the pass.
		#slider = null;
		#isSliderRequested = false;
		#sliderOpenTimeoutId = null;

		// The same panel, kept once it closed: the messages of a decision reach the pass after the form is
		// gone as well, and they are still the messages of that form.
		#openedSlider = null;

		/**
		 * @param tasks The selection, in the order of the rows of the list.
		 * @param options.formOpenTimeout How long a step waits for the form of its task, in milliseconds.
		 */
		constructor(tasks, options = {}) {
			this.#tasks = [...tasks];
			this.#formOpenTimeout = toFormOpenTimeout(options?.formOpenTimeout);
			this.#handlers = {
				[SIDE_PANEL_MESSAGE_EVENT]: this.#handleSliderMessage,
				[SIDE_PANEL_OPEN_EVENT]: this.#handleSliderOpen,
				[SIDE_PANEL_CLOSE_EVENT]: this.#handleSliderClose
			};
		}

		/**
		 * @param decision The task request the pass starts with, or nothing when the decision is made
		 *   inside the pass, task by task.
		 */
		async run(decision) {
			this.#subscribe();
			try {
				return await new performer.TasksPerformer({
					tasks: this.#tasks,
					decision,
					openTask: this.#openTask
				}).start();
			} finally {
				this.#unsubscribe();
			}
		}
		#subscribe() {
			Object.entries(this.#handlers).forEach(([eventName, handler]) => main_core.addCustomEvent(eventName, handler));
		}
		#unsubscribe() {
			Object.entries(this.#handlers).forEach(([eventName, handler]) => main_core.removeCustomEvent(eventName, handler));
		}

		/**
		 * Takes the person through one task. The form is opened only when there is none open: the form of the
		 * task just performed is still on the screen while it closes, and the next task is opened once that
		 * form is gone (`#handleSliderClose`). A form that shows the next task itself - which it does while
		 * that task belongs to its own process (EVENT-01) - stays, and the step then waits for a decision on
		 * the form that is already there.
		 */
		#openTask = task => {
			this.#currentTaskId = task.id;
			this.#currentTask = task;
			this.#isDecisionSent = false;
			return new Promise(resolve => {
				this.#resolveStep = resolve;
				this.#openSlider();
			});
		};

		/**
		 * Shows the form of the task the pass stands on - unless one is already there to show it, or nobody
		 * is waiting for that task any more: a form is only ever opened for a step of the pass.
		 */
		#openSlider() {
			const task = this.#currentTask;
			if (task === null || this.#resolveStep === null || this.#slider !== null || this.#isSliderRequested) {
				return;
			}
			this.#isSliderRequested = true;
			this.#sliderOpenTimeoutId = setTimeout(this.#handleSliderOpenFailure, this.#formOpenTimeout);
			bizproc_router.Router.openWorkflowTask(task.id, task.userId);
		}

		/** Nothing is waited for any more: the form arrived, or the step it was asked for is over. */
		#stopWaitingForSlider() {
			this.#isSliderRequested = false;
			if (this.#sliderOpenTimeoutId !== null) {
				clearTimeout(this.#sliderOpenTimeoutId);
				this.#sliderOpenTimeoutId = null;
			}
		}

		/**
		 * The form never appeared. The person has nothing to decide in and no reason to expect the next form
		 * to appear either, so the pass ends here instead of waiting on: what it performed stays performed,
		 * the tasks behind keep waiting for their decision, and the panel of the list can start a pass anew
		 * without the page being reloaded. Silence would leave the group action dead until it is.
		 */
		#handleSliderOpenFailure = () => {
			this.#stopWaitingForSlider();
			if (this.#resolveStep === null) {
				return;
			}
			notifyPass('BIZPROC_USER_PROCESSES_TEMPLATE_PERFORM_GROUP_FORM_FAILED');
			this.#settleStep({
				status: performer.TaskPassStatus.Exit,
				decision: null,
				outcome: null
			});
		};

		/**
		 * What the form of a task says about a decision: that it went to the server, that the server refused
		 * it, or - EVENT-02 - that the server accepted it. Only the last one ends a step as performed, and
		 * only because the form publishes it after the server has accepted it for this very task: the record
		 * of the outcome repeats an answer of the server and is not a guess of the interface.
		 */
		#handleSliderMessage = event => {
			if (!this.#isOwnSliderMessage(event)) {
				return;
			}
			const eventId = readEventId(event);
			const data = readEventData(event);
			if (eventId === TASK_DECISION_SENT_EVENT || eventId === TASK_DECISION_FAILED_EVENT) {
				this.#trackDecisionInFlight(eventId, data);
				return;
			}
			if (eventId !== TASK_DECISION_EVENT) {
				return;
			}
			if (main_core.Text.toInteger(data?.taskId) !== this.#currentTaskId) {
				return;
			}
			this.#isDecisionSent = false;
			this.#settleStep({
				status: performer.TaskPassStatus.Done,
				// a decision that carried files is not repeated for a group: the files stay in the form
				decision: data?.hasFileFields === true || !main_core.Type.isPlainObject(data?.taskRequest) ? null : data.taskRequest,
				outcome: {
					taskId: this.#currentTaskId,
					status: performer.TaskOutcomeStatus.Done,
					errors: []
				}
			});
		};

		/**
		 * Whether the message came from the form the pass opened. Every panel of the portal shares the bus,
		 * so a message of another one says nothing about the task the pass stands on.
		 */
		#isOwnSliderMessage(event) {
			const sender = main_core.Type.isFunction(event?.getSender) ? event.getSender() : null;
			return sender !== null && sender === this.#openedSlider;
		}

		/**
		 * The form the pass asked for: the panels opened from inside it belong to the person, not to us. The
		 * address tells them apart - the pass opens the form by the address of its own task
		 * (`Router.openWorkflowTask`), so a panel showing anything else is not the form the step waits for.
		 * Taken for that form, it would end a wait for a form that never came, and the form itself would
		 * then be ignored as an open of somebody else.
		 */
		#handleSliderOpen = event => {
			const slider = main_core.Type.isFunction(event?.getSlider) ? event.getSlider() : null;
			if (!this.#isSliderRequested || readSliderTaskId(slider) !== this.#currentTaskId) {
				return;
			}
			this.#stopWaitingForSlider();
			this.#slider = slider;
			this.#openedSlider = slider;
		};

		/**
		 * A decision on its way to the server, and the refusal that ends it. Both messages name the process
		 * only, so they are taken as being about the task the pass stands on when the process matches: the
		 * form decides one task at a time and the pass owns that form.
		 *
		 * A refusal leaves the task undecided. A form still on the screen can be tried again, and the step
		 * waits for that; a refusal reaching a form that is already gone ends the step - a pass with neither
		 * a form nor an ending would never finish.
		 */
		#trackDecisionInFlight(eventId, data) {
			const workflowId = this.#currentTask?.workflowId;
			if (!main_core.Type.isStringFilled(workflowId) || data?.workflowId !== workflowId) {
				return;
			}
			this.#isDecisionSent = eventId === TASK_DECISION_SENT_EVENT;
			if (eventId === TASK_DECISION_FAILED_EVENT && this.#slider === null) {
				this.#settleStep({
					status: performer.TaskPassStatus.Skipped,
					decision: null,
					outcome: null
				});
			}
		}

		/**
		 * The form went away. What the step ended with is not the close itself:
		 *   - a decision already on its way settles the step when the server answers it (EVENT-02, or the
		 *     refusal of it), so a close overtaking that answer decides nothing;
		 *   - a form that closed while it was showing ANOTHER task never offered the one the pass stands on,
		 *     so the pass opens that task again instead of losing it;
		 *   - the form of the task the pass stands on, closed with no decision on its way, is the person
		 *     leaving that task undecided - the pass goes on, as before.
		 */
		#handleSliderClose = event => {
			const slider = main_core.Type.isFunction(event?.getSlider) ? event.getSlider() : null;
			if (this.#slider === null || slider !== this.#slider) {
				return;
			}
			const shownTaskId = readSliderTaskId(slider);
			this.#slider = null;
			if (this.#isDecisionSent) {
				return;
			}
			if (shownTaskId > 0 && shownTaskId !== this.#currentTaskId) {
				this.#openSlider();
				return;
			}
			this.#settleStep({
				status: performer.TaskPassStatus.Skipped,
				decision: null,
				outcome: null
			});
		};

		/** Reports how the step ended. A step nobody waits for ends nothing. */
		#settleStep(pass) {
			const resolve = this.#resolveStep;
			if (resolve === null) {
				return;
			}

			// the form was asked for by this very step, and the step is over
			this.#stopWaitingForSlider();
			this.#resolveStep = null;
			resolve(pass);
		}
	}

	/** A limit naming no time at all is no limit: the default stands. */
	function toFormOpenTimeout(value) {
		const timeout = main_core.Text.toInteger(value);
		return timeout > 0 ? timeout : DEFAULT_FORM_OPEN_TIMEOUT;
	}

	/**
	 * The task the form of a task was showing, out of the address of its panel: the form walks the queue
	 * itself and names the task it moved to in that very address (`Router.openWorkflowTask` opens it,
	 * `Slider.setUrl` follows every redraw). An address naming no task reads as 0 - an unreadable address
	 * must not turn the close of a form into an unexpected reopening.
	 */
	function readSliderTaskId(slider) {
		const url = main_core.Type.isFunction(slider?.getUrl) ? slider.getUrl() : '';
		return main_core.Type.isStringFilled(url) ? main_core.Text.toInteger(url.match(TASK_URL_PATTERN)?.[1]) : 0;
	}
	function readEventId(event) {
		return main_core.Type.isFunction(event?.getEventId) ? event.getEventId() : null;
	}
	function readEventData(event) {
		const data = main_core.Type.isFunction(event?.getData) ? event.getData() : null;
		return main_core.Type.isPlainObject(data) ? data : null;
	}

	/** The value of the panel item that starts a pass over the selected tasks. */
	const ACTION_PERFORM_GROUP = 'perform_group';

	/** The attribute a row of the grid carries the fields of its task nothing but a pass reads in. */
	const ROW_TASK_ATTRIBUTE = 'data-bp-task';

	/** The cells of the list the client draws itself (`$wrapJsRender` of the template). */
	const RENDER_CELL_SELECTOR = '[data-role="bp-render-cell"]';

	// Which rows are checked is not part of the value of the panel, so the offer of decisions follows the
	// selection events of the grid.
	const GRID_SELECTION_EVENTS = ['Grid::selectRow', 'Grid::unselectRow', 'Grid::selectRows', 'Grid::unselectRows', 'Grid::allRowsSelected', 'Grid::allRowsUnselected'];

	/**
	 * The grid a selection event is about. Every grid of the page shares these events and each of them
	 * names its own grid last (`[row, this]`, `[rows, this]`, `[this]`); the confirmation of "select all"
	 * names none at all, and an event naming no grid says nothing to sort it by.
	 */
	function readEventGrid(args) {
		const grid = [...args].reverse().find(argument => main_core.Type.isFunction(argument?.getRows));
		return main_core.Type.isNil(grid) ? null : grid;
	}

	/**
	 * The fields of the task each drawn cell of the list gets, by the cell. The row carries one copy of
	 * them for all its cells (`$rowTaskFields` of the template), so the attribute is read once per row and
	 * not once per cell - five columns of the list go through this, and a page of a hundred rows would
	 * otherwise read the same hundred attributes five times over.
	 */
	function readRowTaskFields() {
		const fieldsByCell = new Map();
		document.querySelectorAll(`[${ROW_TASK_ATTRIBUTE}]`).forEach(rowNode => {
			const fields = readTaskFields(rowNode);
			if (fields === null) {
				return;
			}
			rowNode.querySelectorAll(RENDER_CELL_SELECTOR).forEach(cell => fieldsByCell.set(cell, fields));
		});
		return fieldsByCell;
	}

	/**
	 * The fields of the task out of the attribute of the row. The server encodes the attribute once and
	 * the browser gives its value back decoded, so the value is parsed as it stands: `Dom.attr` would
	 * decode it a second time, and then a decision whose label carries an HTML entity as text (`&quot;`)
	 * would stop parsing - the row would silently lose its hash, its activity and its decisions.
	 */
	function readTaskFields(rowNode) {
		try {
			const fields = JSON.parse(rowNode.getAttribute(ROW_TASK_ATTRIBUTE) ?? '');
			return main_core.Type.isPlainObject(fields) ? fields : null;
		} catch {
			return null;
		}
	}

	/**
	 * Puts back the fields of the task the row carries once: the description of a cell comes without them.
	 * A row drawn by the list itself - one added on a push - has the whole description of its task to
	 * begin with and no attribute, and nothing is taken away from it here.
	 */
	function withRowTaskFields(workflow, cell, fieldsByCell) {
		if (!main_core.Type.isPlainObject(workflow) || !main_core.Type.isPlainObject(workflow.task)) {
			return workflow;
		}
		const fields = fieldsByCell.get(cell) ?? null;
		return main_core.Type.isPlainObject(fields) ? {
			...workflow,
			task: {
				...workflow.task,
				...fields
			}
		} : workflow;
	}
	class UserProcesses {
		delegateToUserId = 0;
		// A row of the list is a process, and the task of the row is what a group action is done to, so
		// the row keeps the whole description of its task (DTO-02) and not just its identifier.
		#workflowTasks = new Map();
		#decisionControl = null;
		#passSession = null;

		// A pass asked for, while the mechanics of it are on their way: there is no session to look at yet.
		#isPassStarting = false;

		// How long a step of a pass waits for the form of its task. How long an honest open of it takes is
		// a property of the portal and not of this code, so the list is told (`TASK_FORM_OPEN_TIMEOUT` of
		// the component); nothing named leaves the pass with a default of its own.
		#taskFormOpenTimeout = 0;
		#workflowRenderer = {};
		#targetUserId;
		#shownMobilePopup;
		#appLink;
		#gridSubscription = null;
		constructor(options) {
			let mustSubscribeToPushes = false;
			if (main_core.Type.isPlainObject(options)) {
				this.gridId = options.gridId;
				if (main_core.Type.isArray(options.errors)) {
					this.showErrors(options.errors);
				}
				this.actionPanel = {
					wrapperElementId: options.actionPanelUserWrapperId,
					decisionWrapperElementId: options.actionPanelDecisionWrapperId,
					actionButtonName: `${this.gridId}_action_button`
				};
				this.currentUserId = options.currentUserId;
				this.#targetUserId = options.targetUserId;
				this.#shownMobilePopup = options.shownMobilePopup;
				this.#appLink = options.appLink;
				this.#taskFormOpenTimeout = main_core.Text.toInteger(options.taskFormOpenTimeout);
				mustSubscribeToPushes = options.mustSubscribeToPushes === true;
			}
			this.loader = new WorkflowLoader();
			if (mustSubscribeToPushes) {
				this.#subscribeToPushes();
			}
			this.#subscribeToTaskDo();
			this.#subscribeToSelectionChanged();
			this.subscribeGridEvents();
			this.init();
			this.initCounterPanel(options.counters, options.filterId);
		}
		#subscribeToPushes() {
			BX.PULL.subscribe({
				moduleId: 'bizproc',
				command: 'workflow',
				callback: params => {
					if (params.eventName === 'DELETED' || params.eventName === 'UPDATED') {
						params.items.forEach(workflow => this.removeWorkflow(workflow.id));
					}
					if (params.eventName === 'ADDED' || params.eventName === 'UPDATED') {
						const rowsCollectionWrapper = this.getGrid().getRows();
						let ids = params.items.map(workflow => workflow.id);
						if (params.eventName === 'ADDED') {
							ids = ids.filter(id => !rowsCollectionWrapper.getById(id));
						}
						if (ids.length > 0) {
							this.loader.loadWorkflows(ids).then(this.#updateWorkflows.bind(this)).catch(response => this.showErrors(response));
						}
					}
				}
			});
		}
		#subscribeToTaskDo() {
			BX.addCustomEvent('SidePanel.Slider:onMessage', event => {
				if (event.getEventId() === 'try-do-bp-task-event') {
					this.#hideRow(event.data.workflowId);
				} else if (event.getEventId() === 'error-do-bp-task-event') {
					this.#showRow(event.data.workflowId);
				} else if (event.getEventId() === 'success-do-bp-task-event') {
					ui_notification.UI.Notification.Center.notify({
						content: main_core.Loc.getMessage('BIZPROC_USER_PROCESSES_TEMPLATE_TASK_TOUCHED', {
							'#TASK_NAME#': main_core.Text.encode(event.data.taskName)
						})
					});
				}
			});
		}

		/**
		 * The panel reports its own value only, and which decisions it offers follows the checked rows -
		 * so the offer is rebuilt whenever the selection of the grid changes.
		 */
		#subscribeToSelectionChanged() {
			GRID_SELECTION_EVENTS.forEach(eventName => main_core.addCustomEvent(eventName, this.#handleSelectionChanged));
		}
		#unsubscribeFromSelectionChanged() {
			GRID_SELECTION_EVENTS.forEach(eventName => main_core.removeCustomEvent(eventName, this.#handleSelectionChanged));
		}

		/**
		 * The selection of another grid of the page says nothing about the rows this list offers. An event
		 * that named no grid is still answered: the offer of decisions must not stop following the checked
		 * rows just because a payload came empty.
		 */
		#handleSelectionChanged = (...args) => {
			const grid = readEventGrid(args);
			if (grid !== null && grid !== this.getGrid()) {
				return;
			}
			this.onActionPanelChanged();
		};
		subscribeGridEvents() {
			this.unsubscribeGridEvents();
			this.#gridSubscription = bizproc_a11y.subscribeGridUpdated(this.gridId, () => bizproc_a11y.announce(main_core.Loc.getMessage('BIZPROC_USER_PROCESSES_TEMPLATE_GRID_UPDATED')));
		}
		unsubscribeGridEvents() {
			this.#gridSubscription?.destroy();
			this.#gridSubscription = null;
		}
		destroy() {
			this.unsubscribeGridEvents();
			this.#unsubscribeFromSelectionChanged();
		}
		#updateWorkflows(response) {
			const {
				workflows
			} = response.data;
			if (!main_core.Type.isArray(workflows)) {
				// eslint-disable-next-line no-console
				console.warn('Unexpected response from server. Expected workflow.data to be an array');
				return;
			}
			const gridRealtime = this.getGrid()?.getRealtime();
			if (gridRealtime) {
				let lastWorkflowId = null;
				workflows.forEach(workflow => {
					const isActual = Boolean(workflow.taskCnt > 0 || workflow.commentCnt > 0 || workflow.startedById === this.currentUserId && workflow.isCompleted === false);
					if (isActual) {
						this.#appendWorkflow({
							workflow,
							renderer: this.#createWorkflowRenderer(workflow.workflowId, workflow),
							insertAfter: lastWorkflowId
						});
						lastWorkflowId = workflow.workflowId;
					}
				});
			}
		}
		#appendWorkflow({
			workflow,
			renderer,
			insertAfter
		}) {
			this.#rememberWorkflowTask(workflow);
			const gridRealtime = this.getGrid()?.getRealtime();
			if (!gridRealtime) {
				return;
			}
			const addRowOptions = this.getDefaultAddRowOptions(workflow, renderer);
			if (main_core.Type.isStringFilled(insertAfter)) {
				addRowOptions.insertAfter = insertAfter;
			} else {
				addRowOptions.prepend = true;
			}
			gridRealtime.addRow(addRowOptions);

			// temporary crutches for the GRID :-)
			const row = this.getGrid()?.getRows().getById(workflow.workflowId);
			if (row) {
				if (addRowOptions.columnClasses) {
					for (const [columnId, columnClass] of Object.entries(addRowOptions.columnClasses)) {
						if (columnClass) {
							main_core.Dom.addClass(row.getCellById(columnId), columnClass);
						}
					}
				}
				main_core.Dom.addClass(row.getNode(), 'main-ui-grid-show-new-row');
				main_core.Event.bind(row.getNode(), 'animationend', event => {
					if (event.animationName === 'showNewRow') {
						main_core.Dom.removeClass(row.getNode(), 'main-ui-grid-show-new-row');
					}
				});
			}
		}
		getDefaultAddRowOptions(workflow, renderer) {
			const actions = [{
				text: main_core.Loc.getMessage('BIZPROC_USER_PROCESSES_TEMPLATE_ROW_ACTION_DOCUMENT'),
				href: workflow.document.url || '#'
			}];
			if (workflow.task) {
				actions.push({
					text: main_core.Loc.getMessage('BIZPROC_USER_PROCESSES_TEMPLATE_ROW_ACTION_TASK'),
					href: workflow.task.url
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
					WORKFLOW_STATE: main_core.Text.encode(workflow.statusText),
					DOCUMENT_NAME: renderer.renderDocumentName(),
					WORKFLOW_TEMPLATE_NAME: main_core.Text.encode(workflow.templateName),
					TASK_DESCRIPTION: main_core.Dom.create('span', {
						html: workflow.description || ''
					}),
					MODIFIED: main_core.Text.encode(workflow.modified),
					WORKFLOW_STARTED: main_core.Text.encode(workflow.workflowStarted),
					WORKFLOW_STARTED_BY: main_core.Text.encode(workflow.startedBy),
					OVERDUE_DATE: main_core.Text.encode(workflow.overdueDate),
					SUMMARY: renderer.renderSummary()
				},
				actions,
				columnClasses: {
					TASK_PROGRESS: 'bp-task-progress-cell',
					SUMMARY: 'bp-summary-cell',
					TASK: workflow.isCompleted ? 'bp-status-completed-cell' : '',
					TASK_DESCRIPTION: 'bp-description-cell'
				},
				counters: this.#getCountersOption(workflow),
				editable: Boolean(workflow.task)
			};
		}
		#getCountersOption(workflow) {
			const counters = {};
			if (this.#targetUserId === this.currentUserId && (workflow.taskCnt > 0 || workflow.commentCnt > 0)) {
				const primaryColor = workflow.taskCnt === 0 && workflow.commentCnt > 0 ? BX.Grid.Counters.Color.SUCCESS : BX.Grid.Counters.Color.DANGER;
				counters.MODIFIED = {
					type: BX.Grid.Counters.Type.LEFT,
					color: primaryColor,
					secondaryColor: BX.Grid.Counters.Color.SUCCESS,
					value: (workflow.taskCnt || 0) + (workflow.commentCnt || 0),
					isDouble: workflow.taskCnt > 0 && workflow.commentCnt > 0
				};
			}
			return counters;
		}
		init() {
			this.actionPanel.userWrapperElement = document.getElementById(this.actionPanel.wrapperElementId);
			this.initUserSelector();
			this.initDecisionControl();
			this.renderCells();
			this.#applyGridA11y();
			this.onActionPanelChanged();
		}
		#applyGridA11y() {
			const container = this.getGrid()?.getContainer();
			if (!main_core.Type.isDomNode(container)) {
				return;
			}
			bizproc_a11y.enhanceGrid(container, {
				gridId: this.gridId,
				rowActionsLabel: main_core.Loc.getMessage('BIZPROC_USER_PROCESSES_TEMPLATE_ROW_ACTIONS_LABEL'),
				checkboxesFromTitle: true
			});
		}
		initCounterPanel(counters, filterId) {
			const panelWrapperNode = document.querySelector('[data-role="bizproc-counterpanel"]');
			if (!panelWrapperNode) {
				return;
			}
			new CounterPanel({
				counters,
				filterId
			}).renderTo(panelWrapperNode);
		}
		renderCells() {
			const updated = new Map();
			const fieldsByCell = readRowTaskFields();
			document.querySelectorAll(RENDER_CELL_SELECTOR).forEach(target => {
				const workflow = withRowTaskFields(main_core.Dom.attr(target, 'data-workflow'), target, fieldsByCell);
				const columnId = main_core.Dom.attr(target, 'data-column');
				if (workflow) {
					if (!updated.has(workflow.workflowId)) {
						this.#deleteWorkflowRendererById(workflow.workflowId);
						updated.set(workflow.workflowId);
					}

					// set workflow task map
					this.#rememberWorkflowTask(workflow);
					this.renderColumnCell(target, columnId, workflow);
				}
			});
		}
		renderColumnCell(target, columnId, workflow) {
			const renderer = this.#getWorkflowRendererById(String(workflow.workflowId)) ?? this.#createWorkflowRenderer(String(workflow.workflowId), workflow);
			let childNode = null;
			switch (columnId) {
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
				// do nothing
			}
			if (childNode) {
				main_core.Dom.replace(target, childNode);
			}
		}
		clickStartWorkflowButton() {
			bizproc_router.Router.openUserProcessesStart();
			main_core.Runtime.loadExtension('ui.analytics').then(({
				sendData
			}) => {
				sendData({
					tool: 'automation',
					category: 'bizproc_operations',
					event: 'drawer_open',
					c_section: 'bizproc',
					c_element: 'button'
				});
			}).catch(() => {});
		}
		creationGuideOpen(params) {
			main_core.Runtime.loadExtension('lists.element.creation-guide').then(({
				CreationGuide
			}) => {
				CreationGuide?.open(params);
			}).catch(() => {});
		}
		initUserSelector() {
			if (!this.delegateToSelector) {
				this.delegateToSelector = new ui_entitySelector.TagSelector({
					multiple: false,
					tagMaxWidth: 180,
					events: {
						onTagAdd: event => {
							this.delegateToUserId = parseInt(event.getData().tag.getId(), 10);
							if (!main_core.Type.isInteger(this.delegateToUserId)) {
								this.delegateToUserId = 0;
							}
						},
						onTagRemove: () => {
							this.delegateToUserId = 0;
						}
					},
					dialogOptions: {
						entities: [{
							id: 'user',
							options: {
								intranetUsersOnly: true,
								inviteEmployeeLink: false
							}
						}]
					}
				});
			}
			if (main_core.Type.isDomNode(this.actionPanel.userWrapperElement)) {
				main_core.Dom.clean(this.actionPanel.userWrapperElement);
				this.delegateToSelector.renderTo(this.actionPanel.userWrapperElement);
				main_core.Dom.attr(this.actionPanel.userWrapperElement, {
					role: 'group',
					'aria-label': main_core.Loc.getMessage('BIZPROC_USER_PROCESSES_TEMPLATE_DELEGATE_TO_LABEL')
				});
			}
		}

		/**
		 * The panel item of a group pass comes with an empty container: which decisions the checked rows
		 * offer is known in the browser only. No container means the pass is not offered here at all - the
		 * list shows the tasks of another person.
		 */
		initDecisionControl() {
			if (!main_core.Type.isStringFilled(this.actionPanel.decisionWrapperElementId)) {
				return;
			}
			this.#decisionControl ??= new DecisionControl();
			this.#decisionControl.renderTo(document.getElementById(this.actionPanel.decisionWrapperElementId));
		}
		showErrors(errors) {
			if (!main_core.Type.isArrayFilled(errors)) {
				if (!main_core.Type.isArray(errors)) {
					console.error(errors);
				}
				return;
			}
			const errorsContainer = document.getElementById('bp-user-processes-errors-container');
			if (errorsContainer) {
				let errorCounter = 0;
				const fixStyles = () => {
					if (errorCounter > 0) {
						main_core.Dom.style(errorsContainer, {
							margin: '10px'
						});
					} else {
						main_core.Dom.style(errorsContainer, {
							margin: '0px'
						});
					}
				};
				for (const error of errors) {
					errorCounter += 1;
					const alert = new ui_alerts.Alert({
						text: main_core.Text.encode(error.message),
						color: ui_alerts.AlertColor.DANGER,
						closeBtn: true,
						animated: true
					});
					alert.renderTo(errorsContainer);
					if (alert.getCloseBtn()) {
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
		onActionPanelChanged() {
			const grid = this.getGrid();
			const actionPanel = grid?.getActionsPanel();
			if (actionPanel) {
				const action = actionPanel.getValues()[this.actionPanel.actionButtonName];
				if (main_core.Type.isString(action) && action.startsWith('delegate_to')) {
					main_core.Dom.show(this.actionPanel.userWrapperElement);
				} else {
					main_core.Dom.hide(this.actionPanel.userWrapperElement);
				}
				this.#decisionControl?.update(action === ACTION_PERFORM_GROUP ? this.#getSelectedPassTasks() : []);
			}
		}
		applyActionPanelValues() {
			const grid = this.getGrid();
			const actionsPanel = grid?.getActionsPanel();
			if (grid && actionsPanel) {
				const isApplyingForAll = actionsPanel.getForAllCheckbox()?.checked === true;
				// TODO - implement doing all tasks
				if (isApplyingForAll) {
					// the stub answers for the whole panel: an action asked about every task of the filter must
					// not quietly happen for the marked rows instead
					this.showErrors([{
						message: 'Not implemented currently'
					}]);
					return;
				}
				const action = actionsPanel.getValues()[this.actionPanel.actionButtonName];
				if (main_core.Type.isString(action)) {
					if (action === ACTION_PERFORM_GROUP) {
						this.#performSelectedTasks();
						return;
					}
					const selectedTasks = this.getSelectedTaskIds(grid.getRows().getSelectedIds());
					if (selectedTasks.length === 0) {
						// todo: show error?

						return;
					}
					if (action.includes('set_status_')) {
						const status = parseInt(action.split('_').pop(), 10);
						if (main_core.Type.isNumber(status)) {
							this.setTasksStatuses(selectedTasks, status);
						}
					} else if (action.startsWith('delegate_to')) {
						this.delegateTasks(selectedTasks, this.delegateToUserId);
					}
				}
			}
		}

		/**
		 * The task of the row as a group action reads it (DTO-02). The process is not part of the server
		 * description of a task - a row of the list is a process - so the row puts its own in.
		 */
		#rememberWorkflowTask(workflow) {
			if (!workflow.task) {
				return;
			}
			this.#workflowTasks.set(workflow.workflowId, {
				...workflow.task,
				workflowId: workflow.workflowId
			});
		}
		getSelectedTaskIds(selectedWorkflowIds) {
			return selectedWorkflowIds.map(workflowId => this.#workflowTasks.get(workflowId)?.id).filter(taskId => main_core.Type.isNumber(taskId));
		}

		/**
		 * The tasks of the checked rows a pass can be walked by. A row whose task is not awaiting a
		 * decision of this person carries nothing to perform and stays out of the queue; the order of the
		 * rest repeats the order of the rows.
		 */
		#getSelectedPassTasks() {
			const selectedWorkflowIds = this.getGrid()?.getRows().getSelectedIds() ?? [];
			return selectedWorkflowIds.map(workflowId => this.#workflowTasks.get(workflowId)).filter(task => main_core.Type.isPlainObject(task) && task.isRunning === true);
		}

		/**
		 * Starts a pass over the checked rows. A selection one decision is enough for is performed by the
		 * decision chosen in the panel, and a mixed one leaves the decision to the pass itself, task by
		 * task. The list neither walks the queue nor reports how the operation ended - that is the pass.
		 */
		#performSelectedTasks() {
			// a pass keeps the form of a task on the screen, so the person already sees the one that goes on;
			// while the mechanics are still being loaded there is nothing on the screen yet, hence the flag
			if (this.#passSession !== null || this.#isPassStarting) {
				return;
			}
			const tasks = this.#getSelectedPassTasks();
			if (tasks.length === 0) {
				notifyPass('BIZPROC_USER_PROCESSES_TEMPLATE_PERFORM_GROUP_NO_TASKS');
				return;
			}
			if (!isSingleDecisionSelection(tasks)) {
				this.#startPass(tasks, null);
				return;
			}
			const decision = this.#decisionControl?.decision ?? null;
			if (decision === null) {
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
		#startPass(tasks, decision) {
			this.#isPassStarting = true;
			loadPerformer().then(mechanics => this.#runPass(tasks, decision, mechanics)).catch(error => {
				console.error(error);
				notifyPass('BIZPROC_USER_PROCESSES_TEMPLATE_PERFORM_GROUP_LOAD_FAILED');
			}).finally(() => {
				this.#isPassStarting = false;
			});
		}
		#runPass(tasks, decision, mechanics) {
			this.#passSession = new TaskPassSession(tasks, {
				formOpenTimeout: this.#taskFormOpenTimeout
			});
			this.#passSession.run(decision).then(result => this.#finishPass(tasks, result, mechanics)).catch(response => {
				this.#reportPassFailure(response);
				this.reloadGrid();
			}).finally(() => {
				this.#passSession = null;
			});
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
		#finishPass(tasks, result, mechanics) {
			const performedTaskIds = new Set(result.results.filter(record => record.status === mechanics.TaskOutcomeStatus.Done).map(record => record.taskId));
			if (performedTaskIds.size === 0) {
				return;
			}
			this.#hideRows(tasks.filter(task => performedTaskIds.has(task.id)).map(task => task.workflowId));
			this.reloadGrid();
		}

		/**
		 * A pass that broke off says why. A refusal of the server for a task is answered by the pass itself
		 * with an outcome record, so what reaches here is the pass breaking down: an answer of the client
		 * layer brings the messages of the server, and anything else is a failure only the console can name
		 * - the person still has to be told that the operation ended and nothing is going on any more.
		 */
		#reportPassFailure(response) {
			if (main_core.Type.isArrayFilled(response?.errors)) {
				this.showErrors(response.errors);
				return;
			}
			console.error(response);
			notifyPass('BIZPROC_USER_PROCESSES_TEMPLATE_PERFORM_GROUP_FAILED');
		}
		setTasksStatuses(taskIds, newStatus) {
			// eslint-disable-next-line promise/catch-or-return
			main_core.ajax.runAction('bizproc.task.doInlineTasks', {
				data: {
					taskIds,
					newStatus
				}
			}).catch(response => {
				this.showErrors(response.errors);
				this.reloadGrid();
			})
			// .then(() => this.reloadGrid())
	;
		}
		delegateTasks(taskIds, toUserId) {
			// eslint-disable-next-line promise/catch-or-return
			main_core.ajax.runComponentAction('bitrix:bizproc.user.processes', 'delegateTasks', {
				mode: 'class',
				data: {
					taskIds,
					toUserId
				}
			}).then(() => bizproc_a11y.announce(main_core.Loc.getMessage('BIZPROC_USER_PROCESSES_TEMPLATE_TASKS_DELEGATED'))).catch(response => {
				this.showErrors(response.errors);
				this.reloadGrid();
			})
			// .then(() => this.reloadGrid())
	;
		}
		reloadGrid() {
			this.getGrid()?.reload();
		}
		doTask(props) {
			this.#hideRow(props.workflowId);
			main_core.ajax.runAction('bizproc.task.do', {
				data: props
			}).then(() => {
				if (props.taskName) {
					ui_notification.UI.Notification.Center.notify({
						content: main_core.Loc.getMessage('BIZPROC_USER_PROCESSES_TEMPLATE_TASK_TOUCHED', {
							'#TASK_NAME#': main_core.Text.encode(props.taskName)
						})
					});
				}
			}).catch(response => {
				this.showErrors(response.errors);
				this.#showRow(props.workflowId);
			});
		}
		removeWorkflow(workflowId) {
			if (!this.#shownMobilePopup && this.#workflowTasks.has(workflowId)) {
				const mobile = new BX.UI.MobilePromoter({
					title: main_core.Loc.getMessage('BIZPROC_USER_PROCESSES_POPUP_PUSH_TITLE'),
					content: this.getPopupContent(),
					position: {
						right: 30,
						bottom: 30
					},
					qrContent: this.#appLink,
					analytics: {
						c_section: 'bizproc'
					}
				});
				mobile.show();
				BX.userOptions.save('bizproc.user.processes', 'mobile_promotion_popup', 'shown_popup', 'Y', false);
				this.#shownMobilePopup = true;
			}
			this.#hideRow(workflowId, true);
			this.#deleteWorkflowRendererById(workflowId);
			this.#workflowTasks.delete(workflowId);
		}
		getPopupContent() {
			return main_core.Tag.render`
			<div class="ui-mobile-promoter__content-wrapper">
				<ul class="ui-mobile-promoter__popup-list">
					<li class="ui-mobile-promoter__popup-list-item">
						${main_core.Loc.getMessage('BIZPROC_USER_PROCESSES_POPUP_PUSH_DO_PROCESS')}
					</li>
					<li class="ui-mobile-promoter__popup-list-item">
						${main_core.Loc.getMessage('BIZPROC_USER_PROCESSES_POPUP_PUSH_REACT')}
					</li>
					<li class="ui-mobile-promoter__popup-list-item">
						${main_core.Loc.getMessage('BIZPROC_USER_PROCESSES_POPUP_PUSH_CONTROL')}
					</li>
				</ul>
				<div class="ui-mobile-promoter__popup-desc">${main_core.Loc.getMessage('UI_MOBILE_PROMOTER_DESC')}</div>
				<div class="ui-mobile-promoter__popup-info">${main_core.Loc.getMessage('UI_MOBILE_PROMOTER_INFO')}</div>
			</div>
		`;
		}
		getGrid() {
			if (this.gridId) {
				return BX.Main.gridManager?.getInstanceById(this.gridId);
			}

			// eslint-disable-next-line no-console
			console.warn('Grid not found');
			return null;
		}
		#createWorkflowRenderer(workflowId, workflow) {
			this.#workflowRenderer[workflowId] = new WorkflowRenderer({
				userProcesses: this,
				currentUserId: this.currentUserId,
				workflow
			});
			return this.#workflowRenderer[workflowId];
		}
		#getWorkflowRendererById(workflowId) {
			return main_core.Type.isNil(this.#workflowRenderer[workflowId]) ? null : this.#workflowRenderer[workflowId];
		}
		#deleteWorkflowRendererById(workflowId) {
			const renderer = this.#getWorkflowRendererById(workflowId);
			if (renderer) {
				renderer.destroy();
				delete this.#workflowRenderer[workflowId];
			}
		}
		#hideRow(id, remove = false) {
			const grid = this.getGrid();
			const row = grid?.getRows().getById(id);
			if (row) {
				row.hide();
				if (remove) {
					main_core.Dom.remove(row.getNode());
				}
				this.#showStubOnEmptyGrid(grid);
			}
		}

		/**
		 * Hides several rows at once. Whether anything is left on the screen is a question about the grid
		 * and not about a row, so it is asked once after the last row and not on every one of them: the
		 * count of shown rows walks all the rows of the grid.
		 */
		#hideRows(ids) {
			const grid = this.getGrid();
			if (!grid) {
				return;
			}
			ids.forEach(id => grid.getRows().getById(id)?.hide());
			this.#showStubOnEmptyGrid(grid);
		}
		#showStubOnEmptyGrid(grid) {
			if (grid.getRows().getCountDisplayed() === 0) {
				grid.getRealtime().showStub();
			}
		}
		#showRow(id) {
			const row = this.getGrid()?.getRows().getById(id);
			if (row) {
				row.show();
				main_core.Dom.addClass(row.getNode(), 'main-ui-grid-show-new-row');
				main_core.Event.bind(row.getNode(), 'animationend', event => {
					if (event.animationName === 'showNewRow') {
						main_core.Dom.removeClass(row.getNode(), 'main-ui-grid-show-new-row');
					}
				});
			}
		}
	}

	exports.UserProcesses = UserProcesses;

})(this.BX.Bizproc.Component = this.BX.Bizproc.Component || {}, BX, BX.UI, BX.UI.EntitySelector, BX.Main, BX.Bizproc.A11y, BX.Bizproc, BX.Bizproc, BX.Bizproc, BX.UI, BX.Bizproc.Workflow, BX.Bizproc.Workflow.Faces, BX.Bizproc.Workflow.Result, BX.UI, BX.UI.Notification);
//# sourceMappingURL=script.js.map
