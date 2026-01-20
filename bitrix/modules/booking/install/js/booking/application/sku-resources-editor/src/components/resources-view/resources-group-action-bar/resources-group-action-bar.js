import { BaseGroupActionBar } from '../../base/base-group-action-bar/base-group-action-bar';
import { AddSkusButton } from './add-skus-button';

// @vue/component
export const ResourcesGroupActionBar = {
	name: 'ResourcesGroupActionBar',
	components: {
		AddSkusButton,
		BaseGroupActionBar,
	},
	props: {
		resources: {
			type: Array,
			default: () => [],
		},
	},
	emits: ['close'],
	template: `
		<BaseGroupActionBar :count="resources.length" @close="$emit('close')">
			<AddSkusButton :resources />
		</BaseGroupActionBar>
	`,
};
