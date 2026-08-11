import { Tag, Dom, Event, Text } from 'main.core';
import { type HintOptions } from '../types';
import './card-hint.css';

export class CardHint
{
	#options: HintOptions;
	#container: HTMLElement | null = null;

	constructor(options: HintOptions)
	{
		this.#options = options;
	}

	getLayout(): HTMLElement
	{
		if (this.#container)
		{
			return this.#container;
		}

		this.#container = Tag.render`
			<div class="biconnector-settings-card-hint">
				<span class="biconnector-settings-card-hint__text">
					${Text.encode(this.#options.text)}
				</span>
			</div>
		`;

		if (this.#options.link)
		{
			const link = Tag.render`
				<a class="biconnector-settings-card-hint__link">
					${Text.encode(this.#options.link.text)}
				</a>
			`;

			const helpCode = this.#options.link.helpCode;
			Event.bind(link, 'click', (e: any) => {
				e.preventDefault();
				(top as any)?.BX?.Helper?.show(`redirect=detail&code=${helpCode}`);
			});

			const textNode = this.#container!.querySelector('.biconnector-settings-card-hint__text') as HTMLElement;
			if (textNode)
			{
				textNode.append(' ');
				Dom.append(link, textNode);
			}
		}

		return this.#container!;
	}
}
