import { defineComponent } from 'ui.vue3';
import { BIcon } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { resolveSectionIcon } from '../../lib/section-icon';

import './settings-block.css';

export const CrmSettingsHubSettingsBlock = defineComponent({
	name: 'CrmSettingsHubSettingsBlock',
	components: {
		BIcon,
	},
	props: {
		id: {
			type: String,
			required: true,
		},
		title: {
			type: String,
			required: true,
		},
		icon: {
			type: String,
			default: '',
		},
		visible: {
			type: Boolean,
			required: true,
		},
	},
	computed: {
		blockTitleId(): string
		{
			return `crm-settings-hub-settings-block-${this.id}-title`;
		},
		safeIcon(): string
		{
			return resolveSectionIcon(this.icon);
		},
	},
	template: `
		<section
			v-if="visible"
			class="crm-settings-hub-application__settings-block"
			:class="{ '--has-visible-settings': visible }"
			:data-testid="'crm-settings-hub-application-settings-block-' + id"
			role="region"
			:aria-labelledby="blockTitleId"
		>
			<header class="crm-settings-hub-application__settings-block-header">
				<BIcon
					v-if="icon"
					:name="safeIcon"
					class="crm-settings-hub-application__settings-block-icon"
				/>
				<h2
					:id="blockTitleId"
					class="crm-settings-hub-application__settings-block-title"
				>
					{{ title }}
				</h2>
			</header>
			<div
				class="crm-settings-hub-application__settings-block-content"
				:data-testid="'crm-settings-hub-application-settings-block-' + id + '-content'"
			>
				<slot />
			</div>
		</section>
	`,
});
