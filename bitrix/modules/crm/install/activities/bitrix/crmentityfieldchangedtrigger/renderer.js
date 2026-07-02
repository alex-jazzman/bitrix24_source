/* eslint-disable */
(function (exports, main_core) {
	'use strict';

	class CrmEntityFieldChangedTriggerRenderer {
		#form = null;
		#onDocumentChangeHandler = null;
		#onDocumentDeselectHandler = null;
		constructor() {
			this.#onDocumentChangeHandler = this.#onDocumentChange.bind(this);
			this.#onDocumentDeselectHandler = this.#onDocumentDeselect.bind(this);
		}
		afterFormRender(form) {
			this.#form = form;
			this.#bindEvents();
		}
		#bindEvents() {
			main_core.Event.EventEmitter.subscribe('BX.UI.EntitySelector.Dialog:Item:onSelect', this.#onDocumentChangeHandler);
			main_core.Event.EventEmitter.subscribe('BX.UI.EntitySelector.Dialog:Item:onDeselect', this.#onDocumentDeselectHandler);
		}
		#onDocumentChange(event) {
			const {
				item
			} = event.getData();
			main_core.ajax.runAction('bizproc.activity.request', {
				data: {
					documentType: ['bizproc', 'Bitrix\\Bizproc\\Public\\Entity\\Document\\Workflow', 'WORKFLOW'],
					activity: 'CrmEntityFieldChangedTrigger',
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
				const selectElement = this.#form.id_Fields;
				if (!selectElement) {
					return;
				}
				main_core.Dom.clean(selectElement);
				for (const [value, text] of Object.entries(data)) {
					selectElement.add(main_core.Tag.render`<option value="${value}">${text}</option>`);
				}
			}).catch(e => console.error(e));
		}
		#onDocumentDeselect() {
			const selectElement = this.#form.id_Fields;
			if (!selectElement) {
				return;
			}
			main_core.Dom.clean(selectElement);
		}
		destroy() {
			this.#form = null;
			main_core.Event.EventEmitter.unsubscribe('BX.UI.EntitySelector.Dialog:Item:onSelect', this.#onDocumentChangeHandler);
			main_core.Event.EventEmitter.unsubscribe('BX.UI.EntitySelector.Dialog:Item:onDeselect', this.#onDocumentDeselectHandler);
		}
	}

	exports.CrmEntityFieldChangedTriggerRenderer = CrmEntityFieldChangedTriggerRenderer;

})(this.window = this.window || {}, BX);
//# sourceMappingURL=renderer.js.map
