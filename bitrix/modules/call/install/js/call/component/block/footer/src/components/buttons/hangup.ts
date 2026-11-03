import { defineComponent } from 'ui.vue3';

import { CallButton } from 'call.component.ui.button';
import { CallIcon } from 'call.component.ui.icon';

import { useUiStore } from 'call.store';
import type { UiStoreInstance } from 'call.store';

import type { LocFunction } from 'call.plugin.loc';

export const CallFooterHangupButton = defineComponent({
	name: 'CallFooterHangupButton',
	components: {
		CallButton,
		CallIcon,
	},
	inject: {
		loc: { default: (): LocFunction => (key: string): string => key },
	},
	setup(): { uiStore: UiStoreInstance }
	{
		return {
			uiStore: useUiStore(),
		};
	},
	emits: [],
	methods: {
		handleClick(): void
		{
			this.uiStore.hangup();
		},
	},
	template: /* HTML */`
		<CallButton
			test-id="call-footer-hangup-button"
			color="hangup"
			:size="38"
			:label="loc('CALL_FOOTER_HANGUP_BUTTON')"
			label-position="bottom"
			:style="{'--call-button-padding-x': '16px'}"
			@click="handleClick"
		>
			<CallIcon icon="hangup" color="white" :size="28" />
		</CallButton>
	`,
});
