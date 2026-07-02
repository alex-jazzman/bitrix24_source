import * as Mixins from '../base/components/mixins';

const FieldCheckbox = {
	mixins: [Mixins.MixinField],
	template: `
		<div class="b24-form-control-container">
			<fieldset :aria-describedby="ariaDescribedby">
				<legend class="b24-form-control-label">
					{{ field.label }} 
					<span v-show="field.required" class="b24-form-control-required" aria-hidden="true">*</span>
				</legend>

				<label class="b24-form-control"
					v-for="(item, index) in field.items"
					:class="{'b24-form-control-checked': item.selected}"
				>
					<input :type="field.type" 
						:id="fieldId + '-' + index"
						:value="item.value"
						:aria-required="ariaRequired"
						:aria-invalid="ariaInvalid"
						v-model="selected"
						@blur="$emit('input-blur')"
						@focus="$emit('input-focus')"
						@keydown.enter.prevent
					>
					<span class="b24-form-control-desc">{{ item.label }}</span>
				</label>
			</fieldset>
			<field-item-image-slider v-bind:field="field"></field-item-image-slider>
			<field-item-alert v-bind:field="field"></field-item-alert>
		</div>
	`,
};

export {
	FieldCheckbox,
}