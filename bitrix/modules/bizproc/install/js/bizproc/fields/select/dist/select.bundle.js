/* eslint-disable */
this.BX = this.BX || {};
this.BX.Bizproc = this.BX.Bizproc || {};
this.BX.Bizproc.Fields = this.BX.Bizproc.Fields || {};
(function (exports, ui_designTokens, ui_iconSet_outline, ui_forms, main_core, bizproc_fields) {
	'use strict';

	const LIST_SELECTOR = '.bizproc-fields-select__list';
	const OPTION_INPUT_SELECTOR = '.bizproc-fields-select__option';
	class SelectField extends bizproc_fields.BaseField {
		#unmatched = [];
		rendersGroup() {
			return true;
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
			const property = this.getProperty();
			const multiple = this.isMultiple();
			const readOnly = this.isReadOnly();
			const controlName = this.getControlName();
			const fieldName = this.getFieldName();
			const inputType = multiple ? 'checkbox' : 'radio';
			const ctlClass = multiple ? 'ui-ctl-checkbox' : 'ui-ctl-radio';
			const options = this.resolveOptions();
			if (this.showEmptyOption()) {
				options.unshift({
					key: '',
					label: main_core.Loc.getMessage('BIZPROC_FIELDS_SELECT_NOT_SET') ?? ''
				});
			}
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
			const ownInsertRow = this.getRenderMode() !== bizproc_fields.RenderMode.Public && this.isSelectable() && !readOnly;
			const insertRow = decorates || ownInsertRow ? this.#renderInsertRow(!decorates) : null;
			if (!main_core.Type.isNull(insertRow)) {
				main_core.Dom.append(main_core.Tag.render`<div class="bizproc-fields-select__divider"></div>`, container);
				main_core.Dom.append(insertRow.node, container);
			}
			const firstInput = list.querySelector(OPTION_INPUT_SELECTOR);
			return {
				root: container,
				valueNode: firstInput ?? container,
				insertAnchor: insertRow?.anchor
			};
		}
		getValue() {
			const checked = this.#getInputs().filter(input => input.checked).map(input => input.value);
			if (this.isMultiple()) {
				return [...checked, ...this.#unmatched.filter(item => !checked.includes(item))];
			}
			return checked[0] ?? this.#unmatched[0] ?? '';
		}
		applyValue(value) {
			const want = this.#selectedKeys(value);
			const inputs = this.#getInputs();
			inputs.forEach(input => {
				input.checked = want.has(input.value);
			});
			this.#stashUnmatched(want, new Set(inputs.map(input => input.value)));
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
		#renderInsertRow(withOwnButton) {
			const fieldName = this.getFieldName();
			const input = main_core.Tag.render`
			<input
				type="text"
				class="bizproc-fields-select__insert-input"
				readonly
				placeholder="${main_core.Text.encode(main_core.Loc.getMessage('BIZPROC_FIELDS_SELECT_INSERT_PLACEHOLDER') ?? '')}"
				aria-label="${main_core.Text.encode(main_core.Loc.getMessage('BIZPROC_FIELDS_SELECT_INSERT_PLACEHOLDER') ?? '')}"
				data-testid="${main_core.Text.encode(`bizproc-field-insert-input-${fieldName}`)}"
			/>
		`;
			const node = main_core.Tag.render`
			<div class="bizproc-fields-select__insert-row">
				${input}
			</div>
		`;
			if (withOwnButton) {
				main_core.Dom.append(this.renderInsertButton(), node);
			}
			return {
				node,
				anchor: input
			};
		}
	}
	bizproc_fields.FieldRegistry.register('select', SelectField);

	exports.SelectField = SelectField;

})(this.BX.Bizproc.Fields.Select = this.BX.Bizproc.Fields.Select || {}, window, window, BX, BX, BX.Bizproc.Fields);
//# sourceMappingURL=select.bundle.js.map
