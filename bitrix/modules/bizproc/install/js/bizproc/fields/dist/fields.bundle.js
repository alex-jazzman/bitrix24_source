/* eslint-disable */
this.BX = this.BX || {};
this.BX.Bizproc = this.BX.Bizproc || {};
(function (exports, main_core, ui_hint, ui_iconSet_outline, main_core_events, bizproc_automation) {
	'use strict';

	class FieldRegistryClass {
		#registry = new Map();
		register(type, FieldClass) {
			const registeredClass = this.#registry.get(type);
			if (!main_core.Type.isUndefined(registeredClass)) {
				console.error(`[bizproc.fields] FieldRegistry: type "${type}" is already registered by ` + `${registeredClass.name}; registration of ${FieldClass.name} is ignored`);
				return;
			}
			this.#registry.set(type, FieldClass);
		}
		get(type) {
			return this.#registry.get(type) ?? null;
		}
		has(type) {
			return this.#registry.has(type);
		}
		getRegisteredTypes() {
			return [...this.#registry.keys()];
		}
		reset() {
			this.#registry.clear();
		}
	}
	const FieldRegistry = new FieldRegistryClass();

	const RenderMode = Object.freeze({
		Public: 'public',
		Designer: 'designer',
		NewDesigner: 'new-designer'
	});
	const EventName = Object.freeze({
		BackendRenderFinished: 'bizproc.fields:backend:render-finished'
	});
	const BackendForm = Object.freeze({
		Sfa: 'sfa_form'
	});

	function isMultiple(property) {
		return property.Multiple === true;
	}
	function isSelectable(property) {
		if (main_core.Type.isUndefined(property.AllowSelection)) {
			return true;
		}
		return toBool(property.AllowSelection);
	}
	function isRequired(property) {
		return property.Required === true;
	}
	function getControlName(fieldName, property) {
		return isMultiple(property) ? `${fieldName}[]` : fieldName;
	}
	function isReadOnly(property) {
		return property.ReadOnly === true;
	}
	function toBool(value) {
		if (main_core.Type.isNil(value) || value === false || value === 0 || value === '' || value === '0' || value === 'false' || main_core.Type.isString(value) && value.toUpperCase() === 'N' || main_core.Type.isArray(value) && value.length === 0) {
			return false;
		}
		return Boolean(value);
	}

	function filterInput(raw, caret, sanitize) {
		const value = sanitize(raw);
		if (value === raw) {
			return null;
		}
		return {
			value,
			caret: sanitize(raw.slice(0, caret)).length
		};
	}

	const OFFSET_SUFFIX = /\s\[(-?\d+)]$/;
	function splitOffsetValue(rawValue) {
		if (!main_core.Type.isStringFilled(rawValue)) {
			return {
				value: '',
				offset: null
			};
		}
		const match = rawValue.match(OFFSET_SUFFIX);
		return {
			value: rawValue.replace(OFFSET_SUFFIX, ''),
			offset: match ? match[1] : null
		};
	}
	function readTimezones(propertySettings, extensionId) {
		const propertyZones = main_core.Type.isPlainObject(propertySettings) ? propertySettings.timezones : null;
		if (main_core.Type.isArrayFilled(propertyZones)) {
			return propertyZones;
		}
		const extensionZones = main_core.Extension.getSettings(extensionId).get('timezones');
		return main_core.Type.isArray(extensionZones) ? extensionZones : [];
	}
	function findTimezoneByOffset(timezones, offset, match = {}) {
		if (main_core.Type.isNull(offset)) {
			return timezones.find(zone => zone.value === 'current');
		}
		if (offset === '0' && match.preferEmptyZoneAtZeroOffset === true) {
			return timezones.find(zone => zone.value === '') ?? timezones.find(zone => String(zone.offset) === offset);
		}
		return timezones.find(zone => String(zone.offset) === offset);
	}
	function buildTimezoneSelect(params) {
		if (params.timezones.length === 0) {
			return null;
		}
		const select = main_core.Tag.render`
		<select
			class="bizproc-type-control-date-lc"
			name="${main_core.Text.encode(`tz_${params.name}`)}"
			aria-label="${main_core.Text.encode(params.ariaLabel)}"
			data-testid="${main_core.Text.encode(params.testId)}"
		></select>
	`;
		if (params.disabled) {
			main_core.Dom.attr(select, 'disabled', 'disabled');
		}
		params.timezones.forEach(zone => {
			const option = main_core.Tag.render`
			<option value="${main_core.Text.encode(String(zone.value))}">${main_core.Text.encode(String(zone.text))}</option>
		`;
			if (zone === params.selected) {
				main_core.Dom.attr(option, 'selected', 'selected');
			}
			main_core.Dom.append(option, select);
		});
		return select;
	}

	const ADD_BUTTON_CLASS = 'bizproc-fields-multiple__add';
	const ADD_BUTTON_SELECTOR = `.${ADD_BUTTON_CLASS}`;
	function initFieldHints(container) {
		const hint = main_core.Reflection.getClass('BX.UI.Hint');
		if (!main_core.Type.isNull(hint) && main_core.Type.isFunction(hint.init)) {
			hint.init(container);
		}
	}
	class FieldLayout {
		static renderNameBlock(params) {
			const nameNode = FieldLayout.#renderName(params.property);
			const hintNode = params.showDescription ? FieldLayout.#renderDescription(params.property) : null;
			if (main_core.Type.isNull(nameNode) && main_core.Type.isNull(hintNode)) {
				return null;
			}
			const block = params.isGroup ? main_core.Tag.render`<legend class="bizproc-fields-header"></legend>` : main_core.Tag.render`<label class="bizproc-fields-header"></label>`;
			if (!params.isGroup && main_core.Type.isStringFilled(params.controlId)) {
				main_core.Dom.attr(block, 'for', params.controlId);
			}
			if (!main_core.Type.isNull(nameNode)) {
				main_core.Dom.append(nameNode, block);
			}
			if (!main_core.Type.isNull(hintNode)) {
				main_core.Dom.append(hintNode, block);
			}
			return block;
		}
		static #renderName(property) {
			const name = property.Name;
			if (!main_core.Type.isString(name) || name.trim() === '') {
				return null;
			}
			const required = isRequired(property);
			return main_core.Tag.render`
			<span class="bizproc-fields-label">
				${main_core.Text.encode(name)}
				${required ? main_core.Tag.render`<span class="bizproc-fields-label__required" aria-hidden="true">*</span>` : ''}
			</span>
		`;
		}
		static #renderDescription(property) {
			const description = property.Description;
			if (!description) {
				return null;
			}
			return main_core.Tag.render`
			<span
				class="ui-hint"
				data-hint="${main_core.Text.encode(String(description))}"
				data-testid="bizproc-field-hint"
			></span>
		`;
		}
		static renderCaption(property, captionId) {
			const description = property.Description;
			if (!description) {
				return null;
			}
			const node = main_core.Tag.render`<div class="bizproc-fields-caption">${main_core.Text.encode(String(description))}</div>`;
			if (captionId) {
				main_core.Dom.attr(node, 'id', captionId);
			}
			return node;
		}
		static buildMultipleRow(control, params) {
			const row = main_core.Tag.render`<div class="bizproc-fields-multiple__row"></div>`;
			main_core.Dom.append(control, row);
			if (!params.readOnly) {
				const removeButton = main_core.Tag.render`
				<button
					type="button"
					class="bizproc-fields-multiple__remove"
					aria-label="${main_core.Text.encode(params.removeLabel)}"
					data-testid="${main_core.Text.encode(`bizproc-field-remove-${params.fieldName}`)}"
				>
					<div class="ui-icon-set --cross-l"></div>
				</button>
			`;
				main_core.Event.bind(removeButton, 'click', () => {
					const addButton = row.parentElement?.querySelector(ADD_BUTTON_SELECTOR) ?? null;
					row.remove();
					params.onRemove(control);
					if (!main_core.Type.isNull(addButton)) {
						addButton.focus();
					}
				});
				main_core.Dom.append(removeButton, row);
			}
			return row;
		}
		static wrapMultiple(controls, params) {
			const wrapper = main_core.Tag.render`<div class="bizproc-fields-multiple" data-testid="bizproc-field-multiple-wrap"></div>`;
			controls.forEach(ctrl => {
				main_core.Dom.append(FieldLayout.buildMultipleRow(ctrl, params), wrapper);
			});
			if (!params.readOnly) {
				const addButton = main_core.Tag.render`
				<button type="button" class="${ADD_BUTTON_CLASS}" data-testid="bizproc-field-clone-btn">
					<div class="ui-icon-set --plus-l"></div>
					<span>${main_core.Text.encode(params.addLabel)}</span>
				</button>
			`;
				main_core.Event.bind(addButton, 'click', () => {
					params.onAddClick(wrapper);
				});
				main_core.Dom.append(addButton, wrapper);
			}
			return wrapper;
		}
		static assemble(params) {
			const {
				nameBlockNode,
				captionNode,
				controlNode,
				showLabels
			} = params;
			const isGroup = params.isGroup === true;
			if (!showLabels) {
				return FieldLayout.#wrapControl(controlNode);
			}
			const row = isGroup ? main_core.Tag.render`
				<fieldset class="bizproc-fields-row bizproc-fields-row--multiple" data-testid="bizproc-field-row"></fieldset>
			` : main_core.Tag.render`<div class="bizproc-fields-row" data-testid="bizproc-field-row"></div>`;
			if (!main_core.Type.isNull(nameBlockNode)) {
				main_core.Dom.append(nameBlockNode, row);
			}
			main_core.Dom.append(isGroup ? controlNode : FieldLayout.#wrapControl(controlNode), row);
			if (!main_core.Type.isNil(captionNode)) {
				main_core.Dom.append(captionNode, row);
			}
			return row;
		}
		static #wrapControl(controlNode) {
			return main_core.Tag.render`
			<div class="bizproc-fields-control-wrap" data-testid="bizproc-field-control-wrap">
				${controlNode}
			</div>
		`;
		}
	}

	function insertWhereNodeWas(node, parent, next) {
		if (main_core.Type.isNull(parent)) {
			return;
		}
		if (!main_core.Type.isNull(next) && next.parentNode === parent) {
			parent.insertBefore(node, next);
			return;
		}
		main_core.Dom.append(node, parent);
	}

	const VALUE_NODE_MARKER = 'data-bizproc-field-value-node';
	function canApplySelectionDecorator(property, provider) {
		return isSelectable(property) && provider.isAvailable() && provider.supports(property);
	}
	function applySelectionDecorator(control, property, provider, context) {
		if (!canApplySelectionDecorator(property, provider)) {
			return control;
		}
		const anchor = control.insertAnchor;
		if (!main_core.Type.isUndefined(anchor) && isDecoratableAnchor(anchor, control)) {
			return decorateInsertAnchor(control, anchor, property, provider, context);
		}
		return decorateValueNode(control, property, provider, context);
	}
	function isDecoratableAnchor(anchor, control) {
		if (anchor.contains(control.valueNode)) {
			return false;
		}
		return main_core.Type.isUndefined(control.namedNode) || !anchor.contains(control.namedNode);
	}
	function decorateInsertAnchor(control, anchor, property, provider, context) {
		const parent = anchor.parentElement;
		const next = anchor.nextElementSibling;
		const decorated = provider.decorate(anchor, property, context);
		if (decorated === anchor) {
			return control;
		}
		if (decorated.contains(anchor)) {
			insertWhereNodeWas(decorated, parent, next);
		} else {
			main_core.Dom.replace(anchor, decorated);
		}
		return {
			root: control.root,
			valueNode: control.valueNode,
			namedNode: control.namedNode
		};
	}
	function decorateValueNode(control, property, provider, context) {
		const parent = control.valueNode.parentElement;
		const next = control.valueNode.nextElementSibling;
		main_core.Dom.attr(control.valueNode, VALUE_NODE_MARKER, '');
		const decorated = provider.decorate(control.valueNode, property, context);
		main_core.Dom.attr(control.valueNode, VALUE_NODE_MARKER, null);
		if (decorated === control.valueNode) {
			return control;
		}
		const moved = decorated.contains(control.valueNode);
		const marked = findValueNode(decorated);
		if (main_core.Type.isNull(marked) && !moved) {
			console.error('[bizproc.fields] selection provider returned markup holding neither the control node ' + 'nor a copy of it; the decoration is dropped, see SelectionProvider.decorate');
			return control;
		}
		const valueNode = marked ?? control.valueNode;
		main_core.Dom.attr(valueNode, VALUE_NODE_MARKER, null);
		if (control.valueNode === control.root) {
			if (moved) {
				insertWhereNodeWas(decorated, parent, next);
			}
			return {
				root: decorated,
				valueNode,
				namedNode: control.namedNode
			};
		}
		if (moved) {
			insertWhereNodeWas(decorated, parent, next);
		} else {
			main_core.Dom.replace(control.valueNode, decorated);
		}
		return {
			root: control.root,
			valueNode,
			namedNode: control.namedNode === control.valueNode ? valueNode : control.namedNode
		};
	}
	function findValueNode(decorated) {
		if (decorated.matches(`[${VALUE_NODE_MARKER}]`)) {
			return decorated;
		}
		const found = decorated.querySelector(`[${VALUE_NODE_MARKER}]`);
		return main_core.Type.isElementNode(found) ? found : null;
	}

	class NullSelectionProvider {
		isAvailable() {
			return false;
		}
		supports(_property) {
			return false;
		}
		decorate(controlNode, _property, _context) {
			return controlNode;
		}
		decorateByRole(_role, controlNode, _property, _context) {
			return controlNode;
		}
	}

	function buildTextControl(params) {
		const stringValue = toSingleValue(params.value);
		const valueNode = params.multiline === true ? renderTextarea(params, stringValue) : renderInput(params, stringValue);
		if (main_core.Type.isStringFilled(params.inputMode)) {
			main_core.Dom.attr(valueNode, 'inputmode', params.inputMode);
		}
		if (params.readOnly || params.nonEditable === true) {
			main_core.Dom.attr(valueNode, 'readonly', '');
		}
		const control = main_core.Tag.render`
		<div class="bizproc-fields-box ${params.blockClass}${params.readOnly ? ` ${params.blockClass}--readonly` : ''}">
			${valueNode}
		</div>
	`;
		const root = renderRow(params);
		main_core.Dom.append(control, root);
		(params.rowNodes ?? []).forEach(node => {
			if (!main_core.Type.isNull(node)) {
				main_core.Dom.append(node, root);
			}
		});
		if (!main_core.Type.isNull(params.insertButton)) {
			main_core.Dom.append(params.insertButton, root);
		}
		return {
			root,
			control,
			valueNode
		};
	}
	function toSingleValue(value) {
		return main_core.Type.isArray(value) ? value[0] ?? '' : value ?? '';
	}
	function renderInput(params, stringValue) {
		return main_core.Tag.render`
		<input
			type="text"
			class="${params.blockClass}__input"
			name="${main_core.Text.encode(params.name)}"
			value="${main_core.Text.encode(stringValue)}"
			placeholder="${main_core.Text.encode(params.placeholder)}"
			data-role="${selectorRole(params)}"
			data-testid="${main_core.Text.encode(`bizproc-field-control-${params.fieldName}`)}"
		/>
	`;
	}
	function renderTextarea(params, stringValue) {
		const node = main_core.Tag.render`
		<textarea
			class="${params.blockClass}__input"
			name="${main_core.Text.encode(params.name)}"
			placeholder="${main_core.Text.encode(params.placeholder)}"
			data-role="${selectorRole(params)}"
			data-testid="${main_core.Text.encode(`bizproc-field-control-${params.fieldName}`)}"
		></textarea>
	`;
		main_core.Dom.adjust(node, {
			text: stringValue
		});
		return node;
	}
	function renderRow(params) {
		if (params.rowTestId === false) {
			return main_core.Tag.render`<div class="${params.blockClass}-row"></div>`;
		}
		return main_core.Tag.render`
		<div
			class="${params.blockClass}-row"
			data-testid="${main_core.Text.encode(`bizproc-field-row-${params.fieldName}`)}"
		></div>
	`;
	}
	function selectorRole(params) {
		return params.selectable && !params.readOnly ? 'inline-selector-target' : '';
	}

	class BaseField {
		static #instanceCounter = 0;
		#property;
		#fieldName;
		#renderMode;
		#showLabels;
		#showDescriptions;
		#documentType;
		#selectionProvider;
		#value;
		#valueNodes = [];
		#rowNameNodes = [];
		#valueNodeByRoot = new WeakMap();
		#captionRendered = false;
		#rootNode = null;
		#controlId;
		#captionId;
		constructor(params) {
			this.#property = params.property;
			this.#fieldName = params.fieldName;
			this.#value = params.value ?? null;
			this.#selectionProvider = params.selectionProvider ?? new NullSelectionProvider();
			this.#renderMode = params.renderMode ?? RenderMode.NewDesigner;
			this.#showLabels = params.showLabels ?? true;
			this.#showDescriptions = params.showDescriptions ?? true;
			this.#documentType = params.documentType;
			const instanceIndex = ++BaseField.#instanceCounter;
			this.#controlId = `bizproc-field-ctrl-${params.fieldName.replace(/[^a-zA-Z0-9_-]/g, '-')}-${instanceIndex}`;
			this.#captionId = `${this.#controlId}-caption`;
		}
		renderControl(value) {
			const type = main_core.Text.encode(this.#property.Type);
			const name = main_core.Text.encode(this.getControlName());
			const placeholder = main_core.Text.encode(this.getPlaceholder());
			const fieldTestId = main_core.Text.encode(`bizproc-field-control-${this.#fieldName}`);
			const node = main_core.Tag.render`
			<input
				type="text"
				class="bizproc-type-control"
				name="${name}"
				title="${type}"
				disabled="disabled"
				placeholder="${placeholder}"
				data-role="${this.isSelectable() ? 'inline-selector-target' : ''}"
				data-testid="${fieldTestId}"
			/>
		`;
			return {
				root: node,
				valueNode: node
			};
		}
		rendersGroup() {
			return false;
		}
		getGroupRequiredNodes(root) {
			return [];
		}
		render() {
			this.release();
			this.#valueNodes = [];
			this.#rowNameNodes = [];
			this.#valueNodeByRoot = new WeakMap();
			const captionNode = this.#showLabels && this.#showDescriptions ? FieldLayout.renderCaption(this.#property, this.#captionId) : null;
			this.#captionRendered = !main_core.Type.isNull(captionNode);
			const multiple = isMultiple(this.#property);
			const rendersOwnGroup = this.rendersGroup();
			const isGroup = rendersOwnGroup || multiple;
			let controlNode;
			let nameTarget = null;
			if (multiple && !rendersOwnGroup) {
				const values = this.#toValueList(this.#value);
				const seed = values.length > 0 ? values : [null];
				const roots = seed.map(presetValue => {
					const control = this.#buildControl(presetValue);
					this.#applyRowAria(control);
					return control.root;
				});
				controlNode = this.wrapMultiple(roots);
				this.#nameRows();
			} else {
				const control = this.#buildControl(this.#value);
				controlNode = control.root;
				nameTarget = control.namedNode ?? control.valueNode;
			}
			if (!isGroup && !main_core.Type.isNull(nameTarget)) {
				main_core.Dom.attr(nameTarget, 'id', this.#controlId);
				this.#applyAria(nameTarget);
			}
			const nameBlockNode = this.#showLabels ? FieldLayout.renderNameBlock({
				property: this.#property,
				isGroup,
				showDescription: this.#showDescriptions,
				controlId: this.#controlId
			}) : null;
			const assembled = FieldLayout.assemble({
				nameBlockNode,
				captionNode,
				controlNode,
				showLabels: this.#showLabels,
				isGroup
			});
			if (rendersOwnGroup) {
				this.#applyGroupAria(assembled);
			}
			initFieldHints(assembled);
			main_core.Dom.attr(assembled, 'data-testid', `bizproc-field-${this.#fieldName}`);
			this.#rootNode = assembled;
			return assembled;
		}
		emitChange() {
			if (main_core.Type.isNull(this.#rootNode)) {
				return;
			}
			this.#rootNode.dispatchEvent(new globalThis.Event('change', {
				bubbles: true
			}));
		}
		release() {}
		getValue() {
			if (this.isMultiple()) {
				return this.#valueNodes.map(node => node.value ?? '').filter(item => item !== '');
			}
			const node = this.#valueNodes[0];
			if (main_core.Type.isUndefined(node)) {
				return '';
			}
			return node.value ?? '';
		}
		setValue(value) {
			this.#value = value;
			this.applyValue(value);
		}
		isMultiple() {
			return isMultiple(this.#property);
		}
		isSelectable() {
			return isSelectable(this.#property);
		}
		isRequired() {
			return isRequired(this.#property);
		}
		getControlName() {
			return getControlName(this.#fieldName, this.#property);
		}
		getRenderMode() {
			return this.#renderMode;
		}
		getProperty() {
			return this.#property;
		}
		setProperty(property) {
			this.#property = property;
		}
		getFieldName() {
			return this.#fieldName;
		}
		getPlaceholder() {
			const placeholder = this.#property.Placeholder;
			const own = main_core.Type.isUndefined(placeholder) ? '' : String(placeholder);
			return own === '' ? this.getDefaultPlaceholder() : own;
		}
		renderInsertButton() {
			const button = main_core.Tag.render`
			<button
				type="button"
				class="bizproc-fields-insert"
				aria-label="${main_core.Text.encode(main_core.Loc.getMessage('BIZPROC_FIELDS_INSERT_VALUE') ?? '')}"
				data-testid="${main_core.Text.encode(`bizproc-field-insert-${this.#fieldName}`)}"
			>
				<div class="ui-icon-set --more-l" aria-hidden="true"></div>
			</button>
		`;
			return button;
		}
		getSelectionContext() {
			if (!main_core.Type.isUndefined(this.#documentType)) {
				return {
					documentType: this.#documentType
				};
			}
			return {};
		}
		isReadOnly() {
			return isReadOnly(this.#property);
		}
		wrapMultiple(controls) {
			const readOnly = this.isReadOnly();
			const fieldName = this.getFieldName();
			const removeLabel = main_core.Loc.getMessage('BIZPROC_FIELDS_MULTIPLE_REMOVE') ?? '';
			const addLabel = main_core.Loc.getMessage('BIZPROC_FIELDS_MULTIPLE_ADD') ?? '';
			const onRemove = control => {
				this.#forgetRow(this.#valueNodeByRoot.get(control));
				this.emitChange();
			};
			const onAddClick = wrapper => {
				const control = this.#buildControl(null);
				this.#applyRowAria(control);
				this.#nameRows();
				const row = FieldLayout.buildMultipleRow(control.root, {
					readOnly,
					onRemove,
					removeLabel,
					fieldName
				});
				const addButton = wrapper.querySelector('.bizproc-fields-multiple__add');
				if (main_core.Type.isNull(addButton)) {
					main_core.Dom.append(row, wrapper);
				} else {
					main_core.Dom.insertBefore(row, addButton);
				}
				this.emitChange();
			};
			return FieldLayout.wrapMultiple(controls, {
				readOnly,
				onAddClick,
				onRemove,
				removeLabel,
				addLabel,
				fieldName
			});
		}
		renderSelectionControl(control) {
			if (!this.decoratesSelection()) {
				return control;
			}
			return applySelectionDecorator(control, this.#property, this.#selectionProvider, this.getSelectionContext());
		}
		decoratesSelection() {
			if (this.#renderMode === RenderMode.Public && !toBool(this.#property.AllowSelection)) {
				return false;
			}
			if (this.isReadOnly()) {
				return false;
			}
			return canApplySelectionDecorator(this.#property, this.#selectionProvider);
		}
		getValueNodes() {
			return [...this.#valueNodes];
		}
		splitsScalarValue() {
			return true;
		}
		applyValue(value) {
			if (this.isMultiple()) {
				const values = this.#toValueList(value);
				this.#valueNodes.forEach((node, index) => {
					node.value = values[index] ?? '';
				});
				return;
			}
			const node = this.#valueNodes[0];
			if (!main_core.Type.isUndefined(node)) {
				node.value = main_core.Type.isArray(value) ? value.join(',') : value;
			}
		}
		getDefaultPlaceholder() {
			return '';
		}
		renderTextControl(options) {
			const readOnly = this.isReadOnly();
			const selectable = this.isSelectable();
			const ownInsertButton = selectable && !readOnly && !this.decoratesSelection();
			return buildTextControl({
				...options,
				fieldName: this.#fieldName,
				name: this.getControlName(),
				placeholder: this.getPlaceholder(),
				readOnly,
				selectable,
				insertButton: ownInsertButton ? this.renderInsertButton() : null
			});
		}
		bindInputFilter(root, inputSelector, sanitize) {
			if (this.isReadOnly()) {
				return;
			}
			main_core.Event.bind(root, 'input', event => {
				const input = main_core.Type.isElementNode(event.target) ? event.target.closest(inputSelector) : null;
				if (!main_core.Type.isNull(input)) {
					this.#applyInputFilter(input, sanitize);
				}
			});
		}
		splitOffset(value) {
			return splitOffsetValue(value);
		}
		getTimezones(extensionId) {
			return readTimezones(this.#property.Settings, extensionId);
		}
		findTimezone(timezones, offset, match) {
			return findTimezoneByOffset(timezones, offset, match);
		}
		renderTimezoneSelect(options) {
			return buildTimezoneSelect({
				...options,
				name: this.getControlName(),
				testId: `bizproc-field-timezone-${this.#fieldName}`,
				disabled: this.isReadOnly()
			});
		}
		getControlId() {
			return this.#controlId;
		}
		getCaptionId() {
			return this.#captionId;
		}
		showsLabels() {
			return this.#showLabels;
		}
		showsDescriptions() {
			return this.#showDescriptions;
		}
		#toValueList(value) {
			if (main_core.Type.isArray(value)) {
				return value;
			}
			if (!main_core.Type.isStringFilled(value)) {
				return [];
			}
			return this.splitsScalarValue() ? value.split(',') : [value];
		}
		#buildControl(value) {
			const control = this.renderSelectionControl(this.renderControl(value));
			this.#valueNodes.push(control.valueNode);
			this.#valueNodeByRoot.set(control.root, control.valueNode);
			return control;
		}
		#applyInputFilter(input, sanitize) {
			const filtered = filterInput(input.value, input.selectionStart ?? input.value.length, sanitize);
			if (main_core.Type.isNull(filtered)) {
				return;
			}
			input.value = filtered.value;
			input.setSelectionRange(filtered.caret, filtered.caret);
		}
		#applyAria(target) {
			if (isRequired(this.#property)) {
				main_core.Dom.attr(target, 'aria-required', 'true');
			}
			if (this.#captionRendered) {
				main_core.Dom.attr(target, 'aria-describedby', this.#captionId);
			}
		}
		#applyGroupAria(groupNode) {
			this.#nameGroup(groupNode);
			if (this.#captionRendered) {
				main_core.Dom.attr(groupNode, 'aria-describedby', this.#captionId);
			}
			if (!isRequired(this.#property)) {
				return;
			}
			this.getGroupRequiredNodes(groupNode).forEach(node => {
				main_core.Dom.attr(node, 'aria-required', 'true');
			});
		}
		#nameGroup(groupNode) {
			if (this.#isNamedByLegend(groupNode)) {
				return;
			}
			if (groupNode.tagName !== 'FIELDSET') {
				main_core.Dom.attr(groupNode, 'role', 'group');
			}
			main_core.Dom.attr(groupNode, 'aria-label', this.#accessibleName());
		}
		#isNamedByLegend(groupNode) {
			const legend = groupNode.querySelector(':scope > legend');
			return !main_core.Type.isNull(legend) && main_core.Type.isStringFilled(legend.textContent?.trim());
		}
		#accessibleName() {
			const name = main_core.Type.isString(this.#property.Name) ? this.#property.Name.trim() : '';
			return main_core.Type.isStringFilled(name) ? name : this.#fieldName;
		}
		#applyRowAria(control) {
			const target = control.namedNode ?? control.valueNode;
			this.#applyAria(target);
			this.#rowNameNodes.push(target);
		}
		#nameRows() {
			const name = this.#accessibleName();
			this.#rowNameNodes.forEach((node, index) => {
				const label = main_core.Loc.getMessage('BIZPROC_FIELDS_MULTIPLE_ROW_LABEL', {
					'#NAME#': name,
					'#NUMBER#': String(index + 1)
				}) ?? '';
				if (label !== '') {
					main_core.Dom.attr(node, 'aria-label', label);
				}
			});
		}
		#forgetRow(valueNode) {
			if (main_core.Type.isUndefined(valueNode)) {
				return;
			}
			const index = this.#valueNodes.indexOf(valueNode);
			if (index === -1) {
				return;
			}
			this.#valueNodes.splice(index, 1);
			this.#rowNameNodes.splice(index, 1);
			this.#nameRows();
		}
	}

	function resolveSelectionProvider(provider) {
		if (main_core.Type.isNil(provider)) {
			return new NullSelectionProvider();
		}
		return provider;
	}
	class FieldFactory {
		static create(type, params) {
			const FieldClass = FieldRegistry.get(type);
			if (main_core.Type.isNull(FieldClass)) {
				return null;
			}
			const fieldParams = {
				...params,
				selectionProvider: resolveSelectionProvider(params.selectionProvider)
			};
			return new FieldClass(fieldParams);
		}
	}

	const CHUNK_SIZE = 100;
	class BackendRenderer {
		#options;
		#selection;
		#pending = [];
		#flushScheduled = false;
		constructor(options, selection) {
			this.#options = options;
			this.#selection = selection ?? null;
		}
		renderPlaceholder(fieldName, property, value, documentType, renderMode) {
			const placeholderNode = main_core.Tag.render`
			<div
				class="bizproc-fields-backend-placeholder"
				data-role="field-placeholder"
				data-field-name="${main_core.Text.encode(fieldName)}"
				aria-busy="true"
			></div>
		`;
			this.#pending.push({
				fieldName,
				property,
				value,
				documentType,
				renderMode,
				placeholderNode
			});
			if (!this.#flushScheduled) {
				this.#flushScheduled = true;
				Promise.resolve().then(() => this.#flush());
			}
			return placeholderNode;
		}
		cancelPending() {
			this.#pending = [];
			this.#flushScheduled = false;
		}
		cancelPlaceholder(placeholderNode) {
			this.#pending = this.#pending.filter(item => item.placeholderNode !== placeholderNode);
		}
		#flush() {
			this.#flushScheduled = false;
			const items = this.#pending;
			this.#pending = [];
			if (items.length === 0) {
				return;
			}
			this.#sendChunked(items);
		}
		#sendChunked(items) {
			const groups = new Map();
			items.forEach(item => {
				const documentType = this.#options.documentType ?? item.documentType ?? [];
				const key = JSON.stringify(documentType);
				const group = groups.get(key);
				if (main_core.Type.isUndefined(group)) {
					groups.set(key, {
						documentType,
						items: [item]
					});
				} else {
					group.items.push(item);
				}
			});
			const promises = [];
			groups.forEach(group => {
				let offset = 0;
				while (offset < group.items.length) {
					const chunk = group.items.slice(offset, offset + CHUNK_SIZE);
					promises.push(this.#sendChunk(chunk, group.documentType));
					offset += CHUNK_SIZE;
				}
			});
			Promise.all(promises).catch(() => {}).finally(() => {
				main_core_events.EventEmitter.emit(EventName.BackendRenderFinished);
			});
		}
		#sendChunk(chunk, documentType) {
			const controlsData = chunk.map(item => {
				const isPublicMode = this.#isPublicMode(item);
				return {
					property: item.property,
					params: {
						Field: {
							Field: item.fieldName,
							Form: BackendForm.Sfa
						},
						Value: item.value ?? '',
						Als: main_core.Type.isUndefined(item.property.AllowSelection) ? isPublicMode ? 0 : 1 : Number(isSelectable(item.property)),
						RenderMode: isPublicMode ? 'public' : 'designer'
					}
				};
			});
			return main_core.ajax.runAction('bizproc.fieldtype.renderControlCollection', {
				json: {
					context: {},
					documentType,
					controlsData
				}
			}).then(response => {
				const htmlArray = response.data?.html;
				if (!main_core.Type.isArrayFilled(htmlArray)) {
					this.#markChunkError(chunk);
					console.error('[bizproc.fields] BackendRenderer: response contains no rendered controls');
					return undefined;
				}
				if (htmlArray.length !== chunk.length) {
					this.#markChunkError(chunk);
					console.error('[bizproc.fields] BackendRenderer: HTML count does not match requested controls');
					return undefined;
				}
				const renderPromises = [];
				htmlArray.forEach((html, index) => {
					const item = chunk[index];
					if (main_core.Type.isUndefined(item)) {
						return;
					}
					main_core.Dom.clean(item.placeholderNode);
					const runtimeResult = main_core.Runtime.html(item.placeholderNode, html);
					if (!main_core.Type.isString(runtimeResult)) {
						renderPromises.push(runtimeResult.then(() => {
							main_core.Dom.attr(item.placeholderNode, 'aria-busy', null);
							this.#initSelectors(item.placeholderNode, item.property, documentType, this.#isPublicMode(item));
						})
						.catch(error => {
							this.#markChunkError([item]);
							console.error('[bizproc.fields] BackendRenderer: control markup failed to load', error);
						}));
					} else {
						main_core.Dom.attr(item.placeholderNode, 'aria-busy', null);
						this.#initSelectors(item.placeholderNode, item.property, documentType, this.#isPublicMode(item));
					}
				});
				return Promise.all(renderPromises).then(() => undefined);
			}).catch(error => {
				this.#markChunkError(chunk);
				console.error('[bizproc.fields] BackendRenderer: ajax render failed', error);
			});
		}
		#isPublicMode(item) {
			const renderMode = this.#options.renderMode ?? item.renderMode ?? RenderMode.NewDesigner;
			return renderMode === RenderMode.Public;
		}
		#markChunkError(items) {
			const errorMessage = main_core.Loc.getMessage('BIZPROC_FIELDS_BACKEND_RENDER_ERROR') ?? '';
			items.forEach(item => {
				main_core.Dom.attr(item.placeholderNode, 'aria-busy', null);
				main_core.Dom.addClass(item.placeholderNode, 'bizproc-fields-backend-placeholder--error');
				main_core.Dom.attr(item.placeholderNode, 'data-role', 'field-placeholder-error');
				main_core.Dom.adjust(item.placeholderNode, {
					children: [main_core.Text.encode(errorMessage)]
				});
			});
		}
		#initSelectors(containerNode, property, documentType, isPublicMode) {
			const selection = this.#selection;
			if (main_core.Type.isNull(selection) || !selection.provider.isAvailable()) {
				return;
			}
			const {
				provider,
				applyDecorator
			} = selection;
			const context = {
				documentType: documentType.length > 0 ? documentType : undefined
			};
			const childControlNodes = containerNode.querySelectorAll('[data-role]');
			if (isPublicMode) {
				applyDecorator({
					root: containerNode,
					valueNode: containerNode
				}, property, provider, context);
				return;
			}
			childControlNodes.forEach(node => {
				const parent = node.parentElement;
				const next = node.nextElementSibling;
				if (main_core.Type.isNull(parent)) {
					return;
				}
				const role = main_core.Dom.attr(node, 'data-role') ?? '';
				const decorated = provider.decorateByRole(role, node, property, context);
				if (decorated === node) {
					return;
				}
				if (decorated.contains(node)) {
					insertWhereNodeWas(decorated, parent, next);
				} else {
					main_core.Dom.replace(node, decorated);
				}
			});
		}
	}

	class FieldManager {
		#options;
		#entries = new Map();
		#fieldIdCounter = 0;
		#backendRenderer;
		#selectionProvider;
		constructor(options = {}) {
			this.#options = options;
			this.#selectionProvider = resolveSelectionProvider(options.selectionProvider);
			this.#backendRenderer = new BackendRenderer(options, {
				provider: this.#selectionProvider,
				applyDecorator: applySelectionDecorator
			});
		}
		renderField(params) {
			const type = params.property.Type;
			const FieldClass = FieldRegistry.get(type);
			if (!main_core.Type.isNull(FieldClass)) {
				const fieldParams = {
					...params,
					renderMode: this.#options.renderMode ?? params.renderMode ?? RenderMode.NewDesigner,
					showLabels: this.#options.showLabels ?? params.showLabels ?? true,
					showDescriptions: this.#options.showDescriptions ?? params.showDescriptions ?? true,
					documentType: this.#options.documentType ?? params.documentType,
					selectionProvider: this.#selectionProvider
				};
				const field = FieldFactory.create(type, fieldParams);
				if (!main_core.Type.isNull(field)) {
					return this.#track(params.fieldName, field, field.render());
				}
			}
			const placeholderNode = this.#backendRenderer.renderPlaceholder(params.fieldName, params.property, params.value ?? null, this.#options.documentType ?? params.documentType, this.#options.renderMode ?? params.renderMode);
			return this.#track(params.fieldName, null, placeholderNode);
		}
		renderCollection(items) {
			return items.map(item => this.renderField({
				property: item.property,
				fieldName: item.fieldName,
				value: item.value ?? null
			}));
		}
		applyProperty(fieldId, property) {
			const entry = this.#entries.get(fieldId);
			if (main_core.Type.isUndefined(entry)) {
				return null;
			}
			const field = entry.field;
			if (main_core.Type.isNull(field) || property.Type !== field.getProperty().Type) {
				return entry.node;
			}
			const carriedValue = FieldManager.#adaptValue(field.getValue(), property);
			field.setProperty(property);
			field.setValue(carriedValue);
			const nextNode = field.render();
			field.setValue(carriedValue);
			main_core.Dom.replace(entry.node, nextNode);
			entry.node = nextNode;
			return nextNode;
		}
		getValue(fieldName) {
			const field = this.#findFieldByName(fieldName);
			if (main_core.Type.isNull(field)) {
				return null;
			}
			return field.getValue();
		}
		getFieldValue(fieldId) {
			const entry = this.#entries.get(fieldId);
			if (main_core.Type.isUndefined(entry) || main_core.Type.isNull(entry.field)) {
				return null;
			}
			return entry.field.getValue();
		}
		setFieldValue(fieldId, value) {
			const entry = this.#entries.get(fieldId);
			if (main_core.Type.isUndefined(entry) || main_core.Type.isNull(entry.field)) {
				return;
			}
			entry.field.setValue(value);
		}
		getValues() {
			const result = {};
			this.#entries.forEach(entry => {
				if (main_core.Type.isNull(entry.field)) {
					return;
				}
				const value = entry.field.getValue();
				const collected = result[entry.fieldName];
				result[entry.fieldName] = main_core.Type.isArray(collected) && main_core.Type.isArray(value) ? [...collected, ...value] : value;
			});
			return result;
		}
		setValue(fieldName, value) {
			const field = this.#findFieldByName(fieldName);
			if (!main_core.Type.isNull(field)) {
				field.setValue(value);
			}
		}
		releaseField(fieldId) {
			const entry = this.#entries.get(fieldId);
			if (main_core.Type.isUndefined(entry)) {
				return;
			}
			if (main_core.Type.isNull(entry.field)) {
				this.#backendRenderer.cancelPlaceholder(entry.node);
			} else {
				entry.field.release();
			}
			this.#entries.delete(fieldId);
			main_core.Dom.remove(entry.node);
		}
		destroy() {
			this.#backendRenderer.cancelPending();
			[...this.#entries.keys()].forEach(fieldId => this.releaseField(fieldId));
		}
		#track(fieldName, field, node) {
			this.#fieldIdCounter += 1;
			const fieldId = `bizproc-field-${this.#fieldIdCounter}`;
			this.#entries.set(fieldId, {
				fieldName,
				field,
				node
			});
			return {
				fieldId,
				node
			};
		}
		#findFieldByName(fieldName) {
			for (const entry of this.#entries.values()) {
				if (entry.fieldName === fieldName && !main_core.Type.isNull(entry.field)) {
					return entry.field;
				}
			}
			return null;
		}
		static #adaptValue(value, property) {
			if (isMultiple(property)) {
				if (main_core.Type.isArray(value)) {
					return value;
				}
				return main_core.Type.isStringFilled(value) ? [value] : [];
			}
			if (main_core.Type.isArray(value)) {
				return value.find(item => main_core.Type.isStringFilled(item)) ?? '';
			}
			return value;
		}
	}

	function isAutomationAvailable() {
		return !main_core.Type.isNull(main_core.Reflection.getClass('BX.Bizproc.Automation'));
	}

	class AutomationSelectionProvider {
		isAvailable() {
			return isAutomationAvailable();
		}
		supports(_property) {
			return true;
		}
		decorate(controlNode, property, context) {
			return this.decorateByRole(bizproc_automation.SelectorManager.SELECTOR_ROLE_INLINE, controlNode, property, context);
		}
		decorateByRole(role, controlNode, _property, context) {
			const globalContext = bizproc_automation.tryGetGlobalContext();
			const document = globalContext?.document ?? null;
			const userOptionsProp = main_core.Type.isNil(globalContext?.userOptions) ? {} : {
				userOptions: globalContext.userOptions
			};
			const selectorContext = new bizproc_automation.SelectorContext({
				fields: document ? main_core.Runtime.clone(document.getFields()) : [],
				useSwitcherMenu: globalContext?.get('showTemplatePropertiesMenuOnSelecting') === true,
				rootGroupTitle: document?.title ?? '',
				...userOptionsProp,
				...context.extra,
				...(main_core.Type.isUndefined(context.documentType) ? {} : {
					documentType: context.documentType
				})
			});
			const selector = bizproc_automation.SelectorManager.createSelectorByRole(role, {
				context: selectorContext
			});
			if (!selector || !(selector instanceof bizproc_automation.InlineSelector)) {
				return controlNode;
			}
			return selector.renderWith(controlNode);
		}
	}

	exports.AutomationSelectionProvider = AutomationSelectionProvider;
	exports.BaseField = BaseField;
	exports.EventName = EventName;
	exports.FieldManager = FieldManager;
	exports.FieldRegistry = FieldRegistry;
	exports.NullSelectionProvider = NullSelectionProvider;
	exports.RenderMode = RenderMode;
	exports.initFieldHints = initFieldHints;

})(this.BX.Bizproc.Fields = this.BX.Bizproc.Fields || {}, BX, BX.UI, window, BX.Event, BX.Bizproc.Automation);
//# sourceMappingURL=fields.bundle.js.map
