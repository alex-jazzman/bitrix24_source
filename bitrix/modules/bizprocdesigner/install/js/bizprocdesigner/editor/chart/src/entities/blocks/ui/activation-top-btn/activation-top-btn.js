import { Outline } from 'ui.icon-set.api.vue';
import { IconButton } from '../../../../shared/ui';
import { ACTIVATION_STATUS } from '../../../../shared/constants';
import './activation-top-btn.css';

type ActivationTopBtnSetup = {
	iconSet: { [string]: string },
};

// @vue/component
export const ActivationTopBtn = {
	name: 'ActivationTopBtn',
	components: {
		IconButton,
	},
	props: {
		/** @type Block */
		block: {
			type: Object,
			required: true,
		},
	},
	emits: ['changeActivation'],
	setup(): ActivationTopBtnSetup
	{
		return {
			iconSet: Outline,
		};
	},
	computed: {
		activationIcon(): string
		{
			return this.block.activity.Activated === ACTIVATION_STATUS.ACTIVE
				? this.iconSet.PAUSE_L
				: this.iconSet.PLAY_L;
		},
	},
	template: `
		<IconButton
			:icon-name="activationIcon"
			@click="$emit('changeActivation')"
		/>
	`,
};
