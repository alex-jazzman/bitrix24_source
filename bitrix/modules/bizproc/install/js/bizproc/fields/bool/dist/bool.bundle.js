/* eslint-disable */
this.BX = this.BX || {};
this.BX.Bizproc = this.BX.Bizproc || {};
this.BX.Bizproc.Fields = this.BX.Bizproc.Fields || {};
(function (exports, ui_designTokens, ui_iconSet_outline, main_core, ui_switcher, ui_system_checkbox, bizproc_fields) {
	'use strict';

	const ROW_CLASS = 'bizproc-fields-bool-row';
	const ROW_SELECTOR = `.${ROW_CLASS}`;
	const CHECKBOX_ROW_MODIFIER = 'bizproc-fields-bool-row--checkbox';
	const VALUE_INPUT_SELECTOR = '.bizproc-fields-bool__value';
	const SWITCH_CLASS = 'bizproc-fields-bool__switch';
	const NATIVE_CHECKBOX_SELECTOR = 'input[type="checkbox"]';
	class BoolField extends bizproc_fields.BaseField {
		#controlByRow = new WeakMap();
		#controls = [];
		getNameBlockPlacement() {
			return bizproc_fields.NameBlockPlacement.InsideControlRow;
		}
		supportsExpressionMode() {
			return !this.#showsCheckbox() && this.getRenderMode() !== bizproc_fields.RenderMode.Public;
		}
		decoratesSelection() {
			return this.supportsExpressionMode() && !this.hasSharedExpressionRow() && super.decoratesSelection();
		}
		decoratesSharedExpressionRow() {
			return this.supportsExpressionMode() && super.decoratesSelection();
		}
		release() {
			this.#controls.forEach(control => control.destroy());
			this.#controls = [];
			this.#controlByRow = new WeakMap();
		}
		releaseRow(valueNode) {
			const row = valueNode.closest(ROW_SELECTOR);
			if (main_core.Type.isNull(row)) {
				return;
			}
			const control = this.#controlByRow.get(row);
			if (main_core.Type.isUndefined(control)) {
				return;
			}
			control.destroy();
			this.#controlByRow.delete(row);
			this.#controls = this.#controls.filter(item => item !== control);
		}
		renderControl(value) {
			const rawValue = main_core.Type.isArray(value) ? value[0] ?? '' : value ?? '';
			return this.#showsCheckbox() ? this.#renderCheckboxControl(rawValue) : this.#renderSwitcherControl(rawValue);
		}
		#renderSwitcherControl(rawValue) {
			const readOnly = this.isReadOnly();
			const expressionValue = bizproc_fields.isExpressionValue(rawValue) ? rawValue : '';
			const expression = this.renderExpressionControl({
				value: expressionValue
			});
			const holdsExpression = !main_core.Type.isNull(expression) && expressionValue !== '';
			const on = rawValue === 'Y';
			const carriesValue = !holdsExpression && this.#toggleIsCarrier();
			const row = this.#renderRow();
			const hiddenInput = this.#renderValueInput(carriesValue ? on ? 'Y' : 'N' : '');
			const switcherOptions = {
				checked: on,
				disabled: readOnly,
				useAirDesign: true,
				size: ui_switcher.SwitcherSize.medium,
				handlers: {
					toggled: () => {
						this.#syncControl(row, switcher.isChecked());
						this.emitChange();
					}
				}
			};
			const switcher = new ui_switcher.Switcher(switcherOptions);
			const switcherNode = switcher.getNode();
			main_core.Dom.addClass(switcherNode, SWITCH_CLASS);
			this.#applyAccessibility(switcherNode, switcher, on, readOnly);
			main_core.Dom.append(switcherNode, row);
			main_core.Dom.append(hiddenInput, row);
			this.#trackControl(row, {
				setChecked: checked => {
					switcher.check(checked, false);
					main_core.Dom.attr(switcherNode, 'aria-checked', checked);
				},
				isChecked: () => switcher.isChecked(),
				destroy: () => switcher.destroy()
			});
			if (main_core.Type.isNull(expression)) {
				return {
					root: row,
					valueNode: hiddenInput,
					namedNode: switcherNode
				};
			}
			main_core.Dom.append(expression.node, row);
			return {
				root: row,
				valueNode: hiddenInput,
				namedNode: switcherNode,
				expressionNode: expression.input,
				insertAnchor: expression.input
			};
		}
		#renderCheckboxControl(rawValue) {
			const on = rawValue === 'Y';
			const row = this.#renderRow();
			main_core.Dom.addClass(row, CHECKBOX_ROW_MODIFIER);
			const hiddenInput = this.#renderValueInput(on ? 'Y' : 'N');
			const checkbox = new ui_system_checkbox.Checkbox({
				size: ui_system_checkbox.CheckboxSize.Md,
				checked: on,
				disabled: this.isReadOnly(),
				attributes: {
					'data-testid': `bizproc-field-checkbox-${this.getFieldName()}`
				},
				onChange: ({
					event
				}) => {
					this.#syncControl(row, checkbox.isChecked());
					event?.stopPropagation();
					this.emitChange();
				}
			});
			const checkboxNode = checkbox.render();
			const nativeInput = checkboxNode.querySelector(NATIVE_CHECKBOX_SELECTOR);
			this.#nameFlag(nativeInput);
			main_core.Dom.append(checkboxNode, row);
			main_core.Dom.append(hiddenInput, row);
			this.#trackControl(row, {
				setChecked: checked => {
					checkbox.setChecked(checked);
				},
				isChecked: () => checkbox.isChecked(),
				destroy: () => checkbox.destroy()
			});
			return {
				root: row,
				valueNode: hiddenInput,
				namedNode: nativeInput
			};
		}
		#renderRow() {
			return main_core.Tag.render`
			<div
				class="${ROW_CLASS}"
				data-testid="${main_core.Text.encode(`bizproc-field-row-${this.getFieldName()}`)}"
			></div>
		`;
		}
		#renderValueInput(value) {
			return main_core.Tag.render`
			<input
				type="hidden"
				class="bizproc-fields-bool__value"
				name="${main_core.Text.encode(this.getControlName())}"
				value="${value}"
				data-testid="${main_core.Text.encode(`bizproc-field-control-${this.getFieldName()}`)}"
			/>
		`;
		}
		#trackControl(row, control) {
			this.#controlByRow.set(row, control);
			this.#controls.push(control);
		}
		#showsCheckbox() {
			return bizproc_fields.readBoolView(this.getProperty()) === bizproc_fields.BoolView.Checkbox;
		}
		#applyAccessibility(switcherNode, switcher, on, readOnly) {
			main_core.Dom.attr(switcherNode, 'role', 'switch');
			main_core.Dom.attr(switcherNode, 'aria-checked', on);
			main_core.Dom.attr(switcherNode, 'aria-label', this.#getControlLabel());
			main_core.Dom.attr(switcherNode, 'data-testid', `bizproc-field-switch-${this.getFieldName()}`);
			this.#hideSwitcherContents(switcherNode);
			main_core.Dom.attr(switcherNode, 'tabindex', '0');
			if (readOnly) {
				main_core.Dom.attr(switcherNode, 'aria-disabled', 'true');
				return;
			}
			main_core.Event.bind(switcherNode, 'keydown', event => {
				if (event.key === ' ' || event.key === 'Spacebar' || event.key === 'Enter') {
					event.preventDefault();
					switcher.toggle();
				}
			});
		}
		#hideSwitcherContents(switcherNode) {
			Array.from(switcherNode.children).forEach(child => {
				main_core.Dom.attr(child, 'aria-hidden', 'true');
			});
		}
		#nameFlag(nativeInput) {
			if (this.showsLabels() && main_core.Type.isStringFilled(this.#getPropertyName())) {
				return;
			}
			main_core.Dom.attr(nativeInput, 'aria-label', this.#getControlLabel());
		}
		#getControlLabel() {
			const name = this.#getPropertyName();
			if (main_core.Type.isStringFilled(name)) {
				return name;
			}
			return main_core.Loc.getMessage('BIZPROC_FIELDS_BOOL_LABEL') ?? '';
		}
		#getPropertyName() {
			const name = this.getProperty().Name;
			return main_core.Type.isString(name) ? name.trim() : '';
		}
		getValueState() {
			const state = super.getValueState();
			if (this.#toggleIsCarrier()) {
				return state;
			}
			const shown = this.#readControlState();
			return main_core.Type.isNull(shown) ? state : {
				...state,
				value: shown
			};
		}
		#readControlState() {
			const rows = this.getValueNodes().map(valueNode => valueNode.closest(ROW_SELECTOR));
			if (rows.length === 0) {
				return null;
			}
			const states = rows.map(row => !main_core.Type.isNull(row) && this.#controlIsChecked(row) ? 'Y' : 'N');
			return this.isMultiple() ? states : states[0];
		}
		applyValue(value) {
			if (this.#toggleIsCarrier()) {
				super.applyValue(value);
			}
			const nodes = this.getValueNodes();
			if (this.isMultiple()) {
				const values = main_core.Type.isArray(value) ? value : value.split(',');
				nodes.forEach((node, index) => {
					this.#syncFromValueNode(node, values[index] === 'Y');
				});
				return;
			}
			const node = nodes[0];
			if (!main_core.Type.isUndefined(node)) {
				const scalar = main_core.Type.isArray(value) ? value[0] ?? '' : value;
				this.#syncFromValueNode(node, scalar === 'Y');
			}
		}
		onValueModeChanged(mode) {
			if (mode !== bizproc_fields.ValueMode.Value) {
				return;
			}
			this.getValueNodes().forEach(valueNode => {
				const row = valueNode.closest(ROW_SELECTOR);
				if (!main_core.Type.isNull(row)) {
					this.#syncControl(row, this.#controlIsChecked(row));
				}
			});
		}
		#toggleIsCarrier() {
			return this.getValueMode() === bizproc_fields.ValueMode.Value;
		}
		#controlIsChecked(row) {
			const control = this.#controlByRow.get(row);
			return !main_core.Type.isUndefined(control) && control.isChecked();
		}
		#syncFromValueNode(valueNode, on) {
			const row = valueNode.closest(ROW_SELECTOR);
			if (main_core.Type.isNull(row)) {
				return;
			}
			if (this.#toggleIsCarrier()) {
				this.#syncControl(row, on);
				return;
			}
			this.#syncToggle(row, on);
		}
		#syncControl(row, on) {
			const input = row.querySelector(VALUE_INPUT_SELECTOR);
			if (!main_core.Type.isNull(input)) {
				input.value = on ? 'Y' : 'N';
			}
			this.#syncToggle(row, on);
		}
		#syncToggle(row, on) {
			const control = this.#controlByRow.get(row);
			if (main_core.Type.isUndefined(control)) {
				return;
			}
			control.setChecked(on);
		}
	}
	bizproc_fields.FieldRegistry.register('bool', BoolField);

	exports.BoolField = BoolField;

})(this.BX.Bizproc.Fields.Bool = this.BX.Bizproc.Fields.Bool || {}, window, window, BX, BX.UI, BX.UI.System.Checkbox, BX.Bizproc.Fields);
//# sourceMappingURL=bool.bundle.js.map
