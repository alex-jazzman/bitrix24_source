import { BitrixVue } from 'ui.vue';

import { getFocusableNodes, moveFocus } from './focus';

import './row'

const rowSelector = '.checkout-basket-item';
const totalsSelector = '.checkout-basket-summary-container';

BitrixVue.component('sale-checkout-view-product-list', {
	props: ['items', 'mode', 'errors'],
	watch:
	{
		'items.length': function(current, previous)
		{
			if (current < previous)
			{
				this.followRemovedRow();
			}
		},
	},
	methods:
	{
		getError(index)
		{
			let error = this.errors.find(error => error.index === index);
			return typeof error !== 'undefined' ? error.list:null
		},
		getTotals(container)
		{
			return container.parentElement?.querySelector(totalsSelector);
		},
		followRemovedRow()
		{
			const container = this.$refs.container;
			const row = document.activeElement?.closest(rowSelector);

			if (!row || !container.contains(row))
			{
				return;
			}

			this.$nextTick(() => {
				if (container.contains(document.activeElement))
				{
					return;
				}

				// rows are keyed by position, so the focused row node stays unless the last row went away
				const target = (row.isConnected ? row : this.getTotals(container)) ?? container;

				moveFocus(getFocusableNodes(target), target);
			});
		},
	},
	// language=Vue
	template: `
		<div class="checkout-basket-item-inner" data-testid="sale-checkout-product-list" ref="container">
			<sale-checkout-view-product-row v-for="(item, index) in items" :key="index"
											:item="item" :index="index" :mode="mode" :error="getError(index)" />
		</div>
	`
});
