import { BottomSheet } from 'tasks.v2.component.elements.bottom-sheet';

import { ReplicationSheetHeader } from './components/replication-sheet/header/replication-sheet-header';
import { ReplicationHistorySheetContent } from './components/replication-history-sheet/replication-history-sheet-content';

// @vue/component
export const ReplicationHistorySheets = {
	name: 'ReplicationHistorySheets',
	components: {
		BottomSheet,
		ReplicationSheetHeader,
		ReplicationHistorySheetContent,
	},
	props: {
		sheetBindProps: {
			type: Object,
			required: true,
		},
	},
	emits: ['close', 'update'],
	methods: {
		update(params: Partial<TaskReplicateParams>): void
		{
			this.$emit('update', params);
		},
	},
	template: `
		<BottomSheet :sheetBindProps @close="$emit('close')">
			<div class="tasks-field-replication-sheet">
				<ReplicationSheetHeader
					:head="loc('TASKS_V2_REPLICATION_HISTORY_SHEET')"
					@close="$emit('close')"
				/>
				<ReplicationHistorySheetContent/>
			</div>
		</BottomSheet>
	`,
};
