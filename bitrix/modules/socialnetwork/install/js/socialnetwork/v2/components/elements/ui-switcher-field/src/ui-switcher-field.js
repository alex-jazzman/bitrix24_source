import { defineComponent } from 'ui.vue3';
import { Switcher as UiSwitcher } from 'ui.vue3.components.switcher';
import { SwitcherSize, type SwitcherOptions } from 'ui.switcher';
import { TextXs, TextMd } from 'ui.system.typography.vue';

import { QuestionMark } from 'socialnetwork.v2.components.elements.question-mark';

import './ui-switcher-field.css';

export type HintOptions = {
	size?: number;
	maxWidth?: number;
}

// @vue/component
export const UiSwitcherField = defineComponent({
	name: 'UiSwitcherField',
	components: {
		QuestionMark,
		TextMd,
		TextXs,
		UiSwitcher,
	},
	props: {
		label: {
			type: String,
			default: '',
		},
		modelValue: {
			type: Boolean,
			default: false,
		},
		hint: {
			type: [String, null],
			default: null,
		},
		hintOptions: {
			type: Object,
			default: null,
		},
	},
	emits: ['update:modelValue', 'click'],
	computed: {
		switcherOptions(): SwitcherOptions
		{
			return {
				size: SwitcherSize.extraSmall,
				showStateTitle: false,
				useAirDesign: true,
			};
		},
		status(): string
		{
			return this.modelValue
				? this.loc('SONET_EXT_PROJECT_WIZARD_UI_SWITCHER_FIELD_ON')
				: this.loc('SONET_EXT_PROJECT_WIZARD_UI_SWITCHER_FIELD_OFF');
		},
	},
	methods: {
		onCheck(): void
		{
			this.$emit('update:modelValue', true);
		},
		onUncheck(): void
		{
			this.$emit('update:modelValue', false);
		},
		onKeyboardToggle(): void
		{
			this.$emit('update:modelValue', !this.modelValue);
			this.$emit('click');
		},
	},
	template: `
		<div class="sonet-elements-switcher-field">
			<div class="sonet-elements-switcher-field-toggle socialnetwork--project-wizard--ui-switcher-field--line">
				<div
					class="socialnetwork--project-wizard--ui-switcher-field--left-col"
					role="switch"
					tabindex="0"
					:aria-checked="modelValue ? 'true' : 'false'"
					:aria-label="label"
					@click="$emit('click')"
					@keydown.space.prevent="onKeyboardToggle"
					@keydown.enter.prevent="onKeyboardToggle"
				>
					<UiSwitcher
						:isChecked="modelValue"
						:options="switcherOptions"
						@check="onCheck"
						@uncheck="onUncheck"
					/>
				</div>
				<div class="sonet-elements-switcher-field-label_wrapper">
					<slot name="label" :label="label">
						<div class="sonet-elements-switcher-field-label">
							<TextMd class="sonet-elements-switcher-field-title">
								{{ label }}
							</TextMd>
						</div>
					</slot>
					<QuestionMark
						v-if="hint"
						:hintText="hint"
						:size="hintOptions?.size"
						:hintMaxWidth="hintOptions?.maxWidth"/>
				</div>
			</div>
			<div class="socialnetwork--project-wizard--ui-switcher-field--line">
				<div class="socialnetwork--project-wizard--ui-switcher-field--left-col"></div>
				<slot name="underline" :status="status">
					<TextXs class="socialnetwork--project-wizard--ui-switcher-field--description">
						{{ status }}
					</TextXs>
				</slot>
			</div>
		</div>
	`,
});
