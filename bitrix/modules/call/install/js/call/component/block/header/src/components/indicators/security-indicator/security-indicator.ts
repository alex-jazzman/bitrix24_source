import { defineComponent } from 'ui.vue3';

import { CallIcon } from 'call.component.ui.icon';
import { CallTooltip } from 'call.component.ui.tooltip';

import type { LocFunction } from 'call.plugin.loc';

import './css/security-indicator.css';

export const CallHeaderSecurityIndicator = defineComponent({
	name: 'CallHeaderSecurityIndicator',
	components: {
		CallIcon,
		CallTooltip,
	},
	inject: {
		loc: { default: (): LocFunction => (key: string): string => key },
	},
	template: /* HTML */`
		<CallTooltip
			test-id="call-header-security-indicator"
			:value="loc('CALL_SECURITY_INDICATOR_SECURE_DESC')"
			position="bottom"
			tooltip-class="call-header-security-indicator__tooltip"
			class="call-header-security-indicator"
		>
			<CallIcon icon="shield-checked" color="green" :size="20"/>
			<div class="call-header-security-indicator__text">{{ loc('CALL_SECURITY_INDICATOR_SECURE') }}</div>
		</CallTooltip>
	`,
});
