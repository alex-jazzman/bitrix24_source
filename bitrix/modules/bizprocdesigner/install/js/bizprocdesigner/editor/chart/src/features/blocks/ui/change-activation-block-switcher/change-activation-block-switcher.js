import { BX_FLAG_NO } from '../../../../shared/constants';
import { BlockSwitcher } from '../../../../entities/blocks';

// @vue/component
export const ChangeActivationBlockSwitcher = {
	name: 'ChangeActivationBlockSwitcher',
	components: {
		BlockSwitcher,
	},
	inject: ['onToggleBlockActivation'],
	props: {
		/** @type Block */
		block: {
			type: Object,
			required: true,
		},
	},
	computed: {
		isBlockActivated(): boolean
		{
			if (!this.block?.activity?.Activated)
			{
				return true;
			}

			return this.block.activity.Activated !== BX_FLAG_NO;
		},
	},
	methods: {
		onChangeBlockActivation(): void
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
		<BlockSwitcher
			:on="isBlockActivated"
			@click="onChangeBlockActivation"
		/>
	`,
};
