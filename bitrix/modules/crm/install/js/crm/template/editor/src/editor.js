import { Loc, Runtime, Type } from 'main.core';
import { BaseEvent, EventEmitter } from 'main.core.events';
import { Editor as MessageServiceEditor } from 'messageservice.template.editor';
import { type EditorOptions } from './editor-options';
import 'ui.design-tokens';
import { EventHandler } from './event-handler';
import type { FilledPlaceholder } from './types';

export class Editor extends EventEmitter
{
	#eventHandler: EventHandler;
	#innerEditor: MessageServiceEditor;

	constructor(params: EditorOptions)
	{
		super();

		this.setEventNamespace('BX.Crm.Template.Editor');

		if (!Type.isDomNode(params.target))
		{
			throw new Error('BX.Crm.Template.Editor: The "target" argument must be DOM node');
		}

		this.#eventHandler = new EventHandler(params);

		const isReadOnly = Boolean(params.isReadOnly ?? false);

		const canUsePreview = Boolean(params.canUsePreview ?? false) && params.entityId > 0;

		this.#innerEditor = new MessageServiceEditor({
			id: params.id,
			target: params.target,
			isReadOnly,
			canUseFieldsDialog: params.canUseFieldsDialog,
			canUseFieldValueInput: params.canUseFieldValueInput,
			canUsePreview,
			messages: {
				selectField: Loc.getMessage('CRM_TEMPLATE_EDITOR_SELECT_FIELD'),
			},
			events: {
				onUpdatePlaceholder: (event: BaseEvent) => this.emit('onUpdatePlaceholder', event.getData()),
				onShowFieldsDialog: (event: BaseEvent) => {
					const proxyEvent = new BaseEvent({
						data: {
							...event.getData(),
							updatePlaceholder: this.#innerEditor.updatePlaceholder.bind(this.#innerEditor),
						},
					});

					return this.#eventHandler.onShowFieldsDialog(proxyEvent);
				},
				onLoadPreview: (event) => {
					this.emit('shown');

					return this.#eventHandler.onLoadPreview(event);
				},
			},
		});

		this.subscribeFromOptions(params.events ?? {});
	}

	setPlaceholders(placeholders: string[]): this
	{
		this.#innerEditor.setPlaceholders(placeholders);

		return this;
	}

	setFilledPlaceholders(filledPlaceholders: FilledPlaceholder[]): this
	{
		this.#innerEditor.setFilledPlaceholders(filledPlaceholders);

		return this;
	}

	// region Public methods
	setHeader(input: string): void
	{
		this.#innerEditor.setHeader(input);
	}

	setBody(input: string): void
	{
		this.#innerEditor.setBody(input);
	}

	setFooter(input: string): void
	{
		this.#innerEditor.setFooter(input);
	}

	getData(): ?Object
	{
		return this.#innerEditor.getData();
	}

	getRawData(): Object
	{
		return this.#innerEditor.getRawData();
	}

	destroy(): void
	{
		this.#eventHandler.destroy();
		this.#eventHandler = null;

		this.#innerEditor.destroy();
		this.#innerEditor = null;

		this.unsubscribeAll();

		Runtime.destroy(this);
	}
	// endregion
}
