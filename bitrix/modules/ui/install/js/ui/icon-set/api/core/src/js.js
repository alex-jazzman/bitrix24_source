import { Type, Tag, Dom } from 'main.core';
import 'ui.design-tokens.air';

import { Actions, Main, ContactCenter, Outline, CRM, Social, Animated, Editor, Special } from './icon';
import { IconHoverMode } from './icon-hover-mode';

export type IconOptions = {
	icon: string,
	size?: number,
	color?: string,
	hoverMode?: IconHoverMode,
};

export class Icon
{
	icon: string;
	size: number;
	color: string;
	iconElement: HTMLElement | null;
	#hoverMode: ?string = null;

	constructor(params: IconOptions = {}) {
		this.validateParams(params);

		this.icon = params.icon;
		this.size = params.size > 0 ? params.size : null;
		this.color = params.color || null;
		this.#hoverMode = params.hoverMode ?? null;

		this.iconElement = null;
	}

	validateParams(params: IconOptions): void
	{
		if (!params.icon)
		{
			throw new Error('IconSet: property "icon" not set.');
		}

		if (!this.#checkIconExistence(params.icon))
		{
			throw new Error('IconSet: "icon" is not exist.');
		}

		if (!Type.isUndefined(params.size) && !Type.isNumber(params.size))
		{
			throw new TypeError('IconSet: "size" is not a number.');
		}

		if (params.color && !Type.isString(params.color))
		{
			throw new TypeError('IconSet: "color" is not a string.');
		}
	}

	renderTo(node: HTMLElement): void
	{
		if (!Type.isElementNode(node))
		{
			throw new Error('IconSet: node is not a htmlElement.');
		}

		Dom.append(this.render(), node);
	}

	render(): Node
	{
		const className = `ui-icon-set --${this.icon}`;

		this.iconElement = Tag.render`<div class="${className}"></div>`;

		if (this.size)
		{
			Dom.style(this.iconElement, '--ui-icon-set__icon-size', `${this.size}px`);
		}

		if (this.color)
		{
			Dom.style(this.iconElement, '--ui-icon-set__icon-color', this.color);
		}

		if (this.#hoverMode)
		{
			this.setHoverMode(this.#hoverMode);
		}

		return this.iconElement;
	}

	/**
	 *
	 * @param color
	 */
	setColor(color: string): void
	{
		Dom.style(this.iconElement, '--ui-icon-set__icon-color', color);
	}

	setHoverMode(hoverMode: IconHoverMode | null): void
	{
		const prevHoverMode = this.#hoverMode;
		this.#hoverMode = hoverMode;

		if (!this.iconElement)
		{
			return;
		}

		Dom.removeClass(this.iconElement, this.#getHoverModeClassnameModifier(prevHoverMode));
		Dom.addClass(this.iconElement, this.#getHoverModeClassnameModifier(hoverMode));
	}

	#getHoverModeClassnameModifier(hoverMode: IconHoverMode): string
	{
		const hoverModeModifiers = {
			[IconHoverMode.DEFAULT]: '--hoverable-default',
			[IconHoverMode.ALT]: '--hoverable-alt',
		};

		return hoverModeModifiers[hoverMode] ?? '';
	}

	#checkIconExistence(iconName: string): boolean
	{
		const sets = [Actions, Main, ContactCenter, Outline, CRM, Social, Animated, Editor, Special];

		return sets.some((set) => {
			return Object.values(set).includes(iconName);
		});
	}
}
