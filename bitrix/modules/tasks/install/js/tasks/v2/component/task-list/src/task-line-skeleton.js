import { BLine, BCircle } from 'ui.system.skeleton.vue';
import './task-line.css';

// @vue/component
export const TaskLineSkeleton = {
	components: {
		BLine,
		BCircle,
	},
	props: {
		fields: {
			type: Set,
			required: true,
		},
	},
	template: `
		<BLine :width="200" :height="10"/>
		<BCircle v-if="fields.size === 2" :size="25"/>
		<BLine :width="70" :height="10" style="margin: 0 10px"/>
		<div style="width: 20px"/>
	`,
};
