import './css/empty-state.css';

// @vue/component
export const RecentEmptyState = {
	name: 'RecentEmptyState',
	props: {
		title: {
			type: String,
			required: true,
		},
		subtitle: {
			type: String,
			default: '',
		},
		recentSection: {
			type: String,
			default: '',
		},
	},
	computed: {
		imageClasses()
		{
			if (!this.recentSection)
			{
				return '--base';
			}

			return `--${this.recentSection}`;
		},
	},
	template: `
		<div class="bx-im-list-recent-empty-state__container">
			<div class="bx-im-list-recent-empty-state__image" :class="imageClasses"></div>
			<div class="bx-im-list-recent-empty-state__title">{{ title }}</div>
			<div v-if="subtitle" class="bx-im-list-recent-empty-state__subtitle">{{ subtitle }}</div>
			<slot></slot>
		</div>
	`,
};
