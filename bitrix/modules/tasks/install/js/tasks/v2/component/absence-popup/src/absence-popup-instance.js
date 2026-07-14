import { Dom, Text } from 'main.core';
import { DateTimeFormat } from 'main.date';
import type { PopupOptions } from 'main.popup';

import { TextLg, TextXs } from 'ui.system.typography.vue';
import { AirButtonStyle, Button as UiButton, ButtonSize } from 'ui.vue3.components.button';
import { Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { Model } from 'tasks.v2.const';
import { Hint } from 'tasks.v2.component.elements.hint';
import { calendar } from 'tasks.v2.lib.calendar';
import { absenceService } from 'tasks.v2.provider.service.absence-service';
import { type UserModel } from 'tasks.v2.model.users';
import { type UserAbsence } from 'tasks.v2.model.absences';

import './absence-popup.css';

const popupClassName = 'tasks-absence-popup';

// @vue/component
export const AbsencePopupInstance = {
	name: 'AbsencePopupInstance',
	components: {
		Hint,
		TextLg,
		TextXs,
		UiButton,
	},
	inject: {
		taskId: {},
	},
	props: {
		bindElement: {
			type: HTMLElement,
			required: true,
		},
		userId: {
			type: Number,
			required: true,
		},
		shown: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['update:shown'],
	setup(): Object
	{
		return {
			AirButtonStyle,
			ButtonSize,
			Outline,
		};
	},
	computed: {
		user(): UserModel
		{
			return this.$store.getters[`${Model.Users}/getById`](this.userId);
		},
		userAbsences(): UserAbsence[]
		{
			return this.$store.getters[`${Model.Absences}/getByUserId`](this.userId);
		},
		absence(): ?UserAbsence
		{
			const todayTs = calendar.todyTs;

			return this.userAbsences.find(({ fromTs, toTs }) => todayTs >= fromTs && todayTs <= toTs);
		},
		text(): string
		{
			if (!this.absence)
			{
				return '';
			}

			if (this.absence.fromTs === this.absence.toTs)
			{
				return this.loc('TASKS_V2_ABSENCE_POPUP_SINGLE_DATE_TEXT', {
					'#USER_NAME#': this.user.name,
					'#DATE#': this.formatDate(this.absence.fromTs),
				});
			}

			return this.loc('TASKS_V2_ABSENCE_POPUP_TEXT', {
				'#USER_NAME#': this.user.name,
				'#DATE_FROM#': this.formatDate(this.absence.fromTs),
				'#DATE_TO#': this.formatDate(this.absence.toTs),
			});
		},
		options(): PopupOptions
		{
			return {
				id: `tasks-task-absence-popup-${this.userId}-${this.absence?.id}-${Text.getRandom()}`,
				className: `${popupClassName} tasks-hint-popup`,
				offsetLeft: 0,
				angle: {
					offset: 38,
				},
				autoHideHandler: this.handleHide.bind(this),
				closeIcon: true,
				bindOptions: {
					forceBindPosition: true,
					forceTop: true,
					position: 'bottom',
				},
			};
		},
	},
	unmounted(): void
	{
		this.tooltip?.close();
	},
	methods: {
		close(): void
		{
			this.$emit('update:shown', false);
		},
		handleHide(event: MouseEvent): void
		{
			return !Dom.hasClass(event.target?.parentNode, popupClassName);
		},
		async handleViewed(): Promise<void>
		{
			await absenceService.setViewed(this.absence.id, this.userId);

			this.close();
		},
		formatDate(ts: number = 0): string
		{
			return DateTimeFormat
				.format(DateTimeFormat.getFormat('LONG_DATE_FORMAT'), ts / 1000)
				?.replaceAll(' ', '\u00A0');
		},
	},
	template: `
		<Hint v-if="shown && absence?.userId === userId" :bindElement :options @close="close">
			<div class="tasks-task-absence-popup-content" data-testid="task-absence-popup">
				<div class="tasks-task-absence-popup-body">
					<TextLg class="tasks-task-absence-popup-body-text">{{ text }}</TextLg>
				</div>
				<div class="tasks-task-absence-popup-footer">
					<button
						class="tasks-task-absence-popup-footer-btn --ui-context-edge-dark"
						type="button"
						data-task-absence-button-id="viewed"
						data-testid="task-absence-popup-viewed-btn"
						@click="handleViewed"
					>
						<TextXs>{{ loc('TASKS_V2_ABSENCE_POPUP_VIEWED_BUTTON_LABEL') }}</TextXs>
					</button>
				</div>
			</div>
		</Hint>
	`,
};
