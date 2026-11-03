import { TextXs } from 'ui.system.typography.vue';
import { BLine } from 'ui.system.skeleton.vue';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { Model } from 'tasks.v2.const';
import { Color } from 'tasks.v2.lib.color';
import { groupService } from 'tasks.v2.provider.service.group-service';
import type { EpicModel } from 'tasks.v2.model.epics';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { epicDialog } from './epic-dialog';
import './epic.css';

// @vue/component
export const Epic = {
	components: {
		TextXs,
		BIcon,
		BLine,
	},
	inject: {
		task: {},
		taskId: {},
	},
	setup(): { task: TaskModel }
	{
		return {
			Outline,
		};
	},
	data(): Object
	{
		return {
			scrumInfoState: typeof groupService.getScrumInfoState === 'function'
				? groupService.getScrumInfoState(this.taskId)
				: 'loaded',
			unsubscribeScrumInfoState: null,
			isDialogShown: false,
			returnFocusElement: null,
		};
	},
	computed: {
		epic(): ?EpicModel
		{
			return this.$store.getters[`${Model.Epics}/getById`](this.task.epicId);
		},
		epicColor(): string
		{
			if (!this.epic)
			{
				return '';
			}

			return new Color(this.epic.color).toRgb();
		},
		backgroundColor(): string
		{
			if (!this.epic)
			{
				return '';
			}

			return new Color(this.epic.color).setOpacity(0.3).limit(250).toRgb();
		},
		isDarkColor(): boolean
		{
			if (!this.epic)
			{
				return false;
			}

			return new Color(this.epic.color).isDark();
		},
		canUpdateScrumFields(): boolean
		{
			return typeof this.taskId !== 'number'
				|| (this.task.canUpdateScrumFields !== false && this.task.rights?.edit !== false);
		},
		hasScrumInfo(): boolean
		{
			return this.scrumInfoState === 'loaded';
		},
	},
	watch: {
		taskId: async function onTaskIdChange(): Promise<void>
		{
			this.subscribeScrumInfoState?.(this.taskId);
			await this.loadScrumInfo();
		},
		'task.groupId': function onGroupChange(): void
		{
			void this.updateScrumInfoState();
		},
		'task.canCreateEpic': function onCanCreateEpicChange(): void
		{
			epicDialog.syncCreateAvailability(this.taskId);
		},
	},
	async mounted(): Promise<void>
	{
		this.subscribeScrumInfoState(this.taskId);
		await this.updateScrumInfoState();

		// A create-mode draft has a string taskId, so getScrumInfo above no-ops and never confirms the
		// create-epic right; resolve it by groupId and update an already-open non-reactive selector.
		await groupService.getEpicCreationRight(this.taskId);
		epicDialog.syncCreateAvailability(this.taskId);
	},
	beforeUnmount(): void
	{
		this.unsubscribeScrumInfoState?.();
	},
	methods: {
		subscribeScrumInfoState(taskId: number | string): void
		{
			this.unsubscribeScrumInfoState?.();
			this.unsubscribeScrumInfoState = groupService.subscribeScrumInfoState?.(
				taskId,
				(state) => { this.scrumInfoState = state; },
			);
		},
		async updateScrumInfoState(): Promise<void>
		{
			let request = groupService.getScrumInfo(this.taskId);
			this.scrumInfoState = groupService.getScrumInfoState?.(this.taskId) ?? 'loaded';
			await request;

			// A group change can finish the old request before the update flow starts its force refetch.
			// Start or join the current generation instead of accepting the stale loading state.
			if (groupService.getScrumInfoState?.(this.taskId) === 'loading')
			{
				request = groupService.getScrumInfo(this.taskId);
				this.scrumInfoState = groupService.getScrumInfoState?.(this.taskId) ?? 'loaded';
				await request;
			}

			this.scrumInfoState = groupService.getScrumInfoState?.(this.taskId) ?? 'loaded';
		},
		async loadScrumInfo(): Promise<void>
		{
			if (typeof this.updateScrumInfoState !== 'function')
			{
				await groupService.getScrumInfo(this.taskId);
				this.hasScrumInfo = groupService.hasScrumInfo(this.taskId);

				return;
			}

			await this.updateScrumInfoState();
		},
		showDialog(): void
		{
			if (!this.canUpdateScrumFields)
			{
				return;
			}

			this.returnFocusElement = document.activeElement;
			this.isDialogShown = true;
			epicDialog.show({
				targetNode: this.$el,
				taskId: this.taskId,
				onClose: this.handleDialogClose,
			});
		},
		handleDialogClose(): void
		{
			this.isDialogShown = false;

			const element = this.returnFocusElement;
			this.returnFocusElement = null;

			if (element?.isConnected)
			{
				element.focus?.();
			}
		},
	},
	template: `
		<button
			v-if="hasScrumInfo && !epic?.isRestricted && canUpdateScrumFields"
			type="button"
			class="tasks-field-epic print-background-white"
			:class="{ '--dark': isDarkColor, '--filled': epic }"
			:style="{
				'--epic-color': epicColor,
				'--epic-background': backgroundColor,
			}"
			:title="epic?.title"
			:aria-label="loc('TASKS_V2_GROUP_EPIC_ARIA_LABEL')"
			aria-haspopup="dialog"
			:aria-expanded="isDialogShown"
			@click="showDialog"
		>
			<TextXs className="tasks-field-epic-title">
				{{ epic?.title || loc('TASKS_V2_GROUP_CHOOSE_EPIC') }}
			</TextXs>
			<BIcon :name="Outline.CHEVRON_DOWN_S" class="print-ignore" aria-hidden="true"/>
		</button>
		<div v-else-if="hasScrumInfo && !epic?.isRestricted" class="tasks-field-epic print-background-white" :class="{ '--dark': isDarkColor, '--filled': epic }">
			<TextXs className="tasks-field-epic-title">{{ epic?.title || '-' }}</TextXs>
		</div>
		<div v-else-if="scrumInfoState === 'loading'" class="tasks-field-epic-loader">
			<BLine :width="80" :height="10"/>
		</div>
	`,
};
