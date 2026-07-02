/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, main_core_events, main_core, ui_notification) {
	'use strict';

	class TodoNotificationSkip {
		#entityTypeId = null;
		#onSkippedPeriodChange = null;
		constructor(params) {
			this.#entityTypeId = params.entityTypeId;
			this.#onSkippedPeriodChange = params.onSkippedPeriodChange;
			this.#bindEvents();
		}
		#bindEvents() {
			main_core_events.EventEmitter.subscribe('onLocalStorageSet', this.#onExternalEvent.bind(this));
			main_core_events.EventEmitter.subscribe('BX.Crm.Activity.TodoNotification:SetSkipPeriod', this.#onSetSkipPeriod.bind(this));
		}
		#onExternalEvent(event) {
			const [data] = event.getData();
			if (data.key === 'BX.Crm.onCrmEntityTodoNotificationSkip') {
				const eventParams = data.value;
				if (eventParams.entityTypeId === this.#entityTypeId) {
					this.#onSkippedPeriodChangeCallback(eventParams.period);
				}
			}
		}
		#onSetSkipPeriod(event) {
			this.#onSkippedPeriodChangeCallback(event.getData().period);
		}
		#onSkippedPeriodChangeCallback(period) {
			if (main_core.Type.isFunction(this.#onSkippedPeriodChange)) {
				this.#onSkippedPeriodChange(period);
			}
		}
		saveSkippedPeriod(skippedPeriod) {
			BX.localStorage.set('BX.Crm.onCrmEntityTodoNotificationSkip', {
				entityTypeId: this.#entityTypeId,
				period: skippedPeriod
			}, 5);
			main_core_events.EventEmitter.emit('BX.Crm.Activity.TodoNotification:SetSkipPeriod', {
				entityTypeId: this.#entityTypeId,
				period: skippedPeriod
			});
			return main_core.ajax.runAction('crm.activity.todo.skipEntityDetailsNotification', {
				data: {
					entityTypeId: this.#entityTypeId,
					period: skippedPeriod
				}
			}).then(() => {
				return skippedPeriod;
			}).catch(response => {
				ui_notification.UI.Notification.Center.notify({
					content: response.errors.map(item => item.message).join(', '),
					autoHideDelay: 5000
				});
			});
		}
		showCancelPeriodNotification() {
			const self = this;
			ui_notification.UI.Notification.Center.notify({
				content: main_core.Loc.getMessage('CRM_ACTIVITY_TODO_NOTIFICATION_CANCELED_TEXT'),
				autoHideDelay: 3000,
				actions: [{
					title: main_core.Loc.getMessage('CRM_ACTIVITY_TODO_NOTIFICATION_CANCELED_BUTTON'),
					events: {
						click: function (event, balloon, action) {
							balloon.close();
							self.saveSkippedPeriod('');
						}
					}
				}]
			});
		}
	}

	exports.TodoNotificationSkip = TodoNotificationSkip;

})(this.BX.Crm.Activity = this.BX.Crm.Activity || {}, BX.Event, BX, BX);
//# sourceMappingURL=todo-notification-skip.bundle.js.map
