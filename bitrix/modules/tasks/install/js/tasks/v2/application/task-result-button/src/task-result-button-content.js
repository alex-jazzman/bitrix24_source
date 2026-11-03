import { Runtime } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { Outline } from 'ui.icon-set.api.core';
import { Chip, ChipDesign, ChipSize } from 'ui.system.chip.vue';
import { Center } from 'ui.notification';

import { apiClient } from 'tasks.v2.lib.api-client';
import { Analytics, CardType, Endpoint, EventName } from 'tasks.v2.const';

export type BeforeSendResult = {
	handled: boolean,
	keepText: boolean,
};

// @vue/component
export const TaskResultButtonContent = {
	name: 'TasksTaskResultButton',
	components: { Chip },
	props: {
		context: {
			type: Object,
			required: true,
		},
	},
	setup(): Object
	{
		return {
			ChipSize,
		};
	},
	data(): Object
	{
		return {
			isActive: false,
			isSaving: false,
		};
	},
	computed: {
		chipText(): string
		{
			return this.loc('TASKS_V2_APPLICATION_TASK_RESULT_BUTTON_TEXT');
		},
		chipIcon(): string
		{
			return this.isSaving ? Outline.HOURGLASS : Outline.WINDOW_FLAG;
		},
		chipDesign(): string
		{
			return this.isActive ? ChipDesign.ShadowOutlineAccent2 : ChipDesign.OutlineNoAccent;
		},
	},
	methods: {
		handleClick(): void
		{
			if (this.isSaving)
			{
				return;
			}

			this.isActive = !this.isActive;
		},
		async handleBeforeSend(text: string): Promise<BeforeSendResult>
		{
			if (!this.isActive)
			{
				return { handled: false, keepText: false };
			}

			if (this.isSaving)
			{
				return { handled: true, keepText: true };
			}

			const trimmed = (text ?? '').trim();
			if (trimmed === '')
			{
				return { handled: true, keepText: true };
			}

			const isAdded = await this.addResult(trimmed);
			if (isAdded)
			{
				return { handled: true, keepText: false };
			}

			this.showError();

			return { handled: true, keepText: true };
		},
		async addResult(text: string): Promise<boolean>
		{
			this.isSaving = true;

			try
			{
				await apiClient.post(Endpoint.TaskResultAdd, {
					results: [{ taskId: this.context.taskId, text }],
				});

				this.emitResultAdded();
				this.sendAnalytics();
				this.isActive = false;

				return true;
			}
			catch
			{
				return false;
			}
			finally
			{
				this.isSaving = false;
			}
		},
		emitResultAdded(): void
		{
			const payload = { taskId: this.context.taskId };
			EventEmitter.emit(EventName.ResultSuccessfulAdded, payload);
			EventEmitter.emit(EventName.ResultAdded, payload);
		},
		sendAnalytics(): void
		{
			Runtime.loadExtension('tasks.v2.lib.analytics')
				.then((extension) => {
					extension.analytics.sendStatusSummaryAdd(
						{
							context: '',
							additionalContext: '',
							element: Analytics.Element.AddResult,
						},
						{
							isSuccess: true,
							cardType: CardType.Full,
							taskId: this.context.taskId,
							element: Analytics.Element.AddResult,
							subSection: Analytics.SubSection.Chat,
						},
					);
				})
				.catch((error) => {
					console.error('TaskResultButton: analytics failed', error);
				});
		},
		showError(): void
		{
			Center.notify({
				content: this.loc('TASKS_V2_APPLICATION_TASK_RESULT_BUTTON_ADD_ERROR'),
			});
		},
	},
	template: `
		<Chip
			:size="ChipSize.Sm"
			:design="chipDesign"
			:text="chipText"
			:icon="chipIcon"
			data-testid="task-result-button"
			role="button"
			:aria-label="chipText"
			:aria-pressed="isActive ? 'true' : 'false'"
			:aria-disabled="isSaving ? 'true' : 'false'"
			rounded
			@click="handleClick"
			@keydown.space.prevent="handleClick"
		/>
	`,
};
