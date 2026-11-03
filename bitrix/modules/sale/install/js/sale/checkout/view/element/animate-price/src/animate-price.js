import { BitrixVue } from 'ui.vue';
import { Type } from 'main.core';
import { CurrencyCore } from 'currency.currency-core';
import 'sale.checkout.view.element.animate-price'

// the builder creates BX.Sale.Checkout.View.Element only for a bundle that exports something,
// and the input bundle reads it on load
export const AnimatePriceComponentName = 'sale-checkout-view-element-animate_price';

BitrixVue.component(AnimatePriceComponentName, {
	props: ['sum', 'currency', 'prefix'],
	data()
	{
		return {
			displaySum: this.sum,
			interval: false,
			running: false,
		}
	},
	computed:
	{
		getPrefix()
		{
			return Type.isString(this.prefix) ? this.prefix:''
		},
		// hidden from a reader while the sum runs towards the real one
		ariaHidden()
		{
			return this.running ? 'true' : 'false';
		},
		sumFormatted()
		{
			return CurrencyCore.currencyFormat(this.displaySum, this.currency, true);
		},
		getSum()
		{
			return this.sum
		}
	},
	methods:
	{
		animated()
		{
			this.stopAnimation();

			if(this.sum !== this.displaySum)
			{
				this.running = true;

				this.interval = window.setInterval(()=>
				{
					if(this.displaySum !== this.sum)
					{
						let diff = (this.sum - this.displaySum) / 5;

						diff = diff >= 0 ? Math.ceil(diff) : Math.floor(diff);

						if(diff > 0 && this.displaySum + diff > this.sum)
						{
							this.displaySum = this.sum
						}
						else
						{
							this.displaySum = this.displaySum + diff
						}
					}
					else
					{
						this.stopAnimation();
					}
				}, 10);
			}
		},
		stopAnimation()
		{
			clearInterval(this.interval);
			this.running = false;
		}
	},
	watch:
	{
		getSum()
		{
			this.animated()
		}
	},
	// language=Vue
	template: `
		<div :aria-hidden="ariaHidden" v-html="getPrefix + sumFormatted"/>
	`
});