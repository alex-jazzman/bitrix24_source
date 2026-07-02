import { Dom } from 'main.core';
import { Counter } from 'ui.cnt';

// @vue/component
export const BCounter = {
	name: 'BCounter',
	props: {
		id: {
			type: String,
			required: true,
		},
		value: {
			type: Number,
			default: 0,
		},
	},
	mounted(): void
	{
		this.renderCounter();
	},
	updated(): void
	{
		this.renderCounter();
	},
	unmounted(): void
	{
		this.counterEl?.destroy();
	},
	methods: {
		renderCounter(): void
		{
			const counterContainer = this.$refs.counterContainer;

			if (this.value)
			{
				this.counterEl = new Counter({
					size: Counter.Size.SMALL,
					style: Counter.Style.FILLED_ALERT,
					useAirDesign: true,
					value: this.value,
					id: `counterBookingPopup${this.id}`,
				});
				const counterElRendered = this.counterEl.render();

				Dom.clean(counterContainer);
				Dom.append(counterElRendered.cloneNode(true), counterContainer);
			}
			else
			{
				Dom.clean(counterContainer);
			}
		},
	},
	template: `
		<div ref="counterContainer" class="option-counter-container"></div>
	`,
};
