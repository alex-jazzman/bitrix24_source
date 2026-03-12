import { RelationTasksChip } from 'tasks.v2.component.fields.relation-tasks';
import { fieldHighlighter } from 'tasks.v2.lib.field-highlighter';
import { relatedTasksDialog } from 'tasks.v2.lib.relation-tasks-dialog';
import { relatedTasksMeta } from './related-tasks-meta';

// @vue/component
export const RelatedTasksChip = {
	components: {
		RelationTasksChip,
	},
	inject: {
		taskId: {},
		analytics: {},
	},
	setup(): Object
	{
		return {
			relatedTasksMeta,
		};
	},
	methods: {
		handleAdd(targetNode: HTMLElement): void
		{
			relatedTasksDialog.show({
				targetNode,
				taskId: this.taskId,
				onClose: this.highlightField,
				analytics: this.analytics,
			});
		},
		highlightField(): void
		{
			void fieldHighlighter.setContainer(this.$root.$el).highlight(relatedTasksMeta.id);
		},
	},
	template: `
		<RelationTasksChip :meta="relatedTasksMeta" @add="handleAdd"/>
	`,
};
