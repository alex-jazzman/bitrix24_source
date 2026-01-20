import { RagAppComponent } from 'bizproc.rag-selector';

// @vue/component
export const ConstantKnowledge = {
	name: 'ConstantKnowledge',
	components: {
		RagAppComponent,
	},
	props: {
		/** @type ConstantItem */
		item: {
			type: Object,
			required: true,
		},
		modelValue: {
			type: [Array, String],
			default: () => [],
		},
		isRequired: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['update:modelValue'],
	computed: {
		value: {
			get(): string | Array<string>
			{
				return this.modelValue;
			},
			set(newValue: string | Array<string>): void
			{
				this.$emit('update:modelValue', newValue);
			},
		},
		showDescription(): boolean
		{
			return this.item.description && this.item.description.length > 0;
		},
	},
	template: `
		<div class="ui-form-row" data-test-id="bizproc-setup-template__form-knowledge">
			<div class="bizproc-setup-template__knowledge-title">
				{{ item.name }}
			</div>
			<div v-if="showDescription" class="bizproc-setup-template__text">
				{{ item.description }}
			</div>
			<RagAppComponent
				v-model="value"
				:isMultiple="item.multiple"
				:isRequired="isRequired"
			/>
		</div>
	`,
};
