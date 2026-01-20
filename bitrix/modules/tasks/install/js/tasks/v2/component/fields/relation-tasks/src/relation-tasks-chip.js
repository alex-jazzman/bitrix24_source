import { Chip, ChipDesign } from 'ui.system.chip.vue';

import { showLimit } from 'tasks.v2.lib.show-limit';
import { fieldHighlighter } from 'tasks.v2.lib.field-highlighter';
import type { TaskModel } from 'tasks.v2.model.tasks';

// @vue/component
export const RelationTasksChip = {
	components: {
		Chip,
	},
	inject: {
		task: {},
		taskId: {},
		isTemplate: {},
	},
	props: {
		/** @type RelationFieldMeta */
		meta: {
			type: Object,
			required: true,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		isLocked: {
			type: Boolean,
			default: false,
		},
		featureId: {
			type: String,
			default: '',
		},
	},
	emits: ['add'],
	setup(): { task: TaskModel } {},
	computed: {
		count(): number
		{
			return this.task[this.meta.idsField].length;
		},
		design(): string
		{
			if (this.disabled)
			{
				return ChipDesign.ShadowDisabled;
			}

			return this.isSelected ? ChipDesign.ShadowAccent : ChipDesign.ShadowNoAccent;
		},
		isSelected(): boolean
		{
			return this.task.filledFields[this.meta.id];
		},
	},
	methods: {
		handleClick(): void
		{
			if (this.disabled)
			{
				return;
			}

			if (this.isSelected)
			{
				this.highlightField();

				return;
			}

			if (this.isLocked)
			{
				void showLimit({ featureId: this.featureId });

				return;
			}

			this.$emit('add', this.$el);
		},
		highlightField(): void
		{
			void fieldHighlighter.setContainer(this.$root.$el).highlight(this.meta.id);
		},
	},
	template: `
		<Chip
			:design
			:text="meta.getChipTitle(isTemplate)"
			:icon="meta.icon"
			:lock="isLocked"
			:data-task-id="taskId"
			:data-task-chip-id="meta.id"
			@click="handleClick"
		/>
	`,
};
