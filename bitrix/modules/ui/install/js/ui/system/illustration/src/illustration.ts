import { Tag, Dom } from 'main.core';

import { IllustrationName } from './const';
import { type IllustrationOptions } from './types';

import './illustration.css';

const DEFAULT_SIZE = 80;

export class Illustration
{
	#name: string;
	#size: number;
	#ariaLabel: string;

	#wrapper: HTMLElement | null = null;

	constructor(options: IllustrationOptions)
	{
		this.#name = this.#validateName(options.name);
		this.#size = options.size ?? DEFAULT_SIZE;
		this.#ariaLabel = options.ariaLabel ?? '';
	}

	render(): HTMLElement
	{
		if (this.#wrapper)
		{
			return this.#wrapper;
		}

		const wrapper: HTMLElement = Tag.render`
			<div class="ui-illustration --${this.#name}"></div>
		`;
		this.#wrapper = wrapper;
		this.#applySize();
		this.#applyAria();

		return wrapper;
	}

	renderTo(node: HTMLElement): void
	{
		Dom.append(this.render(), node);
	}

	setName(name: string): void
	{
		const validated = this.#validateName(name);
		if (this.#wrapper)
		{
			Dom.removeClass(this.#wrapper, `--${this.#name}`);
			Dom.addClass(this.#wrapper, `--${validated}`);
		}

		this.#name = validated;
	}

	getName(): string
	{
		return this.#name;
	}

	setSize(size: number): void
	{
		this.#size = size;
		this.#applySize();
	}

	getSize(): number
	{
		return this.#size;
	}

	destroy(): void
	{
		if (this.#wrapper)
		{
			Dom.remove(this.#wrapper);
		}

		this.#wrapper = null;
	}

	#validateName(name: string): string
	{
		if (!(Object.values(IllustrationName) as string[]).includes(name))
		{
			console.error(`ui.system.illustration: unknown illustration name "${name}"`);
		}

		return name;
	}

	#applySize(): void
	{
		if (this.#wrapper)
		{
			Dom.style(this.#wrapper, '--ui-illustration-size', `${this.#size}px`);
		}
	}

	#applyAria(): void
	{
		if (!this.#wrapper)
		{
			return;
		}

		if (this.#ariaLabel === '')
		{
			this.#wrapper.setAttribute('aria-hidden', 'true');
		}
		else
		{
			this.#wrapper.setAttribute('role', 'img');
			this.#wrapper.setAttribute('aria-label', this.#ariaLabel);
		}
	}
}
