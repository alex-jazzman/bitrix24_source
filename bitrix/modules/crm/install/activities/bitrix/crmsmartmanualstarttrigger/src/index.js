import { Event, ajax, Dom, Type, Reflection } from 'main.core';
import type { BaseEvent } from 'main.core.events';

const SELECT_EVENT = 'BX.UI.EntitySelector.Dialog:Item:onSelect';
const DESELECT_EVENT = 'BX.UI.EntitySelector.Dialog:Item:onDeselect';
const WORKFLOW_DOCUMENT_TYPE = ['bizproc', 'Bitrix\\Bizproc\\Public\\Entity\\Document\\Workflow', 'WORKFLOW'];
const ACTIVITY_CODE = 'CrmSmartManualStartTrigger';
const DOCUMENT_FIELD_NAME = 'Document';
const CATEGORY_FIELD_NAME = 'categoryId';
const CATEGORY_MULTIPLE_FIELD_NAME = `${CATEGORY_FIELD_NAME}[]`;
const CATEGORY_SELECT_SELECTOR =
	`select[name="${CATEGORY_FIELD_NAME}"], select[name="${CATEGORY_MULTIPLE_FIELD_NAME}"]`
;
const ONLY_AUTOMATED_SOLUTION_FIELD_NAME = 'onlyAutomatedSolution';

const CATEGORY_ROW_TEST_ID = 'crm-smart-manual-start-category-row';
const CATEGORY_SELECT_TEST_ID = 'crm-smart-manual-start-category-select';

// The id and the dialog name the server render gives the controls of these two fields.
const CATEGORY_CONTROL_ID = `id_${CATEGORY_FIELD_NAME}`;
const DOCUMENT_SELECTOR_DIALOG_ID = `entityselector_${DOCUMENT_FIELD_NAME}`;

const FIELD_CAPTION_SELECTOR = '.node-settings-edit-caption';

type Funnels = { [key: string]: string };

type SelectorItem = {
	id: string,
	getDialog: () => ?{ getId: () => string, getTargetNode: () => ?HTMLElement },
};

/**
 * Follows the smart process the dialog picks: the funnels of a process are known to the server alone, so
 * the control is redrawn from the answer of the activity. The funnel property stays in the map of the node
 * for every process, and its own row is shown only while there is a funnel to pick.
 */
export class CrmSmartManualStartTriggerRenderer
{
	#form: HTMLFormElement = null;
	#categoryRow: HTMLElement = null;
	#categoryCell: HTMLElement = null;
	#categoryControlMultiple: ?boolean = null;
	#onDocumentSelectHandler: Function = null;
	#onDocumentDeselectHandler: Function = null;

	constructor()
	{
		this.#onDocumentSelectHandler = this.#onDocumentSelect.bind(this);
		this.#onDocumentDeselectHandler = this.#onDocumentDeselect.bind(this);
	}

