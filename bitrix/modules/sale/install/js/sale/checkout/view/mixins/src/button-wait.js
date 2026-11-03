export default {
	data()
	{
		return {
			wait: false
		}
	},
	methods:
	{
		setWait()
		{
			this.wait = true;
		}
	},
	computed:
	{
		// a string: Vue 2 drops an attribute bound to false
		ariaBusy()
		{
			return this.wait ? 'true' : 'false';
		},
		getObjectClass()
		{
			const classes = [
				'btn',
				'btn-checkout-order-status',
				'btn-md',
				'rounded-pill'
			];
			
			if(this.wait)
			{
				classes.push('btn-wait')
			}
			return classes;
		}
	}
};