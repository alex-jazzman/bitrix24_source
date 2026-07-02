import { BLine, BCircle } from 'ui.system.skeleton.vue';
import './task-line.css';

// @vue/component
export const TaskLineSkeleton = {
	components: {
		BLine,
		BCircle,
	},
	inject: {
		fields: {},
	},
	props: {
		isSubTask: {
			type: Boolean,
			default: false,
		},
		isLastSubTask: {
			type: Boolean,
			default: false,
		},
	},
	computed: {
		sideIconClass(): string
		{
			return this.isLastSubTask ? '--last' : '--side';
		},
	},
	template: `
		<div class="tasks-task-line-title-container-wrapper" :class="{ '--sub-task': isSubTask }">
			<div v-if="isSubTask" class="tasks-task-line-side-icon" :class="sideIconClass"/>
			<BLine :width="200" :height="10" :style="{ 'margin-left': isSubTask ? '12px' : 0 }"/>
		</div>
		<div v-if="fields.size === 2" class="tasks-task-line-field">
			<BCircle :size="24" style="margin-left: 2px"/>
		</div>
		<div class="tasks-task-line-field">
			<BLine :width="80" :height="12" style="margin: 0 10px"/>
		</div>
		<div class="tasks-task-line-more">
			<BCircle :size="20"/>
		</div>
	`,
};
