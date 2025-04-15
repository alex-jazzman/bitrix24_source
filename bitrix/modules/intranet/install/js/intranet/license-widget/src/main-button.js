import { Cache, Dom, Tag, Event } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { Counter } from 'ui.cnt';
import type { MainButtonOptions } from './types/options';

export class MainButton extends EventEmitter
{
	#cache = new Cache.MemoryCache();

	constructor(options: MainButtonOptions)
	{
		super();
		this.setEventNamespace('BX.Bitrix24.LicenseWidget.MainButton');
		this.setOptions(options);
		Event.bind(this.getContent(),'click', () => {
			this.emit('click');
		});
	}

	setOptions(options: MainButtonOptions): MainButton
	{
		this.#cache.set('options', options);

		return this;
	}

	getOptions(): MainButtonOptions
	{
		return this.#cache.get('options', {});
	}

	getContent(): HTMLElement
	{
		return this.#cache.remember('content', () => {
			return Tag.render`
				<button data-id="license-widget-main-button" class="${this.#getClassName()}">
					<span class="license-btn-icon"></span>
					<span class="license-btn-counter"></span>
					${(this.getOptions().isLicenseExpired) ? this.#getBattery() : null}
					<span class="license-btn-name">${this.getOptions().text}</span>
				</button>
			`;
		});
	}

	#getClassName(): string
	{
		return this.#cache.remember('button-class-name', () => {
			if (this.getOptions().isLicenseExpired)
			{
				return 'ui-btn ui-btn-round ui-btn-themes license-btn license-btn-alert-border license-btn-animate license-btn-animate-forward';
			}

			return this.getOptions().className;
		});
	}

	#getBattery(): HTMLElement
	{
		return this.#cache.remember('battery', () => {
			return Tag.render`
				<span class="license-btn-icon-battery">
						<span class="license-btn-icon-battery-full">
							<span class="license-btn-icon-battery-inner">
								<span></span>
								<span></span>
								<span></span>
							</span>
						</span>
						<svg class="license-btn-icon-battery-cross" xmlns="http://www.w3.org/2000/svg" width="22" height="18">
							<path fill="#FFF" fill-rule="evenodd" d="M18.567.395c.42.42.42 1.1 0 1.52l-1.04 1.038.704.001a2 2 0 012 2v1.799a1.01 1.01 0 01.116-.007H21a1 1 0 011 1v2.495a1 1 0 01-1 1h-.653l-.116-.006v1.798a2 2 0 01-2 2L5.45 15.032l-2.045 2.045a1.075 1.075 0 11-1.52-1.52L17.047.395c.42-.42 1.1-.42 1.52 0zm-2.583 4.102l-8.991 8.99 10.836.002a1 1 0 00.994-.883l.006-.117v-6.99a1 1 0 00-1-1l-1.845-.002zm-5.031-1.543L9.409 4.498h-6.23a1 1 0 00-.993.884l-.006.116-.001 6.23-1.4 1.398v-.046L.777 4.954a2 2 0 012-2h8.175z"/>
						</svg>
				</span>
			`;
		});
	}

	getCounter(): Counter
	{
		return this.#cache.remember('counter', () => {
			return new Counter({
				color: Counter.Color.DANGER,
			});
		});
	}

	setCounter(value: number): void
	{
		if (value < 1)
		{
			this.getCounter().destroy();
			this.#cache.delete('counter');
		}

		if (value > 0)
		{
			this.getCounter().update(value);
			this.getCounter().renderTo(this.getCounterWrapper());
		}
	}

	getCounterWrapper(): HTMLSpanElement
	{
		return this.#cache.remember('counter-node', () => {
			return this.getContent().querySelector('.license-btn-counter');
		});
	}

	onClick(): void
	{
		this.emit('click');
	}

	replaceSkeleton(): void
	{
		Dom.replace(this.getOptions().wrapper, this.getContent());
	}
}