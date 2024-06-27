import { Type } from 'main.core';
import { Column } from './column';

export const ColumnAuthor = {
	name: 'bp-workflow-faces-column-author',
	components: {
		Column,
	},
	props: {
		avatars: Array,
		time: Number,
		hasMoreTasks: {
			type: Boolean,
			default: false,
		},
		tasksCount: Number,
	},
	computed: {
		hasAvatars(): boolean
		{
			return Type.isArrayFilled(this.avatars);
		},
	},
	methods: {
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<Column
			:title="loc('BIZPROC_JS_WORKFLOW_FACES_COLUMN_AUTHOR')"
			:avatars="hasAvatars ? avatars : null"
			:has-more-tasks="hasMoreTasks"
			:tasks-count="tasksCount"
			:time="time"
		/>
	`,
};
