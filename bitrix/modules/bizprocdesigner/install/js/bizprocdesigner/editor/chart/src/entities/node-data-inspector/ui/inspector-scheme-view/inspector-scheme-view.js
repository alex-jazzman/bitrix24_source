import { InspectorSchemeItemView } from './components/inspector-scheme-item-view/inspector-scheme-item-view';

// eslint-disable-next-line no-unused-vars
import { type InspectorViewItemBase } from '../../types';

import './style.css';

// @vue/component
export const InspectorSchemeView = {
	name: 'InspectorSchemeView',
	components: {
		InspectorSchemeItemView,
	},
	props: {
		data: {
			/** @type { groups: Array<InspectorViewItemBase> } */
			type: Object,
			required: true,
		},
	},
	computed: {
		groupList(): Array<InspectorViewItemBase>
		{
			return this.data.groups;
		},
	},
	methods: {
		makeGroupColorName(color: ?string): string
		{
			if (!color)
			{
				return '';
			}

			return `--${color}`;
		},
	},
	template: `
		<div class="inspector-scheme-view">
			<template v-for="(group, groupIndex) in groupList">
				<ul class="inspector-scheme-view__item-list" :class="makeGroupColorName(group.color)">
					<InspectorSchemeItemView
						:key="group.text || groupIndex"
						:item="group"
					>
						<template #loading><slot name="loading"/></template>
					</InspectorSchemeItemView>
				</ul>
				<div v-if="groupIndex + 1 < groupList.length"
					 class="inspector-scheme-view__item-list-group-divider"
				>
				</div>
			</template>
		</div>
	`,
};
