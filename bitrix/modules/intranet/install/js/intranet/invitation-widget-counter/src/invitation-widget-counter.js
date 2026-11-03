import { Cache, Type, Dom, Loc } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { Counter, CounterStyle } from 'ui.cnt';

type InvitationWidgetCounterOptions = {
	button: HTMLElement,
	counterId: string,
	invitationCounter: number,
	shouldShowStructureCounter: boolean,
	useAirDesign?: boolean,
};

function getCounterAccessibleName(
	value: number,
	messageCode: string = 'INTRANET_INVITATION_WIDGET_COUNTER',
): string
{
	return Loc.getMessagePlural(messageCode, value, {
		'#COUNT#': value,
	});
}

export function updateCounterAccessibleName(
	counter: Counter,
	value: number,
	messageCode: string = 'INTRANET_INVITATION_WIDGET_COUNTER',
): void
{
	Dom.attr(
		counter.getContainer(),
		'aria-label',
		getCounterAccessibleName(value, messageCode),
	);
}

export function destroyAccessibleCounter(counter: Counter): void
{
	Dom.attr(counter.getContainer(), 'aria-label', null);
	counter.destroy();
}

export class InvitationWidgetCounter
{
	#cache = new Cache.MemoryCache();
	static #instance: InvitationWidgetCounter;

	constructor()
	{
		EventEmitter.subscribeOnce('HR.company-structure:first-popup-showed', this.#onFirstWatchNewStructure.bind(this));
	}

	static getInstance(): InvitationWidgetCounter
	{
		if (!this.#instance)
		{
			this.#instance = new this();
		}

		return this.#instance;
	}

	setOptions(options: InvitationWidgetCounterOptions): InvitationWidgetCounter
	{
		this.#cache.set('options', options);

		return this;
	}

	getOptions(): InvitationWidgetCounterOptions
	{
		return this.#cache.get('options', {});
	}

	show(): void
	{
		this.#getCounter().renderTo(this.#getCounterWrapper());
	}

	onReceiveCounterValue(value: number): void
	{
		const invitationCounter = value;
		if (this.getOptions().shouldShowStructureCounter)
		{
			value++;
		}

		const counter = this.#getCounter();
		counter.update(value);
		this.#updateCounterAccessibleName(counter, invitationCounter);
		this.getOptions().invitationCounter = value;

		if (value > 0)
		{
			this.#getCounter().renderTo(this.#getCounterWrapper());
		}
		else
		{
			destroyAccessibleCounter(counter);
			this.#cache.delete('counter');
		}
	}

	#getCounterWrapper(): HTMLElement
	{
		return this.#cache.remember('counter-wrapper', () => {
			return this.getOptions().button.querySelector('.invitation-widget-counter');
		});
	}

	#getCounter(): Counter
	{
		return this.#cache.remember('counter', () => {
			const value = this.#getCounterValue();
			const counter = new Counter({
				value,
				color: Counter.Color.DANGER,
				useAirDesign: this.getOptions().useAirDesign,
				style: this.getOptions().useAirDesign ? CounterStyle.FILLED_ALERT : CounterStyle.FILLED,
			});
			this.#updateCounterAccessibleName(counter, Number(this.getOptions().invitationCounter));

			return counter;
		});
	}

	#updateCounterAccessibleName(counter: Counter, invitationCounter: number): void
	{
		if (!this.getOptions().shouldShowStructureCounter)
		{
			updateCounterAccessibleName(counter, invitationCounter);

			return;
		}

		const accessibleName = [
			invitationCounter > 0 ? getCounterAccessibleName(invitationCounter) : null,
			getCounterAccessibleName(1, 'INTRANET_INVITATION_WIDGET_STRUCTURE_COUNTER'),
		].filter(Type.isStringFilled).join('. ');

		Dom.attr(counter.getContainer(), 'aria-label', accessibleName);
	}

	#getCounterValue(): number
	{
		let counterValue = Number(this.getOptions().invitationCounter);
		if (this.getOptions().shouldShowStructureCounter ?? false)
		{
			counterValue++;
		}

		return counterValue;
	}

	#onFirstWatchNewStructure(): void
	{
		let value = this.#getCounter().value;

		if (!Type.isNumber(value))
		{
			return;
		}

		if (!this.getOptions().shouldShowStructureCounter)
		{
			return;
		}

		value--;
		this.getOptions().shouldShowStructureCounter = false;
		const counter = this.#getCounter();
		counter.update(value);
		this.#updateCounterAccessibleName(counter, value);
		this.getOptions().invitationCounter = value;

		if (value > 0)
		{
			this.#getCounter().renderTo(this.#getCounterWrapper());
		}
		else
		{
			destroyAccessibleCounter(counter);
			this.#cache.delete('counter');
		}
	}
}
