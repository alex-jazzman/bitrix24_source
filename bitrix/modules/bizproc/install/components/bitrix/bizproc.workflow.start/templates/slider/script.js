/* eslint-disable */
this.BX = this.BX || {};
this.BX.Bizproc = this.BX.Bizproc || {};
(function (exports, main_core, main_core_events, ui_buttons, ui_a11y, sidepanel, bizproc_a11y, ui_iconSet_api_core, ui_alerts, ui_dialogs_messagebox, bp_field_type, ui_forms, main_date) {
	'use strict';

	class Header {
		#title = '';
		#description = '';
		constructor(config) {
			if (main_core.Type.isStringFilled(config.title)) {
				this.#title = config.title;
			}
			if (main_core.Type.isStringFilled(config.description)) {
				this.#description = config.description;
			}
		}
		render() {
			return main_core.Tag.render`
			<div class="bizproc__ws_start__header">
				${this.#renderIcon()}
				${this.#renderContent()}
			</div>
		`;
		}
		#renderIcon() {
			const icon = new ui_iconSet_api_core.Icon({
				icon: ui_iconSet_api_core.Main.BUSINESS_PROCESS_1,
				size: 48,
				color: 'var(--ui-color-palette-white-base)'
			});
			return main_core.Tag.render`
			<div class="bizproc__ws_start__header-icon">
				${icon.render()}
			</div>
		`;
		}
		#renderContent() {
			return main_core.Tag.render`
			<div class="bizproc__ws_start__header-content">
				${this.#renderTitle()}
				${this.#renderInfo()}
			</div>
		`;
		}
		#renderTitle() {
			return main_core.Tag.render`
			<div class="bizproc__ws_start__header__title" role="heading" aria-level="1">
				${main_core.Text.encode(this.#title)}
			</div>
		`;
		}
		#renderInfo() {
			return main_core.Tag.render`
			<div class="bizproc__ws_start__header__info">
				${main_core.Text.encode(this.#description)}
			</div>
		`;
		}
	}

	class Breadcrumbs {
		#items = new Map();
		#itemsNode = new Map();
		#sequenceSteps = [];
		#currentStepId = null;
		constructor(config = {}) {
			if (!main_core.Type.isArrayFilled(config.items)) {
				throw new TypeError('BX.Bizproc.Workflow.SingleStart.Breadcrumbs: items must be filled array');
			}
			config.items.forEach(item => {
				this.#items.set(item.id, item);
				this.#sequenceSteps.push(item.id);
				if (item.active) {
					this.#currentStepId = item.id;
				}
			});
			if (!main_core.Type.isStringFilled(this.#currentStepId) && main_core.Type.isStringFilled(this.#sequenceSteps.at(0))) {
				this.#currentStepId = this.#sequenceSteps.at(0);
			}
		}
		render() {
			const label = main_core.Text.encode(main_core.Loc.getMessage('BIZPROC_CMP_WORKFLOW_START_TMP_SINGLE_START_STEPS_LABEL'));
			return main_core.Tag.render`
			<div
				class="bizproc__ws_start__breadcrumbs"
				role="group"
				aria-label="${label}"
				data-testid="bizproc-ws-start-steps"
			>
				${[...this.#items.entries()].map(([key, item]) => this.#renderItem(item, key))}
			</div>
		`;
		}
		getCurrentStepTitle() {
			return this.#items.has(this.#currentStepId) ? this.#items.get(this.#currentStepId).text : '';
		}
		#renderItem(item, stepId) {
			if (!this.#itemsNode.has(stepId)) {
				const node = main_core.Tag.render`
				<div
					class="bizproc__ws_start__breadcrumbs-item${item.active ? ' --active' : ''}"
					data-testid="bizproc-ws-start-step-${stepId}"
				>
					<span>${main_core.Text.encode(item.text)}</span>
					<span class="ui-icon-set --chevron-right" aria-hidden="true"></span>
				</div>
			`;
				this.#markCurrent(node, item.active);
				this.#itemsNode.set(stepId, node);
			}
			return this.#itemsNode.get(stepId);
		}
		#markCurrent(node, isCurrent) {
			main_core.Dom.attr(node, 'aria-current', isCurrent ? 'step' : null);
		}
		next() {
			if (this.#currentStepId) {
				const index = this.#sequenceSteps.indexOf(this.#currentStepId);
				if (index !== -1 && main_core.Type.isStringFilled(this.#sequenceSteps.at(index + 1))) {
					this.#markNotActive(this.#currentStepId);
					this.#markComplete(this.#currentStepId);
					this.#currentStepId = this.#sequenceSteps.at(index + 1);
					this.#markActive(this.#currentStepId);
				}
			}
		}
		back() {
			if (this.#currentStepId) {
				const index = this.#sequenceSteps.indexOf(this.#currentStepId);
				if (index !== -1 && index - 1 >= 0 && main_core.Type.isStringFilled(this.#sequenceSteps.at(index - 1))) {
					this.#markNotActive(this.#currentStepId);
					this.#currentStepId = this.#sequenceSteps.at(index - 1);
					this.#markNotComplete(this.#currentStepId);
					this.#markActive(this.#currentStepId);
				}
			}
		}
		#markNotActive(stepId) {
			if (this.#items.has(stepId)) {
				this.#items.get(stepId).active = false;
				main_core.Dom.removeClass(this.#itemsNode.get(stepId), '--active');
				this.#markCurrent(this.#itemsNode.get(stepId), false);
			}
		}
		#markActive(stepId) {
			if (this.#items.has(stepId)) {
				this.#items.get(stepId).active = true;
				main_core.Dom.addClass(this.#itemsNode.get(stepId), '--active');
				this.#markCurrent(this.#itemsNode.get(stepId), true);
			}
		}
		#markComplete(stepId) {
			if (this.#items.has(stepId)) {
				main_core.Dom.addClass(this.#itemsNode.get(stepId), '--complete');
			}
		}
		#markNotComplete(stepId) {
			if (this.#items.has(stepId)) {
				main_core.Dom.removeClass(this.#itemsNode.get(stepId), '--complete');
			}
		}
	}

	class Buttons {
		#buttons = new Map();
		#sequenceSteps = [];
		#currentStepId = null;
		#wrapper;
		static createNextButton(action) {
			return new ui_buttons.Button({
				id: 'next',
				text: main_core.Text.encode(main_core.Loc.getMessage('BIZPROC_CMP_WORKFLOW_START_TMP_SINGLE_START_NEXT_BUTTON')),
				onclick: action,
				color: ui_buttons.ButtonColor.PRIMARY,
				dataset: {
					testid: 'bizproc-ws-start-next-btn'
				}
			});
		}
		static createBackButton(action) {
			return new ui_buttons.Button({
				id: 'back',
				text: main_core.Text.encode(main_core.Loc.getMessage('BIZPROC_CMP_WORKFLOW_START_TMP_SINGLE_START_BACK_BUTTON')),
				onclick: action,
				color: ui_buttons.ButtonColor.LIGHT_BORDER,
				dataset: {
					testid: 'bizproc-ws-start-back-btn'
				}
			});
		}
		static createStartButton(action) {
			return new ui_buttons.Button({
				id: 'start',
				text: main_core.Text.encode(main_core.Loc.getMessage('BIZPROC_CMP_WORKFLOW_START_TMP_SINGLE_START_START_BUTTON')),
				onclick: action,
				color: ui_buttons.ButtonColor.PRIMARY,
				dataset: {
					testid: 'bizproc-ws-start-start-btn'
				}
			});
		}
		constructor(config) {
			if (main_core.Type.isPlainObject(config.buttons)) {
				Object.entries(config.buttons).forEach(([stepId, buttons]) => {
					this.#buttons.set(stepId, buttons);
					this.#sequenceSteps.push(stepId);
				});
				if (main_core.Type.isArrayFilled(this.#sequenceSteps)) {
					this.#currentStepId = config.currentStepId ?? this.#sequenceSteps.at(0);
				}
			}
			this.#wrapper = config.wrapper;
		}
		next() {
			const index = this.#sequenceSteps.indexOf(this.#currentStepId);
			if (index !== -1 && main_core.Type.isStringFilled(this.#sequenceSteps.at(index + 1))) {
				this.#currentStepId = this.#sequenceSteps.at(index + 1);
				this.show();
			}
		}
		back() {
			const index = this.#sequenceSteps.indexOf(this.#currentStepId);
			if (index !== -1 && index - 1 >= 0 && main_core.Type.isStringFilled(this.#sequenceSteps.at(index - 1))) {
				this.#currentStepId = this.#sequenceSteps.at(index - 1);
				this.show();
			}
		}
		show() {
			main_core.Dom.clean(this.#wrapper);
			const buttons = this.#currentStepButtons;
			if (main_core.Type.isArrayFilled(this.#currentStepButtons)) {
				main_core.Dom.show(this.#wrapper);
				buttons.forEach(button => {
					button.renderTo(this.#wrapper);
				});
			} else {
				main_core.Dom.hide(this.#wrapper);
			}
		}
		get #currentStepButtons() {
			return this.#buttons.has(this.#currentStepId) ? this.#buttons.get(this.#currentStepId) : [];
		}
		resolveEnableState(enable) {
			this.#currentStepButtons.forEach(button => {
				if (main_core.Type.isBoolean(enable[button.getId()])) {
					button.setDisabled(!enable[button.getId()]);
				}
			});
		}
		resolveWaitingState(waiting) {
			this.#currentStepButtons.forEach(button => {
				if (main_core.Type.isBoolean(waiting[button.getId()])) {
					button.setWaiting(waiting[button.getId()]);
				}
			});
		}
	}

	class ErrorNotifier {
		#errors = [];
		#element;
		#idPrefix = `bizproc-ws-start-error-${main_core.Text.getRandom(8).toLowerCase()}`;
		#messageIdByField = new Map();
		constructor(props) {
			this.errors = props.errors;
		}
		set errors(errors) {
			if (main_core.Type.isArray(errors)) {
				this.#errors = errors;
			}
		}

		// field key -> id of the node holding its message, so a control can be bound to its own error
		get messageIdByField() {
			return this.#messageIdByField;
		}
		render() {
			this.#element = main_core.Tag.render`<div>${this.#renderErrors()}</div>`;
			return this.#element;
		}
		show(scrollToElement = true) {
			if (this.#element) {
				this.clean();
				main_core.Dom.append(this.#renderErrors(), this.#element);
				if (scrollToElement) {
					// eslint-disable-next-line @bitrix24/bitrix24-rules/no-bx
					BX.scrollToNode(this.#element);
				}
			}
		}
		clean() {
			this.#messageIdByField = new Map();
			if (this.#element) {
				main_core.Dom.clean(this.#element);
			}
		}
		#renderErrors() {
			if (main_core.Type.isArrayFilled(this.#errors)) {
				this.#messageIdByField = new Map();
				const message = this.#errors.map((error, index) => {
					const messageId = `${this.#idPrefix}-${index}`;
					const field = error.customData?.parameter;
					if (main_core.Type.isStringFilled(field)) {
						this.#messageIdByField.set(field, messageId);
					}
					return `<span id="${messageId}">${main_core.Text.encode(error.message || '')}</span>`;
				}).join('<br/>');

				// the role lives on the node carrying the text: an always present alert region
				// would announce its own name every time the step is redrawn. The name is a hidden
				// text inside the region, not aria-label: a name on a live region replaces its
				// content in part of the screen readers, and the error text would be lost
				return main_core.Tag.render`
				<div role="alert">
					${bizproc_a11y.visuallyHidden(main_core.Loc.getMessage('BIZPROC_CMP_WORKFLOW_START_TMP_SINGLE_START_ERRORS_LABEL'))}
					${new ui_alerts.Alert({
				text: message,
				color: ui_alerts.AlertColor.DANGER
			}).render()}
				</div>
			`;
			}
			return null;
		}
	}

	// onClose runs on any way out of the dialog — cancel button, Esc, click outside and the confirmed
	// exit as well, so it fits resetting a flag rather than an undo of the confirmed action
	function showConfirmDialog(texts, onConfirm, onClose) {
		const initiator = document.activeElement;
		const messageBox = ui_dialogs_messagebox.MessageBox.create({
			message: texts.description,
			title: texts.title,
			okCaption: texts.confirmCaption,
			cancelCaption: texts.cancelCaption,
			onOk: onConfirm,
			// no onCancel here on purpose: the cancel button without a callback just closes the
			// popup, and the caller gets its single call from the onClose subscription below,
			// which also covers Esc and a click outside
			buttons: ui_dialogs_messagebox.MessageBoxButtons.OK_CANCEL,
			popupOptions: {
				// the portal accessibility settings can be off, so the option is passed explicitly
				focusTrap: {
					restoreFocus: () => resolveFocusTarget(initiator, messageBox.getPopupWindow().getPopupContainer())
				}
			}
		});
		messageBox.show();
		const popup = messageBox.getPopupWindow();

		// the slider closes on keydown while a popup closes on keyup: with Esc enabled right away the
		// keypress that opened this dialog would also close it. A listener bound during that keydown
		// is not called for it, so closing by Esc starts working from the next keypress.
		const enableClosingByEsc = () => {
			main_core.Event.unbind(document, 'keydown', enableClosingByEsc);
			if (!popup.isDestroyed()) {
				popup.setClosingByEsc(true);
			}
		};
		main_core.Event.bind(document, 'keydown', enableClosingByEsc);
		popup.subscribe('onClose', () => {
			main_core.Event.unbind(document, 'keydown', enableClosingByEsc);
		});
		if (main_core.Type.isFunction(onClose)) {
			popup.subscribe('onClose', onClose);
		}
	}
	function resolveFocusTarget(initiator, dialogContainer) {
		if (initiator && initiator !== document.body && document.contains(initiator)) {
			return initiator;
		}

		// the dialog can be opened by the slider close button, then the initiator lives in the top document
		const slider = BX.SidePanel.Instance.getSliderByWindow(window);
		if (slider) {
			return slider.getLabel().getContainer();
		}

		// the dialog can also be shown outside a slider: without a fallback the keyboard user would be
		// left with no focus at all. Nodes of the closing dialog itself are not an option
		const fallback = ui_a11y.FocusNavigator.getFirst(document.body);
		return fallback && dialogContainer?.contains(fallback) !== true ? fallback : null;
	}

	function showExitDialog(onConfirm, onClose) {
		showConfirmDialog({
			title: main_core.Loc.getMessage('BIZPROC_CMP_WORKFLOW_START_TMP_SINGLE_START_EXIT_DIALOG_TITLE'),
			description: main_core.Loc.getMessage('BIZPROC_CMP_WORKFLOW_START_TMP_SINGLE_START_EXIT_DIALOG_DESCRIPTION'),
			confirmCaption: main_core.Loc.getMessage('BIZPROC_CMP_WORKFLOW_START_TMP_SINGLE_START_EXIT_DIALOG_CONFIRM'),
			cancelCaption: main_core.Loc.getMessage('BIZPROC_CMP_WORKFLOW_START_TMP_SINGLE_START_EXIT_DIALOG_CANCEL')
		}, onConfirm, onClose);
	}

	function addMissingFormDataValues(target, source) {
		const addedKeys = new Set();
		for (const [key, value] of source.entries()) {
			if (!target.has(key) || addedKeys.has(key)) {
				addedKeys.add(key);
				target.append(key, value);
			}
		}
	}

	function isEqualsFormData(form1, form2) {
		for (const key of form1.keys()) {
			if (!form2.has(key)) {
				return false;
			}
			const values1 = form1.getAll(key);
			const values2 = form2.getAll(key);
			if (values1.length !== values2.length) {
				return false;
			}
			for (const singleKey of values1.keys()) {
				let value1 = values1.at(singleKey);
				let value2 = values2.at(singleKey);
				if (main_core.Type.isFile(value1)) {
					value1 = value1.name;
					value2 = value2.name;
				}
				if (value1 !== value2) {
					return false;
				}
			}
		}
		return true;
	}

	const FIELD_BLOCK_SELECTOR = '.bizproc__ws_start__content-form-block';
	const FIELD_LABEL_SELECTOR = '.ui-ctl-title';
	const FIELD_CONTROL_SELECTOR = 'input:not([type="hidden"]), select, textarea';
	const CONTROL_RENDER_EVENTS = ['BX.Bizproc.FieldType.onCustomRenderControlFinished', 'BX.Bizproc.FieldType.onCollectionRenderControlFinished'];
	const DEFAULT_TITLE_LEVEL = 2;
	function renderBpForm(formName, title, fields, documentType, options = {}) {
		const {
			description = null,
			signedDocumentId = null,
			onSubmit = null,
			titleLevel = DEFAULT_TITLE_LEVEL
		} = options;
		let context = {};
		if (main_core.Type.isStringFilled(signedDocumentId)) {
			context = {
				isStartWorkflow: true,
				signedDocumentId
			};
		}
		const controls = BX.Bizproc.FieldType.renderControlCollection(documentType, fields.map(field => ({
			property: field,
			fieldName: field.Id,
			value: field.Default,
			controlId: field.Id
		})), 'public', context);
		const form = main_core.Tag.render`
		<form name="${formName}" data-testid="${formName}">
			<div class="bizproc__ws_start__content-form-title-block">
				${renderFormTitle(title, titleLevel)}
				<div class="bizproc__ws_start__content-form-description">${main_core.Text.encode(description)}</div>
			</div>
				${fields.map(property => {
		const control = main_core.Type.isElementNode(controls[property.Id]) ? controls[property.Id] : BX.Bizproc.FieldType.renderControlPublic(documentType, property, property.Id, property.Default, false);
		return renderBpFieldForForm(property, control);
	})}
		</form>
	`;
		main_core.Event.bind(form, 'submit', event => {
			event.preventDefault();
			if (main_core.Type.isFunction(onSubmit)) {
				onSubmit(event);
			}
		});
		const requiredFieldNames = fields.filter(field => main_core.Text.toBoolean(field.Required)).map(field => field.Id);
		const describeControls = () => {
			labelControls(form);
			markRequiredControls(form, requiredFieldNames);
		};
		describeControls();
		CONTROL_RENDER_EVENTS.forEach(eventName => {
			// multiple fields and entity selectors draw their controls after the form is built
			main_core_events.EventEmitter.subscribe(eventName, describeControls);
		});
		return form;
	}
	function renderBpFieldForForm(property, control) {
		const isRequired = main_core.Text.toBoolean(property.Required);
		return main_core.Tag.render`
		<div class="bizproc__ws_start__content-form-block" data-testid="bizproc-ws-start-field-${main_core.Text.encode(property.Id)}">
			<div class="ui-ctl-title${isRequired ? ' --required' : ''}">
				${main_core.Text.encode(property.Name)}
			</div>
			${control}
		</div>
	`;
	}
	function renderFormTitle(title, level) {
		const node = main_core.Tag.render`
		<div class="bizproc__ws_start__content-form-title">${main_core.Text.encode(title)}</div>
	`;
		if (main_core.Type.isNumber(level)) {
			main_core.Dom.attr(node, {
				role: 'heading',
				'aria-level': String(level)
			});
		} else {
			// the surrounding step already renders a heading with the same text
			main_core.Dom.attr(node, 'aria-hidden', 'true');
		}
		return node;
	}
	function labelControls(form) {
		bizproc_a11y.labelFormControls(form, {
			blockSelector: FIELD_BLOCK_SELECTOR,
			labelSelector: FIELD_LABEL_SELECTOR
		});
	}
	function markRequiredControls(form, fieldNames) {
		if (fieldNames.length === 0) {
			return;
		}
		[...form.querySelectorAll(FIELD_CONTROL_SELECTOR)]
		// a date field also renders a timezone select, it carries another name
		.filter(node => fieldNames.some(name => node.name === name || node.name === `${name}[]`)).forEach(node => main_core.Dom.attr(node, 'aria-required', 'true'));
	}

	class Step extends main_core_events.EventEmitter {
		constructor(config) {
			super();
			this.setEventNamespace('BX.Bizproc.Component.WorkflowSingleStart.Step');
			if (this.constructor === Step) {
				throw new Error('Object of Abstract Class cannot be created');
			}
			this.name = config.name;
		}
		render() {
			return main_core.Tag.render`
			<div class="bizproc__ws_start__content">
				${this.renderHead()}
				${this.renderBody()}
				${this.renderFooter()}
			</div>
		`;
		}
		renderHead() {
			return main_core.Tag.render`
			<div class="bizproc__ws_start__content-head">
				<div class="bizproc__ws_start__content-title" role="heading" aria-level="2">
					${main_core.Text.encode(this.name)}
				</div>
			</div>
		`;
		}
		renderBody() {
			throw new Error('Abstract Method has no implementation');
		}
		renderFooter() {
			return null;
		}
		isNextEnabled() {
			return true;
		}
		onBeforeNextStep() {
			return Promise.resolve();
		}
		isBackEnabled() {
			return true;
		}
		onChangeStepAvailability() {
			this.emit('onChangeStepAvailability');
		}
		onAfterRender() {}
		announcesOwnState() {
			return false;
		}
		canExit() {
			return true;
		}
	}

	class StepWithErrors extends Step {
		constructor(config) {
			super(config);
			this.errorNotifier = new ErrorNotifier({});
		}
		renderErrors() {
			return this.errorNotifier.render();
		}
		showErrors(errors, form = null) {
			if (main_core.Type.isArrayFilled(errors)) {
				this.errorNotifier.errors = errors;
				this.errorNotifier.show();
				this.#focusInvalidControl(form);
			}
		}
		cleanErrors(form = null) {
			this.errorNotifier.errors = [];
			this.errorNotifier.clean();
			if (main_core.Type.isDomNode(form)) {
				bizproc_a11y.clearInvalidControls(form);
			}
		}

		// the announcement alone leaves a keyboard user with no idea where the error is, so the focus
		// goes to the field itself; the message is bound to the control and read together with its name
		#focusInvalidControl(form) {
			if (!main_core.Type.isDomNode(form)) {
				return;
			}
			bizproc_a11y.clearInvalidControls(form);
			const fields = [...this.errorNotifier.messageIdByField].map(([name, messageId]) => ({
				name,
				messageId
			}));

			// errors without a field key still point at a required field left empty
			const control = bizproc_a11y.markInvalidControls(form, fields) ?? bizproc_a11y.findUnfilledRequiredControl(form);
			control?.focus();
		}
	}

	const FORM_NAME$3 = 'bizproc-ws-single-start-constants';
	class ConstantsStep extends StepWithErrors {
		#constants = [];
		#documentType = null;
		#signedDocumentType;
		#signedDocumentId;
		#templateId;
		#body;
		#form;
		#saveButton;
		#isConstantsTuned = false;
		#originalFormData = null;
		constructor(config) {
			super(config);
			this.#documentType = config.documentType;
			this.#signedDocumentType = config.signedDocumentType;
			this.#signedDocumentId = config.signedDocumentId;
			this.#templateId = main_core.Text.toInteger(config.templateId);
			if (main_core.Type.isArrayFilled(config.constants)) {
				this.#constants = config.constants;
			}
		}
		get #hasConstants() {
			return main_core.Type.isArrayFilled(this.#constants);
		}
		renderBody() {
			if (!this.#body) {
				this.#body = main_core.Tag.render`
				<div class="bizproc__ws_start__content-body">
					${this.#hasConstants ? this.#renderConstants() : this.#renderStub()}
				</div>
			`;
			}
			return this.#body;
		}
		isNextEnabled() {
			return this.#isConstantsTuned;
		}
		#renderStub() {
			return new ui_alerts.Alert({
				text: main_core.Text.encode(main_core.Loc.getMessage('BIZPROC_CMP_WORKFLOW_START_TMP_SINGLE_START_NOT_TUNING_CONSTANTS')),
				color: ui_alerts.AlertColor.WARNING,
				icon: ui_alerts.AlertIcon.INFO
			}).render();
		}
		#renderConstants() {
			this.#form = renderBpForm(FORM_NAME$3, this.name, this.#constants, this.#documentType, {
				signedDocumentId: this.#signedDocumentId,
				onSubmit: () => this.#handleSaveClick(this.#saveButton),
				// the step head already renders this.name as a heading
				titleLevel: null
			});
			main_core.Dom.append(this.renderErrors(), this.#form);
			main_core.Dom.append(this.#renderSaveButton(), this.#form);
			this.#originalFormData = new FormData(this.#form);
			this.#subscribeOnRenderEvents();
			return main_core.Tag.render`<div class="bizproc__ws_start__content-form">${this.#form}</div>`;
		}
		#subscribeOnRenderEvents() {
			main_core_events.EventEmitter.subscribe('BX.Bizproc.FieldType.onCustomRenderControlFinished', this.#onAfterFieldCollectionRenderer.bind(this));
			main_core_events.EventEmitter.subscribe('BX.Bizproc.FieldType.onCollectionRenderControlFinished', this.#onAfterFieldCollectionRenderer.bind(this));
		}
		#onAfterFieldCollectionRenderer() {
			if (this.#originalFormData && document.forms.namedItem(FORM_NAME$3)) {
				addMissingFormDataValues(this.#originalFormData, new FormData(document.forms.namedItem(FORM_NAME$3)));
			}
		}
		#renderSaveButton() {
			this.#saveButton = new ui_buttons.Button({
				text: main_core.Text.encode(main_core.Loc.getMessage('BIZPROC_CMP_WORKFLOW_START_TMP_SINGLE_START_BUTTON_SAVE')),
				size: ui_buttons.ButtonSize.EXTRA_SMALL,
				color: ui_buttons.ButtonColor.SECONDARY,
				props: {
					type: 'button'
				},
				dataset: {
					testid: 'bizproc-ws-start-save-constants-btn'
				},
				onclick: this.#handleSaveClick.bind(this)
			});
			return this.#saveButton.render();
		}
		#handleSaveClick(button) {
			if (button.isWaiting()) {
				return;
			}
			button.setWaiting(true);
			this.cleanErrors(this.#form);
			const data = new FormData(this.#form);
			data.set('templateId', this.#templateId);
			data.set('signedDocumentType', this.#signedDocumentType);
			main_core.ajax.runAction('bizproc.workflow.starter.setConstants', {
				data
			}).then(() => {
				this.#isConstantsTuned = true;
				this.onChangeStepAvailability();
				button.setWaiting(false);
			}).catch(response => {
				this.showErrors(response.errors, this.#form);
				button.setWaiting(false);
			});
		}
		canExit() {
			if (!this.#hasConstants || !this.#originalFormData || this.#isConstantsTuned) {
				return true;
			}
			return isEqualsFormData(new FormData(this.#form), this.#originalFormData);
		}
	}

	function startWorkflowAction(data) {
		return new Promise((resolve, reject) => {
			main_core.ajax.runAction('bizproc.workflow.starter.startWorkflow', {
				data
			}).then(response => {
				const slider = BX.SidePanel.Instance.getSliderByWindow(window);
				if (slider) {
					const dictionary = slider.getData();
					dictionary.set('data', {
						workflowId: response.data.workflowId
					});
				}
				resolve(response);
			}).catch(reject);
		});
	}

	const FORM_NAME$2 = 'bizproc-ws-single-start-parameters';
	class ParametersStep extends StepWithErrors {
		#parameters = [];
		#documentType = null;
		#signedDocumentId;
		#signedDocumentType;
		#templateId;
		#triggerType;
		#body;
		#form;
		#originalFormData = null;
		#isSent = false;
		#startTime;
		constructor(config) {
			super(config);
			this.#documentType = config.documentType;
			if (main_core.Type.isArrayFilled(config.parameters)) {
				this.#parameters = config.parameters;
			}
			this.#templateId = main_core.Text.toInteger(config.templateId);
			this.#signedDocumentType = config.signedDocumentType;
			this.#signedDocumentId = config.signedDocumentId;
			this.#triggerType = config.triggerType;
			this.#startTime = Math.round(Date.now() / 1000);
		}
		renderBody() {
			if (!this.#body) {
				this.#body = main_core.Tag.render`
				<div class="bizproc__ws_start__content-body">
					${this.renderErrors()}
					<div class="bizproc__ws_start__content-form">
						${this.#renderParametersForm()}
					</div>
				</div>
			`;
			}
			return this.#body;
		}
		#renderParametersForm() {
			this.#form = renderBpForm(FORM_NAME$2, main_core.Loc.getMessage('BIZPROC_CMP_WORKFLOW_START_TMP_SINGLE_START_PARAMETERS_TITLE'), this.#parameters, this.#documentType, {
				signedDocumentId: this.#signedDocumentId,
				onSubmit: () => this.emit('onEnterSubmit'),
				// the form title is nested under the step heading
				titleLevel: 3
			});
			this.#originalFormData = new FormData(this.#form);
			this.#subscribeOnRenderEvents();
			return this.#form;
		}
		#subscribeOnRenderEvents() {
			main_core_events.EventEmitter.subscribe('BX.Bizproc.FieldType.onCustomRenderControlFinished', this.#onAfterFieldCollectionRenderer.bind(this));
			main_core_events.EventEmitter.subscribe('BX.Bizproc.FieldType.onCollectionRenderControlFinished', this.#onAfterFieldCollectionRenderer.bind(this));
		}
		#onAfterFieldCollectionRenderer() {
			if (this.#originalFormData && document.forms.namedItem(FORM_NAME$2)) {
				addMissingFormDataValues(this.#originalFormData, new FormData(document.forms.namedItem(FORM_NAME$2)));
			}
		}
		canExit() {
			if (!this.#originalFormData || this.#isSent) {
				return true;
			}
			return isEqualsFormData(new FormData(this.#form), this.#originalFormData);
		}
		onBeforeNextStep() {
			this.cleanErrors(this.#form);
			const data = new FormData(this.#form);
			data.set('templateId', this.#templateId);
			data.set('signedDocumentType', this.#signedDocumentType);
			data.set('signedDocumentId', this.#signedDocumentId);
			data.set('startDuration', Math.round(Date.now() / 1000) - this.#startTime);
			data.set('triggerType', this.#triggerType ?? '');
			return new Promise((resolve, reject) => {
				startWorkflowAction(data).then(() => {
					this.#isSent = true;
					resolve();
				}).catch(response => {
					this.showErrors(response.errors, this.#form);
					reject();
				});
			});
		}
	}

	class RecommendationStep extends Step {
		#body;
		#recommendation = null;
		#recommendationElement = null;
		#expandElement = null;
		#freeHeight = null;
		#duration = null;
		#isHeightFixed = false;
		constructor(config) {
			super(config);
			this.#recommendation = String(config.recommendation).trim();
			if (!main_core.Type.isNil(config.duration)) {
				this.#duration = main_core.Text.toInteger(config.duration);
			}
		}
		get #hasRecommendation() {
			return main_core.Type.isStringFilled(this.#recommendation);
		}
		get #hasDuration() {
			return !main_core.Type.isNil(this.#duration);
		}
		#getFreeHeight() {
			if (main_core.Type.isNil(this.#freeHeight)) {
				const slider = document.querySelector('.ui-page-slider-workarea-content-padding');
				this.#freeHeight = slider ? slider.offsetHeight - window.innerHeight : 0;
			}
			return this.#freeHeight;
		}
		onAfterRender() {
			if (!this.#isHeightFixed) {
				this.#fixRecommendationHeight();
				this.#isHeightFixed = true;
			}
		}
		#fixRecommendationHeight() {
			if (this.#recommendationElement && this.#expandElement) {
				if (this.#getFreeHeight() <= 0) {
					main_core.Event.unbindAll(this.#expandElement, 'click');
					main_core.Dom.remove(this.#expandElement);
					this.#expandElement = null;
				} else {
					this.#toggleRecommendation();
				}
			}
		}
		renderBody() {
			if (!this.#body) {
				this.#body = main_core.Tag.render`
				<div class="bizproc__ws_start__content-body">
					${this.#renderRecommendation()}
					${this.#renderExpandElement()}
				</div>
			`;
			}
			return this.#body;
		}
		#renderRecommendation() {
			const recommendation = this.#hasRecommendation ? BX.util.nl2br(main_core.Text.encode(this.#recommendation)) : this.#renderEmptyRecommendation();
			this.#recommendationElement = main_core.Tag.render`
			<div class="bizproc__ws_single-start__content-wrapper">
				${recommendation}
			</div>
		`;
			return this.#recommendationElement;
		}
		#renderEmptyRecommendation() {
			return main_core.Tag.render`
			<div class="bizproc__ws_single-start__empty-recommendation">
				<svg width="172" height="172" viewBox="0 0 172 172" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path opacity="0.5" d="M137.617 121.056C137.617 123.661 135.505 125.773 132.899 125.773C130.294 125.773 128.182 123.661 128.182 121.056C128.182 118.45 130.294 116.338 132.899 116.338C135.505 116.338 137.617 118.45 137.617 121.056Z" fill="#2FC6F6"/>
					<path opacity="0.2" fill-rule="evenodd" clip-rule="evenodd" d="M152.713 121.056C152.713 132 143.842 140.871 132.899 140.871C123.946 140.871 116.38 134.933 113.924 126.78H117.91C120.215 132.812 126.057 137.096 132.899 137.096C141.758 137.096 148.939 129.915 148.939 121.056C148.939 112.198 141.758 105.016 132.899 105.016C126.057 105.016 120.215 109.3 117.91 115.333H113.924C116.38 107.18 123.946 101.242 132.899 101.242C143.842 101.242 152.713 110.113 152.713 121.056Z" fill="#2FC6F6"/>
					<path opacity="0.3" fill-rule="evenodd" clip-rule="evenodd" d="M145.164 121.057C145.164 127.831 139.673 133.323 132.898 133.323C128.191 133.323 124.103 130.672 122.047 126.781H126.626C128.178 128.482 130.414 129.549 132.898 129.549C137.588 129.549 141.39 125.747 141.39 121.057C141.39 116.367 137.588 112.565 132.898 112.565C130.414 112.565 128.178 113.632 126.625 115.333H122.047C124.104 111.442 128.191 108.791 132.898 108.791C139.673 108.791 145.164 114.283 145.164 121.057Z" fill="#2FC6F6"/>
					<g opacity="0.3">
						<path fill-rule="evenodd" clip-rule="evenodd" d="M135.652 51.1387L133.678 51.1387V49.6387L135.652 49.6387C136.431 49.6387 137.175 49.7937 137.854 50.0753L137.279 51.4609C136.779 51.2535 136.23 51.1387 135.652 51.1387ZM129.73 51.1387L125.781 51.1387V49.6387L129.73 49.6387V51.1387ZM121.833 51.1387L117.884 51.1387V49.6387L121.833 49.6387V51.1387ZM113.936 51.1387L109.988 51.1387V49.6387L113.936 49.6387V51.1387ZM106.039 51.1387L102.091 51.1387L102.091 49.6387L106.039 49.6387L106.039 51.1387ZM98.1422 51.1387L96.168 51.1387C95.7538 51.1387 95.418 50.8029 95.418 50.3887C95.418 49.9745 95.7538 49.6387 96.168 49.6387L98.1422 49.6387L98.1422 51.1387ZM139.902 55.3887C139.902 54.811 139.788 54.2621 139.58 53.762L140.966 53.1874C141.247 53.8665 141.402 54.6104 141.402 55.3887V57.2499H139.902V55.3887ZM139.902 64.6948V60.9724H141.402V64.6948H139.902ZM139.902 72.1397V68.4173H141.402V72.1397H139.902ZM139.902 77.7234V75.8622H141.402V77.7234C141.402 78.3068 141.345 78.8776 141.236 79.4303L139.764 79.1392C139.855 78.6819 139.902 78.2086 139.902 77.7234ZM136.68 83.7527C137.471 83.2232 138.152 82.542 138.682 81.7511L139.928 82.5856C139.29 83.5395 138.469 84.3606 137.515 84.9992L136.68 83.7527ZM132.652 84.9734C133.138 84.9734 133.611 84.9259 134.068 84.8354L134.359 86.3069C133.807 86.4162 133.236 86.4734 132.652 86.4734H131.026V84.9734H132.652ZM119.64 84.9734H121.267V86.4734H119.64V84.9734ZM124.52 84.9734H127.773V86.4734H124.52V84.9734Z" fill="#2FC6F6"/>
						<path d="M98.1719 50.3926C98.1719 51.4971 97.2764 52.3926 96.1719 52.3926C95.0673 52.3926 94.1719 51.4971 94.1719 50.3926C94.1719 49.288 95.0673 48.3926 96.1719 48.3926C97.2764 48.3926 98.1719 49.288 98.1719 50.3926Z" fill="#2FC6F6"/>
						<path fill-rule="evenodd" clip-rule="evenodd" d="M24.7566 108.84V106.95H26.2566V108.84H24.7566ZM24.7566 103.171V99.3921H26.2566V103.171H24.7566ZM24.7566 95.613V93.7235C24.7566 93.14 24.8138 92.5692 24.9232 92.0166L26.3947 92.3077C26.3042 92.765 26.2566 93.2383 26.2566 93.7235V95.613H24.7566ZM26.2309 88.8613C26.8695 87.9074 27.6906 87.0863 28.6445 86.4477L29.479 87.6942C28.688 88.2237 28.0069 88.9048 27.4773 89.6958L26.2309 88.8613ZM31.7998 85.14C32.3524 85.0307 32.9232 84.9735 33.5066 84.9735H36.0597V86.4735H33.5066C33.0215 86.4735 32.5482 86.521 32.0909 86.6115L31.7998 85.14ZM41.1657 84.9735H43.7188V86.4735H41.1657V84.9735Z" fill="#2FC6F6"/>
						<path d="M41.8867 85.7227C41.8867 86.8272 40.9913 87.7227 39.8867 87.7227C38.7821 87.7227 37.8867 86.8272 37.8867 85.7227C37.8867 84.6181 38.7821 83.7227 39.8867 83.7227C40.9913 83.7227 41.8867 84.6181 41.8867 85.7227Z" fill="#2FC6F6"/>
						<path d="M126.154 83.1855C126.154 82.347 125.184 81.8808 124.53 82.4046L121.357 84.9425C120.857 85.3428 120.857 86.1039 121.357 86.5042L124.53 89.0421C125.184 89.566 126.154 89.0998 126.154 88.2613V83.1855Z" fill="#2FC6F6"/>
						<path d="M28.0841 104.461C28.9226 104.461 29.3887 105.431 28.8649 106.086L26.327 109.258C25.9267 109.758 25.1656 109.758 24.7653 109.258L22.2274 106.086C21.7036 105.431 22.1697 104.461 23.0083 104.461L28.0841 104.461Z" fill="#2FC6F6"/>
					</g>
					<path fill-rule="evenodd" clip-rule="evenodd" d="M121.136 123.595C121.136 124.434 122.105 124.9 122.76 124.376L125.933 121.838C126.433 121.438 126.433 120.677 125.933 120.276L122.76 117.739C122.105 117.215 121.136 117.681 121.136 118.519V120.307L119.401 120.307L119.401 121.807L121.136 121.807V123.595ZM115.499 121.807L111.596 121.807L111.596 120.307L115.499 120.307V121.807ZM107.694 121.807L103.792 121.807L103.792 120.307L107.694 120.307L107.694 121.807ZM98.0226 120.307C97.726 119.574 97.0073 119.057 96.168 119.057C95.0634 119.057 94.168 119.953 94.168 121.057C94.168 122.162 95.0634 123.057 96.168 123.057C97.0073 123.057 97.7258 122.54 98.0226 121.807L99.8894 121.807L99.8894 120.307L98.0226 120.307Z" fill="url(#paint0_linear_5779_78783)"/>
					<g filter="url(#filter0_d_5779_78783)">
						<path d="M18.8066 44.6914C18.8066 41.3777 21.4929 38.6914 24.8066 38.6914H90.167C93.4807 38.6914 96.167 41.3777 96.167 44.6914V56.7393C96.167 60.053 93.4807 62.7393 90.167 62.7393H24.8066C21.4929 62.7393 18.8066 60.053 18.8066 56.7393V44.6914Z" fill="white"/>
					</g>
					<path fill-rule="evenodd" clip-rule="evenodd" d="M90.167 39.6914H24.8066C22.0452 39.6914 19.8066 41.93 19.8066 44.6914V56.7393C19.8066 59.5007 22.0452 61.7393 24.8066 61.7393H90.167C92.9284 61.7393 95.167 59.5007 95.167 56.7393V44.6914C95.167 41.93 92.9284 39.6914 90.167 39.6914ZM24.8066 38.6914C21.4929 38.6914 18.8066 41.3777 18.8066 44.6914V56.7393C18.8066 60.053 21.4929 62.7393 24.8066 62.7393H90.167C93.4807 62.7393 96.167 60.053 96.167 56.7393V44.6914C96.167 41.3777 93.4807 38.6914 90.167 38.6914H24.8066Z" fill="#1EC6FA"/>
					<path opacity="0.3" d="M44.293 50.8101C44.293 49.8535 45.0684 49.0781 46.0249 49.0781H76.0454C77.0019 49.0781 77.7773 49.8535 77.7773 50.8101C77.7773 51.7666 77.0019 52.542 76.0454 52.542H46.0249C45.0684 52.542 44.293 51.7666 44.293 50.8101Z" fill="#2FC6F6"/>
					<path opacity="0.56" fill-rule="evenodd" clip-rule="evenodd" d="M33.1615 56.9988C36.5795 56.9988 39.3503 54.2279 39.3503 50.8099C39.3503 47.3919 36.5795 44.6211 33.1615 44.6211C29.7435 44.6211 26.9727 47.3919 26.9727 50.8099C26.9727 54.2279 29.7435 56.9988 33.1615 56.9988ZM36.2499 48.4132C35.9788 48.1421 35.5392 48.1421 35.2681 48.4132L32.2547 51.4267L31.0536 50.2256C30.7827 49.9547 30.3435 49.9547 30.0726 50.2256C29.8017 50.4965 29.8017 50.9357 30.0726 51.2066L31.7648 52.8987C32.0357 53.1696 32.4749 53.1696 32.7458 52.8987L36.2499 49.395C36.521 49.1239 36.521 48.6843 36.2499 48.4132Z" fill="#2FC6F6"/>
					<g filter="url(#filter1_d_5779_78783)">
						<path d="M45.3302 74.8923C46.2308 73.3741 47.8652 72.4434 49.6304 72.4434H111.547C113.328 72.4434 114.975 73.3907 115.87 74.9304L120.39 82.7061C121.474 84.5704 121.474 86.8729 120.39 88.7372L115.87 96.5129C114.975 98.0526 113.328 98.9999 111.547 98.9999H49.6542C47.8762 98.9999 46.232 98.0557 45.3358 96.5202L40.1566 87.6458C39.4244 86.3912 39.43 84.8382 40.1711 83.5888L45.3302 74.8923Z" fill="white"/>
					</g>
					<path fill-rule="evenodd" clip-rule="evenodd" d="M111.547 73.4434H49.6304C48.2183 73.4434 46.9107 74.188 46.1902 75.4025L41.0312 84.099C40.4753 85.036 40.4711 86.2008 41.0203 87.1418L46.1995 96.0161C46.9164 97.2446 48.2318 97.9999 49.6542 97.9999H111.547C112.972 97.9999 114.289 97.242 115.005 96.0103L119.526 88.2346C120.429 86.681 120.429 84.7622 119.526 83.2086L115.005 75.433C114.289 74.2012 112.972 73.4434 111.547 73.4434ZM49.6304 72.4434C47.8652 72.4434 46.2308 73.3741 45.3302 74.8923L40.1711 83.5888C39.43 84.8382 39.4244 86.3912 40.1566 87.6458L45.3358 96.5202C46.232 98.0557 47.8762 98.9999 49.6542 98.9999H111.547C113.328 98.9999 114.975 98.0526 115.87 96.5129L120.39 88.7372C121.474 86.8729 121.474 84.5704 120.39 82.7061L115.87 74.9304C114.975 73.3907 113.328 72.4434 111.547 72.4434H49.6304Z" fill="#1EC6FA"/>
					<path opacity="0.3" d="M69.0293 85.7222C69.0293 84.7657 69.8047 83.9902 70.7612 83.9902H100.782C101.738 83.9902 102.514 84.7657 102.514 85.7222C102.514 86.6787 101.738 87.4541 100.782 87.4541H70.7612C69.8047 87.4541 69.0293 86.6787 69.0293 85.7222Z" fill="#2FC6F6"/>
					<path opacity="0.56" fill-rule="evenodd" clip-rule="evenodd" d="M57.8998 91.9109C61.3178 91.9109 64.0886 89.14 64.0886 85.722C64.0886 82.304 61.3178 79.5332 57.8998 79.5332C54.4818 79.5332 51.7109 82.304 51.7109 85.722C51.7109 89.14 54.4818 91.9109 57.8998 91.9109ZM60.9882 83.3253C60.7171 83.0542 60.2775 83.0542 60.0064 83.3253L56.993 86.3388L55.7919 85.1377C55.521 84.8668 55.0818 84.8668 54.8109 85.1377C54.54 85.4086 54.54 85.8478 54.8109 86.1187L56.5031 87.8109C56.774 88.0817 57.2132 88.0817 57.4841 87.8109L60.9882 84.3071C61.2593 84.036 61.2593 83.5965 60.9882 83.3253Z" fill="#2FC6F6"/>
					<g filter="url(#filter2_d_5779_78783)">
						<path d="M18.8066 114.807C18.8066 111.493 21.4929 108.807 24.8066 108.807H90.167C93.4807 108.807 96.167 111.493 96.167 114.807V127.306C96.167 130.62 93.4807 133.306 90.167 133.306H24.8066C21.4929 133.306 18.8066 130.62 18.8066 127.306V114.807Z" fill="white"/>
					</g>
					<path fill-rule="evenodd" clip-rule="evenodd" d="M90.167 109.807H24.8066C22.0452 109.807 19.8066 112.045 19.8066 114.807V127.306C19.8066 130.067 22.0452 132.306 24.8066 132.306H90.167C92.9284 132.306 95.167 130.067 95.167 127.306V114.807C95.167 112.045 92.9284 109.807 90.167 109.807ZM24.8066 108.807C21.4929 108.807 18.8066 111.493 18.8066 114.807V127.306C18.8066 130.62 21.4929 133.306 24.8066 133.306H90.167C93.4807 133.306 96.167 130.62 96.167 127.306V114.807C96.167 111.493 93.4807 108.807 90.167 108.807H24.8066Z" fill="#1EC6FA"/>
					<path opacity="0.3" d="M44.209 121.056C44.209 120.1 44.9844 119.324 45.9409 119.324H75.9614C76.9179 119.324 77.6933 120.1 77.6933 121.056C77.6933 122.013 76.9179 122.788 75.9614 122.788H45.9409C44.9844 122.788 44.209 122.013 44.209 121.056Z" fill="#2FC6F6"/>
					<path opacity="0.56" fill-rule="evenodd" clip-rule="evenodd" d="M33.0775 127.245C36.4955 127.245 39.2663 124.474 39.2663 121.056C39.2663 117.638 36.4955 114.867 33.0775 114.867C29.6595 114.867 26.8887 117.638 26.8887 121.056C26.8887 124.474 29.6595 127.245 33.0775 127.245ZM36.1659 118.659C35.8948 118.388 35.4553 118.388 35.1841 118.659L32.1707 121.673L30.9696 120.472C30.6987 120.201 30.2595 120.201 29.9886 120.472C29.7178 120.743 29.7178 121.182 29.9886 121.453L31.6808 123.145C31.9517 123.416 32.3909 123.416 32.6618 123.145L36.1659 119.641C36.4371 119.37 36.4371 118.93 36.1659 118.659Z" fill="#2FC6F6"/>
					<path d="M114.498 51.8009C113.717 51.0199 113.717 49.7536 114.498 48.9725L120.728 42.7429C121.509 41.9619 122.775 41.9619 123.556 42.7429L129.786 48.9725C130.567 49.7536 130.567 51.0199 129.786 51.8009L123.556 58.0305C122.775 58.8115 121.509 58.8115 120.728 58.0305L114.498 51.8009Z" fill="#2FC6F6"/>
					<defs>
						<filter id="filter0_d_5779_78783" x="15.8066" y="36.6914" width="83.3613" height="30.0469" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
							<feFlood flood-opacity="0" result="BackgroundImageFix"/>
							<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
							<feOffset dy="1"/>
							<feGaussianBlur stdDeviation="1.5"/>
							<feComposite in2="hardAlpha" operator="out"/>
							<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0.294033 0 0 0 0 0.3875 0 0 0 0.09 0"/>
							<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_5779_78783"/>
							<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_5779_78783" result="shape"/>
						</filter>
						<filter id="filter1_d_5779_78783" x="36.6113" y="70.4434" width="87.5918" height="32.5566" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
							<feFlood flood-opacity="0" result="BackgroundImageFix"/>
							<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
							<feOffset dy="1"/>
							<feGaussianBlur stdDeviation="1.5"/>
							<feComposite in2="hardAlpha" operator="out"/>
							<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0.294033 0 0 0 0 0.3875 0 0 0 0.09 0"/>
							<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_5779_78783"/>
							<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_5779_78783" result="shape"/>
						</filter>
						<filter id="filter2_d_5779_78783" x="15.8066" y="106.807" width="83.3613" height="30.5" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
							<feFlood flood-opacity="0" result="BackgroundImageFix"/>
							<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
							<feOffset dy="1"/>
							<feGaussianBlur stdDeviation="1.5"/>
							<feComposite in2="hardAlpha" operator="out"/>
							<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0.294033 0 0 0 0 0.3875 0 0 0 0.09 0"/>
							<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_5779_78783"/>
							<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_5779_78783" result="shape"/>
						</filter>
						<linearGradient id="paint0_linear_5779_78783" x1="93.418" y1="121.057" x2="129.388" y2="121.057" gradientUnits="userSpaceOnUse">
							<stop stop-color="#2FC6F6" stop-opacity="0.3"/>
							<stop offset="1" stop-color="#2FC6F6"/>
						</linearGradient>
					</defs>
				</svg>
				<span class="bizproc__ws_single-start__text-empty">
					${main_core.Text.encode(main_core.Loc.getMessage('BIZPROC_CMP_WORKFLOW_START_TMP_SINGLE_START_EMPTY_RECOMMENDATION_1'))}
				</span>
			</div>
		`;
		}
		#renderExpandElement() {
			if (!this.#hasRecommendation) {
				return null;
			}
			this.#expandElement = main_core.Tag.render`
			<div class="bizproc__ws_single-start__content-open --expanded">
				${main_core.Text.encode(main_core.Loc.getMessage('BIZPROC_CMP_WORKFLOW_START_TMP_SINGLE_START_COLLAPSE_RECOMMENDATION'))}
			</div>
		`;
			main_core.Event.bind(this.#expandElement, 'click', this.#toggleRecommendation.bind(this));
			return this.#expandElement;
		}
		#toggleRecommendation() {
			if (this.#recommendationElement && this.#expandElement) {
				main_core.Dom.toggleClass(this.#expandElement, ['--expanded', '--collapsed']);
				this.#expandElement.innerText = main_core.Loc.getMessage(main_core.Dom.hasClass(this.#expandElement, '--expanded') ? 'BIZPROC_CMP_WORKFLOW_START_TMP_SINGLE_START_COLLAPSE_RECOMMENDATION' : 'BIZPROC_CMP_WORKFLOW_START_TMP_SINGLE_START_EXPAND_RECOMMENDATION');
				main_core.Dom.toggleClass(this.#recommendationElement, ['--hide']);
				if (this.#getFreeHeight() > 0) {
					const height = main_core.Dom.hasClass(this.#expandElement, '--expanded') ? `${this.#recommendationElement.scrollHeight}px` : `${this.#recommendationElement.offsetHeight - this.#getFreeHeight()}px`;
					main_core.Dom.style(this.#recommendationElement, 'height', height);
				}
			}
		}
		renderFooter() {
			return main_core.Tag.render`
			<div class="bizproc__ws_single-start__informer">
				<div class="bizproc__ws_single-start__informer-header">
					<div class="bizproc__ws_single-start__informer-title">
						${main_core.Text.encode(main_core.Loc.getMessage('BIZPROC_CMP_WORKFLOW_START_TMP_SINGLE_START_AVERAGE_DURATION_TITLE'))}
					</div>
					${this.#renderDuration()}
				</div>
				<div class="bizproc__ws_single-start__informer-message">
					${main_core.Text.encode(main_core.Loc.getMessage(this.#hasDuration ? 'BIZPROC_CMP_WORKFLOW_START_TMP_SINGLE_START_DURATION_DESCRIPTION' : 'BIZPROC_CMP_WORKFLOW_START_TMP_SINGLE_START_DURATION_UNDEFINED_DESCRIPTION'))}
				</div>
				<div class="bizproc__ws_single-start__informer-bottom">
					${this.#hasDuration ? this.#renderLinkToArticle() : null}
				</div>
			</div>
		`;
		}
		#renderDuration() {
			if (this.#hasDuration) {
				let formattedDuration = main_core.Loc.getMessage('BIZPROC_CMP_WORKFLOW_START_TMP_SINGLE_START_ZERO_DURATION');
				if (this.#duration > 0) {
					formattedDuration = main_date.DateTimeFormat.format([['s', 'sdiff'], ['i', 'idiff'], ['H', 'Hdiff'], ['d', 'ddiff'], ['m', 'mdiff'], ['Y', 'Ydiff']], 0, this.#duration);
				}
				return main_core.Tag.render`
				<div class="bizproc__ws_single-start__informer-time">
					<span>${main_core.Text.encode(formattedDuration)}</span>
					<div class="ui-icon-set --time-picker"></div>
				</div>
			`;
			}
			return main_core.Tag.render`
			<div class="bizproc__ws_single-start__informer-time">
				<span class="bizproc__ws_single-start__text-empty">
					${main_core.Text.encode(main_core.Loc.getMessage('BIZPROC_CMP_WORKFLOW_START_TMP_SINGLE_START_EMPTY_DURATION'))}
				</span>
			</div>
		`;
		}
		#renderLinkToArticle() {
			return main_core.Tag.render`
			<a class="bizproc__ws_single-start__link" href="#" onclick="top.BX.Helper.show('redirect=detail&code=18783714')">
				${main_core.Text.encode(main_core.Loc.getMessage('BIZPROC_CMP_WORKFLOW_START_TMP_SINGLE_START_AVERAGE_DURATION_HINT'))}
			</a>
		`;
		}
	}

	const CLOSE_SLIDER_AFTER_SECONDS = 1;
	class SuccessStartStep extends Step {
		renderHead() {
			return null;
		}
		renderBody() {
			return main_core.Tag.render`
			<div>
				<div class="bizproc-workflow-start__slider">
					<div class="bizproc-workflow-start__slider-logo">
						<div class="bizproc-workflow-start__slider-logo-animated"></div>
					</div>
					<div class="bizproc-workflow-start__slider-content">
						<div class="bizproc-workflow-start__slider-text">
							${main_core.Loc.getMessage('BIZPROC_CMP_WORKFLOW_START_TMP_SINGLE_START_FINAL_TEXT_STARTED')}
						</div>
					</div>
				</div>
			</div>
		`;
		}
		announcesOwnState() {
			return true;
		}
		onAfterRender() {
			// the slider closes a second later, so the result is announced from the top window:
			// its live region outlives this document
			bizproc_a11y.announce(main_core.Loc.getMessage('BIZPROC_CMP_WORKFLOW_START_TMP_SINGLE_START_FINAL_TEXT_STARTED'), {
				assertive: true,
				inTopWindow: true
			});
			setTimeout(() => {
				if (BX.SidePanel.Instance.getSliderByWindow(window)) {
					BX.SidePanel.Instance.getSliderByWindow(window).close();
				}
			}, CLOSE_SLIDER_AFTER_SECONDS * 1000);
		}
	}

	const HTML_ELEMENT_ID$2 = 'bizproc-workflow-start-single-start';
	class SingleStart {
		#header;
		#breadcrumbs;
		#errorNotifier;
		#steps = new Map();
		#buttons;
		#sequenceSteps = [];
		#currentStepId;
		#content;
		#canExit = false;
		#isExitInProcess = false;
		#isNextStepInProcess = false;
		#templateId;
		#signedDocumentType;
		#signedDocumentId;
		#triggerType;
		#startTime;
		constructor(config) {
			this.#startTime = Math.round(Date.now() / 1000);
			const composedData = this.#composeData(config);
			this.#header = new Header({
				title: main_core.Loc.getMessage('BIZPROC_CMP_WORKFLOW_START_TMP_SINGLE_START_TITLE'),
				description: main_core.Loc.getMessage('BIZPROC_CMP_WORKFLOW_START_TMP_SINGLE_START_DESCRIPTION')
			});
			this.#breadcrumbs = new Breadcrumbs({
				items: Object.values(composedData).map(data => data.breadcrumbs)
			});
			this.#errorNotifier = new ErrorNotifier({});
			if (config.errors) {
				this.#errorNotifier.errors = config.errors;
				this.#errorNotifier.show();
			}
			Object.entries(composedData).forEach(([key, data]) => {
				this.#steps.set(key, data.step);
				data.step.subscribe('onChangeStepAvailability', this.#resolveButtonsEnableState.bind(this));
				data.step.subscribe('onEnterSubmit', () => this.#next());
			});
			this.#sequenceSteps = Object.keys(composedData);
			this.#currentStepId = config.workflowId ? this.#sequenceSteps.at(-1) : this.#sequenceSteps.at(0);
			if (config.workflowId) {
				const slider = BX.SidePanel.Instance.getSliderByWindow(window);
				if (slider) {
					const dictionary = slider.getData();
					dictionary.set('data', {
						workflowId: config.workflowId
					});
				}
				this.#canExit = true;
			}
			this.#buttons = new Buttons({
				buttons: Object.fromEntries(Object.entries(composedData).map(([key, data]) => [key, data.buttons])),
				wrapper: document.getElementById(`${HTML_ELEMENT_ID$2}-buttons`).querySelector('.ui-button-panel'),
				currentStepId: this.#currentStepId
			});
			this.#signedDocumentType = config.signedDocumentType;
			this.#signedDocumentId = config.signedDocumentId;
			this.#templateId = main_core.Text.toInteger(config.id);
			this.#triggerType = config.triggerType;
			this.#subscribeOnSliderClose();
		}
		#resolveButtonsEnableState() {
			this.#buttons.resolveEnableState({
				next: this.#steps.get(this.#currentStepId).isNextEnabled(),
				back: this.#steps.get(this.#currentStepId).isBackEnabled(),
				start: this.#steps.get(this.#currentStepId).isNextEnabled()
			});
		}
		render() {
			this.#content = this.#renderContent();
			return main_core.Tag.render`
			<div class="bizproc__ws_start">
				${this.#header.render()}
				<div class="bizproc__ws_start__body">
					${this.#breadcrumbs.render()}
					${this.#content}
				</div>
			</div>
		`;
		}
		#renderContent() {
			return main_core.Tag.render`
			<div class="bizproc__ws_start__container">
				${this.#errorNotifier.render()}
				${this.#steps.has(this.#currentStepId) ? this.#steps.get(this.#currentStepId).render() : null}
			</div>
		`;
		}
		#updateContent() {
			if (this.#content) {
				const content = this.#renderContent();
				main_core.Dom.replace(this.#content, content);
				this.#content = content;
				if (this.#steps.has(this.#currentStepId)) {
					this.#steps.get(this.#currentStepId).onAfterRender();
				}
			}
		}
		onAfterRender() {
			if (this.#steps.has('recommendation')) {
				this.#steps.get('recommendation').onAfterRender();
			}
			if (this.#currentStepId === 'start') {
				this.#steps.get('start').onAfterRender();
			}
			this.#buttons.show();
		}
		#next() {
			if (this.#isNextStepInProcess) {
				return;
			}
			this.#cleanErrors();
			if (this.#isNextStepEnable()) {
				this.#isNextStepInProcess = true;
				this.#markButtonsOnBeforeNextStep();
				this.#steps.get(this.#currentStepId).onBeforeNextStep().then(() => {
					this.#isNextStepInProcess = false;
					this.#breadcrumbs.next();
					this.#currentStepId = this.#sequenceSteps.at(this.#sequenceSteps.indexOf(this.#currentStepId) + 1);
					this.#updateContent();
					this.#buttons.next();
					this.#resolveButtonsEnableState();
					this.#focusCurrentStep();
					this.#announceCurrentStep();
				}).catch(error => {
					this.#isNextStepInProcess = false;
					this.#resolveButtonsEnableState();
					if (error) {
						console.error(error);
					}
				});
			}
		}
		#back() {
			this.#cleanErrors();
			if (this.#isPreviousStepEnable()) {
				this.#breadcrumbs.back();
				this.#currentStepId = this.#sequenceSteps.at(this.#sequenceSteps.indexOf(this.#currentStepId) - 1);
				this.#updateContent();
				this.#buttons.back();
				this.#resolveButtonsEnableState();
				this.#focusCurrentStep();
				this.#announceCurrentStep();
			}
		}

		// announced after the focus move on purpose: moving the focus makes the screen reader speak
		// the newly focused element, and that speech drops a polite message queued right before it
		#announceCurrentStep() {
			// the final step announces the start result itself, a step title would talk over it
			if (this.#steps.get(this.#currentStepId)?.announcesOwnState()) {
				return;
			}
			bizproc_a11y.announce(this.#breadcrumbs.getCurrentStepTitle());
		}
		#focusCurrentStep() {
			if (this.#content) {
				// the action buttons live outside the content, so without this the focus would
				// stay on them while the step behind has already changed
				ui_a11y.FocusNavigator.focusFirst(this.#content, {
					preventScroll: true
				});
			}
		}
		#fastStart() {
			this.#cleanErrors();
			if (this.#isNextStepEnable()) {
				this.#markButtonsOnBeforeNextStep();
				const data = {
					templateId: this.#templateId,
					signedDocumentType: this.#signedDocumentType,
					signedDocumentId: this.#signedDocumentId,
					startDuration: Math.round(Date.now() / 1000) - this.#startTime,
					triggerType: this.#triggerType
				};
				startWorkflowAction(data).then(() => {
					this.#canExit = true;
					this.#next();
				}).catch(response => {
					this.#errorNotifier.errors = response.errors;
					this.#errorNotifier.show();
					this.#resolveButtonsEnableState();
				});
			}
		}
		#markButtonsOnBeforeNextStep() {
			this.#buttons.resolveWaitingState({
				start: true,
				next: true
			});
			this.#buttons.resolveEnableState({
				back: false
			});
		}
		#cleanErrors() {
			this.#errorNotifier.errors = [];
			this.#errorNotifier.clean();
		}
		#isNextStepEnable() {
			const index = this.#sequenceSteps.indexOf(this.#currentStepId);
			return index !== -1 && main_core.Type.isStringFilled(this.#sequenceSteps.at(index + 1)) && this.#steps.get(this.#currentStepId).isNextEnabled();
		}
		#isPreviousStepEnable() {
			const index = this.#sequenceSteps.indexOf(this.#currentStepId);
			return index !== -1 && index - 1 >= 0 && main_core.Type.isStringFilled(this.#sequenceSteps.at(index - 1)) && this.#steps.get(this.#currentStepId).isBackEnabled();
		}
		#exit() {
			if (BX.SidePanel.Instance.getSliderByWindow(window)) {
				BX.SidePanel.Instance.getSliderByWindow(window).close();
			}
		}
		#composeData(config) {
			const data = {
				recommendation: this.#getRecommendationData(config)
			};
			if (!config.isConstantsTuned) {
				data.constants = this.#getConstantsData(config);
			}
			if (config.hasParameters) {
				data.parameters = this.#getParametersData(config);
			}
			data.start = this.#getStartData(config);
			return data;
		}
		#getRecommendationData(config) {
			const isFastStart = config.isConstantsTuned && !config.hasParameters;
			return {
				breadcrumbs: {
					id: 'recommendation',
					text: main_core.Loc.getMessage('BIZPROC_CMP_WORKFLOW_START_TMP_SINGLE_START_STEP_RECOMMENDATION'),
					active: true
				},
				step: new RecommendationStep({
					name: config.name,
					recommendation: config.description,
					duration: config.duration
				}),
				buttons: [Buttons.createBackButton(this.#exit.bind(this)), isFastStart ? Buttons.createStartButton(this.#fastStart.bind(this)) : Buttons.createNextButton(this.#next.bind(this))]
			};
		}
		#getConstantsData(config) {
			return {
				breadcrumbs: {
					id: 'constants',
					text: main_core.Loc.getMessage('BIZPROC_CMP_WORKFLOW_START_TMP_SINGLE_START_STEP_CONSTANTS'),
					active: false
				},
				step: new ConstantsStep({
					name: config.name,
					templateId: config.id,
					constants: config.constants,
					documentType: config.documentType,
					signedDocumentType: config.signedDocumentType,
					signedDocumentId: config.signedDocumentId,
					triggerType: config.triggerType
				}),
				buttons: [Buttons.createBackButton(this.#back.bind(this)), config.hasParameters ? Buttons.createNextButton(this.#next.bind(this)) : Buttons.createStartButton(this.#fastStart.bind(this))]
			};
		}
		#getParametersData(config) {
			return {
				breadcrumbs: {
					id: 'parameters',
					text: main_core.Loc.getMessage('BIZPROC_CMP_WORKFLOW_START_TMP_SINGLE_START_STEP_PARAMETERS'),
					active: false
				},
				step: new ParametersStep({
					name: config.name,
					templateId: config.id,
					parameters: config.parameters,
					documentType: config.documentType,
					signedDocumentId: config.signedDocumentId,
					signedDocumentType: config.signedDocumentType,
					triggerType: config.triggerType
				}),
				buttons: [Buttons.createBackButton(this.#back.bind(this)), Buttons.createStartButton(this.#next.bind(this)) // slow start
				]
			};
		}
		#getStartData(config) {
			return {
				breadcrumbs: {
					id: 'start',
					text: main_core.Loc.getMessage('BIZPROC_CMP_WORKFLOW_START_TMP_SINGLE_START_STEP_START'),
					active: false
				},
				step: new SuccessStartStep({
					name: config.name
				}),
				buttons: []
			};
		}
		#subscribeOnSliderClose() {
			const slider = BX.SidePanel.Instance.getSliderByWindow(window);
			if (slider) {
				main_core_events.EventEmitter.subscribe(slider, 'SidePanel.Slider:onClose', event => {
					if (!this.#canExit) {
						const canExit = [...this.#steps.values()].every(step => step ? step.canExit() : true);
						if (!canExit) {
							event.getCompatData()[0].denyAction();
							if (!this.#isExitInProcess) {
								this.#isExitInProcess = true;
								showExitDialog(() => {
									this.#canExit = true;
									slider.close();
									return true;
								}, () => {
									this.#isExitInProcess = false;
									return true;
								});
							}
						}
					}
				});
			}
		}
	}

	function showCancelDialog$1(onConfirm, onClose) {
		showConfirmDialog({
			title: main_core.Loc.getMessage('BIZPROC_CMP_WORKFLOW_START_TMP_AUTOSTART_EXIT_DIALOG_TITLE'),
			description: main_core.Loc.getMessage('BIZPROC_CMP_WORKFLOW_START_TMP_AUTOSTART_EXIT_DIALOG_DESCRIPTION'),
			confirmCaption: main_core.Loc.getMessage('BIZPROC_CMP_WORKFLOW_START_TMP_AUTOSTART_EXIT_DIALOG_CONFIRM'),
			cancelCaption: main_core.Loc.getMessage('BIZPROC_CMP_WORKFLOW_START_TMP_AUTOSTART_EXIT_DIALOG_CANCEL')
		}, onConfirm, onClose);
	}

	const FORM_NAME$1 = 'bizproc-ws-autostart';
	const HTML_ELEMENT_ID$1 = 'bizproc-workflow-start-autostart';
	class Autostart {
		#header;
		#breadcrumbs;
		#buttons;
		#errorNotifier;
		#templates = [];
		#documents = [];
		#signedDocumentType = null;
		#signedDocumentId = null;
		#autoExecute;
		#forms = [];
		#canExit = false;
		#isExitInProcess = false;
		#isSaving = false;
		constructor(config) {
			this.#header = new Header({
				title: main_core.Loc.getMessage('BIZPROC_CMP_WORKFLOW_START_TMP_AUTOSTART_TITLE'),
				description: main_core.Loc.getMessage('BIZPROC_CMP_WORKFLOW_START_TMP_AUTOSTART_DESCRIPTION')
			});
			this.#breadcrumbs = new Breadcrumbs({
				items: [{
					id: 'autostart',
					text: main_core.Loc.getMessage('BIZPROC_CMP_WORKFLOW_START_TMP_AUTOSTART_STEP_AUTOSTART_TITLE'),
					active: true
				}]
			});
			this.#buttons = new Buttons({
				buttons: {
					autostart: [Buttons.createBackButton(this.#exit.bind(this)), new ui_buttons.Button({
						id: 'save',
						text: main_core.Text.encode(main_core.Loc.getMessage('BIZPROC_CMP_WORKFLOW_START_TMP_SINGLE_START_BUTTON_SAVE')),
						onclick: this.#save.bind(this),
						color: ui_buttons.ButtonColor.PRIMARY
					})]
				},
				wrapper: document.getElementById(`${HTML_ELEMENT_ID$1}-buttons`).querySelector('.ui-button-panel')
			});
			this.#errorNotifier = new ErrorNotifier({});
			if (main_core.Type.isArrayFilled(config.templates)) {
				this.#templates = config.templates;
			}
			if (main_core.Type.isArrayFilled(config.documents)) {
				this.#documents = config.documents;
			}
			if (main_core.Type.isStringFilled(config.signedDocumentType)) {
				this.#signedDocumentType = config.signedDocumentType;
			}
			if (main_core.Type.isStringFilled(config.signedDocumentId)) {
				this.#signedDocumentId = config.signedDocumentId;
			}
			this.#autoExecute = main_core.Text.toInteger(config.autoExecuteType);
			this.#subscribeOnSliderClose();
		}
		render() {
			return main_core.Tag.render`
			<div class="bizproc__ws_start">
				${this.#header.render()}
				<div class="bizproc__ws_start__body">
					${this.#breadcrumbs.render()}
					<div class="bizproc__ws_start__container">
						${this.#errorNotifier.render()}
						<div class="bizproc__ws_start__content">
							<div class="bizproc__ws_start__content-body">
								${this.#templates.map(template => this.#renderForm(template))}
							</div>
						</div>
					</div>
				<div>
			</div>
		`;
		}
		onAfterRender() {
			this.#buttons.show();
		}
		#renderForm(template) {
			const form = renderBpForm(`${FORM_NAME$1}_${template.id}`, template.name, template.parameters, template.documentType, {
				description: template.description,
				onSubmit: () => this.#save()
			});
			this.#forms.push(form);
			return main_core.Tag.render`<div class="bizproc__ws_start__content-form">${form}</div>`;
		}
		#exit() {
			if (BX.SidePanel.Instance.getSliderByWindow(window)) {
				BX.SidePanel.Instance.getSliderByWindow(window).close();
			}
		}
		#save() {
			if (this.#isSaving) {
				return;
			}
			this.#isSaving = true;
			this.#buttons.resolveWaitingState({
				save: true
			});
			const data = new FormData();
			this.#forms.forEach(form => {
				addMissingFormDataValues(data, new FormData(form));
			});
			this.#appendDocumentsToFormData(data);
			data.set('autoExecuteType', this.#autoExecute);
			main_core.ajax.runAction('bizproc.workflow.starter.checkParameters', {
				data
			}).then(response => {
				const slider = BX.SidePanel.Instance.getSliderByWindow(window);
				if (slider) {
					const dictionary = slider.getData();
					dictionary.set('data', {
						signedParameters: response.data.parameters
					});
				}
				this.#errorNotifier.clean();
				this.#buttons.resolveWaitingState({
					save: false
				});
				this.#isSaving = false;
				this.#canExit = true;
				this.#exit();
			}).catch(response => {
				this.#errorNotifier.errors = response.errors;
				this.#errorNotifier.show();
				this.#buttons.resolveWaitingState({
					save: false
				});
				this.#isSaving = false;
			});
		}
		#appendDocumentsToFormData(data) {
			this.#documents.forEach((document, index) => {
				document.documentType.forEach((value, documentTypeIndex) => {
					data.append(`documents[${index}][documentType][${documentTypeIndex}]`, value);
				});
				if (main_core.Type.isArray(document.documentId)) {
					document.documentId.forEach((value, documentIdIndex) => {
						data.append(`documents[${index}][documentId][${documentIdIndex}]`, value);
					});
				}
				if (!main_core.Type.isNil(document.categoryId)) {
					data.append(`documents[${index}][categoryId]`, document.categoryId);
				}
			});
			if (this.#documents.length === 1 && main_core.Type.isStringFilled(this.#signedDocumentType)) {
				data.set('signedDocumentType', this.#signedDocumentType);
			}
			if (this.#documents.length === 1 && main_core.Type.isStringFilled(this.#signedDocumentId)) {
				data.set('signedDocumentId', this.#signedDocumentId);
			}
		}
		#subscribeOnSliderClose() {
			const slider = BX.SidePanel.Instance.getSliderByWindow(window);
			if (slider) {
				main_core_events.EventEmitter.subscribe(slider, 'SidePanel.Slider:onClose', event => {
					if (!this.#canExit) {
						event.getCompatData()[0].denyAction();
						if (!this.#isExitInProcess) {
							this.#isExitInProcess = true;
							showCancelDialog$1(() => {
								this.#canExit = true;
								slider.close();
								return true;
							}, () => {
								this.#isExitInProcess = false;
								return true;
							});
						}
					}
				});
			}
		}
	}

	function showCancelDialog(onConfirm, onClose) {
		showConfirmDialog({
			title: main_core.Loc.getMessage('BIZPROC_CMP_WORKFLOW_START_TMP_EDIT_CONSTANTS_EXIT_DIALOG_TITLE'),
			description: main_core.Loc.getMessage('BIZPROC_CMP_WORKFLOW_START_TMP_EDIT_CONSTANTS_EXIT_DIALOG_DESCRIPTION'),
			confirmCaption: main_core.Loc.getMessage('BIZPROC_CMP_WORKFLOW_START_TMP_EDIT_CONSTANTS_EXIT_DIALOG_CONFIRM'),
			cancelCaption: main_core.Loc.getMessage('BIZPROC_CMP_WORKFLOW_START_TMP_EDIT_CONSTANTS_EXIT_DIALOG_CANCEL')
		}, onConfirm, onClose);
	}

	const FORM_NAME = 'bizproc-ws-edit-constants';
	const HTML_ELEMENT_ID = 'bizproc-workflow-start-edit-constants';
	class EditConstants {
		#header;
		#breadcrumbs;
		#buttons;
		#errorNotifier;
		#constants;
		#documentType = null;
		#signedDocumentType;
		#templateId;
		#templateName;
		#form;
		#saveButton;
		#canExit = false;
		#isExitInProcess = false;
		#originalFormData = null;
		constructor(config) {
			this.#header = new Header({
				title: main_core.Loc.getMessage('BIZPROC_CMP_WORKFLOW_START_TMP_EDIT_CONSTANTS_TITLE'),
				description: main_core.Loc.getMessage('BIZPROC_CMP_WORKFLOW_START_TMP_EDIT_CONSTANTS_DESCRIPTION')
			});
			this.#breadcrumbs = new Breadcrumbs({
				items: [{
					id: 'edit-constants',
					text: main_core.Loc.getMessage('BIZPROC_CMP_WORKFLOW_START_TMP_EDIT_CONSTANTS_STEP_AUTOSTART_TITLE'),
					active: true
				}]
			});
			this.#saveButton = new ui_buttons.Button({
				id: 'save',
				text: main_core.Text.encode(main_core.Loc.getMessage('BIZPROC_CMP_WORKFLOW_START_TMP_SINGLE_START_BUTTON_SAVE')),
				onclick: this.#handleSaveClick.bind(this),
				color: ui_buttons.ButtonColor.PRIMARY,
				dataset: {
					testid: 'bizproc-ws-edit-constants-save-btn'
				}
			});
			this.#buttons = new Buttons({
				buttons: {
					edit: [Buttons.createBackButton(this.#exit.bind(this)), this.#saveButton]
				},
				wrapper: document.getElementById(`${HTML_ELEMENT_ID}-buttons`).querySelector('.ui-button-panel')
			});
			this.#buttons.show();
			this.#errorNotifier = new ErrorNotifier({});
			this.#documentType = config.documentType;
			this.#signedDocumentType = config.signedDocumentType;
			this.#templateId = main_core.Text.toInteger(config.templateId);
			this.#templateName = config.templateName;
			this.#constants = config.constants;
			this.#subscribeOnSliderClose();
		}
		render() {
			return main_core.Tag.render`
			<div class="bizproc__ws_start">
				${this.#header.render()}
				<div class="bizproc__ws_start__body">
					${this.#breadcrumbs.render()}
					<div class="bizproc__ws_start__container">
						${this.#errorNotifier.render()}
						<div class="bizproc__ws_start__content">
							<div class="bizproc__ws_start__content-body">
								${this.#renderConstants()}
							</div>
						</div>
					</div>
				<div>
			</div>
		`;
		}
		#renderConstants() {
			this.#form = renderBpForm(FORM_NAME, this.#templateName, this.#constants, this.#documentType, {
				onSubmit: () => this.#handleSaveClick(this.#saveButton)
			});
			main_core.Dom.append(this.#renderErrors(), this.#form);
			this.#originalFormData = new FormData(this.#form);
			this.#subscribeOnRenderEvents();
			return main_core.Tag.render`<div class="bizproc__ws_start__content-form">${this.#form}</div>`;
		}
		#renderErrors() {
			return this.#errorNotifier.render();
		}
		#subscribeOnRenderEvents() {
			main_core_events.EventEmitter.subscribe('BX.Bizproc.FieldType.onCustomRenderControlFinished', this.#onAfterFieldCollectionRenderer.bind(this));
			main_core_events.EventEmitter.subscribe('BX.Bizproc.FieldType.onCollectionRenderControlFinished', this.#onAfterFieldCollectionRenderer.bind(this));
		}
		#onAfterFieldCollectionRenderer() {
			if (this.#originalFormData && document.forms.namedItem(FORM_NAME)) {
				addMissingFormDataValues(this.#originalFormData, new FormData(document.forms.namedItem(FORM_NAME)));
			}
		}
		#handleSaveClick(button) {
			if (button.isWaiting()) {
				return;
			}
			button.setWaiting(true);
			this.#errorNotifier.clean();
			const data = new FormData(this.#form);
			data.set('templateId', this.#templateId);
			data.set('signedDocumentType', this.#signedDocumentType);
			main_core.ajax.runAction('bizproc.workflow.starter.setConstants', {
				data
			}).then(() => {
				button.setWaiting(false);
				this.#canExit = true;
				this.#exit();
			}).catch(response => {
				this.#errorNotifier.errors = response.errors;
				this.#errorNotifier.show();
				button.setWaiting(false);
			});
		}
		#exit() {
			if (BX.SidePanel.Instance.getSliderByWindow(window)) {
				BX.SidePanel.Instance.getSliderByWindow(window).close();
			}
		}
		#subscribeOnSliderClose() {
			const slider = BX.SidePanel.Instance.getSliderByWindow(window);
			if (slider) {
				main_core_events.EventEmitter.subscribe(slider, 'SidePanel.Slider:onClose', event => {
					if (!this.#canExit && this.#isChangedConstants()) {
						event.getCompatData()[0].denyAction();
						if (!this.#isExitInProcess) {
							this.#isExitInProcess = true;
							showCancelDialog(() => {
								this.#canExit = true;
								slider.close();
								return true;
							}, () => {
								this.#isExitInProcess = false;
								return true;
							});
						}
					}
				});
			}
		}
		#isChangedConstants() {
			if (!this.#originalFormData) {
				return false;
			}
			return !isEqualsFormData(new FormData(this.#form), this.#originalFormData);
		}
	}

	exports.WorkflowAutoStart = Autostart;
	exports.WorkflowEditConstants = EditConstants;
	exports.WorkflowSingleStart = SingleStart;

})(this.BX.Bizproc.Component = this.BX.Bizproc.Component || {}, BX, BX.Event, BX.UI, BX.UI.Accessibility, BX, BX.Bizproc.A11y, BX.UI.IconSet, BX.UI, BX.UI.Dialogs, BX, BX, BX.Main);
//# sourceMappingURL=script.js.map
