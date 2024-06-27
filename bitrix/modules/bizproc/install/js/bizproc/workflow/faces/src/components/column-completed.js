import { Type } from 'main.core';
import { Column } from './column';

export const ColumnCompleted = {
	name: 'bp-workflow-faces-column-completed',
	components: {
		Column,
	},
	props: {
		avatars: Array,
		time: Number,
		successStatus: Boolean,
	},
	computed: {
		hasAvatars(): boolean
		{
			return Type.isArrayFilled(this.avatars);
		},
		status(): string
		{
			return this.successStatus ? 'accept' : 'decline';
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
			:title="loc('BIZPROC_JS_WORKFLOW_FACES_COLUMN_COMPLETED')"
			:avatars="hasAvatars ? avatars : null"
			:status="status"
			:time="time"
		/>
	`,
};
