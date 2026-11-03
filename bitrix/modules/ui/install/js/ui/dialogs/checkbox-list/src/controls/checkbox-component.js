import { Text } from 'main.core';

export const CheckboxComponent = {
	props: [
		'id',
		'title',
	],

	setup(): Object
	{
		// `dataId` is the consumer's id and lands in the input's `name`; the label needs an id that
		// is unique on the page, so it gets its own generated one.
		return {
			inputId: `ui-checkbox-list-footer-checkbox-${Text.getRandom().toLowerCase()}`,
		};
	},

	data(): Object
	{
		return {
			dataTitle: this.title,
			dataId: this.id,
			checked: false,
		};
	},

	methods: {
		// The checkbox itself is the single source of the state: v-model already reflects the native
		// toggle, so inverting `checked` on top of that turned a click on the box into a no-op.
		handleChange(): void
		{
			this.$emit('onToggled', this.checked);
		},
	},

	template: `
		<div class="ui-checkbox-list__footer-custom-element --checkbox">
			<input
				type="checkbox"
				data-testid="ui-checkbox-list-footer-checkbox"
				:id="inputId"
				:name="dataId"
				v-model="checked"
				@change="handleChange"
			>
			<label :for="inputId">{{ dataTitle }}</label>
		</div>
	`,
};
