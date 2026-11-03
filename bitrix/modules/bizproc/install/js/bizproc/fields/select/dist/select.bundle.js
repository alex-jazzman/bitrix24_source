/* eslint-disable */
this.BX = this.BX || {};
this.BX.Bizproc = this.BX.Bizproc || {};
this.BX.Bizproc.Fields = this.BX.Bizproc.Fields || {};
(function (exports, ui_designTokens, ui_iconSet_outline, ui_forms, main_core, bizproc_fields) {
	'use strict';

	const LIST_SELECTOR = '.bizproc-fields-select__list';
	const OPTION_INPUT_SELECTOR = '.bizproc-fields-select__option';
	const INSERT_INPUT_SELECTOR = '.bizproc-fields-select__insert-input';
	const DROPDOWN_CLASS = 'bizproc-fields-select-dropdown';
	const DROPDOWN_SELECTOR = `.${DROPDOWN_CLASS}`;
	const DROPDOWN_INPUT_SELECTOR = `.${DROPDOWN_CLASS}__input`;
	const DROPDOWN_VALUE_SELECTOR = `.${DROPDOWN_CLASS}__value`;
	const DROPDOWN_FIELD_SELECTOR = `.${DROPDOWN_CLASS}__field`;
	const DROPDOWN_CHEVRON_SELECTOR = `.${DROPDOWN_CLASS}__chevron`;
	const DROPDOWN_DECORATED_CLASS = `${DROPDOWN_CLASS}__field--decorated`;
	const MENU_EXTENSION = 'ui.system.menu';
	class SelectField extends bizproc_fields.BaseField {
		#unmatched = [];
		#companionCarriesStashedValue = false;
		#menu = null;
		#openRequest = 0;
		rendersGroup() {
			return !this.#showsDropdown();
		}
		rendersOwnMultiple() {
			return true;
		}
		release() {
			this.#cancelMenuOpening();
			this.#menu?.destroy();
			this.#menu = null;
		}
		getGroupRequiredNodes(root) {
			return [...root.querySelectorAll(OPTION_INPUT_SELECTOR)];
		}
		resolveOptions() {
			const property = this.getProperty();
			const groups = property.Settings?.Groups;
			if (main_core.Type.isArrayFilled(groups)) {
				const result = [];
				groups.forEach(group => {
					if (!main_core.Type.isObjectLike(group) || main_core.Type.isArray(group)) {
						return;
					}
					const name = main_core.Type.isNil(group.name) ? '' : String(group.name);
					result.push(...SelectField.#normalizeOptions(group.items, name === '' ? undefined : name));
				});
				return result;
			}
			return SelectField.#normalizeOptions(property.Options);
		}
		static #normalizeOptions(options, group) {
			if (!main_core.Type.isObjectLike(options)) {
				return [];
			}
			const makeOption = (key, label) => main_core.Type.isUndefined(group) ? {
				key,
				label
			} : {
				key,
				label,
				group
			};
			if (main_core.Type.isArray(options)) {
				return options.filter(option => !main_core.Type.isNil(option) && !main_core.Type.isNil(option.value)).map(option => makeOption(String(option.value), String(option.name ?? option.value)));
			}
			return Object.entries(options).map(([key, label]) => makeOption(String(key), String(label)));
		}
		showEmptyOption() {
			const setting = this.getProperty().Settings?.ShowEmptyValue;
			if (main_core.Type.isNil(setting)) {
				return !this.isMultiple();
			}
			return SelectField.#toBool(setting);
		}
		static #toBool(value) {
			if (main_core.Type.isNil(value) || value === false || value === 0 || value === '' || value === '0' || value === 'false' || main_core.Type.isString(value) && value.toUpperCase() === 'N' || main_core.Type.isArray(value) && value.length === 0) {
				return false;
			}
			return Boolean(value);
		}
		renderControl(value) {
			return this.#showsDropdown() ? this.#renderDropdownControl(value) : this.#renderListControl(value);
		}
		renderSelectionControl(control) {
			const decorated = super.renderSelectionControl(control);
			const field = decorated.root.querySelector(DROPDOWN_FIELD_SELECTOR);
			const chevron = decorated.root.querySelector(DROPDOWN_CHEVRON_SELECTOR);
			if (main_core.Type.isNull(field) || main_core.Type.isNull(chevron) || decorated.valueNode.parentElement === field) {
				return decorated;
			}
			main_core.Dom.insertAfter(chevron, decorated.valueNode);
			main_core.Dom.addClass(field, DROPDOWN_DECORATED_CLASS);
			return decorated;
		}
		#renderListControl(value) {
			const property = this.getProperty();
			const multiple = this.isMultiple();
			const readOnly = this.isReadOnly();
			const controlName = this.getControlName();
			const fieldName = this.getFieldName();
			const inputType = multiple ? 'checkbox' : 'radio';
			const ctlClass = multiple ? 'ui-ctl-checkbox' : 'ui-ctl-radio';
			const options = this.#optionsWithEmpty();
			const selected = this.#selectedKeys(value ?? property.Default ?? null);
			const valuesToPreserve = main_core.Type.isNull(value) ? new Set() : this.#selectedKeys(value);
			this.#stashUnmatched(valuesToPreserve, new Set(options.map(option => option.key)));
			const list = main_core.Tag.render`<div class="bizproc-fields-select__list"></div>`;
			let currentGroup;
			options.forEach((option, index) => {
				if (!main_core.Type.isUndefined(option.group) && option.group !== currentGroup) {
					const groupTitle = main_core.Tag.render`
					<div class="bizproc-fields-select__group-title">${main_core.Text.encode(option.group)}</div>
				`;
					main_core.Dom.append(groupTitle, list);
				}
				currentGroup = option.group;
				const input = main_core.Tag.render`
				<input
					type="${inputType}"
					class="ui-ctl-element bizproc-fields-select__option"
					name="${main_core.Text.encode(controlName)}"
					value="${main_core.Text.encode(option.key)}"
					data-testid="${main_core.Text.encode(`bizproc-field-control-${fieldName}-${index}`)}"
				/>
			`;
				if (selected.has(option.key)) {
					main_core.Dom.attr(input, 'checked', 'checked');
				}
				if (readOnly) {
					input.disabled = true;
				}
				const row = main_core.Tag.render`
				<label class="ui-ctl ${ctlClass}">
					${input}
					<div class="ui-ctl-label-text">${main_core.Text.encode(option.label)}</div>
				</label>
			`;
				main_core.Dom.append(row, list);
			});
			if (!multiple) {
				main_core.Event.bind(list, 'change', this.#handleUserInput);
			}
			if (options.length === 0) {
				const emptyNode = main_core.Tag.render`
				<div class="bizproc-fields-select__empty">
					${main_core.Text.encode(main_core.Loc.getMessage('BIZPROC_FIELDS_SELECT_EMPTY') ?? '')}
				</div>
			`;
				main_core.Dom.append(emptyNode, list);
			}
			const container = main_core.Tag.render`
			<div class="bizproc-fields-select${readOnly ? ' bizproc-fields-select--readonly' : ''}">
				${list}
			</div>
		`;
			const decorates = this.decoratesSelection();
			const carried = this.#unmatched[0] ?? '';
			const insertRow = decorates || this.#ownsInsertButton() ? this.#renderInsertRow(!decorates, carried) : null;
			this.#companionCarriesStashedValue = !main_core.Type.isNull(insertRow) && main_core.Type.isStringFilled(carried);
			if (!main_core.Type.isNull(insertRow)) {
				this.#unmatched = this.#unmatched.slice(1);
				main_core.Dom.append(insertRow.node, container);
			}
			const firstInput = list.querySelector(OPTION_INPUT_SELECTOR);
			return {
				root: container,
				valueNode: firstInput ?? container,
				insertAnchor: insertRow?.anchor,
				expressionNode: insertRow?.anchor
			};
		}
		getValue() {
			if (this.#showsDropdown()) {
				return this.#getDropdownValue();
			}
			const checked = this.#getInputs().filter(input => input.checked).map(input => input.value);
			const carried = this.#carriedExpressions();
			if (this.isMultiple()) {
				return [...checked, ...carried.filter(item => !checked.includes(item))];
			}
			return main_core.Type.isStringFilled(checked[0]) ? checked[0] : carried[0] ?? '';
		}
		applyValue(value) {
			if (this.#showsDropdown()) {
				this.#applyDropdownValue(value);
				return;
			}
			const want = this.#selectedKeys(value);
			const inputs = this.#getInputs();
			inputs.forEach(input => {
				input.checked = want.has(input.value);
			});
			this.#stashUnmatched(want, new Set(inputs.map(input => input.value)));
			this.#handStashToCompanion();
		}
		getValueState() {
			const state = super.getValueState();
			if (!this.#showsDropdown()) {
				return state;
			}
			return {
				...state,
				expression: this.#dropdownCarriedText()
			};
		}
		setValueState(state) {
			super.setValueState(state);
			this.#restoreCarriedText(state.expression);
			this.checkExpressionCarrier();
		}
		isExpressionCarrierValid(input) {
			if (super.isExpressionCarrierValid(input)) {
				return true;
			}
			if (!this.#showsDropdown()) {
				return false;
			}
			const hidden = this.#getDropdownValueInput();
			const current = main_core.Type.isNull(hidden) ? '' : hidden.value;
			return this.#holdsOptionShownAs(current, input.value);
		}
		#holdsOptionShownAs(key, label) {
			if (key === '' && this.showEmptyOption() && label === SelectField.#emptyOptionLabel()) {
				return true;
			}
			return this.resolveOptions().some(option => option.key === key && option.label === label);
		}
		#restoreCarriedText(text) {
			if (!main_core.Type.isStringFilled(text)) {
				return;
			}
			if (this.#showsDropdown()) {
				this.#restoreDropdownText(text);
				return;
			}
			const companion = this.#getCompanionInput();
			if (main_core.Type.isNull(companion) || main_core.Type.isStringFilled(companion.value)) {
				return;
			}
			companion.value = text;
			this.checkExpressionCarrier();
		}
		#restoreDropdownText(text) {
			const input = this.#getDropdownInput();
			if (main_core.Type.isNull(input) || main_core.Type.isStringFilled(this.#dropdownStoredValue())) {
				return;
			}
			input.value = text;
			this.checkExpressionCarrier();
		}
		#dropdownCarriedText() {
			const input = this.#getDropdownInput();
			if (main_core.Type.isNull(input) || main_core.Type.isStringFilled(this.#dropdownStoredValue())) {
				return '';
			}
			return this.isExpressionCarrierValid(input) ? '' : input.value;
		}
		#getInputs() {
			const [valueNode] = this.getValueNodes();
			if (main_core.Type.isUndefined(valueNode)) {
				return [];
			}
			const list = valueNode.closest(LIST_SELECTOR);
			if (main_core.Type.isNull(list)) {
				return [];
			}
			return [...list.querySelectorAll(OPTION_INPUT_SELECTOR)];
		}
		#stashUnmatched(selected, optionKeys) {
			this.#unmatched = [...selected].filter(key => key !== '' && !optionKeys.has(key));
		}
		#handleUserInput = () => {
			this.#unmatched = [];
		};
		#selectedKeys(value) {
			if (this.isMultiple()) {
				const list = main_core.Type.isArray(value) ? value : main_core.Type.isStringFilled(value) ? [value] : [];
				return new Set(list.map(item => String(item)));
			}
			const single = main_core.Type.isArray(value) ? value[0] ?? '' : value ?? '';
			return new Set([String(single)]);
		}
		#renderInsertRow(withOwnButton, expression) {
			const fieldName = this.getFieldName();
			const input = main_core.Tag.render`
			<input
				type="text"
				class="bizproc-fields-select__insert-input"
				value="${main_core.Text.encode(expression)}"
				placeholder="${main_core.Text.encode(main_core.Loc.getMessage('BIZPROC_FIELDS_SELECT_INSERT_PLACEHOLDER') ?? '')}"
				data-testid="${main_core.Text.encode(`bizproc-field-insert-input-${fieldName}`)}"
			/>
		`;
			main_core.Dom.attr(input, 'data-role', 'inline-selector-target');
			const node = main_core.Tag.render`
			<div
				class="${bizproc_fields.EXPRESSION_ROW_CLASS} bizproc-fields-select__insert-row"
				data-testid="${main_core.Text.encode(`bizproc-field-insert-row-${fieldName}`)}"
			>
				${input}
			</div>
		`;
			if (withOwnButton) {
				main_core.Dom.append(this.renderInsertButton(), node);
			}
			this.watchExpressionCarrier(node, INSERT_INPUT_SELECTOR);
			main_core.Event.bind(node, 'input', this.#handleCompanionEdit);
			main_core.Event.bind(node, 'change', this.#handleCompanionEdit);
			return {
				node,
				anchor: input
			};
		}
		#carriedExpressions() {
			const companion = this.#getCompanionInput();
			if (main_core.Type.isNull(companion) || !main_core.Type.isStringFilled(companion.value)) {
				return this.#unmatched;
			}
			if (!this.#companionCarriesStashedValue && !bizproc_fields.isExpressionValue(companion.value)) {
				return this.#unmatched;
			}
			return [companion.value, ...this.#unmatched];
		}
		#handleCompanionEdit = () => {
			this.#companionCarriesStashedValue = false;
		};
		#handStashToCompanion() {
			const companion = this.#getCompanionInput();
			if (main_core.Type.isNull(companion)) {
				return;
			}
			const carried = this.#unmatched[0] ?? '';
			companion.value = carried;
			this.#unmatched = this.#unmatched.slice(1);
			this.#companionCarriesStashedValue = main_core.Type.isStringFilled(carried);
			this.checkExpressionCarrier();
		}
		#getCompanionInput() {
			const [node] = this.getExpressionNodes();
			return main_core.Type.isUndefined(node) ? null : node;
		}
		#ownsInsertButton() {
			if (this.decoratesSelection()) {
				return false;
			}
			return this.getRenderMode() !== bizproc_fields.RenderMode.Public && this.isSelectable() && !this.isReadOnly();
		}
		#showsDropdown() {
			return !this.isMultiple() && bizproc_fields.readSelectView(this.getProperty()) === bizproc_fields.SelectView.Dropdown;
		}
		#optionsWithEmpty() {
			const options = this.resolveOptions();
			return this.showEmptyOption() ? [{
				key: '',
				label: SelectField.#emptyOptionLabel()
			}, ...options] : options;
		}
		static #emptyOptionLabel() {
			return main_core.Loc.getMessage('BIZPROC_FIELDS_SELECT_NOT_SET') ?? '';
		}
		#renderDropdownControl(value) {
			const property = this.getProperty();
			const readOnly = this.isReadOnly();
			const fieldName = this.getFieldName();
			const options = this.#optionsWithEmpty();
			const key = SelectField.#firstValue(value ?? property.Default ?? null);
			const stored = main_core.Type.isNull(value) ? SelectField.#preselectedValue(options, key) : key;
			const input = main_core.Tag.render`
			<input
				type="text"
				class="${DROPDOWN_CLASS}__input"
				value="${main_core.Text.encode(SelectField.#visibleText(options, stored))}"
				placeholder="${main_core.Text.encode(this.getPlaceholder())}"
				data-select-mode="replace"
				data-testid="${main_core.Text.encode(`bizproc-field-dropdown-input-${fieldName}`)}"
			/>
		`;
			if (this.isSelectable() && !readOnly) {
				main_core.Dom.attr(input, 'data-role', 'inline-selector-target');
			}
			if (readOnly) {
				main_core.Dom.attr(input, 'readonly', '');
			}
			const chevron = main_core.Tag.render`
			<button
				type="button"
				class="${DROPDOWN_CLASS}__chevron"
				aria-label="${main_core.Text.encode(main_core.Loc.getMessage('BIZPROC_FIELDS_SELECT_DROPDOWN_OPEN') ?? '')}"
				data-testid="${main_core.Text.encode(`bizproc-field-dropdown-toggle-${fieldName}`)}"
			>
				<div class="ui-icon-set --chevron-down-m" aria-hidden="true"></div>
			</button>
		`;
			const hidden = main_core.Tag.render`
			<input
				type="hidden"
				class="${DROPDOWN_CLASS}__value"
				name="${main_core.Text.encode(this.getControlName())}"
				value="${main_core.Text.encode(stored)}"
				data-testid="${main_core.Text.encode(`bizproc-field-control-${fieldName}`)}"
			/>
		`;
			const root = main_core.Tag.render`
			<div
				class="${DROPDOWN_CLASS}"
				data-testid="${main_core.Text.encode(`bizproc-field-dropdown-${fieldName}`)}"
			>
				<div class="${DROPDOWN_CLASS}__field">
					${input}
					${chevron}
				</div>
			</div>
		`;
			if (readOnly) {
				chevron.disabled = true;
			} else {
				main_core.Event.bind(chevron, 'click', () => {
					this.#toggleMenu(chevron);
				});
				main_core.Event.bind(root, 'input', this.#handleDropdownInput);
				main_core.Event.bind(root, 'change', this.#handleDropdownInput);
				this.watchExpressionCarrier(root, DROPDOWN_INPUT_SELECTOR);
			}
			if (this.#ownsInsertButton()) {
				main_core.Dom.append(this.renderInsertButton(), root);
			}
			main_core.Dom.append(hidden, root);
			return {
				root,
				valueNode: input
			};
		}
		#handleDropdownInput = () => {
			const input = this.#getDropdownInput();
			const hidden = this.#getDropdownValueInput();
			if (main_core.Type.isNull(input) || main_core.Type.isNull(hidden)) {
				return;
			}
			hidden.value = bizproc_fields.isExpressionValue(input.value) ? input.value : '';
		};
		#toggleMenu(trigger) {
			const opened = this.#menu;
			if (!main_core.Type.isNull(opened) && opened.getPopup()?.isShown() === true) {
				opened.close();
				return;
			}
			this.#openMenu(trigger).catch(error => {
				console.error('[bizproc.fields.select] the option menu could not be loaded, the click opened nothing', error);
			});
		}
		async #openMenu(trigger) {
			const request = this.#cancelMenuOpening();
			const loaded = await main_core.Runtime.loadExtension(MENU_EXTENSION);
			const MenuClass = loaded.Menu;
			if (request !== this.#openRequest || !trigger.isConnected) {
				return;
			}
			const items = this.#buildMenuItems();
			const opened = this.#menu;
			if (!main_core.Type.isNull(opened)) {
				opened.updateItems(items);
				opened.show(trigger);
				return;
			}
			const options = {
				items,
				autoHideHandler: event => {
					const target = event.target;
					return !trigger.contains(target) && !this.#menuHolds(target);
				}
			};
			const menu = new MenuClass(options);
			this.#menu = menu;
			menu.show(trigger);
		}
		#cancelMenuOpening() {
			this.#openRequest += 1;
			return this.#openRequest;
		}
		#menuHolds(node) {
			const container = this.#menu?.getPopupContainer();
			return main_core.Type.isNil(container) ? false : container.contains(node);
		}
		#buildMenuItems() {
			const hidden = this.#getDropdownValueInput();
			const current = main_core.Type.isNull(hidden) ? '' : hidden.value;
			const fieldName = this.getFieldName();
			return this.#optionsWithEmpty().map((option, index) => {
				const item = {
					title: option.label,
					isSelected: option.key === current,
					dataset: {
						testid: `bizproc-field-dropdown-item-${fieldName}-${index}`
					},
					onClick: () => {
						this.#pickDropdownOption(option);
					}
				};
				return item;
			});
		}
		#pickDropdownOption(option) {
			const input = this.#getDropdownInput();
			const hidden = this.#getDropdownValueInput();
			if (main_core.Type.isNull(input) || main_core.Type.isNull(hidden)) {
				return;
			}
			input.value = option.label;
			hidden.value = option.key;
			this.checkExpressionCarrier();
			this.emitChange();
		}
		#getDropdownValue() {
			const hidden = this.#getDropdownValueInput();
			const value = main_core.Type.isNull(hidden) ? '' : hidden.value;
			if (!this.isMultiple()) {
				return value;
			}
			return value === '' ? [] : [value];
		}
		#applyDropdownValue(value) {
			const input = this.#getDropdownInput();
			const hidden = this.#getDropdownValueInput();
			if (main_core.Type.isNull(input) || main_core.Type.isNull(hidden)) {
				return;
			}
			const options = this.#optionsWithEmpty();
			const key = SelectField.#firstValue(value);
			input.value = SelectField.#visibleText(options, key);
			hidden.value = key;
		}
		#getDropdownInput() {
			const [valueNode] = this.getValueNodes();
			return main_core.Type.isUndefined(valueNode) ? null : valueNode;
		}
		#dropdownStoredValue() {
			const hidden = this.#getDropdownValueInput();
			return main_core.Type.isNull(hidden) ? '' : hidden.value;
		}
		#getDropdownValueInput() {
			const input = this.#getDropdownInput();
			const root = main_core.Type.isNull(input) ? null : input.closest(DROPDOWN_SELECTOR);
			return main_core.Type.isNull(root) ? null : root.querySelector(DROPDOWN_VALUE_SELECTOR);
		}
		static #visibleText(options, key) {
			const option = options.find(item => item.key === key);
			return main_core.Type.isUndefined(option) ? key : option.label;
		}
		static #preselectedValue(options, key) {
			if (key === '') {
				return '';
			}
			const known = options.some(option => option.key === key);
			return known || bizproc_fields.isExpressionValue(key) ? key : '';
		}
		static #firstValue(value) {
			if (main_core.Type.isArray(value)) {
				return String(value[0] ?? '');
			}
			return main_core.Type.isNil(value) ? '' : String(value);
		}
	}
	bizproc_fields.FieldRegistry.register('select', SelectField);

	exports.SelectField = SelectField;

})(this.BX.Bizproc.Fields.Select = this.BX.Bizproc.Fields.Select || {}, window, window, BX, BX, BX.Bizproc.Fields);
//# sourceMappingURL=select.bundle.js.map
