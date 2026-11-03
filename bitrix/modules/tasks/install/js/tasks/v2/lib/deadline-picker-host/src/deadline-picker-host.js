import { Dom, Type } from 'main.core';
import { Notifier } from 'ui.notification-manager';
import { BitrixVue, computed, type VueCreateAppResult } from 'ui.vue3';
import { locMixin } from 'ui.vue3.mixins.loc-mixin';

import { Analytics, CardType } from 'tasks.v2.const';
import { Core } from 'tasks.v2.core';
import { DeadlinePopup, DeadlineChangeReasonPopup } from 'tasks.v2.component.fields.deadline';
import { deadlineRules, DeadlineSaveStatus, type DeadlineSaveResult } from 'tasks.v2.lib.deadline-rules';
import { idUtils } from 'tasks.v2.lib.id-utils';
import { taskService } from 'tasks.v2.provider.service.task-service';
import { type TaskModel } from 'tasks.v2.model.tasks';

export type DeadlinePickerRequest = {
	taskId: number,
	bindElement: HTMLElement,
	coordinates?: ?{ x: number, y: number },
};

export const DeadlinePickerOpenStatus = Object.freeze({
	Opened: 'opened',
	InvalidRequest: 'invalidRequest',
	CoreUnavailable: 'coreUnavailable',
	Superseded: 'superseded',
	TaskUnavailable: 'taskUnavailable',
});

export type DeadlinePickerStatus =
	'opened'
	| 'invalidRequest'
	| 'coreUnavailable'
	| 'superseded'
	| 'taskUnavailable'
;

const analyticsParams = Object.freeze({
	context: Analytics.Section.Tasks,
});

const DeadlineChangeReasonPopupRoot = {
	name: 'TasksDeadlineChangeReasonPopupRoot',
	components: {
		DeadlineChangeReasonPopup,
	},
	props: {
		taskId: {
			type: Number,
			required: true,
		},
		bindElement: {
			type: HTMLElement,
			required: true,
		},
	},
	emits: ['close'],
	data(): Object
	{
		return {
			reason: '',
		};
	},
	methods: {
		handleClose(): void
		{
			this.$emit('close', this.reason);
		},
	},
	template: `
		<DeadlineChangeReasonPopup
			:taskId
			:bindElement
			v-model="reason"
			@close="handleClose"
		/>
	`,
};

export class DeadlinePickerHost
{
	#application: ?VueCreateAppResult = null;
	#container: ?HTMLElement = null;
	#taskId: number = 0;
	#bindElement: ?HTMLElement = null;
	#taskDeadlineTs: ?number = null;
	#pickedTs: ?number = null;
	#openId: number = 0;

	async open(request: DeadlinePickerRequest): Promise<DeadlinePickerStatus>
	{
		if (!this.#isValid(request))
		{
			return DeadlinePickerOpenStatus.InvalidRequest;
		}

		this.close();

		const openId = ++this.#openId;

		try
		{
			await Core.init();
		}
		catch
		{
			return DeadlinePickerOpenStatus.CoreUnavailable;
		}

		if (openId !== this.#openId)
		{
			return DeadlinePickerOpenStatus.Superseded;
		}

		const task = taskService.getStoreTask(request.taskId);
		if (!task)
		{
			return DeadlinePickerOpenStatus.TaskUnavailable;
		}

		this.#taskId = request.taskId;
		this.#bindElement = request.bindElement;
		this.#taskDeadlineTs = task.deadlineTs ?? null;
		this.#pickedTs = this.#taskDeadlineTs;

		this.#mount(DeadlinePopup, {
			taskId: request.taskId,
			deadlineTs: this.#pickedTs,
			bindElement: request.bindElement,
			coordinates: request.coordinates ?? null,
			'onUpdate:deadlineTs': (deadlineTs: number): void => {
				this.#pickedTs = deadlineTs;
			},
			onClose: (): void => {
				void this.#handlePickerClose();
			},
		});

		return DeadlinePickerOpenStatus.Opened;
	}

	close(): void
	{
		const application = this.#application;
		const container = this.#container;

		this.#application = null;
		this.#container = null;

		Dom.attr(this.#bindElement, 'aria-haspopup', null);

		application?.unmount();
		container?.remove();

		this.#bindElement = null;
	}

	#mount(component: Object, props: Object): void
	{
		const container = document.createElement('div');
		document.body.append(container);

		Dom.attr(this.#bindElement, 'aria-haspopup', 'dialog');

		const application = BitrixVue.createApp(component, props);

		application.mixin(locMixin);
		application.use(Core.getStore());
		this.#provide(application);
		application.mount(container);

		this.#application = application;
		this.#container = container;
	}

	#provide(application: VueCreateAppResult): void
	{
		const taskId = this.#taskId;

		application.provide('settings', Core.getParams());
		application.provide('analytics', analyticsParams);
		application.provide('analyticsSubSection', Analytics.SubSection.Chat);
		application.provide('embedded', false);
		application.provide('onCloseEmbedded', null);
		application.provide('popupTeleportTarget', null);
		application.provide('cardType', CardType.Full);
		application.provide('task', computed((): ?TaskModel => taskService.getStoreTask(taskId)));
		application.provide('taskId', computed((): number => taskId));
		application.provide('isEdit', computed((): boolean => idUtils.isReal(taskId)));
		application.provide('isTemplate', computed((): boolean => idUtils.isTemplate(taskId)));
	}

	async #handlePickerClose(): Promise<void>
	{
		if (!this.#application)
		{
			return;
		}

		const deadlineTs = this.#pickedTs;
		const bindElement = this.#bindElement;

		this.close();

		if ((deadlineTs ?? 0) === (this.#taskDeadlineTs ?? 0))
		{
			return;
		}

		if (deadlineRules.requiresChangeReason(this.#taskId))
		{
			this.#showChangeReasonPopup(bindElement);

			return;
		}

		await this.#saveDeadline(deadlineTs, '');
	}

	#showChangeReasonPopup(bindElement: ?HTMLElement): void
	{
		this.#bindElement = bindElement;

		this.#mount(DeadlineChangeReasonPopupRoot, {
			taskId: this.#taskId,
			bindElement,
			onClose: (changeReason: string = ''): void => {
				void this.#handleChangeReasonClose(changeReason);
			},
		});
	}

	async #handleChangeReasonClose(changeReason: string): Promise<void>
	{
		if (!this.#application)
		{
			return;
		}

		this.close();

		if (changeReason.trim() === '')
		{
			return;
		}

		await this.#saveDeadline(this.#pickedTs, changeReason);
	}

	async #saveDeadline(deadlineTs: ?number, changeReason: string): Promise<void>
	{
		const result: DeadlineSaveResult = deadlineTs
			? await deadlineRules.saveDeadline(this.#taskId, { deadlineTs, changeReason })
			: await deadlineRules.clearDeadline(this.#taskId, { changeReason })
		;

		if (result.status === DeadlineSaveStatus.Failed)
		{
			Notifier.notifyViaBrowserProvider({
				id: 'task-notify-deadline-update-error',
				text: result.errors?.[0]?.message,
			});
		}
	}

	#isValid(request: DeadlinePickerRequest): boolean
	{
		if (!Type.isPlainObject(request))
		{
			return false;
		}

		return (
			Type.isNumber(request.taskId)
			&& request.taskId > 0
			&& Type.isDomNode(request.bindElement)
		);
	}
}

export const deadlinePickerHost = new DeadlinePickerHost();
