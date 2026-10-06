import '../../css/empty-state.css';

// @vue/component
export const BaseEmptyState = {
	name: 'BaseEmptyState',
	props: {
		title: {
			type: String,
			required: true,
		},
		subtitle: {
			type: String,
			default: '',
		},
	},
	template: `
		<div class="bx-im-search-empty-state__container bx-im-search-empty-state__scope">
			<div class="bx-im-search-empty-state__icon"></div>
			<div class="bx-im-search-empty-state__title">
				{{ title }}
			</div>
			<div v-if="subtitle" class="bx-im-search-empty-state__subtitle">
				{{ subtitle }}
			</div>
		</div>
	`,
};
