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
	const NameBlockPlacement = Object.freeze({
		Above: 'above',
		InsideControlRow: 'inside-control-row'
	});
	const ValueMode = Object.freeze({
		Value: 'value',
		Expression: 'expression'
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
	function isSelectionAllowed(property, renderMode) {
		if (renderMode === RenderMode.Public) {
			return toBool(property.AllowSelection);
		}
		return isSelectable(property);
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

	const EXPRESSION_MARKER = /^\s*[={]/;
	function isExpressionValue(value) {
		return main_core.Type.isStringFilled(value) && EXPRESSION_MARKER.test(value);
	}
	function splitTopLevelValues(text) {
		const values = [];
		let depth = 0;
		let start = 0;
		for (let index = 0; index < text.length; index += 1) {
			const char = text[index];
			if (char === '{') {
				depth += 1;
			} else if (char === '}') {
				depth = Math.max(depth - 1, 0);
			} else if (char === ',' && depth === 0) {
				values.push(text.slice(start, index));
				start = index + 1;
			}
		}
		values.push(text.slice(start));
		return values;
	}
	function getExpressionFieldName(fieldName) {
		return `${fieldName}_text`;
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
	const NAME_INSIDE_MODIFIER = '--name-inside';
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
			const block = params.isGroup ? main_core.Tag.render`<legend class="bizproc-fields-header" data-testid="bizproc-field-name-block"></legend>` : main_core.Tag.render`<label class="bizproc-fields-header" data-testid="bizproc-field-name-block"></label>`;
			if (!params.isGroup && main_core.Type.isStringFilled(params.controlId)) {
				main_core.Dom.attr(block, 'for', params.controlId);
			}
			if (!main_core.Type.isNull(nameNode)) {
				main_core.Dom.append(nameNode, block);
			}
			if (!main_core.Type.isNull(hintNode)) {
				main_core.Dom.append(hintNode, block);
				if (block.hasAttribute('for')) {
					main_core.Event.bind(hintNode, 'click', event => event.preventDefault());
				}
			}
			return block;
		}
		static #renderName(property) {
			const name = property.Name;
			if (!main_core.Type.isString(name) || name.trim() === '') {
				return null;
			}
			const requiredMark = isRequired(property) ? main_core.Tag.render`
				<span
					class="bizproc-fields-label__required"
					aria-hidden="true"
					data-testid="bizproc-field-required-mark"
				>*</span>
			` : '';
			return main_core.Tag.render`
			<span class="bizproc-fields-label" data-testid="bizproc-field-label">
				${main_core.Text.encode(name)}
				${requiredMark}
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
			const row = main_core.Tag.render`
			<div
				class="bizproc-fields-multiple__row"
				data-testid="${main_core.Text.encode(`bizproc-field-multiple-row-${params.fieldName}`)}"
			></div>
		`;
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
				showLabels,
				expressionRowNode
			} = params;
			const isGroup = params.isGroup === true;
			const nameBlockInsideControlRow = !isGroup && params.nameBlockPlacement === NameBlockPlacement.InsideControlRow;
			if (!showLabels) {
				const bareControl = FieldLayout.#wrapControl(controlNode);
				if (!main_core.Type.isNil(expressionRowNode) && !controlNode.contains(expressionRowNode)) {
					main_core.Dom.append(expressionRowNode, bareControl);
				}
				return bareControl;
			}
			const row = isGroup ? main_core.Tag.render`
				<fieldset class="bizproc-fields-row bizproc-fields-row--multiple" data-testid="bizproc-field-row"></fieldset>
			` : main_core.Tag.render`<div class="bizproc-fields-row" data-testid="bizproc-field-row"></div>`;
			const controlHolder = isGroup ? controlNode : FieldLayout.#wrapControl(controlNode);
			if (!main_core.Type.isNull(nameBlockNode)) {
				if (nameBlockInsideControlRow) {
					main_core.Dom.addClass(controlHolder, NAME_INSIDE_MODIFIER);
				}
				main_core.Dom.append(nameBlockNode, nameBlockInsideControlRow ? controlHolder : row);
				if (nameBlockInsideControlRow && !main_core.Type.isNil(expressionRowNode)) {
					main_core.Dom.append(expressionRowNode, controlHolder);
				}
			}
			main_core.Dom.append(controlHolder, row);
			if (isGroup && !main_core.Type.isNil(expressionRowNode)) {
				main_core.Dom.append(expressionRowNode, row);
			}
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

	function isWriteTarget(node) {
		return node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement || node instanceof HTMLSelectElement;
	}

	const VALUE_NODE_MARKER = 'data-bizproc-field-value-node';
	const EXPRESSION_NODE_MARKER = 'data-bizproc-field-expression-node';
	function canApplySelectionDecorator(property, provider) {
		return !isReadOnly(property) && isSelectable(property) && provider.isAvailable() && provider.supports(property);
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
	function withWriteTarget(context, node) {
		return isWriteTarget(node) ? {
			...context,
			writeTarget: node
		} : context;
	}
	function decorateInsertAnchor(control, anchor, property, provider, context) {
		const parent = anchor.parentElement;
		const next = anchor.nextElementSibling;
		const tracked = trackedExpressionNode(control, anchor);
		if (!main_core.Type.isNull(tracked)) {
			main_core.Dom.attr(tracked, EXPRESSION_NODE_MARKER, '');
		}
		const decorated = provider.decorate(anchor, property, withWriteTarget(context, tracked ?? anchor));
		if (!main_core.Type.isNull(tracked)) {
			main_core.Dom.attr(tracked, EXPRESSION_NODE_MARKER, null);
		}
		if (decorated === anchor) {
			return control;
		}
		const moved = decorated.contains(anchor);
		const marked = main_core.Type.isNull(tracked) ? null : findMarkedNode(decorated, EXPRESSION_NODE_MARKER);
		if (!main_core.Type.isNull(tracked) && main_core.Type.isNull(marked) && !moved) {
			console.error('[bizproc.fields] selection provider returned markup holding neither the anchor node ' + 'nor a copy of it; the decoration is dropped, see SelectionProvider.decorate');
			return control;
		}
		if (moved) {
			insertWhereNodeWas(decorated, parent, next);
		} else {
			main_core.Dom.replace(anchor, decorated);
		}
		if (!main_core.Type.isNull(marked)) {
			main_core.Dom.attr(marked, EXPRESSION_NODE_MARKER, null);
		}
		return {
			root: control.root,
			valueNode: control.valueNode,
			namedNode: control.namedNode,
			expressionNode: main_core.Type.isNull(tracked) ? control.expressionNode : marked ?? tracked
		};
	}
	function trackedExpressionNode(control, anchor) {
		const expressionNode = control.expressionNode;
		if (main_core.Type.isUndefined(expressionNode) || !anchor.contains(expressionNode)) {
			return null;
		}
		return expressionNode;
	}
	function decorateValueNode(control, property, provider, context) {
		const parent = control.valueNode.parentElement;
		const next = control.valueNode.nextElementSibling;
		main_core.Dom.attr(control.valueNode, VALUE_NODE_MARKER, '');
		const decorated = provider.decorate(control.valueNode, property, withWriteTarget(context, control.valueNode));
		main_core.Dom.attr(control.valueNode, VALUE_NODE_MARKER, null);
		if (decorated === control.valueNode) {
			return control;
		}
		const moved = decorated.contains(control.valueNode);
		const marked = findMarkedNode(decorated, VALUE_NODE_MARKER);
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
				namedNode: control.namedNode,
				expressionNode: control.expressionNode
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
			namedNode: control.namedNode === control.valueNode ? valueNode : control.namedNode,
			expressionNode: control.expressionNode
		};
	}
	function findMarkedNode(decorated, marker) {
		if (decorated.matches(`[${marker}]`)) {
			return decorated;
		}
		const found = decorated.querySelector(`[${marker}]`);
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

	const TAB_CLASS = 'bizproc-fields-value-mode__tab';
	const ACTIVE_MODIFIER = '--active';
	const KEY_STEPS = {
		ArrowLeft: -1,
		ArrowUp: -1,
		ArrowRight: 1,
		ArrowDown: 1
	};
	function buildValueModeSwitcher(params) {
		const modes = [ValueMode.Value, ValueMode.Expression];
		const tabs = [];
		let activeMode = params.activeMode;
		const setActiveMode = mode => {
			activeMode = mode;
			tabs.forEach((tab, index) => {
				const isActive = modes[index] === activeMode;
				main_core.Dom.attr(tab, 'aria-checked', isActive ? 'true' : 'false');
				main_core.Dom.attr(tab, 'tabindex', isActive ? '0' : '-1');
				if (isActive) {
					main_core.Dom.addClass(tab, ACTIVE_MODIFIER);
				} else {
					main_core.Dom.removeClass(tab, ACTIVE_MODIFIER);
				}
			});
		};
		const selectMode = mode => {
			if (mode === activeMode) {
				return;
			}
			setActiveMode(mode);
			params.onSelect(mode);
		};
		const node = main_core.Tag.render`
		<div
			class="bizproc-fields-value-mode"
			role="radiogroup"
			aria-label="${main_core.Text.encode(params.groupLabel)}"
			data-testid="${main_core.Text.encode(`bizproc-field-mode-switcher-${params.fieldName}`)}"
		></div>
	`;
		modes.forEach(mode => {
			const label = mode === ValueMode.Value ? params.labels.value : params.labels.expression;
			const tab = main_core.Tag.render`
			<button
				type="button"
				class="${TAB_CLASS}"
				role="radio"
				aria-checked="false"
				tabindex="-1"
				data-testid="${main_core.Text.encode(`bizproc-field-mode-${mode}-${params.fieldName}`)}"
			>${main_core.Text.encode(label)}</button>
		`;
			if (params.readOnly) {
				main_core.Dom.attr(tab, 'aria-disabled', 'true');
			} else {
				main_core.Event.bind(tab, 'click', () => {
					selectMode(mode);
				});
			}
			tabs.push(tab);
			main_core.Dom.append(tab, node);
		});
		if (!params.readOnly) {
			main_core.Event.bind(node, 'keydown', event => {
				const step = KEY_STEPS[event.key];
				if (main_core.Type.isUndefined(step)) {
					return;
				}
				event.preventDefault();
				const nextIndex = (modes.indexOf(activeMode) + step + modes.length) % modes.length;
				selectMode(modes[nextIndex]);
				tabs[nextIndex].focus();
			});
		}
		setActiveMode(activeMode);
		return {
			node,
			setActiveMode
		};
	}

	const EXPRESSION_ROW_CLASS = 'bizproc-fields-expression';
	function buildExpressionControl(params) {
		const placeholder = main_core.Loc.getMessage('BIZPROC_FIELDS_EXPRESSION_PLACEHOLDER') ?? '';
		const value = main_core.Type.isArray(params.value) ? params.value[0] ?? '' : params.value ?? '';
		const input = main_core.Tag.render`
		<input
			type="text"
			class="bizproc-fields-expression__input"
			value="${main_core.Text.encode(value)}"
			placeholder="${main_core.Text.encode(placeholder)}"
			data-role="${params.readOnly ? '' : 'inline-selector-target'}"
			data-testid="${main_core.Text.encode(`bizproc-field-expression-${params.fieldName}`)}"
		/>
	`;
		if (params.readOnly) {
			main_core.Dom.attr(input, 'readonly', '');
		}
		if (params.writeOver === true) {
			main_core.Dom.attr(input, 'data-select-mode', 'replace');
		}
		const node = main_core.Tag.render`
		<div
			class="${EXPRESSION_ROW_CLASS}${params.readOnly ? ` ${EXPRESSION_ROW_CLASS}--readonly` : ''}"
			data-testid="${main_core.Text.encode(`bizproc-field-expression-row-${params.fieldName}`)}"
		>
			${input}
		</div>
	`;
		if (!main_core.Type.isNull(params.insertButton)) {
			main_core.Dom.append(params.insertButton, node);
		}
		return {
			node,
			input
		};
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
		if (params.writeOver === true) {
			main_core.Dom.attr(valueNode, 'data-select-mode', 'replace');
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

	const CARRIER_CLASS = 'bizproc-fields-mode-carrier';
	const INACTIVE_MODIFIER = '--inactive';
	const ERROR_MODIFIER = '--error';
	const ERROR_CAPTION_CLASS = 'bizproc-fields-error';
	const EXPRESSION_INPUT_SELECTOR = `.${EXPRESSION_ROW_CLASS}__input`;
	function isLabelable(node) {
		const labels = node.labels;
		return !main_core.Type.isUndefined(labels) && !main_core.Type.isNull(labels);
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
		#namedNodes = [];
		#expressionNodes = [];
		#sharedExpressionNode = null;
		#rowsWrapNode = null;
		#valueNodeByRoot = new WeakMap();
		#valueMode = ValueMode.Value;
		#valueModeSwitcher = null;
		#stashedValues = new WeakMap();
		#captionRendered = false;
		#rootNode = null;
		#expressionCarrier = null;
		#errorNode = null;
		#controlId;
		#captionId;
		#errorId;
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
			this.#errorId = `${this.#controlId}-error`;
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
		getNameBlockPlacement() {
			return NameBlockPlacement.Above;
		}
		supportsExpressionMode() {
			return false;
		}
		getValueModeLabels() {
			return {
				value: main_core.Loc.getMessage('BIZPROC_FIELDS_VALUE_MODE_SWITCH') ?? '',
				expression: main_core.Loc.getMessage('BIZPROC_FIELDS_VALUE_MODE_EXPRESSION') ?? ''
			};
		}
		rendersOwnMultiple() {
			return this.rendersGroup();
		}
		namedNodeCarriesRequired() {
			return true;
		}
		getGroupRequiredNodes(root) {
			return [];
		}
		render() {
			this.release();
			this.#valueNodes = [];
			this.#namedNodes = [];
			this.#expressionNodes = [];
			this.#sharedExpressionNode = null;
			this.#rowsWrapNode = null;
			this.#valueNodeByRoot = new WeakMap();
			this.#valueModeSwitcher = null;
			this.#stashedValues = new WeakMap();
			this.#expressionCarrier = null;
			this.#errorNode = null;
			const captionNode = this.#showLabels && this.#showDescriptions ? FieldLayout.renderCaption(this.#property, this.#captionId) : null;
			this.#captionRendered = !main_core.Type.isNull(captionNode);
			const multiple = isMultiple(this.#property);
			const rendersOwnGroup = this.rendersGroup();
			const buildsRows = multiple && !this.rendersOwnMultiple();
			const isGroup = rendersOwnGroup || buildsRows;
			let controlNode;
			let nameTarget = null;
			let expressionRowNode = null;
			if (buildsRows) {
				const rows = this.#buildRows();
				controlNode = rows.controlNode;
				expressionRowNode = rows.expressionRowNode;
			} else {
				const control = this.#buildControl(this.#value);
				controlNode = control.root;
				nameTarget = control.namedNode ?? control.valueNode;
				expressionRowNode = main_core.Type.isUndefined(control.expressionNode) ? null : this.#expressionRowOf(control.expressionNode);
			}
			this.#nameExpressionNodes();
			if (!isGroup && !main_core.Type.isNull(nameTarget)) {
				main_core.Dom.attr(nameTarget, 'id', this.#controlId);
				this.#applyAria(nameTarget);
			}
			const namesTarget = !isGroup && !main_core.Type.isNull(nameTarget) && isLabelable(nameTarget);
			const nameBlockNode = this.#showLabels ? FieldLayout.renderNameBlock({
				property: this.#property,
				isGroup,
				showDescription: this.#showDescriptions,
				controlId: namesTarget ? this.#controlId : undefined
			}) : null;
			const assembled = FieldLayout.assemble({
				nameBlockNode,
				captionNode,
				controlNode,
				showLabels: this.#showLabels,
				isGroup,
				nameBlockPlacement: this.getNameBlockPlacement(),
				expressionRowNode
			});
			if (rendersOwnGroup) {
				this.#applyGroupAria(assembled);
			}
			this.#adoptRenderedValueMode();
			this.#renderValueModeSwitcher(assembled);
			this.#applyValueModeState();
			initFieldHints(assembled);
			main_core.Dom.attr(assembled, 'data-testid', `bizproc-field-${this.#fieldName}`);
			this.#rootNode = assembled;
			this.checkExpressionCarrier();
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
		releaseRow(valueNode) {}
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
			if (!this.#offersExpressionMode()) {
				this.#writeValue(value);
				return;
			}
			const listShaped = this.#buildsRows() || main_core.Type.isArray(value);
			const {
				values,
				expression
			} = this.#splitItems(listShaped ? this.#toValueList(value) : [value]);
			if (main_core.Type.isStringFilled(expression)) {
				this.#value = value;
				if (this.#valueMode !== ValueMode.Expression) {
					this.#valueNodes.forEach(valueNode => this.#setCarrierValue(valueNode, false));
				}
				this.setValueMode(ValueMode.Expression);
				this.#applyExpression(expression);
				return;
			}
			if (this.#valueMode !== ValueMode.Value) {
				this.getExpressionNodes().forEach(node => this.#setCarrierValue(node, false));
			}
			this.setValueMode(ValueMode.Value);
			this.#writeValue(listShaped ? values : value);
		}
		#writeValue(value) {
			this.#value = value;
			this.applyValue(value);
			this.checkExpressionCarrier();
		}
		getValueState() {
			return {
				value: this.getValue(),
				expression: this.#readExpression(),
				mode: this.#valueMode
			};
		}
		getEffectiveValue() {
			const state = this.getValueState();
			if (state.mode !== ValueMode.Expression) {
				return state.value;
			}
			const listShaped = main_core.Type.isArray(state.value);
			if (!isExpressionValue(state.expression)) {
				return listShaped ? [] : '';
			}
			return listShaped ? [state.expression] : state.expression;
		}
		carriesExpression() {
			const state = this.getValueState();
			return state.mode === ValueMode.Expression && isExpressionValue(state.expression);
		}
		setValueState(state) {
			this.#writeValue(state.value);
			const mode = this.#offersExpressionMode() ? state.mode : ValueMode.Value;
			this.#restoreExpression(state.expression, mode);
			this.setValueMode(mode);
		}
		#restoreExpression(expression, mode) {
			if (!this.#offersExpressionMode()) {
				return;
			}
			const active = mode === ValueMode.Expression;
			const stash = !active && main_core.Type.isStringFilled(expression);
			this.getExpressionNodes().forEach(node => {
				const input = node;
				this.#stashedValues.delete(node);
				input.value = active ? expression : '';
				if (stash) {
					this.#stashedValues.set(node, expression);
				}
			});
			this.checkExpressionCarrier();
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
					fieldName: this.#fieldName,
					documentType: this.#documentType
				};
			}
			return {
				fieldName: this.#fieldName
			};
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
				this.#nameExpressionNodes();
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
				this.#applyValueModeState();
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
			return this.#decorateSelection(control);
		}
		#decorateSelection(control) {
			return applySelectionDecorator(control, this.#property, this.#selectionProvider, this.getSelectionContext());
		}
		decoratesSelection() {
			if (!isSelectionAllowed(this.#property, this.#renderMode)) {
				return false;
			}
			if (this.isReadOnly()) {
				return false;
			}
			return canApplySelectionDecorator(this.#property, this.#selectionProvider);
		}
		decoratesSharedExpressionRow() {
			return this.decoratesSelection();
		}
		getValueNodes() {
			return [...this.#valueNodes];
		}
		getExpressionNodes() {
			if (!main_core.Type.isNull(this.#sharedExpressionNode)) {
				return [this.#sharedExpressionNode];
			}
			return this.#expressionNodes.filter(node => !main_core.Type.isNull(node));
		}
		getValueMode() {
			return this.#valueMode;
		}
		setValueMode(mode) {
			this.#valueMode = mode;
			if (!main_core.Type.isNull(this.#valueModeSwitcher)) {
				this.#valueModeSwitcher.setActiveMode(mode);
			}
			this.#applyValueModeState();
		}
		onValueModeChanged(mode) {}
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
		renderExpressionControl(options) {
			if (!this.#offersExpressionMode() || this.hasSharedExpressionRow()) {
				return null;
			}
			const readOnly = this.isReadOnly();
			const ownInsertButton = !readOnly && !this.decoratesSelection();
			const control = buildExpressionControl({
				...options,
				fieldName: this.#fieldName,
				readOnly,
				insertButton: ownInsertButton ? this.renderInsertButton() : null
			});
			this.watchExpressionCarrier(control.node, EXPRESSION_INPUT_SELECTOR);
			return control;
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
		watchExpressionCarrier(carrier, inputSelector) {
			if (this.isReadOnly()) {
				return;
			}
			this.#expressionCarrier = {
				node: carrier,
				inputSelector
			};
			main_core.Event.bind(carrier, 'focusout', this.#handleCarrierCommit);
			main_core.Event.bind(carrier, 'change', this.#handleCarrierCommit);
		}
		checkExpressionCarrier() {
			const carrier = this.#expressionCarrier;
			if (main_core.Type.isNull(carrier)) {
				return;
			}
			const input = carrier.node.querySelector(carrier.inputSelector);
			if (main_core.Type.isNull(input)) {
				return;
			}
			this.#markExpressionError(carrier.node, input, !this.isExpressionCarrierValid(input));
		}
		isExpressionCarrierValid(input) {
			return !main_core.Type.isStringFilled(input.value) || isExpressionValue(input.value);
		}
		#handleCarrierCommit = () => {
			this.checkExpressionCarrier();
		};
		#markExpressionError(carrier, input, invalid) {
			if (!invalid) {
				main_core.Dom.removeClass(carrier, ERROR_MODIFIER);
				main_core.Dom.attr(input, 'aria-invalid', null);
				this.#describeByError(input, false);
				main_core.Dom.remove(this.#errorNode);
				this.#errorNode = null;
				return;
			}
			main_core.Dom.addClass(carrier, ERROR_MODIFIER);
			main_core.Dom.attr(input, 'aria-invalid', 'true');
			if (main_core.Type.isNull(this.#errorNode)) {
				this.#errorNode = main_core.Tag.render`
				<div
					class="${ERROR_CAPTION_CLASS}"
					data-testid="${main_core.Text.encode(`bizproc-field-error-${this.#fieldName}`)}"
				>
					${main_core.Text.encode(main_core.Loc.getMessage('BIZPROC_FIELDS_EXPRESSION_INVALID') ?? '')}
				</div>
			`;
				main_core.Dom.attr(this.#errorNode, 'id', this.#errorId);
				main_core.Dom.insertAfter(this.#errorNode, carrier);
			}
			this.#describeByError(input, true);
		}
		#describeByError(input, described) {
			const ids = (input.getAttribute('aria-describedby') ?? '').split(' ').filter(id => id !== '' && id !== this.#errorId);
			if (described) {
				ids.push(this.#errorId);
			}
			main_core.Dom.attr(input, 'aria-describedby', ids.length > 0 ? ids.join(' ') : null);
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
			return this.splitsScalarValue() ? splitTopLevelValues(value) : [value];
		}
		#splitItems(items) {
			if (!this.#offersExpressionMode()) {
				return {
					values: items,
					expression: ''
				};
			}
			const values = items.filter(item => !isExpressionValue(item));
			const expression = values.length > 0 ? '' : items.find(item => isExpressionValue(item)) ?? '';
			return {
				values,
				expression
			};
		}
		#buildRows() {
			const {
				values,
				expression: seedExpression
			} = this.#splitItems(this.#toValueList(this.#value));
			const seed = values.length > 0 ? values : [null];
			if (main_core.Type.isStringFilled(seedExpression)) {
				this.setValueMode(ValueMode.Expression);
			}
			const roots = seed.map(presetValue => {
				const control = this.#buildControl(presetValue);
				this.#applyRowAria(control);
				return control.root;
			});
			const controlNode = this.wrapMultiple(roots);
			this.#rowsWrapNode = controlNode;
			this.#nameRows();
			return {
				controlNode,
				expressionRowNode: this.#buildSharedExpressionRow(seedExpression, controlNode)
			};
		}
		#buildControl(value) {
			const control = this.renderSelectionControl(this.renderControl(value));
			this.#valueNodes.push(control.valueNode);
			this.#namedNodes.push(control.namedNode ?? control.valueNode);
			this.#valueNodeByRoot.set(control.root, control.valueNode);
			this.#trackExpressionNode(control.expressionNode);
			return control;
		}
		#buildsRows() {
			return isMultiple(this.#property) && !this.rendersOwnMultiple();
		}
		hasSharedExpressionRow() {
			return this.#buildsRows() && this.#offersExpressionMode();
		}
		#buildSharedExpressionRow(value, rowsWrapNode) {
			if (!this.hasSharedExpressionRow()) {
				return null;
			}
			const readOnly = this.isReadOnly();
			const decorates = this.decoratesSharedExpressionRow();
			const ownInsertButton = !readOnly && !decorates;
			const row = buildExpressionControl({
				value,
				fieldName: this.#fieldName,
				readOnly,
				insertButton: ownInsertButton ? this.renderInsertButton() : null
			});
			const pair = {
				root: row.node,
				valueNode: rowsWrapNode,
				insertAnchor: row.input,
				expressionNode: row.input
			};
			const decorated = decorates ? this.#decorateSelection(pair) : pair;
			const input = decorated.expressionNode ?? row.input;
			main_core.Dom.attr(input, 'name', getExpressionFieldName(this.#fieldName));
			this.#sharedExpressionNode = input;
			this.watchExpressionCarrier(row.node, EXPRESSION_INPUT_SELECTOR);
			return decorated.root;
		}
		#trackExpressionNode(expressionNode) {
			if (main_core.Type.isUndefined(expressionNode)) {
				this.#expressionNodes.push(null);
				return;
			}
			main_core.Dom.attr(expressionNode, 'name', getExpressionFieldName(this.#fieldName));
			this.#expressionNodes.push(expressionNode);
		}
		#readExpression() {
			const node = this.getExpressionNodes()[0];
			return main_core.Type.isUndefined(node) ? '' : this.#carrierValue(node);
		}
		#applyExpression(expression) {
			this.getExpressionNodes().forEach(node => {
				const input = node;
				this.#stashedValues.delete(node);
				input.value = expression;
			});
			this.checkExpressionCarrier();
		}
		#carrierValue(node) {
			const stashed = this.#stashedValues.get(node);
			return main_core.Type.isUndefined(stashed) ? node.value ?? '' : stashed;
		}
		#offersExpressionMode() {
			return this.supportsExpressionMode() && isSelectionAllowed(this.#property, this.#renderMode);
		}
		#renderValueModeSwitcher(assembled) {
			if (!this.#offersExpressionMode()) {
				return;
			}
			const switcher = buildValueModeSwitcher({
				labels: this.getValueModeLabels(),
				activeMode: this.#valueMode,
				groupLabel: main_core.Loc.getMessage('BIZPROC_FIELDS_VALUE_MODE_LABEL', {
					'#NAME#': this.accessibleName()
				}) ?? '',
				fieldName: this.#fieldName,
				readOnly: this.isReadOnly(),
				onSelect: mode => {
					this.#selectValueMode(mode);
				}
			});
			this.#valueModeSwitcher = switcher;
			const legend = assembled.querySelector(':scope > legend');
			if (main_core.Type.isNull(legend)) {
				main_core.Dom.prepend(switcher.node, assembled);
				return;
			}
			main_core.Dom.insertAfter(switcher.node, legend);
		}
		#adoptRenderedValueMode() {
			if (!this.#offersExpressionMode() || !main_core.Type.isStringFilled(this.#readExpression())) {
				return;
			}
			const value = this.getValue();
			const holdsNoValue = main_core.Type.isArray(value) ? value.length === 0 : value === '';
			if (holdsNoValue) {
				this.setValueMode(ValueMode.Expression);
			}
		}
		#selectValueMode(mode) {
			if (this.isReadOnly()) {
				return;
			}
			if (mode === this.#valueMode) {
				return;
			}
			this.#valueMode = mode;
			this.#moveValueToActiveCarrier();
			this.onValueModeChanged(mode);
			this.#applyValueModeState();
			this.emitChange();
		}
		#applyValueModeState() {
			if (main_core.Type.isNull(this.#valueModeSwitcher)) {
				return;
			}
			const expressionActive = this.#valueMode === ValueMode.Expression;
			if (!main_core.Type.isNull(this.#sharedExpressionNode) && !main_core.Type.isNull(this.#rowsWrapNode)) {
				this.#setCarrierActive(this.#rowsWrapNode, !expressionActive);
				this.#setCarrierActive(this.#expressionRowOf(this.#sharedExpressionNode), expressionActive);
				return;
			}
			this.#forEachCarrierPair(pair => {
				this.#setCarrierActive(pair.namedNode, !expressionActive);
				this.#setCarrierActive(this.#expressionRowOf(pair.expressionNode), expressionActive);
			});
		}
		#moveValueToActiveCarrier() {
			const expressionActive = this.#valueMode === ValueMode.Expression;
			if (!main_core.Type.isNull(this.#sharedExpressionNode)) {
				this.#valueNodes.forEach(valueNode => this.#setCarrierValue(valueNode, !expressionActive));
				this.#setCarrierValue(this.#sharedExpressionNode, expressionActive);
			} else {
				this.#forEachCarrierPair(pair => {
					this.#setCarrierValue(pair.valueNode, !expressionActive);
					this.#setCarrierValue(pair.expressionNode, expressionActive);
				});
			}
			this.checkExpressionCarrier();
		}
		#forEachCarrierPair(callback) {
			this.#expressionNodes.forEach((expressionNode, index) => {
				const valueNode = this.#valueNodes[index];
				const namedNode = this.#namedNodes[index];
				if (main_core.Type.isNull(expressionNode) || main_core.Type.isUndefined(valueNode) || main_core.Type.isUndefined(namedNode)) {
					return;
				}
				callback({
					valueNode,
					expressionNode,
					namedNode
				});
			});
		}
		#setCarrierActive(node, active) {
			main_core.Dom.addClass(node, CARRIER_CLASS);
			if (active) {
				main_core.Dom.removeClass(node, INACTIVE_MODIFIER);
			} else {
				main_core.Dom.addClass(node, INACTIVE_MODIFIER);
			}
			node.toggleAttribute('inert', !active);
		}
		#setCarrierValue(node, active) {
			const input = node;
			if (!active) {
				this.#stashedValues.set(node, input.value);
				input.value = '';
				return;
			}
			const stashed = this.#stashedValues.get(node);
			if (!main_core.Type.isUndefined(stashed)) {
				input.value = stashed;
				this.#stashedValues.delete(node);
			}
		}
		#expressionRowOf(expressionNode) {
			return expressionNode.closest(`.${EXPRESSION_ROW_CLASS}`) ?? expressionNode;
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
			if (isRequired(this.#property) && this.namedNodeCarriesRequired()) {
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
			main_core.Dom.attr(groupNode, 'aria-label', this.accessibleName());
		}
		#isNamedByLegend(groupNode) {
			const legend = groupNode.querySelector(':scope > legend');
			return !main_core.Type.isNull(legend) && main_core.Type.isStringFilled(legend.textContent?.trim());
		}
		accessibleName() {
			const name = main_core.Type.isString(this.#property.Name) ? this.#property.Name.trim() : '';
			return main_core.Type.isStringFilled(name) ? name : this.#fieldName;
		}
		#applyRowAria(control) {
			this.#applyAria(control.namedNode ?? control.valueNode);
		}
		#nameExpressionNodes() {
			if (!main_core.Type.isNull(this.#sharedExpressionNode)) {
				const fieldLabel = main_core.Loc.getMessage('BIZPROC_FIELDS_EXPRESSION_LABEL', {
					'#NAME#': this.accessibleName()
				}) ?? '';
				if (fieldLabel !== '') {
					main_core.Dom.attr(this.#sharedExpressionNode, 'aria-label', fieldLabel);
				}
				return;
			}
			this.#expressionNodes.forEach((node, index) => {
				if (main_core.Type.isNull(node)) {
					return;
				}
				const label = main_core.Loc.getMessage('BIZPROC_FIELDS_EXPRESSION_LABEL', {
					'#NAME#': this.#rowOwnerName(index)
				}) ?? '';
				if (label !== '') {
					main_core.Dom.attr(node, 'aria-label', label);
				}
			});
		}
		#rowOwnerName(index) {
			const name = this.accessibleName();
			if (!this.isMultiple() || this.rendersGroup()) {
				return name;
			}
			return main_core.Loc.getMessage('BIZPROC_FIELDS_MULTIPLE_ROW_LABEL', {
				'#NAME#': name,
				'#NUMBER#': String(index + 1)
			}) ?? name;
		}
		#nameRows() {
			const name = this.accessibleName();
			this.#namedNodes.forEach((node, index) => {
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
			this.releaseRow(valueNode);
			this.#valueNodes.splice(index, 1);
			this.#namedNodes.splice(index, 1);
			this.#expressionNodes.splice(index, 1);
			this.#nameRows();
			this.#nameExpressionNodes();
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
	const SERVER_SELECTOR_BUTTON_ROLE = 'bp-selector-button';
	const INLINE_SELECTOR_TARGET_ROLE = 'inline-selector-target';
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
				const renderMode = this.#resolveRenderMode(item);
				return {
					property: item.property,
					params: {
						Field: {
							Field: item.fieldName,
							Form: BackendForm.Sfa
						},
						Value: item.value ?? '',
						Als: Number(isSelectionAllowed(item.property, renderMode)),
						RenderMode: renderMode === RenderMode.Public ? 'public' : 'designer'
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
							this.#initSelectors(item, documentType);
						})
						.catch(error => {
							this.#markChunkError([item]);
							console.error('[bizproc.fields] BackendRenderer: control markup failed to load', error);
						}));
					} else {
						main_core.Dom.attr(item.placeholderNode, 'aria-busy', null);
						this.#initSelectors(item, documentType);
					}
				});
				return Promise.all(renderPromises).then(() => undefined);
			}).catch(error => {
				this.#markChunkError(chunk);
				console.error('[bizproc.fields] BackendRenderer: ajax render failed', error);
			});
		}
		#resolveRenderMode(item) {
			return this.#options.renderMode ?? item.renderMode ?? RenderMode.NewDesigner;
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
		#initSelectors(item, documentType) {
			const selection = this.#selection;
			const {
				fieldName,
				property,
				placeholderNode
			} = item;
			if (main_core.Type.isNull(selection) || !selection.canApply(property)) {
				return;
			}
			const {
				provider
			} = selection;
			const context = {
				fieldName,
				documentType: documentType.length > 0 ? documentType : undefined
			};
			placeholderNode.querySelectorAll('[data-role]').forEach(node => {
				const parent = node.parentElement;
				const next = node.nextElementSibling;
				if (main_core.Type.isNull(parent)) {
					return;
				}
				const role = main_core.Dom.attr(node, 'data-role') ?? '';
				if (role === SERVER_SELECTOR_BUTTON_ROLE) {
					return;
				}
				const nodeContext = role === INLINE_SELECTOR_TARGET_ROLE && isWriteTarget(node) ? {
					...context,
					writeTarget: node
				} : context;
				const decorated = provider.decorateByRole(role, node, property, nodeContext);
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
				canApply: property => canApplySelectionDecorator(property, this.#selectionProvider)
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
			const state = field.getValueState();
			const carriedState = {
				...state,
				value: FieldManager.#adaptValue(state.value, property)
			};
			field.setProperty(property);
			field.setValueState(carriedState);
			const nextNode = field.render();
			field.setValueState(carriedState);
			main_core.Dom.replace(entry.node, nextNode);
			entry.node = nextNode;
			return nextNode;
		}
		getValue(fieldName) {
			const field = this.#findFieldByName(fieldName);
			if (main_core.Type.isNull(field)) {
				return null;
			}
			return field.getEffectiveValue();
		}
		getFieldValue(fieldId) {
			const entry = this.#entries.get(fieldId);
			if (main_core.Type.isUndefined(entry) || main_core.Type.isNull(entry.field)) {
				return null;
			}
			return entry.field.getEffectiveValue();
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
			const expressions = {};
			this.#entries.forEach(entry => {
				if (main_core.Type.isNull(entry.field)) {
					return;
				}
				const value = entry.field.getEffectiveValue();
				if (entry.field.carriesExpression()) {
					expressions[entry.fieldName] = value;
					return;
				}
				delete expressions[entry.fieldName];
				const collected = result[entry.fieldName];
				result[entry.fieldName] = main_core.Type.isArray(collected) && main_core.Type.isArray(value) ? [...collected, ...value] : value;
			});
			Object.entries(expressions).forEach(([fieldName, expression]) => {
				const collected = result[fieldName];
				result[fieldName] = main_core.Type.isArray(expression) && main_core.Type.isArray(collected) ? [...collected, ...expression] : expression;
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
			this.#selectionProvider.release?.();
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

	const BoolView = Object.freeze({
		Switcher: 'switcher',
		Checkbox: 'checkbox'
	});
	const VIEW_SETTING$1 = 'View';
	function readBoolView(property) {
		const settings = property.Settings;
		const view = main_core.Type.isPlainObject(settings) ? settings[VIEW_SETTING$1] : null;
		const known = Object.values(BoolView);
		return main_core.Type.isString(view) && known.includes(view) ? view : BoolView.Switcher;
	}

	const SelectView = Object.freeze({
		List: 'list',
		Dropdown: 'menu'
	});
	const VIEW_SETTING = 'ViewType';
	function readSelectView(property) {
		const settings = property.Settings;
		const view = main_core.Type.isPlainObject(settings) ? settings[VIEW_SETTING] : null;
		const known = Object.values(SelectView);
		return main_core.Type.isString(view) && known.includes(view) ? view : SelectView.List;
	}

	function isAutomationAvailable() {
		return !main_core.Type.isNull(main_core.Reflection.getClass('BX.Bizproc.Automation'));
	}

	const serializedProperties = new WeakMap();
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
		decorateByRole(role, controlNode, property, context) {
			if (main_core.Type.isNil(context.writeTarget)) {
				return controlNode;
			}
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
			this.#writeTargetProperties(controlNode, property);
			return selector.renderWith(controlNode);
		}
		#writeTargetProperties(controlNode, property) {
			let serializedProperty = serializedProperties.get(property);
			if (main_core.Type.isUndefined(serializedProperty)) {
				serializedProperty = JSON.stringify(property);
				serializedProperties.set(property, serializedProperty);
			}
			main_core.Dom.attr(controlNode, {
				'data-property': serializedProperty,
				'data-selector-type': property.Type
			});
		}
	}

	exports.AutomationSelectionProvider = AutomationSelectionProvider;
	exports.BaseField = BaseField;
	exports.BoolView = BoolView;
	exports.EXPRESSION_ROW_CLASS = EXPRESSION_ROW_CLASS;
	exports.EventName = EventName;
	exports.FieldManager = FieldManager;
	exports.FieldRegistry = FieldRegistry;
	exports.NameBlockPlacement = NameBlockPlacement;
	exports.NullSelectionProvider = NullSelectionProvider;
	exports.RenderMode = RenderMode;
	exports.SelectView = SelectView;
	exports.ValueMode = ValueMode;
	exports.initFieldHints = initFieldHints;
	exports.isExpressionValue = isExpressionValue;
	exports.readBoolView = readBoolView;
	exports.readSelectView = readSelectView;
	exports.splitTopLevelValues = splitTopLevelValues;

})(this.BX.Bizproc.Fields = this.BX.Bizproc.Fields || {}, BX, BX.UI, window, BX.Event, BX.Bizproc.Automation);
//# sourceMappingURL=fields.bundle.js.map
