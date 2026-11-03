// @vue/component
export const ReferenceHeader = {
	name: 'ReferenceHeader',
	props:
	{
		columns: {
			type: Array,
			required: true,
		},
	},
	template: `
		<div class="bx-im-settings-hotkey-reference__row" role="row">
			<span
				v-for="column in columns"
				:key="column"
				class="bx-im-settings-hotkey-reference__header"
				role="columnheader"
			>{{ column }}</span>
		</div>
	`,
};
