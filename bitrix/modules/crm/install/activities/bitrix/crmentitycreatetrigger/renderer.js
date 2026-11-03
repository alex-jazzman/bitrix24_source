/* eslint-disable */
(function (exports, main_core) {
	'use strict';

	class CrmEntityCreateTriggerRenderer {
		#form = null;
		#categoryRow = null;
		#categoryCell = null;
		#categoryControlMultiple = null;
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
			this.#rememberCategoryControlMode();
			this.#bindEvents();
			this.#syncCategoryRowVisibility();
			setTimeout(() => this.#syncCategoryRowVisibility());
		}
		#bindEvents() {
			main_core.Event.EventEmitter.subscribe('BX.UI.EntitySelector.Dialog:Item:onSelect', this.#onDocumentChangeHandler);
			main_core.Event.EventEmitter.subscribe('BX.UI.EntitySelector.Dialog:Item:onDeselect', this.#onDocumentDeselectHandler);
		}
		#getCurrentCategorySelect() {
			return this.#categoryCell?.querySelector('select[name="categoryId"], select[name="categoryId[]"]');
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
			this.#rememberCategoryControlMode();
			return {
				Type: 'select',
				FieldName: 'categoryId',
				Multiple: this.#categoryControlMultiple === true,
				Options: options,
				Required: false,
				AllowSelection: false
			};
		}
		#rememberCategoryControlMode() {
			if (main_core.Type.isBoolean(this.#categoryControlMultiple)) {
				return;
			}
			const select = this.#getCurrentCategorySelect();
			if (!select) {
				return;
			}
			this.#categoryControlMultiple = select.multiple || select.name === 'categoryId[]';
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
			const requestData = {
				documentType: ['bizproc', 'Bitrix\\Bizproc\\Public\\Entity\\Document\\Workflow', 'WORKFLOW'],
				activity: 'CrmEntityCreateTrigger',
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
			this.#categoryControlMultiple = null;
			main_core.Event.EventEmitter.unsubscribe('BX.UI.EntitySelector.Dialog:Item:onSelect', this.#onDocumentChangeHandler);
			main_core.Event.EventEmitter.unsubscribe('BX.UI.EntitySelector.Dialog:Item:onDeselect', this.#onDocumentDeselectHandler);
		}
	}

	exports.CrmEntityCreateTriggerRenderer = CrmEntityCreateTriggerRenderer;

})(this.window = this.window || {}, BX);
//# sourceMappingURL=renderer.js.map
