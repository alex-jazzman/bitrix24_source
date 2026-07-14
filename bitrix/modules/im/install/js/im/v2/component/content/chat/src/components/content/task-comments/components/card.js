import { TaskCard } from 'tasks.v2.application.task-card';

import '../css/task-comments.css';

type FullCardParams = {
	taskId: number,
	onCloseEmbedded: () => void,
};

// @vue/component
export const TaskCommentsCard = {
	name: 'TaskCommentsCard',
	props: {
		dialogId: {
			type: String,
			required: true,
		},
		taskId: {
			type: Number,
			required: true,
		},
	},
	emits: ['close'],
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
			const params: FullCardParams = {
				taskId: this.taskId,
				onCloseEmbedded: () => this.$emit('close'),
			};

			this.taskCardInstance = await TaskCard.embedFullCard(params);
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
