import { Type } from 'main.core';
import { EventEmitter, BaseEvent } from 'main.core.events';
import { BitrixVue, VueCreateAppResult } from 'ui.vue3';

import { Application } from './components/application';

import 'ui.design-tokens';
import 'ui.icons';
import 'ui.icon-set.main';

export type Avatar = {
	id: number,
	avatarUrl: ?string,
};

export type FacesData = {
	avatars: {
		author: Array<Avatar>,
		running: Array<Avatar>,
		completed: Array<Avatar>,
		done: Array<Avatar>,
	},
	statuses: {
		completedSuccess: boolean,
		doneSuccess: boolean,
	},
	time: {
		author: ?number,
		running: ?number,
		completed: ?number,
		done: ?number,
		total: ?number,
	},
	completedTaskCount: number,
	workflowIsCompleted: boolean,
	runningTaskId: number,
	summaryProps: {
		showArrow: boolean,
		showContent: boolean,
	},
};

export class WorkflowFaces
{
	#target: HTMLElement;
	#data: FacesData = {};
	#workflowId: string;
	#targetUserId: number;
	#application: VueCreateAppResult;

	/**
	 * @param props
	 * @param {HTMLElement} props.target
	 * @param {?FacesData} props.data
	 * @param {string} props.workflowId
	 * @param {number} props.targetUserId
	 */
	constructor(props = {})
	{
		if (!Type.isStringFilled(props.workflowId))
		{
			throw new TypeError('workflowId must be filled string');
		}
		this.#workflowId = props.workflowId;

		if (!Type.isDomNode(props.target))
		{
			throw new TypeError('target must be dom node');
		}
		this.#target = props.target;

		if (!Type.isInteger(props.targetUserId) || props.targetUserId <= 0)
		{
			throw new TypeError('targetUserId must be positive integer');
		}
		this.#targetUserId = props.targetUserId;

		if (Type.isPlainObject(props.data))
		{
			this.#data = props.data;
		}

		this.#initApplication();
	}

	#initApplication()
	{
		// eslint-disable-next-line unicorn/no-this-assignment
		const context = this;

		this.#application = BitrixVue.createApp(
			{
				name: 'bp-workflow-faces',
				components: {
					Application,
				},
				props: {
					workflowId: String,
					userId: Number,
					avatars: Object,
					statuses: Object,
					time: Object,
					completedTaskCount: Number,
					workflowIsCompleted: Boolean,
					runningTaskId: Number,
					summaryProps: Object,
				},
				created()
				{
					this.$app = context;
				},
				template: `
					<Application
						:workflowId="workflowId"
						:userId="userId"
						:avatars="avatars"
						:statuses="statuses"
						:time="time"
						:workflow-is-completed="workflowIsCompleted"
						:initial-completed-task-count="completedTaskCount"
						:task-id="runningTaskId"
						:summary-props="summaryProps"
					></Application>
				`,
			},
			{
				workflowId: this.#workflowId,
				userId: this.#targetUserId,
				avatars: this.#data.avatars,
				statuses: this.#data.statuses,
				time: this.#data.time,
				completedTaskCount: this.#data.completedTaskCount,
				workflowIsCompleted: this.#data.workflowIsCompleted,
				runningTaskId: this.#data.runningTaskId,
				summaryProps: this.#data.summaryProps,
			},
		);
	}

	render()
	{
		this.#application.mount(this.#target);
	}

	updateData(data: FacesData)
	{
		EventEmitter.emit(this, 'Bizproc.WorkflowFaces.OnUpdateData', new BaseEvent({ data }));
	}

	destroy()
	{
		this.#application.unmount();
		this.#application = null;
		this.#target = null;
		this.#data = null;
		this.#workflowId = null;
	}
}
