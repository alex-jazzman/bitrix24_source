import { Runtime } from 'main.core';

import '../css/task-comments-history.css';

import type { ImModelChat } from 'im.v2.model';

type HistoryGridExtension = {
	HistoryGrid: {
		openHistoryGrid: ({ taskId: number }) => void,
	}
};

// @vue/component
export const TaskCommentsHistory = {
	name: 'TaskCommentsHistory',
	props: {
		dialogId: {
			type: String,
			required: true,
		},
	},
	computed: {
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.dialogId);
		},
	},
	methods: {
		async onClick()
		{
			const { id: entityId } = this.dialog.entityLink;
			const taskId = Number(entityId);

			const { HistoryGrid } = (await Runtime.loadExtension('tasks.v2.application.history-grid'): HistoryGridExtension);
			HistoryGrid.openHistoryGrid({ taskId });
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div class="bx-im-sidebar-task-comments-history__container" @click="onClick">
			<div class="bx-im-sidebar-task-comments-history__title-container">
				<div class="bx-im-sidebar-task-comments-history__icon"></div>
				<div class="bx-im-sidebar-task-comments-history__title">
					{{ loc('IM_SIDEBAR_TASK_COMMENTS_HISTORY_TITLE') }}
				</div>
			</div>
			<div class="bx-im-sidebar-task-comments-history__open-icon"></div>
		</div>
	`,
};
