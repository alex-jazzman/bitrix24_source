import { BaseGroupActionBar } from '../../base/base-group-action-bar/base-group-action-bar';
import { AddResourcesButton } from './add-resources-button';

// @vue/component
export const SkusGroupActionBar = {
	name: 'SkusGroupActionBar',
	components: {
		AddResourcesButton,
		BaseGroupActionBar,
	},
	props: {
		skus: {
			type: Array,
			default: () => [],
		},
	},
	emits: ['close'],
	template: `
		<BaseGroupActionBar :count="skus.length" @close="$emit('close')">
			<AddResourcesButton :skus/>
		</BaseGroupActionBar>
	`,
};
