/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports, ui_notificationManager, ui_iconSet_api_vue) {
	'use strict';

	// @vue/component
	const TasksButtonCopy = {
		name: 'TasksButtonCopy',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			name: {
				type: String,
				default: ''
			},
			value: {
				type: String,
				default: ''
			},
			notification: {
				type: String,
				default: ''
			}
		},
		setup() {
			return {
				Outline: ui_iconSet_api_vue.Outline
			};
		},
		computed: {
			idNotification() {
				let idNotificationNew = 'notification-tasks-button-copy';
				if (this.name) {
					idNotificationNew += `-${this.name}`;
				}
				if (this.value) {
					idNotificationNew += `-${this.value}`;
				}
				return idNotificationNew;
			},
			textNotificationSuccessDefault() {
				return this.loc('TASKS_BUTTON_COPY_NOTIFICATION_SUCCESS');
			},
			textNotificationSuccess() {
				return this.notification || this.textNotificationSuccessDefault;
			},
			textNotificationFail() {
				return this.loc('TASKS_BUTTON_COPY_NOTIFICATION_FAIL');
			}
		},
		methods: {
			copyValue() {
				if (!this.value) {
					ui_notificationManager.Notifier.notifyViaBrowserProvider({
						id: this.idNotification,
						text: this.textNotificationFail
					});
					return;
				}
				const isCopyingSuccess = BX.clipboard.copy(this.value);
				if (isCopyingSuccess) {
					ui_notificationManager.Notifier.notifyViaBrowserProvider({
						id: this.idNotification,
						text: this.textNotificationSuccess
					});
				}
			},
			handleClickButton() {
				this.copyValue();
			}
		},
		template: `
		<button class="tasks-button-copy" @click="handleClickButton">
			<span v-if="name" class="tasks-button-copy__text tasks-button-copy__text_name print-font-color-base-1">{{ name }}</span>
			<span v-if="value" class="tasks-button-copy__text tasks-button-copy__text_value print-font-color-base-1">{{ value }}</span>
			<BIcon class="tasks-button-copy__icon print-ignore" :name="Outline.COPY" />
		</button>
	`
	};

	exports.TasksButtonCopy = TasksButtonCopy;

})(this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {}, BX.UI.NotificationManager, BX.UI.IconSet);
//# sourceMappingURL=tasks-button-copy.bundle.js.map
