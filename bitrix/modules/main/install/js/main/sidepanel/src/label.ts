import { Type, Dom } from 'main.core';
import { MemoryCache } from 'main.core.cache';

import { type Slider } from './slider';
import { type LabelOptions } from './types/label-options';

export class Label
{
	private static MIN_LEFT_OFFSET = 25;
	private static MIN_TOP_OFFSET = 17;
	private static INTERVAL_TOP_OFFSET = 50;

	private slider: Slider;
	private color: string | null = null;
	private bgColor: string | null = null;
	private className: string = '';
	private iconClass: string = '';
	private iconTitle: string | null = '';
	private onclick: Function | null = null;
	private text: string | null = null;
	private hidden: boolean = false;
	private visible: boolean = true;
	private testId: string | null = null;
	private cache: MemoryCache<HTMLElement> = new MemoryCache<HTMLElement>();

	constructor(slider: Slider, labelOptions: LabelOptions)
	{
		this.slider = slider;
		const options = Type.isPlainObject(labelOptions) ? labelOptions : {};

		this.hidden = Type.isBoolean(options.hidden) ? options.hidden : this.hidden;
		this.visible = Type.isBoolean(options.visible) ? options.visible : this.visible;
		this.testId = Type.isStringFilled(options.testId) ? options.testId : null;

		this.setColor(options.color);
		this.setBgColor(options.bgColor);
		this.setText(options.text);
		this.setClassName(options.className);
		this.setIconClass(options.iconClass);
		this.setIconTitle(options.iconTitle);
		this.setOnclick(options.onclick);
	}

	getContainer(): HTMLElement
	{
		return this.cache.remember('container', () => {
			const classes = ['side-panel-label'];
			if (this.getClassName())
			{
				classes.push(this.getClassName());
			}

			if (this.isHidden())
			{
				classes.push('--hidden');
			}

			if (this.isVisible())
			{
				classes.push('--visible');
			}

			return Dom.create('button', {
				props: {
					className: classes.join(' '),
				},
				attrs: {
					type: 'button',
					tabIndex: this.isHidden() ? '-1' : '0',
					'data-testid': this.getTestId() ?? '',
				},
				children: [this.getIconBox(), this.getTextContainer()],

				events: {
					click: this.#handleClick.bind(this) as EventListener,
				},
			});
		});
	}

	adjustLayout(): void
	{
		const overlayRect = this.getSlider().getOverlay().getBoundingClientRect();
		const containerRect = this.getSlider().getContainer().getBoundingClientRect();
		const maxWidth = containerRect.left - overlayRect.left;

		if (maxWidth <= this.getSlider().getMinLeftBoundary())
		{
			this.hideText();
		}
		else
		{
			this.showText();
		}

		Dom.style(this.getContainer(), 'max-width', `${maxWidth - Label.MIN_LEFT_OFFSET}px`);
	}

	getIconBox(): HTMLElement
	{
		return this.cache.remember('icon-box', () => {
			return Dom.create('div', {
				props: {
					className: 'side-panel-label-icon-box',
				},
				children: [this.getIconContainer()],
			});
		});
	}

	getIconContainer(): HTMLElement
	{
		return this.cache.remember('icon-container', () => {
			return Dom.create('div', {
				props: {
					className: `side-panel-label-icon ${this.getIconClass()}`,
				},
			});
		});
	}

	#handleClick(event: MouseEvent): void
	{
		event.stopPropagation();

		const fn = this.getOnclick();
		if (fn)
		{
			fn(this, this.getSlider());
		}
	}

	showIcon(): void
	{
		Dom.removeClass(this.getContainer(), 'side-panel-label-icon--hide');
	}

	hideIcon(): void
	{
		Dom.addClass(this.getContainer(), 'side-panel-label-icon--hide');
	}

	darkenIcon(): void
	{
		Dom.addClass(this.getContainer(), 'side-panel-label-icon--darken');
	}

	lightenIcon(): void
	{
		Dom.removeClass(this.getContainer(), 'side-panel-label-icon--darken');
	}

	hideText(): void
	{
		Dom.addClass(this.getTextContainer(), 'side-panel-label-text-hidden');
	}

	showText(): void
	{
		Dom.removeClass(this.getTextContainer(), 'side-panel-label-text-hidden');
	}

	isTextHidden(): boolean
	{
		return Dom.hasClass(this.getTextContainer(), 'side-panel-label-text-hidden');
	}

	getTextContainer(): HTMLElement
	{
		return this.cache.remember('text-container', () => {
			return Dom.create('span', {
				props: {
					className: 'side-panel-label-text',
				},
			});
		});
	}

