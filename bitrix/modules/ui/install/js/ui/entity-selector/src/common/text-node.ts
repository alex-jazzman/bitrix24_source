import { Type } from 'main.core';

import { TextNodeType } from './text-node-type';
import { type TextNodeOptions } from './text-node-options';

export class TextNode
{
	text: string | null = null;
	type: TextNodeType | null = null;

	constructor(options: TextNodeOptions | string)
	{
		if (Type.isPlainObject(options))
		{
			if (Type.isString(options.text))
			{
				this.text = options.text;
			}

			if (TextNodeType.isValid(options.type))
			{
				this.type = options.type;
			}
		}
		else if (Type.isString(options))
		{
			this.text = options;
		}
	}

	getText(): string | null
	{
		return this.text;
	}

	getType(): TextNodeType | null
	{
		return this.type;
	}

	isNullable(): boolean
	{
		return this.getText() === null;
	}

	renderTo(element: HTMLElement): void
	{
		const text = this.getText();
		if (text === null)
		{
			return;
		}

		if (this.getType() === null || this.getType() === TextNodeType.TEXT)
		{
			element.textContent = text;
		}
		else if (this.getType() === TextNodeType.HTML)
		{
			element.innerHTML = text;
		}
	}

	toString()
	{
		return this.getText() ?? '';
	}

	toJSON()
	{
		if (this.getType() === null)
		{
			return this.getText();
		}

		return {
			text: this.getText(),
			type: this.getType(),
		};
	}
}
