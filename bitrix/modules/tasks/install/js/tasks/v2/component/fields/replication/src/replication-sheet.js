import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { BottomSheet } from 'tasks.v2.component.elements.bottom-sheet';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { ReplicationSheetContent } from './components/replication-sheet/replication-sheet-content';

type Inject = { task: TaskModel };

// @vue/component
export const ReplicationSheet = {
	name: 'ReplicationSheet',
	components: {
		BIcon,
		BottomSheet,
		ReplicationSheetContent,
	},
	inject: {
		task: {},
	},
	props: {
		sheetBindProps: {
			type: Object,
			required: true,
		},
	},
	emits: ['close'],
	setup(): { Outline: typeof Outline } & Inject
	{
		return {
			Outline,
		};
	},
	template: `
		<BottomSheet
			:sheetBindProps
			customClass="tasks-bottom-sheet-replicate-content"
			@close="$emit('close')"
		>
			<ReplicationSheetContent @close="$emit('close')"/>
		</BottomSheet>
	`,
};
