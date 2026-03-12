import { TextMd } from 'ui.system.typography.vue';

import { HoverPill } from 'tasks.v2.component.elements.hover-pill';
import { taskService } from 'tasks.v2.provider.service.task-service';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { ReplicateRuleGenerator } from '../../lib';

// @vue/component
export const ReplicationContentState = {
	name: 'ReplicationContentState',
	components: {
		HoverPill,
		TextMd,
	},
	inject: {
		task: {},
		taskId: {},
		isTemplate: {},
	},
	setup(): { task: TaskModel } {},
	computed: {
		readonly(): boolean
		{
			return !this.isTemplate || !this.task.rights.edit;
		},
		ruleFormatted(): string
		{
			return new ReplicateRuleGenerator(this.task.replicateParams).generate();
		},
	},
	methods: {
		dontReplicate(): void
		{
			void taskService.update(this.taskId, {
				replicate: false,
				replicateParams: this.task.replicateParams,
			});
		},
	},
	template: `
		<HoverPill :readonly withClear textOnly noOffset style="width: auto" @clear="dontReplicate">
			<TextMd>{{ ruleFormatted }}</TextMd>
		</HoverPill>
	`,
};
