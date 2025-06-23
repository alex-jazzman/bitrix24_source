import { Tag, Type } from 'main.core';

import './style.css';

type Params = {
	width?: number,
	height?: number,
	borderRadius?: number,
	className?: string,
};

export class Line
{
	#params: Params;

	constructor(params: Params)
	{
		this.#params = {
			height: 24,
			borderRadius: 12,
			...params,
			width: Type.isUndefined(params.width) ? null : params.width,
		};
	}

	render(): HTMLElement
	{
		const style = this.#getStyleString();
		const classNames = ['ui-skeleton-line', this.#params.className].filter(Boolean).join(' ');

		return Tag.render`<div class="${classNames}" style="${style}"></div>`;
	}

	#getStyleString(): string
	{
		const widthValue = this.#params.width === null ? '100%' : `${this.#params.width}px`;

		return [
			`width: ${widthValue}`,
			`height: ${this.#params.height}px`,
			`border-radius: ${this.#params.borderRadius}px`,
		].join('; ');
	}
}
