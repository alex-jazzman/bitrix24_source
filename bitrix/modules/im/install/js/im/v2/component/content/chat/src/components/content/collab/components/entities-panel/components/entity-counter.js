import { CounterManager } from 'im.v2.lib.counter';

// @vue/component
export const EntityCounter = {
	name: 'EntityCounter',
	props:
	{
		counter: {
			type: Number,
			required: true,
		},
	},
	computed:
	{
		preparedCounter(): string
		{
			return CounterManager.formatCounter(this.counter);
		},
	},
	template: `
		<span class="bx-im-collab-header__link-counter">
			{{ preparedCounter }}
		</span>
	`,
};
