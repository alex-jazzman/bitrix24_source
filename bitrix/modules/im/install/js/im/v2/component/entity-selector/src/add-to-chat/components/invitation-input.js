import { Loc, type JsonObject, Validation } from 'main.core';
import { BIcon, Set as IconsSet } from 'ui.icon-set.api.vue';

import './invitation-input.css';

// @vue/component
export const ChatInvitationInput = {
	name: 'ChatInvitationInput',
	components: { BIcon },
	props: {
		modelValue: {
			type: String,
			default: '',
		},
	},
	emits: ['update:modelValue'],
	data(): JsonObject
	{
		return {
			wasBlurred: false,
		};
	},
	computed: {
		IconsSet: () => IconsSet,
		isValid(): boolean
		{
			return Validation.isEmail(this.modelValue);
		},
		hasError(): boolean
		{
			return this.wasBlurred && this.modelValue.length > 0 && !this.isValid;
		},
		warningLabelIcon(): {name: string, size: number} {
			return {
				name: IconsSet.WARNING,
				size: 18,
				color: '--ui-color-palette-red-60',
			};
		},
	},
	methods: {
		onInput()
		{
			this.$emit('update:modelValue', this.$refs['invitation-input'].value);
		},
		onBlur()
		{
			this.wasBlurred = true;
		},
		loc(phraseCode: string): string
		{
			return Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div class="bx-im-invitation-input__container">
			<input
				ref="invitation-input"
				:class="{ '--error': hasError }"
				type="text"
				:placeholder="loc('IM_ENTITY_SELECTOR_ADD_TO_CHAT_INVITE_INPUT_PLACEHOLDER')"
				:value="modelValue"
				@input="onInput"
				@blur="onBlur"
			/>
			<div v-if="hasError" class="bx-im-invitation-input__error">
				<BIcon :name="IconsSet.WARNING" class="bx-im-invitation-input__error-icon" />
				<span class="bx-im-invitation-input__error-text">
					{{ loc('INTRANET_INVITATION_INPUT_VALIDATION_MESSAGE') }}
				</span>
			</div>
		</div>
	`,
};
