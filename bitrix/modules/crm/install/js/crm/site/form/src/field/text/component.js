import * as ComponentString from '../string/component';

const FieldText = {
	mixins: [ComponentString.MixinString],
	template: `
		<div class="b24-form-control-container b24-form-control-icon-after">
			<textarea class="b24-form-control"
				:id="fieldId"
				:class="inputClasses"
				:aria-required="ariaRequired"
				:aria-invalid="ariaInvalid"
				:aria-describedby="ariaDescribedby"
				v-model="value"
				@blur="$emit('input-blur', this)"
				@focus="$emit('input-focus', this)"
			></textarea>
			<label class="b24-form-control-label" :for="fieldId">
				{{ label }} 
				<span v-show="field.required" class="b24-form-control-required" aria-hidden="true">*</span>			
			</label>
			<div class="b24-form-icon-after b24-form-icon-remove"
				:title="field.messages.get('fieldRemove')"
				:aria-label="field.messages.get('fieldRemove')"
				role="button"
				tabindex="0"
				v-if="itemIndex > 0"
				@click="deleteItem"
				@keydown.enter="deleteItem"
				@keydown.space.prevent="deleteItem"
			></div>
			<field-item-alert
				v-bind:field="field"
				v-bind:item="item"
				v-bind:itemIndex="itemIndex"
			></field-item-alert>
		</div>
	`
};

export {
	FieldText
}