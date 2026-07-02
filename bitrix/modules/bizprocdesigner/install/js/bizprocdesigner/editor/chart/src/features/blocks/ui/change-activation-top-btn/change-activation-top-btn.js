import { ActivationTopBtn } from '../../../../entities/blocks';

// @vue/component
export const ChangeActivationTopBtn = {
	name: 'ChangeActivationTopBtn',
	components: {
		ActivationTopBtn,
	},
	inject: ['onToggleBlockActivation'],
	props: {
		/** @type Block */
		block: {
			type: Object,
			required: true,
		},
	},
	methods: {
		onChangeActivation(): void
		{
			if (!this.onToggleBlockActivation)
			{
				console.warn('onToggleBlockActivation is not provided');

				return;
			}

			this.onToggleBlockActivation(this.block.id);
		},
	},
	template: `
		<ActivationTopBtn
			:block="block"
			@changeActivation="onChangeActivation"
		/>
	`,
};
