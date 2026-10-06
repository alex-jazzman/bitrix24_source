import { Tag, Event, ajax, Dom, Type, Runtime } from 'main.core';
import type { BaseEvent } from 'main.core.events';

import { ReactionModeControl } from './reaction-mode-control';
import type { ActivityField, RadioButtonExports } from './reaction-mode-control';

const RADIO_BUTTON_EXTENSION = 'ui.system.radiobutton';

export class CrmEntityFieldChangedTriggerRenderer
{
	#form: HTMLFormElement = null;
	#categoryRow: HTMLElement = null;
	#categoryCell: HTMLElement = null;
	#reactionMode: ?ReactionModeControl = null;
	#radioButtonExtension: ?Promise<RadioButtonExports> = null;
	#onDocumentChangeHandler: Function = null;
	#onDocumentDeselectHandler: Function = null;

	constructor()
	{
		this.#onDocumentChangeHandler = this.#onDocumentChange.bind(this);
		this.#onDocumentDeselectHandler = this.#onDocumentDeselect.bind(this);
		// The editor builds the renderer before it renders the controls, so the primitive of the mode
		// switcher loads alongside them instead of once the form is already on screen. The editor builds
		// the renderer without a try/catch, so the call is deferred and its failure stays a rejection.
		this.#radioButtonExtension = Promise.resolve().then(() => Runtime.loadExtension(RADIO_BUTTON_EXTENSION));
		// A form without the mode control never awaits it, and the switcher reports its own failure.
		this.#radioButtonExtension.catch(() => null);
	}

	// Not an async method: parts of the editor call it without awaiting the result, so the form is left
	// ready once the call returns. Only the mode switcher is rendered later, through the promise.
	afterFormRender(form: HTMLFormElement, activityFields: { [key: string]: ActivityField } = {}): Promise<void>
	{
		this.#form = form;
		this.#categoryRow = form.querySelector('#row_categoryId');
		this.#categoryCell = this.#categoryRow?.querySelector('.field-row > div') ?? this.#categoryRow?.querySelector('td:last-child');
		this.#bindEvents();
		this.#syncCategoryRowVisibility();
		setTimeout(() => this.#syncCategoryRowVisibility());

		this.#reactionMode = ReactionModeControl.find(form, activityFields, this.#radioButtonExtension);

		return this.#reactionMode?.apply() ?? Promise.resolve();
	}

	#bindEvents(): void
	{
		Event.EventEmitter.subscribe('BX.UI.EntitySelector.Dialog:Item:onSelect', this.#onDocumentChangeHandler);
		Event.EventEmitter.subscribe('BX.UI.EntitySelector.Dialog:Item:onDeselect', this.#onDocumentDeselectHandler);
	}

	#getFieldsSelect(): ?HTMLSelectElement
	{
		return this.#form?.id_Fields ?? null;
	}

	#renderFieldsControl(options: {[key: string]: string}): void
	{
		const selectElement = this.#getFieldsSelect();
		if (!selectElement)
		{
			return;
		}

		Dom.clean(selectElement);
		for (const [value, text] of Object.entries(options))
		{
			const option = Tag.render`<option value="${value}"></option>`;
			option.textContent = text;
			selectElement.add(option);
		}
	}

	#getCurrentCategorySelect(): ?HTMLSelectElement
	{
		return this.#categoryCell?.querySelector('select[name="categoryId"]');
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
		this.#toggleCategoryRow(this.#hasCategoryOptions());
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
		return {
			Type: 'select',
			FieldName: 'categoryId',
			Options: options,
			Required: false,
			AllowSelection: false,
		};
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
		this.#toggleCategoryRow(Object.keys(options).length > 0);
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

		ajax.runAction(
			'bizproc.activity.request',
			{
				data: {
					documentType: ['bizproc', 'Bitrix\\Bizproc\\Public\\Entity\\Document\\Workflow', 'WORKFLOW'],
					activity: 'CrmEntityFieldChangedTrigger',
					params: { document: item.id, form_name: 'document' },
				},
			},
		).then((response) => {
			const data = response.data;
			if (!Type.isPlainObject(data))
			{
				return;
			}

			this.#renderCategoryControl(data.categories ?? {});
			this.#renderFieldsControl(data.fields ?? {});
		}).catch((e) => console.error(e));
	}

	#onDocumentDeselect(event: BaseEvent): void
	{
		if (!this.#isEventFromCurrentForm(event))
		{
			return;
		}

		this.#renderCategoryControl({});
		this.#renderFieldsControl({});
	}

	destroy(): void
	{
		this.#form = null;
		this.#categoryRow = null;
		this.#categoryCell = null;
		this.#reactionMode?.destroy();
		this.#reactionMode = null;
		Event.EventEmitter.unsubscribe('BX.UI.EntitySelector.Dialog:Item:onSelect', this.#onDocumentChangeHandler);
		Event.EventEmitter.unsubscribe('BX.UI.EntitySelector.Dialog:Item:onDeselect', this.#onDocumentDeselectHandler);
	}
}
