import { Event, Type } from 'main.core';

export default class Animation
{
	static handleTransitionEnd(element: HTMLElement, propertyName: string | string[]): Promise
	{
		const properties = Type.isArray(propertyName) ? new Set(propertyName) : new Set([propertyName]);

		const computed = getComputedStyle(element);
		const durations = computed.transitionDuration.split(',').map((v: string) => parseFloat(v) * 1000);
		const delays = computed.transitionDelay.split(',').map((v: string) => parseFloat(v) * 1000);

		const timeout = Math.max(...durations.map((d, i) => d + (delays[i] ?? delays[0] ?? 0)), 0) + 50;

		return new Promise((resolve) => {
			let finished = false;
			let timer: number | null = null;

			const finish = (event: TransitionEvent | null) => {
				if (finished)
				{
					return;
				}

				finished = true;

				if (timer !== null)
				{
					clearTimeout(timer);
				}

				Event.unbind(element, 'transitionend', handler);
				resolve(event);
			};

			const handler = (event: TransitionEvent) => {
				if (event.target !== element || !properties.has(event.propertyName))
				{
					return;
				}

				properties.delete(event.propertyName);

				if (properties.size === 0)
				{
					finish(event);
				}
			};

			if (timeout <= 50)
			{
				queueMicrotask(() => finish(null));

				return;
			}

			Event.bind(element, 'transitionend', handler);

			timer = setTimeout(() => {
				finish(null);
			}, timeout);
		});
	}

	static handleAnimationEnd(element: HTMLElement, animationName: string)
	{
		return new Promise(resolve => {
			const handler = (event) => {
				if (!animationName || (event.animationName === animationName))
				{
					resolve(event);
					Event.unbind(element, 'animationend', handler);
				}
			};

			Event.bind(element, 'animationend', handler);
		});
	}
}
