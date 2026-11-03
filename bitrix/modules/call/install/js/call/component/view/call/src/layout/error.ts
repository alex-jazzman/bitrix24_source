import { defineComponent } from 'ui.vue3';

import { CallIcon } from 'call.component.ui.icon';
import type { LocFunction } from 'call.plugin.loc';

export const CallErrorLayout = defineComponent({
	name: 'CallErrorLayout',
	components: {
		CallIcon,
	},
	inject: {
		loc: { default: (): LocFunction => (key: string): string => key },
	},
	computed: {
		title(): string
		{
			return (this.loc as LocFunction)('CALL_VIEW_CALL_ERROR_TITLE');
		},
		message(): string
		{
			return (this.loc as LocFunction)('CALL_VIEW_CALL_ERROR_MESSAGE');
		},
	},
	template: /* HTML */`
		<div class="call-layout__error" data-testid="call-layout-error">
			<div class="call-layout__error-icon">
				<CallIcon icon="alert-accent" :size="48" color="red" />
			</div>
			<div class="call-layout__error-title">{{ title }}</div>
			<div class="call-layout__error-message">{{ message }}</div>
		</div>
	`,
});
