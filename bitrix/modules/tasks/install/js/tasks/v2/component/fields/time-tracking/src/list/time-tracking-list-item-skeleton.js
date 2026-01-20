import { BLine } from 'ui.system.skeleton.vue';

// @vue/component
export const TimeTrackingListItemSkeleton = {
	components: {
		BLine,
	},
	template: `
		<div class="tasks-time-tracking-list-row --item tasks-time-tracking-list-item">
			<div class="tasks-time-tracking-list-column --date">
				<BLine :width="120" :height="20"/>
			</div>
			<div class="tasks-time-tracking-list-column --time">
				<BLine :width="60" :height="20"/>
			</div>
			<div class="tasks-time-tracking-list-column --author">
				<BLine :width="200" :height="20"/>
			</div>
		</div>
	`,
};
