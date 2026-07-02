/* eslint-disable */
(function (main_core, crm_template_editor, bizproc_automation) {
	'use strict';

	const namespace = main_core.Reflection.namespace('BX.Crm.Activity');
	class CrmSendWhatsAllMessageActivity {
		#isRobot;
		#documentType;
		#formName;
		#editorWrapper;
		#templates = new Map();
		#placeholders = new Map();
		#templateId;
		#dialogItems = [];
		#items = {};
		constructor(options) {
			this.#isRobot = main_core.Type.isBoolean(options.isRobot) ? options.isRobot : true;
			if (!main_core.Type.isArrayFilled(options.documentType)) {
				throw new Error('documentType must be filled array');
			}
			this.#documentType = options.documentType;
			if (!main_core.Type.isElementNode(options.editorWrapper)) {
				throw new Error('editorWrapper must be HTMLDivElement');
			}
			this.#editorWrapper = options.editorWrapper;
			if (!main_core.Type.isStringFilled(options.formName)) {
				throw new Error('formName must be filled string');
			}
			this.#formName = options.formName;
			const form = document.forms[this.#formName];
			if (!form || !form.template_id) {
				throw new Error('form must have template_id element');
			}
			main_core.Event.bind(form.template_id, 'change', this.#onChangeTemplate.bind(this));
			this.#setOnBeforeSaveSettingsCallback();
			this.#fillDialogItems();
			if (main_core.Type.isPlainObject(options.currentTemplate) && main_core.Text.toInteger(options.currentTemplateId) > 0) {
				this.#setCurrentTemplate(main_core.Text.toInteger(options.currentTemplateId), options.currentTemplate, options.currentPlaceholders);
			}
		}
		#onChangeTemplate(event) {
			const target = event.target;
			if (!target) {
				return;
			}
			const selectedOptions = target.selectedOptions;
			const templateId = selectedOptions.item(0) ? main_core.Text.toInteger(selectedOptions.item(0).value) : 0;
			this.#templateId = templateId;
			if (templateId <= 0) {
				this.#removeTemplateEditor();
				return;
			}
			if (this.#templates.has(templateId)) {
				this.#insertTemplateEditor(templateId);
				return;
			}
			this.#loadTemplate(templateId).then(({
				data
			}) => {
				if (main_core.Type.isPlainObject(data)) {
					this.#addTemplate(templateId, data);
					this.#insertTemplateEditor(templateId);
				}
			}).catch(response => console.error(response.errors));
		}
		#setOnBeforeSaveSettingsCallback() {
			if (!this.#isRobot) {
				return;
			}
			const designer = bizproc_automation.Designer.getInstance();
			const dialog = designer ? designer.getRobotSettingsDialog() : null;
			if (dialog?.robot) {
				dialog.robot.setOnBeforeSaveRobotSettings(this.#onBeforeSaveRobotSettings.bind(this));
			}
		}
		#setCurrentTemplate(templateId, template, placeholders) {
			this.#templateId = templateId;
			this.#addTemplate(templateId, template);
			if (main_core.Type.isPlainObject(placeholders)) {
				const templatePlaceholders = this.#placeholders.get(templateId);
				Object.entries(placeholders).forEach(([key, value]) => {
					if (Object.hasOwn(this.#items, value)) {
						templatePlaceholders.set(key, {
							value,
							parentTitle: this.#items[value].parentTitle,
							title: this.#items[value].title
						});
					}
				});
			}
			this.#insertTemplateEditor(templateId);
		}
		#addTemplate(templateId, data) {
			const content = main_core.Type.isString(data.content) ? data.content : '';
			this.#templates.set(templateId, {
				content: main_core.Text.encode(content).replaceAll('\n', '<br>'),
				placeholders: main_core.Type.isPlainObject(data.placeholders) ? data.placeholders : {}
			});
			this.#placeholders.set(templateId, new Map());
		}
		#loadTemplate(templateId) {
			return main_core.ajax.runAction('bizproc.activity.request', {
				data: {
					documentType: this.#documentType,
					activity: 'CrmSendWhatsAppMessageActivity',
					params: {
						template_id: templateId,
						form_name: this.#formName
					}
				}
			});
		}
		#insertTemplateEditor(templateId) {
			const data = this.#templates.get(templateId);
			main_core.Dom.addClass(this.#editorWrapper, 'bizproc-automation-whats-app-message-activity-editor');
			main_core.Dom.removeClass(this.#isRobot ? this.#editorWrapper.parentElement : this.#editorWrapper.parentElement?.parentElement, '--hidden');
			const editor = new crm_template_editor.Editor({
				target: this.#editorWrapper,
				onSelect: ({
					id,
					value,
					parentTitle,
					title
				}) => {
					const templatePlaceholders = this.#placeholders.get(templateId);
					templatePlaceholders.set(id, {
						value,
						parentTitle,
						title
					});
				},
				dialogOptions: {
					items: this.#dialogItems,
					entities: []
				},
				usePlaceholderProvider: false,
				canUseFieldsDialog: true,
				canUseFieldValueInput: false
			});
			editor.setPlaceholders(data.placeholders).setFilledPlaceholders(this.#prepareFilledPlaceholders(templateId)).setBody(data.content);
		}
		#fillDialogItems() {
			if (!this.#isRobot) {
				return;
			}
			const context = bizproc_automation.tryGetGlobalContext();
			if (!context) {
				return;
			}
			const designer = bizproc_automation.Designer.getInstance();
			const component = designer ? designer.component : null;
			const dialog = designer ? designer.getRobotSettingsDialog() : null;
			const template = dialog ? dialog.template : null;
			const triggerManager = component ? component.triggerManager : null;
			const robotsWithReturnFields = template ? template.getRobotsWithReturnFields(dialog.robot) : [];
			const manager = new bizproc_automation.SelectorItemsManager({
				documentFields: bizproc_automation.enrichFieldsWithModifiers(context.document.getFields(), 'Document'),
				documentTitle: context.document.title,
				globalVariables: context.automationGlobals.globalVariables,
				variables: template ? template.getVariables() : null,
				globalConstants: context.automationGlobals.globalConstants,
				constants: template ? template.getConstants() : null,
				activityResultFields: robotsWithReturnFields.map(robot => {
					return {
						id: robot.getId(),
						title: robot.getTitle(),
						fields: bizproc_automation.enrichFieldsWithModifiers(robot.getReturnFieldsDescription(), robot.getId(), {
							friendly: false,
							printable: false,
							server: false,
							responsible: false,
							shortLink: true
						})
					};
				}),
				triggerResultFields: triggerManager && template ? triggerManager.getReturnProperties(template.getStatusId()) : null,
				useModifier: true
			});
			this.#dialogItems = manager.groupsWithChildren;
			manager.items.forEach(field => {
				this.#items[field.id] = {
					title: field.title,
					parentTitle: field.supertitle
				};
			});
		}
		#prepareFilledPlaceholders(templateId) {
			const placeholders = [];
			const templatePlaceholders = this.#placeholders.get(templateId);
			templatePlaceholders.forEach((data, key) => {
				placeholders.push({
					PLACEHOLDER_ID: key,
					FIELD_NAME: data.value,
					FIELD_ENTITY_TYPE: 'bp',
					TITLE: data.title,
					PARENT_TITLE: data.parentTitle
				});
			});
			return placeholders;
		}
		#removeTemplateEditor() {
			main_core.Dom.removeClass(this.#editorWrapper, 'bizproc-automation-whats-app-message-activity-editor');
			main_core.Dom.clean(this.#editorWrapper);
			main_core.Dom.addClass(this.#isRobot ? this.#editorWrapper.parentElement : this.#editorWrapper.parentElement?.parentElement, '--hidden');
		}
		#onBeforeSaveRobotSettings() {
			if (this.#templateId > 0) {
				const placeholders = {};
				this.#placeholders.get(this.#templateId).forEach(({
					value
				}, key) => {
					placeholders[key] = value;
				});
				return {
					placeholders
				};
			}
			return {};
		}
	}
	namespace.CrmSendWhatsAllMessageActivity = CrmSendWhatsAllMessageActivity;

})(BX, BX.Crm.Template, BX.Bizproc.Automation);
//# sourceMappingURL=script.js.map