	afterFormRender(form: HTMLFormElement): void
	{
		this.#form = form;
		this.#categoryRow = form.querySelector(`#row_${CATEGORY_FIELD_NAME}`);
		this.#categoryCell = this.#categoryRow?.querySelector('.field-row > div')
			?? this.#categoryRow?.querySelector('td:last-child')
		;

		Event.EventEmitter.subscribe(SELECT_EVENT, this.#onDocumentSelectHandler);
		Event.EventEmitter.subscribe(DESELECT_EVENT, this.#onDocumentDeselectHandler);

		this.#rememberCategoryControlMode();
		this.#markTestNodes();
		this.#nameCategoryControl();
		this.#toggleCategoryRow(this.#hasCategoryOptions());
	}

	destroy(): void
	{
		Event.EventEmitter.unsubscribe(SELECT_EVENT, this.#onDocumentSelectHandler);
		Event.EventEmitter.unsubscribe(DESELECT_EVENT, this.#onDocumentDeselectHandler);

		this.#form = null;
		this.#categoryRow = null;
		this.#categoryCell = null;
		this.#categoryControlMultiple = null;
	}

	#onDocumentSelect(event: BaseEvent): void
	{
		const { item } = event.getData();
		if (!this.#isEventFromDocumentSelector(item) || !Type.isStringFilled(item.id))
		{
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
				form_name: 'document',
			},
		};

		ajax.runAction(
			'bizproc.activity.request',
			{
				// The Nodes editor names its template: the server grants the request by the right on it.
				data: Reflection.getClass('BX.Bizproc.EditorTemplateContext')?.appendTo(requestData) ?? requestData,
			},
		)
			.then((response) => this.#applyFunnels(pickedDocument, response.data))
			// A list left over from a refused request would offer funnels of a process nobody picked.
			.catch(() => this.#applyFunnels(pickedDocument, {}))
		;
	}

	/**
	 * The dialog of the process picks a single item, so replacing a process deselects the previous one
	 * first and picks the new one right after, in the same task. The control is left alone here and the
	 * row follows the value of the field instead: a replacement is redrawn once, by the answer of its own
	 * request, and only a process nobody replaced takes the row away.
	 */
	#onDocumentDeselect(event: BaseEvent): void
	{
		if (!this.#isEventFromDocumentSelector(event.getData().item))
		{
			return;
		}

		Promise.resolve().then(() => this.#dropFunnelsOfEmptyDocument());
	}

	#dropFunnelsOfEmptyDocument(): void
	{
		if (Type.isStringFilled(this.#getDocumentValue()))
		{
			return;
		}

		this.#renderCategoryControl({});
	}

	/**
	 * The value of the row goes before its options do: a funnel of the previous process must not travel
	 * with the form while the answer for the new one is on its way.
	 */
	#dropSelectedFunnel(): void
	{
		const select = this.#getCategorySelect();
		if (!select)
		{
			return;
		}

		[...select.options].forEach((option) => {
			option.selected = false;
		});
	}

	/**
	 * The answer of a process that is no longer picked is dropped: nothing on the server checks that the
	 * saved funnel belongs to the saved process, so a stale list would bind the node to a funnel of a
	 * foreign process and the button would show up nowhere.
	 */
	#applyFunnels(pickedDocument: string, data: mixed): void
	{
		if (pickedDocument !== this.#getDocumentValue())
		{
			return;
		}

		// An empty answer is an answer: the process has no funnels, so the row goes away with the list.
		this.#renderCategoryControl(Type.isPlainObject(data) ? data : {});
	}

	#renderCategoryControl(options: Funnels): void
	{
		if (!this.#categoryCell)
		{
			return;
		}

		this.#rememberCategoryControlMode();

		const control = BX.Bizproc.FieldType.renderControl(
			WORKFLOW_DOCUMENT_TYPE,
			{
				Type: 'select',
				FieldName: CATEGORY_FIELD_NAME,
				Options: options,
				Required: false,
				AllowSelection: false,
				Multiple: this.#isCategoryControlMultiple(),
			},
			CATEGORY_FIELD_NAME,
			'',
		);

		const wasFocusInCell = this.#isFocusInCategoryCell();

		Dom.clean(this.#categoryCell);
		Dom.append(control, this.#categoryCell);
		this.#markTestNodes();
		this.#nameCategoryControl();
		this.#toggleCategoryRow(this.#hasCategoryOptions());

		if (wasFocusInCell)
		{
			this.#getCategorySelect()?.focus();
		}
	}

	/**
	 * A redraw removes the control the user may be standing on, and the focus of a removed node goes to the
	 * body: it is handed over to the control that took its place. The focus of anything else is left alone.
	 */
	#isFocusInCategoryCell(): boolean
	{
		return Boolean(this.#categoryCell?.contains(document.activeElement));
	}

	/**
	 * The form names the row, not the control inside it, so the control of the funnel goes without a name of
	 * its own. The name of the row is reused: the host either points at a label of its own with
	 * `aria-labelledby` or carries the name in `aria-label`, and a host that does neither still renders the
	 * caption of the field inside the row.
	 */
	#nameCategoryControl(): void
	{
		const select = this.#getCategorySelect();
		if (!select)
		{
			return;
		}

		// A redraw has to keep the id of the server render, or a label bound to it stops naming anything.
		Dom.attr(select, 'id', CATEGORY_CONTROL_ID);

		const labelId = this.#categoryRow?.getAttribute('aria-labelledby');
		if (Type.isStringFilled(labelId))
		{
			Dom.attr(select, 'aria-labelledby', labelId);

			return;
		}

		const label = this.#getCategoryLabel();
		if (Type.isStringFilled(label))
		{
			Dom.attr(select, 'aria-label', label);
		}
	}

	#getCategoryLabel(): string
	{
		return this.#categoryRow?.getAttribute('aria-label')
			|| this.#categoryRow?.querySelector(FIELD_CAPTION_SELECTOR)?.textContent?.trim()
			|| ''
		;
	}

	/**
	 * Test anchors for the row and the control of the funnel, marked on every redraw of the control.
	 * The form builds the row id out of the property name, and every manual start trigger of the module
	 * carries a funnel property under that same name: the row of this node is named by the node itself.
	 */
	#markTestNodes(): void
	{
		Dom.attr(this.#categoryRow, 'data-testid', CATEGORY_ROW_TEST_ID);
		Dom.attr(this.#getCategorySelect(), 'data-testid', CATEGORY_SELECT_TEST_ID);
	}

	#toggleCategoryRow(isVisible: boolean): void
	{
		if (!this.#categoryRow)
		{
			return;
		}

		if (isVisible)
		{
			Dom.show(this.#categoryRow);
		}
		else
		{
			Dom.hide(this.#categoryRow);
		}
	}

	#rememberCategoryControlMode(): void
	{
		if (Type.isBoolean(this.#categoryControlMultiple))
		{
			return;
		}

		const select = this.#getCategorySelect();
		if (!select)
		{
			return;
		}

		this.#categoryControlMultiple = select.multiple || select.name === CATEGORY_MULTIPLE_FIELD_NAME;
	}

	#isCategoryControlMultiple(): boolean
	{
		return this.#categoryControlMultiple === true;
	}

	#getCategorySelect(): ?HTMLSelectElement
	{
		return this.#categoryCell?.querySelector(CATEGORY_SELECT_SELECTOR);
	}

	#hasCategoryOptions(): boolean
	{
		const select = this.#getCategorySelect();

		return Boolean(select) && [...select.options].some((option) => Type.isStringFilled(option.value));
	}

	#getDocumentValue(): string
	{
		return this.#form?.querySelector(`[name="${DOCUMENT_FIELD_NAME}"]`)?.value ?? '';
	}

	/**
	 * The property is hidden, and the panel keeps a hidden control of it in the form of the node, so the
	 * preset travels with the form the same way the picked process does.
	 */
	#getOnlyAutomatedSolutionValue(): string
	{
		return this.#form?.querySelector(`[name="${ONLY_AUTOMATED_SOLUTION_FIELD_NAME}"]`)?.value ?? 'N';
	}

	/**
	 * The selector events are global, and a form may hold a selector of another field as well, so the form
	 * alone does not tell the control apart. The dialog of a field carries the name of the input it writes
	 * into (`bizproc/install/js/bizproc/bp-entity-selector/src/index.js`), and every node form of the screen
	 * names the dialog of its own process field alike: the form is what tells those apart.
	 */
	#isEventFromDocumentSelector(item: ?SelectorItem): boolean
	{
		const dialog = item?.getDialog?.();
		if (dialog?.getId?.() !== DOCUMENT_SELECTOR_DIALOG_ID)
		{
			return false;
		}

		const targetNode = dialog.getTargetNode?.();

		return Boolean(this.#form && targetNode && this.#form.contains(targetNode));
	}
}
