import 'ui.design-tokens.air';
import 'ui.forms';

import { Feature, FeatureManager } from 'im.v2.lib.feature';

import { CreateChatSection } from '../section/section';
import { RadioOption, type RadioOptionItem } from '../../elements/radio';
import { FieldRow } from '../../elements/field-row/field-row';

import './privacy-section.css';

// @vue/component
export const PrivacySection = {
	components: { CreateChatSection, RadioOption, FieldRow },
	props: {
		withSearchOption: {
			type: Boolean,
			default: true,
		},
		isAvailableInSearch: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['chatTypeChange'],
	computed:
	{
		isAirDesignEnabled(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isAirDesignEnabled);
		},
		sectionTitle(): string
		{
			return this.loc('IM_CREATE_CHAT_PRIVACY_SECTION_V2');
		},
		privacyOptions(): RadioOptionItem[]
		{
			return [
				{
					value: false,
					text: this.loc('IM_CREATE_CHAT_PRIVACY_SECTION_PRIVATE_TITLE'),
					subtext: this.loc('IM_CREATE_CHAT_PRIVACY_SECTION_PRIVATE_SUBTITLE_V2'),
					selected: !this.isAvailableInSearch,
				},
				{
					value: true,
					text: this.loc('IM_CREATE_CHAT_PRIVACY_SECTION_OPEN_TITLE'),
					subtext: this.loc('IM_CREATE_CHAT_PRIVACY_SECTION_OPEN_SUBTITLE_V2'),
					selected: this.isAvailableInSearch,
				},
			];
		},
	},
	methods:
	{
		onTypeChange(isAvailableInSearch: boolean)
		{
			this.$emit('chatTypeChange', isAvailableInSearch);
		},
		loc(phraseCode: string, replacements: {[p: string]: string} = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
	},
	// The section holds a single field, so in air it is a field and not an accordion: the caption
	// stays on the background of the form and the options get a card of their own. The group carries
	// the row ids itself, the way the chat type field of the settings section does.
	template: `
		<FieldRow
			v-if="isAirDesignEnabled"
			name="privacy-type"
			:label="sectionTitle"
			class="bx-im-chat-forms-privacy"
			v-slot="{ controlId, labelId }"
		>
			<RadioOption
				:id="controlId"
				:aria-labelledby="labelId"
				:items="privacyOptions"
				class="bx-im-chat-forms-privacy__options"
				name="privacy-type"
				@change="onTypeChange"
			/>
		</FieldRow>
		<CreateChatSection v-else name="privacy" :title="sectionTitle" alwaysOpened>
			<div class="bx-im-content-create-chat__section_block" data-testid="field-privacy-type">
				<RadioOption :items="privacyOptions" name="privacy-type" @change="onTypeChange" />
			</div>
		</CreateChatSection>
	`,
};
