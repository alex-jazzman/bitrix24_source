import { Text, Type } from 'main.core';
import { Alert, AlertColor, AlertIcon } from 'ui.alerts';
import { mapState } from 'ui.vue3.vuex';
import type { AlertState } from '../model/application-model';

// @vue/component
export const EditorAlert = {
	name: 'EditorAlert',
	alertInstance: null,
	data(): Object
	{
		return {
			isAlertRendered: false,
		};
	},
	computed: {
		...mapState({
			/** @type AlertState */
			alert: (state) => state.application.alert,
		}),
		isAlertShown(): boolean
		{
			return Type.isStringFilled(this.alert?.error);
		},
	},
	watch: {
		alert(newAlert: AlertState, oldAlert: AlertState): void
		{
			if (!Type.isStringFilled(newAlert?.error))
			{
				this.alertInstance?.hide();
				this.isAlertRendered = false;

				return;
			}

			if (!this.alertInstance)
			{
				this.alertInstance = new Alert({
					color: AlertColor.DANGER,
					icon: AlertIcon.DANGER,
					// closeBtn: true,
					animated: false,
				});

				// Event.bind(this.alertInstance.getCloseBtn(), 'click', () => {
				// 	this.$store.dispatch('application/resetAlert');
				// });
			}

			if (newAlert.error !== oldAlert.error)
			{
				this.alertInstance.setText(Text.encode(newAlert.error));
			}

			if (!this.isAlertRendered)
			{
				this.alertInstance.show();
				this.alertInstance.renderTo(this.$el);
				this.isAlertRendered = true;
			}
		},
	},
	beforeUnmount(): any
	{
		this.alertInstance?.destroy();
	},
	template: `
		<div class="crm-messagesender-editor__alert" data-test-role="alert" :style="{
			marginTop: isAlertShown ? 'var(--ui-space-stack-xs2)' : null,
		}"></div>
	`,
};
