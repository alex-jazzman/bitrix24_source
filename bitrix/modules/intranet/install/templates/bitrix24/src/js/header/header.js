import { Dom, Reflection, ready, addCustomEvent, Event } from 'main.core';
import { Counter, CounterStyle } from 'ui.cnt';

export class Header
{
	#burgerCounter: ?Counter = null;

	constructor()
	{
		this.#initMobileBurger();
	}

	getContainer(): HTMLElement
	{
		return document.getElementById('app-header');
	}

	show(): void
	{
		Dom.removeClass(this.getContainer(), '--hidden');
	}

	hide(): void
	{
		Dom.addClass(this.getContainer(), '--hidden');
	}

	isVisible(): boolean
	{
		return !Dom.hasClass(this.getContainer(), '--hidden');
	}

	#initMobileBurger(): void
	{
		ready(() => {
			const burger = document.getElementById('air-header-burger');
			if (!burger)
			{
				return;
			}

			Event.bind(burger, 'click', () => {
				const menu = Reflection.getClass('BX.Intranet.LeftMenu');
				if (!menu)
				{
					return;
				}

				const root = document.querySelector('.js-app');
				if (!root)
				{
					return;
				}

				const isSliding = Dom.hasClass(root, 'menu-sliding-mode');
				menu.switchToSlidingMode(!isSliding);
			});

			this.#initBurgerCounter(burger);
		});
	}

	#initBurgerCounter(burger: HTMLElement): void
	{
		const counterWrapper = burger.querySelector('.air-header__burger-counter');
		if (!counterWrapper)
		{
			return;
		}

		this.#burgerCounter = new Counter({
			value: 0,
			size: Counter.Size.SMALL,
			color: Counter.Color.DANGER,
			useAirDesign: true,
			style: CounterStyle.FILLED_ALERT,
			hideIfZero: true,
		});

		this.#burgerCounter.renderTo(counterWrapper);

		addCustomEvent('BX.Intranet.LeftMenu:onTotalCounterUpdate', (total) => {
			this.#burgerCounter.update(total);
		});
	}
}
