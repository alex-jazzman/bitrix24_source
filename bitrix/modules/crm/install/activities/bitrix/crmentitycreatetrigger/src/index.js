import { Event, ajax, Dom, Type, Reflection } from 'main.core';
import type { BaseEvent } from 'main.core.events';

export class CrmEntityCreateTriggerRenderer
{
	#form: HTMLFormElement = null;
	#categoryRow: HTMLElement = null;
	#categoryCell: HTMLElement = null;
	#categoryControlMultiple: ?boolean = null;
	#onDocumentChangeHandler: Function = null;
	#onDocumentDeselectHandler: Function = null;

	constructor()
	{
		this.#onDocumentChangeHandler = this.#onDocumentChange.bind(this);
		this.#onDocumentDeselectHandler = this.#onDocumentDeselect.bind(this);
	}

	afterFormRender(form: HTMLFormElement): void
	{
		this.#form = form;
		this.#categoryRow = form.querySelector('#row_categoryId');
		this.#categoryCell = this.#categoryRow?.querySelector('.field-row > div') ?? this.#categoryRow?.querySelector('td:last-child');
		this.#rememberCategoryControlMode();
		this.#bindEvents();
		this.#syncCategoryRowVisibility();
		setTimeout(() => this.#syncCategoryRowVisibility());
	}

	#bindEvents(): void
	{
		Event.EventEmitter.subscribe('BX.UI.EntitySelector.Dialog:Item:onSelect', this.#onDocumentChangeHandler);
		Event.EventEmitter.subscribe('BX.UI.EntitySelector.Dialog:Item:onDeselect', this.#onDocumentDeselectHandler);
	}

	#getCurrentCategorySelect(): ?HTMLSelectElement
	{
		return this.#categoryCell?.querySelector('select[name="categoryId"], select[name="categoryId[]"]');
	}

	#getCurrentDocumentValue(): string
	{
		return this.#form?.querySelector('[name="Document"]')?.value ?? '';
	}

	#resetCategorySelection(): void
	{
		const selectElement = this.#getCurrentCategorySelect();
		if (!selectElement)
		{
			return;
		}

		selectElement.value = '';
		selectElement.selectedIndex = 0;
	}

	#hasCategoryOptions(): boolean
	{
		const selectElement = this.#getCurrentCategorySelect();
		if (!selectElement)
		{
			return false;
		}

		return Array.from(selectElement.options).some((option) => option.value !== '');
	}

	#syncCategoryRowVisibility(): void
	{
		this.#toggleCategoryRow(this.#hasCategoryOptions() || Type.isStringFilled(this.#getCurrentDocumentValue()));
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

	#createCategoryProperty(options: {[key: string]: string}): Object
	{
		this.#rememberCategoryControlMode();

		return {
			Type: 'select',
			FieldName: 'categoryId',
			Multiple: this.#categoryControlMultiple === true,
			Options: options,
			Required: false,
			AllowSelection: false,
		};
	}

	#rememberCategoryControlMode(): void
	{
		if (Type.isBoolean(this.#categoryControlMultiple))
		{
			return;
		}

		const select = this.#getCurrentCategorySelect();
		if (!select)
		{
			return;
		}

		this.#categoryControlMultiple = select.multiple || select.name === 'categoryId[]';
	}

	#renderCategoryControl(options: {[key: string]: string}): void
	{
		if (!this.#categoryCell)
		{
			return;
		}

		const control = BX.Bizproc.FieldType.renderControl(
			['bizproc', 'Bitrix\\Bizproc\\Public\\Entity\\Document\\Workflow', 'WORKFLOW'],
			this.#createCategoryProperty(options),
			'categoryId',
			'',
		);

		Dom.clean(this.#categoryCell);
		Dom.append(control, this.#categoryCell);
		this.#resetCategorySelection();
		this.#toggleCategoryRow(Object.keys(options).length > 0 || Type.isStringFilled(this.#getCurrentDocumentValue()));
	}

	#isEventFromCurrentForm(event: BaseEvent): boolean
	{
		const { item } = event.getData();
		const targetNode = item?.getDialog?.()?.getTargetNode?.();

		return Boolean(this.#form && targetNode && this.#form.contains(targetNode));
	}

	#onDocumentChange(event: BaseEvent): void
	{
		if (!this.#isEventFromCurrentForm(event))
		{
			return;
		}

		const { item } = event.getData();
		const requestData = {
			documentType: ['bizproc', 'Bitrix\\Bizproc\\Public\\Entity\\Document\\Workflow', 'WORKFLOW'],
			activity: 'CrmEntityCreateTrigger',
			params: { document: item.id, form_name: 'document' },
		};

		ajax.runAction(
			'bizproc.activity.request',
			{
				// The Nodes editor names its template: the server grants the request by the right on it.
				data: Reflection.getClass('BX.Bizproc.EditorTemplateContext')?.appendTo(requestData) ?? requestData,
			},
		).then((response) => {
			const data = response.data;
			if (!Type.isPlainObject(data))
			{
				return;
			}

			this.#renderCategoryControl(data);
		}).catch((e) => console.error(e));
	}

	#onDocumentDeselect(event: BaseEvent): void
	{
		if (!this.#isEventFromCurrentForm(event))
		{
			return;
		}

		this.#renderCategoryControl({});
	}

	destroy(): void
	{
		this.#form = null;
		this.#categoryRow = null;
		this.#categoryCell = null;
		this.#categoryControlMultiple = null;
		Event.EventEmitter.unsubscribe('BX.UI.EntitySelector.Dialog:Item:onSelect', this.#onDocumentChangeHandler);
		Event.EventEmitter.unsubscribe('BX.UI.EntitySelector.Dialog:Item:onDeselect', this.#onDocumentDeselectHandler);
	}
}
