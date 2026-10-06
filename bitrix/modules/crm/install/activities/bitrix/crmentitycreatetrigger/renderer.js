/* eslint-disable */
(function (exports, main_core) {
	'use strict';

	class CrmEntityCreateTriggerRenderer {
		#form = null;
		#categoryRow = null;
		#categoryCell = null;
		#onDocumentChangeHandler = null;
		#onDocumentDeselectHandler = null;
		constructor() {
			this.#onDocumentChangeHandler = this.#onDocumentChange.bind(this);
			this.#onDocumentDeselectHandler = this.#onDocumentDeselect.bind(this);
		}
		afterFormRender(form) {
			this.#form = form;
			this.#categoryRow = form.querySelector('#row_categoryId');
			this.#categoryCell = this.#categoryRow?.querySelector('.field-row > div') ?? this.#categoryRow?.querySelector('td:last-child');
			this.#bindEvents();
			this.#syncCategoryRowVisibility();
			setTimeout(() => this.#syncCategoryRowVisibility());
		}
		#bindEvents() {
			main_core.Event.EventEmitter.subscribe('BX.UI.EntitySelector.Dialog:Item:onSelect', this.#onDocumentChangeHandler);
			main_core.Event.EventEmitter.subscribe('BX.UI.EntitySelector.Dialog:Item:onDeselect', this.#onDocumentDeselectHandler);
		}
		#getCurrentCategorySelect() {
			return this.#categoryCell?.querySelector('select[name="categoryId"]');
		}
		#getCurrentDocumentValue() {
			return this.#form?.querySelector('[name="Document"]')?.value ?? '';
		}
		#resetCategorySelection() {
			const selectElement = this.#getCurrentCategorySelect();
			if (!selectElement) {
				return;
			}
			selectElement.value = '';
			selectElement.selectedIndex = 0;
		}
		#hasCategoryOptions() {
			const selectElement = this.#getCurrentCategorySelect();
			if (!selectElement) {
				return false;
			}
			return Array.from(selectElement.options).some(option => option.value !== '');
		}
		#syncCategoryRowVisibility() {
			this.#toggleCategoryRow(this.#hasCategoryOptions() || main_core.Type.isStringFilled(this.#getCurrentDocumentValue()));
		}
		#toggleCategoryRow(isVisible) {
			if (!this.#categoryRow) {
				return;
			}
			if (isVisible) {
				main_core.Dom.show(this.#categoryRow);
			} else {
				main_core.Dom.hide(this.#categoryRow);
			}
		}
		#createCategoryProperty(options) {
			return {
				Type: 'select',
				FieldName: 'categoryId',
				Options: options,
				Required: false,
				AllowSelection: false
			};
		}
		#renderCategoryControl(options) {
			if (!this.#categoryCell) {
				return;
			}
			const control = BX.Bizproc.FieldType.renderControl(['bizproc', 'Bitrix\\Bizproc\\Public\\Entity\\Document\\Workflow', 'WORKFLOW'], this.#createCategoryProperty(options), 'categoryId', '');
			main_core.Dom.clean(this.#categoryCell);
			main_core.Dom.append(control, this.#categoryCell);
			this.#resetCategorySelection();
			this.#toggleCategoryRow(Object.keys(options).length > 0 || main_core.Type.isStringFilled(this.#getCurrentDocumentValue()));
		}
		#isEventFromCurrentForm(event) {
			const {
				item
			} = event.getData();
			const targetNode = item?.getDialog?.()?.getTargetNode?.();
			return Boolean(this.#form && targetNode && this.#form.contains(targetNode));
		}
		#onDocumentChange(event) {
			if (!this.#isEventFromCurrentForm(event)) {
				return;
			}
			const {
				item
			} = event.getData();
			main_core.ajax.runAction('bizproc.activity.request', {
				data: {
					documentType: ['bizproc', 'Bitrix\\Bizproc\\Public\\Entity\\Document\\Workflow', 'WORKFLOW'],
					activity: 'CrmEntityCreateTrigger',
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
				this.#renderCategoryControl(data);
			}).catch(e => console.error(e));
		}
		#onDocumentDeselect(event) {
			if (!this.#isEventFromCurrentForm(event)) {
				return;
			}
			this.#renderCategoryControl({});
		}
		destroy() {
			this.#form = null;
			this.#categoryRow = null;
			this.#categoryCell = null;
			main_core.Event.EventEmitter.unsubscribe('BX.UI.EntitySelector.Dialog:Item:onSelect', this.#onDocumentChangeHandler);
			main_core.Event.EventEmitter.unsubscribe('BX.UI.EntitySelector.Dialog:Item:onDeselect', this.#onDocumentDeselectHandler);
		}
	}

	exports.CrmEntityCreateTriggerRenderer = CrmEntityCreateTriggerRenderer;

})(this.window = this.window || {}, BX);
//# sourceMappingURL=renderer.js.map
