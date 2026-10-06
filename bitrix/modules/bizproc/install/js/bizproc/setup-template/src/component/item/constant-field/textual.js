import { Type } from 'main.core';
import { BaseEvent } from 'main.core.events';

// @vue/component
export const ConstantTextual = {
	name: 'ConstantTextual',
	props: {
		/** @type ConstantItem */
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
		multipleValues(): Array<string | null>
		{
			const model = this.modelValue;

			return Type.isArray(model) && model.length > 0 ? model : [''];
		},
		showRemoveIcon(): boolean
		{
			return this.item.multiple && this.multipleValues.length > 1;
		},
	},
	methods: {
		updateConstant(newValue: string): void
		{
			this.$emit('update:modelValue', newValue);
		},
		updateSingleValue(event: BaseEvent): void
		{
			this.updateConstant(event.target.value);
		},
		updateValueAtIndex(index, event: BaseEvent): void
		{
			const newValues = [...this.multipleValues];
			newValues[index] = event.target.value;
			this.updateConstant(newValues);
		},
		async addField(): void
		{
			const newValues = [...this.multipleValues, ''];
			this.updateConstant(newValues);

			await this.$nextTick();
			const inputs = this.$refs.inputFields;
			if (inputs && inputs.length > 0)
			{
				const lastInput = inputs[inputs.length - 1];
				lastInput.focus();
			}
		},
		async removeField(index): void
		{
			const newValues = [...this.multipleValues];
			newValues.splice(index, 1);
			this.updateConstant(newValues);

			await this.$nextTick();
			const inputs = this.$refs.inputFields;
			if (inputs && inputs.length > 0)
			{
				const focusIndex = Math.max(0, index - 1);
				inputs[focusIndex]?.focus();
			}
		},
	},
	template: `
		<div>
			<template v-if="item.multiple">
				<div v-for="(val, index) in multipleValues" :key="index" class="bizproc-setup-template__field-item">
					<div class="ui-ctl ui-ctl-textbox ui-ctl-w100">
						<input
							ref="inputFields"
							:value="val"
							type="text"
							class="ui-ctl-element"
							:aria-labelledby="labelledbyId || null"
							:aria-describedby="describedbyId || null"
							:aria-invalid="invalid ? 'true' : null"
							:aria-required="required ? 'true' : null"
							@input="updateValueAtIndex(index, $event)"
							data-test-id="bizproc-setup-template__form-text-multiple"
						>
					</div>
					<span
						v-if="showRemoveIcon"
						role="button"
						tabindex="0"
						@click="removeField(index)"
						@keydown.enter.prevent="!$event.repeat && removeField(index)"
						@keydown.space.prevent="!$event.repeat && removeField(index)"
						:aria-label="$Bitrix.Loc.getMessage('BIZPROC_JS_AI_AGENTS_ACTIVATOR_FORM_REMOVE_FIELD')"
						data-test-id="bizproc-setup-template__form-text-delete-btn"
						class="bizproc-setup-template__field-remove"
					><i class="ui-icon-set --cross-m"></i></span>
				</div>
				<button
					@click="addField"
					class="bizproc-setup-template__add-btn"
					type="button"
					data-test-id="bizproc-setup-template__form-text-add-btn"
				>
					{{ $Bitrix.Loc.getMessage('BIZPROC_JS_AI_AGENTS_ACTIVATOR_FORM_ADD_FIELD') }}
				</button>
			</template>
			<template v-else>
				<div class="ui-ctl ui-ctl-textbox ui-ctl-w100">
					<input
						:value="modelValue"
						type="text"
						class="ui-ctl-element"
						:aria-labelledby="labelledbyId || null"
						:aria-describedby="describedbyId || null"
						:aria-invalid="invalid ? 'true' : null"
						:aria-required="required ? 'true' : null"
						@input="updateSingleValue"
						data-test-id="bizproc-setup-template__form-text-single"
					>
				</div>
			</template>
		</div>
	`,
};
