/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
(function (exports, main_core, main_core_events, main_sidepanel, main_popup, ui_buttons, tasks_wizard, ui_formElements_view, tasks_intervalSelector, ui_entitySelector, main_polyfill_intersectionobserver, pull_client, ui_lottie, ui_dialogs_messagebox) {
	'use strict';

	class FormPage {
		getId() {}
		getTitle() {}
		setFlow(flow) {}
		getFlowId() {}
		render() {}
		getFields(flowData) {}
		getRequiredData() {
			return [];
		}
		update() {
			this.cleanErrors();
		}
		cleanErrors() {}
		showErrors(incorrectData) {}
		onContinueClick(flowData = {}) {
			return Promise.resolve(true);
		}
		onDialogLoad(event) {
			const dialog = event.getTarget();
			const tagSelector = dialog.getTagSelector();

			// set all unavailable items deselectable
			const selectedItems = tagSelector.getTags();
			selectedItems.forEach(item => {
				if (!item.deselectable) {
					item.setDeselectable(true);
					item.render();
				}
			});
		}
	}

	class ValueChecker extends main_core_events.EventEmitter {
		#params;
		#layout;
		constructor(params) {
			super(params);
			this.setEventNamespace('BX.Tasks.Flow.EditForm.ValueChecker');
			this.#params = params;
			this.#layout = {};
			if (this.#params.entitySelector) {
				this.#params.value = this.#params.entitySelector.getPreselectedItems()[0]?.[1];
			}
		}
		isChecked() {
			return this.#layout.checker.isChecked();
		}
		getValue() {
			const entitySelectorValue = this.#getSelectedItem()?.id;
			return this.#layout.checkerValue?.value || entitySelectorValue || this.#params.placeholder;
		}
		setValue(value) {
			this.#layout.checker.switcher.check(value);
		}
		setErrors(errors) {
			this.#layout.checker?.setErrors(errors);
		}
		cleanError() {
			this.#layout.checker?.cleanError();
		}
		getInputNode() {
			return this.#renderInput();
		}
		getChecker() {
			return this.#layout.checker;
		}
		disable(disabled) {
			if (disabled) {
				this.#layout.checker.switcher.check(true);
			}
			this.#layout.checker.switcher.disable(disabled);
		}
		render() {
			this.#layout.wrap = main_core.Tag.render`
			<div
				class="tasks-flow__create-value-checker ${this.#params.value ? '' : '--off'}"
				data-id="tasks-flow-value-checker-${this.#params.id}"
			>
				${this.#renderChecker()}
				${this.#renderValue()}
				${this.#renderEntitySelectorValue()}
			</div>
		`;
			this.update();
			const observer = new IntersectionObserver(() => {
				if (this.#layout.wrap.offsetWidth > 0) {
					this.update();
					observer.disconnect();
				}
			});
			observer.observe(this.#layout.wrap);
			return this.#layout.wrap;
		}
		#renderChecker() {
			this.#layout.checker = new ui_formElements_view.Checker({
				checked: Boolean(this.#params.value),
				title: this.#params.title,
				hideSeparator: true,
				size: this.#params.size ?? 'small',
				isFieldDisabled: this.#params.isFieldDisabled ?? false
			});
			this.#layout.checker.subscribe('change', baseEvent => {
				const isChecked = baseEvent.getData();
				this.update();
				if (isChecked && this.#layout.checkerValue) {
					const length = this.#layout.checkerValue.value.length;
					this.#layout.checkerValue.focus();
					this.#layout.checkerValue.setSelectionRange(length, length);
				}
			});
			main_core_events.EventEmitter.subscribe(this.#layout.checker.switcher, 'lock', () => {
				this.#setHint(true);
				this.emit('lock', this.#layout.checkerContentField);
			});
			main_core_events.EventEmitter.subscribe(this.#layout.checker.switcher, 'unlock', () => {
				this.#setHint(false);
				this.emit('unlock', this.#layout.checkerContentField);
			});
			this.#layout.checkerContentField = this.#layout.checker.render();
			this.#setHint(this.#params.isFieldDisabled ?? false);
			return this.#layout.checkerContentField;
		}
		#setHint(isDisabled) {
			if (!this.#params.hintText) {
				return;
			}
			if (this.#params.hintOnDisabled === true && isDisabled === false) {
				main_core.Dom.attr(this.#layout.checkerContentField, 'data-hint', null);
				main_core.Dom.attr(this.#layout.checkerContentField, 'data-hint-no-icon', null);
			} else {
				main_core.Dom.attr(this.#layout.checkerContentField, 'data-hint', this.#params.hintText);
				main_core.Dom.attr(this.#layout.checkerContentField, 'data-hint-no-icon', true);
			}
		}
		#renderValue() {
			if (!this.#params.placeholder) {
				return '';
			}
			this.#layout.disabledValue = main_core.Tag.render`
			<span class="tasks-flow__create-value-checker_text">${this.getValue()}</span>
		`;
			return main_core.Tag.render`
			<div class="tasks-flow__create-value-checker_input">
				${this.#renderInput()}
				<span>${this.#params.unit ?? ''}</span>
				${this.#layout.disabledValue}
			</div>
		`;
		}
		#renderInput() {
			if (this.#layout.checkerValue) {
				return this.#layout.checkerValue;
			}
			this.#layout.checkerValue = main_core.Tag.render`
			<input class="ui-ctl-element" placeholder="${this.#params.placeholder}" value="${this.#params.value ?? this.#params.placeholder}">
		`;
			main_core.Event.bind(this.#layout.checkerValue, 'input', () => this.update());
			return this.#layout.checkerValue;
		}
		#renderEntitySelectorValue() {
			if (!this.#params.entitySelector) {
				return '';
			}
			this.#layout.entitySelector = main_core.Tag.render`
			<div class="tasks-flow-template-selector">
				${main_core.Loc.getMessage('TASKS_FLOW_EDIT_FORM_SELECT')}
			</div>
		`;
			this.#params.entitySelector.subscribe('Item:onSelect', this.#onEntitySelectorItemSelectedHandler.bind(this));
			this.#params.entitySelector.subscribe('Item:onDeselect', () => this.update());
			this.#params.entitySelector.subscribe('onLoad', () => this.update());
			this.#params.entitySelector.setTargetNode(this.#layout.entitySelector);
			main_core.Event.bind(this.#layout.entitySelector, 'click', () => {
				if (this.isChecked()) {
					this.#params.entitySelector.show();
					if (this.#params.id === 'task-template') {
						void this.#sendAnalytics();
					}
				}
			});
			return this.#layout.entitySelector;
		}
		async #sendAnalytics() {
			const {
				sendData
			} = await main_core.Runtime.loadExtension('ui.analytics');
			sendData({
				tool: 'tasks',
				category: 'flows',
				event: 'flow_template_select',
				c_section: 'tasks',
				c_sub_section: 'flows_grid',
				c_element: 'template_selection_button'
			});
		}
		#onEntitySelectorItemSelectedHandler() {
			this.update();
			this.#params.entitySelector.hide();
		}
		update() {
			this.#layout.wrap.closest('form')?.dispatchEvent(new window.Event('change'));
			main_core.Dom.addClass(this.#layout.wrap, '--off');
			if (this.isChecked()) {
				main_core.Dom.removeClass(this.#layout.wrap, '--off');
			}
			if (this.#params.entitySelector) {
				this.#layout.entitySelector.innerText = this.#getSelectedItem()?.title.text ?? main_core.Loc.getMessage('TASKS_FLOW_EDIT_FORM_SELECT');
			}
			if (!this.#params.placeholder) {
				return;
			}
			this.#layout.disabledValue.innerText = this.getValue();
			main_core.Dom.style(this.#layout.disabledValue, 'display', '');
			this.#layout.checkerValue.style.width = `${this.#layout.disabledValue.offsetWidth + 7}px`;
			const checkerField = this.#layout.wrap.querySelector('.ui-section__field');
			this.#layout.checkerValue.style.height = `${checkerField.offsetHeight}px`;
		}
		#getSelectedItem() {
			return this.#params.entitySelector?.getSelectedItems()[0];
		}
	}

	class BindFilterNumberInput {
		#params;
		constructor(params) {
			this.#params = params;
			this.#bind(params.input);
		}
		#bind(input) {
			let dispatchedProgrammatically = false;
			input.addEventListener('input', () => {
				if (dispatchedProgrammatically) {
					dispatchedProgrammatically = false;
					return;
				}
				const textBeforeCursor = this.#getTextBeforeCursor(input);
				input.value = this.#normalizeNumber(input.value) || '';
				this.#setCursorToFormattedPosition(input, textBeforeCursor);
				dispatchedProgrammatically = true;
				input.dispatchEvent(new Event('input'));
			});
		}
		#getTextBeforeCursor(input) {
			const selectionStart = input.selectionStart;
			const text = input.value.slice(0, selectionStart);
			return this.#normalizeNumber(text);
		}
		#normalizeNumber(value) {
			let normalizedValue = value.replace(/\D/g, '');
			normalizedValue = parseInt(normalizedValue, 10);
			normalizedValue = Math.max(this.#params.min ?? 1, normalizedValue);
			normalizedValue = Math.min(this.#params.max ?? 9999, normalizedValue);
			return `${normalizedValue || ''}`;
		}
		#setCursorToFormattedPosition(input, textBeforeCursor) {
			const firstPart = textBeforeCursor.slice(0, -1);
			const lastCharacter = textBeforeCursor.slice(-1);
			const matches = input.value.match(`${firstPart}.*?${lastCharacter}`);
			if (!matches) {
				return;
			}
			const match = matches[0];
			const formattedPosition = input.value.indexOf(match) + match.length;
			input.setSelectionRange(formattedPosition, formattedPosition);
		}
	}
	const bindFilterNumberInput = params => new BindFilterNumberInput(params);

	class AboutPage extends FormPage {
		#params;
		#layout;
		#flow;
		constructor(params) {
			super();
			this.#params = params;
			this.#layout = {};
			this.#flow = {};
		}
		setFlow(flow) {
			this.#flow = flow;
		}
		getFlowId() {
			return this.#flow.id ?? null;
		}
		getId() {
			return 'about-flow';
		}
		getTitle() {
			return main_core.Loc.getMessage('TASKS_FLOW_EDIT_FORM_ABOUT_FLOW');
		}
		getRequiredData() {
			return ['name', 'plannedCompletionTime', 'taskCreators'];
		}
		showErrors(incorrectData) {
			if (incorrectData.includes('name')) {
				this.#layout.flowName.setErrors([main_core.Loc.getMessage('TASKS_FLOW_EDIT_FORM_FLOW_NAME_ERROR')]);
			}
			if (incorrectData.includes('plannedCompletionTime')) {
				this.#layout.plannedCompletionTime.setErrors([main_core.Loc.getMessage('TASKS_FLOW_EDIT_FORM_PLANNED_COMPLETION_TIME_ERROR')]);
				this.#layout.plannedCompletionTime.emit('onSetErrors');
			}
			if (incorrectData.includes('taskCreators')) {
				this.#layout.taskCreatorsSelector.setErrors([main_core.Loc.getMessage('TASKS_FLOW_EDIT_FORM_TASKS_CREATORS_ERROR')]);
			}
		}
		cleanErrors() {
			this.#layout.flowName.cleanError();
			this.#layout.plannedCompletionTime.cleanError();
			this.#layout.taskCreatorsSelector.cleanError();
			this.#layout.plannedCompletionTime.emit('onCleanErrors');
		}
		getFields(flowData = {}) {
			const plannedCompletionTimeValue = parseInt(this.#layout.plannedCompletionTime?.getValue(), 10);
			const intervalDuration = this.#layout.plannedCompletionTimeIntervalSelector?.getDuration();
			const interval = this.#layout.plannedCompletionTimeIntervalSelector?.getInterval();
			return {
				name: flowData.name ?? this.#layout.flowName?.getValue().trim() ?? '',
				description: flowData.description ?? this.#layout.flowDescription?.getValue() ?? '',
				taskCreators: flowData.taskCreators ?? this.#getTasksCreatorsFromSelector(),
				plannedCompletionTime: flowData.plannedCompletionTime ?? (plannedCompletionTimeValue * intervalDuration || 0),
				matchSchedule: flowData.matchSchedule ?? this.#isShortInterval(interval),
				matchWorkTime: flowData.matchWorkTime ?? this.#layout.skipWeekends?.isChecked() ?? true
			};
		}
		#getTasksCreatorsFromSelector() {
			let taskCreators = this.#layout.taskCreatorsSelector?.getSelector().getTags().map(tag => [tag.entityId, tag.id]);
			if (main_core.Type.isUndefined(taskCreators) || taskCreators.length === 0) {
				taskCreators = this.#layout.taskCreatorsSelector?.getSelector()?.getDialog().getPreselectedItems();
			}
			return taskCreators;
		}
		#isShortInterval(interval) {
			const shortIntervals = ['minutes', 'hours'];
			return shortIntervals.includes(interval);
		}
		render() {
			this.#layout.flowName = new ui_formElements_view.TextInput({
				id: 'tasks-flow-edit-form-field-name',
				label: main_core.Loc.getMessage('TASKS_FLOW_EDIT_FORM_FLOW_NAME'),
				placeholder: main_core.Loc.getMessage('TASKS_FLOW_EDIT_FORM_FLOW_NAME_PLACEHOLDER'),
				value: this.#flow.name
			});
			this.#layout.flowDescription = new ui_formElements_view.TextArea({
				id: 'tasks-flow-edit-form-field-description',
				label: main_core.Loc.getMessage('TASKS_FLOW_EDIT_FORM_DESCRIPTION'),
				placeholder: main_core.Loc.getMessage('TASKS_FLOW_EDIT_FORM_DESCRIPTION_PLACEHOLDER'),
				value: this.#flow.description,
				resizeOnlyY: true
			});
			this.#layout.taskCreatorsSelector = new ui_formElements_view.UserSelector({
				id: 'tasks-flow-edit-form-field-creators',
				label: main_core.Loc.getMessage('TASKS_FLOW_EDIT_FORM_WHO_CAN_ADD_TASKS'),
				enableDepartments: true,
				values: this.#flow.taskCreators,
				dialogEvents: {
					onLoad: this.onDialogLoad
				}
			});
			this.#layout.aboutPageForm = main_core.Tag.render`
			<form class="tasks-flow__create-about">
				${this.#layout.flowName.render()}
				${this.#layout.flowDescription.render()}
				<div class="tasks-flow__create-separator --empty"></div>
				${this.#layout.taskCreatorsSelector.render()}
				<div class="tasks-flow__create-separator --empty"></div>
				${this.#renderPlannedCompletionTime()}
			</form>
		`;
			main_core.Event.bind(this.#layout.aboutPageForm, 'change', this.#params.onChangeHandler);
			return this.#layout.aboutPageForm;
		}
		focusToEmptyName() {
			const isEmpty = this.#layout.flowName.getValue().trim().length === 0;
			if (isEmpty) {
				this.#layout.flowName.getInputNode().focus();
			}
		}
		#renderPlannedCompletionTime() {
			const value = this.#flow.plannedCompletionTime;
			this.#layout.plannedCompletionTimeIntervalSelector = new tasks_intervalSelector.IntervalSelector({
				value
			});
			this.#layout.plannedCompletionTimeIntervalSelector.subscribe('intervalChanged', event => {
				const interval = event.getData().interval;
				const isSkipWeekendsDisabled = this.#isShortInterval(interval);
				this.#layout.skipWeekends.disable(isSkipWeekendsDisabled);
			});
			const duration = this.#layout.plannedCompletionTimeIntervalSelector.getDuration();
			const plannedCompletionTimeLabel = `
			<div class="tasks-flow__create-title-with-hint">
				${main_core.Loc.getMessage('TASKS_FLOW_EDIT_FORM_PLANNED_COMPLETION_TIME')}
				<span
					data-id="plannedCompletionTimeHint"
					class="ui-hint"
					data-hint="${main_core.Loc.getMessage('TASKS_FLOW_EDIT_FORM_PLANNED_COMPLETION_TIME_HINT')}" 
					data-hint-no-icon
				>
					<span class="ui-hint-icon"></span>
				</span>
			</div>
		`;
			this.#layout.plannedCompletionTime = new ui_formElements_view.TextInput({
				label: plannedCompletionTimeLabel,
				placeholder: '5',
				inputDefaultWidth: true,
				value: String(value / duration || '')
			});
			const maxInt = 2 ** 32 / 2 - 1;
			const monthDuration = 60 * 60 * 24 * 31;
			bindFilterNumberInput({
				input: this.#layout.plannedCompletionTime.getInputNode(),
				max: Math.floor(maxInt / monthDuration)
			});
			const interval = this.#layout.plannedCompletionTimeIntervalSelector.getInterval();
			const isSkipWeekendsDisabled = this.#isShortInterval(interval);
			this.#layout.skipWeekends = new ValueChecker({
				id: 'planned-completion-time-skip-weekends',
				title: main_core.Loc.getMessage('TASKS_FLOW_EDIT_FORM_SKIP_WEEKENDS'),
				value: isSkipWeekendsDisabled ? true : this.#flow.id === 0 || this.#flow.matchWorkTime,
				size: 'extra-small',
				isFieldDisabled: isSkipWeekendsDisabled,
				hintText: main_core.Loc.getMessage('TASKS_FLOW_EDIT_FORM_DISABLED_SKIP_WEEKENDS_HINT'),
				hintOnDisabled: true
			});
			this.#layout.skipWeekends.subscribe('lock', baseEvent => {
				requestAnimationFrame(() => {
					const hintManager = top.BX.UI.Hint.createInstance({
						id: `tasks-flow-edit-form-about-page-${main_core.Text.getRandom()}`,
						className: 'skipInitByClassName',
						popupParameters: {
							targetContainer: this.#layout.aboutPageForm.closest('.tasks-wizard__step')
						}
					});
					hintManager.initNode(baseEvent.getData());
				});
			});
			const root = main_core.Tag.render`
			<div data-id="tasks-flow-edit-form-field-planned-time">
				<div class="tasks-flow__create-planned_completion-time">
					${this.#layout.plannedCompletionTime.render()}
					<div class="tasks-flow__create-planned_completion-time-interval">
						${this.#layout.plannedCompletionTimeIntervalSelector.render()}
					</div>
				</div>
				${this.#layout.skipWeekends.render()}
			</div>
		`;
			return root;
		}
		async onContinueClick(flowData = {}) {
			const {
				data: response
			} = await main_core.ajax.runAction('tasks.flow.Flow.isExists', {
				data: {
					flowData: flowData
				}
			});
			if (response.exists) {
				this.#layout.flowName.setErrors([main_core.Loc.getMessage('TASKS_FLOW_EDIT_FORM_FLOW_DUPLICATE_ERROR')]);
				return false;
			}
			return true;
		}
	}

	class PullRequests extends main_core_events.EventEmitter {
		#userId;
		constructor(userId) {
			super();
			this.setEventNamespace('BX.Tasks.Flow.EditForm.PullRequests');
			this.#userId = parseInt(userId, 10);
		}
		getModuleId() {
			return 'tasks';
		}
		getMap() {
			return {
				template_add: this.#onTemplateAdded.bind(this),
				template_update: this.#onTemplateUpdated.bind(this)
			};
		}
		#onTemplateAdded(data) {
			this.emit('templateAdded', {
				template: {
					id: data.TEMPLATE_ID,
					title: data.TEMPLATE_TITLE
				}
			});
		}
		#onTemplateUpdated(data) {
			this.emit('templateUpdated', {
				template: {
					id: data.TEMPLATE_ID,
					title: data.TEMPLATE_TITLE
				}
			});
		}
	}

	const BIG_DEPARTMENT_USER_COUNT = 30;
	const HINT_MESSAGES_BY_COUNT = [{
		condition: count => count === 0,
		message: 'TASKS_FLOW_EDIT_FORM_THIS_IS_EMPTY_DEPARTMENT_HINT'
	}, {
		condition: count => count > BIG_DEPARTMENT_USER_COUNT,
		message: 'TASKS_FLOW_EDIT_FORM_THIS_IS_BIG_DEPARTMENT_HINT'
	}];
	class SettingsPage extends FormPage {
		#params;
		#layout;
		#flow;
		constructor(params) {
			super();
			this.#params = params;
			this.#layout = {};
			this.#flow = {};
			this.#init();
		}
		get #currentUser() {
			const settings = main_core.Extension.getSettings('tasks.flow.edit-form');
			return settings.currentUser;
		}
		#init() {
			this.#subscribeToPull();
		}
		#subscribeToPull() {
			const pullRequests = new PullRequests(this.#currentUser);
			pullRequests.subscribe('templateAdded', this.#onTemplateAddedHandler.bind(this));
			pullRequests.subscribe('templateUpdated', this.#onTemplateUpdatedHandler.bind(this));
			pull_client.PULL.subscribe(pullRequests);
		}
		#onTemplateAddedHandler({
			data
		}) {
			const template = data.template;
			const templateItem = {
				id: template.id,
				entityId: 'task-template',
				title: template.title,
				tabs: 'recents'
			};
			this.#layout.taskTemplateDialog.addItem(templateItem);
			this.#layout.taskTemplateDialog.getItems().find(item => item.id === templateItem.id).select();
		}
		#onTemplateUpdatedHandler({
			data
		}) {
			const template = data.template;
			const templateItem = this.#layout.taskTemplateDialog.getItem({
				id: template.id,
				entityId: 'task-template'
			});
			if (main_core.Type.isStringFilled(template.title)) {
				templateItem?.setTitle(template.title);
				this.#layout.taskTemplate?.update();
			}
			if (!main_core.Type.isArrayFilled(this.#layout.taskTemplateDialog.getSelectedItems())) {
				templateItem?.select();
			}
		}
		setFlow(flow) {
			this.#flow = flow;
		}
		getFlowId() {
			return this.#flow.id ?? null;
		}
		getId() {
			return 'settings';
		}
		getTitle() {
			return main_core.Loc.getMessage('TASKS_FLOW_EDIT_FORM_SETTINGS');
		}
		getRequiredData() {
			const requiredData = ['groupId', 'responsibleList'];
			if (this.#layout.taskTemplate.isChecked()) {
				requiredData.push('templateId');
			}
			return requiredData;
		}
		update() {
			super.update();
			main_core.Dom.removeClass(this.#layout.queueDistribution, '--active');
			main_core.Dom.removeClass(this.#layout.manuallyDistribution, '--active');
			main_core.Dom.removeClass(this.#layout.himselfDistribution, '--active');
			main_core.Dom.removeClass(this.#layout.immutableDistribution, '--active');
			if (this.#layout.queueRadio.checked) {
				main_core.Dom.addClass(this.#layout.queueDistribution, '--active');
			}
			if (this.#layout.manuallyRadio.checked) {
				main_core.Dom.addClass(this.#layout.manuallyDistribution, '--active');
			}
			if (this.#layout.himselfRadio.checked) {
				main_core.Dom.addClass(this.#layout.himselfDistribution, '--active');
			}
			if (this.#layout.immutableRadio.checked) {
				main_core.Dom.addClass(this.#layout.immutableDistribution, '--active');
			}
		}
		showErrors(incorrectData) {
			if (incorrectData.includes('responsibleList')) {
				this.#showResponsibleListError();
			}
			if (incorrectData.includes('groupId')) {
				this.#layout.projectSelector.setErrors([main_core.Loc.getMessage('TASKS_FLOW_EDIT_FORM_PROJECT_FOR_TASKS_ERROR')]);
			}
			if (incorrectData.includes('templateId')) {
				this.#layout.taskTemplate.setErrors([main_core.Loc.getMessage('TASKS_FLOW_EDIT_FORM_TEMPLATE_FOR_TASKS_ERROR')]);
			}
		}
		#showResponsibleListError() {
			const distributionType = new FormData(this.#layout.settingsPageForm).get('distribution');

			// eslint-disable-next-line default-case
			switch (distributionType) {
				case 'manually':
					this.#layout.moderatorSelector.setErrors([main_core.Loc.getMessage('TASKS_FLOW_EDIT_FORM_TASKS_MODERATOR_ERROR')]);
					break;
				case 'queue':
					this.#layout.responsiblesQueueSelector.setErrors([main_core.Loc.getMessage('TASKS_FLOW_EDIT_FORM_TASKS_RESPONSIBLES_ERROR')]);
					break;
				case 'himself':
					this.#layout.responsiblesHimselfSelector.setErrors([main_core.Loc.getMessage('TASKS_FLOW_EDIT_FORM_TASKS_RESPONSIBLES_ERROR')]);
					break;
				case 'immutable':
					this.#layout.responsiblesImmutableSelector.setErrors([main_core.Loc.getMessage('TASKS_FLOW_EDIT_FORM_TASKS_RESPONSIBLES_ERROR')]);
					break;
			}
		}
		cleanErrors() {
			this.#layout.projectSelector.cleanError();
			this.#layout.responsiblesQueueSelector.cleanError();
			this.#layout.responsiblesHimselfSelector.cleanError();
			this.#layout.responsiblesImmutableSelector.cleanError();
			this.#layout.moderatorSelector.cleanError();
			this.#layout.taskTemplate.cleanError();
		}
		getFields(flowData = {}) {
			const selectedDistributionType = new FormData(this.#layout.settingsPageForm).get('distribution');
			const distributionType = flowData.distributionType ?? (selectedDistributionType || 'queue');
			const responsibleList = this.#getResponsiblesByDistributionType(distributionType, flowData);
			let groupId = this.#flow.groupId;
			if (this.#layout.projectSelector?.getSelector().getDialog().isLoaded()) {
				groupId = this.#layout.projectSelector.getSelector().getTags()[0]?.id;
			}
			return {
				distributionType,
				responsibleList,
				responsibleCanChangeDeadline: flowData.responsibleCanChangeDeadline ?? this.#layout.responsibleCanChangeDeadline?.isChecked() ?? false,
				notifyAtHalfTime: flowData.notifyAtHalfTime ?? this.#layout.notifyAtHalfTime?.isChecked() ?? false,
				taskControl: flowData.taskControl ?? this.#layout.taskControl?.isChecked() ?? false,
				groupId: flowData.groupId ?? (groupId || 0),
				templateId: flowData.templateId ?? (this.#layout.taskTemplate?.isChecked() ? this.#layout.taskTemplate.getValue() : 0)
			};
		}
		#getResponsiblesByDistributionType(distributionType, flowData = {}) {
			let responsibleList = [];
			const isConsiderFlowResponsible = this.#flow.distributionType === distributionType;
			if (isConsiderFlowResponsible) {
				responsibleList = this.#flow.responsibleList;
			}
			const responsibleListFromSelector = this.#getResponsiblesFromSelectorByDistributionType(distributionType);
			if (!main_core.Type.isNull(responsibleListFromSelector)) {
				responsibleList = responsibleListFromSelector;
			}
			const isConsiderFlowDataResponsible = flowData.distributionType === distributionType;
			if (isConsiderFlowDataResponsible) {
				return flowData.responsibleList ?? responsibleList;
			}
			return responsibleList;
		}
		#getResponsiblesFromSelectorByDistributionType(distributionType) {
			switch (distributionType) {
				case 'manually':
					return this.#getResponsiblesFromSelector(this.#layout.moderatorSelector);
				case 'queue':
					return this.#getResponsiblesFromSelector(this.#layout.responsiblesQueueSelector);
				case 'himself':
					return this.#getResponsiblesFromSelector(this.#layout.responsiblesHimselfSelector);
				case 'immutable':
					return this.#getResponsiblesFromSelector(this.#layout.responsiblesImmutableSelector);
				default:
					return null;
			}
		}
		#getResponsiblesFromSelector(selector) {
			if (selector?.getSelector().getDialog().isLoaded()) {
				return selector?.getSelector().getTags().map(tag => [tag.entityId, String(tag.id)]);
			}
			return null;
		}
		#addFlowTeamTooltip() {
			const immutableFieldLabel = this.#layout.immutableDistribution.querySelector('.ui-section__field-label');
			if (main_core.Type.isDomNode(immutableFieldLabel)) {
				const immutableDistributionTooltip = this.#renderImmutableFlowTeamTooltip();
				main_core.Dom.append(immutableDistributionTooltip, immutableFieldLabel);
			}
		}
		render() {
			this.#layout.responsibleCanChangeDeadline = new ValueChecker({
				id: 'responsible-can-change-deadline',
				title: main_core.Loc.getMessage('TASKS_FLOW_EDIT_FORM_RESPONSIBLE_CAN_CHANGE_DEADLINE'),
				value: this.#flow.responsibleCanChangeDeadline
			});
			const notifyAtHalfTimeTitle = `
			<div class="tasks-flow__create-title-with-hint">
				<span>${main_core.Loc.getMessage('TASKS_FLOW_EDIT_FORM_NOTIFY_AT_HALF_TIME')}</span>
				<span
					data-id="notifyAtHalfTimeHint"
					class="ui-hint ui-hint-flow-value-checker"
					data-hint="${main_core.Loc.getMessage('TASKS_FLOW_EDIT_FORM_NOTIFY_AT_HALF_TIME_HINT')}" 
					data-hint-no-icon
				>
					<span class="ui-hint-icon ui-hint-icon-flow-value-checker"></span>
				</span>
			</div>
		`;
			this.#layout.notifyAtHalfTime = new ValueChecker({
				id: 'notify-at-half-time',
				title: notifyAtHalfTimeTitle,
				value: this.#flow.notifyAtHalfTime
			});
			this.#layout.taskControl = new ValueChecker({
				id: 'task-control',
				title: main_core.Loc.getMessage('TASKS_FLOW_EDIT_FORM_TASK_CONTROL'),
				value: this.#flow.taskControl
			});
			this.#layout.projectSelector = new ui_formElements_view.UserSelector({
				label: this.#getProjectLabel(),
				enableUsers: false,
				enableDepartments: false,
				multiple: false,
				entities: [{
					id: 'project',
					options: {
						features: {
							tasks: []
						},
						flow: true,
						checkFeatureForCreate: true,
						'!type': ['collab']
					}
				}],
				values: this.#flow.groupId ? [['project', this.#flow.groupId]] : [],
				dialogEvents: {
					onLoad: this.onDialogLoad
				}
			});
			this.#layout.taskTemplate = new ValueChecker({
				id: 'task-template',
				title: main_core.Loc.getMessage('TASKS_FLOW_EDIT_FORM_ACCEPT_TASKS_BY_TEMPLATE_TITLE'),
				entitySelector: this.#getTaskTemplateDialog(),
				isFieldDisabled: this.#flow.distributionType === 'immutable'
			});
			this.#layout.settingsPageForm = main_core.Tag.render`
			<form class="tasks-flow__create-settings">
				${this.#renderDistribution()}
				<div class="tasks-flow__create-separator --empty"></div>
				${this.#layout.responsibleCanChangeDeadline.render()}
				${this.#layout.notifyAtHalfTime.render()}
				${this.#layout.taskControl.render()}
				<div class="tasks-flow__create-separator"></div>
				${this.#layout.projectSelector.render()}
				<div class="tasks-flow__create-separator --empty"></div>
				${this.#layout.taskTemplate.render()}
			</form>
		`;
			main_core.Event.bind(this.#layout.settingsPageForm, 'change', this.#params.onChangeHandler);
			return this.#layout.settingsPageForm;
		}
		#renderDistribution() {
			this.#layout.responsiblesQueueSelector = this.#getResponsiblesSelector(this.#flow.distributionType === 'queue' ? this.#flow.responsibleList : [], false);
			this.#layout.responsiblesHimselfSelector = this.#getResponsiblesSelector(this.#flow.distributionType === 'himself' ? this.#flow.responsibleList : []);
			this.#layout.responsiblesImmutableSelector = this.#getResponsiblesSelector(this.#flow.distributionType === 'immutable' && main_core.Type.isArrayFilled(this.#flow.responsibleList) ? this.#flow.responsibleList : [['user', this.#currentUser]]);
			this.#layout.moderatorSelector = new ui_formElements_view.UserSelector({
				enableAll: false,
				enableDepartments: false,
				multiple: false,
				values: [['user', this.#flow.distributionType === 'manually' && main_core.Type.isArrayFilled(this.#flow.responsibleList) ? this.#flow.responsibleList[0][1] : this.#currentUser]],
				dialogEvents: {
					onLoad: this.onDialogLoad
				}
			});
			const {
				root: queueDistribution,
				radio: queueRadio
			} = this.#renderDistributionType({
				type: 'queue',
				selector: this.#layout.responsiblesQueueSelector
			});
			this.#layout.queueDistribution = queueDistribution;
			this.#layout.queueRadio = queueRadio;
			const {
				root: manuallyDistribution,
				radio: manuallyRadio
			} = this.#renderDistributionType({
				type: 'manually',
				selector: this.#layout.moderatorSelector
			});
			this.#layout.manuallyDistribution = manuallyDistribution;
			this.#layout.manuallyRadio = manuallyRadio;
			const {
				root: himselfDistribution,
				radio: himselfRadio
			} = this.#renderDistributionType({
				type: 'himself',
				selector: this.#layout.responsiblesHimselfSelector
			});
			this.#layout.himselfDistribution = himselfDistribution;
			this.#layout.himselfRadio = himselfRadio;
			const {
				root: immutableDistribution,
				radio: immutableRadio
			} = this.#renderDistributionType({
				type: 'immutable',
				selector: this.#layout.responsiblesImmutableSelector
			});
			this.#layout.immutableDistribution = immutableDistribution;
			this.#layout.immutableRadio = immutableRadio;
			this.#layout.queueRadio.checked = this.#flow.distributionType === 'queue';
			this.#layout.manuallyRadio.checked = this.#flow.distributionType === 'manually';
			this.#layout.himselfRadio.checked = this.#flow.distributionType === 'himself';
			this.#layout.immutableRadio.checked = this.#flow.distributionType === 'immutable';
			this.update();
			main_core.Event.bind(this.#layout.queueRadio, 'change', this.#onDistributionChange.bind(this));
			main_core.Event.bind(this.#layout.manuallyRadio, 'change', this.#onDistributionChange.bind(this));
			main_core.Event.bind(this.#layout.himselfRadio, 'change', this.#onDistributionChange.bind(this));
			main_core.Event.bind(this.#layout.immutableRadio, 'change', this.#onDistributionChange.bind(this));
			const selector = this.#layout.responsiblesHimselfSelector.getSelector();
			selector.getDialog().subscribe('onHide', this.checkDepartmentUsersCount.bind(this, selector));
			this.#addFlowTeamTooltip();
			return main_core.Tag.render`
			<div class="ui-section__field-container">
				<div class="ui-section__field-label_box">
					<label class="ui-section__field-label">
						${main_core.Loc.getMessage('TASKS_FLOW_EDIT_FORM_DISTRIBUTION_TYPE')}
					</label>
				</div>
				${this.#layout.queueDistribution}
				${this.#layout.manuallyDistribution}
				${this.#layout.himselfDistribution}
				${this.#layout.immutableDistribution}
			</div>
		`;
		}
		#onDistributionChange() {
			if (this.#layout.immutableRadio.checked) {
				this.#layout.taskTemplate?.disable(true);
				this.#layout.taskTemplate?.setValue(false);
			} else {
				this.#layout.taskTemplate?.disable(false);
			}
			this.#layout.taskTemplate?.update();
		}
		#getResponsiblesSelector(responsibleValues, enableDepartments = true, multiple = true) {
			return new ui_formElements_view.UserSelector({
				enableAll: false,
				multiple,
				enableDepartments,
				values: responsibleValues,
				label: main_core.Loc.getMessage('TASKS_FLOW_EDIT_FORM_DISTRIBUTION_QUEUE_SELECTOR_LABEL'),
				className: 'tasks-flow__responsible-selector',
				dialogEvents: {
					onLoad: this.onDialogLoad
				}
			});
		}
		#renderDistributionType({
			type,
			selector
		}) {
			return main_core.Tag.render`
			<div class="tasks-flow__create-distribution-type --${type}" data-id="tasks-flow-distribution-${type}">
				<label class="ui-ctl ui-ctl-radio ui-ctl-wa">
					<input type="radio" name="distribution" value="${type}" class="ui-ctl-element" ref="radio">
					<div class="tasks-flow__create-distribution-type_title-container">
						<div class="tasks-flow__create-distribution-type_content">
						<div class="tasks-flow__create-distribution-type_title">
								<div class="tasks-flow__create-distribution-type_title-text">
									${main_core.Loc.getMessage(`TASKS_FLOW_EDIT_FORM_DISTRIBUTION_${type.toUpperCase()}`)}
								</div>
								<span class="tasks-flow__create-distribution-type_label ui-label ui-label-primary ui-label-fill">
									<span class="ui-label-inner">
										${main_core.Loc.getMessage('TASKS_FLOW_EDIT_FORM_ANALYTICS_STUB_BUTTON')}
									</span>
								</span>
							</div>
							<div class="tasks-flow__create-distribution-type_hint">
								${main_core.Loc.getMessage(`TASKS_FLOW_EDIT_FORM_DISTRIBUTION_${type.toUpperCase()}_HINT`)}
							</div>
						</div>
						<div class="tasks-flow__create-distribution-type_icon --${type}"></div>
					</div>
				</label>
				<div class="tasks-flow__create-distribution-type_selector">
					${selector?.render()}
				</div>
			</div>
		`;
		}
		#renderImmutableFlowTeamTooltip() {
			return main_core.Tag.render`
			<span
				data-id="immutableDistributionTooltip"
				class="ui-hint ui-hint-flow-value-checker"
				data-hint="${main_core.Loc.getMessage('TASKS_FLOW_EDIT_FORM_DISTRIBUTION_IMMUTABLE_TOOLTIP')}" 
				data-hint-no-icon
			>
				<span class="ui-hint-icon ui-hint-icon-flow-value-checker"></span>
			</span>
		`;
		}
		#getTaskTemplateDialog() {
			this.#layout.taskTemplateDialog = new ui_entitySelector.Dialog({
				width: 500,
				context: 'flow',
				preselectedItems: this.#flow.templateId ? [['task-template', this.#flow.templateId]] : '',
				enableSearch: true,
				multiple: false,
				entities: [{
					id: 'task-template'
				}]
			});
			return this.#layout.taskTemplateDialog;
		}
		#getProjectLabel() {
			const notifyEmptyProject = `
			<span
				data-id="notifyEmptyProjectHint"
				class="ui-hint ui-hint-flow-value-checker"
				data-hint="${main_core.Loc.getMessage('TASKS_FLOW_EDIT_FORM_NOTIFY_EMPTY_PROJECT_HINT')}" 
				data-hint-no-icon
			>
				<span class="ui-hint-icon ui-hint-icon-flow-value-checker"></span>
			</span>
		`;
			return `
			<div class="tasks-flow-field-label-container">
				<span>${main_core.Loc.getMessage('TASKS_FLOW_EDIT_FORM_PROJECT_FOR_TASKS')}</span>
				${this.#flow.id ? '' : notifyEmptyProject}
			</div>
		`;
		}
		checkDepartmentUsersCount(selector) {
			const selectedTags = selector.getTags();
			const selectedDepartments = selectedTags.filter(tag => tag.getEntityId() === 'department');
			let addedDepartments = [];
			if (main_core.Type.isUndefined(this.selectedDepartments) || this.selectedDepartments.length === 0) {
				addedDepartments = selectedDepartments;
			} else {
				addedDepartments = selectedDepartments.filter(departmentTag => !this.selectedDepartments.includes(departmentTag));
			}
			this.selectedDepartments = selectedDepartments;
			if (addedDepartments.length === 0) {
				return;
			}
			this.#getDepartmentsUsersCount(addedDepartments).then(countArray => {
				const departmentForHint = countArray.find(departmentData => departmentData.count > BIG_DEPARTMENT_USER_COUNT || departmentData.count === 0);
				if (departmentForHint) {
					const tag = addedDepartments.find(item => item.getId().toString() === departmentForHint.departmentId);
					if (tag) {
						this.#showDepartmentHint(tag, this.#getHintMessageCodeByCount(departmentForHint.count));
					}
				}
			}).catch(error => {
				console.error(error);
			});
		}
		#getHintMessageCodeByCount(count) {
			const hintMessage = HINT_MESSAGES_BY_COUNT.find(hint => hint.condition(count));
			return hintMessage ? hintMessage.message : '';
		}
		#showDepartmentHint(tag, code) {
			const popup = new BX.PopupWindow({
				content: BX.Loc.getMessage(code),
				darkMode: true,
				bindElement: tag.getContainer(),
				angle: true,
				contentPadding: 5,
				maxWidth: 400,
				offsetLeft: tag.getContainer().offsetWidth / 2,
				autoHide: true,
				closeByEsc: true
			});
			popup.show();
		}
		#getDepartmentsUsersCount(departments) {
			const departmentsToBackend = departments.map(department => [department.getEntityId(), department.getId()]);
			return main_core.ajax.runAction('tasks.flow.Flow.getDepartmentsMemberCount', {
				data: {
					departments: departmentsToBackend
				}
			}).then(result => {
				return main_core.Type.isArrayFilled(result.errors) ? null : result.data;
			}).catch(errors => {
				console.error(errors);
			});
		}
	}

	class ControlPage extends FormPage {
		#params;
		#layout;
		#flow;
		constructor(params) {
			super();
			this.#params = params;
			this.#layout = {};
			this.#flow = {};
		}
		get #currentUser() {
			const settings = main_core.Extension.getSettings('tasks.flow.edit-form');
			return settings.currentUser;
		}
		setFlow(flow) {
			this.#flow = flow;
		}
		getFlowId() {
			return this.#flow.id ?? null;
		}
		getId() {
			return 'control';
		}
		getTitle() {
			return main_core.Loc.getMessage('TASKS_FLOW_EDIT_FORM_CONTROL');
		}
		getRequiredData() {
			return this.#getCheckerValues().filter(checker => this.#layout[checker].isChecked());
		}
		showErrors(incorrectData) {
			if (incorrectData.includes('ownerId')) {
				this.#layout.flowOwnerSelector.setErrors([main_core.Loc.getMessage('TASKS_FLOW_EDIT_FORM_FLOW_OWNER_ERROR')]);
			}
			this.#getCheckerValues().forEach(checker => {
				if (incorrectData.includes(checker)) {
					this.#layout[checker].setErrors([main_core.Loc.getMessage('TASKS_FLOW_EDIT_FORM_VALUE_ERROR')]);
				}
			});
		}
		cleanErrors() {
			this.#layout.flowOwnerSelector.cleanError();
			this.#getCheckerValues().forEach(checker => this.#layout[checker].cleanError());
		}
		#getCheckerValues() {
			return ['notifyOnQueueOverflow', 'notifyOnTasksInProgressOverflow', 'notifyWhenEfficiencyDecreases'];
		}
		getFields(flowData = {}) {
			let ownerId = this.#currentUser;
			if (this.#layout.flowOwnerSelector?.getSelector().getDialog().isLoaded()) {
				ownerId = this.#layout.flowOwnerSelector.getSelector().getTags()[0]?.id;
			}
			return {
				ownerId: Number(flowData.ownerId || ownerId || 0),
				notifyOnQueueOverflow: flowData.notifyOnQueueOverflow ?? this.#getCheckerNumericValue(this.#layout.notifyOnQueueOverflow),
				notifyOnTasksInProgressOverflow: flowData.notifyOnTasksInProgressOverflow ?? this.#getCheckerNumericValue(this.#layout.notifyOnTasksInProgressOverflow),
				notifyWhenEfficiencyDecreases: flowData.notifyWhenEfficiencyDecreases ?? this.#getCheckerNumericValue(this.#layout.notifyWhenEfficiencyDecreases)
			};
		}
		#getCheckerNumericValue(checker) {
			return checker?.isChecked() ? this.#getInteger(checker.getValue()) : null;
		}
		#getInteger(value) {
			return /^\d+$/.test(value) ? parseInt(value, 10) : 0;
		}
		render() {
			const flowOwnerLabel = `
			<div class="tasks-flow__create-title-with-hint">
				${main_core.Loc.getMessage('TASKS_FLOW_EDIT_FORM_FLOW_OWNER')}
				<span
					data-id="flowOwnerHint"
					class="ui-hint"
					data-hint="${main_core.Loc.getMessage('TASKS_FLOW_EDIT_FORM_FLOW_OWNER_HINT')}" 
					data-hint-no-icon
				><span class="ui-hint-icon"></span></span>
			</div>
		`;
			this.#layout.flowOwnerSelector = new ui_formElements_view.UserSelector({
				id: 'tasks-flow-edit-form-field-owner',
				label: flowOwnerLabel,
				enableAll: false,
				enableDepartments: false,
				multiple: false,
				values: [['user', this.#flow.ownerId]],
				dialogEvents: {
					onLoad: this.onDialogLoad
				}
			});
			this.#layout.notifyOnQueueOverflow = new ValueChecker({
				id: 'notify-on-queue-overflow',
				title: main_core.Loc.getMessage('TASKS_FLOW_EDIT_FORM_NOTIFY_ON_QUEUE_OVERFLOW'),
				placeholder: 50,
				value: this.#flow.notifyOnQueueOverflow,
				size: 'extra-small'
			});
			bindFilterNumberInput({
				input: this.#layout.notifyOnQueueOverflow.getInputNode(),
				max: 99999
			});
			this.#layout.notifyOnTasksInProgressOverflow = new ValueChecker({
				id: 'notify-on-tasks-in-progress-overflow',
				title: main_core.Loc.getMessage('TASKS_FLOW_EDIT_FORM_NOTIFY_ON_TASKS_IN_PROGRESS_OVERFLOW'),
				placeholder: 50,
				value: this.#flow.notifyOnTasksInProgressOverflow,
				size: 'extra-small'
			});
			bindFilterNumberInput({
				input: this.#layout.notifyOnTasksInProgressOverflow.getInputNode(),
				max: 99999
			});
			this.#layout.notifyWhenEfficiencyDecreases = new ValueChecker({
				id: 'notify-when-efficiency-decreases',
				title: main_core.Loc.getMessage('TASKS_FLOW_EDIT_FORM_NOTIFY_WHEN_EFFICIENCY_DECREASES'),
				placeholder: 70,
				unit: '%',
				value: this.#flow.notifyWhenEfficiencyDecreases,
				size: 'extra-small'
			});
			bindFilterNumberInput({
				input: this.#layout.notifyWhenEfficiencyDecreases.getInputNode(),
				max: 100
			});
			this.#layout.analyticsPermissionsSelector = new ui_formElements_view.UserSelector({
				id: 'tasks-flow-edit-form-field-analytics',
				label: main_core.Loc.getMessage('TASKS_FLOW_EDIT_FORM_ANALYTICS_PERMISSIONS'),
				enableAll: true,
				enableDepartments: true,
				className: '',
				dialogEvents: {
					onLoad: this.onDialogLoad
				}
			});
			this.#layout.controlPageForm = main_core.Tag.render`
			<form class="tasks-flow__create-control">
				${this.#layout.flowOwnerSelector.render()}
				${this.#layout.notifyOnQueueOverflow.render()}
				${this.#layout.notifyOnTasksInProgressOverflow.render()}
				${this.#layout.notifyWhenEfficiencyDecreases.render()}
				<div class="tasks-flow__create-separator"></div>
				${this.#renderAnalyticsStub()}
			</form>
		`;
			main_core.Event.bind(this.#layout.controlPageForm, 'change', this.#params.onChangeHandler);
			return this.#layout.controlPageForm;
		}
		#renderAnalyticsStub() {
			return main_core.Tag.render`
			<div class="tasks-flow__create_analytics-stub">
				<span>${main_core.Loc.getMessage('TASKS_FLOW_EDIT_FORM_ANALYTICS_STUB_LABEL')}</span>
				<span class="tasks-flow__create_analytics-stub-label ui-label ui-label-primary ui-label-fill">
					<span class="ui-label-inner">
						${main_core.Loc.getMessage('TASKS_FLOW_EDIT_FORM_ANALYTICS_STUB_BUTTON')}
					</span>
				</span>
			</div>
		`;
		}
	}

	var nm = "Atom/Torrent animation 6";
	var v = "5.9.6";
	var fr = 60;
	var ip = 0;
	var op = 239;
	var w = 220;
	var h = 220;
	var ddd = 0;
	var markers = [
	];
	var assets = [
		{
			nm: "[FRAME] Atom/Torrent animation 6 - Null / Vector - Null / Vector / Vector - Null / Vector / body - Null / body / Star 4 - Null / Star 4 / Star 2 - Null / Star 2 / Star 1 - Null / Star 1 / Star 3 - Null / Star 3",
			fr: 60,
			id: "lvc7ui4o20a2e3j8",
			layers: [
				{
					ty: 3,
					ddd: 0,
					ind: 4,
					hd: false,
					nm: "Atom/Torrent animation 6 - Null",
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					st: 0,
					ip: 0,
					op: 240,
					bm: 0,
					sr: 1
				},
				{
					ty: 3,
					ddd: 0,
					ind: 5,
					hd: false,
					nm: "Vector - Null",
					parent: 4,
					ks: {
						a: {
							a: 0,
							k: [
								51.5,
								51.5
							]
						},
						o: {
							a: 1,
							k: [
								{
									t: 51.00000000000006,
									s: [
										1
									],
									o: {
										x: [
											0.5
										],
										y: [
											0.35
										]
									},
									i: {
										x: [
											0.15
										],
										y: [
											1
										]
									}
								},
								{
									t: 80.00000000000001,
									s: [
										0
									],
									o: {
										x: [
											0.5
										],
										y: [
											0.35
										]
									},
									i: {
										x: [
											0.15
										],
										y: [
											1
										]
									}
								},
								{
									t: 88.99999999999997,
									s: [
										0
									],
									o: {
										x: [
											0.5
										],
										y: [
											0.35
										]
									},
									i: {
										x: [
											0.15
										],
										y: [
											1
										]
									}
								},
								{
									t: 104.32713754646757,
									s: [
										0
									],
									o: {
										x: [
											0.5
										],
										y: [
											0.35
										]
									},
									i: {
										x: [
											0.15
										],
										y: [
											1
										]
									}
								},
								{
									t: 202.1338289962817,
									s: [
										100
									]
								}
							]
						},
						p: {
							a: 1,
							k: [
								{
									t: 104.32713754646757,
									s: [
										-18.499899999999997,
										109.5
									],
									o: {
										x: [
											0.5
										],
										y: [
											0.35
										]
									},
									i: {
										x: [
											0.15
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 202.1338289962817,
									s: [
										101.5001,
										109.5
									]
								}
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					st: 0,
					ip: 60,
					op: 240,
					bm: 0,
					sr: 1
				},
				{
					ty: 4,
					ddd: 0,
					ind: 6,
					hd: false,
					nm: "Vector",
					parent: 5,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 1,
							k: [
								{
									t: 51.00000000000006,
									s: [
										1
									],
									o: {
										x: [
											0.5
										],
										y: [
											0.35
										]
									},
									i: {
										x: [
											0.15
										],
										y: [
											1
										]
									}
								},
								{
									t: 80.00000000000001,
									s: [
										0
									],
									o: {
										x: [
											0.5
										],
										y: [
											0.35
										]
									},
									i: {
										x: [
											0.15
										],
										y: [
											1
										]
									}
								},
								{
									t: 88.99999999999997,
									s: [
										0
									],
									o: {
										x: [
											0.5
										],
										y: [
											0.35
										]
									},
									i: {
										x: [
											0.15
										],
										y: [
											1
										]
									}
								},
								{
									t: 104.32713754646757,
									s: [
										0
									],
									o: {
										x: [
											0.5
										],
										y: [
											0.35
										]
									},
									i: {
										x: [
											0.15
										],
										y: [
											1
										]
									}
								},
								{
									t: 202.1338289962817,
									s: [
										100
									]
								}
							]
						}
					},
					st: 0,
					ip: 60,
					op: 240,
					bm: 0,
					sr: 1,
					shapes: [
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 5,
							it: [
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													23.8604,
													92.5209
												],
												[
													23.8604,
													101.2021
												],
												[
													32.4925,
													101.2021
												],
												[
													49.1681,
													84.4316
												],
												[
													49.2122,
													84.3877
												],
												[
													51,
													80.0469
												],
												[
													49.2122,
													75.7061
												],
												[
													49.1681,
													75.6622
												],
												[
													32.3992,
													58.7981
												],
												[
													23.7671,
													58.7981
												],
												[
													23.7671,
													67.4793
												],
												[
													30.6598,
													74.4112
												],
												[
													6.1038,
													74.4112
												],
												[
													-1e-4,
													80.5497
												],
												[
													6.1038,
													86.6882
												],
												[
													29.66,
													86.6882
												],
												[
													23.8604,
													92.5209
												]
											],
											i: [
												[
													2.3836900000000014,
													-2.397260000000003
												],
												[
													-2.3837,
													-2.3972
												],
												[
													-2.3837,
													2.3973
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0.0001,
													1.5711
												],
												[
													1.1919,
													1.1987
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													2.3837,
													-2.3972
												],
												[
													-2.3837,
													-2.3972
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													-3.3902
												],
												[
													-3.3711,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											],
											o: [
												[
													-2.3836900000000014,
													2.397260000000003
												],
												[
													2.3837200000000003,
													2.3972299999999933
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													1.19191,
													-1.198679999999996
												],
												[
													0.00005000000000165983,
													-1.571070000000006
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													-2.383700000000001,
													-2.3972499999999997
												],
												[
													-2.3837100000000007,
													2.3972499999999997
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													-3.37107,
													0
												],
												[
													0,
													3.3902300000000025
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													23.8604,
													35.5209
												],
												[
													23.8604,
													44.2021
												],
												[
													32.4925,
													44.2021
												],
												[
													49.1681,
													27.4316
												],
												[
													49.2122,
													27.3877
												],
												[
													51,
													23.0469
												],
												[
													49.2122,
													18.7061
												],
												[
													49.1681,
													18.6622
												],
												[
													32.3992,
													1.7981
												],
												[
													23.7671,
													1.7981
												],
												[
													23.7671,
													10.4793
												],
												[
													30.6598,
													17.4112
												],
												[
													6.1038,
													17.4112
												],
												[
													-1e-4,
													23.5497
												],
												[
													6.1038,
													29.6882
												],
												[
													29.66,
													29.6882
												],
												[
													23.8604,
													35.5209
												]
											],
											i: [
												[
													2.3836900000000014,
													-2.397260000000003
												],
												[
													-2.3837,
													-2.3972
												],
												[
													-2.3837,
													2.3973
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0.0001,
													1.5711
												],
												[
													1.1919,
													1.1987
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													2.3837,
													-2.3972
												],
												[
													-2.3837,
													-2.3972
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													-3.3902
												],
												[
													-3.3711,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											],
											o: [
												[
													-2.3836900000000014,
													2.397260000000003
												],
												[
													2.3837100000000007,
													2.3972399999999965
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													1.19191,
													-1.1986799999999995
												],
												[
													0.00005000000000165983,
													-1.5710699999999989
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													-2.383700000000001,
													-2.39725
												],
												[
													-2.3837100000000007,
													2.3972500000000005
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													-3.37107,
													0
												],
												[
													0,
													3.390229999999999
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													75.8604,
													62.5209
												],
												[
													75.8604,
													71.2021
												],
												[
													84.4926,
													71.2021
												],
												[
													101.1682,
													54.4316
												],
												[
													101.2123,
													54.3877
												],
												[
													103.0001,
													50.0469
												],
												[
													101.2123,
													45.7061
												],
												[
													101.1682,
													45.6622
												],
												[
													84.3993,
													28.7981
												],
												[
													75.7671,
													28.7981
												],
												[
													75.7671,
													37.4793
												],
												[
													82.6598,
													44.4112
												],
												[
													58.1038,
													44.4112
												],
												[
													51.9999,
													50.5498
												],
												[
													58.1038,
													56.6883
												],
												[
													81.66,
													56.6883
												],
												[
													75.8604,
													62.5209
												]
											],
											i: [
												[
													2.3836900000000014,
													-2.397260000000003
												],
												[
													-2.3837,
													-2.3972
												],
												[
													-2.3837,
													2.3973
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0.0001,
													1.5711
												],
												[
													1.1919,
													1.1987
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													2.3837,
													-2.3972
												],
												[
													-2.3837,
													-2.3972
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													-3.3902
												],
												[
													-3.3711,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											],
											o: [
												[
													-2.3836900000000014,
													2.397260000000003
												],
												[
													2.3837199999999967,
													2.3972299999999933
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													1.1919100000000071,
													-1.198680000000003
												],
												[
													0.00005000000000165983,
													-1.5710699999999989
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													-2.3837000000000046,
													-2.3972499999999997
												],
												[
													-2.3837099999999936,
													2.3972499999999997
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													-3.371070000000003,
													0
												],
												[
													0,
													3.3902300000000025
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "fl",
									o: {
										a: 0,
										k: 100
									},
									c: {
										a: 0,
										k: [
											1,
											1,
											1,
											1
										]
									},
									nm: "Fill",
									hd: false,
									r: 1
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						}
					]
				},
				{
					ty: 3,
					ddd: 0,
					ind: 7,
					hd: false,
					nm: "Vector - Null",
					parent: 4,
					ks: {
						a: {
							a: 0,
							k: [
								51.5,
								51.5
							]
						},
						o: {
							a: 1,
							k: [
								{
									t: 104.57357324157103,
									s: [
										100
									],
									o: {
										x: [
											0.5
										],
										y: [
											0.35
										]
									},
									i: {
										x: [
											0.15
										],
										y: [
											1
										]
									}
								},
								{
									t: 202.3802646913852,
									s: [
										0
									]
								}
							]
						},
						p: {
							a: 1,
							k: [
								{
									t: 104.57357324157103,
									s: [
										101.5,
										109.5
									],
									o: {
										x: [
											0.5
										],
										y: [
											0.35
										]
									},
									i: {
										x: [
											0.15
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 202.3802646913852,
									s: [
										204.5,
										109.5
									]
								}
							]
						},
						r: {
							a: 1,
							k: [
								{
									t: 7.29014597838927,
									s: [
										0
									],
									o: {
										x: [
											0.42
										],
										y: [
											0
										]
									},
									i: {
										x: [
											1
										],
										y: [
											1
										]
									}
								},
								{
									t: 21.050521638831196,
									s: [
										-10
									],
									o: {
										x: [
											0
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.58
										],
										y: [
											1
										]
									}
								},
								{
									t: 44.731168124242885,
									s: [
										0
									]
								}
							]
						},
						s: {
							a: 1,
							k: [
								{
									t: 2.8996427101595734,
									s: [
										-0.1,
										-0.1
									],
									o: {
										x: [
											0.5
										],
										y: [
											0.35
										]
									},
									i: {
										x: [
											0.15
										],
										y: [
											1
										]
									}
								},
								{
									t: 41.90876574164156,
									s: [
										100,
										100
									],
									o: {
										x: [
											0
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.15
										],
										y: [
											1
										]
									}
								},
								{
									t: 53.96477032050418,
									s: [
										100,
										100
									],
									o: {
										x: [
											0.42
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.58
										],
										y: [
											1
										]
									}
								},
								{
									t: 61.36616958252654,
									s: [
										110.00000000000001,
										110.00000000000001
									],
									o: {
										x: [
											0.42
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.58
										],
										y: [
											1
										]
									}
								},
								{
									t: 76.16907992324106,
									s: [
										100,
										100
									]
								}
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					st: 0,
					ip: 0,
					op: 240,
					bm: 0,
					sr: 1
				},
				{
					ty: 4,
					ddd: 0,
					ind: 8,
					hd: false,
					nm: "Vector",
					parent: 7,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 1,
							k: [
								{
									t: 104.57357324157103,
									s: [
										100
									],
									o: {
										x: [
											0.5
										],
										y: [
											0.35
										]
									},
									i: {
										x: [
											0.15
										],
										y: [
											1
										]
									}
								},
								{
									t: 202.3802646913852,
									s: [
										0
									]
								}
							]
						}
					},
					st: 0,
					ip: 0,
					op: 240,
					bm: 0,
					sr: 1,
					shapes: [
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 5,
							it: [
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													23.8604,
													92.5209
												],
												[
													23.8604,
													101.2021
												],
												[
													32.4925,
													101.2021
												],
												[
													49.1681,
													84.4316
												],
												[
													49.2122,
													84.3877
												],
												[
													51,
													80.0469
												],
												[
													49.2122,
													75.7061
												],
												[
													49.1681,
													75.6622
												],
												[
													32.3992,
													58.7981
												],
												[
													23.7671,
													58.7981
												],
												[
													23.7671,
													67.4793
												],
												[
													30.6598,
													74.4112
												],
												[
													6.1038,
													74.4112
												],
												[
													-1e-4,
													80.5497
												],
												[
													6.1038,
													86.6882
												],
												[
													29.66,
													86.6882
												],
												[
													23.8604,
													92.5209
												]
											],
											i: [
												[
													2.3836900000000014,
													-2.397260000000003
												],
												[
													-2.3837,
													-2.3972
												],
												[
													-2.3837,
													2.3973
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0.0001,
													1.5711
												],
												[
													1.1919,
													1.1987
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													2.3837,
													-2.3972
												],
												[
													-2.3837,
													-2.3972
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													-3.3902
												],
												[
													-3.3711,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											],
											o: [
												[
													-2.3836900000000014,
													2.397260000000003
												],
												[
													2.3837200000000003,
													2.3972299999999933
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													1.19191,
													-1.198679999999996
												],
												[
													0.00005000000000165983,
													-1.571070000000006
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													-2.383700000000001,
													-2.3972499999999997
												],
												[
													-2.3837100000000007,
													2.3972499999999997
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													-3.37107,
													0
												],
												[
													0,
													3.3902300000000025
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													23.8604,
													35.5209
												],
												[
													23.8604,
													44.2021
												],
												[
													32.4925,
													44.2021
												],
												[
													49.1681,
													27.4316
												],
												[
													49.2122,
													27.3877
												],
												[
													51,
													23.0469
												],
												[
													49.2122,
													18.7061
												],
												[
													49.1681,
													18.6622
												],
												[
													32.3992,
													1.7981
												],
												[
													23.7671,
													1.7981
												],
												[
													23.7671,
													10.4793
												],
												[
													30.6598,
													17.4112
												],
												[
													6.1038,
													17.4112
												],
												[
													-1e-4,
													23.5497
												],
												[
													6.1038,
													29.6882
												],
												[
													29.66,
													29.6882
												],
												[
													23.8604,
													35.5209
												]
											],
											i: [
												[
													2.3836900000000014,
													-2.397260000000003
												],
												[
													-2.3837,
													-2.3972
												],
												[
													-2.3837,
													2.3973
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0.0001,
													1.5711
												],
												[
													1.1919,
													1.1987
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													2.3837,
													-2.3972
												],
												[
													-2.3837,
													-2.3972
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													-3.3902
												],
												[
													-3.3711,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											],
											o: [
												[
													-2.3836900000000014,
													2.397260000000003
												],
												[
													2.3837100000000007,
													2.3972399999999965
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													1.19191,
													-1.1986799999999995
												],
												[
													0.00005000000000165983,
													-1.5710699999999989
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													-2.383700000000001,
													-2.39725
												],
												[
													-2.3837100000000007,
													2.3972500000000005
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													-3.37107,
													0
												],
												[
													0,
													3.390229999999999
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													75.8604,
													62.5209
												],
												[
													75.8604,
													71.2021
												],
												[
													84.4926,
													71.2021
												],
												[
													101.1682,
													54.4316
												],
												[
													101.2123,
													54.3877
												],
												[
													103.0001,
													50.0469
												],
												[
													101.2123,
													45.7061
												],
												[
													101.1682,
													45.6622
												],
												[
													84.3993,
													28.7981
												],
												[
													75.7671,
													28.7981
												],
												[
													75.7671,
													37.4793
												],
												[
													82.6598,
													44.4112
												],
												[
													58.1038,
													44.4112
												],
												[
													51.9999,
													50.5498
												],
												[
													58.1038,
													56.6883
												],
												[
													81.66,
													56.6883
												],
												[
													75.8604,
													62.5209
												]
											],
											i: [
												[
													2.3836900000000014,
													-2.397260000000003
												],
												[
													-2.3837,
													-2.3972
												],
												[
													-2.3837,
													2.3973
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0.0001,
													1.5711
												],
												[
													1.1919,
													1.1987
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													2.3837,
													-2.3972
												],
												[
													-2.3837,
													-2.3972
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													-3.3902
												],
												[
													-3.3711,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											],
											o: [
												[
													-2.3836900000000014,
													2.397260000000003
												],
												[
													2.3837199999999967,
													2.3972299999999933
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													1.1919100000000071,
													-1.198680000000003
												],
												[
													0.00005000000000165983,
													-1.5710699999999989
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													-2.3837000000000046,
													-2.3972499999999997
												],
												[
													-2.3837099999999936,
													2.3972499999999997
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													-3.371070000000003,
													0
												],
												[
													0,
													3.3902300000000025
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "fl",
									o: {
										a: 0,
										k: 100
									},
									c: {
										a: 0,
										k: [
											1,
											1,
											1,
											1
										]
									},
									nm: "Fill",
									hd: false,
									r: 1
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						}
					]
				},
				{
					ty: 3,
					ddd: 0,
					ind: 9,
					hd: false,
					nm: "body - Null",
					parent: 4,
					ks: {
						a: {
							a: 0,
							k: [
								69.5,
								88
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								109.5,
								110
							]
						},
						r: {
							a: 1,
							k: [
								{
									t: 5.6945823033230925,
									s: [
										0
									],
									o: {
										x: [
											0.42
										],
										y: [
											0
										]
									},
									i: {
										x: [
											1
										],
										y: [
											1
										]
									}
								},
								{
									t: 29.809357570137365,
									s: [
										-10
									],
									o: {
										x: [
											0
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.58
										],
										y: [
											1
										]
									}
								},
								{
									t: 50.37784235653768,
									s: [
										0
									]
								}
							]
						},
						s: {
							a: 1,
							k: [
								{
									t: 5.297397769516729,
									s: [
										-0.1,
										-0.1
									],
									o: {
										x: [
											0
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.58
										],
										y: [
											1
										]
									}
								},
								{
									t: 29.981583898275588,
									s: [
										120,
										120
									],
									o: {
										x: [
											0.42
										],
										y: [
											0
										]
									},
									i: {
										x: [
											1
										],
										y: [
											1
										]
									}
								},
								{
									t: 45.48678969930097,
									s: [
										98.3,
										98.3
									],
									o: {
										x: [
											0
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.15
										],
										y: [
											1
										]
									}
								},
								{
									t: 53.23169097805378,
									s: [
										100,
										100
									],
									o: {
										x: [
											0.42
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.58
										],
										y: [
											1
										]
									}
								},
								{
									t: 61.11602962079405,
									s: [
										110.00000000000001,
										110.00000000000001
									],
									o: {
										x: [
											0.42
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.58
										],
										y: [
											1
										]
									}
								},
								{
									t: 76.64631529194739,
									s: [
										100,
										100
									]
								}
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					st: 0,
					ip: 0,
					op: 240,
					bm: 0,
					sr: 1
				},
				{
					ty: 4,
					ddd: 0,
					ind: 10,
					hd: false,
					nm: "body",
					parent: 9,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 0,
							k: 100
						}
					},
					st: 0,
					ip: 0,
					op: 240,
					bm: 0,
					sr: 1,
					shapes: [
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 3,
							it: [
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													10.8665,
													175.8877
												],
												[
													11.4452,
													175.8977
												],
												[
													36.6261,
													174.0583
												],
												[
													52.7435,
													161.0347
												],
												[
													98.8385,
													125.9712
												],
												[
													129.1684,
													122.522
												],
												[
													138.9999,
													112.1049
												],
												[
													138.9999,
													59.0294
												],
												[
													129.3847,
													48.6865
												],
												[
													96.7109,
													45.6381
												],
												[
													44.5985,
													7.1959
												],
												[
													39.1445,
													2.4422
												],
												[
													10.3445,
													0.217
												],
												[
													0,
													10.8502
												],
												[
													0,
													165.5001
												],
												[
													10.8665,
													175.8878
												],
												[
													10.8665,
													175.8877
												]
											],
											i: [
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													-3.7034,
													2.2119
												],
												[
													-8.0917,
													6.7356
												],
												[
													-5.9864,
													1.6766
												],
												[
													-9.9496,
													0.6611
												],
												[
													0,
													5.5087
												],
												[
													0,
													0
												],
												[
													5.4197,
													0.4171
												],
												[
													7.8681,
													1.0572
												],
												[
													12.6448,
													11.1886
												],
												[
													0.8537,
													0.6831
												],
												[
													11.0574,
													-0.3576
												],
												[
													-0.0128,
													-5.7145
												],
												[
													0,
													0
												],
												[
													-5.7736,
													-0.0997
												],
												[
													0,
													0
												]
											],
											o: [
												[
													0,
													0
												],
												[
													10.528860000000002,
													0.1826199999999858
												],
												[
													1.6698200000000014,
													-0.9973099999999988
												],
												[
													16.462159999999997,
													-13.703329999999994
												],
												[
													5.679019999999994,
													-1.5904699999999963
												],
												[
													5.508029999999991,
													-0.36597000000000435
												],
												[
													0,
													0
												],
												[
													0,
													-5.424399999999999
												],
												[
													-9.851460000000003,
													-0.7580999999999989
												],
												[
													-10.218859999999992,
													-1.3730899999999977
												],
												[
													-2.6704599999999985,
													-2.3629300000000004
												],
												[
													-3.5646599999999964,
													-2.85253
												],
												[
													-5.72348,
													0.18510000000000001
												],
												[
													0,
													0
												],
												[
													0.01287,
													5.762349999999998
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "fl",
									o: {
										a: 1,
										k: [
											{
												t: 18.645635137794528,
												s: [
													100
												],
												o: {
													x: [
														0.5
													],
													y: [
														0.35
													]
												},
												i: {
													x: [
														0.15
													],
													y: [
														1
													]
												}
											},
											{
												t: 25.028958002539536,
												s: [
													100
												],
												o: {
													x: [
														0.5
													],
													y: [
														0.35
													]
												},
												i: {
													x: [
														0.15
													],
													y: [
														1
													]
												}
											},
											{
												t: 33.894684203574144,
												s: [
													100
												],
												o: {
													x: [
														0.5
													],
													y: [
														0.35
													]
												},
												i: {
													x: [
														0.15
													],
													y: [
														1
													]
												}
											},
											{
												t: 57.65483042234692,
												s: [
													100
												],
												o: {
													x: [
														0.5
													],
													y: [
														0.35
													]
												},
												i: {
													x: [
														0.15
													],
													y: [
														1
													]
												}
											},
											{
												t: 77.86868616070589,
												s: [
													100
												],
												o: {
													x: [
														0.5
													],
													y: [
														0.35
													]
												},
												i: {
													x: [
														0.15
													],
													y: [
														1
													]
												}
											},
											{
												t: 83.54275092936804,
												s: [
													100
												]
											}
										]
									},
									c: {
										a: 1,
										k: [
											{
												t: 18.645635137794528,
												s: [
													0.1450980392156863,
													0.6862745098039216,
													0.9607843137254902,
													1
												],
												o: {
													x: [
														0.5
													],
													y: [
														0.35
													]
												},
												i: {
													x: [
														0.15
													],
													y: [
														1
													]
												}
											},
											{
												t: 25.028958002539536,
												s: [
													0.13333333333333333,
													0.7411764705882353,
													0.9607843137254902,
													1
												],
												o: {
													x: [
														0.5
													],
													y: [
														0.35
													]
												},
												i: {
													x: [
														0.15
													],
													y: [
														1
													]
												}
											},
											{
												t: 33.894684203574144,
												s: [
													0.1450980392156863,
													0.6862745098039216,
													0.9607843137254902,
													1
												],
												o: {
													x: [
														0.5
													],
													y: [
														0.35
													]
												},
												i: {
													x: [
														0.15
													],
													y: [
														1
													]
												}
											},
											{
												t: 57.65483042234692,
												s: [
													0.1450980392156863,
													0.6862745098039216,
													0.9607843137254902,
													1
												],
												o: {
													x: [
														0.5
													],
													y: [
														0.35
													]
												},
												i: {
													x: [
														0.15
													],
													y: [
														1
													]
												}
											},
											{
												t: 77.86868616070589,
												s: [
													0.13333333333333333,
													0.7411764705882353,
													0.9607843137254902,
													1
												],
												o: {
													x: [
														0.5
													],
													y: [
														0.35
													]
												},
												i: {
													x: [
														0.15
													],
													y: [
														1
													]
												}
											},
											{
												t: 83.54275092936804,
												s: [
													0.1450980392156863,
													0.6862745098039216,
													0.9607843137254902,
													1
												]
											}
										]
									},
									nm: "Fill",
									hd: false,
									r: 2
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						}
					]
				},
				{
					ty: 3,
					ddd: 0,
					ind: 11,
					hd: false,
					nm: "Star 4 - Null",
					parent: 4,
					ks: {
						a: {
							a: 0,
							k: [
								20,
								20
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 1,
							k: [
								{
									t: 63.00000000000006,
									s: [
										109,
										135
									],
									o: {
										x: [
											0.42
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.58
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 86.87219933688343,
									s: [
										164,
										186
									]
								}
							]
						},
						r: {
							a: 1,
							k: [
								{
									t: 104.54275092936804,
									s: [
										0
									],
									o: {
										x: [
											0.42
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.58
										],
										y: [
											1
										]
									}
								},
								{
									t: 151.13943138384246,
									s: [
										-45
									],
									o: {
										x: [
											0.42
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.58
										],
										y: [
											1
										]
									}
								},
								{
									t: 201.84758364312282,
									s: [
										0
									]
								}
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					st: 0,
					ip: 60,
					op: 240,
					bm: 0,
					sr: 1
				},
				{
					ty: 4,
					ddd: 0,
					ind: 12,
					hd: false,
					nm: "Star 4",
					parent: 11,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 0,
							k: 100
						}
					},
					st: 0,
					ip: 60,
					op: 240,
					bm: 0,
					sr: 1,
					shapes: [
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 3,
							it: [
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													20,
													0
												],
												[
													16.606,
													16.606
												],
												[
													0,
													20
												],
												[
													16.606,
													23.394
												],
												[
													20,
													40
												],
												[
													23.394,
													23.394
												],
												[
													40,
													20
												],
												[
													23.394,
													16.606
												],
												[
													20,
													0
												]
											],
											i: [
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											],
											o: [
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "fl",
									o: {
										a: 0,
										k: 100
									},
									c: {
										a: 0,
										k: [
											0.18823529411764706,
											0.7843137254901961,
											0.9725490196078431,
											1
										]
									},
									nm: "Fill",
									hd: false,
									r: 1
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						}
					]
				},
				{
					ty: 3,
					ddd: 0,
					ind: 13,
					hd: false,
					nm: "Star 2 - Null",
					parent: 4,
					ks: {
						a: {
							a: 0,
							k: [
								11,
								11
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 1,
							k: [
								{
									t: 63.00000000000006,
									s: [
										94,
										65
									],
									o: {
										x: [
											0.42
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.58
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 87.00000000000006,
									s: [
										133,
										22
									]
								}
							]
						},
						r: {
							a: 1,
							k: [
								{
									t: 104.54275092936804,
									s: [
										0
									],
									o: {
										x: [
											0.42
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.58
										],
										y: [
											1
										]
									}
								},
								{
									t: 151.13943138384246,
									s: [
										-45
									],
									o: {
										x: [
											0.42
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.58
										],
										y: [
											1
										]
									}
								},
								{
									t: 201.84758364312282,
									s: [
										0
									]
								}
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					st: 0,
					ip: 60,
					op: 240,
					bm: 0,
					sr: 1
				},
				{
					ty: 4,
					ddd: 0,
					ind: 14,
					hd: false,
					nm: "Star 2",
					parent: 13,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 0,
							k: 100
						}
					},
					st: 0,
					ip: 60,
					op: 240,
					bm: 0,
					sr: 1,
					shapes: [
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 3,
							it: [
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													11,
													0
												],
												[
													9.1333,
													9.1333
												],
												[
													0,
													11
												],
												[
													9.1333,
													12.8667
												],
												[
													11,
													22
												],
												[
													12.8667,
													12.8667
												],
												[
													22,
													11
												],
												[
													12.8667,
													9.1333
												],
												[
													11,
													0
												]
											],
											i: [
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											],
											o: [
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "fl",
									o: {
										a: 0,
										k: 100
									},
									c: {
										a: 0,
										k: [
											0.1568627450980392,
											0.6549019607843137,
											0.9882352941176471,
											1
										]
									},
									nm: "Fill",
									hd: false,
									r: 1
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						}
					]
				},
				{
					ty: 3,
					ddd: 0,
					ind: 15,
					hd: false,
					nm: "Star 1 - Null",
					parent: 4,
					ks: {
						a: {
							a: 0,
							k: [
								10,
								10
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 1,
							k: [
								{
									t: 63.00000000000006,
									s: [
										58,
										183
									],
									o: {
										x: [
											0.42
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.58
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 87.00000000000006,
									s: [
										19,
										147
									]
								}
							]
						},
						r: {
							a: 1,
							k: [
								{
									t: 104.54275092936804,
									s: [
										0
									],
									o: {
										x: [
											0.42
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.58
										],
										y: [
											1
										]
									}
								},
								{
									t: 149.76894078224015,
									s: [
										45
									],
									o: {
										x: [
											0.42
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.58
										],
										y: [
											1
										]
									}
								},
								{
									t: 201.84758364312282,
									s: [
										0
									]
								}
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					st: 0,
					ip: 60,
					op: 240,
					bm: 0,
					sr: 1
				},
				{
					ty: 4,
					ddd: 0,
					ind: 16,
					hd: false,
					nm: "Star 1",
					parent: 15,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 0,
							k: 100
						}
					},
					st: 0,
					ip: 60,
					op: 240,
					bm: 0,
					sr: 1,
					shapes: [
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 3,
							it: [
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													10,
													0
												],
												[
													8.303,
													8.303
												],
												[
													0,
													10
												],
												[
													8.303,
													11.697
												],
												[
													10,
													20
												],
												[
													11.697,
													11.697
												],
												[
													20,
													10
												],
												[
													11.697,
													8.303
												],
												[
													10,
													0
												]
											],
											i: [
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											],
											o: [
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "fl",
									o: {
										a: 0,
										k: 100
									},
									c: {
										a: 0,
										k: [
											0.16862745098039217,
											0.7098039215686275,
											0.9803921568627451,
											1
										]
									},
									nm: "Fill",
									hd: false,
									r: 1
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						}
					]
				},
				{
					ty: 3,
					ddd: 0,
					ind: 17,
					hd: false,
					nm: "Star 3 - Null",
					parent: 4,
					ks: {
						a: {
							a: 0,
							k: [
								16,
								16
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 1,
							k: [
								{
									t: 63.00000000000006,
									s: [
										130,
										87
									],
									o: {
										x: [
											0.42
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.58
										],
										y: [
											1
										]
									},
									ti: [
										0,
										0
									],
									to: [
										0,
										0
									]
								},
								{
									t: 87.74540339596109,
									s: [
										188,
										42
									]
								}
							]
						},
						r: {
							a: 1,
							k: [
								{
									t: 104.54275092936804,
									s: [
										0
									],
									o: {
										x: [
											0.42
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.58
										],
										y: [
											1
										]
									}
								},
								{
									t: 149.76894078224015,
									s: [
										45
									],
									o: {
										x: [
											0.42
										],
										y: [
											0
										]
									},
									i: {
										x: [
											0.58
										],
										y: [
											1
										]
									}
								},
								{
									t: 201.84758364312282,
									s: [
										0
									]
								}
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					st: 0,
					ip: 60,
					op: 240,
					bm: 0,
					sr: 1
				},
				{
					ty: 4,
					ddd: 0,
					ind: 18,
					hd: false,
					nm: "Star 3",
					parent: 17,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 0,
							k: 100
						}
					},
					st: 0,
					ip: 60,
					op: 240,
					bm: 0,
					sr: 1,
					shapes: [
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 3,
							it: [
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													16,
													0
												],
												[
													13.2848,
													13.2848
												],
												[
													0,
													16
												],
												[
													13.2848,
													18.7152
												],
												[
													16,
													32
												],
												[
													18.7152,
													18.7152
												],
												[
													32,
													16
												],
												[
													18.7152,
													13.2848
												],
												[
													16,
													0
												]
											],
											i: [
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											],
											o: [
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "fl",
									o: {
										a: 0,
										k: 100
									},
									c: {
										a: 0,
										k: [
											0.18823529411764706,
											0.7843137254901961,
											0.9725490196078431,
											1
										]
									},
									nm: "Fill",
									hd: false,
									r: 1
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						}
					]
				}
			]
		}
	];
	var layers = [
		{
			ddd: 0,
			ind: 1,
			ty: 0,
			nm: "Atom/Torrent animation 6",
			refId: "lvc7ui4o20a2e3j8",
			sr: 1,
			ks: {
				a: {
					a: 0,
					k: [
						0,
						0
					]
				},
				p: {
					a: 0,
					k: [
						0,
						0
					]
				},
				s: {
					a: 0,
					k: [
						100,
						100
					]
				},
				sk: {
					a: 0,
					k: 0
				},
				sa: {
					a: 0,
					k: 0
				},
				r: {
					a: 0,
					k: 0
				},
				o: {
					a: 0,
					k: 100
				}
			},
			ao: 0,
			w: 220,
			h: 220,
			ip: 0,
			op: 240,
			st: 0,
			hd: false,
			bm: 0
		}
	];
	var meta = {
		a: "",
		d: "",
		tc: "",
		g: "Aninix"
	};
	var flowfLottieIconInfo = {
		nm: nm,
		v: v,
		fr: fr,
		ip: ip,
		op: op,
		w: w,
		h: h,
		ddd: ddd,
		markers: markers,
		assets: assets,
		layers: layers,
		meta: meta
	};

	const SLIDER_WIDTH = 692;
	const HELPDESK_ARTICLE = 21272066;
	class EditForm extends main_core_events.EventEmitter {
		static #isOpen = false;
		#params;
		#layout;
		#wizard;
		#pages;
		#finishButton;
		#saveChangesButton;
		#flow;
		#flowInitial;
		#flowLottieAnimation = null;
		#lottieIconContainer;
		#pageChanging = false;
		#isCloseConfirmed = false;
		constructor(params = {}) {
			super(params);
			this.setEventNamespace('BX.Tasks.Flow.EditForm');
			this.#params = params;
			this.#layout = {};
			this.#flowLottieAnimation = null;
			this.#lottieIconContainer = null;
			const onChangeHandler = this.#onChangeHandler.bind(this);
			this.#pages = [new AboutPage({
				onChangeHandler
			}), new SettingsPage({
				onChangeHandler
			}), new ControlPage({
				onChangeHandler
			})];
			const initFlowData = {
				notifyAtHalfTime: true,
				responsibleCanChangeDeadline: false,
				taskControl: true,
				notifyOnQueueOverflow: 50,
				notifyOnTasksInProgressOverflow: 50,
				notifyWhenEfficiencyDecreases: 70,
				taskCreators: [['meta-user', 'all-users']]
			};
			if (this.#params.flowName) {
				initFlowData.name = this.#params.flowName;
			}
			if (main_core.Type.isNumber(this.#params.groupId) && this.#params.groupId > 0) {
				initFlowData.groupId = this.#params.groupId;
			}
			this.#flow = this.#getFlow(initFlowData);
		}
		static isActive() {
			return EditForm.#isOpen;
		}
		static async createInstance(params = {}) {
			if (EditForm.#isOpen) {
				return null;
			}
			EditForm.#isOpen = true;
			try {
				const extension = await top.BX.Runtime.loadExtension('tasks.flow.edit-form');
				const instance = new extension.EditForm(params);
				instance.openInSlider();
				return instance;
			} catch (error) {
				EditForm.#isOpen = false;
				throw error;
			}
		}
		openInSlider() {
			const sidePanelId = `tasks-flow-create-slider-${main_core.Text.getRandom()}`;
			BX.SidePanel.Instance.open(sidePanelId, {
				cacheable: true,
				contentCallback: async slider => {
					this.slider = slider;
					const {
						data: noAccess
					} = await main_core.ajax.runAction('tasks.flow.View.Access.check', {
						data: {
							flowId: this.#flow.id > 0 ? this.#flow.id : 0,
							context: this.#params.context ?? 'flows_grid',
							demoFlow: this.#params.demoFlow,
							guideFlow: this.#params.guideFlow
						}
					});
					if (noAccess !== null) {
						return main_core.Tag.render`${noAccess.html}`;
					}
					if (this.#flow.id > 0) {
						const {
							data: flowData
						} = await main_core.ajax.runAction('tasks.flow.Flow.get', {
							data: {
								flowId: this.#flow.id
							}
						});
						this.#flow = this.#getFlow(flowData);
					}
					this.#pages.forEach(page => page.setFlow(this.#flow));
					this.#flowInitial = structuredClone(this.#flow);
					return this.#render();
				},
				width: SLIDER_WIDTH,
				events: {
					onLoad: event => {
						const aboutPage = this.#pages.find(page => page.getId() === 'about-flow');
						aboutPage.focusToEmptyName();
						requestAnimationFrame(() => {
							this.#wizard.initHints();
						});
					},
					onClose: event => {
						this.#onCloseHandler(event);
						if (event.isActionAllowed()) {
							EditForm.#isOpen = false;
						}
					}
				}
			});
		}
		#render() {
			return main_core.Tag.render`
			<div class="tasks-flow__create">
				${this.#renderHeader()}
				${this.#renderWizard()}
			</div>
		`;
		}
		#renderHeader() {
			const title = main_core.Loc.getMessage(this.#flow.id ? 'TASKS_FLOW_EDIT_FORM_HEADER_TITLE_EDIT' : 'TASKS_FLOW_EDIT_FORM_HEADER_TITLE');
			const subTitle = main_core.Loc.getMessage(this.#flow.id ? 'TASKS_FLOW_EDIT_FORM_HEADER_SUBTITLE' : 'TASKS_FLOW_EDIT_FORM_HEADER_SUBTITLE_CREATE');
			return main_core.Tag.render`
			<div class="ui-slider-section ui-slider-section-icon-center --rounding --icon-sm">
				<span class="tasks-flow__create-header_icon ui-icon ui-slider-icon"></span>
				<div class="ui-slider-content-box">
					<div class="ui-slider-heading-2">${title}</div>
					<div class="ui-slider-inner-box">
						<p class="ui-slider-paragraph-2">
							${subTitle}
						</p>
					</div>
				</div>
			</div>
		`;
		}
		#renderWizard() {
			this.#wizard = new tasks_wizard.Wizard({
				steps: this.#pages.map(page => ({
					id: page.getId(),
					title: page.getTitle(),
					content: page.render(),
					isFilled: () => !this.#hasIncorrectData(page.getRequiredData())
				})),
				onCancel: () => this.slider.close(false, () => this.slider.destroy()),
				onDisabledContinueButtonClick: this.#showErrors.bind(this),
				onContinueHandler: this.#onContinueHandler.bind(this),
				finishButton: this.#getFinishButton(),
				saveChangesButton: this.#getSaveChangesButton(),
				article: HELPDESK_ARTICLE
			});
			return this.#wizard.render();
		}
		#saveChangesAction() {
			const isEdit = this.#flow.id > 0;
			if (!isEdit || this.#flow.demo) {
				return null;
			}
			return this.#saveFlowAction();
		}
		#getFinishButton() {
			this.#finishButton ??= new ui_buttons.Button({
				text: main_core.Loc.getMessage(this.#flow.id ? 'TASKS_FLOW_EDIT_FORM_SAVE_FLOW' : 'TASKS_FLOW_EDIT_FORM_CREATE_FLOW'),
				color: ui_buttons.Button.Color.PRIMARY,
				round: true,
				size: ui_buttons.Button.Size.LARGE,
				onclick: () => this.#saveFlowAction()
			});
			return this.#finishButton;
		}
		#getSaveChangesButton() {
			if (!this.#flow.id || this.#flow.demo) {
				return null;
			}
			this.#saveChangesButton ??= new ui_buttons.Button({
				text: main_core.Loc.getMessage('TASKS_FLOW_EDIT_FORM_SAVE_CHANGES'),
				color: ui_buttons.Button.Color.SUCCESS,
				round: true,
				size: BX.UI.Button.Size.LARGE,
				onclick: () => this.#saveChangesAction()
			});
			return this.#saveChangesButton;
		}
		#onChangeHandler() {
			this.#flow = this.#getFlow();
			this.#pages.forEach(page => page.update());
			this.#wizard.update();
		}
		#onCloseHandler(event) {
			if (this.#isCloseConfirmed || !this.#isDataChanged()) {
				return;
			}
			event.denyAction();
			ui_dialogs_messagebox.MessageBox.show({
				useAirDesign: true,
				title: main_core.Loc.getMessage('TASKS_FLOW_EDIT_FORM_ONCLOSE_POPUP_TITLE'),
				message: main_core.Loc.getMessage('TASKS_FLOW_EDIT_FORM_ONCLOSE_POPUP_MESSAGE'),
				buttons: ui_dialogs_messagebox.MessageBoxButtons.OK_CANCEL,
				okCaption: main_core.Loc.getMessage('TASKS_FLOW_EDIT_FORM_ONCLOSE_POPUP_OK_CAPTION'),
				onOk: dialog => {
					dialog.close();
					this.#wizard.hideHints();
					this.emit('afterClose');
					this.#isCloseConfirmed = true;
					this.slider.close();
				}
			});
		}
		#isDataChanged() {
			return JSON.stringify(this.#getFlow()) !== JSON.stringify(this.#flowInitial);
		}
		#saveFlowAction() {
			if (this.#hasIncorrectData()) {
				this.#showErrors();
				return;
			}
			if (this.#saveChangesButton?.isDisabled() || this.#finishButton?.isDisabled()) {
				return;
			}
			this.#saveChangesButton?.setState(ui_buttons.ButtonState.DISABLED);
			this.#finishButton?.setState(ui_buttons.ButtonState.DISABLED);
			const flowData = Object.fromEntries(Object.entries(this.#getFlow()).map(([key, value]) => [key, main_core.Type.isBoolean(value) ? value ? 1 : 0 : value]));
			const action = flowData.id ? 'update' : 'create';
			const textNotification = flowData.id ? 'TASKS_FLOW_EDIT_FORM_FLOW_UPDATE' : 'TASKS_FLOW_EDIT_FORM_FLOW_CREATE';
			main_core.ajax.runAction(`tasks.flow.Flow.${flowData.demo ? 'activateDemo' : action}`, {
				data: {
					flowData,
					analyticsParams: {
						guideFlow: this.#params.guideFlow ?? 'N',
						context: this.#params.context ?? 'flows_grid'
					}
				}
			}).then(response => {
				if (response.status === 'success') {
					const flowData = response.data;
					this.emit('afterSave', flowData);
					this.#isCloseConfirmed = true;
					this.slider.close(false, () => {
						if (flowData.trialFeatureEnabled) {
							this.#showDemoInfo();
						}
						this.slider.destroy();
					});
					BX.UI.Notification.Center.notify({
						content: main_core.Loc.getMessage(textNotification),
						width: 'auto'
					});
				}
			}, error => {
				this.#saveChangesButton?.setState(null);
				this.#finishButton?.setState(null);
				alert(error.errors.map(e => e.message).join('\n'));
			});
		}
		#showErrors() {
			const incorrectData = this.#getIncorrectData();
			this.#pages.forEach(page => page.showErrors(incorrectData));
		}
		#showDemoInfo() {
			const popup = new main_popup.Popup({
				id: 'tasks-flow-task-demo-info',
				className: 'tasks-flow__task-demo-info',
				width: 620,
				overlay: true,
				padding: 48,
				closeIcon: true,
				content: this.#renderDemoInfoContent(),
				events: {
					onFirstShow: baseEvent => {
						this.#bindStartWorkBtn(baseEvent.getTarget());
					}
				}
			});
			popup.show();
		}
		#renderDemoInfoContent() {
			return main_core.Tag.render`
			<div class="tasks-flow__task-demo-info_wrapper">
				<div class="tasks-flow__task-demo-info_content">
					<div class="tasks-flow__task-demo-info_title">
						${main_core.Loc.getMessage('TASKS_FLOW_EDIT_FORM_DEMO_INFO_TITLE_1')}
					</div>
					<div class="tasks-flow__task-demo-info_text">
						${main_core.Loc.getMessage('TASKS_FLOW_EDIT_FORM_DEMO_INFO_TEXT_1')}
					</div>
					<div class="tasks-flow__task-demo-info_text-trial">
						${main_core.Loc.getMessage('TASKS_FLOW_EDIT_FORM_DEMO_INFO_TEXT_TRIAL_1')}
					</div>
					<div class="ui-btn ui-btn-sm ui-btn-primary ui-btn-round ui-btn-no-caps">
						${main_core.Loc.getMessage('TASKS_FLOW_EDIT_FORM_DEMO_INFO_BTN_1')}
					</div>
				</div>
				${this.#getLottieIconContainer()}
			</div>
		`;
		}
		#getLottieIconContainer() {
			if (!this.#lottieIconContainer) {
				this.#lottieIconContainer = main_core.Tag.render`
				<div class="tasks-flow__task-demo-info_image"></div>
			`;
				this.#flowLottieAnimation = ui_lottie.Lottie.loadAnimation({
					container: this.#lottieIconContainer,
					renderer: 'svg',
					loop: false,
					animationData: flowfLottieIconInfo
				});
			}
			return this.#lottieIconContainer;
		}
		#bindStartWorkBtn(popup) {
			const popupContainer = popup.getContentContainer();
			if (main_core.Type.isDomNode(popupContainer)) {
				const btnNode = popup.getContentContainer().querySelector('.ui-btn');
				if (main_core.Type.isDomNode(popupContainer)) {
					main_core.Event.bind(btnNode, 'click', () => popup.close());
				}
			}
		}
		#hasIncorrectData(fields = []) {
			const incorrectData = this.#getIncorrectData();
			for (const field of fields) {
				if (incorrectData.includes(field)) {
					return true;
				}
			}
			return !main_core.Type.isArrayFilled(fields) && main_core.Type.isArrayFilled(incorrectData);
		}
		#getIncorrectData() {
			const flowData = this.#flow;
			const incorrectData = [];
			if (!main_core.Type.isStringFilled(flowData.name)) {
				incorrectData.push('name');
			}
			if (flowData.plannedCompletionTime <= 0) {
				incorrectData.push('plannedCompletionTime');
			}
			if (!main_core.Type.isArrayFilled(flowData.taskCreators)) {
				incorrectData.push('taskCreators');
			}
			if (!main_core.Type.isArrayFilled(flowData.responsibleList) || flowData.distributionType === 'manually' && flowData.responsibleList[0] <= 0) {
				incorrectData.push('responsibleList');
			}
			if (flowData.id > 0 && flowData.groupId <= 0 && flowData.demo === false) {
				incorrectData.push('groupId');
			}
			if (!main_core.Type.isNumber(flowData.templateId)) {
				incorrectData.push('templateId');
			}
			if (flowData.id > 0 && flowData.ownerId <= 0 && flowData.demo === false) {
				incorrectData.push('ownerId');
			}
			if (main_core.Type.isNumber(flowData.notifyOnQueueOverflow) && flowData.notifyOnQueueOverflow <= 0) {
				incorrectData.push('notifyOnQueueOverflow');
			}
			if (main_core.Type.isNumber(flowData.notifyOnTasksInProgressOverflow) && flowData.notifyOnTasksInProgressOverflow <= 0) {
				incorrectData.push('notifyOnTasksInProgressOverflow');
			}
			if (main_core.Type.isNumber(flowData.notifyWhenEfficiencyDecreases) && (flowData.notifyWhenEfficiencyDecreases <= 0 || flowData.notifyWhenEfficiencyDecreases > 100)) {
				incorrectData.push('notifyWhenEfficiencyDecreases');
			}
			return incorrectData;
		}
		#getFlow(flowData = {}) {
			return {
				id: this.#params.flowId,
				demo: 'demo' in flowData ? flowData.demo === true : this.#flow?.demo === true,
				...this.#pages.reduce((fields, page) => ({
					...fields,
					...page.getFields(flowData)
				}), {})
			};
		}
		async #onContinueHandler() {
			if (this.#pageChanging === true) {
				return Promise.resolve(false);
			}
			this.#pageChanging = true;
			const stepId = this.#wizard.getCurrentStep().id;
			const currentPage = this.#pages.find(page => page.getId() === stepId);
			const canContinue = await currentPage?.onContinueClick(this.#flow).then(result => {
				this.#pageChanging = false;
				return result;
			});
			const isNewFlow = main_core.Type.isNil(currentPage.getFlowId());
			const isNeedSendAnalytics = isNewFlow && canContinue;
			if (isNeedSendAnalytics) {
				await this.#sendStepAnalytics();
			}
			return canContinue;
		}
		async #sendStepAnalytics() {
			const {
				sendData
			} = await main_core.Runtime.loadExtension('ui.analytics');
			const stepNumber = this.#wizard.getCurrentStepIndex() + 1;
			const demoSuffix = (await this.#isFeatureTrialable()) ? 'Y' : 'N';
			sendData({
				tool: 'tasks',
				category: 'flows',
				event: `flow_create_step${stepNumber}`,
				c_section: 'tasks',
				c_sub_section: this.#params.context ?? 'flows_grid',
				c_element: 'continue_button',
				p1: `isDemo_${demoSuffix}`
			});
		}
		async #isFeatureTrialable() {
			if (main_core.Type.isNil(this.#params.isFeatureTrialable)) {
				const {
					data
				} = await main_core.ajax.runAction('tasks.flow.Flow.getFeatureParams');
				this.#params.isFeatureTrialable = data.isFeatureTrialable;
			}
			return this.#params.isFeatureTrialable;
		}
	}

	exports.EditForm = EditForm;

})(this.BX.Tasks.Flow = this.BX.Tasks.Flow || {}, BX, BX.Event, BX.SidePanel, BX.Main, BX.UI, BX.Tasks, BX.UI.FormElements, BX.Tasks, BX.UI.EntitySelector, BX, BX, BX.UI, BX.UI.Dialogs);
//# sourceMappingURL=edit-form.bundle.js.map
