import { Dom, Tag } from 'main.core';
import { EventEmitter } from 'main.core.events';

import documentCounterIcon from './images/document-counter-icon.svg';
import documentCounterWarningIcon from './images/document-counter-warning-icon.svg';

import './style.css';

type DocumentCountersOption = {
	sizeLimit: Number,
}

export class DocumentCounters extends EventEmitter
{
	#sizeLimit: Number;
	#container: HTMLDivElement;
	#counterNode: HTMLSpanElement;
	#iconNode: HTMLImageElement;
	#committedCount: number = 0;

	constructor(options: DocumentCountersOption)
	{
		super();
		this.setEventNamespace('BX.Sign.V2.B2e.DocumentCounters');
		this.#sizeLimit = Number(options.documentCountersLimit);
		this.#counterNode = Tag.render`<span class="sign-b2e-settings__document-counter-select">0</span>`;
		this.#iconNode = Tag.render`
			<img
				class="sign-b2e-settings__document-counter-icon"
				src="${documentCounterIcon}"
				alt=""
			>
		`;
		this.#container = Tag.render`
			<div class="sign-b2e-settings__document-counter">
				${this.#iconNode}
				<div class="sign-b2e-settings__document-counter_limit-block">
					${this.#counterNode}
					${this.#getLimitContainer()}
				</div>
			</div>
		`;
	}

	getLayout(): HTMLElement
	{
		return this.#container;
	}

	#getLimitContainer(): HTMLElement
	{
		return Tag.render`<span class="sign-b2e-settings__document-counter-limit">/ ${this.#sizeLimit}</span>`;
	}

	getCount(): number
	{
		return this.#committedCount;
	}

	update(size: number): void
	{
		this.#committedCount = size;
		this.#refresh();
	}

	#refresh(): void
	{
		const displayCount = this.getCount();
		this.#counterNode.textContent = displayCount;

		if (displayCount >= this.#sizeLimit)
		{
			this.emit('limitExceeded');
			Dom.addClass(this.#container, '--alert');
			this.#iconNode.src = documentCounterWarningIcon;
		}
		else
		{
			this.emit('limitNotExceeded');
			Dom.removeClass(this.#container, '--alert');
			this.#iconNode.src = documentCounterIcon;
		}
	}
}
