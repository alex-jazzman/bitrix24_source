import { BaseEvent } from 'main.core.events';
import { Type } from 'main.core';

const MAX_TEXT_LENGTH = 2000;

// @vue/component
export const ConstantTextarea = {
	name: 'ConstantTextarea',
	props: {
		item: {
			type: Object,
			required: true,
		},
		modelValue: {
			type: [String, Array],
			default: '',
		},
		labelledbyId: {
			type: String,
			default: '',
		},
		describedbyId: {
			type: String,
			default: '',
		},
		invalid: {
			type: Boolean,
			default: false,
		},
		required: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['update:modelValue'],
	computed:
		{
			multipleValues(): Array<string>
			{
				const model = this.modelValue;
				if (Type.isArray(model) && model.length > 0)
				{
					return model;
				}

				return [''];
			},
			maxTextLength(): number
			{
				return MAX_TEXT_LENGTH;
			},
			showRemoveIcon(): boolean
			{
				return this.item.multiple && this.multipleValues.length > 1;
			},
		},
	methods: {
		getCounterText(value: string): string
		{
			const length = (value || '').length;

			return `${length}/${this.maxTextLength}`;
		},
		onSingleInput(event: BaseEvent): void
		{
			let currentValue = event.target.value;
			if (currentValue.length > this.maxTextLength)
			{
				currentValue = currentValue.slice(0, this.maxTextLength);
				event.target.value = currentValue;
			}
			this.$emit('update:modelValue', currentValue);
		},
		onMultipleInput(event: BaseEvent, index: number): void
		{
			let currentValue = event.target.value;
			if (currentValue.length > this.maxTextLength)
			{
				currentValue = currentValue.slice(0, this.maxTextLength);
				event.target.value = currentValue;
			}
			const newValues = [...this.multipleValues];
			newValues[index] = currentValue;

			this.$emit('update:modelValue', newValues);
		},
		async addField(): void
		{
			if (!this.item.multiple)
			{
				return;
			}
			const newValues = [...this.multipleValues, ''];
			this.$emit('update:modelValue', newValues);

			await this.$nextTick();
			const fields = this.$refs.textareaFields;
			if (fields && fields.length > 0)
			{
				const lastField = fields[fields.length - 1];
				lastField.focus();
			}
		},
		async removeField(index: number): void
		{
			if (!this.showRemoveIcon)
			{
				return;
			}
			const newValues = [...this.multipleValues];
			newValues.splice(index, 1);
			this.$emit('update:modelValue', newValues);

			await this.$nextTick();
			const fields = this.$refs.textareaFields;
			if (fields && fields.length > 0)
			{
				const focusIndex = Math.max(0, index - 1);
				fields[focusIndex]?.focus();
			}
		},
	},
	template: `
		<div class="bizproc-setup-template__multiple-wrapper">
			<template v-if="!item.multiple">
				<div class="bizproc-setup-template__textarea-wrapper">
					<div class="ui-ctl ui-ctl-textarea ui-ctl-w100">
						<textarea
							class="ui-ctl-element"
							:value="modelValue"
							:maxlength="maxTextLength"
							:aria-labelledby="labelledbyId || null"
							:aria-describedby="describedbyId || null"
							:aria-invalid="invalid ? 'true' : null"
							:aria-required="required ? 'true' : null"
							@input="onSingleInput"
							data-test-id="bizproc-setup-template__form-textarea-single"
						></textarea>
					</div>
					<div class="bizproc-setup-template__char-counter">
						{{ getCounterText(modelValue) }}
					</div>
				</div>
			</template>
			<template v-else>
				<div
					v-for="(value, index) in multipleValues"
					:key="index"
					class="bizproc-setup-template__field-item"
				>
					<div class="bizproc-setup-template__textarea-wrapper">
						<div class="ui-ctl ui-ctl-textarea ui-ctl-w100">
							<textarea
								ref="textareaFields"
								class="ui-ctl-element"
								:value="value"
								:maxlength="maxTextLength"
								:aria-labelledby="labelledbyId || null"
								:aria-describedby="describedbyId || null"
								:aria-invalid="invalid ? 'true' : null"
								:aria-required="required ? 'true' : null"
								@input="onMultipleInput($event, index)"
								data-test-id="bizproc-setup-template__form-textarea-multiple"
							></textarea>
						</div>
						<div class="bizproc-setup-template__char-counter">
							{{ getCounterText(value) }}
						</div>
					</div>
					<span
						v-if="showRemoveIcon"
						role="button"
						tabindex="0"
						@click="removeField(index)"
						@keydown.enter.prevent="!$event.repeat && removeField(index)"
						@keydown.space.prevent="!$event.repeat && removeField(index)"
						:aria-label="$Bitrix.Loc.getMessage('BIZPROC_JS_AI_AGENTS_ACTIVATOR_FORM_REMOVE_FIELD')"
						data-test-id="bizproc-setup-template__form-textarea-delete-btn"
						class="bizproc-setup-template__field-remove"
					><i class="ui-icon-set --cross-m"></i></span>
				</div>
				<button
					@click="addField"
					class="bizproc-setup-template__add-btn"
					type="button"
					data-test-id="bizproc-setup-template__form-textarea-add-btn"
				>
					{{ $Bitrix.Loc.getMessage('BIZPROC_JS_AI_AGENTS_ACTIVATOR_FORM_ADD_FIELD') }}
				</button>
			</template>
		</div>
	`,
};
