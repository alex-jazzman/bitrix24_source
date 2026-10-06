import { Type, Dom } from 'main.core';
import { TextNode } from '../common/text-node';

import { type ItemBadgeOptions } from './item-badge-options';
import { type TextNodeOptions } from '../common/text-node-options';

export class ItemBadge
{
	title: TextNode | null = null;
	textColor: string | null = null;
	bgColor: string | null = null;
	border: string | null = null;
	containers: WeakMap<HTMLElement, HTMLElement> = new WeakMap();

	constructor(badgeOptions: ItemBadgeOptions)
	{
		const options: ItemBadgeOptions = Type.isPlainObject(badgeOptions) ? badgeOptions : {} as ItemBadgeOptions;

		this.setTitle(options.title);
		this.setTextColor(options.textColor);
		this.setBgColor(options.bgColor);
		this.setBorder(options.border ?? null);
	}

	getTitle(): string
	{
		const titleNode = this.getTitleNode();

		return titleNode !== null && !titleNode!.isNullable() ? titleNode!.getText()! : '';
	}

	getTitleNode(): TextNode | null
	{
		return this.title;
	}

	setTitle(title: string | null | undefined | TextNodeOptions): void
	{
		if (Type.isStringFilled(title) || Type.isPlainObject(title) || title === null)
		{
			this.title = title === null ? null : new TextNode(title);
		}
	}

	getTextColor(): string | null
	{
		return this.textColor;
	}

	setTextColor(textColor: string | null | undefined): void
	{
		if (Type.isString(textColor) || textColor === null)
		{
			this.textColor = textColor;
		}
	}

	getBgColor(): string | null
	{
		return this.bgColor;
	}

	setBgColor(bgColor: string | null | undefined): void
	{
		if (Type.isString(bgColor) || bgColor === null)
		{
			this.bgColor = bgColor;
		}
	}

	getBorder(): string | null
	{
		return this.border;
	}

	setBorder(border: string | null | undefined): void
	{
		if (Type.isString(border) || border === null)
		{
			this.border = border;
		}
	}

	getContainer(target: HTMLElement): HTMLElement
	{
		let container = this.containers.get(target);
		if (!container)
		{
			container = document.createElement('span');
			container.className = 'ui-selector-item-badge';

			this.containers.set(target, container);
		}

		return container;
	}

	renderTo(target: HTMLElement): void
	{
		const container = this.getContainer(target);

		const titleNode = this.getTitleNode();
		if (titleNode)
		{
			titleNode.renderTo(container);
		}
		else
		{
			container.textContent = '';
		}

		Dom.style(container, 'color', this.getTextColor());
		Dom.style(container, 'background-color', this.getBgColor());
		Dom.style(container, 'border', this.getBorder());
		Dom.append(container, target);
	}

	toJSON()
	{
		return {
			title: this.getTitleNode(),
			textColor: this.getTextColor(),
			bgColor: this.getBgColor(),
			border: this.getBorder(),
		};
	}
}
