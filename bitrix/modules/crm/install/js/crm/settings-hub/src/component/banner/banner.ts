import { defineComponent } from 'ui.vue3';
import { BIcon } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';
import { TextSm } from 'ui.system.typography.vue';

import './banner.css';

// Explanatory banner at the top of a hub card: says what turning the settings below on will do.
// Informational by default; the warning tone adds an alert icon and the orange frame.
export const CrmHubBanner = defineComponent({
	name: 'CrmHubBanner',
	components: { BIcon, TextSm },
	props: {
		tone: {
			type: String,
			default: 'info',
		},
		testId: {
			type: String,
			default: '',
		},
	},
	computed: {
		isWarning(): boolean
		{
			return this.tone === 'warning';
		},
	},
	template: `
		<div
			class="crm-settings-hub-banner"
			:class="{ '--warning': isWarning }"
			:data-testid="testId || null"
		>
			<BIcon v-if="isWarning" class="crm-settings-hub-banner__icon" name="o-alert-accent" :size="18"/>
			<TextSm><slot/></TextSm>
		</div>
	`,
});
