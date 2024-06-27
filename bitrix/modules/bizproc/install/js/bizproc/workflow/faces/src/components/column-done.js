import { Type } from 'main.core';
import { Column } from './column';

export const ColumnDone = {
	name: 'bp-workflow-faces-column-done',
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
			return this.hasAvatars ? (this.successStatus ? 'accept' : 'decline') : 'accept';
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
			:title="loc('BIZPROC_JS_WORKFLOW_FACES_COLUMN_DONE')"
			:avatars="hasAvatars ? avatars : null"
			:status="status"
			:time="time"
		/>
	`,
};
