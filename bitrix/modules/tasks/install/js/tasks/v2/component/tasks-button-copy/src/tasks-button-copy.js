import { Notifier } from 'ui.notification-manager';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import './tasks-button-copy.css';

// @vue/component
export const TasksButtonCopy = {
	name: 'TasksButtonCopy',
	components: {
		BIcon,
	},
	props: {
		name: {
			type: String,
			default: '',
		},
		value: {
			type: String,
			default: '',
		},
		notification: {
			type: String,
			default: '',
		},
	},
	setup(): {}
	{
		return {
			Outline,
		};
	},
	computed: {
		idNotification(): boolean
		{
			let idNotificationNew = 'notification-tasks-button-copy';

			if (this.name)
			{
				idNotificationNew += `-${this.name}`;
			}

			if (this.value)
			{
				idNotificationNew += `-${this.value}`;
			}

			return idNotificationNew;
		},
		textNotificationSuccessDefault(): boolean
		{
			return this.loc('TASKS_BUTTON_COPY_NOTIFICATION_SUCCESS');
		},
		textNotificationSuccess(): boolean
		{
			return this.notification || this.textNotificationSuccessDefault;
		},
		textNotificationFail(): boolean
		{
			return this.loc('TASKS_BUTTON_COPY_NOTIFICATION_FAIL');
		},
	},
	methods: {
		copyValue(): void
		{
			if (!this.value)
			{
				Notifier.notifyViaBrowserProvider({
					id: this.idNotification,
					text: this.textNotificationFail,
				});

				return;
			}

			const isCopyingSuccess = BX.clipboard.copy(this.value);

			if (isCopyingSuccess)
			{
				Notifier.notifyViaBrowserProvider({
					id: this.idNotification,
					text: this.textNotificationSuccess,
				});
			}
		},
		handleClickButton(): void
		{
			this.copyValue();
		},
	},
	template: `
		<button class="tasks-button-copy" @click="handleClickButton">
			<span v-if="name" class="tasks-button-copy__text tasks-button-copy__text_name print-font-color-base-1">{{ name }}</span>
			<span v-if="value" class="tasks-button-copy__text tasks-button-copy__text_value print-font-color-base-1">{{ value }}</span>
			<BIcon class="tasks-button-copy__icon print-ignore" :name="Outline.COPY" />
		</button>
	`,
};
