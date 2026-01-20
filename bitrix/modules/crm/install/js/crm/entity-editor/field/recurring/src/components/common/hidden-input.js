export const HiddenInput = {
	props: {
		name: {
			type: String,
			required: true,
		},
		value: {
			type: [String, Number],
			required: true,
		},
		changeCallback: {
			type: Function,
			default: () => {},
		},
	},

	watch: {
		value(): void
		{
			void this.$nextTick(() => {
				this.changeCallback(this.$refs.input);
			});
		},
	},

	// language=Vue
	template: `
		<input ref="input" :name="name" :value="value" type="hidden">
	`,
};
