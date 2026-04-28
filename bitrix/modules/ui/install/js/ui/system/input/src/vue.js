import { Chip, ChipDesign, ChipSize } from 'ui.system.chip.vue';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';
import 'ui.hint';

import { InputSize, InputDesign } from './const';
export { InputSize, InputDesign };

import './input.css';

// @vue/component
export const BInput = {
	name: 'BInput',
	components: {
		BIcon,
		Chip,
	},
	expose: ['focus'],
	props: {
		modelValue: {
			type: String,
			default: '',
		},
		rowsQuantity: {
			type: Number,
			default: 1,
		},
		resize: {
			type: String,
			default: 'both',
			validator: (value) => ['none', 'both', 'horizontal', 'vertical'].includes(value),
		},
		label: {
			type: String,
			default: '',
		},
		labelInline: {
			type: Boolean,
			default: false,
		},
		placeholder: {
			type: String,
			default: '',
		},
		error: {
			type: String,
			default: '',
		},
		size: {
			type: String,
			default: InputSize.Lg,
		},
		design: {
			type: String,
			default: InputDesign.Grey,
		},
		icon: {
			type: String,
			default: '',
		},
		/**
		 * @type ChipProps[]
		 */
		chips: {
			type: Array,
			default: null,
		},
		center: {
			type: Boolean,
			default: false,
		},
		withSearch: {
			type: Boolean,
			default: false,
		},
		withClear: {
			type: Boolean,
			default: false,
		},
		dropdown: {
			type: Boolean,
			default: false,
		},
		clickable: {
			type: Boolean,
			default: false,
		},
		stretched: {
			type: Boolean,
			default: false,
		},
		active: {
			type: Boolean,
			default: false,
		},
		readonly: {
			type: Boolean,
			default: false,
		},
		type: {
			type: String,
			default: 'text',
		},
		copyable: {
			type: Boolean,
			default: false,
		},
	},
	emits: [
		'update:modelValue',
		'click',
		'focus',
		'blur',
		'input',
		'clear',
		'chipClick',
		'chipClear',
	],
	setup(): Object
	{
		return {
			Outline,
			ChipDesign,
		};
	},
	data(): Object
	{
		return {
			focused: false,
			passwordVisible: false,
		};
	},
	computed: {
		value: {
			get(): string
			{
				return this.modelValue;
			},
			set(value: string): void
			{
				this.$emit('update:modelValue', value);
			},
		},
		disabled(): boolean
		{
			return this.design === InputDesign.Disabled;
		},
		chipSize(): string
		{
			return {
				[InputSize.Lg]: ChipSize.Md,
				[InputSize.Md]: ChipSize.Md,
				[InputSize.Sm]: ChipSize.Xs,
			}[this.size];
		},
		currentInputType(): string
		{
			if (this.type === 'password' && this.passwordVisible)
			{
				return 'text';
			}

			return this.type;
		},
		passwordToggleAriaLabel(): string
		{
			const key = this.passwordVisible
				? 'UI_SYSTEM_INPUT_HIDE_PASSWORD_ARIA'
				: 'UI_SYSTEM_INPUT_SHOW_PASSWORD_ARIA'
			;

			return this.$Bitrix.Loc.getMessage(key);
		},
	},
	mounted(): void
	{
		if (this.active && !this.clickable)
		{
			this.focus();
		}
	},
	methods: {
		focus(): void
		{
			this.$refs.input?.focus({ preventScroll: true });
		},
		handleClick(event: MouseEvent): void
		{
			if (!this.clickable)
			{
				this.$refs.input.focus();
			}

			this.$emit('click', event);
		},
		handleFocus(event: FocusEvent): void
		{
			if (this.clickable)
			{
				event.target.blur();

				return;
			}

			this.focused = true;
			this.$emit('focus', event);
		},
		handleBlur(event: FocusEvent): void
		{
			this.focused = false;
			this.$emit('blur', event);
		},
		togglePasswordVisibility(): void
		{
			this.passwordVisible = !this.passwordVisible;
		},
		handleCopy(): void
		{
			if (this.modelValue && navigator.clipboard && window.isSecureContext)
			{
				navigator.clipboard.writeText(this.modelValue);
			}

			const button = this.$refs.copyButton;
			if (button)
			{
				BX.UI.Hint.show(button, this.$Bitrix.Loc.getMessage('UI_SYSTEM_INPUT_COPIED'));
				setTimeout(() => {
					BX.UI.Hint.hide(button);
				}, 1500);
			}
		},
	},
	template: `
		<div
			class="ui-system-input"
			:class="[
				'--' + design,
				'--' + size,
				{
					'--center': center,
					'--with-chips': chips?.length > 0,
					'--clickable': clickable,
					'--stretched': stretched,
					'--active': active || focused,
					'--error': error && !disabled,
					'--readonly': readonly,
				},
			]">
			<div v-if="label" class="ui-system-input-label" :class="{ '--inline': labelInline }">{{ label }}</div>
			<div class="ui-system-input-container" ref="inputContainer" @click="handleClick">
				<div v-for="chip in chips" class="ui-system-input-chip">
					<Chip
						v-bind="chip"
						:design="disabled ? ChipDesign.Disabled : chip.design"
						:size="chipSize"
						@click="$emit('chipClick', chip)"
						@clear="$emit('chipClear', chip)"
					/>
				</div>
				<BIcon v-if="icon" class="ui-system-input-icon" :name="icon"/>
				<textarea
					v-if="rowsQuantity > 1"
					v-model="value"
					class="ui-system-input-value --multi"
					:style="{ resize }"
					:placeholder
					:disabled
					:rows="rowsQuantity"
					:readonly
					ref="input"
					@focus="handleFocus"
					@blur="handleBlur"
					@input="$emit('input', $event)"
				/>
				<input
					v-else
					v-model="value"
					class="ui-system-input-value"
					:style="{ '--placeholder-length': placeholder.length + 'ch' }"
					:placeholder
					:disabled
					:type="currentInputType"
					:readonly
					ref="input"
					@focus="handleFocus"
					@blur="handleBlur"
					@input="$emit('input', $event)"
				/>
				<button
					v-if="copyable"
					ref="copyButton"
					type="button"
					tabindex="0"
					class="ui-system-input-action-btn --ui-hoverable-overlay"
					:disabled="disabled"
					:aria-label="$Bitrix.Loc.getMessage('UI_SYSTEM_INPUT_COPY_TO_CLIPBOARD_ARIA')"
					@click.stop="handleCopy"
				>
					<BIcon :name="Outline.COPY"/>
				</button>
				<button
					v-if="type === 'password'"
					type="button"
					tabindex="0"
					class="ui-system-input-action-btn --ui-hoverable-overlay"
					:disabled="disabled"
					:aria-label="passwordToggleAriaLabel"
					@click.stop="togglePasswordVisibility"
				>
					<BIcon :name="passwordVisible ? Outline.CROSSED_EYE : Outline.OBSERVER"/>
				</button>
				<BIcon v-if="withSearch" class="ui-system-input-cross" :name="Outline.SEARCH"/>
				<BIcon v-if="withClear" class="ui-system-input-cross" :name="Outline.CROSS_L" @click.stop="$emit('clear')"/>
				<BIcon v-if="dropdown" class="ui-system-input-dropdown" :name="Outline.CHEVRON_DOWN_L"/>
			</div>
			<div v-if="error?.trim() && !disabled" class="ui-system-input-label --error" :title="error">{{ error }}</div>
		</div>
	`,
};

