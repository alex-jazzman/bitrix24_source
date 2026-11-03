import { Runtime, Type } from 'main.core';
import { type Component, type ComponentOptions, markRaw } from 'ui.vue3';

export const SEND_ERROR_ALERT_EXTENSION = 'ui.system.alert';

type SendErrorAlert = {
	readonly component: Component,
	readonly design: string,
};

type SendErrorStatus = 'loading' | 'ready' | 'fallback';

type SystemAlertExports = {
	AlertDesign?: { tintedAlert?: unknown },
	Vue?: { Alert?: unknown },
};

// The alert and its icon set weigh much more than the card needs, and only a refused message shows them
async function loadSendErrorAlert(): Promise<SendErrorAlert | null>
{
	try
	{
		const { AlertDesign, Vue } = await Runtime.loadExtension(SEND_ERROR_ALERT_EXTENSION) as SystemAlertExports;
		const alert = Vue?.Alert;
		const design = AlertDesign?.tintedAlert;
		if (!Type.isObject(alert) || !Type.isStringFilled(design))
		{
			return null;
		}

		return { component: markRaw(alert as Component), design };
	}
	catch
	{
		return null;
	}
}

// @vue/component
export const SendErrorComponent = {
	name: 'MailMessageViewSendError',
	props: {
		text: {
			type: String,
			required: true,
		},
	},
	data(): { status: SendErrorStatus, alert: SendErrorAlert | null }
	{
		return {
			status: 'loading',
			alert: null,
		};
	},
	created(): void
	{
		void this.loadAlert();
	},
	methods: {
		async loadAlert(): Promise<void>
		{
			const alert = await loadSendErrorAlert();
			this.alert = alert;
			this.status = alert ? 'ready' : 'fallback';
		},
	},
	template: `
		<component
			v-if="status === 'ready'"
			:is="alert.component"
			:design="alert.design"
		>{{ text }}</component>
		<div
			v-else-if="status === 'fallback'"
			class="ui-alert ui-alert-danger"
		>
			<span class="ui-alert-message">{{ text }}</span>
		</div>
	`,
} satisfies ComponentOptions;
