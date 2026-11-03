/* eslint-disable */
this.BX = this.BX || {};
this.BX.Bizproc = this.BX.Bizproc || {};
this.BX.Bizproc.Fields = this.BX.Bizproc.Fields || {};
(function (exports, ui_designTokens, ui_iconSet_outline, main_core, main_core_events, bizproc_fields) {
	'use strict';

	const LEGACY_CLASS_NAME = 'BX.Bizproc.UserSelector';
	function getLegacyClass() {
		const legacyClass = main_core.Reflection.getClass(LEGACY_CLASS_NAME);
		if (main_core.Type.isNull(legacyClass) || !main_core.Type.isFunction(legacyClass.decorateNode)) {
			return null;
		}
		return legacyClass;
	}
	function decorateNode(container, config) {
		const legacyClass = getLegacyClass();
		if (main_core.Type.isNull(legacyClass)) {
			return null;
		}
		return legacyClass.decorateNode(container, config);
	}

	const EXTENSION_ID = 'bizproc.fields.user';
	const TAG_EVENTS = ['onTagAdd', 'onTagRemove'];
	const SERVICE_CONFIG_KEYS = ['valueInputName', 'value', 'items', 'multiple', 'required', 'canUseHumanResources', 'groups', 'isOnlyDialogMode', 'callbacks'];
	const MAX_PARSED_VALUE_LENGTH = 10000;
	class UserField extends bizproc_fields.BaseField {
		#widgetContainer = null;
		#selector = null;
		#suppressChange = false;
		rendersOwnMultiple() {
			return true;
		}
		decoratesSelection() {
			return false;
		}
		namedNodeCarriesRequired() {
			return false;
		}
		renderControl(value) {
			const valueString = this.#toValueString(value);
			const root = main_core.Tag.render`
			<div
				class="bizproc-fields-user"
				data-testid="${main_core.Text.encode(`bizproc-field-control-${this.getFieldName()}`)}"
			></div>
		`;
			const widgetContainer = main_core.Tag.render`<div></div>`;
			main_core.Dom.append(widgetContainer, root);
			if (this.isSelectable() && !this.isReadOnly()) {
				main_core.Dom.append(this.renderInsertButton(), root);
			}
			const selector = decorateNode(widgetContainer, this.#buildConfig(valueString));
			if (main_core.Type.isNull(selector)) {
				const fallbackNode = this.#renderFallbackValueNode(widgetContainer, valueString);
				this.#applyAccessibility(widgetContainer);
				return {
					root,
					valueNode: fallbackNode,
					namedNode: widgetContainer
				};
			}
			this.#attachWidget(widgetContainer, selector);
			if (this.isReadOnly()) {
				selector.tagSelector.setReadonly(true);
				selector.tagSelector.hideAddButton();
			}
			selector.valueNode.value = valueString;
			this.#applyAccessibility(widgetContainer);
			return {
				root,
				valueNode: selector.valueNode,
				namedNode: widgetContainer
			};
		}
		#applyAccessibility(container) {
			main_core.Dom.attr(container, 'role', 'group');
			main_core.Dom.attr(container, 'aria-label', this.accessibleName());
			if (this.isReadOnly()) {
				main_core.Dom.attr(container, 'aria-disabled', 'true');
			}
		}
		accessibleName() {
			const name = super.accessibleName();
			if (!this.isRequired()) {
				return name;
			}
			const requiredName = main_core.Loc.getMessage('BIZPROC_FIELDS_USER_REQUIRED_LABEL', {
				'#NAME#': name
			});
			return main_core.Type.isStringFilled(requiredName) ? requiredName : name;
		}
		getValue() {
			const node = this.getValueNodes()[0];
			if (main_core.Type.isUndefined(node)) {
				return '';
			}
			return node.value ?? '';
		}
		applyValue(value) {
			const text = this.#toValueString(value);
			if (text === this.getValue()) {
				return;
			}
			this.#suppressChange = true;
			try {
				this.#syncTags(text);
				const node = this.getValueNodes()[0];
				if (!main_core.Type.isUndefined(node)) {
					node.value = text;
				}
			} finally {
				this.#suppressChange = false;
			}
		}
		release() {
			const selector = this.#selector;
			if (!main_core.Type.isNull(selector)) {
				const tagSelector = selector.tagSelector;
				TAG_EVENTS.forEach(event => {
					main_core_events.EventEmitter.unsubscribe(tagSelector, event, this.#handleTagChange);
				});
				tagSelector.getDialog()?.destroy();
				this.#selector = null;
			}
			this.#widgetContainer = null;
		}
		#attachWidget(container, selector) {
			this.#widgetContainer = container;
			this.#selector = selector;
			TAG_EVENTS.forEach(event => {
				main_core_events.EventEmitter.subscribe(selector.tagSelector, event, this.#handleTagChange);
			});
		}
		#handleTagChange = () => {
			if (this.#suppressChange) {
				return;
			}
			this.emitChange();
		};
		#syncTags(text) {
			const container = this.#widgetContainer;
			const selector = this.#selector;
			if (main_core.Type.isNull(container) || main_core.Type.isNull(selector)) {
				return;
			}
			const focusBefore = this.#focusedElement();
			selector.tagSelector.removeTags();
			const parsable = this.#parsableValue(text);
			if (main_core.Type.isStringFilled(parsable)) {
				selector.parseValue(parsable).forEach(item => {
					selector.tagSelector.addTag({
						...item,
						animate: false
					});
				});
			}
			this.#restoreFocus(container, focusBefore);
		}
		#restoreFocus(container, focusBefore) {
			if (!main_core.Type.isNull(focusBefore)) {
				if (container.contains(focusBefore)) {
					return;
				}
				if (document.activeElement !== focusBefore) {
					focusBefore.focus();
				}
				if (document.activeElement === focusBefore) {
					return;
				}
			}
			this.#dropFocusTakenBy(container);
		}
		#dropFocusTakenBy(container) {
			const focusTaken = this.#focusedElement();
			if (!main_core.Type.isNull(focusTaken) && container.contains(focusTaken)) {
				focusTaken.blur();
			}
		}
		#focusedElement() {
			const focused = document.activeElement;
			if (!main_core.Type.isElementNode(focused) || focused === document.body || focused === document.documentElement) {
				return null;
			}
			return focused;
		}
		#buildConfig(value) {
			const settings = this.getProperty().Settings ?? {};
			const gapFillers = {};
			Object.keys(settings).forEach(key => {
				if (!SERVICE_CONFIG_KEYS.includes(key)) {
					gapFillers[key] = settings[key];
				}
			});
			return {
				...gapFillers,
				valueInputName: this.getFieldName(),
				value: this.#parsableValue(value),
				multiple: this.isMultiple(),
				required: this.isRequired(),
				canUseHumanResources: main_core.Extension.getSettings(EXTENSION_ID).get('canUseHumanResources') === true
			};
		}
		#parsableValue(value) {
			if (value.length <= MAX_PARSED_VALUE_LENGTH) {
				return value;
			}
			console.warn(`[bizproc.fields.user] value of "${this.getFieldName()}" is ${value.length} characters long, over the ` + `${MAX_PARSED_VALUE_LENGTH} the legacy widget is asked to parse; the value is kept, its tags are not shown`);
			return '';
		}
		#renderFallbackValueNode(container, value) {
			const node = main_core.Tag.render`
			<input type="hidden" name="${main_core.Text.encode(this.getFieldName())}"/>
		`;
			node.value = value;
			main_core.Dom.append(node, container);
			return node;
		}
		#toValueString(value) {
			const text = main_core.Type.isArray(value) ? value.filter(item => item !== '').join(',') : value ?? '';
			return this.#toOwnMultiplicity(text);
		}
		#toOwnMultiplicity(text) {
			if (this.isMultiple()) {
				return text;
			}
			return this.#splitEntities(text).find(item => main_core.Type.isStringFilled(item)) ?? '';
		}
		#splitEntities(text) {
			return bizproc_fields.splitTopLevelValues(text);
		}
	}
	bizproc_fields.FieldRegistry.register('user', UserField);

	exports.UserField = UserField;

})(this.BX.Bizproc.Fields.User = this.BX.Bizproc.Fields.User || {}, window, window, BX, BX.Event, BX.Bizproc.Fields);
//# sourceMappingURL=user.bundle.js.map
