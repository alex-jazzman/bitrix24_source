import { TaskCard } from 'tasks.v2.application.task-card';

import { type ImModelChat } from 'im.v2.model';

import '../css/task-comments.css';

// @vue/component
export const TaskCommentsCard = {
	name: 'TaskCommentsCard',
	props: {
		dialogId: {
			type: String,
			required: true,
		},
	},
	computed: {
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.dialogId, true);
		},
		taskId(): number
		{
			return Number(this.dialog.entityLink.id);
		},
	},
	watch: {
		dialogId(newValue: string, oldValue: string)
		{
			const chatSwitched = Boolean(newValue && oldValue);

			if (chatSwitched)
			{
				this.destroyTaskCard();
				void this.openTaskCard();
			}
		},
	},
	created()
	{
		void this.openTaskCard();
	},
	beforeUnmount()
	{
		this.destroyTaskCard();
	},
	methods: {
		async openTaskCard()
		{
			this.taskCardInstance = await TaskCard.embedFullCard({ taskId: this.taskId });
			this.taskCardInstance.mount(this.$refs['task-card-container']);
		},
		destroyTaskCard()
		{
			this.taskCardInstance.unmount();
			this.taskCardInstance = null;
		},
	},
	template: `
		<div ref="task-card-container" class="bx-im-task-comments-card__container"></div>
	`,
};
