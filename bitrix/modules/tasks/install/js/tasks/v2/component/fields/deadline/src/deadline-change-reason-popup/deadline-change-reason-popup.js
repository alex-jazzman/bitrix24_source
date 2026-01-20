import type { PopupOptions } from 'main.popup';

import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { BInput } from 'ui.system.input.vue';
import 'ui.icon-set.outline';
import { AirButtonStyle, Button as UiButton, ButtonSize } from 'ui.vue3.components.button';
import { Popup } from 'ui.vue3.components.popup';
import 'ui.forms';

import './deadline-change-reason-popup.css';

// @vue/component
export const DeadlineChangeReasonPopup = {
	name: 'DeadlineChangeReasonPopup',
	components: {
		BIcon,
		BInput,
		UiButton,
		Popup,
	},
	props: {
		taskId: {
			type: [Number, String],
			required: true,
		},
		bindElement: {
			type: HTMLElement,
			required: true,
		},
		modelValue: {
			type: String,
			required: true,
		},
	},
	emits: ['update:modelValue', 'close'],
	setup(): Object
	{
		return {
			AirButtonStyle,
			ButtonSize,
			Outline,
		};
	},
	data(): Object
	{
		return {
			resolve: null,
			reject: null,
		};
	},
	computed: {
		options(): PopupOptions
		{
			return {
				id: `tasks-deadline-change-reason-popup-${this.taskId}`,
				className: 'tasks-deadline-change-reason-popup',
				bindElement: this.bindElement,
				padding: 24,
				width: 472,
				height: 324,
				offsetLeft: -24,
				targetContainer: document.body,
			};
		},
		reason: {
			get(): string
			{
				return this.modelValue;
			},
			set(value: string): void
			{
				this.$emit('update:modelValue', value);
			},
		},
	},
	methods: {
		handleClose(): void
		{
			this.reason = '';

			this.$emit('close');
		},
		handleSave(): void
		{
			if (this.reason === '')
			{
				return;
			}

			this.$emit('close');
		},
	},
	template: `
		<Popup :options @close="handleClose">
			<div class="tasks-deadline-change-reason-popup-header">
				<div class="tasks-deadline-change-reason-popup-title">
					{{ loc('TASKS_V2_DEADLINE_CHANGE_REASON_POPUP_TITLE') }}
				</div>
				<BIcon
					:name="Outline.CROSS_L"
					hoverable
					class="tasks-deadline-change-reason-popup-close-icon"
					@click="handleClose"
				/>
			</div>
			<div class="tasks-deadline-change-reason-popup-content">
				<div class="tasks-deadline-change-reason-popup-message">
					{{ loc('TASKS_V2_DEADLINE_CHANGE_REASON_POPUP_MESSAGE') }}
				</div>
				<BInput
					v-model="reason"
					:rowsQuantity="6"
					active
					resize="none"
					data-id="tasks-deadline-change-reason-popup-reason"
				/>
			</div>
			<div class="tasks-deadline-change-reason-popup-footer">
				<UiButton
					:text="loc('TASKS_V2_DEADLINE_CHANGE_REASON_POPUP_BTN_CANCEL')"
					:size="ButtonSize.MEDIUM"
					:style="AirButtonStyle.PLAIN"
					:dataset="{
						deadlineChangeReasonButtonId: 'cancel',
					}"
					@click="handleClose"
				/>
				<UiButton
					:text="loc('TASKS_V2_DEADLINE_CHANGE_REASON_POPUP_BTN_SAVE')"
					:size="ButtonSize.MEDIUM"
					:disabled="reason === ''"
					:style="AirButtonStyle.FILLED"
					:dataset="{
						deadlineChangeReasonButtonId: 'save',
					}"
					@click="handleSave"
				/>
			</div>
		</Popup>
	`,
};
