/* eslint-disable */
(function (main_core, bizproc_automation) {
	'use strict';

	const namespace = main_core.Reflection.namespace('BX.Crm.Activity');
	class CrmGetDynamicInfoActivity {
		constructor(options) {
			if (main_core.Type.isPlainObject(options)) {
				this.documentType = options.documentType;
				this.isRobot = options.isRobot;
				const form = document.forms[options.formName];
				if (!main_core.Type.isNil(form)) {
					this.entityTypeIdSelect = form.dynamic_type_id;
					this.currentEntityTypeId = Number(this.entityTypeIdSelect.value);
					this.entityTypeDependentElements = document.querySelectorAll('[data-role="bca-cuda-entity-type-id-dependent"]');
				}
				this.document = new bizproc_automation.Document({
					rawDocumentType: this.documentType,
					documentFields: options.documentFields,
					title: options.documentName
				});
				this.initAutomationContext();
				this.#initOnOpenFilterFieldsMenu();
				this.initFilterFields(options);
				this.initReturnFields(options);
				this.render();
			}
		}
		initFilterFields(options) {
			this.conditinIdPrefix = 'id_bca_cuda_field_';
			this.filterFieldsContainer = document.querySelector('[data-role="bca-cuda-filter-fields-container"]');
			this.filteringFieldsPrefix = options.filteringFieldsPrefix;
			this.filterFieldsMap = new Map(Object.entries(options.filterFieldsMap).map(([entityTypeId, fieldsMap]) => [Number(entityTypeId), fieldsMap]));

			// issue 0158608
			if (!main_core.Type.isNil(options.documentType) && !this.isRobot) {
				BX.Bizproc.Automation.API.documentType = options.documentType;
			}
			this.conditionGroup = new bizproc_automation.ConditionGroup(options.conditions);
		}
		initReturnFields(options) {
			this.returnFieldsProperty = options.returnFieldsProperty;
			this.returnFieldsIds = main_core.Type.isArray(options.returnFieldsIds) ? options.returnFieldsIds : [];
			this.returnFieldsMapContainer = document.querySelector('[data-role="bca-cuda-return-fields-container"]');
			this.returnFieldsMap = new Map();
			Object.entries(options.returnFieldsMap).forEach(([entityTypeId, fieldsMap]) => {
				this.returnFieldsMap.set(Number(entityTypeId), new Map(Object.entries(fieldsMap)));
			});
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
							field.Expression = `{{${visibilityNames[property.Visibility]}: ${property.Name}}}`;
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
		init() {
			if (this.entityTypeIdSelect) {
				main_core.Event.bind(this.entityTypeIdSelect, 'change', this.onEntityTypeIdChange.bind(this));
			}
		}
		onEntityTypeIdChange() {
			this.currentEntityTypeId = Number(this.entityTypeIdSelect.value);
			this.conditionGroup = new bizproc_automation.ConditionGroup();
			this.returnFieldsIds = [];
			this.render();
		}
		render() {
			if (main_core.Type.isNil(this.currentEntityTypeId) || this.currentEntityTypeId === 0) {
				this.entityTypeDependentElements.forEach(element => main_core.Dom.hide(element));
			} else {
				this.entityTypeDependentElements.forEach(element => main_core.Dom.show(element));
				this.renderFilterFields();
				this.renderReturnFields();
			}
		}
		renderFilterFields() {
			if (!main_core.Type.isNil(this.conditionGroup) && this.currentEntityTypeId !== 0) {
				const selector = new bizproc_automation.ConditionGroupSelector(this.conditionGroup, {
					fields: Object.values(this.filterFieldsMap.get(this.currentEntityTypeId)),
					fieldPrefix: this.filteringFieldsPrefix,
					onOpenMenu: this.onOpenFilterFieldsMenu,
					caption: {
						head: main_core.Loc.getMessage('CRM_GDIA_FILTERING_FIELDS_PROPERTY'),
						collapsed: main_core.Loc.getMessage('CRM_GDIA_FILTERING_FIELDS_COLLAPSED_TEXT')
					}
				});

				// todo: remove 2024 with this.filterFieldsContainer.parentNode.firstElementChild
				if (selector.modern && this.filterFieldsContainer && this.filterFieldsContainer.parentNode) {
					const element = this.filterFieldsContainer.parentNode.firstElementChild === this.filterFieldsContainer ? this.filterFieldsContainer.parentNode.parentNode.firstElementChild : this.filterFieldsContainer.parentNode.firstElementChild;
					main_core.Dom.clean(element);
				}
				main_core.Dom.clean(this.filterFieldsContainer);
				main_core.Dom.append(selector.createNode(), this.filterFieldsContainer);
			}
		}
		renderReturnFields() {
			const entityTypeId = this.currentEntityTypeId;
			const fieldsMap = this.returnFieldsMap.get(entityTypeId);
			if (!main_core.Type.isNil(fieldsMap)) {
				const fieldOptions = {};
				fieldsMap.forEach((field, fieldId) => {
					fieldOptions[fieldId] = field.Name;
				});
				this.returnFieldsProperty.Options = fieldOptions;
				main_core.Dom.clean(this.returnFieldsMapContainer);
				this.returnFieldsMapContainer.appendChild(BX.Bizproc.FieldType.renderControl(this.documentType, this.returnFieldsProperty, this.returnFieldsProperty.FieldName, this.returnFieldsIds, this.isRobot ? 'public' : 'designer'));
			}
		}
	}
	namespace.CrmGetDynamicInfoActivity = CrmGetDynamicInfoActivity;

})(BX, BX.Bizproc.Automation);
//# sourceMappingURL=script.js.map
