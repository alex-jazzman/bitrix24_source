import { InlinePlaceholderSelector as Selector, InlinePlaceholderSelectorMode } from 'crm.field.inline-placeholder-selector';
import { Event } from 'main.core';

export const InlinePlaceholderSelector = {
	props: {
		readOnly: {
			type: Boolean,
			required: true,
		},
		entityTypeIds: {
			type: Array,
			default: [
				BX.CrmEntityType.enumeration.contact,
				BX.CrmEntityType.enumeration.company,
			],
		},
		isMultipleSelector: {
			type: Boolean,
			default: false,
		},
		value: {
			type: String,
			default: '',
		},
		mode: {
			type: String,
			default: InlinePlaceholderSelectorMode.INPUT,
		},
	},

	emits: [
		'titlePatternChanged',
	],

	methods: {
		onChange(): void
		{
			this.$emit('titlePatternChanged', this.selector.getValue());
		},
	},

	created() {
		this.selector = null;
	},

	mounted() {
		this.selector = new Selector({
			target: this.$el,
			mode: this.mode,
			value: this.value,
			multiple: this.isMultipleSelector,
			entityTypeIds: this.entityTypeIds,
			isReadOnly: this.readOnly,
		});

		this.selector.show();

		if (!this.readOnly)
		{
			const input = this.selector.getInputElement();
			Event.bind(input, 'input', this.onChange);
		}
	},

	template: `
		<div class="crm-inline-placeholder-selector-component-wrapper">
		</div>
	`,
};
