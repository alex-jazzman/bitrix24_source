import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { HeadlineXl } from 'ui.system.typography.vue';
import { AirButtonStyle, Button as UiButton, ButtonSize } from 'ui.vue3.components.button';
import { defineComponent } from 'ui.vue3';
import './editable-title.css';

export const EditableTitle = defineComponent({
	name: 'CrmCopilotCallAssessmentV2EditableTitle',
	components: {
		BIcon,
		HeadlineXl,
		UiButton,
	},
	props: {
		modelValue: {
			type: String,
			default: '',
		},
		isEditable: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['update:modelValue'],
	setup(): Object
	{
		return {
			Outline,
			AirButtonStyle,
			ButtonSize,
		};
	},
	data(): { isEditing: boolean, draft: string }
	{
		return {
			isEditing: false,
			draft: '',
		};
	},
	watch: {
		isEditable(value: boolean): void
		{
			if (!value)
			{
				this.isEditing = false;
			}
		},
	},
	methods: {
		startEdit(): void
		{
			this.draft = this.modelValue;
			this.isEditing = true;
			void this.$nextTick(() => {
				const input = this.$refs.input as HTMLInputElement | undefined;
				if (!input)
				{
					return;
				}
				input.focus();
				const length = input.value.length;
				input.setSelectionRange(length, length);
			});
		},
		finishEdit(): void
		{
			if (!this.isEditing)
			{
				return;
			}
			const trimmed = this.draft.trim();
			if (trimmed !== '' && trimmed !== this.modelValue)
			{
				this.$emit('update:modelValue', trimmed);
			}
			this.isEditing = false;
		},
		cancelEdit(): void
		{
			this.isEditing = false;
		},
		handleKeydown(event: KeyboardEvent): void
		{
			if (event.key === 'Enter')
			{
				event.preventDefault();
				this.finishEdit();
			}
			else if (event.key === 'Escape')
			{
				event.preventDefault();
				this.cancelEdit();
			}
		},
	},
	template: `
		<div class="crm-call-assessment-v2-editable-title">
			<div v-if="isEditing" class="crm-call-assessment-v2-editable-title__edit">
				<input
					ref="input"
					type="text"
					class="crm-call-assessment-v2-editable-title__input"
					v-model="draft"
					@keydown="handleKeydown"
				/>
				<UiButton
					class="crm-call-assessment-v2-editable-title__button"
					:size="ButtonSize.EXTRA_SMALL"
					:style="AirButtonStyle.FILLED"
					:leftIcon="Outline.CHECK_M"
					@click="finishEdit"
				/>
				<UiButton
					class="crm-call-assessment-v2-editable-title__button"
					:size="ButtonSize.EXTRA_SMALL"
					:style="AirButtonStyle.OUTLINE_NO_ACCENT"
					:leftIcon="Outline.CROSS_M"
					@click="cancelEdit"
				/>
			</div>
			<template v-else>
				<HeadlineXl class="crm-call-assessment-v2-editable-title__text" tag="h1">
					{{ modelValue }}
				</HeadlineXl>
				<button
					v-if="isEditable"
					type="button"
					class="crm-call-assessment-v2-editable-title__pencil"
					:aria-label="loc('CRM_CALL_ASSESSMENT_V2_EDITABLE_TITLE_EDIT')"
					@click="startEdit"
				>
					<BIcon :name="Outline.EDIT_M" :size="20"/>
				</button>
			</template>
		</div>
	`,
});
