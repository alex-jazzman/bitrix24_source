import { Tag } from 'main.core';

import './style.css';

type Params = {
	size?: number,
	className?: string,
};

export class Circle
{
	#params: Params;

	constructor(params: Params = {})
	{
		this.#params = {
			size: 40,
			...params,
		};
	}

	render(): HTMLElement
	{
		const style = this.#getStyleString();
		const classNames = ['ui-skeleton-circle', this.#params.className].filter(Boolean).join(' ');

		return Tag.render`<div class="${classNames}" style="${style}"></div>`;
	}

	#getStyleString(): string
	{
		return [
			`width: ${this.#params.size}px`,
			`height: ${this.#params.size}px`,
		].join('; ');
	}
}
