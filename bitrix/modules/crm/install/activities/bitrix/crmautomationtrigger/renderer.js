/* eslint-disable */
(function (exports, main_core, main_core_events, bizproc_automation) {
	'use strict';

	class CrmAutomationTriggerRenderer {
		#conditionFields = [];
		#conditionField = null;
		#triggerConditionField;
		#triggerConditionNode = null;
		#conditionSelector = null;
		#onNodeSettingsSaveHandler;
		#onDocumentChangeHandler;
		#onDocumentRemoveHandler;
		constructor() {
			this.#setDefaultContext();
			this.#onNodeSettingsSaveHandler = this.#onNodeSettingsSave.bind(this);
			this.#onDocumentChangeHandler = this.#onDocumentChange.bind(this);
			this.#onDocumentRemoveHandler = this.#onDocumentRemove.bind(this);
		}
		afterFormRender(form) {
			this.#conditionField = form.querySelector('#row_condition');
			if (main_core.Type.isNil(this.#conditionSelector)) {
				main_core.Dom.hide(this.#conditionField);
			}
			main_core_events.EventEmitter.subscribe('Bizproc.NodeSettings:nodeSettingsSaving', this.#onNodeSettingsSaveHandler);
			main_core_events.EventEmitter.subscribe('BX.UI.EntitySelector.Dialog:Item:onSelect', this.#onDocumentChangeHandler);
			main_core_events.EventEmitter.subscribe('BX.UI.EntitySelector.Dialog:Item:onDeselect', this.#onDocumentRemoveHandler);
		}
		#onNodeSettingsSave(event) {
			const {
				formData
			} = event.getData();
			for (const property of this.#conditionFields) {
				const conditionGroup = bizproc_automation.ConditionGroup.createFromForm(formData, property);
				formData[property] = conditionGroup.serialize();
			}
			formData.condition = bizproc_automation.ConditionGroup.createFromForm(formData).serialize();
		}
		getControlRenderers() {
			return {
				'@trigger-condition-settings': field => this.#renderTriggerConditionSettings(field),
				'@condition-group-selector': field => this.#renderConditionGroupSelector(field)
			};
		}
		#renderTriggerConditionSettings(field) {
			this.#triggerConditionField = field;
			const property = field.property;
			const settings = property.Settings;
			if (!settings) {
				this.#triggerConditionNode = main_core.Tag.render`<div></div>`;
				return this.#triggerConditionNode;
			}
			this.#updateContext(settings);
			this.#recreateConditionSelector(field.value);
			return this.#triggerConditionNode;
		}
		#recreateConditionSelector(value = null) {
			this.#destroyConditionSelector();
			this.#conditionSelector = this.#createConditionSelector(value);
			this.#mountConditionNode(this.#conditionSelector.createNode());
		}
		#destroyConditionSelector() {
			this.#conditionSelector?.destroy();
			this.#conditionSelector = null;
			if (this.#triggerConditionNode) {
				main_core.Dom.remove(this.#triggerConditionNode);
				this.#triggerConditionNode = null;
			}
		}
		#mountConditionNode(node) {
			if (this.#triggerConditionNode) {
				main_core.Dom.replace(this.#triggerConditionNode, node);
			} else {
				main_core.Dom.append(node, this.#conditionField);
			}
			this.#triggerConditionNode = node;
		}
		#createConditionSelector(value = null) {
			const name = this.#triggerConditionField.property.Name;
			return new bizproc_automation.ConditionGroupSelector(new bizproc_automation.ConditionGroup(value), {
				fields: bizproc_automation.getGlobalContext().document.getFields(),
				showValuesSelector: false,
				caption: {
					head: name
				},
				isExpanded: true
			});
		}
		#renderConditionGroupSelector(field) {
			const property = field.property;
			this.#conditionFields.push(property.Id);
			const selector = new bizproc_automation.ConditionGroupSelector(new bizproc_automation.ConditionGroup(field.value), {
				fields: property.Settings.Fields,
				fieldPrefix: property.Id,
				showValuesSelector: false,
				caption: {
					head: property.Name
				},
				isExpanded: true
			});
			return selector.createNode();
		}
		#onDocumentChange(event) {
			const {
				item
			} = event.getData();
			main_core.ajax.runAction('bizproc.activity.request', {
				data: {
					documentType: bizproc_automation.getGlobalContext().document.getRawType(),
					activity: 'CrmAutomationTrigger',
					params: {
						document: item.id,
						form_name: 'document'
					}
				}
			}).then(response => {
				const data = response.data;
				if (!main_core.Type.isPlainObject(data)) {
					return;
				}
				this.#updateContext(data);
				main_core.Dom.show(this.#conditionField);
				this.#recreateConditionSelector();
			}).catch(e => console.error(e));
		}
		#onDocumentRemove() {
			this.#setDefaultContext();
			this.#destroyConditionSelector();
			main_core.Dom.hide(this.#conditionField);
		}
		#updateContext(data) {
			const document = new bizproc_automation.Document({
				rawDocumentType: data.DocumentType,
				documentFields: data.Fields,
				title: data.Title
			});
			bizproc_automation.setGlobalContext(new bizproc_automation.Context({
				document
			}));
		}
		#setDefaultContext() {
			const document = new bizproc_automation.Document({
				rawDocumentType: ['bizproc', 'Bitrix\\Bizproc\\Public\\Entity\\Document\\Workflow', 'WORKFLOW'],
				documentFields: [],
				title: 'document'
			});
			bizproc_automation.setGlobalContext(new bizproc_automation.Context({
				document
			}));
		}
		destroy() {
			this.#conditionFields = [];
			main_core_events.EventEmitter.unsubscribe('Bizproc.NodeSettings:nodeSettingsSaving', this.#onNodeSettingsSaveHandler);
			main_core_events.EventEmitter.unsubscribe('BX.UI.EntitySelector.Dialog:Item:onSelect', this.#onDocumentChangeHandler);
			main_core_events.EventEmitter.unsubscribe('BX.UI.EntitySelector.Dialog:Item:onDeselect', this.#onDocumentRemoveHandler);
		}
	}

	exports.CrmAutomationTriggerRenderer = CrmAutomationTriggerRenderer;

})(this.window = this.window || {}, BX, BX.Event, BX.Bizproc.Automation);
//# sourceMappingURL=renderer.js.map
