/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, ui_buttons, ui_system_dialog, ui_system_illustration, ui_system_typography, main_popup, bizproc_a11y, ui_system_checkbox, ui_notification, main_core_events) {
	'use strict';

	/**
	 * DTO-01 vocabulary - the outcome of a group action for a single task. Lives apart from the public
	 * surface so the queue, the service and the notifier share it without importing the entry point.
	 */
	const TaskOutcomeStatus = Object.freeze({
		Done: 'done',
		NotFound: 'not_found',
		AccessDenied: 'access_denied',
		Error: 'error'
	});

	/** One record per task passed to the group action. */

	/**
	 * The part of a task description (DTO-02) the rules read: which task it is, whether it is performed
	 * without a form, and the hash that tells apart the tasks one decision may be repeated for. The rest
	 * of a description travels through the rules untouched.
	 */

	/**
	 * What a rule leaves behind: the outcome records the server answered with (DTO-01), the tasks that
	 * left the pass undecided, and whether the person walked out of the pass before its end.
	 */

	function emptyRuleResult() {
		return {
			isInterrupted: false,
			results: [],
			skippedTaskIds: []
		};
	}

	/** Glues what a nested rule did onto what the calling rule has collected so far. */
	function mergeRuleResult(collected, added) {
		return {
			isInterrupted: collected.isInterrupted || added.isInterrupted,
			results: [...collected.results, ...added.results],
			skippedTaskIds: [...collected.skippedTaskIds, ...added.skippedTaskIds]
		};
	}

	/** Identifiers of the tasks as the group action expects them. A task without one is not a task. */
	function toTaskIds(tasks) {
		if (!main_core.Type.isArrayFilled(tasks)) {
			return [];
		}
		return tasks.map(task => Number.parseInt(task?.id, 10)).filter(taskId => Number.isInteger(taskId) && taskId > 0);
	}

	/**
	 * Whether a decision may be repeated for a set of tasks. A task performed without one - and a decision
	 * that stayed in the form it was made in, as one carrying files does - leaves nothing for a set to
	 * repeat, and a set is never performed blindly.
	 */
	function isRepeatableDecision(decision) {
		return main_core.Type.isPlainObject(decision) && Object.keys(decision).length > 0;
	}
	/**
	 * One decision applied to a set of tasks: the whole set travels in a single group call (API-01) and
	 * the counters follow the answer of the server. The rule decides nothing on its own - the decision
	 * comes from whoever made it: the panel item that started the pass, or the task the person has just
	 * gone through.
	 */
	class BatchRule {
		#service;
		#notifier;
		constructor(options) {
			this.#service = options.service;
			this.#notifier = options.notifier;
		}

		/**
		 * A set is performed in one call when every task of it goes without a form and they all carry one
		 * and the same hash. Nothing else needs comparing: the name of the activity is already part of
		 * the hash.
		 *
		 * A task without a hash never joins a set. The server computes the hash only for tasks that still
		 * await a decision, so a missing one says nothing about similarity.
		 */
		static isApplicable(tasks) {
			if (!main_core.Type.isArrayFilled(tasks)) {
				return false;
			}
			const hash = tasks[0]?.hash;
			return main_core.Type.isStringFilled(hash) && tasks.every(task => task?.isInline === true && task.hash === hash);
		}

		/**
		 * @param tasks The set the decision applies to.
		 * @param decision The task request to repeat: the button of the decision (`{ [NAME]: VALUE }`)
		 *   together with the field values sent with it. Sending a set of identifiers grants no rights of
		 *   its own - grouping is a hint of the interface, and the server checks every task on its own.
		 * @param isAnnounced Whether this operation reports its own outcome. An operation that is the
		 *   whole pass leaves the reporting to the summary of the pass - see {@see Notifier.notifyDone}.
		 */
		async run(tasks, decision, isAnnounced = true) {
			const taskIds = toTaskIds(tasks);
			if (taskIds.length === 0) {
				return emptyRuleResult();
			}
			if (!isRepeatableDecision(decision)) {
				this.#notifier.notifySkipped(taskIds.length);
				return {
					isInterrupted: false,
					results: [],
					skippedTaskIds: taskIds
				};
			}
			const {
				results
			} = await this.#service.doCollection(taskIds, decision);
			this.#notifier.notifyDone(results, isAnnounced);
			// a refusal is announced whatever the operation is: an operation that performed nothing has
			// no number for the summary to report, so silence here is silence altogether
			this.#notifier.notifyFailed(results);
			this.#notifier.notifyRemaining();
			return {
				isInterrupted: false,
				results,
				skippedTaskIds: []
			};
		}
	}

	/** What the person answers about a group of tasks similar to the one just performed. */
	const SimilarChoice = Object.freeze({
		ApplyToAll: 'applyToAll',
		OneByOne: 'oneByOne',
		ShowList: 'showList',
		Cancel: 'cancel'
	});

	/** How the person split the group in the list surface: what the decision repeats for, and the rest. */

	/**
	 * The surfaces that ask the person about a group of similar tasks (P2). Both are given the tasks of
	 * the group and answer with the tasks of that same group - a surface adds nothing to the pass.
	 */

	/**
	 * The group of tasks a decision may be repeated for. The rule asks the person what to do with the
	 * group and branches: one decision for the whole group, the group task by task, or a group split in
	 * two by hand.
	 */
	class SimilarRule {
		#notifier;
		#batchRule;
		#oneByOneRule;
		#informer;
		constructor(options) {
			this.#notifier = options.notifier;
			this.#batchRule = options.batchRule;
			this.#oneByOneRule = options.oneByOneRule;
			this.#informer = main_core.Type.isPlainObject(options?.informer) ? options.informer : null;
		}

		/**
		 * @param group The tasks taken out of the queue as similar to the performed one.
		 * @param decision The task request of the performed task - what the group would repeat.
		 */
		async run(group, decision) {
			if (!main_core.Type.isArrayFilled(group)) {
				return emptyRuleResult();
			}
			if (!this.#informer) {
				return this.#skipGroup(group);
			}
			const choice = await this.#informer.askSimilar([...group]);
			if (choice === SimilarChoice.ApplyToAll) {
				return this.#batchRule.run(group, decision);
			}
			if (choice === SimilarChoice.OneByOne) {
				return this.#oneByOneRule.run(group);
			}
			if (choice === SimilarChoice.ShowList) {
				return this.#runByList(group, decision);
			}

			// The person walked out of the pass. An answer that names no known choice ends up here as
			// well: a decision is never repeated for a group on a guess.
			return {
				isInterrupted: true,
				results: [],
				skippedTaskIds: []
			};
		}
		async #runByList(group, decision) {
			const {
				selected,
				rest
			} = splitGroup(group, await this.#informer.askList([...group]));
			const result = await this.#batchRule.run(selected, decision);
			if (result.isInterrupted) {
				return result;
			}
			return mergeRuleResult(result, await this.#oneByOneRule.run(rest));
		}

		/**
		 * There is nobody to ask until the surfaces of P2 appear. Repeating a decision for a group is the
		 * choice of the person, so without that choice the group leaves the pass undecided - it is never
		 * performed on the strength of a matching hash alone.
		 */
		#skipGroup(group) {
			const skippedTaskIds = toTaskIds(group);
			this.#notifier.notifySkipped(skippedTaskIds.length);
			return {
				isInterrupted: false,
				results: [],
				skippedTaskIds
			};
		}
	}

	/**
	 * Keeps the split honest: the decision repeats only for the tasks of the group the surface was given,
	 * and whatever stayed out of the selection goes on task by task. No task of the group is lost on the
	 * way, whatever the surface answered.
	 */
	function splitGroup(group, split) {
		const selectedTasks = new Set(main_core.Type.isArrayFilled(split?.selected) ? split.selected : []);
		return {
			selected: group.filter(task => selectedTasks.has(task)),
			rest: group.filter(task => !selectedTasks.has(task))
		};
	}

	/**
	 * The cross of the layout inside the popup of the dialog. There is no accessor for it either, so it is
	 * reached by the region it lives in: a heading region a dialog has to have, and not a class name of
	 * the design system, which may be renamed without notice.
	 */
	const DIALOG_CLOSE_BUTTON_SELECTOR = 'header button';
	/**
	 * Makes a dialog of the design system keyboard-manageable and announced as a dialog through the
	 * accessibility layer of the module - the way every surface of this layer needs it. The focus has to
	 * stay inside the whole popup, its header and footer included, and not only inside the content we
	 * built, so the popup itself is what all of this is put on.
	 *
	 * The popup is also where the test marker of the surface goes: the buttons of the layout live outside
	 * the content we built, so a test reaches them by the whole popup and not by the content.
	 *
	 * @param options.testId The test marker for the surface as a whole.
	 * @param options.closeTestId The test marker for the cross of the layout, when the dialog has one.
	 */
	function setupDialogA11y(content, options) {
		const container = findPopupContainer(content);
		if (container === null) {
			// without the popup the surface loses its focus trap, its name for a screen reader and the
			// markers a test reaches it by - all three at once and none of it visible on the screen
			console.error('bizproc.task.performer: the popup of the dialog was not found, the dialog stays unmanageable ' + 'from the keyboard', content);
			return null;
		}
		if (main_core.Type.isStringFilled(options.testId)) {
			main_core.Dom.attr(container, 'data-testid', options.testId);
		}
		prepareCloseButton(container, options.closeTestId);
		return bizproc_a11y.setupDialog(container, {
			label: options.label
		});
	}

	/**
	 * The popup the dialog was drawn in. The dialog of the design system gives no accessor for its own
	 * popup, so it is asked of the manager of popups - the public register of them: the popup whose
	 * container holds our content is the popup of our dialog.
	 */
	function findPopupContainer(content) {
		const popup = main_popup.PopupManager.getPopups().find(item => popupContainer(item)?.contains(content) === true);
		return popup ? popupContainer(popup) : null;
	}
	function popupContainer(popup) {
		const container = main_core.Type.isFunction(popup?.getPopupContainer) ? popup.getPopupContainer() : null;
		return main_core.Type.isDomNode(container) ? container : null;
	}

	/**
	 * The dialog renders its cross as an icon-only button and leaves it unnamed, while the title makes
	 * that cross a stop of the Tab order. An existing name is left alone: naming the cross belongs to the
	 * component, and once it does so its own label wins.
	 *
	 * The cross comes from the component too, so its test marker is set from here as well - it is the
	 * only control of the layout that leaves the question unanswered.
	 */
	function prepareCloseButton(container, testId) {
		const closeButton = container.querySelector(DIALOG_CLOSE_BUTTON_SELECTOR);
		if (!closeButton) {
			// a marker is asked for only by a surface whose layout has a cross, so a cross asked for and not
			// found is the markup of the dialog having changed under us
			if (main_core.Type.isStringFilled(testId)) {
				console.error('bizproc.task.performer: the close button of the dialog was not found, it stays unnamed', container);
			}
			return;
		}
		if (main_core.Type.isStringFilled(testId)) {
			main_core.Dom.attr(closeButton, 'data-testid', testId);
		}
		if (!main_core.Type.isStringFilled(main_core.Dom.attr(closeButton, 'aria-label'))) {
			main_core.Dom.attr(closeButton, 'aria-label', main_core.Loc.getMessage('UI_BUTTONS_CLOSE_BTN_TEXT'));
		}
	}

	const MESSAGE_TITLE$2 = 'BIZPROC_JS_TASK_PERFORMER_EXIT_CONFIRM_TITLE';
	const MESSAGE_TEXT = 'BIZPROC_JS_TASK_PERFORMER_EXIT_CONFIRM_TEXT';
	const MESSAGE_EXIT = 'BIZPROC_JS_TASK_PERFORMER_EXIT_CONFIRM_EXIT';
	const MESSAGE_STAY = 'BIZPROC_JS_TASK_PERFORMER_EXIT_CONFIRM_STAY';
	const DIALOG_WIDTH$2 = 470;
	const TEST_ID$2 = {
		dialog: 'bizproc-performer-exit-confirm',
		exit: 'bizproc-performer-exit-confirm-exit',
		stay: 'bizproc-performer-exit-confirm-stay'
	};

	/**
	 * Asks whether the person really leaves the pass: `true` for leaving, `false` for staying. Staying is
	 * the answer of every other way out of the question - Esc, a click outside - so a pass never ends by
	 * an accident of the interface.
	 *
	 * Leaving ends the pass where it stands: the tasks already performed keep their decisions, the ones
	 * behind them stay in the list awaiting theirs. Nothing is rolled back and nothing is decided here -
	 * the surface that asked walks the person back to the very task they were on.
	 */
	function confirmExit() {
		return new Promise(resolve => {
			const title = main_core.Loc.getMessage(MESSAGE_TITLE$2);
			const content = ui_system_typography.Text.render(main_core.Loc.getMessage(MESSAGE_TEXT), {
				size: 'md',
				tag: 'div'
			});
			let isConfirmed = false;
			let a11yDialog = null;
			const dialog = new ui_system_dialog.Dialog({
				title,
				content,
				width: DIALOG_WIDTH$2,
				hasOverlay: true,
				// the question has exactly two answers, and one of them already is "stay": a cross next to
				// them would be a third way of saying the same thing
				hasCloseButton: false,
				leftButtons: [new ui_buttons.Button({
					text: main_core.Loc.getMessage(MESSAGE_EXIT),
					useAirDesign: true,
					size: ui_buttons.ButtonSize.LARGE,
					style: ui_buttons.AirButtonStyle.FILLED,
					dataset: {
						testid: TEST_ID$2.exit
					},
					onclick: () => {
						isConfirmed = true;
						dialog.hide();
					}
				}), new ui_buttons.Button({
					text: main_core.Loc.getMessage(MESSAGE_STAY),
					useAirDesign: true,
					size: ui_buttons.ButtonSize.LARGE,
					style: ui_buttons.AirButtonStyle.PLAIN,
					// staying is the safe answer, so the keyboard starts on it
					dataset: {
						testid: TEST_ID$2.stay,
						autofocus: ''
					},
					onclick: () => {
						dialog.hide();
					}
				})],
				events: {
					onAfterShow: () => {
						a11yDialog = setupDialogA11y(content, {
							label: title,
							testId: TEST_ID$2.dialog
						});
					},
					onHide: () => {
						// the answer goes out first: a throw while tearing the trap down would otherwise
						// leave the pass waiting for an answer that never comes
						resolve(isConfirmed);
						a11yDialog?.destroy();
					}
				}
			});
			dialog.show();
		});
	}

	const MESSAGE_TITLE$1 = 'BIZPROC_JS_TASK_PERFORMER_SIMILAR_LIST_TITLE';
	const MESSAGE_APPLY = 'BIZPROC_JS_TASK_PERFORMER_SIMILAR_LIST_APPLY';
	const MESSAGE_ONE_BY_ONE$1 = 'BIZPROC_JS_TASK_PERFORMER_SIMILAR_LIST_ONE_BY_ONE';
	const MESSAGE_TASK = 'BIZPROC_JS_TASK_PERFORMER_SIMILAR_LIST_TASK';
	const DIALOG_WIDTH$1 = 560;
	const TEST_ID$1 = {
		dialog: 'bizproc-performer-similar-list',
		row: 'bizproc-performer-similar-list-row',
		name: 'bizproc-performer-similar-list-name',
		mark: 'bizproc-performer-similar-list-mark',
		apply: 'bizproc-performer-similar-list-apply',
		oneByOne: 'bizproc-performer-similar-list-one-by-one',
		close: 'bizproc-performer-similar-list-close'
	};

	/**
	 * A task of the group as the surfaces of the informer layer read it: everything a rule tells the
	 * tasks apart by, plus the fields the person is shown. The mechanics hands the surfaces the whole row
	 * description (DTO-02), so a surface reads more of a task than a rule does - but never more than the
	 * row really has, hence the display fields are optional here.
	 */

	/**
	 * The tasks of the group with a mark on each: the person leaves marked the tasks the decision repeats
	 * for and sends the rest to be opened one by one. Answers with the group split in two - the surface
	 * adds no task to the pass and loses none of the ones it was given.
	 *
	 * Closing the list without choosing is not a decision about the group: it goes on task by task, so
	 * nothing is performed on the strength of marks the person never confirmed.
	 */
	class SimilarList {
		#tasks;
		#markedTasks;
		#dialog = null;
		#applyButton = null;
		#a11yDialog = null;
		#split = null;
		#resolve = null;

		/**
		 * @param group The tasks of the group, in the order of the rows of the list.
		 */
		static ask(group) {
			return new SimilarList(group).#ask();
		}
		constructor(group) {
			this.#tasks = main_core.Type.isArray(group) ? group.filter(task => main_core.Type.isPlainObject(task)) : [];
			// one decision for the whole group is the frequent case, so the group starts fully marked
			this.#markedTasks = new Set(this.#tasks);
		}
		#ask() {
			if (this.#tasks.length === 0) {
				return Promise.resolve({
					selected: [],
					rest: []
				});
			}
			return new Promise(resolve => {
				this.#resolve = resolve;
				this.#dialog = this.#createDialog();
				this.#dialog.show();
			});
		}
		#createDialog() {
			const title = main_core.Loc.getMessage(MESSAGE_TITLE$1);
			this.#applyButton = new ui_buttons.Button({
				text: main_core.Loc.getMessage(MESSAGE_APPLY),
				useAirDesign: true,
				size: ui_buttons.ButtonSize.LARGE,
				style: ui_buttons.AirButtonStyle.FILLED,
				dataset: {
					testid: TEST_ID$1.apply,
					autofocus: ''
				},
				onclick: () => {
					this.#close(this.#splitByMarks());
				}
			});
			const content = this.#renderList();
			return new ui_system_dialog.Dialog({
				title,
				content,
				width: DIALOG_WIDTH$1,
				hasOverlay: true,
				leftButtons: [this.#applyButton, new ui_buttons.Button({
					text: main_core.Loc.getMessage(MESSAGE_ONE_BY_ONE$1),
					useAirDesign: true,
					size: ui_buttons.ButtonSize.LARGE,
					style: ui_buttons.AirButtonStyle.PLAIN,
					dataset: {
						testid: TEST_ID$1.oneByOne
					},
					onclick: () => {
						this.#close(this.#oneByOneSplit());
					}
				})],
				events: {
					onAfterShow: () => {
						this.#a11yDialog = setupDialogA11y(content, {
							label: title,
							testId: TEST_ID$1.dialog,
							closeTestId: TEST_ID$1.close
						});
					},
					onHide: () => {
						// the answer goes out first: a throw while tearing the trap down would otherwise
						// leave the pass waiting for an answer that never comes
						this.#resolve?.(this.#split ?? this.#oneByOneSplit());
						this.#a11yDialog?.destroy();
					}
				}
			});
		}

		/**
		 * The tasks of the group are a list, and saying so is what gives the person the place of a row in
		 * it: with the rows of one group named alike, the position is what tells them apart by ear.
		 */
		#renderList() {
			const list = main_core.Tag.render`<div class="bizproc-task-performer-similar-list" role="list"></div>`;
			this.#tasks.forEach(task => {
				main_core.Dom.append(this.#renderRow(task), list);
			});
			return list;
		}
		#renderRow(task) {
			const mark = new ui_system_checkbox.Checkbox({
				size: ui_system_checkbox.CheckboxSize.Md,
				checked: this.#markedTasks.has(task),
				attributes: {
					'aria-label': markLabel(task),
					'data-testid': TEST_ID$1.mark
				},
				onChange: ({
					checked
				}) => {
					this.#markTask(task, checked);
				}
			});
			const row = main_core.Tag.render`
			<div class="bizproc-task-performer-similar-list__row" role="listitem" data-testid="${TEST_ID$1.row}">
				${mark.render()}
				<div class="bizproc-task-performer-similar-list__text">
					${renderName(task)}
					${renderDescription(task)}
				</div>
			</div>
		`;

			// the type of a task is the name of its activity - technical, so it stays a mark of the row
			// for whoever reads the DOM instead of becoming text in front of the person
			if (main_core.Type.isStringFilled(task.activity)) {
				main_core.Dom.attr(row, 'data-activity', task.activity);
			}
			return row;
		}
		#markTask(task, isMarked) {
			if (isMarked) {
				this.#markedTasks.add(task);
			} else {
				this.#markedTasks.delete(task);
			}

			// with nothing marked the decision has nothing to repeat for, and the group goes task by task
			this.#applyButton?.setDisabled(this.#markedTasks.size === 0);
		}
		#splitByMarks() {
			return {
				selected: this.#tasks.filter(task => this.#markedTasks.has(task)),
				rest: this.#tasks.filter(task => !this.#markedTasks.has(task))
			};
		}
		#oneByOneSplit() {
			return {
				selected: [],
				rest: [...this.#tasks]
			};
		}
		#close(split) {
			this.#split = split;
			this.#dialog?.hide();
		}
	}

	/**
	 * The name of the task as the surfaces of this layer give it: decoded (DTO-02) and put into the DOM
	 * as text, never as markup. A task the list left without a name is still a task of the group, so it
	 * keeps a name to be marked by and to be named by in front of the person.
	 */
	function taskName(task) {
		return main_core.Type.isStringFilled(task.name) ? task.name : main_core.Loc.getMessage(MESSAGE_TASK);
	}

	/**
	 * The name the mark of a row is read by. The tasks of one group carry one and the same name - that is
	 * what makes them a group - so the name alone tells no row from another: the mark is named by
	 * everything the row shows the person.
	 */
	function markLabel(task) {
		const name = taskName(task);
		return main_core.Type.isStringFilled(task.description) ? `${name}. ${task.description}` : name;
	}
	function renderName(task) {
		const name = ui_system_typography.Text.render(taskName(task), {
			tag: 'div',
			size: 'md',
			accent: true,
			wrap: 'truncate',
			className: 'bizproc-task-performer-similar-list__name'
		});
		main_core.Dom.attr(name, 'data-testid', TEST_ID$1.name);
		return name;
	}

	/**
	 * The description of the task comes raw from the row (`~DESCRIPTION`), unlike the description of the
	 * process, which the server already hands over as safe markup. `Text.render` puts the value into
	 * `textContent`, and that is where the encoding of both fields happens: the row never interpolates
	 * them into markup.
	 */
	function renderDescription(task) {
		if (!main_core.Type.isStringFilled(task.description)) {
			return '';
		}
		return ui_system_typography.Text.render(task.description, {
			tag: 'div',
			size: 'sm',
			wrap: 'truncate',
			className: 'bizproc-task-performer-similar-list__description'
		});
	}

	const MESSAGE_TITLE = 'BIZPROC_JS_TASK_PERFORMER_SIMILAR_TITLE';
	const MESSAGE_COUNT = 'BIZPROC_JS_TASK_PERFORMER_SIMILAR_COUNT';
	const MESSAGE_HINT = 'BIZPROC_JS_TASK_PERFORMER_SIMILAR_HINT';
	const MESSAGE_APPLY_TO_ALL = 'BIZPROC_JS_TASK_PERFORMER_SIMILAR_APPLY_TO_ALL';
	const MESSAGE_ONE_BY_ONE = 'BIZPROC_JS_TASK_PERFORMER_SIMILAR_ONE_BY_ONE';
	const MESSAGE_SHOW_LIST = 'BIZPROC_JS_TASK_PERFORMER_SIMILAR_SHOW_LIST';
	const TEST_ID = {
		dialog: 'bizproc-performer-similar-informer',
		name: 'bizproc-performer-similar-name',
		count: 'bizproc-performer-similar-count',
		applyToAll: 'bizproc-performer-similar-apply-to-all',
		oneByOne: 'bizproc-performer-similar-one-by-one',
		showList: 'bizproc-performer-similar-show-list',
		close: 'bizproc-performer-similar-close'
	};
	const DIALOG_WIDTH = 480;
	const ILLUSTRATION_SIZE = 128;

	/**
	 * Tells the person that the task just performed is not the only one of its kind and asks what to do
	 * with the rest: repeat the decision for the whole group, go through the group task by task, or look
	 * at the group first and split it by hand.
	 *
	 * Closing the dialog is a request to leave the pass rather than an answer about the group: it is
	 * confirmed apart, and a confirmed one comes back as {@see SimilarChoice.Cancel} for the rule to end
	 * the pass by. Staying brings the question back - nothing about the group is decided behind the
	 * person's back.
	 *
	 * @param group The tasks similar to the performed one, the performed one excluded.
	 */
	async function askSimilar(group) {
		const tasks = main_core.Type.isArray(group) ? group.filter(task => main_core.Type.isPlainObject(task)) : [];

		// nothing to repeat a decision for, so there is nothing to ask about either
		return tasks.length > 0 ? askUntilAnswered(tasks) : SimilarChoice.OneByOne;
	}

	/**
	 * The dialog of the design system builds its popup as a single show, so staying in the pass brings the
	 * question back as a new dialog instead of reopening the closed one.
	 */
	async function askUntilAnswered(tasks) {
		for (;;) {
			// eslint-disable-next-line no-await-in-loop
			const choice = await showPrompt(tasks);
			if (choice) {
				return choice;
			}

			// `confirmExit` is a dialog of the design system, not the native `confirm`
			// eslint-disable-next-line no-await-in-loop, @bitrix24/bitrix24-rules/no-native-dialogs
			const isLeaving = await confirmExit();
			if (isLeaving) {
				return SimilarChoice.Cancel;
			}
		}
	}

	/**
	 * Shows the question once and answers with the choice of the person, or with nothing at all when the
	 * dialog was closed - by the cross, by Esc or by a click outside.
	 */
	function showPrompt(tasks) {
		return new Promise(resolve => {
			const title = main_core.Loc.getMessage(MESSAGE_TITLE);
			let choice = null;
			let a11yDialog = null;
			let dialog = null;
			const chooseAndClose = chosen => {
				choice = chosen;
				dialog?.hide();
			};
			const content = renderContent(tasks, () => chooseAndClose(SimilarChoice.ShowList));
			dialog = new ui_system_dialog.Dialog({
				title,
				content,
				width: DIALOG_WIDTH,
				hasOverlay: true,
				leftButtons: [createChoiceButton({
					message: MESSAGE_APPLY_TO_ALL,
					style: ui_buttons.AirButtonStyle.FILLED,
					testId: TEST_ID.applyToAll,
					// the person came here from a decision, so the keyboard starts on repeating it
					isDefault: true,
					onclick: () => chooseAndClose(SimilarChoice.ApplyToAll)
				}), createChoiceButton({
					message: MESSAGE_ONE_BY_ONE,
					style: ui_buttons.AirButtonStyle.PLAIN,
					testId: TEST_ID.oneByOne,
					onclick: () => chooseAndClose(SimilarChoice.OneByOne)
				})],
				events: {
					onAfterShow: () => {
						a11yDialog = setupDialogA11y(content, {
							label: title,
							testId: TEST_ID.dialog,
							closeTestId: TEST_ID.close
						});
					},
					onHide: () => {
						// the answer goes out first: a throw while tearing the trap down would otherwise
						// leave the pass waiting for an answer that never comes
						resolve(choice);
						a11yDialog?.destroy();
					}
				}
			});
			dialog.show();
		});
	}

	/**
	 * The two decisions about the group stay in the footer, and looking at the group first lives in the
	 * content: three buttons of the layout in one row do not fit the width of the dialog - the row scrolls
	 * sideways and the last of them is cut off. Where it stands also says what it is: an answer about the
	 * group is a decision, looking at it first is not.
	 */
	function renderContent(tasks, onShowList) {
		const illustration = new ui_system_illustration.Illustration({
			name: ui_system_illustration.IllustrationName.DOCUMENTS_STACK,
			size: ILLUSTRATION_SIZE
		});
		return main_core.Tag.render`
		<div class="bizproc-task-performer-similar-informer">
			${illustration.render()}
			${renderGroupName(tasks)}
			${renderGroupCount(tasks.length)}
			${renderHint()}
			${renderShowList(onShowList)}
		</div>
	`;
	}
	function renderShowList(onShowList) {
		const button = createChoiceButton({
			message: MESSAGE_SHOW_LIST,
			style: ui_buttons.AirButtonStyle.PLAIN_ACCENT,
			testId: TEST_ID.showList,
			onclick: onShowList
		});
		return main_core.Tag.render`
		<div class="bizproc-task-performer-similar-informer__show-list">${button.render()}</div>
	`;
	}

	/**
	 * The group is named by the name of its tasks: the tasks of one group share a hash, and with it the
	 * name the person reads. The technical name of the activity names no group in front of anyone, so it
	 * stays out of the text.
	 *
	 * The name comes from the row of the list (DTO-02) and lands in `textContent`, which is where it gets
	 * encoded - it is never interpolated into markup.
	 */
	function renderGroupName(tasks) {
		const name = ui_system_typography.Text.render(taskName(tasks[0]), {
			tag: 'div',
			size: 'lg',
			accent: true,
			align: 'center',
			className: 'bizproc-task-performer-similar-informer__name'
		});
		main_core.Dom.attr(name, 'data-testid', TEST_ID.name);
		return name;
	}
	function renderGroupCount(count) {
		const counter = ui_system_typography.Text.render(main_core.Loc.getMessagePlural(MESSAGE_COUNT, count, {
			'#COUNT#': count
		}), {
			tag: 'div',
			size: 'md',
			align: 'center',
			className: 'bizproc-task-performer-similar-informer__count'
		});
		main_core.Dom.attr(counter, 'data-testid', TEST_ID.count);
		return counter;
	}
	function renderHint() {
		return ui_system_typography.Text.render(main_core.Loc.getMessage(MESSAGE_HINT), {
			tag: 'div',
			size: 'sm',
			align: 'center',
			className: 'bizproc-task-performer-similar-informer__hint'
		});
	}
	function createChoiceButton(options) {
		const dataset = {
			testid: options.testId
		};
		if (options.isDefault === true) {
			dataset.autofocus = '';
		}
		return new ui_buttons.Button({
			text: main_core.Loc.getMessage(options.message),
			useAirDesign: true,
			size: ui_buttons.ButtonSize.LARGE,
			style: options.style,
			dataset,
			onclick: options.onclick
		});
	}

	const MESSAGE_DONE = 'BIZPROC_JS_TASK_PERFORMER_NOTIFIER_DONE';
	const MESSAGE_SKIPPED = 'BIZPROC_JS_TASK_PERFORMER_NOTIFIER_SKIPPED';
	const MESSAGE_REMAINING = 'BIZPROC_JS_TASK_PERFORMER_NOTIFIER_REMAINING';
	const MESSAGE_SUMMARY = 'BIZPROC_JS_TASK_PERFORMER_NOTIFIER_SUMMARY';
	const MESSAGE_SUMMARY_NONE = 'BIZPROC_JS_TASK_PERFORMER_NOTIFIER_SUMMARY_NONE';
	const MESSAGE_SUMMARY_INTERRUPTED = 'BIZPROC_JS_TASK_PERFORMER_NOTIFIER_SUMMARY_INTERRUPTED';
	const MESSAGE_SUMMARY_INTERRUPTED_NONE = 'BIZPROC_JS_TASK_PERFORMER_NOTIFIER_SUMMARY_INTERRUPTED_NONE';
	const MESSAGE_REQUEST_ERROR = 'BIZPROC_JS_TASK_PERFORMER_REQUEST_ERROR';

	/** The outcomes that stand for a task the server refused to perform. */
	const FAILED_STATUSES = new Set([TaskOutcomeStatus.Error, TaskOutcomeStatus.AccessDenied]);
	/**
	 * Turns outcome records into messages about how the pass goes: done, skipped, left to do, and the
	 * result of the whole operation. Keeps the counters of the pass and nothing else - it neither sends
	 * requests nor knows what a task looks like.
	 */
	class Notifier {
		#total;
		#doneCount = 0;
		#processedCount = 0;
		#notify;
		#speak;

		/**
		 * @param options.total How many tasks the pass started with.
		 * @param options.notify Replaces the notification center in tests.
		 * @param options.speak Replaces the live region of the accessibility layer in tests.
		 */
		constructor(options) {
			this.#total = toCount(options?.total);
			this.#notify = main_core.Type.isFunction(options?.notify) ? options.notify : defaultNotify;
			this.#speak = main_core.Type.isFunction(options?.speak) ? options.speak : bizproc_a11y.announce;
		}

		/** Tasks the server reported as done. Never an optimistic guess. */
		get doneCount() {
			return this.#doneCount;
		}
		get remainingCount() {
			return Math.max(this.#total - this.#processedCount, 0);
		}

		/**
		 * Registers the outcome records of one request (DTO-01) and reports the tasks that are done.
		 * Every record ends a task's part in the pass - the server has already answered for it, whether
		 * it went through, was denied or is gone. A task the server no longer finds gets no message of
		 * its own: nobody decided anything about it, it just left the list.
		 *
		 * @param isAnnounced Whether the tasks done by this request are worth a message of their own. An
		 *   operation that is the whole pass is not: the summary of the pass says the very same thing, and
		 *   the person would read one number twice. The counters are kept either way.
		 */
		notifyDone(outcomes, isAnnounced = true) {
			const records = main_core.Type.isArrayFilled(outcomes) ? outcomes : [];
			const doneCount = records.filter(record => record?.status === TaskOutcomeStatus.Done).length;
			this.#doneCount += doneCount;
			this.#processedCount += records.length;
			if (doneCount > 0 && isAnnounced) {
				this.#notifyPlural(MESSAGE_DONE, doneCount);
			}
		}

		/**
		 * The tasks the server refused, in one message. A refusal is not an error of the request - the
		 * request itself succeeded - so without this the whole group stays silent: nothing is performed
		 * and nothing is said, and the person is left to guess whether anything happened at all.
		 *
		 * The reason comes from the server, which names it in full (a required value of the form left
		 * empty, say). One message per request is enough: the tasks of a group are refused for one and
		 * the same reason, and a refusal per task would bury it.
		 *
		 * A task the server no longer finds is not a refusal and stays silent here as well: nobody
		 * decided anything about it.
		 */
		notifyFailed(outcomes) {
			const records = main_core.Type.isArrayFilled(outcomes) ? outcomes : [];
			const failed = records.filter(record => FAILED_STATUSES.has(record?.status));
			if (failed.length === 0) {
				return;
			}
			this.#report(firstErrorMessage(failed) ?? main_core.Loc.getMessage(MESSAGE_REQUEST_ERROR));
		}

		/**
		 * Tasks the person left undecided - closed the form, walked away from the task. Server outcomes
		 * `not_found` add up here too, through {@see notifyDone}.
		 */
		notifySkipped(count = 1) {
			const skippedCount = toCount(count);
			if (skippedCount === 0) {
				return;
			}
			this.#processedCount += skippedCount;
			this.#notifyPlural(MESSAGE_SKIPPED, skippedCount);
		}

		/** How much of the pass is still ahead. Silent once nothing is left. */
		notifyRemaining() {
			const {
				remainingCount
			} = this;
			if (remainingCount > 0) {
				this.#notifyPlural(MESSAGE_REMAINING, remainingCount);
			}
		}

		/**
		 * The result of the operation. Shown in every ending, including the one where not a single task
		 * went through.
		 *
		 * @param isInterrupted The person left the pass before it reached the end of the queue.
		 */
		notifySummary(isInterrupted = false) {
			if (this.#doneCount === 0) {
				this.#report(main_core.Loc.getMessage(isInterrupted ? MESSAGE_SUMMARY_INTERRUPTED_NONE : MESSAGE_SUMMARY_NONE));
				return;
			}
			this.#notifyPlural(isInterrupted ? MESSAGE_SUMMARY_INTERRUPTED : MESSAGE_SUMMARY, this.#doneCount, {
				'#TOTAL#': this.#total
			});
		}
		#notifyPlural(messageCode, count, replacements = {}) {
			this.#report(main_core.Loc.getMessagePlural(messageCode, count, {
				...replacements,
				'#COUNT#': count
			}));
		}

		/**
		 * Says the message both ways. The balloon of the notification center carries no live region, so how
		 * the pass goes and how it ended would otherwise reach the screen only - and every one of these
		 * messages is the whole answer of the operation to the person who started it.
		 */
		#report(content) {
			this.#notify(content);
			this.#speak(content);
		}
	}

	/** The reason the server gave, taken from the first record that carries one. */
	function firstErrorMessage(outcomes) {
		for (const outcome of outcomes) {
			const message = outcome.errors?.find(error => main_core.Type.isStringFilled(error?.message))?.message;
			if (main_core.Type.isStringFilled(message)) {
				return message;
			}
		}
		return null;
	}
	function defaultNotify(content) {
		// the balloon renders a string as HTML, and the reason of a refusal is text the server gave
		ui_notification.UI.Notification.Center.notify({
			content: main_core.Text.encode(content)
		});
	}
	function toCount(value) {
		const count = Number.parseInt(value, 10);
		return Number.isInteger(count) && count > 0 ? count : 0;
	}

	/** EVENT-01 - how the form of a task asks the owner of the queue what comes next. */
	const NextTaskMessage = Object.freeze({
		Request: 'bp-performer-next-task-request',
		Response: 'bp-performer-next-task-response'
	});
	const SIDE_PANEL_MESSAGE_EVENT = 'SidePanel.Slider:onMessage';

	/**
	 * The answer of EVENT-01: the task the pass goes on with, addressed by its process. `taskId: null`
	 * says the queue is over.
	 */

	/** Where the channel takes the answer from. Nothing answered means the queue is over. */

	/**
	 * Whether the performed task the request names belongs to the pass at all. The supplier answers
	 * nothing both for a task of the pass whose successor is not known yet and for a task the pass never
	 * handed out, and only the first of them is a question this channel may answer.
	 */

	/**
	 * The side panel bus as the channel uses it. Tests put their own in, and a bus of a test delivers a
	 * message the way this one does: wrapped, as the manager of side panels wraps it.
	 */

	/**
	 * Tells the form of a task which task of the queue goes next (EVENT-01).
	 *
	 * The exchange is two messages of the side panel bus, both delivered to the window that opened the
	 * form: the request comes in while the form waits for it, the answer goes back on the same bus. Two
	 * messages and not a field filled in the request: the bus delivers within one tick, but leaning on a
	 * mutated request object is a contract nobody can see.
	 *
	 * With nobody listening there is no answer at all, and a form without an answer keeps to its own
	 * behaviour - the pass never hangs on a window that is not there.
	 */
	class NextTaskChannel {
		#nextTask;
		#isOwnTask;
		#bus;
		#isListening = false;

		/**
		 * @param options.nextTask Answers with the next task of the queue, or with nothing once it is over.
		 * @param options.isOwnTask Tells whether the performed task of a request belongs to the pass. Left
		 *   out, every request is taken as one of the pass - which is what a caller owning no queue means.
		 * @param options.bus Replaces the side panel bus in tests.
		 */
		constructor(options) {
			this.#nextTask = main_core.Type.isFunction(options?.nextTask) ? options.nextTask : () => null;
			this.#isOwnTask = main_core.Type.isFunction(options?.isOwnTask) ? options.isOwnTask : () => true;
			this.#bus = main_core.Type.isPlainObject(options?.bus) ? options.bus : sidePanelBus;
		}
		subscribe() {
			if (this.#isListening) {
				return;
			}
			this.#bus.subscribe(SIDE_PANEL_MESSAGE_EVENT, this.#handleMessage);
			this.#isListening = true;
		}
		unsubscribe() {
			if (!this.#isListening) {
				return;
			}
			this.#bus.unsubscribe(SIDE_PANEL_MESSAGE_EVENT, this.#handleMessage);
			this.#isListening = false;
		}

		/**
		 * A request that names no performed task, and a request from no form at all, is left without an
		 * answer: the queue answers about a task of the pass, and a malformed request names none.
		 *
		 * A request about a task of no pass of ours is left without an answer as well, and it has to be:
		 * an answer of any kind - the end of the queue included - tells the form it belongs to a pass, and
		 * a form outside a pass would then keep itself open to draw a next task nobody asked it for.
		 */
		#handleMessage = event => {
			const message = readSidePanelMessage(event);
			if (readEventId(message) !== NextTaskMessage.Request) {
				return;
			}
			const finishedTaskId = main_core.Text.toInteger(readEventData(message)?.finishedTaskId);
			const sender = main_core.Type.isFunction(message?.getSender) ? message.getSender() : null;
			if (finishedTaskId <= 0 || !sender || !this.#isOwnTask(finishedTaskId)) {
				return;
			}
			this.#bus.post(sender, NextTaskMessage.Response, this.#answer(finishedTaskId));
		};
		#answer(finishedTaskId) {
			const task = this.#nextTask(finishedTaskId);
			const taskId = main_core.Text.toInteger(task?.id);
			return {
				taskId: taskId > 0 ? taskId : null,
				workflowId: main_core.Type.isStringFilled(task?.workflowId) ? task.workflowId : null
			};
		}
	}
	const sidePanelBus = {
		subscribe: (eventName, handler) => main_core_events.EventEmitter.subscribe(eventName, handler),
		unsubscribe: (eventName, handler) => main_core_events.EventEmitter.unsubscribe(eventName, handler),
		post: (sender, eventId, data) => BX.SidePanel.Instance.postMessage(sender, eventId, data)
	};

	/**
	 * The message of the side panel out of what the bus handed over. The bus hands over a wrapper -
	 * `new BaseEvent({ data: [message], compatData: [message] })` - and the wrapper itself carries
	 * neither the identifier of the message, nor its data, nor its sender.
	 */
	function readSidePanelMessage(event) {
		const compatData = main_core.Type.isFunction(event?.getCompatData) ? event.getCompatData() : null;
		return main_core.Type.isArrayFilled(compatData) ? compatData[0] : null;
	}
	function readEventId(message) {
		return main_core.Type.isFunction(message?.getEventId) ? message.getEventId() : null;
	}
	function readEventData(message) {
		const data = main_core.Type.isFunction(message?.getData) ? message.getData() : null;
		return main_core.Type.isPlainObject(data) ? data : null;
	}

	/**
	 * What the queue reads of a task (DTO-02). Everything else in a task description travels through
	 * the queue untouched.
	 *
	 * `workflowId` is the process the task belongs to - the address the next task of the pass is named
	 * by (EVENT-01). The server description of a task carries no process: a row of the list of processes
	 * is a process, so the list itself puts it into the item when it builds the queue out of a selection.
	 */

	/**
	 * A snapshot of the selection. The order repeats the order of the list rows, tasks leave one by one,
	 * and a group of similar ones is taken out as a whole to be handled right after the task that opened
	 * it. The snapshot is never refreshed: the queue knows nothing about the grid, and a snapshot that
	 * has drifted from reality is settled by the server, which answers `not_found` for a task that is gone.
	 */
	class TaskQueue {
		#items;

		// The task the queue last handed out - the one the pass stands on. The queue is asked what comes
		// after it (EVENT-01), and it answers by the same condition the group of similar tasks is taken out
		// by, so the rule and the answer never say different things.
		#handedOut = null;
		constructor(tasks) {
			this.#items = main_core.Type.isArrayFilled(tasks) ? tasks.filter(task => main_core.Type.isPlainObject(task)) : [];
		}
		get size() {
			return this.#items.length;
		}
		get isEmpty() {
			return this.#items.length === 0;
		}

		/** The tasks still queued, in queue order. A copy: walking them must not move the queue itself. */
		get items() {
			return [...this.#items];
		}

		/** The next task of the pass, or null once the queue is empty. */
		shift() {
			this.#handedOut = this.#items.shift() ?? null;
			return this.#handedOut;
		}

		/**
		 * Whether the task is the one the queue last handed out - the task the pass stands on. Only about
		 * such a task does the queue have anything to say at all: `peekAfter` answers nothing both for it
		 * and for a task of no pass of ours, and whoever asks has to tell the two apart ({@see peekAfter}).
		 */
		isHandedOut(taskId) {
			const handedOut = this.#handedOut;
			return handedOut !== null && main_core.Text.toInteger(handedOut.id) === main_core.Text.toInteger(taskId);
		}

		/**
		 * What the queue offers after the task it last handed out (EVENT-01). The head of the queue is only
		 * looked at - the task leaves the queue when the rule that walks it takes it, and taking it here
		 * would spend the task twice.
		 *
		 * Nothing is offered while the queue still holds a task like the one handed out: the decision about
		 * to be made on it may be repeated for the tasks like it ({@see extractByHash}), and until that
		 * question is answered which task comes next is unknown. The form would draw a task the group is
		 * about to perform, and the person would be shown a form that means nothing - closing it does
		 * nothing, deciding in it sends a decision for a task already decided.
		 *
		 * A task the queue did not hand out is answered about with nothing either - it is no task of this
		 * pass, or a task of a group being walked one by one, which the pass opens itself, the way it opens
		 * its first task. That case is not the end of the queue and is told apart by `isHandedOut`.
		 */
		peekAfter(finishedTaskId) {
			const handedOut = this.#handedOut;
			if (handedOut === null || !this.isHandedOut(finishedTaskId)) {
				return null;
			}
			if (main_core.Type.isStringFilled(handedOut.hash) && this.#items.some(task => task.hash === handedOut.hash)) {
				return null;
			}
			return this.#items[0] ?? null;
		}

		/**
		 * Takes every queued task with the same hash out of the queue, keeping their order.
		 *
		 * An empty hash groups nothing: the server computes the hash only for tasks that still await a
		 * decision, so a finished one arrives without it and goes through the pass on its own.
		 */
		extractByHash(hash) {
			if (!main_core.Type.isStringFilled(hash)) {
				return [];
			}
			const extracted = [];
			const rest = [];
			for (const task of this.#items) {
				if (task.hash === hash) {
					extracted.push(task);
				} else {
					rest.push(task);
				}
			}
			this.#items = rest;
			return extracted;
		}
	}

	/** How one task ends for the person who was taken through it. */
	const TaskPassStatus = Object.freeze({
		Done: 'done',
		Skipped: 'skipped',
		Exit: 'exit'
	});

	/**
	 * The answer of the surface that opens a task and brings back the decision of the person
	 * (EVENT-01 / EVENT-02, P3).
	 *
	 * `decision` is the task request that has already gone to the server - this is what a group of
	 * similar tasks repeats. `outcome` is the server record for this very task (DTO-01): a performed
	 * task is counted by the answer of the server, never by the fact that a form was submitted.
	 */

	/**
	 * Reads the answer of the opener. An answer that names no known ending leaves the task undecided:
	 * an unrecognized one must not pass for a performed one.
	 */
	async function requestTaskPass(task, openTask) {
		const pass = await openTask(task);
		return {
			status: Object.values(TaskPassStatus).includes(pass?.status) ? pass.status : TaskPassStatus.Skipped,
			decision: main_core.Type.isPlainObject(pass?.decision) ? pass.decision : null,
			outcome: main_core.Type.isPlainObject(pass?.outcome) ? pass.outcome : null
		};
	}

	/**
	 * Registers how one task went. A task the person left undecided - and a task that came back
	 * performed but without a server record - leaves its trace in the pass as skipped: no task
	 * disappears from the result without a word.
	 */
	function collectTaskPass(task, pass, notifier) {
		if (pass.status === TaskPassStatus.Exit) {
			return {
				isInterrupted: true,
				results: [],
				skippedTaskIds: []
			};
		}
		if (pass.status === TaskPassStatus.Done && pass.outcome) {
			const results = [pass.outcome];
			notifier.notifyDone(results);
			return {
				isInterrupted: false,
				results,
				skippedTaskIds: []
			};
		}
		notifier.notifySkipped();
		return {
			isInterrupted: false,
			results: [],
			skippedTaskIds: toTaskIds([task])
		};
	}
	/**
	 * Takes a group of tasks through the opener, one after another. Leaving the pass on any of them ends
	 * the rule at once, and the tasks behind it keep waiting for their decision.
	 */
	class OneByOneRule {
		#notifier;
		#openTask;
		constructor(options) {
			this.#notifier = options.notifier;
			this.#openTask = main_core.Type.isFunction(options?.openTask) ? options.openTask : null;
		}
		async run(tasks) {
			if (!main_core.Type.isArrayFilled(tasks)) {
				return emptyRuleResult();
			}
			if (!this.#openTask) {
				return this.#skipTasks(tasks);
			}
			let result = emptyRuleResult();
			for (const task of tasks) {
				// eslint-disable-next-line no-await-in-loop
				const pass = await requestTaskPass(task, this.#openTask);
				result = mergeRuleResult(result, collectTaskPass(task, pass, this.#notifier));
				if (result.isInterrupted) {
					break;
				}
			}
			return result;
		}

		/**
		 * There is nothing to open a task with until the opener of P3 appears, so the group leaves the
		 * pass undecided at once instead of one silent step at a time.
		 */
		#skipTasks(tasks) {
			const skippedTaskIds = toTaskIds(tasks);
			this.#notifier.notifySkipped(skippedTaskIds.length);
			return {
				isInterrupted: false,
				results: [],
				skippedTaskIds
			};
		}
	}

	/**
	 * The pass over a mixed selection: tasks leave the queue one by one and the person decides each of
	 * them in its own form. A performed task takes the tasks similar to it out of the queue right away,
	 * so the group is handled while the decision just made is still at hand.
	 */
	class SequentialRule {
		#notifier;
		#similarRule;
		#openTask;
		constructor(options) {
			this.#notifier = options.notifier;
			this.#similarRule = options.similarRule;
			this.#openTask = main_core.Type.isFunction(options?.openTask) ? options.openTask : null;
		}
		async run(queue) {
			if (!this.#openTask) {
				return this.#skipQueue(queue);
			}
			let result = emptyRuleResult();
			while (!queue.isEmpty) {
				const task = queue.shift();

				// eslint-disable-next-line no-await-in-loop
				const pass = await requestTaskPass(task, this.#openTask);
				result = mergeRuleResult(result, collectTaskPass(task, pass, this.#notifier));
				if (result.isInterrupted) {
					return result;
				}

				// The pass over a mixed selection is the longest one there is, and every task of it is a step
				// the person takes by hand: how much of the pass is still ahead is said after each of them.
				this.#notifier.notifyRemaining();

				// A task groups nothing unless the decision made on it may be repeated for the tasks like it:
				// an undecided task has no decision at all, and a decision that stayed in its form cannot be
				// sent again. Such a group is left in the queue and opened task by task - offering to apply
				// what cannot be applied would answer "skipped" the moment the offer is accepted.
				if (pass.status !== TaskPassStatus.Done || !isRepeatableDecision(pass.decision)) {
					continue;
				}
				const group = queue.extractByHash(task.hash);
				if (group.length === 0) {
					continue;
				}

				// eslint-disable-next-line no-await-in-loop
				result = mergeRuleResult(result, await this.#similarRule.run(group, pass.decision));
				if (result.isInterrupted) {
					return result;
				}
			}
			return result;
		}

		/**
		 * A mixed selection needs a form for every task, and until the opener of P3 appears there is no
		 * surface to show one. The pass ends right away with every task of the queue left undecided: an
		 * empty pass has to be visible in the result, not silent.
		 */
		#skipQueue(queue) {
			const skippedTaskIds = toTaskIds(queue.items);
			while (!queue.isEmpty) {
				queue.shift();
			}
			this.#notifier.notifySkipped(skippedTaskIds.length);
			return {
				isInterrupted: false,
				results: [],
				skippedTaskIds
			};
		}
	}

	/**
	 * Chooses the rule the selection calls for and runs the pass by it: a selection where every task
	 * goes without a form and carries one and the same hash is performed by a single decision, anything
	 * else is walked task by task.
	 *
	 * The chain neither touches the list of processes nor knows what a surface looks like. Everything it
	 * cannot do on its own it receives: the transport, the counters of the pass, the decision the pass
	 * started with, the opener of a task (P3) and the surfaces that ask about a group (P2).
	 */
	class RulesChain {
		#notifier;
		#batchRule;
		#sequentialRule;
		#decision;
		constructor(options) {
			this.#notifier = options.notifier;
			this.#decision = main_core.Type.isPlainObject(options?.decision) ? options.decision : null;
			this.#batchRule = new BatchRule({
				service: options.service,
				notifier: options.notifier
			});
			const oneByOneRule = new OneByOneRule({
				notifier: options.notifier,
				openTask: options?.openTask
			});
			const similarRule = new SimilarRule({
				notifier: options.notifier,
				batchRule: this.#batchRule,
				oneByOneRule,
				informer: options?.informer
			});
			this.#sequentialRule = new SequentialRule({
				notifier: options.notifier,
				similarRule,
				openTask: options?.openTask
			});
		}

		/**
		 * @param queue The selection, in the order of the rows of the list. The order is kept as the
		 *   snapshot of the pass: the list may be refreshed while the pass goes on, and a task that is
		 *   gone by then is settled by the server, which answers `not_found` for it.
		 */
		async run(queue) {
			const snapshot = queue.items;

			// A selection performed by a single operation is the whole pass, so the operation says nothing
			// of its own: the summary below reports the same number, and one of the two is a repetition.
			const result = BatchRule.isApplicable(snapshot) ? await this.#batchRule.run(snapshot, this.#decision, false) : await this.#sequentialRule.run(queue);
			this.#notifier.notifySummary(result.isInterrupted);
			return result;
		}
	}

	const TASK_COLLECTION_ACTION = 'bizproc.task.doCollection';

	/**
	 * How many tasks travel in one request (API-01). Kept well under the limit the server checks on its
	 * own: a request that never comes back leaves the tasks it already performed done on the server while
	 * every task of the portion is marked as failed here, so the smaller the portion, the less of the pass
	 * a single unanswered request misreports.
	 */
	const TASK_COLLECTION_PORTION_SIZE = 10;
	const REQUEST_ERROR_MESSAGE_CODE = 'BIZPROC_JS_TASK_PERFORMER_REQUEST_ERROR';
	/**
	 * Sends one decision for a set of tasks (API-01). The service knows nothing about the queue, the
	 * rules or the messages: it takes task ids, returns the outcome records the server answered with.
	 */
	class TaskCollectionService {
		#runAction;

		/**
		 * @param runAction Replaces the transport in tests. Left out, the request goes through the
		 *   standard client layer, which adds the session token.
		 */
		constructor(runAction = null) {
			this.#runAction = main_core.Type.isFunction(runAction) ? runAction : defaultRunAction;
		}

		/**
		 * Applies `taskRequest` to every task of the set. The set travels in portions of
		 * TASK_COLLECTION_PORTION_SIZE, one request after another, and the outcome records are glued
		 * back together in the order the tasks were passed in.
		 *
		 * How many tasks were performed is not carried alongside: the records themselves say it, and one
		 * number told twice is a number that can disagree with itself.
		 */
		async doCollection(taskIds, taskRequest) {
			const results = [];
			for (const portion of splitIntoPortions(normalizeTaskIds(taskIds))) {
				// eslint-disable-next-line no-await-in-loop
				const portionResult = await this.#runPortion(portion, taskRequest);
				results.push(...portionResult.results);
			}
			return {
				results
			};
		}
		async #runPortion(taskIds, taskRequest) {
			try {
				const response = await this.#runAction(TASK_COLLECTION_ACTION, {
					data: {
						taskIds,
						taskRequest
					}
				});
				return toCollectionResult(response?.data ?? null);
			} catch (response) {
				return toFailedResult(taskIds, extractErrors(response));
			}
		}
	}
	function defaultRunAction(action, config) {
		return main_core.ajax.runAction(action, config);
	}
	function normalizeTaskIds(taskIds) {
		if (!main_core.Type.isArrayFilled(taskIds)) {
			return [];
		}
		return taskIds.map(taskId => toTaskId(taskId)).filter(taskId => taskId > 0);
	}
	function splitIntoPortions(taskIds) {
		const portions = [];
		for (let index = 0; index < taskIds.length; index += TASK_COLLECTION_PORTION_SIZE) {
			portions.push(taskIds.slice(index, index + TASK_COLLECTION_PORTION_SIZE));
		}
		return portions;
	}
	function toCollectionResult(data) {
		return {
			results: main_core.Type.isArrayFilled(data?.results) ? data.results.map(record => toTaskOutcome(record)) : []
		};
	}

	/**
	 * A portion whose request never came back. There is no server answer for its tasks, so each of them
	 * gets an error record: an unanswered portion must not look either done or untouched.
	 */
	function toFailedResult(taskIds, errors) {
		return {
			results: taskIds.map(taskId => ({
				taskId,
				status: TaskOutcomeStatus.Error,
				errors
			}))
		};
	}
	function toTaskOutcome(record) {
		return {
			taskId: toTaskId(record?.taskId),
			status: toOutcomeStatus(record?.status),
			errors: main_core.Type.isArrayFilled(record?.errors) ? record.errors.map(error => toOutcomeError(error)) : []
		};
	}
	function toTaskId(value) {
		const taskId = Number.parseInt(value, 10);
		return Number.isInteger(taskId) && taskId > 0 ? taskId : 0;
	}

	/** An unknown status counts as a failure: an unclassified outcome must not pass for a done one. */
	function toOutcomeStatus(value) {
		return Object.values(TaskOutcomeStatus).includes(value) ? value : TaskOutcomeStatus.Error;
	}
	function extractErrors(response) {
		if (!main_core.Type.isArrayFilled(response?.errors)) {
			return [toOutcomeError(null)];
		}
		return response.errors.map(error => toOutcomeError(error));
	}
	function toOutcomeError(error) {
		return {
			message: main_core.Type.isStringFilled(error?.message) ? error.message : main_core.Loc.getMessage(REQUEST_ERROR_MESSAGE_CODE),
			code: main_core.Type.isStringFilled(error?.code) ? error.code : null,
			fieldId: main_core.Type.isStringFilled(error?.fieldId) ? error.fieldId : null
		};
	}

	/**
	 * DTO-02 - a task as the process list row describes it. `name` comes decoded and `description` comes
	 * raw (`~DESCRIPTION`): whoever puts them into the DOM encodes them.
	 *
	 * `workflowId` comes from the row itself, not from the server description of the task: a row of the
	 * list is a process. It is the address the next task of the pass is named by (EVENT-01).
	 */

	/** How the whole operation ended for the person who started it. */
	const PerformerOutcome = Object.freeze({
		Completed: 'completed',
		EarlyExit: 'earlyExit'
	});
	/**
	 * The surfaces a group of similar tasks is asked about when the caller names none of its own. The
	 * option stays the point of substitution - tests and outside code put their own surfaces in - but the
	 * mechanics is complete without it: the list of processes starts a pass, not a set of surfaces.
	 */
	const defaultInformer = {
		askSimilar,
		askList: group => SimilarList.ask(group)
	};

	/**
	 * The mechanics of performing a selection of tasks: it assembles the counters of the pass, the
	 * transport and the chain of rules, walks the selection by them and reports how the operation ended.
	 *
	 * Everything about the surfaces stays outside: the list of processes hands over the tasks it selected
	 * and receives the result. The mechanics touches neither the grid nor its state.
	 */
	class TasksPerformer {
		#tasks;
		#onFinish;
		#decision;
		#openTask;
		#informer;

		/**
		 * @param options.decision The task request the pass starts with - what a homogeneous selection is
		 *   performed by and what a group of similar tasks repeats.
		 * @param options.openTask The surface that takes the person through one task (P3).
		 * @param options.informer Replaces the surfaces that ask about a group of similar tasks (P2).
		 */
		constructor(options) {
			this.#tasks = main_core.Type.isArray(options?.tasks) ? [...options.tasks] : [];
			this.#onFinish = main_core.Type.isFunction(options?.onFinish) ? options.onFinish : null;
			this.#decision = main_core.Type.isPlainObject(options?.decision) ? options.decision : null;
			this.#openTask = main_core.Type.isFunction(options?.openTask) ? options.openTask : null;
			this.#informer = main_core.Type.isPlainObject(options?.informer) ? options.informer : defaultInformer;
		}
		async start() {
			const notifier = new Notifier({
				total: this.#tasks.length
			});
			const queue = new TaskQueue(this.#tasks);
			const rulesChain = new RulesChain({
				service: new TaskCollectionService(),
				notifier,
				decision: this.#decision,
				openTask: this.#openTask,
				informer: this.#informer
			});

			// EVENT-01: the form of a task asks the queue of the pass itself what comes next, so the rules
			// and the answer read one and the same queue. The exchange lives as long as the pass does - a
			// listener outliving it would answer for a queue that is gone - and it covers the tasks of this
			// very queue: a form opened beside the pass gets no answer and stays on its own.
			const channel = new NextTaskChannel({
				nextTask: finishedTaskId => queue.peekAfter(finishedTaskId),
				isOwnTask: finishedTaskId => queue.isHandedOut(finishedTaskId)
			});
			channel.subscribe();
			try {
				return this.#finish(await rulesChain.run(queue));
			} finally {
				channel.unsubscribe();
			}
		}
		#finish(ruleResult) {
			const result = toPerformerResult(ruleResult);
			if (this.#onFinish) {
				this.#onFinish(result);
			}
			return result;
		}
	}

	/**
	 * The result of the rules as the person who started the pass sees it. `doneCount` is counted over the
	 * records the server answered with - a performed task is never a guess of the interface.
	 */
	function toPerformerResult(ruleResult) {
		const {
			isInterrupted,
			results,
			skippedTaskIds
		} = ruleResult;
		return {
			outcome: isInterrupted ? PerformerOutcome.EarlyExit : PerformerOutcome.Completed,
			results,
			doneCount: results.filter(record => record.status === TaskOutcomeStatus.Done).length,
			skippedTaskIds
		};
	}

	exports.PerformerOutcome = PerformerOutcome;
	exports.TaskOutcomeStatus = TaskOutcomeStatus;
	exports.TaskPassStatus = TaskPassStatus;
	exports.TasksPerformer = TasksPerformer;

})(this.BX.Bizproc = this.BX.Bizproc || {}, BX, BX.UI, BX.UI.System, BX.UI.System.Illustration, BX.UI.System.Typography, BX.Main, BX.Bizproc.A11y, BX.UI.System.Checkbox, BX.UI.Notification, BX.Event);
//# sourceMappingURL=performer.bundle.js.map
