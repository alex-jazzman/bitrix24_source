/* eslint-disable */
this.BX = this.BX || {};
this.BX.Bizproc = this.BX.Bizproc || {};
(function (exports, main_core, main_core_events, ui_buttons, bizproc_task, bizproc_a11y, ui_dialogs_messagebox) {
	'use strict';

	class ValidateHelper {
		static #NEED_PATTERN = new Set(['S:HTML', 'email', 'phone', 'web', 'im', 'E:EList']);
		static #MULTIPLE_WITH_NO_BRACKETS = new Set([...ValidateHelper.#NEED_PATTERN, 'user', 'S:employee', 'sms_sender', 'mail_sender']);
		static checkRequiredFieldsFilled(formData, requiredFields) {
			const errors = [];
			for (const requiredField of requiredFields) {
				const fieldId = this.#getFieldId(requiredField);
				const values = this.#getFieldValues(formData, requiredField, fieldId);
				if (!main_core.Type.isArrayFilled(values)) {
					const originalFieldId = requiredField.FieldId ?? requiredField.Id;
					if (!formData.keys().every(key => !key.includes(originalFieldId))) {
						continue;
					}
				}
				if (this.#isFieldEmpty(requiredField, values)) {
					errors.push({
						message: main_core.Loc.getMessage('BPWFI_SLIDER_ARGUMENT_NULL', {
							'#PARAM#': requiredField.Name
						}),
						fieldId: requiredField.Id
					});
				}
			}
			return errors;
		}
		static #getFieldId(field) {
			let fieldId = main_core.Type.isNil(field.FieldId) ? field.Id : field.FieldId;
			if (field.Multiple || field.Type === 'S:DiskFile') {
				fieldId = ValidateHelper.#MULTIPLE_WITH_NO_BRACKETS.has(field.Type) ? fieldId : `${fieldId}[]`;
			}
			return fieldId;
		}
		static #getFieldValues(formData, field, fieldId) {
			return ValidateHelper.#NEED_PATTERN.has(field.Type) ? this.#getPatternValues(formData, this.#getPattern(field, fieldId)) : formData.getAll(fieldId);
		}
		static #isFieldEmpty(field, values) {
			if (field.Multiple || field.Type === 'S:DiskFile' || ValidateHelper.#NEED_PATTERN.has(field.Type)) {
				return !main_core.Type.isArrayFilled(values) || values.every(value => this.#isValueEmpty(field, value));
			}
			return this.#isValueEmpty(field, values[0]);
		}

		/**
		 * A file field carries its value as a string: the uploader submits the identifier of every attached
		 * file in a hidden input, and an upload still running has no input yet. A File object comes from the
		 * legacy control, drawn where the card has no uploader to mount; there an empty name means no pick.
		 */
		static #isValueEmpty(field, value) {
			if (field.Type === 'file' && main_core.Type.isFile(value)) {
				return value.name === '';
			}
			return !main_core.Type.isStringFilled(value);
		}
		static #getPattern(field, fieldId) {
			if (field.Type === 'S:HTML') {
				return field.Multiple ? `${fieldId}\\[n\\d+\\]\\[TEXT\\]` : `${fieldId}\\[TEXT\\]`;
			}
			if (field.Type === 'E:EList') {
				return field.Multiple ? `${fieldId}\\[[n]?\\d+\\]\\[VALUE\\]` : `^${fieldId}$`;
			}
			if (field.Type === 'email' || field.Type === 'phone' || field.Type === 'web' || field.Type === 'im') {
				return `${fieldId}\\[${field.Type.toUpperCase()}\\]\\[n\\d+\\]\\[VALUE\\]`;
			}
			return '';
		}
		static #getPatternValues(formData, pattern) {
			const values = [];
			for (const [key, value] of formData.entries()) {
				if (new RegExp(pattern).test(key)) {
					values.push(value);
				}
			}
			return values;
		}
	}

	const TASK_DECISION_EVENT = 'bp-performer-task-decision';

	// Appended to the form for this very task, so they say nothing about the decision itself.
	const SERVICE_FIELD_NAMES = new Set(['taskId', 'workflowId', 'taskName']);

	// The key the values of the fields travel under, and so a name the decision itself cannot carry.
	const FIELDS_KEY = 'fields';

	// The base types whose control comes with a companion of its own - see {@see companionNames}.
	const DATE_BASE_TYPES = new Set(['date', 'datetime']);

	// The base type of a field asking for a file - see {@see hasFileField}.
	const FILE_BASE_TYPE = 'file';

	// The identifiers a value cannot travel to the server under: `hasOwnProperty` shadows the very method
	// `BX.ajax.prepareData` walks the object of the values by, and `__proto__` is not kept as a value at all -
	// it sets the prototype of that object instead.
	const UNSENDABLE_FIELD_IDS = new Set(['__proto__', 'hasOwnProperty']);
	function doTaskAction(data, slider, isLast, taskFields = null) {
		BX.SidePanel.Instance.postMessage(window, 'try-do-bp-task-event', {
			workflowId: data.get('workflowId')
		});
		return new Promise((resolve, reject) => {
			main_core.ajax.runAction('bizproc.task.do', {
				data
			}).then(response => {
				if (isLast) {
					BX.SidePanel.Instance.postMessage(slider, 'success-do-bp-task-event', {
						taskName: data.get('taskName')
					});
				}
				try {
					publishTaskDecision(data, slider, taskFields);
				} catch {
					// a decision nobody could read out of the form is not repeated for a group: the pass
					// hears the step out either way, and the buttons of the task do not stay dead
					publishDecision(data, slider, {
						taskRequest: null,
						hasFileFields: false
					});
				}
				resolve(response);
			}).catch(response => {
				BX.SidePanel.Instance.postMessage(slider, 'error-do-bp-task-event', {
					workflowId: data.get('workflowId')
				});
				reject(response);
			});
		});
	}

	/**
	 * EVENT-02: the decision just made, in the shape a group call reads it, so a group pass can repeat it
	 * for the tasks like this one.
	 */
	function publishTaskDecision(data, slider, taskFields) {
		publishDecision(data, slider, buildTaskDecision(data, taskFields));
	}

	/** The decision of the task on the bus of the side panels, whatever it turned out to be. */
	function publishDecision(data, slider, decision) {
		BX.SidePanel.Instance.postMessage(slider, TASK_DECISION_EVENT, {
			taskId: main_core.Text.toInteger(data.get('taskId')),
			taskRequest: decision.taskRequest,
			hasFileFields: decision.hasFileFields
		});
	}
	/**
	 * The decision the form of a single task holds, read out of it: the request a group call may repeat,
	 * and whether the form carried a file.
	 *
	 * The values of the form travel under `fields`, keyed by the identifiers of the fields - that is where
	 * the task reads them from when the decision comes for a set of tasks at once. The names of the
	 * controls of this form are not those identifiers (a field asking for information is rendered as
	 * `bpriact_<id>`), and this very form has them only because the request of a single task carries its
	 * whole body: the task then reads the values out of the request of the page. A group call has no such
	 * body - its request is about many tasks - so a decision that keeps control names arrives without
	 * values at all, and every task of the group is refused for a required field nobody filled.
	 *
	 * A control the type of a field renders next to the value ({@see companionNames}) has nowhere of its
	 * own to travel either, so its value goes inside the value of its field, as `{ value, tz }` - the form
	 * `Bitrix\Bizproc\BaseType\Date::internalizeValue` reads. A field of several values carries a record
	 * per value, paired by the order the form holds them in. Nothing is computed here: the timezone
	 * travels exactly as the form holds it, sentinels (`''` for the time of the server, `current` for the
	 * time of the person) included.
	 *
	 * Files stay in this window: a task that asks for one is not repeated for a group anyway. The base
	 * type of the field is what says the task asks for one ({@see hasFileField}) - the value of such a
	 * field travels as a string, so the object of a file no longer marks it. Staying here as well is a
	 * decision made on a control of a type nobody described here - repeating it would decide the group
	 * by another value than the very task the decision was made on ({@see isFieldCompanion}).
	 * And so does a decision on a field whose identifier no value can travel to the server under
	 * ({@see UNSENDABLE_FIELD_IDS}): the request of the group would lose that field, or never leave the page.
	 */
	function buildTaskDecision(formData, taskFields) {
		const controls = fieldControls(taskFields);
		const companions = companionControls(taskFields);
		const decision = {};
		const fields = {};
		const values = new Map();
		const listFields = new Set();
		const companionValues = new Map();
		let hasFileFields = hasFileField(taskFields);
		let hasUnknown = false;
		for (const [name, value] of formData.entries()) {
			if (value instanceof File) {
				hasFileFields = true;
				continue;
			}
			if (SERVICE_FIELD_NAMES.has(name)) {
				continue;
			}
			const control = controls.get(name);
			if (control) {
				if (control.isFile) {
					continue;
				}
				if (UNSENDABLE_FIELD_IDS.has(control.id)) {
					hasUnknown = true;
					continue;
				}
				pushValue(values, control.id, value);
				if (control.isList) {
					listFields.add(control.id);
				}
				continue;
			}

			// a control of the reserved name fills no field of the task, and it must not shadow the values
			if (name === FIELDS_KEY) {
				continue;
			}
			const companionId = companions.get(name);
			if (companionId !== undefined) {
				if (UNSENDABLE_FIELD_IDS.has(companionId)) {
					hasUnknown = true;
					continue;
				}
				pushValue(companionValues, companionId, value);
				continue;
			}
			if (isFieldCompanion(name, controls)) {
				hasUnknown = true;
				continue;
			}

			// the button of the decision, and anything else the form carries on its own
			decision[name] = nextValue(decision, name, value);
		}

		// a companion whose field brought no value at all is the same mismatch as a count that differs
		for (const id of companionValues.keys()) {
			if (!values.has(id)) {
				hasUnknown = true;
			}
		}
		for (const [id, collected] of values) {
			const companion = companionValues.get(id);
			if (companion === undefined) {
				fields[id] = listFields.has(id) ? collected : collected[0];
				continue;
			}

			// guessing which value lost its companion would shift a date without a word; the group falls apart instead
			if (companion.length !== collected.length) {
				hasUnknown = true;
				continue;
			}
			const paired = collected.map((value, index) => ({
				value,
				tz: companion[index]
			}));
			fields[id] = listFields.has(id) ? paired : paired[0];
		}
		if (Object.keys(fields).length > 0) {
			decision[FIELDS_KEY] = fields;
		}
		return {
			taskRequest: hasUnknown ? null : decision,
			hasFileFields
		};
	}
	/**
	 * The identifier, the name of the control and the multiplicity of a field, as the task and the form
	 * know them. A multi-value field is posted under the name with `[]` appended, and its identifier
	 * carries that suffix as well - neither belongs to the identifier the task knows the field by.
	 */
	function fieldControl(field) {
		const fullId = String(field?.Id ?? '');
		const id = fullId.replace('[]', '');
		const name = String(field?.FieldId ?? fullId).replace('[]', '');
		if (id === '' || name === '') {
			return null;
		}
		return {
			id,
			name,
			isList: field?.Multiple === true || fullId.endsWith('[]')
		};
	}

	/** The controls of the form by name, each pointing at the field it fills. */
	function fieldControls(taskFields) {
		const controls = new Map();
		if (!main_core.Type.isArrayFilled(taskFields)) {
			return controls;
		}
		taskFields.forEach(field => {
			const control = fieldControl(field);
			if (!control) {
				return;
			}
			const isFile = fieldBaseType(field) === FILE_BASE_TYPE;
			controls.set(control.name, {
				id: control.id,
				isList: control.isList,
				isFile
			});
			controls.set(`${control.name}[]`, {
				id: control.id,
				isList: true,
				isFile
			});
		});
		return controls;
	}

	/**
	 * The type of `Bitrix\Bizproc\BaseType` the server drew the control of a field by, which is what
	 * decides the companion controls: an alias of a date (`S:DateTime` of a list, `UF:date` of a custom
	 * field) draws the very same select of the timezone. A field assembled without that type - a slider
	 * opened before this travelled from the server, or a set built by hand - is read by its own type,
	 * as it was read before.
	 */
	function fieldBaseType(field) {
		const baseType = String(field?.BaseType ?? '');
		return baseType === '' ? String(field?.Type ?? '') : baseType;
	}

	/**
	 * Whether the task asks for a file at all, by the base type of its fields. An empty field carries no
	 * value of the form and a filled one carries a string - a token of an upload or an identifier of an
	 * attached file - so the values of the form no longer tell such a field apart.
	 */
	function hasFileField(taskFields) {
		return main_core.Type.isArrayFilled(taskFields) && taskFields.some(field => fieldBaseType(field) === FILE_BASE_TYPE);
	}

	/**
	 * The controls the type of a field renders next to the value and names after it. One record today: a
	 * date carries the timezone of its value in a select of its own (`tz_<control>` of
	 * `Bitrix\Bizproc\BaseType\Date::renderControl`, with `[]` appended for a field of several values).
	 * A new base type answering the same way is a new record here.
	 */
	function companionNames(field) {
		if (!DATE_BASE_TYPES.has(fieldBaseType(field))) {
			return [];
		}
		const control = fieldControl(field);
		if (!control) {
			return [];
		}
		return [control.isList ? `tz_${control.name}[]` : `tz_${control.name}`];
	}

	/** The companion controls of the form by name, each pointing at the identifier of the field its value goes inside. */
	function companionControls(taskFields) {
		const companions = new Map();
		if (!main_core.Type.isArrayFilled(taskFields)) {
			return companions;
		}
		taskFields.forEach(field => {
			const control = fieldControl(field);
			if (!control) {
				return;
			}
			companionNames(field).forEach(name => companions.set(name, control.id));
		});
		return companions;
	}

	/**
	 * Whether a control of the form carries the name of a field without being the control of it - the
	 * control of a type nobody described here. What such a type calls its controls is unknown by
	 * definition: a companion is named after the field by a prefix (`tz_<control>`) or a suffix
	 * (`<control>_tz`), and a type drawing a value of its own per row of a multiple field numbers them
	 * inside the name (`<control>[n0]`, `<control>[n0][VALUE]`). Carrying the name is therefore all this
	 * asks for, and a decision made with such a control is not repeated for a group at all: the value it
	 * carries has nowhere to travel, and the field it belongs to would reach the group empty.
	 *
	 * The controls of the described fields never reach here - `fieldControls` answers for the value and
	 * `companionControls` for the timezone next to it, both earlier - so the price of asking that little
	 * is a decision refused for a group over a control of the form that merely happens to be named after
	 * a field.
	 */
	function isFieldCompanion(name, controls) {
		for (const controlName of controls.keys()) {
			if (name.includes(controlName)) {
				return true;
			}
		}
		return false;
	}

	/** A value appended to the list its key collects, in the order the form holds them. */
	function pushValue(collected, key, value) {
		const list = collected.get(key) ?? [];
		list.push(value);
		collected.set(key, list);
	}

	/** A value under its key, and a key met more than once holds all of them. */
	function nextValue(target, key, value, isList) {
		const isKnownKey = Object.hasOwn(target, key);
		if (!isKnownKey) {
			return value;
		}
		const collected = target[key];
		if (Array.isArray(collected)) {
			return [...collected, value];
		}
		return isKnownKey ? [collected, value] : [value];
	}

	/**
	 * The mounted control of a file field, as much of it as the card speaks to. Its extension is loaded on
	 * demand (see #mountFileControls), so the real type is out of reach for an import here.
	 */

	// the extension the control of a file field is drawn by, loaded only by a card that holds such a field
	const FILE_FIELD_EXTENSION = 'bizproc.task.file-field';

	// EVENT-01: the exchange the slider asks the owner of a group pass what to open next by.
	const NEXT_TASK_REQUEST_EVENT = 'bp-performer-next-task-request';
	const NEXT_TASK_RESPONSE_EVENT = 'bp-performer-next-task-response';
	const SIDE_PANEL_MESSAGE_EVENT = 'SidePanel.Slider:onMessage';
	const VISUALLY_HIDDEN_STYLE = 'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;' + 'clip:rect(0 0 0 0);white-space:nowrap;border:0;';
	const FOCUSABLE_CONTROL_SELECTOR = 'input:not([type="hidden"]), select, textarea, button, [tabindex]';
	const FILE_FIELD_SELECTOR = '[data-role="bp-task-file"]';
	// An internal class of `ui.uploader.tile-widget` that no contract of that module declares, spelled the
	// same way in `bizproc.task.file-field`: the extension is loaded on demand, so neither can import it
	// from the other. A node missing under it is reported (see #reportMissingDropInputs).
	const FILE_DROP_INPUT_SELECTOR = 'input.ui-tile-uploader-drop-input';
	const FILE_FAILURE_SELECTOR = '[data-role="bp-task-file-error"]';
	const TEST_ID = {
		decision: 'workflow-info-task-decision-',
		delegate: 'workflow-info-task-delegate',
		field: 'workflow-info-task-field-',
		fieldError: 'task-field-error'
	};
	let fieldDescriptionSeq = 0;
	let a11yNodeSeq = 0;
	const nextA11yId = prefix => {
		a11yNodeSeq += 1;
		return `${prefix}-${a11yNodeSeq}`;
	};

	// A node referenced by an aria attribute needs an id; one the markup already carries is kept.
	const ensureId = (node, prefix) => {
		if (node.id === '') {
			main_core.Dom.attr(node, 'id', nextA11yId(prefix));
		}
		return node.id;
	};
	const describeControl = (control, descriptionId) => {
		const describedBy = (control.getAttribute('aria-describedby') || '').split(/\s+/).filter(id => id !== '');
		if (describedBy.includes(descriptionId)) {
			return;
		}
		describedBy.push(descriptionId);
		control.setAttribute('aria-describedby', describedBy.join(' '));
	};

	// Takes one description off a control, leaving every other one it carries in place.
	const undescribeControl = (control, descriptionId) => {
		const describedBy = (control.getAttribute('aria-describedby') || '').split(/\s+/).filter(id => id !== '' && id !== descriptionId);
		if (describedBy.length > 0) {
			control.setAttribute('aria-describedby', describedBy.join(' '));
			return;
		}
		control.removeAttribute('aria-describedby');
	};
	class WorkflowInfo {
		#isChanged = false;
		#messageBox;
		#canClose = false;
		#workflowResult = null;
		commentRequired = 'N';
		#canUseHumanResources;
		#uiButtons = [];
		// the controls of the file fields the form currently holds - see #mountFileControls
		#fileControls = [];
		// counts the forms drawn: a mount awaiting its extension belongs to the form that asked for it
		#fileControlsGeneration = 0;
		#isSendingDecision = false;
		// the panel of decisions is out of reach while a file is uploading - see #announceDecisions
		#areDecisionsBusy = false;
		// the button the focus stood on when the panel went out of reach - see #setButtonsBusy
		#busyFocusedButton = null;
		constructor(options) {
			this.currentUserId = options.currentUserId;
			this.workflowId = options.workflowId;
			this.taskId = options.taskId;
			this.taskUserId = options.taskUserId;
			this.taskButtons = options.taskButtons;
			this.taskForm = options.taskForm;
			this.taskFields = options.taskFields;
			this.taskName = options.taskName;
			this.buttonsPanel = options.buttonsPanel;
			this.workflowContent = options.workflowContent;
			this.canDelegateTask = options.canDelegateTask;
			this.fastClose = options.fastClose && !this.#hasFileFields();
			this.saveVariables = options.saveVariables;
			this.commentRequired = options.commentRequired;
			this.#canUseHumanResources = main_core.Text.toBoolean(options.canUseHumanResources);
			this.handleMarkAsRead = main_core.Runtime.debounce(this.#sendMarkAsRead, 100, this);
			this.#workflowResult = main_core.Type.isNil(options.workflowResult) ? null : options.workflowResult;
			this.#setupTabsAccessibility();
			this.#subscribeToChanges();
			this.#renderWorkflowResult();
		}

		/**
		 * One-time setup of everything that outlives a single task: the bus subscriptions and the listeners
		 * of the form node. A group pass draws task after task through `init()` in one and the same window,
		 * so anything bound here must not be bound there.
		 */
		#subscribeToChanges() {
			main_core_events.EventEmitter.subscribe('OnUCCommentWasRead', event => {
				const [xmlId] = event.getData();
				if (xmlId === `WF_${this.workflowId}`) {
					this.handleMarkAsRead();
				}
			});
			if (!this.taskForm) {
				return;
			}
			main_core.Event.bind(this.taskForm, 'change', () => {
				this.#isChanged = true;
			});
			main_core.Event.bind(this.taskForm, 'input', event => {
				const target = event.target;
				if (target.matches('input, textarea, select')) {
					const formRow = target.closest('.ui-form-content');
					if (formRow) {
						this.#clearError(formRow);
					}
				}
				this.#isChanged = true;
			});

			// rows of the form are drawn anew for every task, so the click is caught on the form itself
			main_core.Event.bind(this.taskForm, 'click', event => {
				const formRow = event.target?.closest?.('.ui-form-content');
				if (formRow) {
					this.#clearError(formRow);
				}
			});
			main_core_events.EventEmitter.subscribe('BX.UI.Selector:onChange', event => {
				const box = BX(`crm-${event.data[0].selectorId}-box`);
				const formRow = box.closest('.ui-form-content');
				if (formRow) {
					this.#clearError(formRow);
					this.#isChanged = true;
				}
			});
			main_core_events.EventEmitter.subscribe('BX.UI.EntitySelector.Dialog:Item:onSelect', event => {
				if (event.target.context === 'BIZPROC') {
					this.#isChanged = true;
				}
			});
			main_core_events.EventEmitter.subscribe('BX.UI.EntitySelector.Dialog:Item:onDeselect', event => {
				if (event.target.context === 'BIZPROC') {
					this.#isChanged = true;
				}
			});
			main_core_events.EventEmitter.subscribe('OnIframeKeyup', event => {
				const box = event.target.dom.cont;
				const formRow = box.closest('.ui-form-content');
				if (formRow) {
					this.#clearError(formRow);
				}
			});
			main_core_events.EventEmitter.subscribe('OnContentChanged', event => {
				if (event.target.dom.cont.closest('.ui-form-content')) {
					this.#isChanged = true;
				}
			});
			main_core_events.EventEmitter.subscribe('BX.Disk.Uploader.Integration:Item:onAdd', event => {
				if (event.target.getUploader().getHiddenFieldsContainer().closest('.ui-form-content')) {
					this.#isChanged = true;
				}
			});
			main_core_events.EventEmitter.subscribe('BX.Disk.Uploader.Integration:Item:onRemove', event => {
				if (event.target.getUploader().getHiddenFieldsContainer().closest('.ui-form-content')) {
					this.#isChanged = true;
				}
			});

			// the panel is gone for good, so the widgets of the form go with it
			main_core_events.EventEmitter.subscribe('SidePanel.Slider:onCloseComplete', event => {
				if (event.getTarget().getWindow() === window) {
					this.#destroyFileControls();
				}
			});
			main_core_events.EventEmitter.subscribe('SidePanel.Slider:onClose', event => {
				if (event.getTarget().getWindow() === window && this.#isChanged && !this.#canClose) {
					event.getCompatData()[0].denyAction();
					if (!this.#messageBox?.getPopupWindow().isShown()) {
						this.#showConfirmDialog();
					}
				}
			});
		}
		#renderWorkflowResult() {
			const resultNode = this.workflowContent?.querySelector('[data-role="bp-workflow-result"]');
			if (!resultNode || !this.#workflowResult) {
				return;
			}
			main_core.Runtime.loadExtension('bizproc.workflow.result').then(exports => {
				if (exports?.WorkflowResult) {
					new exports.WorkflowResult(this.#workflowResult).renderTo(resultNode);
				}
			}).catch(() => {});
		}
		#setupTabsAccessibility() {
			const timelineTab = this.workflowContent?.querySelector('[data-role="wfi-timeline-tab"]');
			if (timelineTab) {
				// inline onclick opens Timeline; empty handler adds keyboard-only
				// activation (mouse works even if this extension fails to load)
				bizproc_a11y.makeActivatable(timelineTab, () => {});
			}
		}
		#setupTaskFormA11y() {
			if (!this.taskForm) {
				return;
			}
			this.taskForm.querySelectorAll('.ui-form-row').forEach(row => {
				const labelNode = row.querySelector('.ui-ctl-label-text');
				if (!labelNode) {
					return;
				}
				const label = labelNode.textContent.replaceAll('*', '').replace(/:\s*$/, '').trim();
				if (label === '') {
					return;
				}
				const content = row.querySelector('.ui-form-content');
				if (!content) {
					return;
				}
				this.#nameFileControl(content, labelNode);
				content.querySelectorAll('input:not([type="hidden"]), select, textarea').forEach(control => {
					const hasName = control.getAttribute('aria-label') || control.getAttribute('aria-labelledby') || control.labels && control.labels.length > 0;
					if (!hasName) {
						control.setAttribute('aria-label', label);
					}
				});
			});
		}

		/**
		 * Names the drop zone of a file field. The zone carries a label of its own - the invitation to drop a
		 * file here - so the naming above passes it by. Both are referenced instead, the name of the row ahead
		 * of the label of the zone: the text seen on screen has to stay part of the accessible name (2.5.3).
		 */
		#nameFileControl(content, labelNode) {
			content.querySelectorAll(FILE_FIELD_SELECTOR).forEach(container => {
				const control = container.querySelector(FILE_DROP_INPUT_SELECTOR);
				if (!control || control.getAttribute('aria-labelledby')) {
					return;
				}
				const ownLabels = [...(control.labels ?? [])].map(node => ensureId(node, 'bp-wfi-file-label'));
				control.setAttribute('aria-labelledby', [ensureId(labelNode, 'bp-wfi-field-label'), ...ownLabels].join(' '));
			});
		}

		// Draws the task the form currently holds. A group pass calls it for every task of its queue.
		init() {
			this.#isSendingDecision = false;
			if (this.buttonsPanel) {
				this.#renderButtons();
			}
			this.handleMarkAsRead();
			if (this.taskForm) {
				// the drop zone of a file field reaches the markup only with the mounted widget, so a form
				// holding one wires its accessibility a second time once the mount is over
				this.#mountFileControls();
				BX.UI.Hint.init(this.taskForm);
				this.#applyFieldDescriptions();
			}
			this.#setupTaskFormA11y();
			const desc = this.workflowContent.querySelector('.bp-workflow-info__desc-inner');
			if (desc) {
				BX.UI.Hint.init(desc);
			}
		}

		/**
		 * Mounts a control into every container of a file field the form holds (TPL-01). The extension carries
		 * the uploader and Vue behind it, so a card of a task without a file field - the common one - pays
		 * neither the bytes nor the evaluation. The lifetime of a widget belongs to the card: a group pass
		 * draws task after task in one window, so a mount always follows the destroy of what the previous
		 * task left, or a mounted application would stay on a node torn off the document.
		 */
		#mountFileControls() {
			this.#destroyFileControls();
			const nodes = [...this.taskForm.querySelectorAll(FILE_FIELD_SELECTOR)];
			if (nodes.length === 0) {
				this.#applyUploadingState();
				return;
			}
			const generation = this.#fileControlsGeneration;
			main_core.Runtime.loadExtension(FILE_FIELD_EXTENSION).then(exports => {
				// the next task of a group pass may already be on screen by the time the extension answers
				if (generation !== this.#fileControlsGeneration) {
					return;
				}
				if (!main_core.Type.isFunction(exports?.mountTaskFileControl)) {
					this.#reportFileControlsFailure(nodes, `${FILE_FIELD_EXTENSION} draws no control of a file field`);
					return;
				}
				const mounted = [];
				nodes.forEach(node => {
					// dropping a file fires neither input nor click, so what the form does on those
					// events - forgetting the error of the row, remembering the change - is done off the
					// announcement of the control instead
					const formRow = node.closest('.ui-form-content');
					const control = exports.mountTaskFileControl(node, {
						onChange: () => {
							this.#isChanged = true;
							if (formRow) {
								this.#clearError(formRow);
							}
						},
						onUploadingChange: () => this.#applyUploadingState()
					});
					if (control) {
						this.#fileControls.push(control);
						mounted.push(node);
					}
				});
				this.#applyUploadingState();
				// the drop zone the row is named and described by exists only now; both passes skip what
				// already carries a name and a description, so the rows wired above are left alone
				this.#setupTaskFormA11y();
				this.#applyFieldDescriptions();
				this.#reportMissingDropInputs(mounted);
			}).catch(error => {
				if (generation === this.#fileControlsGeneration) {
					this.#reportFileControlsFailure(nodes, error);
				}
			});
			this.#applyUploadingState();
		}

		/**
		 * Says of a container left without its control. Nothing else on the card would: a container with no
		 * widget holds no element of the form at all, so a required field fails validation with a message
		 * nothing on screen can answer, and an optional one lets the task go without the file.
		 */
		#reportFileControlsFailure(nodes, reason) {
			console.error(`${FILE_FIELD_EXTENSION}: the control of a file field is not drawn`, reason);

			// the phrase has to stand in the BX.message list of template.php
			const message = main_core.Loc.getMessage('BPWFI_SLIDER_FILE_CONTROL_ERROR') ?? '';
			nodes.forEach(node => {
				if (node.querySelector(FILE_FAILURE_SELECTOR)) {
					return;
				}
				main_core.Dom.append(main_core.Tag.render`
					<div
						class="ui-form-notice"
						data-role="bp-task-file-error"
						role="alert"
					>${main_core.Text.encode(message)}</div>
				`, node);
			});
		}

		/**
		 * Says of a mounted file field whose drop zone is not there. That node carries the name of the field,
		 * its description and the binding of its error message, and it is found by a class no contract
		 * declares (FILE_DROP_INPUT_SELECTOR): a rename would leave the field silent on all three while the
		 * tiles go on working.
		 */
		#reportMissingDropInputs(nodes) {
			nodes.filter(node => !node.querySelector(FILE_DROP_INPUT_SELECTOR)).forEach(node => {
				console.error(`bizproc.workflow.info: no ${FILE_DROP_INPUT_SELECTOR} in a mounted file field,` + ' so the field goes without a name, a description and a binding for its error', node);
			});
		}
		#destroyFileControls() {
			this.#fileControlsGeneration += 1;
			this.#fileControls.forEach(control => control.destroy());
			this.#fileControls = [];
		}

		/**
		 * A file still on its way to the server is no value yet: a required field would fail validation and an
		 * optional one would send the task without the file. The panel of decisions holds until the upload is
		 * over, and stays out of the way while a decision is being sent - there the busy state is its own.
		 */
		#applyUploadingState() {
			if (this.#isSendingDecision) {
				return;
			}
			const uploading = this.#fileControls.some(control => control.isUploading());
			this.#announceDecisions(uploading);
			this.#setButtonsBusy(uploading);
		}

		/**
		 * A disabled button leaves the Tab order without a word of why, so the panel says of itself when it
		 * goes out of reach and when it comes back. Only a turn of the state is spoken: it is applied on
		 * every step of an upload, and a card mounted with nothing uploading says nothing at all.
		 */
		#announceDecisions(busy) {
			if (busy === this.#areDecisionsBusy) {
				return;
			}

			// both phrases have to stand in the BX.message list of template.php
			const message = busy ? main_core.Loc.getMessage('BPWFI_SLIDER_DECISIONS_BUSY') : main_core.Loc.getMessage('BPWFI_SLIDER_DECISIONS_READY');
			this.#areDecisionsBusy = busy;
			bizproc_a11y.announce(message);
		}

		// Links each field's description to the control of its row via aria-describedby so screen readers
		// announce it on focus. The visual ui.hint stays mouse-only, so this is the AT-facing channel.
		#applyFieldDescriptions() {
			if (!this.taskForm || !main_core.Type.isArrayFilled(this.taskFields)) {
				return;
			}
			const fieldRows = [...this.taskForm.querySelectorAll('.ui-form-row[data-cid]')];
			this.taskFields.forEach(field => {
				const description = main_core.Type.isStringFilled(field.Description) ? field.Description.trim() : '';
				if (description === '') {
					return;
				}

				// The server template renders data-cid without the `[]` suffix, but the client re-render
				// (#renderTaskFields) keeps the full Id, so multi-value rows may use either form.
				const fullId = String(field.Id);
				const cid = fullId.replace('[]', '');
				const row = fieldRows.find(candidate => candidate.getAttribute('data-cid') === cid) ?? (cid === fullId ? null : fieldRows.find(candidate => candidate.getAttribute('data-cid') === fullId));
				const content = row?.querySelector('.ui-form-content');
				if (!content) {
					return;
				}
				const control = this.#getRowControl(content);
				if (!control) {
					return;
				}
				let descNode = content.querySelector('[data-role="field-description"]');
				if (!descNode) {
					fieldDescriptionSeq += 1;
					const descId = `bp-wfi-field-desc-${fieldDescriptionSeq}`;
					descNode = main_core.Tag.render`<span
					id="${descId}"
					data-role="field-description"
					style="${VISUALLY_HIDDEN_STYLE}"
				>${main_core.Text.encode(description)}</span>`;
					content.appendChild(descNode);
				}
				describeControl(control, descNode.id);
			});
		}

		/**
		 * The control the row is named and described by. Where a file field is drawn by a widget, the first
		 * focusable node of the cell is a button of an attached tile, while the control of the field itself
		 * is the drop zone of that widget.
		 */
		#getRowControl(content) {
			const fileField = content.querySelector(FILE_FIELD_SELECTOR);
			return fileField?.querySelector(FILE_DROP_INPUT_SELECTOR) ?? content.querySelector(FOCUSABLE_CONTROL_SELECTOR);
		}
		#renderButtons() {
			this.#uiButtons = [];
			this.#busyFocusedButton = null;
			if (this.taskButtons) {
				main_core.Dom.clean(this.buttonsPanel);
				this.taskButtons.forEach(taskButton => {
					const targetStatus = new bizproc_task.UserStatus(taskButton.TARGET_USER_STATUS);
					const isDecline = targetStatus.isNo() || targetStatus.isCancel();
					const button = new ui_buttons.Button({
						color: isDecline ? ui_buttons.ButtonColor.LIGHT_BORDER : ui_buttons.ButtonColor.SUCCESS,
						// icon: isDecline ? ButtonIcon.CANCEL : ButtonIcon.DONE,
						round: true,
						size: ui_buttons.ButtonSize.MEDIUM,
						// noCaps: true,
						text: taskButton.TEXT,
						onclick: btn => this.#handleTaskButtonClick(taskButton, btn)
					});
					main_core.Dom.style(button.getContainer(), 'minWidth', '160px');
					main_core.Dom.style(button.getContainer(), 'maxWidth', '200px');
					main_core.Dom.attr(button.getContainer(), 'title', taskButton.TEXT);
					// the decision is named by the field of the task, the same name the list of processes
					// offers a group decision by - so a test says which decision it takes, not which caption
					main_core.Dom.attr(button.getContainer(), 'data-testid', `${TEST_ID.decision}${taskButton.NAME}`);
					main_core.Dom.append(button.getContainer(), this.buttonsPanel);
					this.#uiButtons.push(button);
				});
			}
			if (this.canDelegateTask) {
				const button = new ui_buttons.Button({
					color: ui_buttons.ButtonColor.LINK,
					size: ui_buttons.ButtonSize.MEDIUM,
					// noCaps: true,
					text: main_core.Loc.getMessage('BPWFI_SLIDER_BUTTON_DELEGATE'),
					onclick: btn => this.#handleDelegateButtonClick(btn)
				});
				main_core.Dom.style(button.getContainer(), 'minWidth', '160px');
				main_core.Dom.style(button.getContainer(), 'maxWidth', '200px');
				main_core.Dom.attr(button.getContainer(), 'data-testid', TEST_ID.delegate);
				main_core.Dom.append(button.getContainer(), this.buttonsPanel);
				this.#uiButtons.push(button);
			}
		}

		/**
		 * Takes the panel of decisions out of reach and gives it back. A disabled node leaves the Tab order
		 * with the focus on it, and the focus then falls to the document with nothing to bring it back
		 * (2.4.3), so the button it stood on is remembered and takes it back once the panel is at hand again -
		 * but only while the focus is still nowhere: whoever went on to another control is left there.
		 */
		#setButtonsBusy(busy, clocking = null) {
			if (busy) {
				// a step of an upload applies the state anew; the focus was taken by the first of them
				this.#busyFocusedButton = this.#focusedButton() ?? this.#busyFocusedButton;
			}
			this.#uiButtons.forEach(button => {
				if (button === clocking) {
					button.setClocking(busy);
				} else {
					button.setDisabled(busy);
				}
			});
			if (!busy) {
				this.#restoreButtonsFocus();
			}
		}
		#focusedButton() {
			const focused = document.activeElement;
			if (!focused) {
				return null;
			}
			return this.#uiButtons.find(button => button.getContainer().contains(focused)) ?? null;
		}
		#restoreButtonsFocus() {
			const button = this.#busyFocusedButton;
			this.#busyFocusedButton = null;
			if (button && this.#isFocusNowhere()) {
				button.getContainer().focus();
			}
		}

		// The focus is nowhere when it stands on the document itself - where a disabled node leaves it.
		#isFocusNowhere() {
			const focused = document.activeElement;
			return !focused || focused === document.body || focused === document.documentElement;
		}
		#handleTaskButtonClick(taskButton, uiButton) {
			const formData = new FormData(this.taskForm);
			const errors = ValidateHelper.checkRequiredFieldsFilled(formData, this.#getRequiredFields(taskButton.NAME));
			if (main_core.Type.isArrayFilled(errors)) {
				this.#showErrors(errors);
				return;
			}
			formData.append('taskId', this.taskId);
			formData.append('workflowId', this.workflowId);
			formData.append('taskName', this.taskName);
			formData.append(taskButton.NAME, taskButton.VALUE);
			const slider = BX.SidePanel.Instance.getSliderByWindow(window);

			// EVENT-01 is asked before the decision goes out, while the form is still open: the answer comes
			// back within the request itself, so both the process of the next task and the very presence of a
			// group pass behind the form are known here. A form a pass owns never closes itself AHEAD of the
			// decision - the record of the decision (EVENT-02) would then reach the pass after the close of
			// the form, which is what made a performed task count as skipped.
			const nextTaskAnswer = this.#requestNextQueueAnswer();
			const nextWorkflowId = this.#nextWorkflowId(nextTaskAnswer);
			const fastClose = this.fastClose && nextTaskAnswer === null;
			this.#isSendingDecision = true;
			this.#setButtonsBusy(true, uiButton);
			doTaskAction(formData, slider, fastClose, this.taskFields).then(() => {
				slider?.setCacheable(false);

				// The form is drawn anew in place within its own process only. Everything around the form
				// - the type of the document, the tab of the timeline, the link to the document, the
				// discussion - the server drew for the process of this panel, and none of it follows a
				// task of another process. Such a task is left to the pass: it opens the form of the next
				// task of its queue in a panel of its own, once this one is gone.
				if (fastClose || nextWorkflowId !== this.workflowId) {
					this.#canClose = true;
					slider?.close();
					return;
				}
				main_core.Dom.addClass(this.workflowContent, 'fade-out');
				this.#getNextTaskOrClose(nextWorkflowId);
			}).catch(response => {
				// the panel goes back to whatever the uploaders say and not straight to reachable: a file
				// put into the field while the decision was on its way is uploading still, and the control
				// speaks only of a TURN of that state - it would say nothing more of it here
				this.#isSendingDecision = false;
				uiButton.setClocking(false);
				this.#applyUploadingState();
				this.#showErrors(this.#prepareErrors(response.errors));
			});
		}
		#isNeedValidate(buttonName) {
			return !(this.#isCanceled(buttonName) && !this.saveVariables);
		}
		#isCanceled(buttonName) {
			return buttonName === 'cancel' || buttonName === 'nonapprove';
		}
		#hasFileFields() {
			return main_core.Type.isArrayFilled(this.taskFields) && this.taskFields.some(field => field.Type === 'file');
		}
		#getRequiredFields(buttonName) {
			if (main_core.Type.isNil(this.taskFields)) {
				return [];
			}
			const fields = this.#isNeedValidate(buttonName) ? this.taskFields.filter(field => field.Required) : [];
			if (this.commentRequired === 'YA' && !this.#isCanceled(buttonName) || this.commentRequired === 'YR' && this.#isCanceled(buttonName)) {
				const comment = this.taskFields.find(field => field.Id === 'task_comment');
				if (comment) {
					fields.push(comment);
				}
			}
			return fields;
		}

		/**
		 * Which process the next form is read by. The owner of a group pass names the process of the next
		 * task of its queue (EVENT-01); with no pass behind the slider - and once the queue is over - the
		 * process of the task just performed is taken, as before.
		 */
		#nextWorkflowId(answer) {
			return main_core.Text.toInteger(answer?.taskId) > 0 && main_core.Type.isStringFilled(answer?.workflowId) ? answer.workflowId : this.workflowId;
		}

		/**
		 * Asks the window that opened the slider what goes next (EVENT-01) and returns the answer, or null
		 * when nobody answered. The owner of the queue answers on the same bus while the request is being
		 * delivered - `SliderManager.postMessage` emits the message synchronously - so the answer is at hand
		 * the moment the request returns, and the slider never waits for a window that is not there.
		 *
		 * An answer, even one naming no task, means a group pass owns this form; no answer at all means the
		 * slider is on its own and keeps to its own behaviour.
		 *
		 * A process is what the answer addresses, and the server gives out the task awaiting a decision in
		 * it, so the form that opens may belong to another task of that process than the one the person
		 * picked. The pass then goes on with the task that opened.
		 */
		#requestNextQueueAnswer() {
			const emitter = main_core.Page.getRootWindow()?.BX?.Event?.EventEmitter;
			if (!emitter) {
				return null;
			}

			// The answer is addressed to the panel that asked, and a form outside a panel asks nobody.
			const ownSlider = BX.SidePanel.Instance.getSliderByWindow(window);
			if (!ownSlider) {
				return null;
			}
			let answer = null;
			const handleResponse = event => {
				// The bus hands over a wrapper; the message of the side panel is inside it.
				const [message] = event.getCompatData() ?? [];
				if (message?.getEventId() !== NEXT_TASK_RESPONSE_EVENT) {
					return;
				}

				// the answer of the request of this very form, and not one of another panel of the person
				if (!main_core.Type.isFunction(message.getSender) || message.getSender() !== ownSlider) {
					return;
				}
				answer = message.getData() ?? {};
			};
			emitter.subscribe(SIDE_PANEL_MESSAGE_EVENT, handleResponse);
			try {
				BX.SidePanel.Instance.postMessage(window, NEXT_TASK_REQUEST_EVENT, {
					finishedTaskId: this.taskId
				});
			} finally {
				emitter.unsubscribe(SIDE_PANEL_MESSAGE_EVENT, handleResponse);
			}
			return answer;
		}
		#getNextTaskOrClose(workflowId) {
			main_core.ajax.runAction('bizproc.task.getUserTaskByWorkflowId', {
				data: {
					workflowId
				}
			}).then(res => {
				if (BX.type.isArray(res.data.additionalParams) && res.data.additionalParams.length === 0) {
					this.#canClose = true;
					BX.SidePanel.Instance.getSliderByWindow(window)?.close();
				} else {
					this.#renderNextTask(res.data, workflowId);
				}
			}).catch(response => {
				main_core.Dom.toggleClass(this.workflowContent, 'fade-out fade-in');
				ui_dialogs_messagebox.MessageBox.alert(response.errors.pop().message);
			});
		}
		#prepareErrors(responseErrors) {
			const errors = [];
			for (const error of responseErrors) {
				errors.push({
					fieldId: error.customData ?? null,
					message: error.message
				});
			}
			return errors;
		}
		#handleDelegateButtonClick(uiButton) {
			uiButton.setDisabled(true);
			main_core.Runtime.loadExtension('ui.entity-selector').then(exports => {
				const {
					Dialog
				} = exports;
				uiButton.setDisabled(false);
				const dialog = new Dialog({
					targetNode: uiButton.getContainer(),
					context: 'bp-task-delegation',
					entities: [{
						id: 'user',
						options: {
							intranetUsersOnly: true,
							emailUsers: false,
							inviteEmployeeLink: false,
							inviteGuestLink: false
						}
					}, {
						id: this.#canUseHumanResources ? 'structure-node' : 'department',
						options: {
							selectMode: 'usersOnly'
						}
					}],
					popupOptions: {
						bindOptions: {
							forceBindPosition: true
						}
					},
					enableSearch: true,
					events: {
						'Item:onSelect': event => {
							const item = event.getData().item;
							this.#delegateTask(item.getId());
						},
						onHide: event => {
							event.getTarget().destroy();
						}
					},
					hideOnSelect: true,
					offsetTop: 3,
					clearUnavailableItems: true,
					multiple: false
				});
				dialog.show();
			}).catch(e => {
				console.error(e);
				uiButton.setDisabled(false);
			});
		}
		#delegateTask(toUserId) {
			const actionData = {
				taskIds: [this.taskId],
				fromUserId: this.taskUserId || this.currentUserId,
				toUserId
			};
			this.#setButtonsBusy(true);
			main_core.ajax.runAction('bizproc.task.delegate', {
				data: actionData
			}).then(response => {
				this.#canClose = true;
				BX.SidePanel.Instance.getSliderByWindow(window)?.close();
			}).catch(response => {
				this.#setButtonsBusy(false);
				ui_dialogs_messagebox.MessageBox.alert(response.errors.pop().message);
			});
		}
		#sendMarkAsRead() {
			main_core.ajax.runAction('bizproc.workflow.comment.markAsRead', {
				data: {
					workflowId: this.workflowId,
					userId: this.currentUserId
				}
			});
		}
		#clearError(target) {
			// the notice of a container left without its control is not an error of an attempt: the mount
			// happens once per task, and a click on the row would take the message away for good
			const errorContainer = target.querySelector(`.ui-form-notice:not(${FILE_FAILURE_SELECTOR})`);
			if (errorContainer) {
				this.#unlinkError(target, errorContainer.id);
				BX.Dom.remove(errorContainer);
			}
		}

		/**
		 * The message goes, and with it every mark it left on the control: a description pointing at a node
		 * that is gone announces nothing, and the field is not invalid any more.
		 */
		#unlinkError(content, errorId) {
			content.querySelectorAll('[aria-invalid]').forEach(control => {
				control.removeAttribute('aria-invalid');
				undescribeControl(control, errorId);
			});
		}
		#showErrors(errors) {
			if (BX.type.isArray(errors)) {
				const popupErrors = [];
				errors.forEach(error => {
					const fieldName = error.fieldId;
					if (this.taskForm && fieldName) {
						this.#showError(error.message, fieldName);
					} else {
						popupErrors.push(error.message);
					}
				});
				if (popupErrors.length > 0) {
					ui_dialogs_messagebox.MessageBox.alert(popupErrors.join(', '));
				}
			}
		}
		#showError(message, id) {
			const field = this.taskForm.querySelector(`[data-cid="${id}"]`);
			if (!field) {
				return;
			}
			const parentContainer = field.querySelector('.ui-form-content');
			if (!parentContainer) {
				return;
			}

			// the message of the previous attempt goes first, marks on the control included: a live region
			// announces what appears in it, so a message already on screen leaves the next attempt silent
			this.#clearError(parentContainer);

			// the role lives on the node carrying the text, the way the start form of a process does it
			const errorContainer = BX.Dom.create('div', {
				attrs: {
					className: 'ui-form-notice',
					id: nextA11yId('bp-wfi-field-error'),
					role: 'alert',
					'data-testid': TEST_ID.fieldError
				}
			});
			errorContainer.innerText = message;
			BX.Dom.append(errorContainer, parentContainer);
			this.#linkError(parentContainer, errorContainer.id);
		}

		/**
		 * Binds the control of the row to the message drawn for it: a screen reader reads the error with the
		 * name of the field, and the field reports that it is invalid.
		 */
		#linkError(content, errorId) {
			const control = this.#getRowControl(content);
			if (!control) {
				return;
			}
			describeControl(control, errorId);
			control.setAttribute('aria-invalid', 'true');
		}
		#renderNextTask(data, workflowId) {
			this.#isChanged = false;
			this.#renderTaskFields(data);
			if (data.additionalParams) {
				// What the form is about travels with the task it draws: the process it belongs to and its
				// name. Everything the form says of itself afterwards - the comments it marks as read, the
				// messages it publishes on the bus, the task it names in them - is about the task on screen.
				this.workflowId = workflowId;
				this.taskId = data.additionalParams.ID;
				// the server draws the name of a task decoded (`WorkflowUserDetailView::prepareTasks`), and the
				// answer of the action gives it as it lies in the base: decoded here, both renders of the form
				// name the task alike, and the name stays a text - it is written to a text node and encoded
				// wherever it travels on
				this.taskName = main_core.Text.decode(data.additionalParams.NAME);
				this.saveVariables = data.additionalParams.saveVariables;
				this.commentRequired = data.additionalParams.commentRequired;
				this.taskFields = data.additionalParams.FIELDS;
				this.fastClose = data.additionalParams.IS_LAST_TASK_FOR_USER && !this.#hasFileFields();
				const subject = this.workflowContent.querySelector('.bp-workflow-info__subject');
				if (subject) {
					subject.innerText = this.taskName;
				}
				const desc = this.workflowContent.querySelector('.bp-workflow-info__desc-inner');
				if (desc) {
					const descWrap = desc.closest('.bp-workflow-info__tabs-block');
					if (data.additionalParams.DESCRIPTION.length > 0) {
						main_core.Dom.removeClass(descWrap, 'block-hidden');
					} else {
						main_core.Dom.addClass(descWrap, 'block-hidden');
					}
					desc.innerHTML = data.additionalParams.DESCRIPTION;
					BX.UI.Hint.init(desc);
				}
				const slider = BX.SidePanel.Instance.getSliderByWindow(window);
				if (slider) {
					const currentUrl = slider.getUrl();
					const newUrl = currentUrl.replace(/\/bizproc\/\d+\//, `/bizproc/${this.taskId}/`);
					slider.setUrl(newUrl);
					top.history.replaceState({}, '', newUrl);
				}
			}
			if (data.additionalParams && data.additionalParams.BUTTONS) {
				this.taskButtons = data.additionalParams.BUTTONS;
			}
			this.init();
			main_core.Dom.removeClass(this.workflowContent, 'fade-out');
			main_core.Dom.addClass(this.workflowContent, 'fade-in');
			main_core.Event.bindOnce(this.workflowContent, 'animationend', () => {
				main_core.Dom.removeClass(this.workflowContent, 'fade-in');
			});
		}
		#renderTaskFields(data) {
			// before the rows of the form are dropped: past the clean the widgets would sit on torn-off nodes
			this.#destroyFileControls();
			const taskFields = this.workflowContent.querySelector('.bp-workflow-info__editor');
			if (BX.type.isArray(data.html) && data.html.length > 0) {
				main_core.Dom.removeClass(taskFields, 'block-hidden');
				main_core.Dom.clean(this.taskForm);
				data.html.forEach((renderedControl, controlId) => {
					const fieldData = data.additionalParams?.FIELDS?.[controlId];
					if (fieldData) {
						const labelClass = fieldData.Required ? 'ui-form-label --required' : 'ui-form-label';
						const description = main_core.Type.isStringFilled(fieldData.Description) ? fieldData.Description.trim() : '';
						const hintNode = description !== '' ? main_core.Tag.render`<span class="bp-workflow-info__field-hint" data-testid="task-field-hint" data-hint="${main_core.Text.encode(description)}"></span>` : '';
						// the marker of a row drops the `[]` of a multi-value field, so the row of a field
						// is reached by one and the same marker in both renders of the form
						const testId = TEST_ID.field + String(fieldData.Id).replace('[]', '');
						const node = main_core.Tag.render`
						<div
							class="ui-form-row"
							data-cid="${main_core.Text.encode(fieldData.Id)}"
							data-testid="${main_core.Text.encode(testId)}"
						>
							<div class="${labelClass}">
								<div class="ui-ctl-label-text">${main_core.Text.encode(fieldData.Name)}${hintNode}</div>
							</div>
							<div class="ui-form-content"></div>
						</div>
					`;
						BX.Runtime.html(node.querySelector('.ui-form-content'), renderedControl);
						this.taskForm.append(node);
					}
				});
			} else {
				main_core.Dom.addClass(taskFields, 'block-hidden');
			}
		}
		#showConfirmDialog() {
			this.#messageBox = ui_dialogs_messagebox.MessageBox.confirm(main_core.Loc.getMessage('BPWFI_SLIDER_CONFIRM_DESCRIPTION'), main_core.Loc.getMessage('BPWFI_SLIDER_CONFIRM_TITLE'), () => {
				this.#canClose = true;
				BX.SidePanel.Instance.getSliderByWindow(window)?.close();
			}, main_core.Loc.getMessage('BPWFI_SLIDER_CONFIRM_ACCEPT'), () => {
				this.#messageBox.close();
				this.#messageBox = null;
			}, main_core.Loc.getMessage('BPWFI_SLIDER_CONFIRM_CANCEL'));
		}
	}

	exports.WorkflowInfo = WorkflowInfo;

})(this.BX.Bizproc.Component = this.BX.Bizproc.Component || {}, BX, BX.Event, BX.UI, BX.Bizproc, BX.Bizproc.A11y, BX.UI.Dialogs);
//# sourceMappingURL=script.js.map
