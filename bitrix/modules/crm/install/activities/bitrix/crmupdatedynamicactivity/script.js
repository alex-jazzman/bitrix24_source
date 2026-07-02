/* eslint-disable */
(function (main_core, main_popup, bizproc_automation) {
	'use strict';

	const namespace = main_core.Reflection.namespace('BX.Crm.Activity');
	class CrmUpdateDynamicActivity {
		constructor(options) {
			if (main_core.Type.isPlainObject(options)) {
				this.documentType = options.documentType;
				this.isRobot = options.isRobot;
				const form = document.forms[options.formName];
				if (!main_core.Type.isNil(form)) {
					this.entityTypeIdSelect = form.dynamic_type_id;
					this.currentEntityTypeId = this.entityTypeIdSelect.value;
					this.entityTypeDependentElements = document.querySelectorAll('[data-role="bca-cuda-entity-type-id-dependent"]');
				}
				this.document = new bizproc_automation.Document({
					rawDocumentType: this.documentType,
					documentFields: options.documentFields,
					title: options.documentName
				});
				if (this.isRobot) {
					this.fieldsListSelect = document.querySelector('[data-role="bca-cuda-fields-list"]');
				} else {
					this.addConditionButton = document.querySelector('[data-role="bca_cuda_add_condition"]');
				}
				this.entitiesFieldsContainers = document.querySelector('[data-role="bca-cuda-fields-container"]');
				this.conditinIdPrefix = 'id_bca_cuda_field_';
				this.fieldsMap = new Map(Object.entries(options.fieldsMap));
				this.filterFieldsContainer = document.querySelector('[data-role="bca-cuda-filter-fields-container"]');
				this.filteringFieldsPrefix = options.filteringFieldsPrefix;
				this.filterFieldsMap = new Map(Object.entries(options.filterFieldsMap));

				// issue 0158608
				if (!main_core.Type.isNil(options.documentType) && !this.isRobot) {
					BX.Bizproc.Automation.API.documentType = options.documentType;
				}
				this.conditionGroup = new bizproc_automation.ConditionGroup(options.conditions);
				this.currentValues = new Map();
				Array.from(this.fieldsMap.keys()).forEach(entityTypeId => this.currentValues.set(entityTypeId, {}));
				if (!main_core.Type.isNil(this.currentEntityTypeId) && main_core.Type.isObject(options.currentValues)) {
					this.currentValues.set(this.currentEntityTypeId, options.currentValues);
				}
			}
		}
		init() {
			if (this.entityTypeIdSelect && this.fieldsMap && this.entitiesFieldsContainers) {
				main_core.Event.bind(this.entityTypeIdSelect, 'change', this.onEntityTypeIdChange.bind(this));
			}
			if (this.isRobot && this.fieldsListSelect) {
				main_core.Event.bind(this.fieldsListSelect, 'click', this.onFieldsListSelectClick.bind(this));
			} else if (!this.isRobot && this.addConditionButton) {
				main_core.Event.bind(this.addConditionButton, 'click', this.onAddConditionButtonClick.bind(this));
			}
			this.initAutomationContext();
			this.#initOnOpenFilterFieldsMenu();
		}
		initAutomationContext() {
			try {
				bizproc_automation.getGlobalContext();
			} catch {
				bizproc_automation.setGlobalContext(new bizproc_automation.Context({
					document: this.document
				}));
			}
		}
		#initOnOpenFilterFieldsMenu() {
			if (this.isRobot) {
				this.onOpenFilterFieldsMenu = event => {
					const dialog = bizproc_automation.Designer.getInstance().getRobotSettingsDialog();
					const template = dialog.template;
					const robot = dialog.robot;
					if (template && robot) {
						template.onOpenMenu(event, robot);
					}
				};
			} else {
				this.onOpenFilterFieldsMenu = event => this.addBPFields(event.getData().selector);
			}
		}
		addBPFields(selector) {
			const getSelectorProperties = ({
				properties,
				objectName,
				expressionPrefix
			}) => {
				if (main_core.Type.isObject(properties)) {
					return Object.entries(properties).map(([id, property]) => ({
						id,
						title: property.Name,
						customData: {
							field: {
								Id: id,
								Type: property.Type,
								Name: property.Name,
								ObjectName: objectName,
								SystemExpression: `{=${objectName}:${id}}`,
								Expression: expressionPrefix ? `{{${expressionPrefix}:${id}}}` : `{=${objectName}:${id}}`
							}
						}
					}));
				}
				return [];
			};
			const getGlobalSelectorProperties = ({
				properties,
				visibilityNames,
				objectName
			}) => {
				if (main_core.Type.isObject(properties)) {
					return Object.entries(properties).map(([id, property]) => {
						const field = {
							id,
							Type: property.Type,
							title: property.Name,
							ObjectName: objectName,
							SystemExpression: `{=${objectName}:${id}}`,
							Expression: `{=${objectName}:${id}}`
						};
						if (property.Visibility && visibilityNames[property.Visibility]) {
							field.Expression = `{{${visibilityNames[property.Visibility]}:${property.Name}}}`;
						}
						return {
							id,
							title: property.Name,
							supertitle: visibilityNames[property.Visibility],
							customData: {
								field
							}
						};
					});
				}
				return [];
			};
			selector.addGroup('workflowParameters', {
				id: 'workflowParameters',
				title: main_core.Loc.getMessage('BIZPROC_WFEDIT_MENU_PARAMS'),
				children: [{
					id: 'parameters',
					title: main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_PARAMETERS_LIST'),
					children: getSelectorProperties({
						properties: window.arWorkflowParameters || {},
						objectName: 'Template',
						expressionPrefix: '~*'
					})
				}, {
					id: 'variables',
					title: main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_GLOB_VARIABLES_LIST_1'),
					children: getSelectorProperties({
						properties: window.arWorkflowVariables || {},
						objectName: 'Variable'
					})
				}, {
					id: 'constants',
					title: main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_CONSTANTS_LIST'),
					children: getSelectorProperties({
						properties: window.arWorkflowConstants || {},
						objectName: 'Constant',
						expressionPrefix: '~&'
					})
				}]
			});
			if (window.arWorkflowGlobalVariables && window.wfGVarVisibilityNames) {
				selector.addGroup('globalVariables', {
					id: 'globalVariables',
					title: main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_GLOB_VARIABLES_LIST'),
					children: getGlobalSelectorProperties({
						properties: window.arWorkflowGlobalVariables || {},
						visibilityNames: window.wfGVarVisibilityNames || {},
						objectName: 'GlobalVar'
					})
				});
			}
			selector.addGroup('globalConstants', {
				id: 'globalConstants',
				title: main_core.Loc.getMessage('BIZPROC_AUTOMATION_CMP_GLOB_CONSTANTS_LIST'),
				children: getGlobalSelectorProperties({
					properties: window.arWorkflowGlobalConstants || {},
					visibilityNames: window.wfGConstVisibilityNames || {},
					objectName: 'GlobalConst'
				})
			});
		}
		onEntityTypeIdChange() {
			this.currentEntityTypeId = this.entityTypeIdSelect.value;
			main_core.Dom.clean(this.filterFieldsContainer);
			this.conditionGroup = new bizproc_automation.ConditionGroup();
			Array.from(this.entitiesFieldsContainers.children).forEach(elem => main_core.Dom.remove(elem));
			this.render();
		}
		render() {
			if (main_core.Type.isNil(this.currentEntityTypeId) || this.currentEntityTypeId === '') {
				this.entityTypeDependentElements.forEach(element => main_core.Dom.hide(element));
			} else {
				this.entityTypeDependentElements.forEach(element => main_core.Dom.show(element));
				this.renderFilterFields();
				this.renderEntityFields();
			}
		}
		renderFilterFields() {
			if (!main_core.Type.isNil(this.conditionGroup) && !main_core.Type.isNil(this.currentEntityTypeId)) {
				const selector = new bizproc_automation.ConditionGroupSelector(this.conditionGroup, {
					fields: Object.values(this.filterFieldsMap.get(this.currentEntityTypeId)),
					fieldPrefix: this.filteringFieldsPrefix,
					onOpenMenu: this.onOpenFilterFieldsMenu,
					caption: {
						head: main_core.Loc.getMessage('CRM_UDA_FILTERING_FIELDS_PROPERTY'),
						collapsed: main_core.Loc.getMessage('CRM_UDA_FILTERING_FIELDS_COLLAPSED_TEXT')
					}
				});

				// todo: remove 2024 with this.filterFieldsContainer.parentNode.firstElementChild
				if (selector.modern && this.filterFieldsContainer && this.filterFieldsContainer.parentNode) {
					const element = this.filterFieldsContainer.parentNode.firstElementChild === this.filterFieldsContainer ? this.filterFieldsContainer.parentNode.parentNode.firstElementChild : this.filterFieldsContainer.parentNode.firstElementChild;
					main_core.Dom.clean(element);
				}
				main_core.Dom.append(selector.createNode(), this.filterFieldsContainer);
			}
		}
		renderEntityFields() {
			Object.keys(this.currentValues.get(this.currentEntityTypeId)).forEach(fieldId => this.addCondition(fieldId));
		}
		onFieldsListSelectClick(event) {
			const fields = this.fieldsMap.get(this.currentEntityTypeId);
			if (main_core.Type.isNil(fields)) {
				return event.preventDefault();
			}
			const activity = this;
			const menuItems = Object.entries(fields).map(([fieldId, field]) => ({
				fieldId,
				text: field.Name,
				onclick(_, item) {
					this.popupWindow.close();
					activity.addCondition(item.fieldId);
				}
			}));
			const menuManagerOptions = {
				id: Math.random().toString(),
				bindElement: this.fieldsListSelect,
				items: Array.from(menuItems),
				autoHide: true,
				offsetLeft: main_core.Dom.getPosition(this.fieldsListSelect).width / 2,
				angle: {
					position: 'top',
					offset: 0
				},
				zIndex: 200,
				className: 'bizproc-automation-inline-selector-menu',
				events: {
					onPopupClose() {
						this.destroy();
					}
				}
			};
			main_popup.MenuManager.show(menuManagerOptions);
			return event.preventDefault();
		}
		onAddConditionButtonClick(event) {
			const defaultFieldId = Object.keys(this.fieldsMap.get(this.currentEntityTypeId))[0];
			this.addCondition(defaultFieldId);
			return event.preventDefault();
		}
		addCondition(fieldId) {
			if (main_core.Type.isNil(this.fieldsMap.get(this.currentEntityTypeId)[fieldId])) {
				return;
			}
			if (this.isRobot) {
				this.addRobotCondition(fieldId);
			} else {
				this.addBizprocCondition(fieldId);
			}
		}
		addRobotCondition(fieldId) {
			const conditionId = this.conditinIdPrefix + fieldId;
			const titleNode = main_core.Dom.create('span', {
				attrs: {
					className: 'bizproc-automation-popup-settings-title bizproc-automation-popup-settings-title-autocomplete'
				},
				text: this.fieldsMap.get(this.currentEntityTypeId)[fieldId].Name
			});
			const deleteButton = main_core.Dom.create('a', {
				attrs: {
					className: 'bizproc-automation-popup-settings-delete bizproc-automation-popup-settings-link bizproc-automation-popup-settings-link-light'
				},
				props: {
					href: '#'
				},
				text: main_core.Loc.getMessage('CRM_UDA_DELETE_CONDITION'),
				events: {
					// eslint-disable-next-line func-names
					click: function (event) {
						this.deleteCondition(fieldId);
						return event.preventDefault();
					}.bind(this)
				}
			});
			const fieldNode = main_core.Dom.create('div', {
				attrs: {
					className: 'bizproc-automation-popup-settings'
				},
				props: {
					id: conditionId
				},
				children: [titleNode, this.renderField(fieldId), deleteButton]
			});
			this.entitiesFieldsContainers.appendChild(fieldNode);
		}
		deleteCondition(fieldId) {
			const conditionId = this.conditinIdPrefix + fieldId;
			main_core.Dom.remove(document.getElementById(conditionId));
		}
		addBizprocCondition(fieldId) {
			const newConditionRow = this.entitiesFieldsContainers.insertRow(-1);
			newConditionRow.id = this.conditinIdPrefix + Math.random().toString().substr(1, 5);
			const activity = this;
			const entityFieldSelect = main_core.Dom.create('select', {
				children: this.getCurrentFieldsOptions(fieldId),
				events: {
					change(event) {
						const fieldValueNode = newConditionRow.children[2];
						const newFieldId = event.srcElement.value;
						newConditionRow.replaceChild(activity.renderField(newFieldId), fieldValueNode);
					}
				}
			});
			const equalSignNode = main_core.Dom.create('span', {
				text: '='
			});
			const entityFieldValueNode = this.renderField(fieldId);
			const deleteConditionButton = main_core.Dom.create('a', {
				props: {
					href: '#'
				},
				text: main_core.Loc.getMessage('CRM_UDA_DELETE_CONDITION'),
				events: {
					click(event) {
						main_core.Dom.remove(document.getElementById(newConditionRow.id));
						event.preventDefault();
					}
				}
			});
			[entityFieldSelect, equalSignNode, entityFieldValueNode, deleteConditionButton].forEach(node => {
				newConditionRow.insertCell(-1).appendChild(node);
			});
		}
		getCurrentFieldsOptions(selectedFieldId) {
			return Object.entries(this.fieldsMap.get(this.currentEntityTypeId)).map(([fieldId, field]) => {
				return main_core.Dom.create('option', {
					props: {
						value: field.FieldName
					},
					attrs: selectedFieldId === fieldId ? {
						selected: 'selected'
					} : undefined,
					text: field.Name
				});
			});
		}
		renderField(fieldId) {
			let value = this.currentValues.get(this.currentEntityTypeId)[fieldId];
			if (main_core.Type.isNil(value)) {
				value = '';
			}
			return BX.Bizproc.FieldType.renderControl(this.documentType, this.fieldsMap.get(this.currentEntityTypeId)[fieldId], fieldId, value, this.isRobot ? 'public' : 'designer');
		}
	}
	namespace.CrmUpdateDynamicActivity = CrmUpdateDynamicActivity;

})(BX, BX.Main, BX.Bizproc.Automation);
//# sourceMappingURL=script.js.map
