/* eslint-disable */
(function (exports, main_core) {
	'use strict';

	const REACTION_MODE_FIELD_NAME = 'ReactionMode';
	const FIELDS_FIELD_NAME = 'Fields';
	const FIELDS_ROW_ID = `row_${FIELDS_FIELD_NAME}`;
	const MODE_FIELDS = 'fields';
	const MODE_ANY = 'any';

	// The switcher is built from the declared modes only, so an empty option never becomes a button.
	const REACTION_MODES = [MODE_FIELDS, MODE_ANY];
	const NODE_SETTINGS_SAVING_EVENT = 'Bizproc.NodeSettings:nodeSettingsSaving';
	const SETTINGS_BOX_SELECTOR = '.node-settings-edit-box';
	const SETTINGS_CAPTION_SELECTOR = '.node-settings-edit-caption';

	// No form carries this id, and an unmatched form attribute leaves the element without a form owner.
	const DETACHED_FORM_ID = 'crm-trigger-reaction-mode-detached';
	const SWITCHER_TEST_ID = 'crm-reaction-mode-switcher';
	const OPTION_TEST_ID_PREFIX = 'crm-reaction-mode-option-';
	const SELECT_TEST_ID = 'crm-reaction-mode-select';
	const FIELDS_ROW_TEST_ID = 'crm-reaction-mode-fields-row';
	const FIELDS_CONTROL_TEST_ID = 'crm-reaction-mode-fields-control';
	const FIELDS_ERROR_TEST_ID = 'crm-reaction-mode-fields-error';

	// The part of the ui.system.radiobutton contract the switcher relies on. The extension is loaded at
	// runtime, so a static type import would suggest a build-time dependency the renderer must not have.

	/**
	 * Radio view over the standard `ReactionMode` select plus the behaviour that depends on the mode:
	 * visibility of the tracked fields block and the client-side check for an empty selection.
	 *
	 * The select stays the value holder and is only hidden once the radio is rendered: a failed switcher
	 * leaves the user with a working control and does not lose the mode on save.
	 */
	class ReactionModeControl {
		#select = null;
		#fieldsRow = null;
		#fieldsControl = null;
		#requiredErrorMessage = '';
		#radioButtonExtension = null;
		#switcher = null;
		#fieldsError = null;
		#options = [];
		#isDestroyed = false;
		#onModeChangeHandler = null;
		#onFieldsChangeHandler = null;
		#onSettingsSavingHandler = null;
		static find(form, activityFields, radioButtonExtension) {
			const select = form?.querySelector(`[name="${REACTION_MODE_FIELD_NAME}"]`) ?? null;
			return select ? new ReactionModeControl(form, select, activityFields?.[FIELDS_FIELD_NAME], radioButtonExtension) : null;
		}
		constructor(form, select, fieldsField, radioButtonExtension) {
			this.#select = select;
			// Rows are addressed inside the own form only: several settings panels may share row ids.
			this.#fieldsRow = form.querySelector(`[id="${FIELDS_ROW_ID}"]`);
			this.#fieldsControl = this.#fieldsRow?.querySelector('select, input, textarea') ?? null;
			this.#requiredErrorMessage = fieldsField?.property?.Settings?.requiredErrorMessage ?? '';
			this.#radioButtonExtension = radioButtonExtension;
			this.#onModeChangeHandler = this.#onModeChange.bind(this);
			this.#onFieldsChangeHandler = this.#clearFieldsError.bind(this);
			this.#onSettingsSavingHandler = this.#onSettingsSaving.bind(this);
		}

		/**
		 * Everything a ready form is expected to have is applied before the call returns; only the radio
		 * view waits for the design system primitive. The returned promise never rejects, so a caller that
		 * does not await it gets no unhandled rejection.
		 */
		apply() {
			this.#markTestNodes();
			this.#applyFieldsVisibility();
			this.#bindEvents();
			return this.#renderSwitcher().catch(error => {
				// Safe degradation: the standard select keeps the mode selectable and saveable.
				console.error(error);
			});
		}
		destroy() {
			this.#isDestroyed = true;
			this.#unbindEvents();
			this.#options.forEach(({
				node,
				button
			}) => {
				main_core.Event.unbindAll(node);
				button.destroy();
			});
			this.#options = [];
			if (this.#switcher) {
				main_core.Dom.remove(this.#switcher);
				this.#switcher = null;
			}
			this.#fieldsError = null;
			this.#select = null;
			this.#fieldsRow = null;
			this.#fieldsControl = null;
		}

		/**
		 * Test anchors for the nodes the form owns. The row ids of the settings form are shared between
		 * panels, so this control is the only place that knows which row belongs to this activity.
		 */
		#markTestNodes() {
			main_core.Dom.attr(this.#select, 'data-testid', SELECT_TEST_ID);
			main_core.Dom.attr(this.#fieldsRow, 'data-testid', FIELDS_ROW_TEST_ID);
			main_core.Dom.attr(this.#fieldsControl, 'data-testid', FIELDS_CONTROL_TEST_ID);
		}
		#bindEvents() {
			main_core.Event.bind(this.#select, 'change', this.#onModeChangeHandler);
			main_core.Event.bind(this.#fieldsControl, 'change', this.#onFieldsChangeHandler);
			main_core.Event.EventEmitter.subscribe(NODE_SETTINGS_SAVING_EVENT, this.#onSettingsSavingHandler);
		}
		#unbindEvents() {
			main_core.Event.unbind(this.#select, 'change', this.#onModeChangeHandler);
			main_core.Event.unbind(this.#fieldsControl, 'change', this.#onFieldsChangeHandler);
			main_core.Event.EventEmitter.unsubscribe(NODE_SETTINGS_SAVING_EVENT, this.#onSettingsSavingHandler);
		}
		async #renderSwitcher() {
			const {
				RadioButton
			} = await this.#radioButtonExtension;
			if (this.#isDestroyed || !main_core.Type.isFunction(RadioButton)) {
				return;
			}
			const group = `crm-trigger-reaction-mode-${main_core.Text.getRandom()}`;
			const options = REACTION_MODES.map(mode => this.#createOption(RadioButton, mode, group));
			if (options.some(option => option === null)) {
				options.forEach(option => option?.button.destroy());
				return;
			}
			this.#options = options;
			this.#switcher = main_core.Tag.render`
			<div
				class="crm-trigger-reaction-mode"
				role="radiogroup"
				data-testid="${SWITCHER_TEST_ID}"
			></div>
		`;
			this.#nameSwitcher();
			this.#options.forEach(({
				node
			}) => main_core.Dom.append(node, this.#switcher));
			main_core.Dom.insertAfter(this.#switcher, this.#select);
			// Inline style, not the hidden attribute: the form stylesheet gives `.field-row select`
			// an explicit display, and an author rule wins over the browser rule for [hidden].
			main_core.Dom.style(this.#select, 'display', 'none');
			this.#syncOptions();
		}

		/**
		 * The form renders the field caption as a plain div, so the group is named by reference to it.
		 */
		#nameSwitcher() {
			const caption = this.#select.closest(SETTINGS_BOX_SELECTOR)?.querySelector(SETTINGS_CAPTION_SELECTOR);
			if (!caption) {
				return;
			}
			if (!main_core.Type.isStringFilled(caption.id)) {
				caption.id = `crm-trigger-reaction-mode-caption-${main_core.Text.getRandom()}`;
			}
			main_core.Dom.attr(this.#switcher, 'aria-labelledby', caption.id);
		}
		#createOption(RadioButton, mode, group) {
			const title = this.#getOptionTitle(mode);
			if (title === null) {
				return null;
			}
			const button = new RadioButton({
				group,
				checked: this.#getMode() === mode,
				onChange: () => this.#selectMode(mode)
			});
			const titleId = `${group}-${mode}-title`;
			const caption = main_core.Tag.render`
			<span class="crm-trigger-reaction-mode__option-title" id="${titleId}"></span>
		`;
			caption.textContent = title;
			const radio = button.render();
			this.#prepareRadio(radio, titleId);
			const optionTestId = `${OPTION_TEST_ID_PREFIX}${mode}`;
			const node = main_core.Tag.render`
			<div class="crm-trigger-reaction-mode__option" data-testid="${optionTestId}"></div>
		`;
			main_core.Dom.append(radio, node);
			main_core.Dom.append(caption, node);
			main_core.Event.bind(node, 'click', () => this.#selectMode(mode));
			return {
				mode,
				node,
				button
			};
		}

		/**
		 * A form owner that does not exist keeps the radio out of `form.elements`, so the mode travels
		 * to the server as the single `ReactionMode` field of the standard control. The design system
		 * renders its own label around the input alone, so the visible title is bound by reference.
		 */
		#prepareRadio(radio, titleId) {
			const input = radio.querySelector('input');
			main_core.Dom.attr(input, 'form', DETACHED_FORM_ID);
			main_core.Dom.attr(input, 'aria-labelledby', titleId);
			const controlledRowId = this.#getControlledRowId();
			if (controlledRowId) {
				main_core.Dom.attr(input, 'aria-controls', controlledRowId);
			}
		}

		// Settings panels may share row ids, so the link is expressed only for the own fields block.
		#getControlledRowId() {
			const isOwnRow = this.#fieldsRow && document.getElementById(FIELDS_ROW_ID) === this.#fieldsRow;
			return isOwnRow ? FIELDS_ROW_ID : null;
		}
		#getOptionTitle(mode) {
			const option = Array.from(this.#select.options).find(item => item.value === mode);
			return option ? option.textContent : null;
		}
		#getMode() {
			return this.#select?.value ?? '';
		}
		#selectMode(mode) {
			if (this.#getMode() === mode) {
				return;
			}
			this.#select.value = mode;
			this.#select.dispatchEvent(new window.Event('change'));
		}
		#onModeChange() {
			this.#syncOptions();
			this.#applyFieldsVisibility();
			this.#clearFieldsError();
		}
		#syncOptions() {
			const currentMode = this.#getMode();
			this.#options.forEach(({
				mode,
				node,
				button
			}) => {
				const isSelected = mode === currentMode;
				button.setChecked(isSelected);
				main_core.Dom.toggleClass(node, '--selected', isSelected);
			});
		}
		#applyFieldsVisibility() {
			if (!this.#fieldsRow) {
				return;
			}

			// The value of the fields block is never touched, so switching back restores the selection.
			if (this.#getMode() === MODE_ANY) {
				main_core.Dom.hide(this.#fieldsRow);
			} else {
				main_core.Dom.show(this.#fieldsRow);
			}
		}
		#onSettingsSaving(event) {
			const {
				formData
			} = event.getData();
			if (!this.#ownsSave() || !main_core.Type.isPlainObject(formData)) {
				return;
			}
			if (this.#getMode() !== MODE_FIELDS || !this.#isFieldsValueEmpty(formData[FIELDS_FIELD_NAME])) {
				return;
			}

			// Without a text there is nothing to report the rejection with, so the save is left to travel:
			// the server runs the same check and its message is localised.
			if (!main_core.Type.isStringFilled(this.#requiredErrorMessage)) {
				return;
			}
			this.#showFieldsError();
			this.#fieldsControl?.focus();

			// The editor offers no way to refuse a save from a listener: its own required check is disabled
			// (`validateForm()`) and what a listener returns is dropped, so raising is what keeps the request
			// from leaving and the typed values on screen. The exception lands in the try/catch of
			// `submitForm()` and, carrying no `errors`, shows no message box; listeners subscribed after this
			// one are skipped for the rejected save. The server-side check stays an independent one.
			throw new Error('CrmEntityFieldChangedTrigger: tracked fields are required in the fields reaction mode');
		}

		/**
		 * The saving event carries no reference to the form it was collected from, so the panel is told by
		 * the own fields row. The editor keeps a single settings form mounted: it destroys the previous
		 * renderer on block change and on unmount, and empties the containers before the next render. A row
		 * still attached to the document therefore belongs to the panel being saved. Without the row there
		 * is nothing to point the user at either, and the check is left to the server.
		 */
		#ownsSave() {
			return Boolean(this.#fieldsRow?.isConnected);
		}
		#isFieldsValueEmpty(value) {
			if (main_core.Type.isArray(value)) {
				return value.every(item => String(item).trim() === '');
			}
			return String(value ?? '').trim() === '';
		}
		#showFieldsError() {
			if (!this.#fieldsRow || this.#fieldsError) {
				return;
			}
			main_core.Dom.addClass(this.#fieldsControl, 'has-error');
			main_core.Dom.attr(this.#fieldsControl, 'aria-invalid', 'true');
			const errorId = `crm-trigger-reaction-mode-fields-error-${main_core.Text.getRandom()}`;
			this.#fieldsError = main_core.Tag.render`
			<div
				class="crm-trigger-reaction-mode__fields-error"
				id="${errorId}"
				role="alert"
				data-testid="${FIELDS_ERROR_TEST_ID}"
			></div>
		`;
			// The text is written once the alert is in the document, so its appearance is announced.
			main_core.Dom.append(this.#fieldsError, this.#fieldsRow);
			this.#fieldsError.textContent = this.#requiredErrorMessage;
			main_core.Dom.attr(this.#fieldsControl, 'aria-describedby', errorId);
		}
		#clearFieldsError() {
			main_core.Dom.removeClass(this.#fieldsControl, 'has-error');
			main_core.Dom.attr(this.#fieldsControl, 'aria-invalid', null);
			if (this.#fieldsError) {
				main_core.Dom.attr(this.#fieldsControl, 'aria-describedby', null);
				main_core.Dom.remove(this.#fieldsError);
				this.#fieldsError = null;
			}
		}
	}

	const RADIO_BUTTON_EXTENSION = 'ui.system.radiobutton';
	class CrmEntityFieldChangedTriggerRenderer {
		#form = null;
		#categoryRow = null;
		#categoryCell = null;
		#reactionMode = null;
		#radioButtonExtension = null;
		#onDocumentChangeHandler = null;
		#onDocumentDeselectHandler = null;
		constructor() {
			this.#onDocumentChangeHandler = this.#onDocumentChange.bind(this);
			this.#onDocumentDeselectHandler = this.#onDocumentDeselect.bind(this);
			// The editor builds the renderer before it renders the controls, so the primitive of the mode
			// switcher loads alongside them instead of once the form is already on screen. The editor builds
			// the renderer without a try/catch, so the call is deferred and its failure stays a rejection.
			this.#radioButtonExtension = Promise.resolve().then(() => main_core.Runtime.loadExtension(RADIO_BUTTON_EXTENSION));
			// A form without the mode control never awaits it, and the switcher reports its own failure.
			this.#radioButtonExtension.catch(() => null);
		}

		// Not an async method: parts of the editor call it without awaiting the result, so the form is left
		// ready once the call returns. Only the mode switcher is rendered later, through the promise.
		afterFormRender(form, activityFields = {}) {
			this.#form = form;
			this.#categoryRow = form.querySelector('#row_categoryId');
			this.#categoryCell = this.#categoryRow?.querySelector('.field-row > div') ?? this.#categoryRow?.querySelector('td:last-child');
			this.#bindEvents();
			this.#syncCategoryRowVisibility();
			setTimeout(() => this.#syncCategoryRowVisibility());
			this.#reactionMode = ReactionModeControl.find(form, activityFields, this.#radioButtonExtension);
			return this.#reactionMode?.apply() ?? Promise.resolve();
		}
		#bindEvents() {
			main_core.Event.EventEmitter.subscribe('BX.UI.EntitySelector.Dialog:Item:onSelect', this.#onDocumentChangeHandler);
			main_core.Event.EventEmitter.subscribe('BX.UI.EntitySelector.Dialog:Item:onDeselect', this.#onDocumentDeselectHandler);
		}
		#getFieldsSelect() {
			return this.#form?.id_Fields ?? null;
		}
		#renderFieldsControl(options) {
			const selectElement = this.#getFieldsSelect();
			if (!selectElement) {
				return;
			}
			main_core.Dom.clean(selectElement);
			for (const [value, text] of Object.entries(options)) {
				const option = main_core.Tag.render`<option value="${value}"></option>`;
				option.textContent = text;
				selectElement.add(option);
			}
		}
		#getCurrentCategorySelect() {
			return this.#categoryCell?.querySelector('select[name="categoryId"]');
		}
		#resetCategorySelection() {
			const selectElement = this.#getCurrentCategorySelect();
			if (!selectElement) {
				return;
			}
			selectElement.value = '';
			selectElement.selectedIndex = 0;
		}
		#hasCategoryOptions() {
			const selectElement = this.#getCurrentCategorySelect();
			if (!selectElement) {
				return false;
			}
			return Array.from(selectElement.options).some(option => option.value !== '');
		}
		#syncCategoryRowVisibility() {
			this.#toggleCategoryRow(this.#hasCategoryOptions());
		}
		#toggleCategoryRow(isVisible) {
			if (!this.#categoryRow) {
				return;
			}
			if (isVisible) {
				main_core.Dom.show(this.#categoryRow);
			} else {
				main_core.Dom.hide(this.#categoryRow);
			}
		}
		#createCategoryProperty(options) {
			return {
				Type: 'select',
				FieldName: 'categoryId',
				Options: options,
				Required: false,
				AllowSelection: false
			};
		}
		#renderCategoryControl(options) {
			if (!this.#categoryCell) {
				return;
			}
			const control = BX.Bizproc.FieldType.renderControl(['bizproc', 'Bitrix\\Bizproc\\Public\\Entity\\Document\\Workflow', 'WORKFLOW'], this.#createCategoryProperty(options), 'categoryId', '');
			main_core.Dom.clean(this.#categoryCell);
			main_core.Dom.append(control, this.#categoryCell);
			this.#resetCategorySelection();
			this.#toggleCategoryRow(Object.keys(options).length > 0);
		}
		#isEventFromCurrentForm(event) {
			const {
				item
			} = event.getData();
			const targetNode = item?.getDialog?.()?.getTargetNode?.();
			return Boolean(this.#form && targetNode && this.#form.contains(targetNode));
		}
		#onDocumentChange(event) {
			if (!this.#isEventFromCurrentForm(event)) {
				return;
			}
			const {
				item
			} = event.getData();
			main_core.ajax.runAction('bizproc.activity.request', {
				data: {
					documentType: ['bizproc', 'Bitrix\\Bizproc\\Public\\Entity\\Document\\Workflow', 'WORKFLOW'],
					activity: 'CrmEntityFieldChangedTrigger',
					params: {
						document: item.id,
						form_name: 'document'
					}
				}
			}).then(response => {
				const data = response.data;
				if (!main_core.Type.isPlainObject(data)) {
					return;
				}
				this.#renderCategoryControl(data.categories ?? {});
				this.#renderFieldsControl(data.fields ?? {});
			}).catch(e => console.error(e));
		}
		#onDocumentDeselect(event) {
			if (!this.#isEventFromCurrentForm(event)) {
				return;
			}
			this.#renderCategoryControl({});
			this.#renderFieldsControl({});
		}
		destroy() {
			this.#form = null;
			this.#categoryRow = null;
			this.#categoryCell = null;
			this.#reactionMode?.destroy();
			this.#reactionMode = null;
			main_core.Event.EventEmitter.unsubscribe('BX.UI.EntitySelector.Dialog:Item:onSelect', this.#onDocumentChangeHandler);
			main_core.Event.EventEmitter.unsubscribe('BX.UI.EntitySelector.Dialog:Item:onDeselect', this.#onDocumentDeselectHandler);
		}
	}

	exports.CrmEntityFieldChangedTriggerRenderer = CrmEntityFieldChangedTriggerRenderer;

})(this.window = this.window || {}, BX);
//# sourceMappingURL=renderer.js.map
