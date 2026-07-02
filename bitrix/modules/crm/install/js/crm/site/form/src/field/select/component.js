import * as Mixins from '../base/components/mixins';

const FieldSelect = {
	mixins: [Mixins.MixinField],
	template: `
		<div class="field-item">
			<label class="b24-form-control-select-label" :for="fieldId">
				{{ field.label }} 
				<span v-show="field.required" class="b24-form-control-required" aria-hidden="true">*</span>
			</label>
			<div>
				<select 
					:id="fieldId"
					v-model="selected"
					v-bind:multiple="field.multiple"
					:aria-required="ariaRequired"
					:aria-invalid="ariaInvalid"
					:aria-describedby="ariaDescribedby"
					@blur="$emit('input-blur', this)"
					@focus="$emit('input-focus', this)"
				>
					<option v-for="item in field.items" 
						v-bind:value="item.value"																
					>
						{{ item.label }}
					</option>
				</select>
			</div>
			<field-item-image-slider v-bind:field="field"></field-item-image-slider>
			<field-item-alert v-bind:field="field"></field-item-alert>
		</div>
	`,
};

export {
	FieldSelect,
}