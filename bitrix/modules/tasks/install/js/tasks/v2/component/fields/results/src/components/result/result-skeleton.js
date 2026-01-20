import { BLine } from 'ui.system.skeleton.vue';
import './result.css';

// @vue/component
export const ResultSkeleton = {
	components: {
		BLine,
	},
	template: `
		<div class="tasks-field-results-result-skeleton-container">
			<BLine :width="460" :height="12" :radius="60"/>
			<BLine :width="460" :height="12" :radius="60"/>
			<BLine :width="460" :height="12" :radius="60"/>
			<BLine :width="197" :height="12" :radius="60"/>
		</div>
	`,
};
