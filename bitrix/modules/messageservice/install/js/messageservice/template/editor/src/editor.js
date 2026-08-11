import { Dom, Event, Loc, Runtime, Tag, Text, Type } from 'main.core';
import { BaseEvent, EventEmitter } from 'main.core.events';

import { MenuPopup } from './menu-popup';
import { Previewer } from './previewer';
import { renderLayout } from './render';
import { TextPopup } from './text-popup';
import { type EditorOptions, type FilledPlaceholder } from './types';
import { getPlainText } from './utils';

import './editor.css';

const HEADER_POSITION = 'HEADER';
const PREVIEW_POSITION = 'PREVIEW';
const FOOTER_POSITION = 'FOOTER';

export class Editor extends EventEmitter
{
	#id: ?string;
	#target: HTMLElement = null;
	#canUseFieldsDialog: boolean = true;
	#canUseFieldValueInput: boolean = true;
	#isReadOnly: boolean = false;
	#canUsePreview: boolean = false;
	#entityType: string;
	#messages: { selectField?: string } = {};

	#placeholders: string[] = [];
	#filledPlaceholders: FilledPlaceholder[] = [];
	#headerContainerEl: ?HTMLElement = null;
	#bodyContainerEl: ?HTMLElement = null;
	#footerContainerEl: ?HTMLElement = null;

	#headerRaw: ?string = null;
	#bodyRaw: ?string = null;
	#footerRaw: ?string = null;

	#popupMenu: ?Menu = null;
	#inputPopup: ?Popup = null;

	#previewer: ?Previewer = null;

	constructor(params: EditorOptions)
	{
		super();

		this.setEventNamespace('BX.MessageService.Template.Editor');

		this.#id = params.id || `messageservice-template-editor-${Text.getRandom()}`;
		this.#target = params.target;
		this.#entityType = params.entityType;
		this.#messages = params.messages ?? {};

		this.#canUseFieldsDialog = Boolean(params.canUseFieldsDialog ?? true);
		this.#canUseFieldValueInput = Boolean(params.canUseFieldValueInput ?? true);
		this.#isReadOnly = Boolean(params.isReadOnly ?? false);
		this.#canUsePreview = Boolean(params.canUsePreview ?? false);

		this.subscribeFromOptions(params.events ?? {});

		this.#createContainer();
	}

	setPlaceholders(placeholders: string[]): this
	{
		this.#placeholders = placeholders;

		return this;
	}

	setFilledPlaceholders(filledPlaceholders: FilledPlaceholder[]): this
	{
		this.#filledPlaceholders = filledPlaceholders;

		return this;
	}

