import { Tag, Event, ajax, Dom, Type } from 'main.core';
import { BaseEvent } from 'main.core.events';

export class CrmEntityFieldChangedTriggerRenderer
{
	#form: HTMLFormElement = null;
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
		this.#bindEvents();
	}

	#bindEvents(): void
	{
		Event.EventEmitter.subscribe('BX.UI.EntitySelector.Dialog:Item:onSelect', this.#onDocumentChangeHandler);
		Event.EventEmitter.subscribe('BX.UI.EntitySelector.Dialog:Item:onDeselect', this.#onDocumentDeselectHandler);
	}

	#onDocumentChange(event: BaseEvent): void
	{
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

			const selectElement = this.#form.id_Fields;
			if (!selectElement)
			{
				return;
			}

			Dom.clean(selectElement);
			for (const [value, text] of Object.entries(data))
			{
				selectElement.add(Tag.render`<option value="${value}">${text}</option>`);
			}
		}).catch((e) => console.error(e));
	}

	#onDocumentDeselect(): void
	{
		const selectElement = this.#form.id_Fields;
		if (!selectElement)
		{
			return;
		}

		Dom.clean(selectElement);
	}

	destroy(): void
	{
		this.#form = null;
		Event.EventEmitter.unsubscribe('BX.UI.EntitySelector.Dialog:Item:onSelect', this.#onDocumentChangeHandler);
		Event.EventEmitter.unsubscribe('BX.UI.EntitySelector.Dialog:Item:onDeselect', this.#onDocumentDeselectHandler);
	}
}
