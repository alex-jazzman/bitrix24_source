/* eslint-disable */
(function (exports, main_core, main_core_events, bizproc_automation) {
	'use strict';

	const CONDITION_FIELD_NAME = 'condition';
	const DOCUMENT_FIELD_NAME = 'Document';
	const DOCUMENT_ROW_ID = `row_${DOCUMENT_FIELD_NAME}`;
	class CrmAutomationTriggerRenderer {
		#form = null;
		#conditionFields = [];
		#conditionField = null;
		#triggerConditionField;
		#triggerConditionNode = null;
		#conditionSelector = null;
		#conditionValueNode = null;
		#conditionObserver = null;
		#onNodeSettingsSaveHandler;
		#onDocumentChangeHandler;
		#onDocumentRemoveHandler;
		#onConditionChangeHandler;
		constructor() {
			this.#setDefaultContext();
			this.#onNodeSettingsSaveHandler = this.#onNodeSettingsSave.bind(this);
			this.#onDocumentChangeHandler = this.#onDocumentChange.bind(this);
			this.#onDocumentRemoveHandler = this.#onDocumentRemove.bind(this);
			this.#onConditionChangeHandler = this.#syncConditionValue.bind(this);
		}
		afterFormRender(form) {
			this.#form = form;
			this.#conditionField = form.querySelector('#row_condition');
			if (main_core.Type.isNil(this.#conditionSelector)) {
				main_core.Dom.hide(this.#conditionField);
			}

			// The panel reads the form right after this call and keeps that read as its pristine state.
			this.#syncConditionValue();
			this.#observeConditionRow();
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
			formData[CONDITION_FIELD_NAME] = this.#serializeCondition(formData);
		}
		#serializeCondition(formData) {
			return bizproc_automation.ConditionGroup.createFromForm(formData).serialize();
		}

		/**
		 * Mirrors the serialized group into hidden inputs of the form, one per leaf of its value. Not a
		 * duplicate of the write in the hook above: the unified panel pays for the save with a plain DOM read
		 * of the form and raises that hook afterwards, discarding its object - a group living in the object
		 * alone reaches no request. The control transports its own rows (`condition_field[]`), never the
		 * group the property stores, so the group has to stand in the form as a value of its own.
		 */
		#syncConditionValue() {
			main_core.Dom.remove(this.#conditionValueNode);
			this.#conditionValueNode = null;

			// A node whose parameter the panel withholds carries an input of the panel under the same name.
			if (!this.#form || main_core.Type.isNil(this.#conditionSelector)) {
				return;
			}
			this.#conditionValueNode = main_core.Tag.render`<div hidden></div>`;
			this.#renderValueInputs(this.#conditionValueNode, CONDITION_FIELD_NAME, this.#serializeCondition(main_core.ajax.prepareForm(this.#form).data));
			main_core.Dom.append(this.#conditionValueNode, this.#form);
		}

		/**
		 * Second channel of the value: a row edited in place publishes `onChange`, while a dropped row takes
		 * its transport out of the tree and reaches no subscriber at all. Watching the row covers the second
		 * case, `onChange` covers the first.
		 */
		#observeConditionRow() {
			this.#conditionObserver?.disconnect();
			this.#conditionObserver = null;
			if (!main_core.Type.isDomNode(this.#conditionField)) {
				return;
			}

			// The value lives in the form and outside this row, so rebuilding it raises no mutation here.
			this.#conditionObserver = new MutationObserver(() => this.#syncConditionValue());
			this.#conditionObserver.observe(this.#conditionField, {
				childList: true,
				subtree: true
			});
		}
		#renderValueInputs(container, name, value) {
			if (main_core.Type.isNil(value)) {
				return;
			}
			if (main_core.Type.isArray(value) || main_core.Type.isPlainObject(value)) {
				Object.entries(value).forEach(([key, item]) => {
					this.#renderValueInputs(container, `${name}[${key}]`, item);
				});
				return;
			}
			main_core.Dom.append(main_core.Dom.create('input', {
				attrs: {
					type: 'hidden',
					name
				},
				props: {
					value: String(value)
				}
			}), container);
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
			this.#syncConditionValue();
		}
		#destroyConditionSelector() {
			this.#conditionSelector?.unsubscribe('onChange', this.#onConditionChangeHandler);
			this.#conditionSelector?.destroy();
			this.#conditionSelector = null;
			if (this.#triggerConditionNode) {
				main_core.Dom.remove(this.#triggerConditionNode);
				this.#triggerConditionNode = null;
			}
			this.#syncConditionValue();
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
			const selector = new bizproc_automation.ConditionGroupSelector(new bizproc_automation.ConditionGroup(value), {
				fields: bizproc_automation.getGlobalContext().document.getFields(),
				showValuesSelector: false,
				caption: {
					head: name
				},
				isExpanded: true
			});
			selector.subscribe('onChange', this.#onConditionChangeHandler);
			return selector;
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

		/**
		 * The dialog events of `ui.entity-selector` are global, so every selector of the panel reaches both
		 * handlers. The own event is told by the dialog of the item and not by the node of the event: the
		 * removal branch carries no node at all (`item.deselect()` publishes `node: null`), while the dialog
		 * answers `getTargetNode()` with the container of the tag selector.
		 * The boundary is the row of the property `Document` and not the whole form: another selector of the
		 * same form picks something else entirely, and taking its choice for a document would rebuild the
		 * context of the trigger and drop the conditions already set up.
		 */
		#isOwnDocumentEvent(event) {
			const {
				item
			} = event.getData();
			const targetNode = item?.getDialog?.()?.getTargetNode?.();
			const documentRow = this.#form?.querySelector(`#${DOCUMENT_ROW_ID}`);

			// This handler swallows its own refusals, so an unguarded read would break it invisibly.
			if (!main_core.Type.isDomNode(documentRow) || !main_core.Type.isDomNode(targetNode)) {
				return false;
			}
			return documentRow.contains(targetNode);
		}

		/** With no row to mount the control into, the request for its fields is spent on nobody. */
		#reactsToDocumentEvent(event) {
			return this.#isOwnDocumentEvent(event) && !main_core.Type.isNil(this.#conditionField);
		}
		#onDocumentChange(event) {
			if (!this.#reactsToDocumentEvent(event)) {
				return;
			}
			const {
				item
			} = event.getData();
			const requestData = {
				documentType: bizproc_automation.getGlobalContext().document.getRawType(),
				activity: 'CrmAutomationTrigger',
				params: {
					document: item.id,
					form_name: 'document'
				}
			};
			main_core.ajax.runAction('bizproc.activity.request', {
				// The Nodes editor names its template: the server grants the request by the right on it.
				data: main_core.Reflection.getClass('BX.Bizproc.EditorTemplateContext')?.appendTo(requestData) ?? requestData
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
		#onDocumentRemove(event) {
			if (!this.#reactsToDocumentEvent(event)) {
				return;
			}
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
			this.#form = null;
			this.#conditionFields = [];
			this.#conditionObserver?.disconnect();
			this.#conditionObserver = null;
			main_core.Dom.remove(this.#conditionValueNode);
			this.#conditionValueNode = null;
			main_core_events.EventEmitter.unsubscribe('Bizproc.NodeSettings:nodeSettingsSaving', this.#onNodeSettingsSaveHandler);
			main_core_events.EventEmitter.unsubscribe('BX.UI.EntitySelector.Dialog:Item:onSelect', this.#onDocumentChangeHandler);
			main_core_events.EventEmitter.unsubscribe('BX.UI.EntitySelector.Dialog:Item:onDeselect', this.#onDocumentRemoveHandler);
		}
	}

	exports.CrmAutomationTriggerRenderer = CrmAutomationTriggerRenderer;

})(this.window = this.window || {}, BX, BX.Event, BX.Bizproc.Automation);
//# sourceMappingURL=renderer.js.map