	setHeader(input: string): void
	{
		if (!Type.isStringFilled(input))
		{
			return;
		}

		this.#headerRaw = input;
		Dom.clean(this.#headerContainerEl);
		Dom.append(this.#createContainerWithSelectors(input), this.#headerContainerEl);
	}

	setBody(input: string): void
	{
		if (!Type.isStringFilled(input))
		{
			return;
		}

		this.#bodyRaw = input;
		Dom.clean(this.#bodyContainerEl);
		Dom.append(this.#createContainerWithSelectors(input), this.#bodyContainerEl);
	}

	setFooter(input: string): void
	{
		if (!Type.isStringFilled(input))
		{
			return;
		}

		this.#footerRaw = input;
		Dom.clean(this.#footerContainerEl);
		Dom.append(this.#createContainerWithSelectors(input), this.#footerContainerEl);
	}

	getData(): ?Object
	{
		if (this.#placeholders === null)
		{
			return null;
		}

		return {
			header: getPlainText(this.#headerRaw || '', this.#getPlaceholders(HEADER_POSITION), this.#filledPlaceholders),
			body: getPlainText(this.#bodyRaw || '', this.#getPlaceholders(PREVIEW_POSITION), this.#filledPlaceholders),
			footer: getPlainText(this.#footerRaw || '', this.#getPlaceholders(FOOTER_POSITION), this.#filledPlaceholders),
		};
	}

	getRawData(): Object
	{
		return {
			header: this.#headerRaw,
			body: this.#bodyRaw,
			footer: this.#footerRaw,
		};
	}

	destroy(): void
	{
		this.#previewer?.destroy();
		this.#previewer = null;

		this.#inputPopup?.destroy();
		this.#inputPopup = null;

		this.#popupMenu?.destroy();
		this.#popupMenu = null;

		this.unsubscribeAll();

		Runtime.destroy(this);
	}

	#createContainer(): void
	{
		if (!this.#target)
		{
			return;
		}

		const { root, header, body, footer, preview } = renderLayout({
			id: this.#id,
			isReadOnly: this.#isReadOnly,
			canUsePreview: this.#canUsePreview,
		});

		this.#headerContainerEl = header;
		this.#bodyContainerEl = body;
		this.#footerContainerEl = footer;

		if (this.#canUsePreview && preview)
		{
			Event.bind(preview, 'click', this.#onPreviewTemplate.bind(this));
		}

		Dom.clean(this.#target);
		Dom.append(root, this.#target);
	}

	#createContainerWithSelectors(input: string, position: string = PREVIEW_POSITION): ?HTMLElement
	{
		const placeholders = this.#getPlaceholders(position);
		if (placeholders === null)
		{
			return null;
		}

		const container = this.#getInputContainer(input, position);

		placeholders.forEach((placeholder, key) => {
			const element = [...container.childNodes].find(
				(node) => node.dataset && Number(node.dataset.templatePlaceholder) === key,
			);

			if (!element)
			{
				return;
			}

			if (this.#isReadOnly)
			{
				return;
			}

			Event.bind(element, 'click', (event) => {
				this.#onPlaceholderClick(event);
			});
		});

		return container;
	}

	#onPlaceholderClick(event: PointerEvent): void
	{
		this.#inputPopup?.destroy();

		const placeholderId = this.#getPlaceholderId(event.target);
		const filledPlaceholder = this.#getFilledPlaceholderByElement(event.target, PREVIEW_POSITION);
		const isTextItemFirst = Type.isStringFilled(filledPlaceholder?.FIELD_VALUE);

		const onShow = this.#animatePillOnDialogShow.bind(this, event.target);
		const onHide = this.#animatePillOnDialogHide.bind(this, event.target);

		const showDialogCallback = () => {
			this.emit('onShowFieldsDialog', { placeholderId, filledPlaceholder, onShow, onHide, bindElement: event.target });
		};

		if (this.#canUseFieldsDialog && this.#canUseFieldValueInput)
		{
			this.#popupMenu = new MenuPopup({
				bindElement: event.target,
				isTextItemFirst,
				messages: this.#messages,
				events: {
					onEditorItemClick: showDialogCallback,
					onTextItemClick: (clickEvent: BaseEvent) => {
						this.#onShowInputPopup(clickEvent.getData().bindElement, onShow, onHide);
					},
				},
			});

			this.#popupMenu.show();
		}
		else if (this.#canUseFieldsDialog)
		{
			showDialogCallback();
		}
		else if (this.#canUseFieldValueInput)
		{
			this.#onShowInputPopup(event.target, onShow, onHide);
		}
	}

	#animatePillOnDialogShow(element: HTMLElement): void
	{
		const keyframes = [
			{ transform: 'rotate(0)' },
			{ transform: 'rotate(90deg)' },
			{ transform: 'rotate(180deg)' },
		];
		const options = {
			duration: 200,
			pseudoElement: '::after',
		};

		element.animate(keyframes, options);
		Dom.addClass(element, '--flipped');
	}

	#animatePillOnDialogHide(element: HTMLElement): void
	{
		const keyframes = [
			{ transform: 'rotate(180deg)' },
			{ transform: 'rotate(90deg)' },
			{ transform: 'rotate(0)' },
		];
		const options = {
			duration: 200,
			pseudoElement: '::after',
		};

		element.animate(keyframes, options);
		Dom.removeClass(element, '--flipped');
	}

	#onShowInputPopup(bindElement: HTMLElement, onShow: Function, onHide: Function): void
	{
		const filledPlaceholder = this.#getFilledPlaceholderByElement(bindElement);
		const value = Type.isStringFilled(filledPlaceholder?.FIELD_VALUE) ? filledPlaceholder.FIELD_VALUE : '';

		this.#inputPopup = new TextPopup({
			bindElement,
			value,
			events: {
				onShow,
				onHide,
				onApply: (event: BaseEvent) => {
					this.#onApplyInputPopup(event.getData().value, bindElement);
				},
			},
		});

		this.#inputPopup.show();
	}

	#onApplyInputPopup(value: string, bindElement: HTMLElement): void
	{
		const placeholderId = this.#getPlaceholderIdByElement(bindElement, PREVIEW_POSITION);

		const filledPlaceholder: FilledPlaceholder = {
			PLACEHOLDER_ID: placeholderId,
			TITLE: value,
			FIELD_VALUE: value,
			FIELD_ENTITY_TYPE: this.#entityType,
		};

		this.updatePlaceholder(filledPlaceholder);
	}

	#onPreviewTemplate(event: PointerEvent): void
	{
		this.#previewer ??= new Previewer({
			events: {
				onLoadPreview: async (loadEvent: BaseEvent) => {
					const eventResults = await this.emitAsync('onLoadPreview', loadEvent.getData());

					return eventResults.shift();
				},
			},
		});

		this.#previewer.preview(this.getData().body, event.target);
	}

	#getInputContainer(input: string, position: string): ?HTMLElement
	{
		const placeholders = this.#getPlaceholders(position);
		if (placeholders === null)
		{
			return null;
		}

		let safeInput = Text.encode(input);

		let i = 0;
		placeholders.forEach((placeholder) => {
			const filledPlaceholder = this.#getFilledPlaceholderById(placeholder);

			let title = Loc.getMessage('MESSAGESERVICE_TEMPLATE_EDITOR_EMPTY_PLACEHOLDER_LABEL');
			let spanClass = 'messageservice-template-editor-element-pill';
			if (filledPlaceholder)
			{
				title = Text.encode(this.#getFilledPlaceholderTitle(filledPlaceholder));
				spanClass += ' --selected';
			}

			const replaceValue = `<span class="${spanClass}" data-test-role="placeholder" data-template-placeholder="${i++}">${title}</span>`;

			// eslint-disable-next-line no-param-reassign
			safeInput = safeInput.replace(placeholder, replaceValue);
		});

		return Tag.render`<div>${safeInput}</div>`;
	}

	#getFilledPlaceholderTitle(filledPlaceholder): string
	{
		if (
			Type.isStringFilled(filledPlaceholder.PARENT_TITLE)
			&& Type.isStringFilled(filledPlaceholder.TITLE))
		{
			return `${filledPlaceholder.PARENT_TITLE}: ${filledPlaceholder.TITLE}`;
		}

		if (Type.isStringFilled(filledPlaceholder.TITLE))
		{
			return filledPlaceholder.TITLE;
		}

		if (Type.isStringFilled(filledPlaceholder.FIELD_NAME))
		{
			return filledPlaceholder.FIELD_NAME;
		}

		return filledPlaceholder.FIELD_VALUE;
	}

	#getPlaceholders(position: string): ?[]
	{
		const allPlaceholders = Type.isPlainObject(this.#placeholders) ? this.#placeholders : {};
		const placeholders = Type.isArrayFilled(allPlaceholders[position]) ? allPlaceholders[position] : [];

		return Type.isArrayLike(placeholders) ? placeholders : null;
	}

	#getFilledPlaceholderById(id: string): ?FilledPlaceholder
	{
		return this.#filledPlaceholders.find((placeholder) => placeholder.PLACEHOLDER_ID === id);
	}

	#getFilledPlaceholderByElement(element: HTMLElement, position: string = PREVIEW_POSITION): ?FilledPlaceholder
	{
		const placeholderId = this.#getPlaceholderIdByElement(element, position);

		return this.#getFilledPlaceholderById(placeholderId);
	}

	#getPlaceholderIdByElement(element: HTMLElement, position: string = PREVIEW_POSITION): ?string
	{
		const placeholders = this.#getPlaceholders(position);

		return placeholders[element.dataset.templatePlaceholder] ?? null;
	}

	#getPlaceholderIndexById(id: string, position: string = PREVIEW_POSITION): number
	{
		const placeholders = this.#getPlaceholders(position);

		return placeholders.indexOf(id);
	}

	updatePlaceholder(filledPlaceholder: FilledPlaceholder): void
	{
		const index = this.#getPlaceholderIndexById(filledPlaceholder.PLACEHOLDER_ID);
		if (index < 0)
		{
			return;
		}

		const element = this.#target.querySelector(`[data-template-placeholder="${index}"]`);

		Dom.adjust(element, {
			text: Text.encode(this.#getFilledPlaceholderTitle(filledPlaceholder)),
			props: {
				className: 'messageservice-template-editor-element-pill --selected',
			},
		});

		this.#adjustFilledPlaceholders(filledPlaceholder);
		this.emit('onUpdatePlaceholder', { filledPlaceholder });
	}

	#getPlaceholderId(element: HTMLElement): ?string
	{
		return this.#getPlaceholderIdByElement(element, PREVIEW_POSITION);
	}

	#adjustFilledPlaceholders(filledPlaceholder: FilledPlaceholder): void
	{
		const existingFilledPlaceholder = this.#getFilledPlaceholderById(filledPlaceholder.PLACEHOLDER_ID);

		if (existingFilledPlaceholder)
		{
			existingFilledPlaceholder.FIELD_NAME = filledPlaceholder.FIELD_NAME ?? null;
			existingFilledPlaceholder.TITLE = filledPlaceholder.TITLE;
			existingFilledPlaceholder.PARENT_TITLE = filledPlaceholder.PARENT_TITLE;
			existingFilledPlaceholder.FIELD_ENTITY_TYPE = filledPlaceholder.FIELD_ENTITY_TYPE;
			existingFilledPlaceholder.FIELD_VALUE = filledPlaceholder.FIELD_VALUE ?? null;
		}
		else
		{
			this.#filledPlaceholders.push(Runtime.clone(filledPlaceholder));
		}
	}
}
