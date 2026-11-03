import { Text, type JsonObject } from 'main.core';
import { BInput } from 'ui.system.input.vue';
import { Switcher } from 'ui.vue3.components.switcher';
import { AirSwitcherStyle, SwitcherSize, type SwitcherOptions } from 'ui.switcher';
import { TextMd } from 'ui.system.typography.vue';

import 'ui.design-tokens.air';
import 'ui.forms';

import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { Toggle, ToggleSize } from 'im.v2.component.elements.toggle';

import { CreateChatSection } from '../section/section';
import { CreateChatHeading } from '../../elements/heading';
import { FieldRow } from '../../elements/field-row/field-row';

import './conference-section.css';

// @vue/component
export const ConferenceSection = {
	components: { CreateChatSection, CreateChatHeading, FieldRow, Toggle, Switcher, BInput, TextMd },
	props: {
		passwordNeeded: {
			type: Boolean,
			required: true,
		},
		password: {
			type: String,
			required: true,
		},
	},
	emits: ['passwordNeededChange', 'passwordChange'],
	data(): JsonObject
	{
		return {
			captionId: `bx-im-chat-forms-conference-password-${Text.getRandom()}`,
		};
	},
	computed:
	{
		ToggleSize: () => ToggleSize,
		isAirDesignEnabled(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isAirDesignEnabled);
		},
		switcherOptions(): SwitcherOptions
		{
			return {
				size: SwitcherSize.medium,
				style: AirSwitcherStyle.SOLID,
				showStateTitle: false,
				useAirDesign: true,
			};
		},
		privacyLabel(): string
		{
			return this.loc('IM_CREATE_CHAT_CONFERENCE_SECTION_PRIVACY');
		},
		usePasswordLabel(): string
		{
			return this.loc('IM_CREATE_CHAT_CONFERENCE_SECTION_USE_PASSWORD');
		},
		passwordPlaceholder(): string
		{
			return this.loc('IM_CREATE_CHAT_CONFERENCE_SECTION_PASSWORD_PLACEHOLDER');
		},
		passwordAriaLabel(): string
		{
			return this.loc('IM_CREATE_CHAT_CONFERENCE_SECTION_PASSWORD_ARIA');
		},
	},
	methods:
	{
		onPasswordNeededChange(passwordNeeded: boolean)
		{
			this.$emit('passwordNeededChange', passwordNeeded);
		},
		onPasswordChange(event: Event)
		{
			this.$emit('passwordChange', event.target.value);
		},
		onPasswordNeededToggle()
		{
			this.onPasswordNeededChange(!this.passwordNeeded);
		},
		loc(phraseCode: string, replacements: {[p: string]: string} = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
	},
	// Both switcher events lead to the same handler because ui.switcher reports the state it left,
	// not the one it entered; role, state and keyboard toggling live on the wrapper around it.
	// The row label names the pair of controls, so the password field carries a name of its own.
	template: `
		<CreateChatSection name="conference" :title="loc('IM_CREATE_CHAT_CONFERENCE_SECTION')">
			<FieldRow
				v-if="isAirDesignEnabled"
				name="conference-privacy"
				:label="privacyLabel"
				v-slot="{ controlId }"
			>
				<div class="bx-im-chat-forms-conference__password-toggle">
					<div
						:id="controlId"
						class="bx-im-chat-forms-conference__switcher"
						role="switch"
						tabindex="0"
						data-testid="im-chat-form-conference-password-switcher"
						:aria-checked="passwordNeeded ? 'true' : 'false'"
						:aria-labelledby="captionId"
						@keydown.space.prevent="onPasswordNeededToggle"
						@keydown.enter.prevent="onPasswordNeededToggle"
					>
						<Switcher
							:isChecked="passwordNeeded"
							:options="switcherOptions"
							@check="onPasswordNeededToggle"
							@uncheck="onPasswordNeededToggle"
						/>
					</div>
					<TextMd
						tag="span"
						:id="captionId"
						className="bx-im-chat-forms-conference__caption"
						@click="onPasswordNeededToggle"
					>{{ usePasswordLabel }}</TextMd>
				</div>
				<BInput
					v-if="passwordNeeded"
					class="bx-im-chat-forms-conference__password-field"
					type="password"
					:modelValue="password"
					:placeholder="passwordPlaceholder"
					:ariaLabel="passwordAriaLabel"
					stretched
					data-testid="im-chat-form-conference-password"
					@input="onPasswordChange"
				/>
			</FieldRow>
			<div v-else class="bx-im-content-create-chat__section_block">
				<CreateChatHeading :text="privacyLabel" />
				<div @click="onPasswordNeededToggle" class="bx-im-chat-forms-chat-settings__type-select">
					<Toggle
						:size="ToggleSize.M"
						:isEnabled="passwordNeeded"
						data-testid="im-chat-form-conference-password-switcher"
					/>
					<div class="bx-im-chat-forms-chat-settings__type-select_label">
						{{ usePasswordLabel }}
					</div>
				</div>
				<div
					v-if="passwordNeeded"
					class="bx-im-chat-forms-chat-settings__password-container ui-ctl ui-ctl-textbox"
					data-testid="im-chat-form-conference-password"
				>
					<input
						type="text"
						class="bx-im-content-create-chat-conference__password-input ui-ctl-element"
						:value="password"
						:placeholder="passwordPlaceholder"
						@input="onPasswordChange"
					/>
				</div>
			</div>
		</CreateChatSection>
	`,
};
