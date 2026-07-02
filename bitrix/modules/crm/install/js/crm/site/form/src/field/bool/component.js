import * as Mixins from '../base/components/mixins';

const FieldBool = {
	mixins: [Mixins.MixinField],
	template: `	
		<div class="b24-form-control-container">
			<label @click.capture="$emit('input-click', $event)">
				<input type="checkbox" 
					:id="fieldId"
					:aria-required="ariaRequired"
					:aria-invalid="ariaInvalid"
					:aria-describedby="ariaDescribedby"
					v-model="field.item().selected"
					@blur="$emit('input-blur')"
					@focus="$emit('input-focus')"
					@keydown.enter.prevent
				>
				<span class="b24-form-control-desc">{{ field.label }}</span>
				<span v-show="field.required" class="b24-form-control-required" aria-hidden="true">*</span>
			</label>
			<field-item-alert v-bind:field="field"></field-item-alert>
		</div>
	`,
};

export {
	FieldBool,
};
