import { TextMd, Text2Xs } from 'ui.system.typography.vue';
import { BIcon, Outline } from 'ui.icon-set.api.vue';

import { Core } from 'tasks.v2.core';
import { HoverPill } from 'tasks.v2.component.elements.hover-pill';
import { SettingsLabel } from 'tasks.v2.component.elements.settings-label';
import { taskService } from 'tasks.v2.provider.service.task-service';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { formatExpiredDuration } from './expired-duration-format';

// @vue/component
export const DeadlineDefaultView = {
	components: {
		TextMd,
		Text2Xs,
		BIcon,
		HoverPill,
		SettingsLabel,
	},
	props: {
		taskId: {
			type: [Number, String],
			required: true,
		},
		deadlineFormatted: {
			type: String,
			required: true,
		},
		deadlineFormattedForPrint: {
			type: String,
			required: true,
		},
		isExpired: {
			type: Boolean,
			required: true,
		},
		readonly: {
			type: Boolean,
			required: true,
		},
		isPopupShown: {
			type: Boolean,
			required: true,
		},
		deadlineTs: {
			type: Number,
			default: null,
		},
		isFlowFilledOnAdd: {
			type: Boolean,
			required: true,
		},
		isTemplate: {
			type: Boolean,
			required: true,
		},
		isHovered: {
			type: Boolean,
			required: true,
		},
		isFieldHovered: {
			type: Boolean,
			required: true,
		},
		isSettingsPopupShown: {
			type: Boolean,
			required: true,
		},
		expiredDuration: {
			type: Number,
			required: true,
		},
	},
	emits: ['click', 'clear', 'settingsClick', 'update:isExceededHintShown'],
	computed: {
		task(): TaskModel
		{
			return taskService.getStoreTask(this.taskId);
		},
		canChangeSettings(): boolean
		{
			const features = Core.getParams().features;
			if (!features.isV2Enabled)
			{
				return false;
			}

			return this.task.rights.edit;
		},
		iconName(): string
		{
			return this.isFlowFilledOnAdd ? Outline.BOTTLENECK : Outline.CALENDAR_WITH_SLOTS;
		},
		expiredFormatted(): string
		{
			return this.loc('TASKS_V2_DEADLINE_EXPIRED', {
				'#EXPIRED_DURATION#': formatExpiredDuration(this.expiredDuration),
			});
		},
		hintBindElement(): HTMLElement
		{
			return this.$refs.deadlineIcon?.$el ?? this.$refs.deadline?.$el;
		},
		ariaLabel(): string
		{
			if (this.readonly)
			{
				return '';
			}

			return this.loc('TASKS_V2_DEADLINE_VALUE_ARIA_LABEL', {
				'#VALUE#': this.deadlineFormatted,
			});
		},
	},
	methods: {
		getHintBindElement(): HTMLElement
		{
			return this.hintBindElement;
		},
		focusDeadline(): void
		{
			this.$refs.deadline?.$el?.querySelector('.b24-hover-pill-content')?.focus();
		},
	},
	template: `
		<div
			class="tasks-field-deadline"
			:class="{ '--expired': isExpired }"
			data-testid="tasks-deadline"
		>
			<div class="tasks-field-deadline-inner">
				<HoverPill
					:withClear="Boolean(deadlineTs)"
					:readonly="readonly"
					:textOnly="false"
					:noOffset="false"
					:active="isPopupShown"
					:alert="isExpired"
					:ariaLabel
					:ariaHaspopup="readonly ? '' : 'dialog'"
					:ariaExpanded="readonly ? null : isPopupShown"
					:clearAriaLabel="loc('TASKS_V2_DEADLINE_CLEAR_ARIA_LABEL')"
					@click="$emit('click')"
					@clear="$emit('clear')"
					@mouseover="$emit('update:isExceededHintShown', true)"
					@mouseleave="$emit('update:isExceededHintShown', false)"
					data-testid="tasks-deadline-field-btn"
					ref="deadline"
				>
					<BIcon
						class="tasks-field-deadline-icon"
						:name="iconName"
						ref="deadlineIcon"
					/>
					<TextMd
						class="tasks-field-deadline-text print-ignore"
						:accent="isExpired"
					>
						{{ deadlineFormatted }}
					</TextMd>
					<TextMd
						class="tasks-field-deadline-text --display-none print-display-block"
						:accent="isExpired"
					>
						{{ deadlineFormattedForPrint }}
					</TextMd>
				</HoverPill>
				<div
					v-if="!isFlowFilledOnAdd"
					class="tasks-field-deadline-settings-label"
					:class="{ '--visible': isHovered || isFieldHovered || isSettingsPopupShown }"
					ref="settings"
				>
					<SettingsLabel
						v-if="canChangeSettings"
						data-settings-label
						data-testid="tasks-deadline-settings-btn"
						:ariaLabel="loc('TASKS_V2_DEADLINE_SETTINGS_ARIA_LABEL')"
						@click="$emit('settingsClick')"
					/>
				</div>
			</div>
			<Text2Xs v-if="isExpired" class="tasks-field-deadline-expired print-ignore">{{ expiredFormatted }}</Text2Xs>
		</div>
	`,
};
