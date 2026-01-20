import { mapGetters } from 'ui.vue3.vuex';
import { Chip, ChipDesign } from 'ui.system.chip.vue';
import { Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { Model } from 'tasks.v2.const';
import { fieldHighlighter } from 'tasks.v2.lib.field-highlighter';
import type { TaskModel } from 'tasks.v2.model.tasks';
import type { UserFieldScheme } from 'tasks.v2.model.interface';
import type { UserField } from './user-fields-manager';

import { userFieldsMeta } from './user-fields-meta';
import { userFieldsManager } from './user-fields-manager';

export const UserFieldsChip = {
	components: {
		Chip,
	},
	inject: {
		task: {},
		taskId: {},
		isEdit: {},
		isTemplate: {},
	},
	emits: ['open'],
	setup(): { task: TaskModel }
	{
		return {
			Outline,
			userFieldsMeta,
		};
	},
	computed: {
		...mapGetters({
			currentUserId: `${Model.Interface}/currentUserId`,
			taskUserFieldScheme: `${Model.Interface}/taskUserFieldScheme`,
			templateUserFieldScheme: `${Model.Interface}/templateUserFieldScheme`,
		}),
		design(): string
		{
			return this.isSelected ? ChipDesign.ShadowAccent : ChipDesign.ShadowNoAccent;
		},
		userFieldScheme(): UserFieldScheme[]
		{
			return this.isTemplate
				? this.templateUserFieldScheme
				: this.taskUserFieldScheme
			;
		},
		userFields(): UserField[]
		{
			return this.task.userFields || [];
		},
		hasFilledUserFields(): boolean
		{
			return userFieldsManager.hasFilledUserFields(this.task?.userFields || [], this.userFieldScheme);
		},
		hasRequiredUserFields(): boolean
		{
			return userFieldsManager.hasMandatoryUserFields(this.userFieldScheme);
		},
		isSelected(): boolean
		{
			return this.isEdit
				? this.hasFilledUserFields
				: this.hasRequiredUserFields || this.hasFilledUserFields
			;
		},
		readonly(): boolean
		{
			return !this.task.rights.edit;
		},
	},
	methods: {
		handleClick(): void
		{
			if (this.isSelected)
			{
				this.highlightField();
			}
			else
			{
				this.$emit('open');
			}
		},
		highlightField(): void
		{
			void fieldHighlighter.setContainer(this.$root.$el).highlight(userFieldsMeta.id);
		},
	},
	template: `
		<Chip
			:design
			:text="userFieldsMeta.title"
			:icon="Outline.TOPIC"
			:data-task-id="taskId"
			:data-task-chip-id="userFieldsMeta.id"
			@click="handleClick"
		/>
	`,
};
