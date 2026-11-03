import { defineComponent } from 'ui.vue3';

import { CallButton } from 'call.component.ui.button';
import { CallIcon } from 'call.component.ui.icon';

import { useUiStore } from 'call.store';
import type { UiStoreInstance } from 'call.store';

import type { LocFunction } from 'call.plugin.loc';

export const CallFooterDocumentButton = defineComponent({
	name: 'CallFooterDocumentButton',
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
	emits: ['click'],
	computed: {
		disabled(): boolean
		{
			return this.uiStore.isButtonBlocked('document');
		},
	},
	methods: {
		handleClick(event: MouseEvent): void
		{
			this.$emit('click', event);
		},
	},
	template: /* HTML */`
		<CallButton
			test-id="call-footer-document-button"
			color="transparent"
			:size="38"
			:label="loc('CALL_FOOTER_DOCUMENT_BUTTON')"
			label-position="bottom"
			square
			:disabled="disabled"
			@click="handleClick"
		>
			<CallIcon icon="document" color="white" :size="28" />
		</CallButton>
	`,
});
