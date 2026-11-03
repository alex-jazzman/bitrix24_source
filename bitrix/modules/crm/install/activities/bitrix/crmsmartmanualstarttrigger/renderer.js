/* eslint-disable */
(function (exports, main_core) {
	'use strict';

	const SELECT_EVENT = 'BX.UI.EntitySelector.Dialog:Item:onSelect';
	const DESELECT_EVENT = 'BX.UI.EntitySelector.Dialog:Item:onDeselect';
	const WORKFLOW_DOCUMENT_TYPE = ['bizproc', 'Bitrix\\Bizproc\\Public\\Entity\\Document\\Workflow', 'WORKFLOW'];
	const ACTIVITY_CODE = 'CrmSmartManualStartTrigger';
	const DOCUMENT_FIELD_NAME = 'Document';
	const CATEGORY_FIELD_NAME = 'categoryId';
	const CATEGORY_MULTIPLE_FIELD_NAME = `${CATEGORY_FIELD_NAME}[]`;
	const CATEGORY_SELECT_SELECTOR = `select[name="${CATEGORY_FIELD_NAME}"], select[name="${CATEGORY_MULTIPLE_FIELD_NAME}"]`;
	const ONLY_AUTOMATED_SOLUTION_FIELD_NAME = 'onlyAutomatedSolution';
	const CATEGORY_ROW_TEST_ID = 'crm-smart-manual-start-category-row';
	const CATEGORY_SELECT_TEST_ID = 'crm-smart-manual-start-category-select';

	// The id and the dialog name the server render gives the controls of these two fields.
	const CATEGORY_CONTROL_ID = `id_${CATEGORY_FIELD_NAME}`;
	const DOCUMENT_SELECTOR_DIALOG_ID = `entityselector_${DOCUMENT_FIELD_NAME}`;
	const FIELD_CAPTION_SELECTOR = '.node-settings-edit-caption';
	/**
	 * Follows the smart process the dialog picks: the funnels of a process are known to the server alone, so
	 * the control is redrawn from the answer of the activity. The funnel property stays in the map of the node
	 * for every process, and its own row is shown only while there is a funnel to pick.
	 */
	class CrmSmartManualStartTriggerRenderer {
		#form = null;
		#categoryRow = null;
		#categoryCell = null;
		#categoryControlMultiple = null;
		#onDocumentSelectHandler = null;
		#onDocumentDeselectHandler = null;
		constructor() {
			this.#onDocumentSelectHandler = this.#onDocumentSelect.bind(this);
			this.#onDocumentDeselectHandler = this.#onDocumentDeselect.bind(this);
		}
		afterFormRender(form) {
			this.#form = form;
			this.#categoryRow = form.querySelector(`#row_${CATEGORY_FIELD_NAME}`);
			this.#categoryCell = this.#categoryRow?.querySelector('.field-row > div') ?? this.#categoryRow?.querySelector('td:last-child');
			main_core.Event.EventEmitter.subscribe(SELECT_EVENT, this.#onDocumentSelectHandler);
			main_core.Event.EventEmitter.subscribe(DESELECT_EVENT, this.#onDocumentDeselectHandler);
			this.#rememberCategoryControlMode();
			this.#markTestNodes();
			this.#nameCategoryControl();
			this.#toggleCategoryRow(this.#hasCategoryOptions());
		}
		destroy() {
			main_core.Event.EventEmitter.unsubscribe(SELECT_EVENT, this.#onDocumentSelectHandler);
			main_core.Event.EventEmitter.unsubscribe(DESELECT_EVENT, this.#onDocumentDeselectHandler);
			this.#form = null;
			this.#categoryRow = null;
			this.#categoryCell = null;
			this.#categoryControlMultiple = null;
		}
		#onDocumentSelect(event) {
			const {
				item
			} = event.getData();
			if (!this.#isEventFromDocumentSelector(item) || !main_core.Type.isStringFilled(item.id)) {
				return;
			}
			const pickedDocument = item.id;
			// The funnels of the previous process stay on screen until the answer arrives, so the choice made
			// in it goes on its own: the identifiers of funnels belong to the process they were read in.
			this.#dropSelectedFunnel();
			const requestData = {
				documentType: WORKFLOW_DOCUMENT_TYPE,
				activity: ACTIVITY_CODE,
				params: {
					document: pickedDocument,
					// The preset of the node narrows the answer the same way it narrows the selector:
					// the server has no other way of telling the two nodes of this class apart.
					[ONLY_AUTOMATED_SOLUTION_FIELD_NAME]: this.#getOnlyAutomatedSolutionValue(),
					form_name: 'document'
				}
			};
			main_core.ajax.runAction('bizproc.activity.request', {
				// The Nodes editor names its template: the server grants the request by the right on it.
				data: main_core.Reflection.getClass('BX.Bizproc.EditorTemplateContext')?.appendTo(requestData) ?? requestData
			}).then(response => this.#applyFunnels(pickedDocument, response.data))
			// A list left over from a refused request would offer funnels of a process nobody picked.
			.catch(() => this.#applyFunnels(pickedDocument, {}));
		}

		/**
		 * The dialog of the process picks a single item, so replacing a process deselects the previous one
		 * first and picks the new one right after, in the same task. The control is left alone here and the
		 * row follows the value of the field instead: a replacement is redrawn once, by the answer of its own
		 * request, and only a process nobody replaced takes the row away.
		 */
		#onDocumentDeselect(event) {
			if (!this.#isEventFromDocumentSelector(event.getData().item)) {
				return;
			}
			Promise.resolve().then(() => this.#dropFunnelsOfEmptyDocument());
		}
		#dropFunnelsOfEmptyDocument() {
			if (main_core.Type.isStringFilled(this.#getDocumentValue())) {
				return;
			}
			this.#renderCategoryControl({});
		}

		/**
		 * The value of the row goes before its options do: a funnel of the previous process must not travel
		 * with the form while the answer for the new one is on its way.
		 */
		#dropSelectedFunnel() {
			const select = this.#getCategorySelect();
			if (!select) {
				return;
			}
			[...select.options].forEach(option => {
				option.selected = false;
			});
		}

		/**
		 * The answer of a process that is no longer picked is dropped: nothing on the server checks that the
		 * saved funnel belongs to the saved process, so a stale list would bind the node to a funnel of a
		 * foreign process and the button would show up nowhere.
		 */
		#applyFunnels(pickedDocument, data) {
			if (pickedDocument !== this.#getDocumentValue()) {
				return;
			}

			// An empty answer is an answer: the process has no funnels, so the row goes away with the list.
			this.#renderCategoryControl(main_core.Type.isPlainObject(data) ? data : {});
		}
		#renderCategoryControl(options) {
			if (!this.#categoryCell) {
				return;
			}
			this.#rememberCategoryControlMode();
			const control = BX.Bizproc.FieldType.renderControl(WORKFLOW_DOCUMENT_TYPE, {
				Type: 'select',
				FieldName: CATEGORY_FIELD_NAME,
				Options: options,
				Required: false,
				AllowSelection: false,
				Multiple: this.#isCategoryControlMultiple()
			}, CATEGORY_FIELD_NAME, '');
			const wasFocusInCell = this.#isFocusInCategoryCell();
			main_core.Dom.clean(this.#categoryCell);
			main_core.Dom.append(control, this.#categoryCell);
			this.#markTestNodes();
			this.#nameCategoryControl();
			this.#toggleCategoryRow(this.#hasCategoryOptions());
			if (wasFocusInCell) {
				this.#getCategorySelect()?.focus();
			}
		}

		/**
		 * A redraw removes the control the user may be standing on, and the focus of a removed node goes to the
		 * body: it is handed over to the control that took its place. The focus of anything else is left alone.
		 */
		#isFocusInCategoryCell() {
			return Boolean(this.#categoryCell?.contains(document.activeElement));
		}

		/**
		 * The form names the row, not the control inside it, so the control of the funnel goes without a name of
		 * its own. The name of the row is reused: the host either points at a label of its own with
		 * `aria-labelledby` or carries the name in `aria-label`, and a host that does neither still renders the
		 * caption of the field inside the row.
		 */
		#nameCategoryControl() {
			const select = this.#getCategorySelect();
			if (!select) {
				return;
			}

			// A redraw has to keep the id of the server render, or a label bound to it stops naming anything.
			main_core.Dom.attr(select, 'id', CATEGORY_CONTROL_ID);
			const labelId = this.#categoryRow?.getAttribute('aria-labelledby');
			if (main_core.Type.isStringFilled(labelId)) {
				main_core.Dom.attr(select, 'aria-labelledby', labelId);
				return;
			}
			const label = this.#getCategoryLabel();
			if (main_core.Type.isStringFilled(label)) {
				main_core.Dom.attr(select, 'aria-label', label);
			}
		}
		#getCategoryLabel() {
			return this.#categoryRow?.getAttribute('aria-label') || this.#categoryRow?.querySelector(FIELD_CAPTION_SELECTOR)?.textContent?.trim() || '';
		}

		/**
		 * Test anchors for the row and the control of the funnel, marked on every redraw of the control.
		 * The form builds the row id out of the property name, and every manual start trigger of the module
		 * carries a funnel property under that same name: the row of this node is named by the node itself.
		 */
		#markTestNodes() {
			main_core.Dom.attr(this.#categoryRow, 'data-testid', CATEGORY_ROW_TEST_ID);
			main_core.Dom.attr(this.#getCategorySelect(), 'data-testid', CATEGORY_SELECT_TEST_ID);
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
		#rememberCategoryControlMode() {
			if (main_core.Type.isBoolean(this.#categoryControlMultiple)) {
				return;
			}
			const select = this.#getCategorySelect();
			if (!select) {
				return;
			}
			this.#categoryControlMultiple = select.multiple || select.name === CATEGORY_MULTIPLE_FIELD_NAME;
		}
		#isCategoryControlMultiple() {
			return this.#categoryControlMultiple === true;
		}
		#getCategorySelect() {
			return this.#categoryCell?.querySelector(CATEGORY_SELECT_SELECTOR);
		}
		#hasCategoryOptions() {
			const select = this.#getCategorySelect();
			return Boolean(select) && [...select.options].some(option => main_core.Type.isStringFilled(option.value));
		}
		#getDocumentValue() {
			return this.#form?.querySelector(`[name="${DOCUMENT_FIELD_NAME}"]`)?.value ?? '';
		}

		/**
		 * The property is hidden, and the panel keeps a hidden control of it in the form of the node, so the
		 * preset travels with the form the same way the picked process does.
		 */
		#getOnlyAutomatedSolutionValue() {
			return this.#form?.querySelector(`[name="${ONLY_AUTOMATED_SOLUTION_FIELD_NAME}"]`)?.value ?? 'N';
		}

		/**
		 * The selector events are global, and a form may hold a selector of another field as well, so the form
		 * alone does not tell the control apart. The dialog of a field carries the name of the input it writes
		 * into (`bizproc/install/js/bizproc/bp-entity-selector/src/index.js`), and every node form of the screen
		 * names the dialog of its own process field alike: the form is what tells those apart.
		 */
		#isEventFromDocumentSelector(item) {
			const dialog = item?.getDialog?.();
			if (dialog?.getId?.() !== DOCUMENT_SELECTOR_DIALOG_ID) {
				return false;
			}
			const targetNode = dialog.getTargetNode?.();
			return Boolean(this.#form && targetNode && this.#form.contains(targetNode));
		}
	}

	exports.CrmSmartManualStartTriggerRenderer = CrmSmartManualStartTriggerRenderer;

})(this.window = this.window || {}, BX);
//# sourceMappingURL=renderer.js.map
