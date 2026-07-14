import { BInput, InputSize, InputDesign, PasswordField } from 'ui.system.input.vue';
import { TextSm, Text2Xs } from 'ui.system.typography.vue';
import { Button as UiButton, AirButtonStyle, ButtonSize } from 'ui.vue3.components.button';
import { Loc } from 'main.core';

// @vue/component
export const PublicAccessPassword = {
	name: 'PublicAccessPassword',
	components: { BInput, TextSm, Text2Xs, PasswordField, UiButton },
	props: {
		isPassword: { type: Boolean, required: true },
		hasSavedPassword: { type: Boolean, default: false },
		password: { type: String, default: '' },
		isSaving: { type: Boolean, default: false },
	},
	emits: ['update:isPassword', 'update:password', 'save'],
	data()
	{
		return {
			isPasswordStubCleared: false,
		};
	},
	computed: {
		InputDesign: () => InputDesign,
		InputSize: () => InputSize,
		AirButtonStyle: () => AirButtonStyle,
		ButtonSize: () => ButtonSize,
		passwordPlaceholder: () => Loc.getMessage('DISK_SHARING_ACCESS_POPUP_PUBLIC_PASSWORD_PLACEHOLDER'),
		isSaveDisabled()
		{
			return this.isSaving || this.password.trim().length < 8;
		},
		showPasswordStub()
		{
			return this.hasSavedPassword && this.password.length === 0 && !this.isPasswordStubCleared;
		},
	},
	watch: {
		hasSavedPassword(next)
		{
			if (next)
			{
				this.isPasswordStubCleared = false;
			}
		},
		isPassword(next)
		{
			if (!next)
			{
				this.isPasswordStubCleared = false;
			}
		},
		isSaving(next, prev)
		{
			if (!prev || next || !this.hasSavedPassword || this.password.length > 0)
			{
				return;
			}

			this.isPasswordStubCleared = false;
		},
	},
	methods: {
		onToggle(event)
		{
			if (this.isSaving)
			{
				return;
			}

			this.$emit('update:isPassword', event.target.checked);
		},
		onPasswordChange(value)
		{
			this.isPasswordStubCleared = true;
			this.$emit('update:password', value);
		},
		onPasswordFocus()
		{
			this.isPasswordStubCleared = true;
		},
		onSave()
		{
			if (this.isSaveDisabled)
			{
				return;
			}

			this.$emit('save');
		},
	},
	template: `
		<div class="access-public-block__password-wrapper">
			<div class="ui-ctl ui-ctl-checkbox ui-ctl-xs access-public-block__password-checkbox">
				<input
					class="ui-ctl-element"
					type="checkbox"
					:checked="isPassword"
					:disabled="isSaving"
					@change="onToggle"
				>
				<TextSm
					tag="label"
					className="access-public-block__password-label"
				>
					${Loc.getMessage('DISK_SHARING_ACCESS_POPUP_PUBLIC_SET_PASSWORD')}
				</TextSm>
			</div>
			<div class="access-public-block__save-wrapper" v-if="isPassword">
				<div class="access-public-block__save-container">
					<div class="access-public-block__password-unput-wrapper">
						<span
							v-if="showPasswordStub"
							class="access-public-block__password-stub"
							aria-hidden="true"
						>
							••••••••
						</span>
						<PasswordField
							:modelValue="password"
							@update:modelValue="onPasswordChange"
							@focus="onPasswordFocus"
							type="password"
							:size="InputSize.Md"
							:design="InputDesign.Primary"
							:stretched="true"
							:disabled="isSaving"
							:placeholder="showPasswordStub ? '' : passwordPlaceholder"
						/>
					</div>
					<UiButton
						text="${Loc.getMessage('DISK_SHARING_ACCESS_POPUP_PUBLIC_PASSWORD_SAVE_BUTTON')}"
						:disabled="isSaveDisabled"
						:loading="isSaving"
						:size="ButtonSize.MEDIUM"
						:style="AirButtonStyle.OUTLINE_ACCENT_2"
						@click="onSave"
					/>
				</div>
				<Text2Xs
					tag="label"
					className="access-public-block__password-warning"
					v-if="password.length > 0"
				>
					${Loc.getMessage('DISK_SHARING_ACCESS_POPUP_PUBLIC_PASSWORD_LABEL')}
				</Text2Xs>
			</div>
		</div>
	`,
};