// @vue/component
export const PasswordField = {
	name: 'PasswordField',
	components: {
		BInput,
	},
	expose: ['focus'],
	props: {
		modelValue: {
			type: String,
			default: '',
		},
		label: {
			type: String,
			default: '',
		},
		placeholder: {
			type: String,
			default: '',
		},
		error: {
			type: String,
			default: '',
		},
		size: {
			type: String,
			default: InputSize.Lg,
		},
		design: {
			type: String,
			default: InputDesign.Grey,
		},
		copyable: {
			type: Boolean,
			default: false,
		},
		stretched: {
			type: Boolean,
			default: false,
		},
		active: {
			type: Boolean,
			default: false,
		},
		readonly: {
			type: Boolean,
			default: false,
		},
	},
	emits: [
		'update:modelValue',
		'focus',
		'blur',
		'input',
	],
	methods: {
		focus(): void
		{
			this.$refs.input?.focus();
		},
	},
	template: `
		<BInput
			ref="input"
			:modelValue="modelValue"
			@update:modelValue="$emit('update:modelValue', $event)"
			type="password"
			:label="label"
			:placeholder="placeholder"
			:error="error"
			:size="size"
			:design="design"
			:copyable="copyable"
			:stretched="stretched"
			:active="active"
			:readonly="readonly"
			@focus="$emit('focus', $event)"
			@blur="$emit('blur', $event)"
			@input="$emit('input', $event)"
		/>
	`,
};
