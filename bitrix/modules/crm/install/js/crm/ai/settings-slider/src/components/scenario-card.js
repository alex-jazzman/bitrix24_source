import { NoticePopup } from 'crm.notice-popup';

import { getTopBX } from '../services/top-window';
import { formatScenarioSummary, getAvailabilityReasonText } from '../store/helpers';
import { ChannelModeSelect } from './channel-mode-select';

// @vue/component
export const ScenarioCard = {
	name: 'ScenarioCard',
	components: {
		ChannelModeSelect,
	},
	emits: ['toggle-expanded', 'select-channel-mode'],
	props: {
		scenario: {
			type: Object,
			required: true,
		},
		expanded: {
			type: Boolean,
			default: false,
		},
	},
	computed: {
		isReady(): boolean
		{
			return this.scenario.availability?.ready === true;
		},

		summary(): string
		{
			return formatScenarioSummary(this.scenario.channels ?? [], this.getMessage.bind(this));
		},

		disabledReason(): string
		{
			return getAvailabilityReasonText(
				this.scenario.availability?.reasonCode,
				this.getMessage.bind(this),
			);
		},

		action(): Object
		{
			return this.scenario.availability?.action ?? { type: 'none' };
		},

		hasAction(): boolean
		{
			return this.action.type === 'infoHelper'
				|| this.action.type === 'sidePanel'
				|| this.action.type === 'accessDenied'
			;
		},

		actionText(): string
		{
			if (this.action.type === 'infoHelper')
			{
				return this.getMessage('CRM_AI_AUTOMATION_SLIDER_PICK_PACKAGE_BUTTON');
			}

			if (this.scenario.availability?.reasonCode === 'global_disabled')
			{
				return this.getMessage('CRM_AI_AUTOMATION_SLIDER_ENABLE_BUTTON');
			}

			return this.getMessage('CRM_AI_AUTOMATION_SLIDER_CONFIGURE_BUTTON');
		},

		toggleText(): string
		{
			return this.expanded
				? this.getMessage('CRM_AI_AUTOMATION_SLIDER_COLLAPSE_BUTTON')
				: this.getMessage('CRM_AI_AUTOMATION_SLIDER_EDIT_BUTTON')
			;
		},
	},
	methods: {
		getMessage(messageKey, replacements = {}): string
		{
			return this.$Bitrix.Loc.getMessage(messageKey, replacements);
		},

		toggleExpanded(): void
		{
			this.$emit('toggle-expanded', this.scenario.code);
		},

		selectChannelMode(payload): void
		{
			this.$emit('select-channel-mode', {
				scenarioCode: this.scenario.code,
				channelCode: payload.channelCode,
				option: payload.option,
			});
		},

		handleAction(event): void
		{
			if (this.action.type === 'infoHelper')
			{
				getTopBX()?.UI?.InfoHelper?.show(this.action.code);
			}
			else if (this.action.type === 'sidePanel')
			{
				getTopBX()?.SidePanel?.Instance?.open(this.action.url);
			}
			else if (this.action.type === 'accessDenied')
			{
				NoticePopup.showAccessDenied(event.currentTarget);
			}
		},
	},
	// language=Vue
	template: `
		<article class="crm-ai-settings-slider__scenario-card">
			<div
				:class="[
					'crm-ai-settings-slider__scenario-card-copy',
					{ '--muted': !isReady },
				]"
			>
				<div class="crm-ai-settings-slider__scenario-card-title">{{ scenario.title }}</div>
				<div
					v-if="scenario.description"
					class="crm-ai-settings-slider__scenario-card-description"
				>
					{{ scenario.description }}
				</div>
			</div>
			<div
				v-if="isReady"
				class="crm-ai-settings-slider__scenario-card-meta"
			>
				<span v-if="summary" class="crm-ai-settings-slider__scenario-card-summary">{{ summary }}</span>
				<a
					href="#"
					class="crm-ai-settings-slider__scenario-card-action"
					@click.prevent="toggleExpanded"
				>{{ toggleText }}</a>
			</div>
			<div
				v-else
				class="crm-ai-settings-slider__scenario-card-meta"
			>
				<span
					v-if="disabledReason"
					class="crm-ai-settings-slider__scenario-card-reason"
				>{{ disabledReason }}</span>
				<a
					v-if="hasAction"
					href="#"
					class="crm-ai-settings-slider__scenario-card-action"
					@click.prevent="handleAction($event)"
				>{{ actionText }}</a>
			</div>
			<div
				v-if="isReady && expanded"
				class="crm-ai-settings-slider__scenario-card-channels"
			>
				<ChannelModeSelect
					v-for="channel in scenario.channels"
					:key="scenario.code + ':' + channel.code"
					:channel="channel"
					@change="selectChannelMode"
				/>
			</div>
		</article>
	`,
};
