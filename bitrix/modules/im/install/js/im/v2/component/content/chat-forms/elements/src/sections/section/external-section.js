import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { HeadlineXs } from 'ui.system.typography.vue';

import 'ui.design-tokens.air';
import 'ui.icon-set.outline';

import { Feature, FeatureManager } from 'im.v2.lib.feature';

import './css/section.css';

const CHEVRON_SIZE = 24;

// @vue/component
export const CreateChatExternalSection = {
	name: 'CreateChatExternalSection',
	components: { BIcon, HeadlineXs },
	props:
	{
		name: {
			type: String,
			required: true,
		},
		title: {
			type: String,
			required: true,
		},
	},
	setup(): Object
	{
		return { Outline, CHEVRON_SIZE };
	},
	computed:
	{
		isAirDesignEnabled(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isAirDesignEnabled);
		},
		testId(): string
		{
			return `im-chat-form-section-${this.name}`;
		},
	},
	// The row keeps no state: the consumer listens for a click on the section itself, and the
	// header button lets the keyboard reach that listener through the click it raises.
	template: `
		<div
			:class="'--' + name"
			class="bx-im-content-create-chat__section bx-im-content-create-chat__section_scope --external"
			:data-testid="testId"
		>
			<button v-if="isAirDesignEnabled" type="button" class="bx-im-chat-forms-section__header">
				<span class="bx-im-chat-forms-section__title">
					<span class="bx-im-content-create-chat__section_icon"></span>
					<HeadlineXs tag="span">{{ title }}</HeadlineXs>
				</span>
				<BIcon
					class="bx-im-chat-forms-section__chevron"
					:name="Outline.CHEVRON_RIGHT_L"
					:size="CHEVRON_SIZE"
					color="var(--ui-color-base-4)"
				/>
			</button>
			<div v-else class="bx-im-content-create-chat__section_header">
				<div class="bx-im-content-create-chat__section_left">
					<div class="bx-im-content-create-chat__section_icon"></div>
					<div class="bx-im-content-create-chat__section_text">{{ title }}</div>
				</div>
				<div class="bx-im-content-create-chat__section_right"></div>
			</div>
		</div>
	`,
};
