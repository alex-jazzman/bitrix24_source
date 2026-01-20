import { BLine } from 'ui.system.skeleton.vue';

// @vue/component
export const ListItemSkeleton = {
	components: {
		BLine,
	},
	template: `
		<div class="tasks-field-reminders-row">
			<div class="tasks-field-reminders-column --via">
				<BLine :width="20" :height="20"/>
			</div>
			<div class="tasks-field-reminders-column --date">
				<BLine :width="160" :height="20"/>
			</div>
			<div class="tasks-field-reminders-column --recipients">
				<BLine :width="187" :height="20"/>
			</div>
		</div>
	`,
};
