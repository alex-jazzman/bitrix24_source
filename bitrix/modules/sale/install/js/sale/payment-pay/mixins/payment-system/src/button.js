export default {
	computed:
	{
		classes()
		{
			return {
				'order-payment-method-item-button': true,
				'btn': true,
				'btn-primary': true,
				'rounded-pill': true,
				'pay-mode': true,
				'btn-wait': this.loading
			};
		},
		// a string: Vue 2 drops an attribute bound to false
		ariaBusy()
		{
			return this.loading ? 'true' : 'false';
		},
	},
	methods:
	{
		onClick(event)
		{
			this.$emit('click', event);
		},
	}
};
