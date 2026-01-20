import { Type, Dom, Event, Tag } from 'main.core';
import { BannerDispatcher } from 'ui.banner-dispatcher';
import { Popup, PopupManager } from 'main.popup';
import './style.css';

export type MailGuideOptions = {
	id: string,
	title: ?string,
	description: ?string,
	userOptionName: ?string,
	bindElement: HTMLElement;
	addHighlighter: boolean;
	highlighterBorderRadius: number,
}

const defaultHighlighterBorderRadius = 8;

export class MailGuide
{
	#popup: Popup = null;
	#id: string;
	#userOptionName: ?string;
	#bindElement: ?HTMLElement = null;
	#title: ?string = null;
	#description: ?string = null;
	#addHighlighter: boolean = false;
	#highlighterBorderRadius: ?number = null;
	#highlighter: ?HTMLElement;

	constructor(options: MailGuideOptions)
	{
		if (Type.isObject(options))
		{
			this.#id = options.id;
			this.#bindElement = options.bindElement;
			this.#userOptionName = options.userOptionName;
			this.#title = options.title;
			this.#description = options.description;
			this.#addHighlighter = options.addHighlighter;
			if (this.#addHighlighter)
			{
				this.#highlighter = Tag.render`<span class="ui-highlighter"></span>`;
				this.#highlighterBorderRadius = `${options.highlighterBorderRadius ?? defaultHighlighterBorderRadius}px`;
			}
		}
	}

	createGuidePopup(onDone: Function): Popup
	{
		return PopupManager.create({
			id: this.#id,
			className: 'popup-window-dark',
			background: '#085DC1',
			closeIcon: true,
			autoHide: false,
			closeByEsc: true,
			padding: 12,
			borderRadius: 20,
			contentPadding: 0,
			offsetTop: 10,
			offsetLeft: -78,
			angle: {
				offset: 205,
				position: 'top',
			},
			bindElement: this.#bindElement,
			bindOptions: {
				forceBindPosition: false,
			},
			width: 372,
			content: this.getContent(),
			events: {
				onShow: () => {
					if (this.#addHighlighter)
					{
						this.#prepareHighlighter();
					}
				},
				onClose: () => {
					onDone();
					if (this.#addHighlighter)
					{
						this.#removeHighlighter();
					}
				},
			},
		});
	}

	getContent(): HTMLElement
	{
		return Dom.create('div', {
			props: {
				className: 'mail-notification-container',
			},
			children: [
				Dom.create('div', {
					props: {
						className: 'mail-notification-container__image-wrapper',
					},
					children: [
						this.#renderImage(),
					],
				}),
				Dom.create('div', {
					props: {
						className: 'mail-notification-content',
					},
					children: [
						this.#getMessageContainer(this.#title, this.#description),
					],
				}),
			],
		});
	}

	#renderImage(): HTMLElement
	{
		return Dom.create('div', {
			props: {
				className: 'mail-notification-container__image',
			},
		});
	}

	#getMessageContainer(title: ?string, description: ?string): HTMLElement
	{
		const children = [];

		if (title)
		{
			children.push(Dom.create('h4', {
				props: {
					className: 'mail-notification-content__title',
				},
				html: title,
			}));
		}

		if (description)
		{
			children.push(Dom.create('span', {
				props: {
					className: 'mail-notification-content__description',
				},
				html: description,
			}));
		}

		return Dom.create('div', {
			props: {
				className: 'mail-notification-content-wrapper',
			},
			children,
		});
	}

	show(): void
	{
		if (!this.#bindElement)
		{
			return;
		}

		BannerDispatcher.normal.toQueue((onDone) => {
			this.#popup = this.createGuidePopup(onDone);
			this.#popup.show();
			this.#popup.zIndexComponent.setZIndex(400);

			if (this.#userOptionName)
			{
				BX.userOptions.save('mail.guide', this.#userOptionName, null, 'Y');
			}

			Event.bind(this.#bindElement, 'click', () => {
				this.#popup?.close();
			});
		});
	}

	#prepareHighlighter(): void
	{
		Dom.append(this.#highlighter, this.#bindElement);
		Dom.addClass(this.#bindElement, '--border-md');
		Dom.addClass(this.#bindElement, '--glow-md');
		Dom.style(this.#highlighter, '--ui-highlighter-radius', this.#highlighterBorderRadius);
	}

	#removeHighlighter(): void
	{
		Dom.remove(this.#highlighter);
	}
}