	setColor(color: string | null | undefined): void
	{
		if (Type.isStringFilled(color) || color === null)
		{
			this.color = color;

			Dom.style(this.getTextContainer(), 'color', this.color);
			Dom.style(this.getIconContainer(), '--ui-icon-set__icon-color', this.color);
		}
	}

	getColor(): string | null
	{
		return this.color;
	}

	setBgColor(color: string | [string, number] | undefined, opacity?: number): void
	{
		let bgColor: string | null | undefined = Type.isArray(color) ? color[0] : color;
		let alfa: number | undefined = Type.isArray(color) ? color[1] : opacity;

		if (Type.isStringFilled(bgColor))
		{
			const matches = bgColor.match(/^#([\dA-Fa-f]{6}|[\dA-Fa-f]{3})$/);
			if (matches)
			{
				let hex = matches[1];
				if (hex.length === 3)
				{
					hex = hex.replaceAll(/([\da-f])/gi, '$1$1');
				}

				alfa = Type.isNumber(alfa) && alfa >= 0 && alfa <= 100 ? alfa : 95;
				const alfaHex = `0${Math.round(255 * (alfa / 100)).toString(16)}`.slice(-2).toUpperCase();

				bgColor = `#${hex}${alfaHex}`;
			}

			this.bgColor = bgColor;
			Dom.style(this.getContainer(), '--ui-color', bgColor);

			if (this.getColor() === null)
			{
				Dom.style(this.getIconContainer(), '--ui-icon-set__icon-color', '#fff');
			}
		}
		else if (bgColor === null)
		{
			this.bgColor = null;
			Dom.style(this.getContainer(), '--ui-color', null);
			Dom.style(this.getIconContainer(), '--ui-icon-set__icon-color', null);
		}
	}

	getBgColor(): string | null
	{
		return this.bgColor;
	}

	setText(text: string | null | undefined): void
	{
		if (Type.isStringFilled(text))
		{
			this.text = text;
			this.getTextContainer().textContent = text;
		}
		else if (text === null)
		{
			this.text = text;
			this.getTextContainer().textContent = '';
		}
	}

	getText(): string | null
	{
		return this.text;
	}

	setClassName(className: string | null | undefined): void
	{
		if (Type.isStringFilled(className))
		{
			Dom.removeClass(this.getContainer(), this.className);
			this.className = className;
			Dom.addClass(this.getContainer(), this.className);
		}
		else if (className === null)
		{
			Dom.removeClass(this.getContainer(), this.className);
			this.className = '';
		}
	}

	getClassName(): string
	{
		return this.className;
	}

	setIconClass(iconClass: string | null | undefined): void
	{
		if (Type.isStringFilled(iconClass))
		{
			Dom.removeClass(this.getIconContainer(), this.iconClass);
			this.iconClass = iconClass;
			Dom.addClass(this.getIconContainer(), this.iconClass);
		}
		else if (iconClass === null)
		{
			Dom.removeClass(this.getIconContainer(), this.iconClass);
			this.iconClass = '';
		}
	}

	getIconClass(): string
	{
		return this.iconClass;
	}

	setIconTitle(iconTitle: string | null | undefined): void
	{
		if (Type.isStringFilled(iconTitle) || iconTitle === null)
		{
			Dom.attr(this.getIconBox(), 'title', iconTitle);
			Dom.attr(this.getContainer(), 'aria-label', iconTitle);
			this.iconTitle = iconTitle;
		}
	}

	getIconTitle(): string | null
	{
		return this.iconTitle;
	}

	isHidden(): boolean
	{
		return this.hidden;
	}

	hide(): void
	{
		this.hidden = true;
		Dom.addClass(this.getContainer(), '--hidden');
		Dom.attr(this.getContainer(), 'tabIndex', '-1');
	}

	show(): void
	{
		this.hidden = false;
		Dom.removeClass(this.getContainer(), '--hidden');
		Dom.attr(this.getContainer(), 'tabIndex', '0');
	}

	isVisible(): boolean
	{
		return this.visible;
	}

	setVisible(isVisible: boolean = true): void
	{
		Dom.toggleClass(this.getContainer(), '--visible', isVisible);
	}

	setOnclick(fn: Function | null | undefined): void
	{
		if (Type.isFunction(fn) || fn === null)
		{
			this.onclick = fn;
		}
	}

	getOnclick(): Function | null
	{
		return this.onclick;
	}

	getTestId(): string | null
	{
		return this.testId;
	}

	getSlider(): Slider
	{
		return this.slider;
	}

	moveAt(position: number): void
	{
		if (Type.isNumber(position) && position >= 0)
		{
			Dom.style(
				this.getSlider().getLabelsContainer(),
				'top',
				`${Label.MIN_TOP_OFFSET + position * Label.INTERVAL_TOP_OFFSET}px`,
			);
		}
	}
}
