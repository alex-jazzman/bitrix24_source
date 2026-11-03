/* eslint-disable */
this.BX = this.BX || {};
this.BX.Landing = this.BX.Landing || {};
this.BX.Landing.Ui = this.BX.Landing.Ui || {};
this.BX.Landing.Ui.Panel = this.BX.Landing.Ui.Panel || {};
this.BX.Landing.Ui.Panel.Formsettingspanel = this.BX.Landing.Ui.Panel.Formsettingspanel || {};
this.BX.Landing.Ui.Panel.Formsettingspanel.Content = this.BX.Landing.Ui.Panel.Formsettingspanel.Content || {};
(function (exports, main_core, landing_ui_panel_basepresetpanel, landing_ui_card_headercard, landing_ui_component_actionpanel, landing_ui_field_radiobuttonfield, landing_ui_form_formsettingsform, main_core_events, ui_designTokens, ui_fonts_opensans, landing_ui_field_basefield, landing_loc, landing_ui_component_iconbutton, landing_ui_component_internal, main_popup, landing_pageobject, landing_ui_field_textfield) {
	'use strict';

	class RuleType {
		static TYPE_0 = 0;
		static TYPE_1 = 1;
		static TYPE_2 = 2;
	}

	const defaultOptions = {
		removable: true,
		draggable: false,
		// eslint-disable-next-line no-use-before-define
		color: 'blue'
	};
	class FieldElement extends main_core_events.EventEmitter {
		static Colors = {
			blue: 'blue',
			green: 'green',
			red: 'red'
		};
		constructor(options) {
			super();
			this.setEventNamespace('BX.Landing.UI.Field.RuleField.FieldElement');
			this.subscribeFromOptions(landing_ui_component_internal.fetchEventsFromOptions(options));
			this.options = {
				...defaultOptions,
				...options
			};
			this.cache = new main_core.Cache.MemoryCache();
		}
		getDragButtonLayout() {
			return this.cache.remember('dragButton', () => {
				const button = new landing_ui_component_iconbutton.IconButton({
					type: landing_ui_component_iconbutton.IconButton.Types.drag,
					style: {
						width: '20px'
					}
				});
				return button.getLayout();
			});
		}
		getActionsDropdown() {
			return this.cache.remember('actionsDropdown', () => {
				const field = new window.top.BX.Landing.UI.Field.DropdownInline({
					title: this.options.actionsLabel,
					items: this.options.actionsList,
					content: this.options.actionsValue
				});
				field.subscribe('onChange', () => {
					this.emit('onChange');
				});
				return field;
			});
		}
		getActionsLayout() {
			return this.cache.remember('actionsLayout', () => {
				return main_core.Tag.render`
				<div class="landing-ui-field-element-text-action">
					${this.getActionsDropdown().getLayout()}
				</div>
			`;
			});
		}
		getTitleLayout() {
			return this.cache.remember('titleLayout', () => {
				return main_core.Tag.render`<div class="landing-ui-field-element-text-title">${main_core.Text.encode(this.options.title)}</div>`;
			});
		}
		getRemoveButtonLayout() {
			return this.cache.remember('removeButton', () => {
				const button = new landing_ui_component_iconbutton.IconButton({
					type: landing_ui_component_iconbutton.IconButton.Types.remove,
					onClick: () => this.emit('onRemove'),
					iconSize: '9px',
					style: {
						width: '20px',
						marginLeft: 'auto'
					}
				});
				return button.getLayout();
			});
		}
		getLayout() {
			return this.cache.remember('layout', () => {
				return main_core.Tag.render`
				<div
					class="landing-ui-field-element-${this.options.color}"
					data-field-id="${main_core.Text.encode(this.options.id)}"
				>
					${this.options.draggable ? this.getDragButtonLayout() : ''}
					<div class="landing-ui-field-element-text">
						${this.options.actionsLabel ? this.getActionsLayout() : ''}
						${this.getTitleLayout()}
					</div>
					${this.options.removable ? this.getRemoveButtonLayout() : ''}
				</div>
			`;
			});
		}
	}

	class FieldValueElement extends main_core_events.EventEmitter {
		cache = new main_core.Cache.MemoryCache();
		constructor(options) {
			super(options);
			this.setEventNamespace('BX.Landing.UI.Panel.FormSettingsPanel.ValueElement');
			this.options = {
				...options
			};
			this.state = {
				...this.options.data
			};
		}
		getOperatorLabelLayout() {
			return this.cache.remember('operatorLabelLayout', () => {
				const text = this.getOperatorLabelText(this.options.data.operation);
				return main_core.Tag.render`
				<div
					class="landing-ui-rule-value-operator-label"
					onclick="${this.onOperatorLabelClick.bind(this)}"
				>${text}</div>
			`;
			});
		}
		onOperatorLabelClick(event) {
			event.preventDefault();
			this.getOperatorSettingsPopup().show();
		}
		getTargetContainer() {
			return this.cache.remember('targetContainer', () => {
				return this.getLayout().closest('.landing-ui-panel-content-body-content') || this.getLayout();
			});
		}
		getOperatorSettingsPopup() {
			return this.cache.remember('operatorSettingsPopup', () => {
				const rootWindow = landing_pageobject.PageObject.getRootWindow();
				return new rootWindow.BX.Main.Popup({
					bindElement: this.getLayout(),
					targetContainer: this.getTargetContainer(),
					content: this.getOperatorField().getLayout(),
					autoHide: true,
					minWidth: 160,
					offsetLeft: 20,
					offsetTop: 3,
					bindOptions: {
						position: 'bottom'
					}
				});
			});
		}
		getValueLabelLayout() {
			return this.cache.remember('valueLabelLayout', () => {
				const text = this.getValueLabelText(this.options.data.value);
				const layout = main_core.Tag.render`
				<div
					class="landing-ui-rule-value-value-label"
					onclick="${this.onValueLabelClick.bind(this)}"
				>
					<span class="landing-ui-rule-value-value-label-inner">${main_core.Text.encode(text)}</span>
				</div>
			`;
				if (this.options.data.operation === 'any' || this.options.data.operation === 'empty') {
					main_core.Dom.hide(layout);
				}
				return layout;
			});
		}
		setValueLabelText(text) {
			this.getValueLabelLayout().firstElementChild.textContent = text;
		}
		onValueLabelClick(event) {
			event.preventDefault();
			this.getValueSettingsPopup().show();
		}
		getValueSettingsPopup() {
			return this.cache.remember('valueSettingsPopup', () => {
				const rootWindow = landing_pageobject.PageObject.getRootWindow();
				const popupContent = main_core.Tag.render`<div class="value-settings-popup"></div>`;
				const random = main_core.Text.getRandom();
				const targetField = this.getTargetField();
				if (targetField.type === 'list' || targetField.type === 'product' || targetField.type === 'checkbox' || targetField.type === 'radio' || targetField.type === 'bool') {
					const valueItems = (() => {
						if (targetField.type === 'bool') {
							return [{
								label: landing_loc.Loc.getMessage('LANDING_RULE_FIELD_CONDITION_VALUE_YES'),
								value: 'Y'
							}, {
								label: landing_loc.Loc.getMessage('LANDING_RULE_FIELD_CONDITION_VALUE_NO'),
								value: 'N'
							}];
						}
						return targetField.items;
					})();
					valueItems.forEach(item => {
						const checked = String(targetField.value) === String(item.value);
						main_core.Dom.append(main_core.Dom.append(this.renderValueRadioButton({
							...item,
							id: random,
							checked
						}), popupContent), popupContent);
					});
				} else {
					const value = (() => {
						if (main_core.Type.isStringFilled(this.options.data.value)) {
							return this.getValueLabelText(this.options.data.value);
						}
						return '';
					})();
					const inputField = new landing_ui_field_textfield.TextField({
						textOnly: true,
						onValueChange: () => {
							const conditionValue = inputField.getValue() || landing_loc.Loc.getMessage('LANDING_RULE_CONDITION_VALUE_EMPTY_MSGVER_1');
							this.setValueLabelText(conditionValue);
							this.state.value = inputField.getValue();
							this.emit('onChange');
						},
						content: value
					});
					main_core.Dom.append(inputField.getLayout(), popupContent);
				}
				return new rootWindow.BX.Main.Popup({
					bindElement: this.getLayout(),
					targetContainer: this.getTargetContainer(),
					content: popupContent,
					width: 228,
					autoHide: true,
					maxHeight: 200,
					offsetLeft: 20,
					offsetTop: 3,
					events: {
						onShow: () => {
							main_core.Dom.addClass(this.getLayout(), 'landing-ui-rule-value-active');
						},
						onClose: () => {
							main_core.Dom.removeClass(this.getLayout(), 'landing-ui-rule-value-active');
						}
					}
				});
			});
		}
		renderValueRadioButton({
			label,
			value,
			id,
			checked
		}) {
			const onChange = () => {
				this.setValueLabelText(label);
				this.state.value = value;
				this.emit('onChange');
			};
			return main_core.Tag.render`
			<div class="value-settings-item value-settings-item-value">
				<input
					type="radio"
					id="value_${id}_${value}"
					name="value_${id}_${this.options.data.target}"
					onchange="${onChange}"
					${checked ? 'checked' : ''}
				>
				<label for="value_${id}_${value}">${main_core.Text.encode(label)}</label>
			</div>
		`;
		}
		getOperatorField() {
			return this.cache.remember('operatorField', () => {
				const {
					condition
				} = this.options.dictionary.deps;
				const targetField = this.getTargetField();
				return new BX.Landing.UI.Field.Radio({
					selector: 'operation',
					value: [this.state.operation],
					items: condition.operations.filter(item => {
						return (!main_core.Type.isArrayFilled(item.fieldTypes) || item.fieldTypes.includes(targetField.type)) && (!main_core.Type.isArrayFilled(item.excludeFieldTypes) || main_core.Type.isArrayFilled(item.excludeFieldTypes) && !item.excludeFieldTypes.includes(targetField.type));
					}).map(item => {
						return {
							name: item.name,
							value: item.id
						};
					}),
					onChange: this.onOperationChange.bind(this)
				});
			});
		}
		setOperationLabelText(text) {
			this.getOperatorLabelLayout().textContent = text;
		}
		onOperationChange() {
			const operatorField = this.getOperatorField();
			const [value] = operatorField.getValue();
			if (value === 'empty' || value === 'any') {
				main_core.Dom.hide(this.getValueLabelLayout());
			} else {
				main_core.Dom.show(this.getValueLabelLayout());
			}
			this.setOperationLabelText(this.getOperatorLabelText(value));
			this.state.operation = value;
			this.emit('onChange');
		}
		getRemoveButton() {
			return this.cache.remember('removeButton', () => {
				return new landing_ui_component_iconbutton.IconButton({
					type: landing_ui_component_iconbutton.IconButton.Types.remove,
					iconSize: '9px',
					style: {
						width: '19px',
						marginLeft: 'auto'
					},
					onClick: () => {
						this.emit('onRemove');
						this.emit('onChange');
					}
				});
			});
		}
		getLayout() {
			return this.cache.remember('layout', () => {
				return main_core.Tag.render`
				<div
					class="landing-ui-rule-value"
					data-target="${main_core.Text.encode(this.options.data.target)}"
				>
					<div class="landing-ui-rule-value-text">
						${this.getOperatorLabelLayout()}
						${this.getValueLabelLayout()}
					</div>
					<div class="landing-ui-rule-value-actions">
						${this.options.removable ? this.getRemoveButton().getLayout() : ''}
					</div>
					<div class="landing-ui-rule-decoration">
						<div class="landing-ui-rule-decoration-v-line"></div>
						<div class="landing-ui-rule-decoration-h-line"></div>
						<div class="landing-ui-rule-decoration-arrow"></div>
					</div>
				</div>
			`;
			});
		}
		getOperatorLabelText(operatorValue) {
			return this.options.dictionary.deps.condition.operations.reduce((acc, item) => {
				if (item.id === operatorValue) {
					return item.name;
				}
				return acc;
			}, this.options.dictionary.deps.condition.operations[0].name);
		}
		getTargetField() {
			return this.cache.remember('targetField', () => {
				return this.options.fields.find(field => {
					return String(field.id) === String(this.options.data.target);
				});
			});
		}
		getValueLabelText(value) {
			const targetField = this.getTargetField();
			if (main_core.Type.isPlainObject(targetField)) {
				if (main_core.Type.isArrayFilled(targetField.items)) {
					const item = targetField.items.find(currentItem => {
						return String(currentItem.value) === String(value);
					});
					if (main_core.Type.isPlainObject(item)) {
						return item.label;
					}
				}
				if (main_core.Type.isStringFilled(value)) {
					if (value === 'Y') {
						return landing_loc.Loc.getMessage('LANDING_RULE_CONDITION_VALUE_YES');
					}
					if (value === 'N') {
						return landing_loc.Loc.getMessage('LANDING_RULE_CONDITION_VALUE_NO');
					}
					return value;
				}
			}
			return landing_loc.Loc.getMessage('LANDING_RULE_CONDITION_VALUE_EMPTY_MSGVER_1');
		}
		getValue() {
			return {
				...this.state
			};
		}
	}

	class TypeSeparator {
		cache = new main_core.Cache.MemoryCache();
		constructor(options) {
			this.options = {
				...options
			};
		}
		getLayout() {
			return this.cache.remember('layout', () => {
				return main_core.Tag.render`
				<div class="landing-ui-rule-entry-type-separator">
					<div class="landing-ui-rule-entry-type-separator-inner">
						${this.getSeparatorLabel()}
					</div>
				</div>
			`;
			});
		}
		getSeparatorLabel() {
			if (String(this.options.typeId) === String(2)) {
				return landing_loc.Loc.getMessage('LANDING_RULE_TYPE_SEPARATOR_TYPE_2');
			}
			return landing_loc.Loc.getMessage('LANDING_RULE_TYPE_SEPARATOR_TYPE_1');
		}
	}

	class RuleEntry extends main_core_events.EventEmitter {
		conditions = [];
		expressions = [];
		constructor(options) {
			super(options);
			this.setEventNamespace('BX.Landing.UI.Panel.FormSettingsPanel.RuleEntry');
			this.options = {
				enableHeader: true,
				expressions: [],
				...options
			};
			this.cache = new main_core.Cache.MemoryCache();
			this.onConditionFieldValueRemove = this.onConditionFieldValueRemove.bind(this);
			this.onConditionFieldRemove = this.onConditionFieldRemove.bind(this);
			if (main_core.Type.isArrayFilled(this.options.conditions)) {
				this.options.conditions.forEach(item => {
					this.addCondition(item);
				});
				this.options.expressions.forEach(item => {
					this.addExpression(item);
				});
			}
		}
		getConditionsLayout() {
			return this.cache.remember('conditionsLayout', () => {
				return main_core.Tag.render`
				<div class="landing-ui-rule-entry-conditions"></div>
			`;
			});
		}
		getExpressionsLayout() {
			return this.cache.remember('expressionsLayout', () => {
				return main_core.Tag.render`
				<div class="landing-ui-rule-entry-expressions">
					${this.getAddExpressionFieldLinkLayout()}
				</div>
			`;
			});
		}
		getHeaderLayout() {
			return this.cache.remember('headerLayout', () => {
				return main_core.Tag.render`
				<div class="landing-ui-rule-entry-header">${landing_loc.Loc.getMessage('LANDING_RULE_ENTRY_HEADER')}</div>
			`;
			});
		}
		getLayout() {
			return this.cache.remember('layout', () => {
				return main_core.Tag.render`
				<div class="landing-ui-rule-entry">
					${this.options.enableHeader ? this.getHeaderLayout() : ''}
					<div class="landing-ui-rule-entry-body">
						${this.getConditionsLayout()}
						${this.getExpressionsLayout()}
					</div>
				</div>
			`;
			});
		}
		onConditionFieldRemove(event) {
			const target = event.getTarget();
			const targetLayout = target.getLayout();
			this.conditions = this.conditions.filter(item => {
				return item !== target;
			});
			let nextNode = targetLayout.nextElementSibling;
			while (main_core.Type.isDomNode(nextNode) && !nextNode.matches('[class*="landing-ui-field-element"]')) {
				this.conditions = this.conditions.filter(item => {
					return item.getLayout() !== nextNode;
				});
				main_core.Dom.remove(nextNode);
				nextNode = targetLayout.nextElementSibling;
			}
			if (!main_core.Type.isDomNode(nextNode)) {
				const prevNode = targetLayout.previousElementSibling;
				if (main_core.Type.isDomNode(prevNode) && main_core.Dom.hasClass(prevNode, 'landing-ui-rule-entry-type-separator')) {
					main_core.Dom.remove(prevNode);
				}
			}
			main_core.Dom.remove(targetLayout);
			this.emit('onChange');
		}
		onConditionFieldValueRemove(event) {
			const target = event.getTarget();
			const targetLayout = target.getLayout();
			this.conditions = this.conditions.filter(item => {
				return item !== target;
			});
			if (main_core.Dom.hasClass(targetLayout.nextElementSibling, 'landing-ui-rule-entry-type-separator')) {
				main_core.Dom.remove(targetLayout.nextElementSibling);
			} else if (main_core.Dom.hasClass(targetLayout.previousElementSibling, 'landing-ui-rule-entry-type-separator')) {
				main_core.Dom.remove(targetLayout.previousElementSibling);
			}
			main_core.Dom.remove(targetLayout);
		}
		addCondition(element) {
			if (!this.conditions.includes(element)) {
				this.conditions.push(element);
				if (element instanceof FieldValueElement) {
					element.subscribe('onRemove', this.onConditionFieldValueRemove);
					element.subscribe('onChange', () => this.emit('onChange'));
					const conditionsNodes = [...this.getConditionsLayout().childNodes];
					const lastElement = conditionsNodes.reduce((acc, node) => {
						if (main_core.Dom.hasClass(node, 'landing-ui-rule-value') && String(main_core.Dom.attr(node, 'data-target')) === String(element.options.data.target) || node.matches('[class*="landing-ui-field-element"]') && String(main_core.Dom.attr(node, 'data-field-id')) === String(element.options.data.target)) {
							return node;
						}
						return acc;
					}, null);
					if (main_core.Type.isDomNode(lastElement)) {
						main_core.Dom.insertAfter(element.getLayout(), lastElement);
						if (main_core.Dom.hasClass(lastElement, 'landing-ui-rule-value')) {
							const separator = new TypeSeparator({
								typeId: this.options.typeId
							});
							main_core.Dom.insertBefore(separator.getLayout(), element.getLayout());
						}
						return;
					}
				}
				if (element instanceof FieldElement) {
					element.subscribe('onRemove', this.onConditionFieldRemove);
					element.subscribe('onChange', () => this.emit('onChange'));
					if ([...this.getConditionsLayout().childNodes].length > 0) {
						const separator = new TypeSeparator({
							typeId: this.options.typeId
						});
						main_core.Dom.append(separator.getLayout(), this.getConditionsLayout());
					}
				}
				main_core.Dom.append(element.getLayout(), this.getConditionsLayout());
				this.emit('onChange');
			}
		}
		getExpressionActionPanel() {
			return this.cache.remember('expressionActionPanel', () => {
				return new landing_ui_component_actionpanel.ActionPanel({
					left: [{
						id: 'addField',
						text: landing_loc.Loc.getMessage('LANDING_RULE_ENTRY_ADD_FIELD_LABEL'),
						onClick: this.onAddExpressionFieldClick.bind(this)
					}]
				});
			});
		}
		onAddExpressionFieldClick(event) {
			event.preventDefault();
			const menu = this.getFieldsListMenu();
			menu.getMenuItems().forEach(item => {
				const isUsed = this.expressions.some(expressionItem => {
					return String(expressionItem.options.id) === String(item.getId());
				});
				if (isUsed) {
					main_core.Dom.addClass(item.getLayout().item, 'landing-ui-disabled');
				} else {
					main_core.Dom.removeClass(item.getLayout().item, 'landing-ui-disabled');
				}
			});
			this.getFieldsListMenu().show();
		}
		getExpressionAllowedFieldsList() {
			const disallowedTypes = ['page', 'layout'];
			return this.options.fields.filter(field => {
				if (!disallowedTypes.includes(field.type)) {
					return !this.conditions.find(condition => {
						return main_core.Type.isPlainObject(condition.options) && (main_core.Type.isPlainObject(condition.options.data) && String(condition.options.data.target) === String(field.id) || String(condition.options.id) === String(field.id));
					});
				}
				return true;
			});
		}
		getFieldsListMenu() {
			return this.cache.remember('fieldsListMenu', () => {
				return new window.top.BX.Main.Menu({
					bindElement: this.getExpressionActionPanel().getLayout(),
					maxHeight: 205,
					items: this.getExpressionAllowedFieldsList().map(item => {
						return {
							id: item.id,
							text: item.label,
							onclick: this.onAddExpressionField.bind(this, item)
						};
					})
				});
			});
		}
		getAddExpressionFieldLinkLayout() {
			return this.cache.remember('addExpressionFieldLinkLayout', () => {
				return main_core.Tag.render`
				<div class="landing-ui-rule-entry-add-expression-field-link">
					<div class="landing-ui-rule-entry-add-expression-field-link-action-panel">
						${this.getExpressionActionPanel().getLayout()}
					</div>
					<div class="landing-ui-rule-entry-add-expression-field-link-separator"></div>
				</div>
			`;
			});
		}
		onAddExpressionField(field) {
			const element = new FieldElement({
				id: field.id,
				title: field.label,
				removable: true,
				color: FieldElement.Colors.green,
				actionsLabel: landing_loc.Loc.getMessage('LANDING_RULE_EXPRESSION_FIELD_ACTION_LABEL'),
				actionsList: [{
					name: landing_loc.Loc.getMessage('LANDING_RULE_EXPRESSION_FIELD_ACTION_SHOW_LABEL'),
					value: 'show'
				}, {
					name: landing_loc.Loc.getMessage('LANDING_RULE_EXPRESSION_FIELD_ACTION_HIDE_LABEL'),
					value: 'hide'
				}],
				actionsValue: 'show'
			});
			this.addExpression(element);
			this.getFieldsListMenu().close();
			this.emit('onChange');
		}
		onExpressionFieldRemove(event) {
			const target = event.getTarget();
			main_core.Dom.remove(target.getLayout());
			this.expressions = this.expressions.filter(field => {
				return String(field.options.id) !== String(target.options.id);
			});
			this.adjustExpressionFieldsZIndexes();
			this.emit('onChange');
		}
		onExpressionFieldChange() {
			this.emit('onChange');
		}
		adjustExpressionFieldsZIndexes() {
			[...this.getExpressionsLayout().children].reverse().forEach((node, index) => {
				if (node.matches('[class*="landing-ui-field-element"]')) {
					main_core.Dom.style(node, 'z-index', index + 2);
				}
			});
		}
		addExpression(element) {
			if (!this.expressions.includes(element)) {
				this.expressions.push(element);
				element.subscribe('onRemove', this.onExpressionFieldRemove.bind(this));
				element.subscribe('onChange', this.onExpressionFieldChange.bind(this));

				// @todo: refactoring
				void this.getLayout();
				main_core.Dom.insertBefore(element.getLayout(), this.getAddExpressionFieldLinkLayout());
				this.adjustExpressionFieldsZIndexes();
			}
		}
		getValue() {
			return this.conditions.filter(item => item instanceof FieldValueElement).reduce((acc, conditionsItem) => {
				return [...acc, ...this.expressions.map(expressionItem => {
					return {
						condition: {
							...conditionsItem.getValue(),
							event: 'change'
						},
						action: {
							target: expressionItem.options.id,
							type: expressionItem.getActionsDropdown().getValue()
						}
					};
				})];
			}, []);
		}
	}

	class FieldActionPanel extends main_core_events.EventEmitter {
		cache = new main_core.Cache.MemoryCache();
		constructor(options) {
			super(options);
			this.setEventNamespace('BX.Landing.UI.FormSettingsPanel.FieldRules.FieldActionPanel');
			this.subscribeFromOptions(landing_ui_component_internal.fetchEventsFromOptions(options));
			if (main_core.Type.isPlainObject(options.style)) {
				main_core.Dom.style(this.getLayout(), options.style);
			}
		}
		getLayout() {
			return this.cache.remember('layout', () => {
				return main_core.Tag.render`
				<div class="landing-ui-rule-field-action-panel">
					${this.getActionPanel().getLayout()}
					<div class="landing-ui-rule-field-action-panel-decoration">
						<div class="landing-ui-rule-field-action-panel-decoration-v-line"></div>
						<div class="landing-ui-rule-field-action-panel-decoration-h-line"></div>
					</div>
				</div>
			`;
			});
		}
		getActionPanel() {
			return this.cache.remember('actionPanel', () => {
				return new landing_ui_component_actionpanel.ActionPanel({
					left: [{
						id: 'addCondition',
						text: landing_loc.Loc.getMessage('LANDING_RULE_GROUP_ADD_FIELD_CONDITION'),
						onClick: () => {
							this.emit('onAddCondition');
						}
					}]
				});
			});
		}
	}

	class RuleGroup extends landing_ui_field_basefield.BaseField {
		constructor(options) {
			super(options);
			this.setEventNamespace('BX.Landing.UI.Panel.FormSettingsPanel.Content.FieldRules.RuleGroup');
			this.subscribeFromOptions(landing_ui_component_internal.fetchEventsFromOptions(options));
			this.setLayoutClass('landing-ui-rule-group');
			const layout = this.getLayout();
			main_core.Dom.clean(layout);
			main_core.Dom.append(this.getHeaderLayout(), layout);
			main_core.Dom.append(this.getBodyLayout(), layout);
			main_core.Dom.append(this.getFooterLayout(), layout);
			if (main_core.Type.isArrayFilled(this.options.data.list)) {
				const filteredDataList = this.options.data.list.filter(item => {
					const conditionTarget = this.getField(item.condition.target);
					const actionTarget = this.getField(item.action.target);
					return conditionTarget && actionTarget;
				});
				if (this.getTypeId() === RuleType.TYPE_0) {
					const groupedList = filteredDataList.reduce((acc, item) => {
						const {
							target,
							operation,
							value
						} = item.condition;
						if (!main_core.Type.isArray(acc[`${target}${operation}${value}`])) {
							acc[`${target}${operation}${value}`] = [];
						}
						acc[`${target}${operation}${value}`].push(item);
						return acc;
					}, {});
					Object.values(groupedList).forEach((group, index) => {
						const [firstItem] = group;
						if (main_core.Type.isPlainObject(firstItem)) {
							const targetField = this.getField(firstItem.condition.target);
							const entry = new RuleEntry({
								enableHeader: index === 0,
								typeId: this.getTypeId(),
								fields: this.options.fields,
								onChange: () => this.emit('onChange'),
								conditions: [new FieldElement({
									dictionary: this.options.dictionary,
									fields: this.options.fields,
									id: targetField.id,
									title: targetField.label,
									color: FieldElement.Colors.blue,
									onRemove: () => {
										this.onConditionFieldRemove(entry);
									}
								}), new FieldValueElement({
									dictionary: this.options.dictionary,
									fields: this.options.fields,
									removable: false,
									data: group[0].condition
								})],
								expressions: group.map(groupItem => {
									const targetField = this.getField(groupItem.action.target);
									return new FieldElement({
										id: targetField.id,
										title: targetField.label,
										removable: true,
										color: FieldElement.Colors.green,
										actionsLabel: landing_loc.Loc.getMessage('LANDING_RULE_EXPRESSION_FIELD_ACTION_LABEL'),
										actionsList: [{
											name: landing_loc.Loc.getMessage('LANDING_RULE_EXPRESSION_FIELD_ACTION_SHOW_LABEL'),
											value: 'show'
										}, {
											name: landing_loc.Loc.getMessage('LANDING_RULE_EXPRESSION_FIELD_ACTION_HIDE_LABEL'),
											value: 'hide'
										}],
										actionsValue: groupItem.action.type
									});
								})
							});
							this.addEntry(entry);
						}
					});
				}
				if (this.getTypeId() === RuleType.TYPE_1 || this.getTypeId() === RuleType.TYPE_2) {
					const entry = new RuleEntry({
						enableHeader: true,
						typeId: this.getTypeId(),
						fields: this.options.fields,
						onChange: () => this.emit('onChange')
					});
					const groupedList = filteredDataList.reduce((acc, item) => {
						const {
							target
						} = item.condition;
						if (!main_core.Type.isArray(acc[target])) {
							acc[target] = [];
						}
						acc[target].push(item);
						return acc;
					}, {});
					Object.values(groupedList).forEach(group => {
						const [firstItem] = group;
						if (main_core.Type.isPlainObject(firstItem)) {
							const targetField = this.getField(firstItem.condition.target);
							const allowedMultipleConditions = this.getTypeId() === RuleType.TYPE_2 && targetField.multiple || this.getTypeId() === RuleType.TYPE_1;
							entry.addCondition(new FieldElement({
								dictionary: this.options.dictionary,
								fields: this.options.fields,
								id: targetField.id,
								title: targetField.label,
								color: FieldElement.Colors.blue,
								onRemove: () => {
									this.onConditionFieldRemove(entry);
								}
							}));
							const groupedConditions = group.reduce((acc, item) => {
								acc[`${item.condition.operation}${item.condition.value}`] = item;
								return acc;
							}, {});
							Object.values(groupedConditions).forEach(item => {
								entry.addCondition(new FieldValueElement({
									dictionary: this.options.dictionary,
									fields: this.options.fields,
									removable: allowedMultipleConditions,
									data: item.condition
								}));
							});
							entry.addCondition(new FieldActionPanel({
								style: {
									display: allowedMultipleConditions ? null : 'none'
								},
								onAddCondition: () => {
									this.onAddFieldCondition(new main_core_events.BaseEvent({
										data: {
											entry,
											target: targetField.id
										}
									}));
								}
							}));
						}
					});
					const groupedExpressions = Object.values(filteredDataList).reduce((acc, item) => {
						const {
							target,
							type
						} = item.action;
						acc[`${target}${type}`] = item;
						return acc;
					}, {});
					Object.values(groupedExpressions).forEach(item => {
						const targetField = this.getField(item.action.target);
						const element = new FieldElement({
							id: targetField.id,
							title: targetField.label,
							removable: true,
							color: FieldElement.Colors.green,
							actionsLabel: landing_loc.Loc.getMessage('LANDING_RULE_EXPRESSION_FIELD_ACTION_LABEL'),
							actionsList: [{
								name: landing_loc.Loc.getMessage('LANDING_RULE_EXPRESSION_FIELD_ACTION_SHOW_LABEL'),
								value: 'show'
							}, {
								name: landing_loc.Loc.getMessage('LANDING_RULE_EXPRESSION_FIELD_ACTION_HIDE_LABEL'),
								value: 'hide'
							}],
							actionsValue: item.action.type
						});
						entry.addExpression(element);
					});
					this.addEntry(entry);
				}
			}
		}
		getEntries() {
			return this.cache.remember('entries', () => []);
		}
		setEntries(entries) {
			this.cache.set('entries', entries);
		}
		addEntry(entry) {
			if (entry) {
				const entries = this.getEntries();
				if (!entries.includes(entry)) {
					entry.subscribe('onChange', () => this.emit('onChange'));
					entries.push(entry);
					main_core.Dom.append(entry.getLayout(), this.getBodyLayout());
					this.emit('onChange');
				}
			}
		}
		getHeaderLayout() {
			return this.cache.remember('headerLayout', () => {
				return main_core.Tag.render`
				<div class="landing-ui-rule-group-header">
					${this.getHeaderTitleLayout()}
					${this.getRemoveButtonLayout()}
				</div>
			`;
			});
		}
		getHeaderTitleLayout() {
			return this.cache.remember('headerTitleLayout', () => {
				const titleOfRuleType = landing_loc.Loc.getMessage(`LANDING_FIELDS_RULES_TYPE_${this.getTypeId() + 1}`);
				return main_core.Tag.render`
				<div class="landing-ui-rule-group-header-title">${titleOfRuleType}</div>
			`;
			});
		}
		getRemoveButtonLayout() {
			return this.cache.remember('removeButtonLayout', () => {
				const button = new landing_ui_component_iconbutton.IconButton({
					type: landing_ui_component_iconbutton.IconButton.Types.remove,
					onClick: this.onRemoveClick.bind(this),
					title: landing_loc.Loc.getMessage('LANDING_RULE_GROUP_REMOVE_BUTTON_TITLE'),
					style: {
						marginLeft: 'auto'
					}
				});
				return button.getLayout();
			});
		}
		onRemoveClick() {
			main_core.Dom.remove(this.getLayout());
			this.emit('onRemove');
			this.emit('onChange');
		}
		getBodyLayout() {
			return this.cache.remember('bodyLayout', () => {
				return main_core.Tag.render`
				<div class="landing-ui-rule-group-body"></div>
			`;
			});
		}
		getFooterLayout() {
			return this.cache.remember('footerLayout', () => {
				return main_core.Tag.render`
				<div class="landing-ui-rule-group-footer">
					${this.getFooterActionPanel().getLayout()}
				</div>
			`;
			});
		}
		getFooterActionPanel() {
			return this.cache.remember('footerActionPanel', () => {
				return new landing_ui_component_actionpanel.ActionPanel({
					left: [{
						id: 'selectField',
						text: landing_loc.Loc.getMessage('LANDING_RULE_ENTRY_ADD_FIELD_LABEL'),
						onClick: this.onAddFieldClick.bind(this)
					}]
				});
			});
		}
		onAddFieldClick(event) {
			const menu = this.getFieldsListMenu();
			menu.getPopupWindow().setBindElement(event.currentTarget);
			menu.show();
		}
		getFieldsListMenu() {
			return this.cache.remember('fieldsMenu', () => {
				return new window.top.BX.Main.Menu({
					maxHeight: 205,
					items: this.options.fields.map(field => {
						return {
							id: field.id,
							text: field.label,
							onclick: () => {
								this.onFieldsListMenuItemClick(field);
								this.getFieldsListMenu().close();
							}
						};
					}),
					autoHide: true
				});
			});
		}
		getDefaultValueState(fieldId) {
			const targetField = this.options.fields.find(field => {
				return String(field.id) === String(fieldId);
			});
			if (targetField) {
				const filteredOperations = this.options.dictionary.deps.condition.operations.filter(operation => {
					return (!main_core.Type.isArrayFilled(operation.fieldTypes) || operation.fieldTypes.includes(targetField.type)) && (!main_core.Type.isArrayFilled(operation.excludeFieldTypes) || main_core.Type.isArrayFilled(operation.excludeFieldTypes) && !operation.excludeFieldTypes.includes(targetField.type));
				});
				if (main_core.Type.isArrayFilled(filteredOperations)) {
					return filteredOperations[0].id;
				}
			}
			return '=';
		}
		onAddFieldCondition(event) {
			const {
				target,
				entry
			} = event.getData();
			entry.addCondition(new FieldValueElement({
				dictionary: this.options.dictionary,
				fields: this.options.fields,
				removable: true,
				data: {
					target,
					operation: this.getDefaultValueState(target),
					value: null
				}
			}));
		}
		onConditionFieldRemove(entry) {
			const fieldElements = entry.conditions.filter(item => {
				return item instanceof FieldElement;
			});
			if (fieldElements.length === 1) {
				const entries = this.getEntries().filter(item => {
					return entry !== item;
				});
				this.setEntries(entries);
				main_core.Dom.remove(entry.getLayout());
			}
		}
		onFieldsListMenuItemClick(field) {
			if (this.getTypeId() === RuleType.TYPE_0) {
				const enableHeader = this.getEntries().length === 0;
				const entry = new RuleEntry({
					enableHeader,
					typeId: this.getTypeId(),
					fields: this.options.fields,
					conditions: [new FieldElement({
						dictionary: this.options.dictionary,
						fields: this.options.fields,
						id: field.id,
						title: field.label,
						color: FieldElement.Colors.blue,
						onRemove: () => {
							this.onConditionFieldRemove(entry);
						}
					}), new FieldValueElement({
						dictionary: this.options.dictionary,
						fields: this.options.fields,
						removable: false,
						data: {
							target: field.id,
							operation: this.getDefaultValueState(field.id),
							value: null
						}
					})],
					onChange: () => this.emit('onChange')
				});
				this.addEntry(entry);
			}
			if (this.getTypeId() === RuleType.TYPE_1 || this.getTypeId() === RuleType.TYPE_2) {
				const allowedMultipleConditions = this.getTypeId() === RuleType.TYPE_2 && field.multiple || this.getTypeId() === RuleType.TYPE_1;
				const items = [new FieldElement({
					dictionary: this.options.dictionary,
					fields: this.options.fields,
					id: field.id,
					title: field.label,
					color: FieldElement.Colors.blue,
					onRemove: () => {
						this.onConditionFieldRemove(this.getEntries()[0]);
					}
				}), new FieldValueElement({
					dictionary: this.options.dictionary,
					fields: this.options.fields,
					removable: allowedMultipleConditions,
					data: {
						target: field.id,
						operation: this.getDefaultValueState(field.id),
						value: null
					}
				})];
				if (this.getTypeId() === RuleType.TYPE_1 || this.getTypeId() === RuleType.TYPE_2) {
					items.push(new FieldActionPanel({
						style: {
							display: allowedMultipleConditions ? null : 'none'
						},
						onAddCondition: () => {
							this.onAddFieldCondition(new main_core_events.BaseEvent({
								data: {
									entry: this.getEntries()[0],
									target: field.id
								}
							}));
						}
					}));
				}
				const [entry] = this.getEntries();
				if (entry) {
					items.forEach(item => {
						entry.addCondition(item);
					});
				} else {
					const newEntry = new RuleEntry({
						enableHeader: true,
						typeId: this.getTypeId(),
						fields: this.options.fields,
						conditions: items,
						onChange: () => this.emit('onChange')
					});
					this.addEntry(newEntry);
				}
			}
		}
		getId() {
			if (!main_core.Type.isNil(this.options.data.id)) {
				return this.options.data.id;
			}
			return 0;
		}
		getTypeId() {
			return main_core.Text.toNumber(this.options.data.typeId);
		}
		getLogic() {
			return this.getTypeId() === RuleType.TYPE_2 ? 'and' : 'or';
		}
		getValue() {
			const list = this.getEntries().reduce((acc, entry) => {
				return [...acc, ...entry.getValue()];
			}, []);
			return {
				id: this.getId(),
				typeId: this.getTypeId(),
				logic: this.getLogic(),
				list
			};
		}
		getField(fieldId) {
			return this.options.fields.find(item => {
				return String(item.id) === String(fieldId);
			});
		}
	}

	class FieldsRules extends landing_ui_panel_basepresetpanel.ContentWrapper {
		constructor(options) {
			super(options);
			this.setEventNamespace('BX.Landing.UI.Panel.FormSettingsPanel.FieldsRulesContent');
			this.addItem(this.getHeader());
			if (!main_core.Type.isArrayFilled(this.options.formOptions.data.dependencies)) {
				this.addItem(this.getRuleTypeField());
			} else {
				this.addItem(this.getRulesForm());
				this.addItem(this.getActionPanel());
			}
		}
		getHeader() {
			return this.cache.remember('headerCard', () => {
				return new landing_ui_card_headercard.HeaderCard({
					title: main_core.Loc.getMessage('LANDING_FIELDS_RULES_TITLE')
				});
			});
		}
		getRulesForm() {
			return this.cache.remember('rulesForm', () => {
				return new landing_ui_form_formsettingsform.FormSettingsForm({
					selector: 'dependencies',
					description: null,
					fields: this.options.formOptions.data.dependencies.map(groupData => {
						return new RuleGroup({
							dictionary: this.options.dictionary,
							fields: this.getFormFields(),
							data: groupData,
							onRemove: this.onRuleGroupRemove.bind(this)
						});
					})
				});
			});
		}
		getActionPanel() {
			return this.cache.remember('actionPanel', () => {
				return new landing_ui_component_actionpanel.ActionPanel({
					left: [{
						text: main_core.Loc.getMessage('LANDING_FIELDS_ADD_NEW_RULE_LINK_LABEL'),
						onClick: this.onAddRuleClick.bind(this)
					}]
				});
			});
		}
		onAddRuleClick() {
			this.insertBefore(this.getRuleTypeField(), this.getActionPanel());
			this.items.remove(this.getActionPanel());
			main_core.Dom.remove(this.getActionPanel().getLayout());
			this.getActionPanel().unsubscribe('onChange', this.onChange);
		}
		getRuleTypeField() {
			return this.cache.remember('ruleTypeField', () => {
				return new landing_ui_field_radiobuttonfield.RadioButtonField({
					selector: 'rules-type',
					items: Object.entries(RuleType).map(([, value]) => {
						return {
							id: `ruleType${value}`,
							icon: `landing-ui-rules-type${value + 1}-icon`,
							title: main_core.Loc.getMessage(`LANDING_FIELDS_RULES_TYPE_${value + 1}`),
							button: {
								text: main_core.Loc.getMessage('LANDING_FIELDS_RULES_TYPE_BUTTON'),
								onClick: this.onCreateRuleButtonClick.bind(this, {
									type: value
								})
							}
						};
					})
				});
			});
		}
		getFormFields() {
			const disallowedTypes = (() => {
				if (!main_core.Type.isPlainObject(this.options.dictionary.deps.field) || !main_core.Type.isArrayFilled(this.options.dictionary.deps.field.disallowed)) {
					return null;
				}
				return this.options.dictionary.deps.field.disallowed;
			})();
			return this.options.formOptions.data.fields.filter(field => {
				return !main_core.Type.isArrayFilled(disallowedTypes) || !disallowedTypes.includes(field.type) && (!main_core.Type.isPlainObject(field.content) || disallowedTypes.includes(field.content.type));
			});
		}
		onCreateRuleButtonClick({
			type
		}) {
			this.clear();
			const header = this.getHeader();
			header.setBottomMargin(false);
			this.addItem(header);
			const ruleForm = this.getRulesForm();
			ruleForm.addField(new RuleGroup({
				dictionary: this.options.dictionary,
				fields: this.getFormFields(),
				data: {
					id: 0,
					typeId: type,
					list: [],
					logic: type === RuleType.TYPE_2 ? 'and' : 'or'
				},
				onRemove: this.onRuleGroupRemove.bind(this)
			}));
			this.addItem(ruleForm);
			this.addItem(this.getActionPanel());
		}
		onRuleGroupRemove(event) {
			this.onChange(event);
			this.getRulesForm().removeField(event.getTarget());
			event.getTarget().unsubscribe('onChange', this.onChange);
		}
		onChange(event) {
			this.emit('onChange', {
				...event.getData(),
				skipPrepare: true
			});
		}
		valueReducer(value) {
			return {
				dependencies: Object.values(value).filter(group => {
					return main_core.Type.isArrayFilled(group.list);
				})
			};
		}
	}

	exports.Content = FieldsRules;
	exports.FieldsRules = FieldsRules;

})(this.BX.Landing.Ui.Panel.Formsettingspanel.Content.FieldsRules = this.BX.Landing.Ui.Panel.Formsettingspanel.Content.FieldsRules || {}, BX, BX.Landing.UI.Panel, BX.Landing.UI.Card, BX.Landing.UI.Component, BX.Landing.UI.Field, BX.Landing.UI.Form, BX.Event, window, BX, BX.Landing.UI.Field, BX.Landing, BX.Landing.UI.Component, BX.Landing.UI.Component, BX.Main, BX.Landing, BX.Landing.UI.Field);
//# sourceMappingURL=fields-rules.bundle.js.map
