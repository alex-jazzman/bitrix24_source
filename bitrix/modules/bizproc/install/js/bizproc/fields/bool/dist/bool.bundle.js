/* eslint-disable */
this.BX = this.BX || {};
this.BX.Bizproc = this.BX.Bizproc || {};
this.BX.Bizproc.Fields = this.BX.Bizproc.Fields || {};
(function (exports, ui_designTokens, ui_iconSet_outline, main_core, ui_switcher, bizproc_fields) {
	'use strict';

	const ROW_SELECTOR = '.bizproc-fields-bool-row';
	const VALUE_INPUT_SELECTOR = '.bizproc-fields-bool__value';
	class BoolField extends bizproc_fields.BaseField {
		#switcherByRow = new WeakMap();
		render() {
			this.#switcherByRow = new WeakMap();
			return super.render();
		}
		renderControl(value) {
			const name = this.getControlName();
			const readOnly = this.isReadOnly();
			const rawValue = main_core.Type.isArray(value) ? value[0] ?? '' : value ?? '';
			const on = rawValue === 'Y';
			const row = main_core.Tag.render`
			<div
				class="bizproc-fields-bool-row"
				data-testid="${main_core.Text.encode(`bizproc-field-row-${this.getFieldName()}`)}"
			></div>
		`;
			const hiddenInput = main_core.Tag.render`
			<input
				type="hidden"
				class="bizproc-fields-bool__value"
				name="${main_core.Text.encode(name)}"
				value="${on ? 'Y' : 'N'}"
				data-testid="${main_core.Text.encode(`bizproc-field-control-${this.getFieldName()}`)}"
			/>
		`;
			const switcherOptions = {
				checked: on,
				disabled: readOnly,
				handlers: {
					toggled: () => {
						this.#syncControl(row, switcher.isChecked());
						this.emitChange();
					}
				}
			};
			const switcher = new ui_switcher.Switcher(switcherOptions);
			const switcherNode = switcher.getNode();
			this.#applyAccessibility(switcherNode, switcher, on, readOnly);
			main_core.Dom.append(switcherNode, row);
			main_core.Dom.append(hiddenInput, row);
			if (this.isSelectable() && !readOnly && !this.decoratesSelection()) {
				main_core.Dom.append(this.renderInsertButton(), row);
			}
			this.#switcherByRow.set(row, switcher);
			return {
				root: row,
				valueNode: hiddenInput,
				namedNode: switcherNode
			};
		}
		#applyAccessibility(switcherNode, switcher, on, readOnly) {
			main_core.Dom.attr(switcherNode, 'role', 'switch');
			main_core.Dom.attr(switcherNode, 'aria-checked', on);
			main_core.Dom.attr(switcherNode, 'aria-label', this.#getSwitcherLabel());
			main_core.Dom.attr(switcherNode, 'data-testid', `bizproc-field-switch-${this.getFieldName()}`);
			if (readOnly) {
				main_core.Dom.attr(switcherNode, 'aria-disabled', 'true');
				return;
			}
			main_core.Dom.attr(switcherNode, 'tabindex', '0');
			main_core.Event.bind(switcherNode, 'keydown', event => {
				if (event.key === ' ' || event.key === 'Spacebar' || event.key === 'Enter') {
					event.preventDefault();
					switcher.toggle();
				}
			});
		}
		#getSwitcherLabel() {
			const name = this.getProperty().Name;
			if (main_core.Type.isStringFilled(name)) {
				return name;
			}
			return main_core.Loc.getMessage('BIZPROC_FIELDS_BOOL_LABEL') ?? '';
		}
		applyValue(value) {
			super.applyValue(value);
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
		#syncFromValueNode(valueNode, on) {
			const row = valueNode.closest(ROW_SELECTOR);
			if (!main_core.Type.isNull(row)) {
				this.#syncControl(row, on);
			}
		}
		#syncControl(row, on) {
			const input = row.querySelector(VALUE_INPUT_SELECTOR);
			if (!main_core.Type.isNull(input)) {
				input.value = on ? 'Y' : 'N';
			}
			const switcher = this.#switcherByRow.get(row);
			if (!main_core.Type.isUndefined(switcher)) {
				switcher.check(on, false);
				main_core.Dom.attr(switcher.getNode(), 'aria-checked', on);
			}
		}
	}
	bizproc_fields.FieldRegistry.register('bool', BoolField);

	exports.BoolField = BoolField;

})(this.BX.Bizproc.Fields.Bool = this.BX.Bizproc.Fields.Bool || {}, window, window, BX, BX.UI, BX.Bizproc.Fields);
//# sourceMappingURL=bool.bundle.js.map
