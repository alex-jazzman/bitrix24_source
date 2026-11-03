import 'ui.forms';

import { Feature, FeatureManager } from 'im.v2.lib.feature';

import { CreateChatSection } from '../section/section';
import { TextareaInput } from '../../elements/textarea';
import { RadioOption, type RadioOptionItem } from '../../elements/radio';
import { CreateChatHeading } from '../../elements/heading';
import { AutoDelete } from '../../elements/auto-delete';
import { FieldRow } from '../../elements/field-row/field-row';

import './settings-section.css';

// @vue/component
export const SettingsSection = {
	components: { CreateChatSection, CreateChatHeading, TextareaInput, RadioOption, AutoDelete, FieldRow },
	props: {
		description: {
			type: String,
			required: true,
		},
		withSearchOption: {
			type: Boolean,
			default: true,
		},
		withAutoDeleteOption: {
			type: Boolean,
			default: true,
		},
		isAvailableInSearch: {
			type: Boolean,
			default: false,
		},
		autoDeleteDelay: {
			type: Number,
			default: 0,
		},
	},
	emits: ['chatTypeChange', 'descriptionChange', 'autoDeleteDelayChange'],
	computed:
	{
		isAirDesignEnabled(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isAirDesignEnabled);
		},
		chatTypeLabel(): string
		{
			return this.loc('IM_CREATE_CHAT_SETTINGS_SECTION_PRIVACY_MSGVER_1');
		},
		descriptionLabel(): string
		{
			return this.loc('IM_CREATE_CHAT_SETTINGS_SECTION_DESCRIPTION');
		},
		descriptionPlaceholder(): string
		{
			return this.loc('IM_CREATE_CHAT_SETTINGS_SECTION_DESCRIPTION_PLACEHOLDER_MSGVER_1');
		},
		privacyOptions(): RadioOptionItem[]
		{
			return [
				{
					value: false,
					text: this.loc('IM_CREATE_CHAT_SETTINGS_SECTION_PRIVATE_TITLE'),
					subtext: this.loc('IM_CREATE_CHAT_SETTINGS_SECTION_PRIVATE_SUBTITLE'),
					selected: !this.isAvailableInSearch,
				},
				{
					value: true,
					text: this.loc('IM_CREATE_CHAT_SETTINGS_SECTION_OPEN_TITLE'),
					subtext: this.loc('IM_CREATE_CHAT_SETTINGS_SECTION_OPEN_SUBTITLE'),
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
		onDescriptionChange(description: string)
		{
			this.$emit('descriptionChange', description);
		},
		onAutoDeleteDelayChange(delay: number)
		{
			this.$emit('autoDeleteDelayChange', delay);
		},
		loc(phraseCode: string, replacements: {[p: string]: string} = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
	},
	// In the air branch the field label belongs to FieldRow, so the block headings are gone.
	// The radio group carries the row ids itself; BInput inside TextareaInput keeps its control
	// private, so the description field is named by the same text through ariaLabel.
	template: `
		<CreateChatSection name="settings" :title="loc('IM_CREATE_CHAT_SETTINGS_SECTION')">
			<template v-if="isAirDesignEnabled">
				<FieldRow v-if="withSearchOption" name="chat-type" :label="chatTypeLabel" v-slot="{ controlId, labelId }">
					<RadioOption
						:id="controlId"
						:aria-labelledby="labelId"
						:items="privacyOptions"
						name="chat-type"
						@change="onTypeChange"
					/>
				</FieldRow>
				<FieldRow v-if="withAutoDeleteOption" name="auto-delete">
					<AutoDelete :initialDelay="autoDeleteDelay" @delayChange="onAutoDeleteDelayChange" />
				</FieldRow>
				<FieldRow name="description" :label="descriptionLabel">
					<TextareaInput
						:ariaLabel="descriptionLabel"
						:value="description"
						:placeholder="descriptionPlaceholder"
						@input="onDescriptionChange"
					/>
				</FieldRow>
			</template>
			<template v-else>
				<div
					v-if="withSearchOption"
					class="bx-im-content-create-chat__section_block"
					data-testid="field-chat-type"
				>
					<CreateChatHeading :text="chatTypeLabel" />
					<RadioOption :items="privacyOptions" name="chat-type" @change="onTypeChange" />
				</div>
				<AutoDelete
					v-if="withAutoDeleteOption"
					:initialDelay="autoDeleteDelay"
					@delayChange="onAutoDeleteDelayChange"
				/>
				<div class="bx-im-content-create-chat__section_block" data-testid="field-description">
					<CreateChatHeading :text="descriptionLabel" />
					<div class="bx-im-chat-forms-settings__description_container">
						<TextareaInput
							:value="description"
							:placeholder="descriptionPlaceholder"
							:rounded="false"
							@input="onDescriptionChange"
						/>
					</div>
				</div>
			</template>
		</CreateChatSection>
	`,
};
