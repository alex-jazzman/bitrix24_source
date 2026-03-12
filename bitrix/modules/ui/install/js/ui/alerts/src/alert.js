import { Dom, Tag, Type } from 'main.core';
import AlertColor from './alert-color';
import AlertSize from './alert-size';
import AlertIcon from './alert-icon';

import 'ui.design-tokens';

export type AlertOptions = {
	text: string;
	color: AlertColor;
	size: AlertSize;
	icon: AlertIcon;
	customClass: string;
	closeBtn: boolean;
	animated: boolean;
	beforeMessageHtml: HTMLElement;
	afterMessageHtml: HTMLElement;
};

export default class Alert
{
	static Color = AlertColor;
	static Size = AlertSize;
	static Icon = AlertIcon;

	#text: string;
	#color: string;
	#size: string;
	#icon: string;
	#closeBtn: boolean;
	#animated: boolean;
	#customClass: string;
	#beforeMessageHtml: HTMLElement;
	#afterMessageHtml: HTMLElement;

	#container: ?HTMLElement;
	#textContainer: HTMLElement;
	#classList: string;

	#closeNode: ?HTMLElement;

	constructor(options: AlertOptions)
	{
		this.#text = options.text;
		this.#color = options.color;
		this.#size = options.size;
		this.#icon = options.icon;
		this.#closeBtn = options.closeBtn === true;
		this.#animated = options.animated === true;
		this.#customClass = options.customClass;
		this.#beforeMessageHtml = Type.isElementNode(options.beforeMessageHtml) ? options.beforeMessageHtml : undefined;
		this.#afterMessageHtml = Type.isElementNode(options.afterMessageHtml) ? options.afterMessageHtml : undefined;

		this.setText(this.#text);
		this.setSize(this.#size);
		this.setIcon(this.#icon);
		this.setColor(this.#color);
		this.setCloseBtn(this.#closeBtn);
		this.setCustomClass(this.#customClass);
	}

	// region COLOR
	setColor(color: string): void
	{
		this.#color = color;
		this.#setClassList();
	}

	getColor(): string
	{
		return this.#color;
	}

	// endregion

	// region SIZE
	setSize(size: string)
	{
		this.#size = size;
		this.#setClassList();
	}

	getSize(): string
	{
		return this.#size;
	}

	// endregion

	// region ICON
	setIcon(icon: string): void
	{
		this.#icon = icon;
		this.#setClassList();
	}

	getIcon(): string
	{
		return this.#icon;
	}

	// endregion

	// region TEXT
	setText(text: string): void
	{
		if (Type.isStringFilled(text))
		{
			this.#text = text;
			this.getTextContainer().innerHTML = text;
		}
	}

	getText(): string
	{
		return this.#text;
	}

	getTextContainer(): HTMLElement
	{
		if (!this.#textContainer)
		{
			this.#textContainer = Dom.create('span', {
				props: {
					className: 'ui-alert-message',
				},
				html: this.#text,
			});
		}

		return this.#textContainer;
	}

	// endregion

	// region CLOSE BTN
	setCloseBtn(closeBtn: boolean)
	{
		this.#closeBtn = closeBtn;
	}

	getCloseBtn(): ?HTMLElement
	{
		if (this.#closeBtn !== true)
		{
			return undefined;
		}

		if ((!this.#closeNode) && (this.#closeBtn === true))
		{
			this.#closeNode = Dom.create('span', {
				props: { className: 'ui-alert-close-btn' },
				events: {
					click: this.#handleCloseBtnClick.bind(this),
				},
			});
		}

		return this.#closeNode;
	}

	#handleCloseBtnClick(): void
	{
		if (this.#animated === true)
		{
			this.animateClosing();
		}
		else
		{
			Dom.remove(this.#container);
		}
	}

	// endregion

	// region Custom HTML
	setBeforeMessageHtml(element: HTMLElement): void
	{
		if (Type.isElementNode(element) && element !== false)
		{
			this.#beforeMessageHtml = element;
		}
	}

	getBeforeMessageHtml(): ?HTMLElement
	{
		return this.#beforeMessageHtml;
	}

	setAfterMessageHtml(element: HTMLElement): void
	{
		if (Type.isElementNode(element) && element !== false)
		{
			this.#afterMessageHtml = element;
		}
	}

	getAfterMessageHtml(): ?HTMLElement
	{
		return this.#afterMessageHtml;
	}

	// endregion

	// region CUSTOM CLASS
	setCustomClass(customClass: string): void
	{
		this.#customClass = customClass;
		this.updateClassList();
	}

	getCustomClass(): string
	{
		return this.#customClass;
	}

	// endregion

	// region CLASS LIST
	#setClassList()
	{
		const classList = ['ui-alert'];

		classList.push(
			this.getColor(),
			this.getSize(),
			this.getIcon(),
			this.getCustomClass(),
		);

		this.#classList = classList.filter((val) => val).join(' ').trim();

		this.updateClassList();
	}

	#getClassList(): string
	{
		return this.#classList;
	}

	updateClassList(): void
	{
		if (!this.#container)
		{
			this.getContainer();
		}

		this.#container.setAttribute('class', this.#classList);
	}

	// endregion

	// region ANIMATION
	animateOpening(): void
	{
		Dom.style(this.#container, {
			overflow: 'hidden',
			height: 0,
			paddingTop: 0,
			paddingBottom: 0,
			marginBottom: 0,
			opacity: 0,
		});

		setTimeout(
			() => {
				Dom.style(this.#container, {
					overflow: 'hidden',
					height: `${this.#container.scrollHeight}px`,
					paddingTop: null,
					paddingBottom: null,
					marginBottom: null,
					opacity: null,
				});
				Dom.style(this.#container, {
					height: null,
				});
			},
			10,
		);

		setTimeout(
			() => {
				Dom.style(this.#container, {
					height: null,
				});
			},
			200,
		);
	}

	animateClosing()
	{
		Dom.style(this.#container, {
			overflow: 'hidden',
		});

		const alertWrapPos = Dom.getPosition(this.#container);
		Dom.style(this.#container, {
			height: `${alertWrapPos.height}px`,
		});

		setTimeout(
			() => {
				Dom.style(this.#container, {
					height: 0,
					paddingTop: 0,
					paddingBottom: 0,
					marginBottom: 0,
					opacity: 0,
				});
			},
			10,
		);

		setTimeout(
			() => {
				Dom.remove(this.#container);
			},
			260,
		);
	}

	// endregion

	show(): void
	{
		this.animateOpening();
	}

	hide(): void
	{
		this.animateClosing();
	}

	getContainer(): HTMLElement
	{
		if (!this.#container)
		{
			this.#container = Tag.render`<div class="${this.#getClassList()}">${this.getTextContainer()}</div>`;
		}

		if (this.#animated === true)
		{
			this.animateOpening();
		}

		if (this.#closeBtn === true)
		{
			Dom.append(this.getCloseBtn(), this.#container);
		}

		if (Type.isElementNode(this.#beforeMessageHtml))
		{
			Dom.prepend(this.getBeforeMessageHtml(), this.getTextContainer());
		}

		if (Type.isElementNode(this.#afterMessageHtml))
		{
			Dom.append(this.getAfterMessageHtml(), this.getTextContainer());
		}

		return this.#container;
	}

	render(): HTMLElement
	{
		return this.getContainer();
	}

	renderTo(node: HTMLElement): HTMLElement | null
	{
		if (Type.isDomNode(node))
		{
			Dom.append(this.getContainer(), node);

			return this.getContainer();
		}

		return null;
	}

	destroy(): void
	{
		Dom.remove(this.#container);
		this.#container = null;
		this.#textContainer = null;
		this.#closeNode = null;
		this.#beforeMessageHtml = null;
		this.#afterMessageHtml = null;
		this.#classList = null;
		this.#text = null;
	}
}
