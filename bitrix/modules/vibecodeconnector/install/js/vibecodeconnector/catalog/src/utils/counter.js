import { Tag } from 'main.core';
import { Counter, CounterStyle } from 'ui.cnt';

function createCounter(value: number, options: { size?: string, style?: string, border?: boolean } = {}): Counter
{
	return new Counter({
		value,
		size: options.size ?? Counter.Size.MEDIUM,
		style: options.style ?? CounterStyle.FILLED,
		border: options.border === true,
		useAirDesign: true,
	});
}

export function renderTabCounter(value: number): HTMLElement
{
	return Tag.render`
		<span class="vibecode-catalog__tab-counter">
			${createCounter(value, {
				border: true,
			}).render()}
		</span>
	`;
}

export function renderItemCounter(value: number): HTMLElement
{
	return Tag.render`
		<span class="vibecode-catalog__item-counter">
			${createCounter(value, {
				size: Counter.Size.LARGE,
			}).render()}
		</span>
	`;
}
