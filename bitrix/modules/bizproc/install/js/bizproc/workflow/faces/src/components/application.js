import { Type, Text, ajax } from 'main.core';
import { EventEmitter, BaseEvent } from 'main.core.events';

import { Column } from './column';
import { ColumnAuthor } from './column-author';
import { ColumnDone } from './column-done';
import { ColumnRunning } from './column-running';
import { ColumnCompleted } from './column-completed';
import { Summary } from './summary';

import '../css/application.css';

const timeValidator = (time) => {
	return (Type.isNull(time) || time === 0 || Text.toInteger(time) > 0);
};

export const Application = {
	name: 'bp-workflow-faces-application',
	components: {
		Column,
		ColumnAuthor,
		ColumnDone,
		ColumnRunning,
		ColumnCompleted,
		Summary,
	},
	props: {
		avatars: {
			type: Object,
			required: true,
			validator: (value) => {
				return (
					Type.isArrayFilled(value.author)
					&& Type.isArray(value.running)
					&& Type.isArray(value.completed)
					&& Type.isArray(value.done)
				);
			},
		},
		statuses: {
			type: Object,
			validator: (value) => {
				return (
					Type.isBoolean(value.completedSuccess)
					&& Type.isBoolean(value.doneSuccess)
				);
			},
		},
		time: {
			type: Object,
			validator: (value) => {
				return (
					timeValidator(value.author)
					&& timeValidator(value.running)
					&& timeValidator(value.completed)
					&& timeValidator(value.done)
					&& timeValidator(value.total)
				);
			},
		},
		initialCompletedTaskCount: {
			type: Number,
			default: 0,
		},
		workflowIsCompleted: {
			type: Boolean,
			default: false,
		},
		workflowId: {
			type: String,
			required: true,
		},
		userId: {
			type: Number,
			required: true,
			validator: (value) => {
				return Type.isInteger(value) && value > 0;
			},
		},
		taskId: {
			type: Number,
			default: 0,
		},
		summaryProps: {
			type: Object,
			default: {
				showArrow: true,
				showContent: true,
			},
		},
	},
	data(): Object
	{
		return {
			author: {
				avatars: this.avatars.author,
				time: this.time.author,
			},
			running: {
				avatars: this.avatars.running,
				time: this.time.running,
			},
			completed: {
				avatars: this.avatars.completed,
				successStatus: this.statuses.completedSuccess,
				time: this.time.completed,
			},
			done: {
				avatars: this.avatars.done,
				successStatus: this.statuses.doneSuccess,
				time: this.time.done,
			},
			runningTaskId: this.taskId,
			isFinalState: this.workflowIsCompleted,
			completedTaskCount: this.initialCompletedTaskCount,
			handleUpdateData: (event: BaseEvent) => {
				this.updateData(event.getData());
			},
			unsubscribePushCallback: null,
			summary: {
				workflowId: this.workflowId,
				time: this.time.total,
				isFinalState: this.workflowIsCompleted,
				showArrow: Type.isBoolean(this.summaryProps.showArrow) ? this.summaryProps.showArrow : true,
				showContent: Type.isBoolean(this.summaryProps.showContent) ? this.summaryProps.showContent : true,
			},
			errorMessage: null,
		};
	},
	computed: {
		showCompletedColumn(): boolean
		{
			return Type.isArrayFilled(this.completed.avatars);
		},
		hasMoreTaskIcon(): boolean
		{
			return this.hiddenTasksCount > 0;
		},
		hiddenTasksCount(): number
		{
			if (this.isFinalState)
			{
				return this.completedTaskCount > 2 ? this.completedTaskCount - 2 : 0;
			}

			return this.completedTaskCount > 1 ? this.completedTaskCount - 1 : 0;
		},
		hasErrors(): boolean
		{
			return Type.isStringFilled(this.errorMessage);
		},
	},
	mounted()
	{
		this.subscribeOnEvents();
	},
	unmounted()
	{
		this.unsubscribeOnEvents();
	},
	methods: {
		subscribeOnEvents()
		{
			if (!this.isFinalState)
			{
				if (BX.PULL)
				{
					this.unsubscribePushCallback = BX.PULL.subscribe({
						moduleId: 'bizproc',
						command: 'workflow',
						callback: this.onPush.bind(this),
					});
				}

				if (this.$root.$app)
				{
					EventEmitter.subscribe(this.$root.$app, 'Bizproc.WorkflowFaces.OnUpdateData', this.handleUpdateData);
				}
			}
		},
		unsubscribeOnEvents()
		{
			if (Type.isFunction(this.unsubscribePushCallback))
			{
				this.unsubscribePushCallback();
				this.unsubscribePushCallback = null;
			}

			if (this.$root.$app)
			{
				EventEmitter.unsubscribe(this.$root.$app, 'Bizproc.WorkflowFaces.OnUpdateData', this.handleUpdateData);
			}
		},
		onPush(params)
		{
			if (params && params.eventName === 'UPDATED' && Type.isArrayFilled(params.items))
			{
				for (const item of params.items)
				{
					if (String(item.id) === this.workflowId)
					{
						this.load();

						return;
					}
				}
			}
		},
		load()
		{
			if (this.$refs.container)
			{
				ajax.runAction('bizproc.workflow.faces.load', {
					data: {
						workflowId: this.workflowId,
						runningTaskId: this.runningTaskId,
						userId: this.userId,
					},
				}).then(({ data }) => {
					this.updateData(data);
				}).catch(({ errors }) => {
					if (Type.isArrayFilled(errors))
					{
						const firstError = errors.pop();
						if (firstError.code === 'ACCESS_DENIED')
						{
							this.errorMessage = firstError.message;
						}
					}
				});
			}
		},
		updateData(data)
		{
			if (!Type.isPlainObject(data))
			{
				return;
			}

			const { avatars, time, statuses, completedTaskCount, workflowIsCompleted, runningTaskId } = data;
			if (!Type.isPlainObject(avatars) && !Type.isPlainObject(time) && !Type.isPlainObject(statuses))
			{
				return;
			}

			this.running = {
				avatars: Type.isArray(avatars.running) ? avatars.running : null,
				time: timeValidator(time.running) ? time.running : null,
			};
			this.completed = {
				avatars: Type.isArray(avatars.completed) ? avatars.completed : null,
				successStatus: Text.toBoolean(statuses.completedSuccess),
				time: timeValidator(time.completed) ? time.completed : null,
			};
			this.done = {
				avatars: Type.isArray(avatars.done) ? avatars.done : null,
				successStatus: Text.toBoolean(statuses.doneSuccess),
				time: timeValidator(time.done) ? time.done : null,
			};
			this.updateSummary(data);
			this.runningTaskId = Text.toInteger(runningTaskId);

			this.completedTaskCount = Text.toInteger(completedTaskCount);
			this.isFinalState = Text.toBoolean(workflowIsCompleted);

			if (this.isFinalState)
			{
				this.unsubscribeOnEvents();
			}
		},
		updateSummary(data)
		{
			const { time, workflowIsCompleted } = data;

			this.summary.time = timeValidator(time.total) ? time.total : null;
			this.summary.isFinalState = Text.toBoolean(workflowIsCompleted);
		},
	},
	template: `
		<div ref="container">
			<div class="bp-workflow-faces">
				<div v-if="hasErrors" class="bp-workflow-faces__steps">
					<span class="bp-workflow-faces__steps-error">{{ errorMessage }}</span>
				</div>
				<div v-else class="bp-workflow-faces__steps">
					<ColumnAuthor
						:avatars="author.avatars"
						:has-more-tasks="hasMoreTaskIcon"
						:tasks-count="hiddenTasksCount"
						:time="author.time"
					/>
					<ColumnCompleted
						v-if="showCompletedColumn"
						:avatars="completed.avatars"
						:time="completed.time"
						:success-status="completed.successStatus"
					/>
					<ColumnDone
						v-else-if="isFinalState"
						:avatars="done.avatars"
						:time="done.time"
						:success-status="done.successStatus"
					/>
					<ColumnRunning
						v-else
						:avatars="running.avatars"
						:time="running.time"
					/>
					<Column v-if="!showCompletedColumn"/>
					<ColumnDone
						v-else-if="isFinalState"
						:avatars="done.avatars"
						:time="done.time"
						:success-status="done.successStatus"
					/>
					<ColumnRunning
						v-else
						:avatars="running.avatars"
						:time="running.time"
					/>
					<Summary v-bind="summary"/>
				</div>
			</div>
		</div>
	`,
};
