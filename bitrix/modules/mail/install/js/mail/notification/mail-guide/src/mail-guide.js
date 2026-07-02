import { Type, Dom, Event, Tag } from 'main.core';
import { BannerDispatcher } from 'ui.banner-dispatcher';
import { type Popup, PopupManager } from 'main.popup';
import './style.css';

export type MailGuideOptions = {
	id: string,
	title: ?string,
	description: ?string,
	userOptionName: ?string,
	bindElement: HTMLElement;
	addHighlighter: boolean;
	highlighterBorderRadius: number,
	showImage: boolean,
	width: ?number,
}

const defaultHighlighterBorderRadius = 8;

const imageClassMap = {
	'connection_request_guide_shown': 'mail-notification-container__image--connection-request',
	'all_mail_mode_guide_shown': 'mail-notification-container__image--all-mail-mode',
};

const modifierClassMap = {
	'connection_request_guide_shown': 'mail-notification-container--connection-request',
	'all_mail_mode_guide_shown': 'mail-notification-container--all-mail-mode',
};

export class MailGuide
{
	#popup: Popup = null;
	#id: string;
	#userOptionName: ?string;
	#bindElement: ?HTMLElement = null;
	#title: ?string = null;
	#description: ?string = null;
	#addHighlighter: boolean = false;
	#showImage: boolean = true;
	#highlighterBorderRadius: ?number = null;
	#highlighter: ?HTMLElement;
	#width: ?number = null;

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
			this.#showImage = options.showImage !== false;
			this.#width = options.width ?? null;
			if (this.#addHighlighter)
			{
				this.#highlighter = Tag.render`<span class="ui-highlighter"></span>`;
				this.#highlighterBorderRadius = `${options.highlighterBorderRadius ?? defaultHighlighterBorderRadius}px`;
			}
		}
	}

	createGuidePopup(onDone: Function): Popup
	{
		const compactMode = !this.#showImage;

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
			offsetLeft: compactMode ? 0 : -78,
			angle: {
				offset: compactMode ? 40 : 205,
				position: 'top',
			},
			bindElement: this.#bindElement,
			bindOptions: {
				forceBindPosition: false,
			},
			width: this.#width ?? (compactMode ? 300 : 372),
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
		const modifier = modifierClassMap[this.#userOptionName] ?? '';
		const containerClass = `mail-notification-container ${modifier}`.trim();

		const children = [];

		if (this.#showImage)
		{
			children.push(Dom.create('div', {
				props: {
					className: 'mail-notification-container__image-wrapper',
				},
				children: [
					this.#renderImage(),
				],
			}));
		}

		children.push(Dom.create('div', {
			props: {
				className: 'mail-notification-content',
			},
			children: [
				this.#getMessageContainer(this.#title, this.#description),
			],
		}));

		return Dom.create('div', {
			props: {
				className: containerClass,
			},
			children,
		});
	}

	#renderImage(): HTMLElement
	{
		const className = imageClassMap[this.#userOptionName] ?? 'mail-notification-container__image';

		return Dom.create('div', {
			props: {
				className,
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
