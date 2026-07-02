import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';

// @vue/component
export const NestedListHeader = {
	name: 'NestedListHeader',
	components: { BIcon },
	props: {
		title: {
			type: String,
			required: true,
		},
	},
	computed: {
		OutlineIcons: () => OutlineIcons,
	},
	template: `
		<div class="bx-im-nested-list-collab__header">
			<div class="bx-im-nested-list-collab__title --ellipsis" :title="title">{{ title }}</div>
			<BIcon :name="OutlineIcons.APPS" :hoverable="true" class="bx-im-nested-list-collab__menu-icon" />
		</div>
	`,
};
